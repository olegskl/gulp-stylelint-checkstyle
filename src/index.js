import fsp from 'fs-promise';
import path from 'path';
import mkdirp from 'mkdirp-promise';
import process from 'process';
import postcss from 'postcss';
import stylelint from 'stylelint';
import checkstyleFormatter from 'checkstyle-formatter';
import gulpUtil from 'gulp-util';
import through from 'through2';

/**
 * Name of this plugin for reporting purposes.
 * @type {String}
 */
const pluginName = 'gulp-stylelint-checkstyle';

//
// Console reporter
// --------------------

/**
 * Logs an issue to the console.
 * @param  {Object}    message Stylelint message.
 * @return {undefined}         Nothing is returned.
 */
function consoleMessageReporter(message) {
  const errorCoords = gulpUtil.colors.gray(`${message.line}:${message.column}`);
  const errorNotice = message.severity === 'error' ?
    gulpUtil.colors.red('error') :
    gulpUtil.colors.yellow('warning');

  gulpUtil.log(`${errorCoords} ${errorNotice} ${message.text}`);
}

/**
 * Logs a Stylelint result source and all its messages.
 * @param  {Object}    result Stylelint result.
 * @return {undefined}        Nothing is returned.
 */
function consoleResultReporter(result) {
  gulpUtil.log(gulpUtil.colors.underline(result.opts.from));
  result.messages
    .filter(message => message.plugin === 'stylelint')
    .forEach(consoleMessageReporter);
}

/**
 * Takes a list of Stylelint results and outputs them to the console.
 * @param  {Array<Object>} resultList Stylelint result list.
 * @return {Array<Object>}            Stylelint result list.
 */
function consoleResultListReporter(resultList) {
  resultList
    .filter(result => result.messages.length > 0)
    .forEach(consoleResultReporter);
  return resultList;
}

//
// Checkstyle reporter
// --------------------

/**
 * Adapts a Stylelint message to Checkstyle format.
 * @param  {Object} message Stylelint message.
 * @return {Object}         Checkstyle message.
 */
function stylelintToCheckstyleMessageAdapter(message) {
  return {
    line: message.line,
    column: message.column,
    severity: message.severity,
    message: message.text
  };
}

/**
 * Takes Stylelint messages and adapts them to Checkstyle format.
 * @param  {Array<Object>} messageList List of messages in Stylelint format.
 * @return {Array<Object>}             List of messages in Checkstyle format.
 */
function stylelintToCheckstyleMessageListAdapter(messageList) {
  return messageList
    .filter(message => message.plugin === 'stylelint')
    .map(stylelintToCheckstyleMessageAdapter);
}

/**
 * Adapts a Stylelint processed file result to Checkstyle format.
 * @param  {Object} result Stylelint result.
 * @return {Object}        Checkstyle result.
 */
function stylelineToCheckstyleResultAdapter(result) {
  return {
    filename: result.opts.from,
    messages: stylelintToCheckstyleMessageListAdapter(result.messages)
  };
}

/**
 * Takes Stylelint results (with messages) and adapts them to Checkstyle format.
 * @param  {Array<Object>} resultList List of results in Stylelint format.
 * @return {Array<Object>}            List of results in Checkstyle format.
 */
function stylelintToCheckstyleResultListAdapter(resultList) {
  return resultList
    .filter(result => result.messages.length > 0)
    .map(stylelineToCheckstyleResultAdapter);
}

//
// Fail-after-all-errors reporter
// --------------------

/**
 * Takes Stylelint results (with messages) and adapts them to Checkstyle format.
 * @param  {Array<Object>} resultList List of results in Stylelint format.
 * @return {Number}                   Count of issues (errors and warnings).
 */
function countIssuesInResultList(resultList) {
  return resultList.reduce((resultMemo, result) => resultMemo + result.messages.length, 0);
}

/**
 * Takes Stylelint results (with messages) and adapts them to Checkstyle format.
 * @param  {Array<Object>} resultList List of results in Stylelint format.
 * @throws {Error}                    An error is thrown if linting issues have been detected.
 * @return {undefined}                Nothing is returned.
 */
function failAfterAllErrorsReporter(resultList) {
  const errorCount = countIssuesInResultList(resultList);
  if (errorCount > 0) {
    const errorNotice = errorCount === 1 ? 'issue has' : 'issues have';
    throw new Error(`${errorCount} linting ${errorNotice} been found.`);
  }
}

/**
 * Stylelint-to-Checkstyle result transformer stream.
 * @param  {Object} [options] Optional options object.
 * @return {Stream}           Event stream.
 */
export default function gulpStylelintCheckstyle(options = {}) {
  const promiseList = [];
  const cwd = process.cwd();
  const outputFile = path.resolve(cwd, options.output || 'checkstyle.xml');
  const outputDir = path.dirname(outputFile);
  const postcssProcessor = postcss([stylelint(options.stylelint)]);

  /**
   * Writes the Checkstyle report to a file.
   * @param  {String}  xmlString Checkstyle report.
   * @return {Promise}           Resolved if file has been successfully written.
  */
  function outputWriter(xmlString) {
    return mkdirp(outputDir)
      .then(() => fsp.writeFile(outputFile, xmlString));
  }

  /**
   * Reports Stylelint results in Checkstyle format.
   * @param  {Array<Object>} results List of results in Stylelint format.
   * @return {Promise}               Resolved when report has been written to file system.
   */
  function checkstyleReporter(results) {
    return Promise.resolve(results)
      .then(stylelintToCheckstyleResultListAdapter)
      .then(checkstyleFormatter)
      .then(outputWriter);
  }

  /**
   * Launches processing of a given file and adds it to the promise list.
   *
   * Note that the files are not modified and are pushed
   * back to their pipes to allow usage of other plugins.
   *
   * @param  {File}      file      Piped file.
   * @param  {String}    encoding  File encoding.
   * @param  {Function}  done      Done callback.
   * @return {undefined}           Nothing is returned (done callback is used instead).
   */
  function onFile(file, encoding, done) {

    if (file.isNull()) {
      return done(null, file);
    }

    if (file.isStream()) {
      return done(new gulpUtil.PluginError(pluginName, 'Streaming not supported'));
    }

    const fileContents = file.contents.toString();
    const promise = postcssProcessor.process(fileContents, {from: file.path});

    promiseList.push(promise);

    done(null, file);
  }

  /**
   * Provides Stylelint results to reporters and awaits their response.
   * @param  {Array<Object>} results List of results in Stylelint format.
   * @return {Promise}               Accumulated result of reporters execution.
   */
  function provideResultsToReporters(results) {
    const reporters = [checkstyleReporter];

    if (options.reportToConsole) {
      reporters.push(consoleResultListReporter);
    }

    if (options.failAfterAllErrors) {
      reporters.push(failAfterAllErrorsReporter);
    }

    return Promise.all(reporters.map(reporter => reporter(results)));
  }

  /**
   * Resolves accumulated promises and writes report to file system.
   * @param  {Function}  done Done callback.
   * @return {undefined}      Nothing is returned (done callback is used instead).
   */
  function onStreamEnd(done) {
    Promise
      .all(promiseList)
      .then(provideResultsToReporters)
      .then(() => done())
      .catch(error => {
        // For some reason we need to wrap `emit` in a try-catch block
        // because it immediately throws the given error and the `done`
        // callback is never called as a result.
        try {
          this.emit('error', new gulpUtil.PluginError(pluginName, error));
        } catch (e) {
          // ¯\_(シ)_/¯
        }
        done();
      });
  }

  return through.obj(onFile, onStreamEnd);
}

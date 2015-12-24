# gulp-stylelint-checkstyle

[![Build Status](https://travis-ci.org/olegskl/gulp-stylelint-checkstyle.svg?branch=master)](https://travis-ci.org/olegskl/gulp-stylelint-checkstyle)
[![Code Climate](https://codeclimate.com/github/olegskl/gulp-stylelint-checkstyle/badges/gpa.svg)](https://codeclimate.com/github/olegskl/gulp-stylelint-checkstyle)

A [Gulp](http://gulpjs.com/) plugin that generates a [checkstyle](https://github.com/checkstyle/checkstyle) report from [stylelint](https://github.com/stylelint/stylelint) results.

## Deprecated

Use [gulp-stylelint](https://github.com/olegskl/gulp-stylelint) with [gulp-stylelint-checkstyle-reporter](https://github.com/olegskl/gulp-stylelint-checkstyle-reporter) instead.

## Installation

```bash
npm install gulp-stylelint-checkstyle --save-dev
```

## Quick start

With gulp-stylelint-checkstyle, it's easy to start generate a CSS lint report for Jenkins checkstyle plugin.

If you already have a .stylelintrc file in your project directory:

```js
gulp.task('lint-css', function lintCssTask() {
  return gulp
    .src('src/**/*.css')
    .pipe(gulpStylelintCheckstyle({
      output: 'reports/lint/lint-css.xml'
    }));
});
```

## Options

Below is an example with all available options provided:

```js
gulp.task('lint-css', function lintCssTask() {
  return gulp
    .src('src/**/*.css')
    .pipe(gulpStylelintCheckstyle({
      stylelint: {
        extends: 'stylelint-config-suitcss'
      },
      output: 'reports/lint/lint-css.xml',
      reportToConsole: true,
      failAfterAllErrors: true
    }));
});
```

#### `stylelint` (Object)

See [stylelint configuration](https://github.com/stylelint/stylelint/blob/master/docs/user-guide/configuration.md) options.

#### `output` (String) default: "./checkstyle.xml"

Relative or absolute path to the report output file, e.g. "reports/lint/lint-css.xml"

#### `reportToConsole` (Boolean) default: `false`

Setting this option to `true` will report all issues to the console as well (the checkstyle report file will still be written).

#### `failAfterAllErrors` (Boolean) default: `false`

Setting this option to `true` will wait for all reporters to finish and then terminate the process with an error code 1 if linting issues (errors or warnings) have been found.

## License

http://opensource.org/licenses/mit-license.html

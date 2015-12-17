# gulp-stylelint-checkstyle

[![Build Status](https://travis-ci.org/olegskl/gulp-stylelint-checkstyle.svg?branch=master)](https://travis-ci.org/olegskl/gulp-stylelint-checkstyle)
[![Code Climate](https://codeclimate.com/github/olegskl/gulp-stylelint-checkstyle/badges/gpa.svg)](https://codeclimate.com/github/olegskl/gulp-stylelint-checkstyle)

A [Gulp](http://gulpjs.com/) plugin that generates a [checkstyle](https://github.com/checkstyle/checkstyle) report from [stylelint](https://github.com/stylelint/stylelint) results.

## Installation

```bash
npm install gulp-stylelint-checkstyle --save-dev
```

## Quick start

With gulp-stylelint-checkstyle, it's easy to start generate a CSS lint report for Jenkins checkstyle plugin.

If you already have a .stylelintrc file in your project directory:

```js
gulp
  .src('src/**/*.css')
  .pipe(gulpStylelintCheckstyle({
    output: 'reports/lint/lint-css.xml'
  }));
```

Alternatively you can specify the stylelint configuration as part of the plugin options:

```js
gulp
  .src('src/**/*.css')
  .pipe(gulpStylelintCheckstyle({
    stylelint: {
      extends: 'stylelint-config-suitcss'
    },
    output: 'reports/lint/lint-css.xml'
  }));
```

## License

http://opensource.org/licenses/mit-license.html

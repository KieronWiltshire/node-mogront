'use strict';

import Fsx from 'fs-extra';
import Path from 'path';
import Gulp from 'gulp';
import Babel from 'gulp-babel';

let distDir = Path.join(__dirname, 'build');

/**
 * Build the application
 */
Gulp.task('build', ['transpile']);

/**
 * Transpile the application
 */
Gulp.task('transpile', ['clean'], function() {
  return Gulp.src([
      'src/**/*'
    ])
    .pipe(Babel())
    .pipe(Gulp.dest(distDir));
});

/**
 * Clean the environment
 */
Gulp.task('clean', function() {
  Fsx.removeSync(distDir);
});

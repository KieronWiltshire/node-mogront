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
  Gulp.src([
      'src/**',
      '!src/stubs/**',
    ])
    .pipe(Babel())
    .pipe(Gulp.dest(distDir));

  Gulp.src([
      'src/stubs/*.js'
    ])
    .pipe(Gulp.dest(Path.join(distDir, 'stubs')));
});

/**
 * Clean the environment
 */
Gulp.task('clean', function() {
  Fsx.removeSync(distDir);
});

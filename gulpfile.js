'use strict';

var browserify = require('browserify');
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');


var uglifyOptions = {
	ie8: true,
};

gulp.task('default', function () {
  // set up the browserify instance on a task basis
  var b = browserify({
    entries: './index.js',
    debug: true
  });

  return b.bundle()
    .pipe(source('oldbrowser.js'))
    .pipe(buffer())
        // Add transformation tasks to the pipeline here.
        .pipe(uglify(uglifyOptions))
        .on('error', gutil.log)
    .pipe(gulp.dest('./dist/'));
});

'use strict';

var startBrowserify = require('browserify'),
	gulp = require('gulp'),
	uglify = require('gulp-uglify'),
	source = require('vinyl-source-stream'),
	buffer = require('vinyl-buffer'),
	gulpUtil = require('gulp-util');

var uglifyOptions = {
	ie8: true,
};

gulp.task('default', function () {
	// set up the browserify instance on a task basis
	var browserify = browserify({
		entries: './index.js',
		debug: true
	});

	return browserify.bundle()
		.pipe(source('oldbrowser.js'))
		.pipe(buffer())
		// Add transformation tasks to the pipeline here.
		.pipe(uglify(uglifyOptions))
		.on('error', gulpUtil.log)
		.pipe(gulp.dest('./dist/'));
});

'use strict';

var config      = require('../config');
var gulp        = require('gulp');
var concat      = require('gulp-concat');
var browserSync = require('browser-sync');

gulp.task('vendor-js', function() {

  return gulp.src(config.vendorJs.src)
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest(config.vendorJs.dest))
    .pipe(browserSync.reload({ stream: true, once: true }));

});

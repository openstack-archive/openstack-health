'use strict';

var config      = require('../config');
var changed     = require('gulp-changed');
var gulp        = require('gulp');
var browserSync = require('browser-sync');

gulp.task('data', function() {

  return gulp.src(config.data.src)
    .pipe(changed(config.data.dest))
    .pipe(gulp.dest(config.data.dest))
    .pipe(browserSync.reload({ stream: true, once: true }));

});

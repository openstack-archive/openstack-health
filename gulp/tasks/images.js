'use strict';

var config      = require('../config');
var changed     = require('gulp-changed');
var gulp        = require('gulp');
var browserSync = require('browser-sync');

gulp.task('images', function() {

  return gulp.src(config.images.src)
    .pipe(changed(config.images.dest)) // Ignore unchanged files
    .pipe(gulp.dest(config.images.dest))
    .pipe(browserSync.reload({ stream: true, once: true }));

});

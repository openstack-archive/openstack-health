'use strict';

var config      = require('../config');
var changed     = require('gulp-changed');
var gulp        = require('gulp');
var browserSync = require('browser-sync');

gulp.task('dev-resources', function() {

  if (!global.isProd) {
    return gulp.src(config.devResources.src)
      .pipe(changed(config.devResources.dest))
      .pipe(gulp.dest(config.devResources.dest))
      .pipe(browserSync.reload({ stream: true, once: true }));
  }

});

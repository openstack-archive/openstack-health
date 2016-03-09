'use strict';

var config      = require('../config');
var gulp        = require('gulp');

gulp.task('reports', function() {

  return gulp.src(config.reports.src)
    .pipe(gulp.dest(config.reports.dest));

});

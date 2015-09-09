'use strict';

var gulp    = require('gulp');
var gzip    = require('gulp-gzip');
var config  = require('../config');
var filter  = require('gulp-filter');
var replace = require('gulp-replace');

gulp.task('gzip', function() {
  var rewriteFilter = filter(config.gzip.rewrite, { restore: true });

  return gulp.src(config.gzip.src)
    .pipe(rewriteFilter)
    .pipe(replace(/"((?:css|js)\/.*\.(?:css|js))"/g, '"$1.gz"'))
    .pipe(rewriteFilter.restore)
    .pipe(gzip(config.gzip.options))
    .pipe(gulp.dest(config.gzip.dest));

});

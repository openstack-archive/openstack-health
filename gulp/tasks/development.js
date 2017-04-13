'use strict';

var gulp        = require('gulp');
var runSequence = require('run-sequence');

gulp.task('dev', ['clean'], function(cb) {

  cb = cb || function() {};

  global.isProd = false;

  runSequence(
    ['styles', 'fonts', 'images', 'data', 'views', 'dev-resources'],
    'browserify', 'watch', cb);

});

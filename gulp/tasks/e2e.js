'use strict';

var gulp = require('gulp');
var runSequence = require('run-sequence');

gulp.task('e2e', function(callback) {

  callback = callback || function() {};

  runSequence(
    'prod',
    'dev-resources',
    'reports',
    'protractor',
    callback);

});

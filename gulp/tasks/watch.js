'use strict';

var config        = require('../config');
var gulp          = require('gulp');

gulp.task('watch', ['browserSync', 'server'], function() {

  // Scripts are automatically watched and rebundled by Watchify inside Browserify task
  gulp.watch(config.scripts.src,  ['lint']);
  gulp.watch(config.styles.src,   ['styles']);
  gulp.watch(config.fonts.src,    ['fonts']);
  gulp.watch(config.data.src,     ['data']);
  gulp.watch(config.vendorJs.src, ['vendor-js']);
  gulp.watch(config.views.watch,  ['views']);

});

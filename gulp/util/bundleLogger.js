'use strict';

/* bundleLogger
 * ------------
 * Provides gulp style logs to the bundle method in browserify.js
 */

var colors       = require('ansi-colors');
var log          = require('fancy-log');
var prettyHrtime = require('pretty-hrtime');
var startTime;

module.exports = {

  start: function() {
    startTime = process.hrtime();
    log('Running', colors.green('\'bundle\'') + '...');
  },

  end: function() {
    var taskTime = process.hrtime(startTime);
    var prettyTime = prettyHrtime(taskTime);
    log('Finished', colors.green('\'bundle\''), 'in', colors.magenta(prettyTime));
  }

};

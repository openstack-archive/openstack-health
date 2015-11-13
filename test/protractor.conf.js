'use strict';

var phantomjs = require('phantomjs');

var gulpConfig = require('../gulp/config');

exports.config = {

  allScriptsTimeout: 11000,

  baseUrl: 'http://localhost:' + gulpConfig.serverPort + '/',

  directConnect: true,

  capabilities: {
    browserName: 'chrome'
  },

  framework: 'jasmine',

  jasmineNodeOpts: {
    isVerbose: false,
    showColors: true,
    includeStackTrace: true,
    defaultTimeoutInterval: 30000
  },

  specs: [
    'e2e/**/*.js'
  ],

  mocks: {
    dir: 'e2e/mocks'
  },

  onPrepare: function() {
    require('protractor-http-mock').config = {
      rootDirectory: __dirname
    };
  }

};

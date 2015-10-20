'use strict';

var istanbul = require('browserify-istanbul');
var isparta  = require('isparta');

module.exports = function(config) {
  config.set({

    basePath: '../',

    frameworks: ['jasmine', 'browserify'],

    files: [
      // app-specific code
      'app/js/main.js',
      // 3rd-party resources
      'node_modules/angular-mocks/angular-mocks.js',
      // test files
      'test/unit/**/*.js'
    ],

    preprocessors: {
      'app/js/**/*.js': ['browserify', 'babel', 'coverage']
    },

    reporters: ['progress'],

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: true,

    browsers: ['PhantomJS'],

    singleRun: true,

    plugins: [
      'karma-babel-preprocessor',
      'karma-browserify',
      'karma-coverage',
      'karma-jasmine',
      'karma-phantomjs-launcher'
    ],

    browserify: {
      debug: true,
      transform: [
        'bulkify',
        istanbul({
          instrumenter: isparta,
          ignore: ['**/node_modules/**', '**/test/**']
        })
      ]
    },

    proxies: {
      '/': 'http://localhost:9876/'
    },

    urlRoot: '/__karma__/'
  });

};

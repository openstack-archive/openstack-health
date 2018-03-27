'use strict';

var istanbul = require('browserify-istanbul');
var isparta  = require('isparta');
var ngAnnotate = require('browserify-ngannotate');

process.env.CHROME_BIN = 'chromium-browser'; // eslint-disable-line no-process-env

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

    reporters: ['spec', 'coverage', 'subunit'],

    port: 9876,

    colors: false,

    logLevel: config.LOG_INFO,

    autoWatch: true,

    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    },

    singleRun: true,

    plugins: [
      'karma-babel-preprocessor',
      'karma-browserify',
      'karma-coverage',
      'karma-jasmine',
      'karma-spec-reporter',
      'karma-chrome-launcher',
      'karma-subunit-reporter'
    ],

    browserify: {
      debug: true,
      transform: [
        'bulkify',
        ngAnnotate,
        istanbul({
          instrumenter: isparta,
          ignore: ['**/node_modules/**', '**/test/**']
        })
      ]
    },

    coverageReporter: {
      type: 'html',
      dir: 'cover',
      instrumenterOptions: {
        istanbul: {noCompact: true}
      }
    },

    subunitReporter: {
      tags: ['worker-0'],
      slug: true
    },

    proxies: {
      '/': 'http://localhost:9876/'
    },

    urlRoot: '/__karma__/'
  });

};

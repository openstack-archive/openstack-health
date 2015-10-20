'use strict';

var angular = require('angular');

// angular modules
require('angular-ui-router');
require('angular-ui-bootstrap');
require('angular-fontawesome');
require('./templates');
require('./controllers/_index');
require('./services/_index');
require('./directives/_index');

var requires = [
  'ui.router',
  'ui.bootstrap',
  'picardy.fontawesome',
  'templates',
  'app.controllers',
  'app.services',
  'app.directives'
];

// mount on window for testing
angular.module('app', requires);

angular.module('app').constant('AppSettings', require('./constants'));

var onConfig = require('./on_config');
angular.module('app').config(onConfig);

var onRun = require('./on_run');
angular.module('app').run(onRun);

angular.bootstrap(document, ['app']);

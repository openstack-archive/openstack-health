'use strict';

var angular = require('angular');

var servicesModule = require('./_index.js');

function TestService() {
  var service = {};

  service.removeIdNoise = function(testId) {
    return testId.replace('setUpClass (', '').replace('tearDownClass (', '').replace(')', '');
  };

  service.getShortName = function(testId) {
    var denoisedTestName = service.removeIdNoise(testId);
    return denoisedTestName.split('.').slice(-2).join('.');
  };

  return service;
}

servicesModule.service('testService', TestService);

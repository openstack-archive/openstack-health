'use strict';

var angular = require('angular');

var servicesModule = require('./_index.js');

function HealthService($http, AppSettings) {
  var base = AppSettings.apiUrl;

  var service = {};

  service.getRunsFromBuildName = function(buildName) {
    return $http.jsonp(base + '/build_name/' + buildName + '/runs', {
      params: {
        callback: 'JSON_CALLBACK'
      }
    });
  };

  service.getRunsGroupedByMetadataPerDatetime = function(key, options) {
    return $http.jsonp(base + '/runs/group_by/' + key, {
      params: angular.extend(options, { callback: 'JSON_CALLBACK' })
    });
  };

  service.getRuns = function(options) {
    return $http.jsonp(base + '/runs', {
      params: angular.extend(options, { callback: 'JSON_CALLBACK' })
    });
  };

  service.getTestsFromRun = function(runId) {
    return $http.jsonp(base + '/run/' + runId + '/tests', {
      params: { callback: 'JSON_CALLBACK' }
    });
  };

  service.getRunTestRuns = function(runId) {
    return $http.jsonp(base + '/run/' + runId + '/test_runs', {
      params: { callback: 'JSON_CALLBACK' }
    });
  };

  service.getTests = function() {
    return $http.jsonp(base + '/tests', {
      params: { callback: 'JSON_CALLBACK' }
    });
  };

  service.getTestRuns = function() {
    return $http.jsonp(base + '/test_runs', {
      params: { callback: 'JSON_CALLBACK' }
    });
  };

  return service;
}

servicesModule.service('healthService', HealthService);

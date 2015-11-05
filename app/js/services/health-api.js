'use strict';

var angular = require('angular');

var servicesModule = require('./_index.js');

/**
 * @ngInject
 */
function httpProviderInterceptor($httpProvider) {
  /**
   * @ngInject
   */
  $httpProvider.interceptors.push(/* @ngInject */ function($q, $rootScope) {
    return {
      'request': function(config) {
        $rootScope.$broadcast('loading-started');
        return config || $q.when(config);
      },
      'response': function(response) {
        $rootScope.$broadcast('loading-complete');
        return response || $q.when(response);
      }
    };
  });
}

servicesModule.config(httpProviderInterceptor);

/**
 * @ngInject
 */
function HealthService($http, config) {
  var service = {};

  service.getRunsFromBuildName = function(buildName) {
    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/build_name/' + buildName + '/runs', {
        params: {
          callback: 'JSON_CALLBACK'
        }
      });
    });
  };

  service.getTestsFromBuildName = function(buildName, options) {
    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/build_name/' + buildName + '/test_runs', {
        params: angular.extend(options, { callback: 'JSON_CALLBACK' })
      });
    });
  };

  service.getRunsGroupedByMetadataPerDatetime = function(key, options) {
    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/runs/group_by/' + key, {
        params: angular.extend(options, { callback: 'JSON_CALLBACK' })
      });
    });
  };

  service.getRuns = function(options) {
    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/runs', {
        params: angular.extend(options, { callback: 'JSON_CALLBACK' })
      });
    });
  };

  service.getRunsFromProject = function(projectName, options) {
    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/projects/' + projectName + '/runs', {
        params: angular.extend(options, { callback: 'JSON_CALLBACK' })
      });
    });
  };

  service.getTestsFromRun = function(runId) {
    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/run/' + runId + '/tests', {
        params: { callback: 'JSON_CALLBACK' }
      });
    });
  };

  service.getRunTestRuns = function(runId) {
    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/run/' + runId + '/test_runs', {
        params: { callback: 'JSON_CALLBACK' }
      });
    });
  };

  service.getTests = function() {
    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/tests', {
        params: { callback: 'JSON_CALLBACK' }
      });
    });
  };

  service.getTestRuns = function() {
    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/test_runs', {
        params: { callback: 'JSON_CALLBACK' }
      });
    });
  };

  service.getRunMetadataKeys = function() {
    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/runs/metadata/keys', {
        params: { callback: 'JSON_CALLBACK' }
      });
    });
  };

  return service;
}

servicesModule.service('healthService', HealthService);

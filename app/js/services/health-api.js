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
    var count = 0;

    return {
      'request': function(config) {
        count++;

        $rootScope.$broadcast('loading-started');
        $rootScope.loadingStatus = 'loading';

        return config || $q.when(config);
      },
      'response': function(response) {
        $rootScope.$broadcast('loading-complete');
        count--;

        if (count === 0 && $rootScope.loadingStatus !== 'error') {
          $rootScope.loadingStatus = null;
        }

        return response || $q.when(response);
      },
      'responseError': function(rejection) {
        count--;

        // we only ever get useless '404' errors with JSONP, so don't bother
        // including a message
        $rootScope.$broadcast('loading-error');
        $rootScope.loadingStatus = 'error';

        return $q.reject(rejection);
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

  service.getRunsForRunMetadataKey = function(runMetadataKey, value, options) {
    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/runs/key/' + runMetadataKey + '/' + value, {
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
        cache: true,
        params: { callback: 'JSON_CALLBACK' }
      });
    });
  };

  service.getRunMetadataKeys = function() {
    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/runs/metadata/keys', {
        cache: true,
        params: { callback: 'JSON_CALLBACK' }
      });
    });
  };

  service.getTestRunList = function(testId, options) {
    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/test_runs/' + testId, {
        params: angular.extend(options, { callback: 'JSON_CALLBACK' })
      });
    });
  };

  service.getRecentGroupedRuns = function(runMetadataKey, value, options) {
    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/runs/key/' + runMetadataKey + '/' + value + '/recent', {
        params: { callback: 'JSON_CALLBACK' }
      });
    });
  };
  service.getRecentFailedTests = function(options) {
    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/tests/recent/fail', {
        params: { callback: 'JSON_CALLBACK' }
      });
    });
  };

  return service;
}

servicesModule.service('healthService', HealthService);

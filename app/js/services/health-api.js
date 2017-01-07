'use strict';

var angular = require('angular');

var servicesModule = require('./_index.js');
var nprogress = require('nprogress');
nprogress.configure();

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
        nprogress.start();

        $rootScope.$broadcast('loading-started');
        $rootScope.loadingStatus = 'loading';

        return config || $q.when(config);
      },
      'response': function(response) {
        $rootScope.$broadcast('loading-complete');
        count--;

        if (count === 0 && $rootScope.loadingStatus !== 'error') {
          $rootScope.loadingStatus = null;
          nprogress.done();
        }

        return response || $q.when(response);
      },
      'responseError': function(rejection) {
        count--;
        nprogress.done();

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
        }
      });
    });
  };

  service.getTestsFromBuildName = function(buildName, options) {
    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/build_name/' + buildName + '/test_runs', {
        cache: true,
        params: angular.extend(options)
      });
    });
  };

  service.getRunsGroupedByMetadataPerDatetime = function(key, options) {
    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/runs/group_by/' + key, {
        cache: true,
        params: angular.extend(options)
      });
    });
  };

  service.getRuns = function(options) {
    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/runs', {
        params: angular.extend(options)
      });
    });
  };

  service.getRunsForRunMetadataKey = function(runMetadataKey, value, options) {
    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/runs/key/' + runMetadataKey + '/' + value, {
        params: angular.extend(options)
      });
    });
  };

  service.getTestsFromRun = function(runId) {
    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/run/' + runId + '/tests', {
        params: {}
      });
    });
  };

  service.getRunTestRuns = function(runId) {
    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/run/' + runId + '/test_runs', {
        params: {}
      });
    });
  };

  service.getTests = function() {
    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/tests', {
        cache: true,
        params: {}
      });
    });
  };

  service.getRunMetadataKeys = function() {
    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/runs/metadata/keys', {
        cache: true,
        params: {}
      });
    });
  };

  service.getTestRunList = function(testId, options) {
    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/test_runs/' + testId, {
        params: angular.extend(options)
      });
    });
  };

  service.getRecentGroupedRuns = function(runMetadataKey, value, options) {
    options = options || {};

    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/runs/key/' + runMetadataKey + '/' + value + '/recent', {
        cache: true,
        params: angular.extend(options)
      });
    });
  };

  service.getRecentFailedTests = function(options) {
    options = options || {};

    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/tests/recent/fail', {
        cache: true,
        params: angular.extend(options)
      });
    });
  };

  service.getTestPrefixes = function() {
    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/tests/prefix', {
        cache: true,
        params: {}
      });
    });
  };

  service.getTestsByPrefix = function(prefix, options) {
    options = options || {};

    return config.get().then(function(config) {
      return $http.jsonp(config.apiRoot + '/tests/prefix/' + prefix, {
        cache: true,
        params: angular.extend(options)
      });
    });
  };

  return service;
}

servicesModule.service('healthService', HealthService);

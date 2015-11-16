'use strict';

var angular = require('angular');
var servicesModule = require('./_index.js');

/**
 * @ngInject
 */
var metricsService = function() {
  var service = {};

  service.getNewMetrics = function() {
    return { passes: 0, failures: 0, skips: 0, failRate: 0 };
  };

  service.getFailRate = function(metrics) {
    var failRate = metrics.failures / (metrics.passes + metrics.failures) || 0;
    return Math.round(failRate * 100) / 100;
  };

  service.addMetrics = function(metrics1, metrics2) {
    var metrics = angular.copy(metrics1);
    metrics.passes += metrics2.passes;
    metrics.failures += metrics2.failures;
    metrics.skips += metrics2.skips;
    metrics.failRate = service.getFailRate(metrics);
    return metrics;
  };

  service.calculateRunMetrics = function(runEntries) {
    var runMetrics = service.getNewMetrics();

    runEntries.forEach(function(run) {
      if (run.fail > 0) {
        runMetrics.failures += 1;
      } else if (run.pass > 0) {
        runMetrics.passes += 1;
      } else {
        runMetrics.skips += 1;
      }
    });

    runMetrics.failRate = service.getFailRate(runMetrics);
    return runMetrics;
  };

  return service;
};

servicesModule.service('metricsService', metricsService);

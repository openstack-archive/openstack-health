'use strict';

var angular = require('angular');
var factoriesModule = require('./_index.js');

/**
 * @ngInject
 */
var projectFactory = function(metricsService) {
  var factory = {};

  factory.create = function(name) {
    var project = {};
    project.name = name;
    project.runs = [];
    project.metrics = metricsService.getNewMetrics();

    project.addRuns = function(date, runEntries) {
      if (!runEntries || runEntries.length === 0) { return; }

      var run = {
        date: new Date(date),
        entries: runEntries,
        metrics: metricsService.calculateRunMetrics(runEntries)
      };

      project.runs.push(run);
      project.metrics = metricsService.addMetrics(project.metrics, run.metrics);
    };

    return project;
  };

  return factory;
};

factoriesModule.factory('projectFactory', projectFactory);

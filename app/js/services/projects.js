'use strict';

var angular = require('angular');
var servicesModule = require('./_index.js');

/**
 * @ngInject
 */
var projectService = function(projectFactory, metricsService) {
  var service = {};

  var findOrCreate = function(index, storage, key, createFunction) {
    var obj = index[key] || createFunction(key);
    if (!index[key]) {
      index[key] = obj;
      storage.push(obj);
    }
    return obj;
  };

  var byDate = function(stats1, stats2) {
    return stats1.date - stats2.date;
  };

  var createDateStats = function(date) {
    return { date: date, metrics: metricsService.getNewMetrics() };
  };

  service.findBlanks = function(runsJson) {
    var blanks = [];
    angular.forEach(runsJson, function(projectsJson, dateString) {
      if (typeof projectsJson == 'undefined' || projectsJson.length == 0) {
        blanks.push(dateString);
      }
    });
    return blanks;
  };

  service.createProjects = function(runsJson, projectRe) {
    var projects = [];
    var index = {};
    var pattern = null;
    try {
      pattern = new RegExp(projectRe);
    } catch (e) {
      pattern = '';
    }
    angular.forEach(runsJson, function(projectsJson, dateString) {
      angular.forEach(projectsJson, function(runEntries, name) {
        if (pattern.test(name)) {
          var project = findOrCreate(index, projects, name, projectFactory.create);
          project.addRuns(dateString, runEntries);
        }
      });
    });

    return projects;
  };

  service.getStatsByDate = function(projects) {
    var index = {};
    var dateStats = [];

    angular.forEach(projects, function(project) {
      angular.forEach(project.runs, function(run) {
        var stats = findOrCreate(index, dateStats, run.date, createDateStats);
        stats.metrics = metricsService.addMetrics(stats.metrics, run.metrics);
      });
    });

    return dateStats.sort(byDate);
  };

  return service;
};

servicesModule.service('projectService', projectService);

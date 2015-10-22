'use strict';

var controllersModule = require('./_index');
var _ = require('underscore');

/**
 * @ngInject
 */
function HomeController(healthService) {

  // ViewModel
  var vm = this;

  vm.processData = function(data) {
    var projects = {};
    var passEntries = [];
    var failEntries = [];
    var failRateEntries = [];
    var sumProjectMetrics = function(project) {
      var sumProject = projects[projectName];
      if (typeof sumProject === "undefined") {
        // create initial data containers for each gauge chart on-the-fly
        sumProject = {
          name: projectName,
          data: [
            { key: 'Passes', value: 0, color: 'blue' },
            { key: 'Failures', value: 0, color: 'red' }
          ]
        };
        projects[projectName] = sumProject;
      }

      if (project.fail > 0) {
        totalFail += 1;
        sumProject.data[1].value += 1;
      } else {
        totalPass += 1;
        sumProject.data[0].value += 1;
      }
    };

    for (var dateString in data.runs) {
      if (data.runs.hasOwnProperty(dateString)) {
        var date = dateString;
        var totalPass = 0;
        var totalFail = 0;

        var reqProjects = data.runs[date];
        var projectName = '';
        for (projectName in reqProjects) {
          if (reqProjects.hasOwnProperty(projectName)) {
            reqProjects[projectName].forEach(sumProjectMetrics);
          }
        }

        // parse dates and create data series' for the main chart
        var time = new Date(date).getTime();

        passEntries.push({
          x: time,
          y: totalPass
        });

        failEntries.push({
          x: time,
          y: totalFail
        });

        failRateEntries.push({
          x: new Date(date).getTime(),
          y: (totalFail / (totalFail + totalPass)) * 100
        });
      }
    }

    vm.chartData = [
      { key: 'Passes', values: passEntries, color: "blue" },
      { key: 'Failures', values: failEntries, color: "red" }
    ];

    vm.chartDataRate = [
      { key: '% Failures', values: failRateEntries }
    ];

    vm.projects = Object.keys(projects).map(function(name) {
      return projects[name];
    });

    vm.projects = _.sortBy(projects, function(project) {
      var passes = project.data[0].value;
      var failures = project.data[1].value;
      var total = passes + failures;
      var percentOfFailures = failures / total * 100;

      return percentOfFailures * -1;
    });
  };

  vm.loadData = function() {
    var start = new Date();
    start.setDate(start.getDate() - 20);

    healthService.getRunsGroupedByMetadataPerDatetime('project', {
      start_date: start,
      datetime_resolution: 'hour'
    }).then(function(response) {
      vm.processData(response.data);
    });
  };

  vm.loadData();
}
controllersModule.controller('HomeController', HomeController);

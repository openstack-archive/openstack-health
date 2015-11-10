'use strict';

var controllersModule = require('./_index');

/**
 * @ngInject
 */
function HomeController(healthService, startDate) {

  // ViewModel
  var vm = this;

  vm.processData = processData;
  vm.loadData = loadData;

  var percentageOfFailures = function(project) {
    var passes = project.data[0].value;
    var failures = project.data[1].value;
    var totalTests = passes + failures;
    var percentOfFailures = failures / totalTests * 100;

    return percentOfFailures;
  };

  var byPercentageOfFailuresDesc = function(project1, project2) {
    var percentage1 = percentageOfFailures(project1);
    var percentage2 = percentageOfFailures(project2);

    // To get descending order, project2 should come first
    return percentage2 - percentage1;
  };

  function processData(data) {
    vm.chartData = [];
    vm.chartDataRate = [];
    vm.projects = [];

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
      } else if (project.pass > 0) {
        totalPass += 1;
        sumProject.data[0].value += 1;
      }
    };

    for (var dateString in data.runs) {
      if (data.runs.hasOwnProperty(dateString)) {
        var date = dateString;
        var totalPass = 0;
        var totalFail = 0;
        var failRate = 0;
        var DEFAULT_FAIL_RATE = 0;

        var reqProjects = data.runs[date];
        var projectName = '';
        for (projectName in reqProjects) {
          if (reqProjects.hasOwnProperty(projectName)) {
            reqProjects[projectName].forEach(sumProjectMetrics);
          }
        }

        failRate = totalFail / (totalFail + totalPass) || DEFAULT_FAIL_RATE;

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
          y: failRate
        });
      }
    }

    vm.chartData.push({ key: 'Passes', values: passEntries, color: "blue" });
    vm.chartData.push({ key: 'Failures', values: failEntries, color: "red" });

    vm.chartDataRate.push({ key: '% Failures', values: failRateEntries });

    vm.projects = Object.keys(projects)
      .map(function(name) {
        return projects[name];
      })
      .sort(byPercentageOfFailuresDesc);
  }

  function loadData() {
    var start = new Date(startDate);
    start.setDate(start.getDate() - 20);

    healthService.getRunsGroupedByMetadataPerDatetime('project', {
      start_date: start,
      datetime_resolution: 'hour'
    }).then(function(response) {
      vm.processData(response.data);
    });
  }

  vm.loadData();
}
controllersModule.controller('HomeController', HomeController);

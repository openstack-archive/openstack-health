'use strict';

var controllersModule = require('./_index');

/**
 * @ngInject
 */
function HomeCtrl(healthService) {

  // ViewModel
  var vm = this;

  vm.processData = function(data) {
    var projects = {};
    var passEntries = [];
    var failEntries = [];

    for (var dateString in data.runs) {
      var date = dateString;
      var totalPass = 0;
      var totalFail = 0;

      var reqProjects = data.runs[date];
      for (var projectName in reqProjects) {
        reqProjects[projectName].forEach(function(project) {
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
        });
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
    }

    vm.chartData = [
      { key: 'Passes', values: passEntries, color: "blue" },
      { key: 'Failures', values: failEntries, color: "red" }
    ];

    vm.projects = Object.keys(projects).map(function(name) {
      return projects[name];
    });
  };

  vm.loadData = function() {
    var start = new Date();
    start.setDate(start.getDate() - 20);

    healthService.getRunsGroupedByMetadataPerDatetime('project', {
      start_date: start,
      datetime_resolution: 'hour',
    }).then(function(response) {
      vm.processData(response.data);
    });
  };

  vm.loadData();
}
controllersModule.controller('HomeCtrl', HomeCtrl);

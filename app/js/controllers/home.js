'use strict';

var controllersModule = require('./_index');

/**
 * @ngInject
 */
function HomeCtrl($http) {

  // ViewModel
  var vm = this;

  $http.get("data/home_sample.json").then(function(response) {
    vm.data = response.data;

    // prepare chart data
    var projects = {};
    var passEntries = [];
    var failEntries = [];

    response.data.timedata.forEach(function(timedata) {
      var totalPass = 0;
      var totalFail = 0;

      timedata.project_data.forEach(function(project) {
        var sumProject = projects[project.project];
        if (typeof sumProject === "undefined") {
          // create initial data containers for each gauge chart on-the-fly
          sumProject = {
            name: project.project,
            data: [
              { key: 'Passes', value: 0, color: 'blue' },
              { key: 'Failures', value: 0, color: 'red' }
            ]
          };
          projects[project.project] = sumProject;
        }

        sumProject.data[0].value += project.pass;
        sumProject.data[1].value += project.fail;

        totalPass += project.pass;
        totalFail += project.fail;
      });

      // parse dates and create data series' for the main chart
      var date = new Date(timedata.datetime).getTime();

      passEntries.push({
        x: date,
        y: totalPass
      });

      failEntries.push({
        x: date,
        y: totalFail
      });
    });

    vm.chartData = [
      { key: 'Passes', values: passEntries, color: "blue" },
      { key: 'Failures', values: failEntries, color: "red" }
    ];

    vm.projects = Object.keys(projects).map(function(name) {
      return projects[name];
    });
  });

}

controllersModule.controller('HomeCtrl', HomeCtrl);

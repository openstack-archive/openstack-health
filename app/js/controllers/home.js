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
    var chartEntries = [];

    response.data.timedata.forEach(function(timedata) {
      var totalPass = 0;
      var totalFail = 0;

      timedata.project_data.forEach(function(project) {
        var sumProject = projects[project.project];
        if (typeof sumProject === "undefined") {
          sumProject = {
            name: project.project,
            pass: 0,
            fail: 0
          };
          projects[project.project] = sumProject;
        }

        sumProject.pass += project.pass;
        sumProject.fail += project.fail;

        totalPass += project.pass;
        totalFail += project.fail;
      });

      chartEntries.push({
        pass: totalPass,
        fail: totalFail,
        range: timedata.datetime
      });
    });

    vm.projects = Object.keys(projects).map(function(name) {
      return projects[name];
    });
    vm.chartEntries = chartEntries;
  });

}

controllersModule.controller('HomeCtrl', HomeCtrl);

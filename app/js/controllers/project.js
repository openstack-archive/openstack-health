"use strict";

var controllersModule = require('./_index');

/**
 * @ngInject
 */
function ProjectController(healthService, projectName, startDate) {

  // ViewModel
  var vm = this;

  vm.sortType = 'failuresRate';
  vm.sortReverse = false;
  vm.searchJob = '';

  // decodeURI is needed here because project names contains slash as part
  // of the name. As this come from an URL part and URL can be encoded,
  // this decode call make the project name exebition properly.
  vm.name = decodeURIComponent(projectName);

  vm.processData = function(data) {
    // prepare chart data
    var jobs = {};
    var passEntries = [];
    var failEntries = [];
    var failRateEntries = [];

    if (!data.timedelta) {
      return;
    }

    data.timedelta.forEach(function(timedelta) {
      var totalPass = 0;
      var totalFail = 0;
      var failRate = 0;
      var DEFAULT_FAIL_RATE = 0;

      timedelta.job_data.forEach(function(job) {
        var successfulJobs = 0;
        var failedJobs = 0;
        var jobFailRate = 0;

        if (!jobs[job.job_name]) {
          var jobMetrics = {
            name: job.job_name,
            passes: 0,
            failures: 0,
            failuresRate: 0
          };
          jobs[job.job_name] = jobMetrics;
        }

        totalPass += job.pass;
        totalFail += job.fail;

        jobs[job.job_name].passes += job.pass;
        jobs[job.job_name].failures += job.fail;

        successfulJobs = jobs[job.job_name].passes;
        failedJobs = jobs[job.job_name].failures;
        jobFailRate = (failedJobs / (failedJobs + successfulJobs)) * 100 || DEFAULT_FAIL_RATE;

        jobs[job.job_name].failures_rate = jobFailRate;
      });

      failRate = (totalFail / (totalFail + totalPass)) * 100 || DEFAULT_FAIL_RATE;

      passEntries.push({
        x: new Date(timedelta.datetime).getTime(),
        y: totalPass
      });

      failEntries.push({
        x: new Date(timedelta.datetime).getTime(),
        y: totalFail
      });

      failRateEntries.push({
        x: new Date(timedelta.datetime).getTime(),
        y: failRate
      });
    });

    vm.chartData = [
      { key: 'Passes', values: passEntries, color: 'blue' },
      { key: 'Failures', values: failEntries, color: 'red' }
    ];

    vm.chartDataRate = [
      { key: '% Failures', values: failRateEntries }
    ];

    vm.jobs = Object.keys(jobs).map(function(name) {
      return jobs[name];
    });
  };

  vm.loadData = function() {
    var start = new Date(startDate);
    start.setDate(start.getDate() - 20);

    healthService.getRunsFromProject(vm.name, {
      start_date: start,
      datetime_resolution: 'hour'
    }).then(function(response) {
      vm.processData(response.data);
    });
  };

  vm.loadData();
}

controllersModule.controller('ProjectController', ProjectController);

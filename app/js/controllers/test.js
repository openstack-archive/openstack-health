'use strict';

var controllersModule = require('./_index');

/**
 * @ngInject
 */
function TestController(healthService, testService, startDate, testId) {

  // ViewModel
  var vm = this;
  vm.testName = testId;
  vm.testShortName = testService.getShortName(testId);

  vm.processData = function(data) {
    var dates = {};
    var passEntries = [];
    var failEntries = [];
    var skipEntries = [];
    var runTimeEntries = [];
    var avgRunTimeEntries = [];
    var dateString, dateTimeString;

    for (dateString in data.data) {
      if (data.data.hasOwnProperty(dateString)) {
        var date = dateString;
        var test = data.data[dateString];

        // parse dates and create data series
        var date = new Date(date);
        var date = new Date(date.getFullYear(), date.getMonth(),
                            date.getDate()).getTime();
        if (!dates[date]) {
          if (test.status == 'success' || test.status == 'xfail') {
            var count = {
              passes: 1,
              fails: 0,
              skips: 0
            };
          }
          else if (test.status == 'fail' || test.status == 'unxsucess') {
            var count = {
              passes: 0,
              fails: 1,
              skips: 0
            };
          }
          else if (test.status == 'skip') {
            var count = {
              passes: 0,
              fails: 0,
              skips: 1
            };
          }
          dates[date] = count;
        }
        else {
          if (test.status == 'success' || test.status == 'xfail') {
            dates[date].passes += 1;
          }
          else if (test.status == 'fail' || test.status == 'unxsucess') {
            dates[date].fails += 1;
          }
          else if (test.status == 'skip') {
            dates[date].skips += 1;
          }
        }
      }
    }
    for (date in dates) {
      if (dates.hasOwnProperty(date)) {
        passEntries.push({
          x: date,
          y: dates[date].passes
        });
        failEntries.push({
          x: date,
          y: dates[date].fails
        });
        skipEntries.push({
          x: date,
          y: dates[date].skips
        });
      }
    }
    vm.statusData = [
      { key: 'Passes', values: passEntries, color: "blue" },
      { key: 'Failures', values: failEntries, color: "red" },
      { key: 'Skips', values: skipEntries, color: "violet" }
    ];

    for (dateTimeString in data.numeric) {
      if (data.numeric.hasOwnProperty(dateTimeString)) {
        var date = dateTimeString;
        var test = data.numeric[dateTimeString];

        // parse dates and create data series
        var date = new Date(date).getTime();

        runTimeEntries.push({
          x: date,
          y: parseFloat(test.run_time.toFixed(2))
        });
        avgRunTimeEntries.push({
          x: date,
          y: parseFloat(test.avg_run_time.toFixed(2))
        });
      }
    }
    vm.timeData = [
      {key: 'Run Time (sec.)', values: runTimeEntries, color: "blue"},
      {key: 'Avg. Run Time (sec.)', values: avgRunTimeEntries, color: "black"}
    ];
  };

  vm.loadData = function() {
    var beginDate = new Date(startDate);
    var stopDate = new Date(startDate);
    beginDate.setDate(startDate.getDate() - 15);
    healthService.getTestRunList(vm.testName, {
      start_date: beginDate,
      stop_date: stopDate
    }).then(function(response) {
      vm.processData(response.data);
    });
  };

  vm.loadData();
}
controllersModule.controller('TestController', TestController);

'use strict';

var controllersModule = require('./_index');

/**
 * @ngInject
 */
function TestController($scope, healthService, testService, viewService, testId) {

  // ViewModel
  var vm = this;
  vm.testName = testId;
  vm.testShortName = testService.getShortName(testId);
  vm.loaded = false;
  vm.hold = 0;

  var configurePeriods = function() {
    vm.hold += 1;

    var res = viewService.resolution();
    var min = null;
    var max = null;
    var preference = null;

    if (res.key === 'sec') {
      max = { hours: 6 };
      preference = { hours: 1 };
    } else if (res.key === 'min') {
      max = { days: 1 };
      preference = { hours: 12 };
    } else if (res.key === 'hour') {
      min = { hours: 12 };
      max = { months: 3 };
      preference = { months: 1 };
    } else if (res.key === 'day') {
      min = { hours: 48 };
      preference = { months: 3 };
    }

    viewService.periods(min, max, true);
    viewService.preferredDuration(preference);

    vm.hold -= 1;
  };

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
          else if (test.status == 'fail' || test.status == 'unxsuccess') {
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
          else if (test.status == 'fail' || test.status == 'unxsuccess') {
            dates[date].fails += 1;
          }
          else if (test.status == 'skip') {
            dates[date].skips += 1;
          }
        }
      }
    }
    for (date in dates) {
      date = parseInt(date);
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
      { key: 'Passes', values: passEntries, color: 'blue' },
      { key: 'Failures', values: failEntries, color: 'red' },
      { key: 'Skips', values: skipEntries, color: 'violet' }
    ];

    for (dateTimeString in data.numeric) {
      if (data.numeric.hasOwnProperty(dateTimeString)) {
        var date = dateTimeString;
        var test = data.numeric[dateTimeString];

        // parse dates and create data series
        var date = new Date(date).getTime();
        if (!isNaN(test.run_time)) {
          runTimeEntries.push({
            x: date,
            y: parseFloat(test.run_time),
            size: 1,
            shape: 'circle'
          });
        }
        if (!isNaN(test.avg_run_time)) {
          avgRunTimeEntries.push({
            x: date,
            y: parseFloat(test.avg_run_time)
          });
        }
      }
    }
    vm.timeData = [
      {key: 'Run Time (sec.)', values: runTimeEntries, color: 'blue'},
      {key: 'Avg. Run Time (sec.)', values: avgRunTimeEntries, color: 'black'}
    ];
  };

  vm.loadData = function() {
    if (vm.hold > 0) {
      return;
    }

    healthService.getTestRunList(vm.testName, {
      start_date: viewService.periodStart(),
      stop_date: viewService.periodEnd(),
      datetime_resolution: viewService.resolution().key
    }).then(function(response) {
      vm.processData(response.data);
      vm.loaded = true;
    });
  };

  configurePeriods();
  vm.loadData();

  $scope.$on('view:resolution', function(event, resolution) {
    configurePeriods();
    vm.loadData();
  });

  $scope.$on('view:period', function(event, corrected) {
    if (vm.loaded && !corrected) {
      vm.loadData();
    }
  });
}
controllersModule.controller('TestController', TestController);

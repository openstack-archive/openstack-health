'use strict';

var controllersModule = require('./_index');

/**
 * @ngInject
 */
function TestController(
  $scope, healthService, testService, viewService, periodsService,
  testId) {

  // ViewModel
  var vm = this;
  vm.testName = testId;
  vm.testShortName = testService.getShortName(testId);
  vm.loaded = false;
  vm.hold = 0;

  var configurePeriods = function() {
    vm.hold += 1;

    var res = viewService.resolution();
    var periods = periodsService.get('test', res.key);

    viewService.periods(periods.min, periods.max, true);
    viewService.preferredDuration(periods.preference);

    vm.hold -= 1;
  };

  var incCount = function(status, count) {
    if (status == 'success' || status == 'xfail') {
      count.passes += 1;
    }
    else if (status == 'fail' || status == 'unxsuccess') {
      count.fails += 1;
    }
    else if (status == 'skip') {
      count.skips += 1;
    }
    return count;
  };

  vm.processData = function(data) {  // eslint-disable-line complexity
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
          var count = {
            passes: 0,
            fails: 0,
            skips: 0
          };
          dates[date] = incCount(test.status, count);
        }
        else {
          dates[date] = incCount(test.status, dates[date]);
        }
      }
    }
    for (date in dates) {  // eslint-disable-line guard-for-in
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

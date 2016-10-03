'use strict';

var controllersModule = require('./_index');

/**
 * @ngInject
 */
function JobController(
  $location, $scope,
  healthService, viewService, testService, periodsService, pageTitleService,
  jobName) {
  // ViewModel
  var vm = this;

  vm.searchTest = '';
  vm.name = decodeURIComponent(jobName);
  vm.recentRuns = [];
  vm.loaded = false;
  vm.hold = 0;

  pageTitleService.update('Job: ' + vm.name);

  var configurePeriods = function() {
    vm.hold += 1;

    var res = viewService.resolution();
    var periods = periodsService.get('job', res.key);

    viewService.periods(periods.min, periods.max, true);
    viewService.preferredDuration(periods.preference);

    vm.hold -= 1;
  };

  vm.processData = function(data, regex) {
    vm.chartData = [];
    vm.chartDataRate = [];
    vm.tests = [];

    if (!data.tests) {
      return;
    }

    var pattern = null;
    try {
      pattern = new RegExp(regex);
    } catch (e) {
      pattern = '';
    }
    // prepare chart data
    var tests = {};
    var passEntries = [];
    var failEntries = [];
    var skipEntries = [];
    var failRateEntries = [];
    var DEFAULT_FAIL_RATE = 0;

    var date = '';
    for (date in data.tests) {
      if (!data.tests.hasOwnProperty(date)) {
        continue;
      }

      var testsInDate = data.tests[date];
      var totalPass = 0;
      var totalFail = 0;
      var failRate = 0;
      var totalSkip = 0;

      var testName = '';
      for (testName in testsInDate) {
        if (!testsInDate.hasOwnProperty(testName)) {
          continue;
        }

        var testData = testsInDate[testName];
        var cleanTestName = testService.removeIdNoise(testName);
        if (!pattern.test(cleanTestName)) {
          continue;
        }

        if (!tests[cleanTestName]) {
          var testMetrics = {
            name: cleanTestName,
            passes: 0,
            failures: 0,
            skips: 0,
            failuresRate: 0
          };
          tests[cleanTestName] = testMetrics;
        }

        totalPass += testData.pass;
        totalFail += testData.fail;
        totalSkip += testData.skip;

        tests[cleanTestName].passes += testData.pass;
        tests[cleanTestName].failures += testData.fail;
        tests[cleanTestName].skips += testData.skip;

        var successfulTests = tests[cleanTestName].passes;
        var failedTests = tests[cleanTestName].failures;
        var totalTests = successfulTests + failedTests;

        if (totalTests > 0) {
          tests[cleanTestName].failuresRate = ((failedTests * 100) / (totalTests));
        } else {
          tests[cleanTestName].failuresRate = 0;
        }

        if (!tests[cleanTestName].meanRuntime) {
          tests[cleanTestName].meanRuntime = testData.run_time;
        }
        else if (testData.pass > 0) {
          var prevSum = tests[cleanTestName].meanRuntime * (successfulTests - testData.pass);
          var meanRuntime = (testData.run_time + prevSum) / successfulTests;
          tests[cleanTestName].meanRuntime = meanRuntime;
        }
      }

      passEntries.push({
        x: new Date(date).getTime(),
        y: totalPass
      });

      failEntries.push({
        x: new Date(date).getTime(),
        y: totalFail
      });

      failRate = totalFail / (totalFail + totalPass) || DEFAULT_FAIL_RATE;
      failRateEntries.push({
        x: new Date(date).getTime(),
        y: failRate
      });

      skipEntries.push({
        x: new Date(date).getTime(),
        y: totalSkip
      });
    }

    vm.passes = passEntries;
    vm.failures = failEntries;
    vm.skips = skipEntries;
    vm.failRates = failRateEntries;

    vm.tests = Object.keys(tests).map(function(test) {
      return tests[test];
    }).sort(function(x, y) {
      return x.failuresRate < y.failuresRate;
    });
  };

  vm.loadData = function() {
    if (vm.hold > 0) {
      return;
    }

    healthService.getTestsFromBuildName(vm.name, {
      start_date: viewService.periodStart(),
      stop_date: viewService.periodEnd(),
      datetime_resolution: viewService.resolution().key
    }).then(function(response) {
      vm.processData(response.data, vm.searchTest);
      vm.loaded = true;
    });
    healthService.getRecentGroupedRuns('build_name', vm.name).then(function(response) {
      vm.recentRuns = response.data;
    });
  };

  vm.searchTest = $location.search().searchTest || '';

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

  vm.onSearchChange = function() {
    $location.search('searchTest', $scope.job.searchTest).replace();
    vm.loadData();
  };
}

controllersModule.controller('JobController', JobController);

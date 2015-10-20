"use strict";

var controllersModule = require('./_index');

/**
 * @ngInject
 */
function JobController(healthService, jobName, startDate) {
  // ViewModel
  var vm = this;

  vm.searchTest = '';
  vm.name = decodeURIComponent(jobName);

  vm.processData = function(data) {
    vm.chartData = [];
    vm.chartDataRate = [];
    vm.tests = [];

    if (!data.tests) {
      return;
    }

    // prepare chart data
    var tests = {};
    var passEntries = [];
    var failEntries = [];
    var failRateEntries = [];
    var removeTestNameNoise = function(testName) {
      return testName.replace('setUpClass (', '').replace('tearDownClass (', '').replace(')', '');
    };

    var date = '';
    for (date in data.tests) {
      if (!data.tests.hasOwnProperty(date)) {
        continue;
      }

      var testsInDate = data.tests[date];
      var totalPass = 0;
      var totalFail = 0;
      var failRate = 0;

      var testName = '';
      for (testName in testsInDate) {
        if (!testsInDate.hasOwnProperty(testName)) {
          continue;
        }

        var testData = testsInDate[testName];
        var cleanTestName = removeTestNameNoise(testName);

        if (!tests[cleanTestName]) {
          var testMetrics = {
            name: cleanTestName,
            passes: 0,
            failures: 0,
            failuresRate: 0
          };
          tests[cleanTestName] = testMetrics;
        }

        totalPass += testData.pass;
        totalFail += testData.fail;

        tests[cleanTestName].passes += testData.pass;
        tests[cleanTestName].failures += testData.fail;

        var successfulTests = tests[cleanTestName].passes;
        var failedTests = tests[cleanTestName].failures;
        var totalTests = successfulTests + failedTests;

        if (totalTests > 0) {
          tests[cleanTestName].failuresRate = ((failedTests * 100) / (totalTests));
        } else {
          tests[cleanTestName].failuresRate = 0;
        }

        if (!tests[cleanTestName].meanRuntime) {
          tests[cleanTestName].meanRuntime = 0;
        }

        tests[cleanTestName].meanRuntime += testData.run_time;
      }

      passEntries.push({
        x: new Date(date).getTime(),
        y: totalPass
      });

      failEntries.push({
        x: new Date(date).getTime(),
        y: totalFail
      });

      failRateEntries.push({
        x: new Date(date).getTime(),
        y: (totalFail / (totalFail + totalPass)) * 100
      });
    }

    vm.chartData = [
      { key: 'Passes', values: passEntries, color: 'blue' },
      { key: 'Failures', values: failEntries, color: 'red' }
    ];

    vm.chartDataRate = [
      { key: '% Failures', values: failRateEntries }
    ];

    vm.tests = Object.keys(tests).map(function(test) {
      return tests[test];
    }).sort(function(x, y) {
      return x.failuresRate < y.failuresRate;
    });
  };

  vm.loadData = function() {
    var start = new Date(startDate);
    start.setDate(start.getDate() - 1);

    healthService.getTestsFromBuildName(vm.name, {
      start_date: start,
      datetime_resolution: 'hour'
    }).then(function(response) {
      vm.processData(response.data);
    });
  };

  vm.loadData();
}

controllersModule.controller('JobController', JobController);

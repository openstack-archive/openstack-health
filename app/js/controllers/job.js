"use strict";
var _ = require('underscore');
var controllersModule = require('./_index');

/**
 * @ngInject
 */
function JobController(healthService, jobName, startDate) {
  // ViewModel
  var vm = this;

  vm.name = jobName;
  vm.chartData = [];
  vm.chartDataRate = [];
  vm.tests = [];

  vm.processData = function(data) {
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
            failures_rate: 0,
            mean_runtime: 0
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
          tests[cleanTestName].failures_rate = ((failedTests * 100) / (totalTests));
        } else {
          tests[cleanTestName].failures_rate = 0;
        }

        tests[cleanTestName].mean_runtime += testData.run_time;
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

    vm.tests = _.sortBy(tests, function(test) {
      return test.failures_rate * -1;
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

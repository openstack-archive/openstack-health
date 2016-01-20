'use strict';

var controllersModule = require('./_index');
var _ = require('underscore');

/**
 * @ngInject
 */
function TestsController($scope, healthService, testService, $location) {

  // ViewModel
  var vm = this;
  vm.searchTest = '';

  vm.processData = function(data) {
    vm.chartData = {};

    var testsByHierarchy = _.groupBy(data.tests, function(test) {
      var testId = testService.removeIdNoise(test.test_id);
      var keyMatcher = /^(\w*)\./g;
      var matches = keyMatcher.exec(testId);

      if (matches) {
        return matches[1];
      }

      return 'Others';
    });

    var getTestFailureAvg = function(test) {
      return test.failure / test.run_count;
    };

    _.each(testsByHierarchy, function(tests, hierarchy, list) {
      if (!vm.chartData[hierarchy]) {
        vm.chartData[hierarchy] = [{
          key: hierarchy,
          values: [],
          tests: []
        }];
      }

      var orderedTests = _.sortBy(tests, function(test) {
        return getTestFailureAvg(test) * -1;
      });

      var topFailures = _.first(orderedTests, 10);

      topFailures.forEach(function(test) {
        var failureAverage = getTestFailureAvg(test);
        if (!isNaN(failureAverage) && parseFloat(failureAverage) > 0.01) {
          var chartData = {
            label: test.test_id,
            value: failureAverage
          };
          vm.chartData[hierarchy][0].values.push(chartData);
        }
      });

      orderedTests.forEach(function(test) {
        test.failureAverage = getTestFailureAvg(test);
        vm.chartData[hierarchy][0].tests.push(test);
      });
    });
  };

  vm.loadData = function() {
    healthService.getTests().then(function(response) {
      vm.processData(response.data);
    });
  };

  vm.searchTest = $location.search().searchTest || '';

  vm.loadData();

  vm.onSearchChange = function() {
    $location.search("searchTest", $scope.tests.searchTest);
  };
}
controllersModule.controller('TestsController', TestsController);

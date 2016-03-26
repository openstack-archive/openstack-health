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

    var sortedKeys = _.sortBy(_.keys(testsByHierarchy));
    _.each(sortedKeys, function(key) {
      if (!vm.chartData[key]) {
        vm.chartData[key] = [{
          key: key,
          values: [],
          tests: []
        }];
      }
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
    $location.search('searchTest', $scope.tests.searchTest).replace();
  };
}
controllersModule.controller('TestsController', TestsController);

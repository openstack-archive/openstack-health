'use strict';

var controllersModule = require('./_index');

/**
 * @ngInject
 */
function TestsDetailController($scope, healthService, key, $location) {

  // ViewModel
  var vm = this;
  vm.searchTest = $location.search().searchTest || '';
  vm.key = decodeURIComponent(key);
  vm.tests = [];
  vm.limit = 100;
  vm.limitOptions = [100, 250, 500, 1000];
  vm.offset = 0;
  vm.max = 0;
  vm.end = false;
  vm.backAllowed = false;
  vm.nextAllowed = true;

  vm.processData = function(data) {
    var getTestFailureAvg = function(test) {
      return test.failure / test.run_count;
    };

    var sortByTestId = function(a, b) {
      if (a.test_id < b.test_id) {
        return -1;
      } else if (a.test_id > b.test_id) {
        return 1;
      }

      return 0;
    };

    if (data.tests.length !== 0) {
      // only update the list if we actually saw results
      // this way, if the user reaches the end and it happens to line up exactly
      // with the limit, we can still show the last page instead of an empty
      // list
      vm.tests = data.tests;
      vm.tests.sort(sortByTestId).forEach(function(test) {
        test.failureAverage = getTestFailureAvg(test);
      });
    }

    // check if this is the farthest into the db we've seen
    if (vm.offset + data.tests.length > vm.max) {
      vm.max = vm.offset + data.tests.length;
    }

    // check if we've reached the end (fewer tests than expected returned)
    if (data.tests.length < vm.limit) {
      vm.end = true;
      vm.nextAllowed = false;
    } else {
      vm.nextAllowed = true;
    }
  };

  vm.loadData = function() {
    healthService.getTestsByPrefix(key, {
      limit: vm.limit,
      offset: vm.offset
    }).then(function(response) {
      vm.processData(response.data);
    });
  };

  vm.nextPage = function() {
    // the next page only exists if the size of the current tests list == the
    // limit -- if we're on the last page, the # of tests will (probably) be <
    // the limit since the DB ran out of results to return
    if (!vm.tests || vm.tests.length === vm.limit) {
      // we either don't have any results yet, or there's enough that we
      // probably have a next page
      vm.offset += vm.limit;
      vm.backAllowed = true;

      vm.loadData();
    }
  };

  vm.previousPage = function() {
    var newOffset = Math.max(0, vm.offset - vm.limit);
    if (newOffset !== vm.offset) {
      vm.offset = newOffset;
      vm.loadData();

      vm.backAllowed = newOffset !== 0;
    }
  };

  vm.setLimit = function(limit) {
    vm.limit = limit;
    vm.loadData();
  };

  vm.loadData();

  vm.onSearchChange = function() {
    $location.search('searchTest', $scope.testsDetail.searchTest).replace();
  };
}
controllersModule.controller('TestsDetailController', TestsDetailController);

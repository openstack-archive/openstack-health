'use strict';

var controllersModule = require('./_index');

/**
 * @ngInject
 */
function TestsController($scope, healthService, $location) {

  // ViewModel
  var vm = this;
  vm.filter = '';

  vm.processData = function(data) {
    vm.prefixes = data.sort();
  };

  healthService.getTestPrefixes().then(function(response) {
    vm.processData(response.data);
  });
}
controllersModule.controller('TestsController', TestsController);

'use strict';

var controllersModule = require('./_index');

/**
 * @ngInject
 */
function HomeCtrl(datasetService) {

  // ViewModel
  var vm = this;

  datasetService.list().then(function(response) {
    vm.tempest = response.data.tempest;
  });

}

controllersModule.controller('HomeCtrl', HomeCtrl);

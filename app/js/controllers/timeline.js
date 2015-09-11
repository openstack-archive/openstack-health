'use strict';

var controllersModule = require('./_index');

/**
 * @ngInject
 */
function TimelineCtrl($stateParams, datasetService) {

  // ViewModel
  var vm = this;

  datasetService.get($stateParams.datasetId).then(function(dataset) {
    vm.dataset = dataset;
  }, function(reason) {
    vm.error = "Unable to load dataset: " + reason;
  });

}

controllersModule.controller('TimelineCtrl', TimelineCtrl);

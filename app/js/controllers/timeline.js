'use strict';

var controllersModule = require('./_index');

/**
 * @ngInject
 */
function TimelineCtrl() {

  // ViewModel
  var vm = this;

  vm.title = 'Timeline';

}

controllersModule.controller('TimelineCtrl', TimelineCtrl);

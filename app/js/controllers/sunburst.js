'use strict';

var controllersModule = require('./_index');

/**
 * @ngInject
 */
function SunburstCtrl() {

  // ViewModel
  var vm = this;

  vm.title = 'Sunburst';

}

controllersModule.controller('SunburstCtrl', SunburstCtrl);

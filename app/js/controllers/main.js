'use strict';

var controllersModule = require('./_index');

/**
 * @ngInject
 */
function MainCtrl($window, $scope) {
  $window.addEventListener('resize', function () {
    $scope.$broadcast('windowResize');
  });
}

controllersModule.controller('MainCtrl', MainCtrl);

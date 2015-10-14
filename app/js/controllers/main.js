'use strict';

var controllersModule = require('./_index');

/**
 * @ngInject
 */
function MainController($window, $scope) {
  $window.addEventListener('resize', function () {
    $scope.$broadcast('windowResize');
  });
}

controllersModule.controller('MainController', MainController);

'use strict';

var directivesModule = require('./_index.js');

/**
 * @ngInject
 */
function loadingIndicator() {
  return {
    restrict : 'EA',
    templateUrl: 'loading-indicator.html',
    scope: true,

    /**
     * @ngInject
     */
    controller: function($scope) {
      $scope.status = null;

      $scope.$on('loading-started', function() {
        $scope.status = 'loading';
      });

      $scope.$on('loading-complete', function() {
        // errors should be "sticky", so only reset once a request has actually
        // started + finished successfully
        if ($scope.status !== 'error') {
          $scope.status = null;
        }
      });

      $scope.$on('loading-error', function() {
        $scope.status = 'error';
      });
    }
  };
}

directivesModule.directive('loadingIndicator', loadingIndicator);

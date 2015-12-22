'use strict';

var directivesModule = require('./_index.js');

/**
 * @ngInject
 */
function crumbMenu() {
  var link = function(scope, element, attrs, ctrl, transclude) {
    transclude(function(clone) {
      angular.element(element[0].querySelector('nav ul')).append(clone);
    });
  };

  /**
   * @ngInject
   */
  var controller = function($scope, healthService, viewService) {
    $scope.resolutionOptions = viewService.resolutionOptions();
    $scope.selectedResolution = viewService.resolution();
    $scope.selectedGroupKey = viewService.groupKey();
    $scope.groupKeys = [];

    $scope.setResolution = function(resolution) {
      viewService.resolution(resolution);
    };

    $scope.setGroupKey = function(groupKey) {
      viewService.groupKey(groupKey);
    };

    $scope.$on('view:resolution', function(event, resolution) {
      $scope.selectedResolution = resolution;
    });

    $scope.$on('view:groupKey', function(event, groupKey) {
      $scope.selectedGroupKey = groupKey;
    });

    healthService.getRunMetadataKeys().then(function(response) {
      $scope.groupKeys = response.data;
    });
  };

  return {
    restrict: 'E',
    transclude: true,
    templateUrl: 'crumb-menu.html',
    link: link,
    controller: controller,
    scope: {
      'showGroupKey': '@',
      'showResolution': '@'
    }
  };
}

directivesModule.directive('crumbMenu', crumbMenu);

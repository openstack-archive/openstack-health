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
  var controller = function($scope, healthService, viewService, $location) {
    $scope.resolutionOptions = viewService.resolutionOptions();
    $scope.selectedResolution = viewService.resolution();
    $scope.selectedGroupKey = viewService.groupKey();
    $scope.groupKeys = [];
    $scope.periodEnd = viewService.periodEnd();
    $scope.periodOptions = viewService.periodOptions();
    $scope.periods = viewService.periods();
    $scope.duration = viewService.duration();

    var vm = this;
    this.selectedPeriodIndex = '0';
    this.selectedPeriodEnd = viewService.periodEnd();

    var updatePeriodIndex = function() {
      $scope.periodOptions.forEach(function(period, i) {
        if (period + 0 == $scope.duration + 0) {
          vm.selectedPeriodIndex = i.toString();
        }
      });
    };

    updatePeriodIndex();

    $scope.setResolution = function(resolution) {
      viewService.resolution(resolution);
    };

    $scope.setGroupKey = function(groupKey) {
      viewService.groupKey(groupKey);
    };

    $scope.$on('view:resolution', function(event, resolution) {
      $location.search("resolutionKey", resolution.key);
      $scope.selectedResolution = resolution;
    });

    $scope.$on('view:groupKey', function(event, groupKey) {
      $location.search("groupKey", groupKey);
      $scope.selectedGroupKey = groupKey;
    });

    $scope.$on('view:periodEnd', function(event, periodEnd) {
      $scope.periodEnd = periodEnd;
    });

    $scope.$on('view:periods', function(event, periods) {
      $scope.periods = periods;
    });

    $scope.$on('view:duration', function(event, duration, corrected) {
      $scope.duration = duration;
      updatePeriodIndex();
    });

    healthService.getRunMetadataKeys().then(function(response) {
      $scope.groupKeys = response.data;
    });

    $scope.$watch('menu.selectedPeriodEnd', function(val, old) {
      if (val === old) {
        return;
      }

      viewService.periodEnd(val);
    });

    vm.updateIndex = function() {
      var period = $scope.periodOptions[parseInt(vm.selectedPeriodIndex)];
      viewService.userDuration(period);
    };
  };

  return {
    restrict: 'E',
    transclude: true,
    templateUrl: 'crumb-menu.html',
    link: link,
    controller: controller,
    controllerAs: 'menu',
    scope: {
      'showGroupKey': '@',
      'showResolution': '@',
      'showPeriod': '@'
    }
  };
}

directivesModule.directive('crumbMenu', crumbMenu);

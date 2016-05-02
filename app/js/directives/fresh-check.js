'use strict';

var directivesModule = require('./_index.js');

/**
 * @ngInject
 */
function freshCheck() {
  /**
   * @ngInject
   */
  var controller = function($scope, healthService) {
    $scope.status = null;
    $scope.date = null;

    healthService.getRecentGroupedRuns('build_queue', 'gate', {
      num_runs: 1
    }).then(function(response) {
      var lastRun = response.data[0];
      var today = new Date();
      var runDate = new Date(lastRun.start_date);
      var diffSecs = (today - runDate) / 1000;
      var diffDays = diffSecs / (60 * 60 * 24);
      if (diffSecs > (60 * 60 * 24))  {
        $scope.status = 'stale';
        $scope.date = runDate;
      }
    });
  };
  return {
    restrict : 'EA',
    templateUrl: 'templates/fresh-check.html',
    scope: true,
    controller: controller
  };
}

directivesModule.directive('freshCheck', freshCheck);

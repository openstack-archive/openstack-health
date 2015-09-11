'use strict';

var directivesModule = require('./_index.js');

/**
 * @ngInject
 */
function tempestSummary() {
  var controller = function($scope, $attrs, datasetService) {
    // TODO get extra data here
    // (may require raw details, or extra metadata inside config.json)
  };

  return {
    restrict: 'EA',
    scope: {
      'dataset': '='
    },
    controller: controller,
    templateUrl: 'directives/tempest-summary.html'
  };
}

directivesModule.directive('tempestSummary', tempestSummary);

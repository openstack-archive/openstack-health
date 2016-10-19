'use strict';

var d3Scale = require('d3-scale');

var directivesModule = require('./_index.js');

/**
 * @ngInject
 */
function chartDataset() {
  var link = function(scope, el, attrs, ctrl) {
    scope.$watch('data', function(data) {
      if (data) {
        ctrl.setDataset(scope.name, scope.title, data);
      }
    });
  };

  return {
    restrict: 'E',
    require: '^chart',
    link: link,
    scope: {
      name: '@',
      title: '@',
      data: '='
    }
  };
}

directivesModule.directive('chartDataset', chartDataset);

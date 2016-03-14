'use strict';

var directivesModule = require('./_index.js');

/**
 * @ngInject
 */
function chartGaugeHorizontal() {
  var link = function(scope, el, attrs) {
    scope.$on('loading-started', function() {
      el.css({'display' : 'none'});
    });

    scope.$on('loading-complete', function() {
      el.css({'display' : 'block'});
    });

    var canvas = angular.element('<canvas>')[0];
    var width = canvas.width = parseInt(attrs.width);
    var height = canvas.height = parseInt(attrs.height);
    var ctx = canvas.getContext('2d');
    el.append(canvas);

    var update = function(value) {
      if (typeof value === 'undefined') {
        ctx.fillStyle = 'grey';
        ctx.fillRect(0, 0, width, height);
        return;
      }

      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = 'blue';
      ctx.fillRect(0, 0, width * value, height);
    };

    scope.$watch('value', update);
  };

  return {
    restrict: 'EA',
    scope: {
      'value': '=',
      'width': '@',
      'height': '@'
    },
    link: link
  };
}

directivesModule.directive('chartGaugeHorizontal', chartGaugeHorizontal);

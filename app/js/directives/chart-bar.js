'use strict';

var directivesModule = require('./_index.js');

var d3 = require('d3');
var nv = require('nvd3');

/**
 * @ngInject
 */
function chartBar() {
  var link = function(scope, el, attrs) {
    var chart = null;

    var svg = d3.select(el[0]).append('svg')
    .attr('width', attrs.width)
    .attr('height', attrs.height);

    var update = function(data) {
      if (typeof data === "undefined") {
        return;
      }
      var chart = nv.models.discreteBarChart();
      chart.x(function(d) {
        return d.label;
      });
      chart.y(function(d) {
        return d.value;
      });
      chart.staggerLabels(true);

      if (attrs.showvalues) {
        chart.showValues(angular.fromJson(attrs.showvalues));
      }
      if (attrs.showxaxis) {
        chart.showXAxis(angular.fromJson(attrs.showxaxis));
      }
      if (attrs.forcey) {
        chart.forceY(angular.fromJson(attrs.forcey));
      }
      chart.tooltip.gravity('s').chartContainer(el[0]);
      svg.datum(data).call(chart);
    };

    scope.$on('windowResize', function() {
      if (chart !== null) {
        chart.update();
      }
    });

    scope.$watch('data', update);
  };

  return {
    restrict: 'EA',
    scope: {
      'data': '=',
      'width': '@',
      'height': '@'
    },
    link: link
  };
}

directivesModule.directive('chartBar', chartBar);

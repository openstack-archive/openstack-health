'use strict';

var directivesModule = require('./_index.js');

var d3 = require('d3');
var nv = require('nvd3');

/**
 * @ngInject
 */
function chartGauge() {
  var link = function(scope, el, attrs) {
    var chart = null;

    var svg = d3.select(el[0]).append('svg')
        .attr('width', attrs.width)
        .attr('height', attrs.height);

    var update = function(data) {
      if (typeof data === "undefined") {
        return;
      }

      chart = nv.models.pieChart()
          .donut(true)
          .donutRatio(0.4)
          .showLabels(false)
          .showLegend(false)
          .x(function(d) { return d.key; })   // slice label
          .y(function(d) { return d.value; }) // slice value
          .color(function(d) { return d.color; });

      chart.pie
          .startAngle(function(d) { return (d.startAngle / 2) - (Math.PI / 2); })
          .endAngle(function(d) { return (d.endAngle / 2) - (Math.PI / 2); });

      svg.datum(data).call(chart);

      scope.$on('windowResize', function() {
        if (chart !== null) {
          chart.update();
        }
      });
    };

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

directivesModule.directive('chartGauge', chartGauge);

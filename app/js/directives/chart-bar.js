'use strict';

var directivesModule = require('./_index.js');

var d3 = require('d3');
var nv = require('nvd3');

/**
 * @ngInject
 */
function chartBar() {
  var link = function(scope, el, attrs) {
    scope.$on("loading-started", function() {
      el.css({"display" : "none"});
    });

    scope.$on("loading-complete", function() {
      el.css({"display" : "block"});
    });

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

      if (attrs.showValues) {
        chart.showValues(angular.fromJson(attrs.showValues));
      }
      if (attrs.showXAxis) {
        chart.showXAxis(angular.fromJson(attrs.showXAxis));
      }
      if (attrs.forceY) {
        chart.forceY(angular.fromJson(attrs.forceY));
      }
      if (attrs.tickFormatX) {
        chart.yAxis.tickFormat(d3.format(attrs.tickFormatX));
      }
      if (attrs.tickFormatY) {
        chart.yAxis.tickFormat(d3.format(attrs.tickFormatY));
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

'use strict';

var directivesModule = require('./_index.js');

var d3 = require('d3');
var nv = require('nvd3');

/**
 * @ngInject
 */
function chartBarHorizontal() {
  var link = function(scope, el, attrs) {
    scope.$on('loading-started', function() {
      el.css({'display' : 'none'});
    });

    scope.$on('loading-complete', function() {
      el.css({'display' : 'block'});
      if (chart !== null) {
        chart.update();
      }
    });

    var chart = null;

    var svg = d3.select(el[0]).append('svg')
      .attr('width', attrs.width)
      .attr('height', attrs.height)
      .style('width', attrs.width + 'px')
      .style('height', attrs.height + 'px');

    var update = function(data) {
      if (typeof data === 'undefined') {
        return;
      }
      chart = nv.models.multiBarHorizontalChart();
      chart.x(function(d) {
        return d.label;
      });
      chart.y(function(d) {
        return d.value;
      });
      chart.margin({top: 0, right: 5, bottom: 1, left: 5});
      chart.width(300);  // FIXME: this is workaround the for unstable width
      chart.duration(0);
      chart.groupSpacing(0);
      chart.showControls(false);
      chart.showLegend(false);
      chart.showValues(false);
      chart.showXAxis(false);
      chart.showYAxis(false);
      chart.stacked(true);
      chart.yAxis.axisLabel(false);
      chart.yAxis.showMaxMin(false);
      chart.yAxis.tickFormat(d3.format('.2%'));
      chart.yAxis.tickValues(0);
      chart.xAxis.axisLabel(false);
      chart.xAxis.tickValues(0);

      svg.datum(data).call(chart);
      chart.update();
    };

    scope.$on('windowResize', function() {
      if (chart !== null) {
        chart.update();
      }
    });

    scope.$on('viewContentLoaded', function() {
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

directivesModule.directive('chartBarHorizontal', chartBarHorizontal);

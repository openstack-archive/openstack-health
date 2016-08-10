'use strict';

var directivesModule = require('./_index.js');

var d3 = require('d3');
var nv = require('nvd3');

/**
 * @ngInject
 */
function chartMultiBar() {
  var link = function(scope, el, attrs) {
    scope.$on('loading-started', function() {
      el.css({'display' : 'none'});
    });

    scope.$on('loading-complete', function() {
      el.css({'display' : 'block'});
    });

    var chart = null;

    var svg = d3.select(el[0]).append('svg')
    .attr('width', attrs.width)
    .attr('height', attrs.height);

    var update = function(data) {
      if (typeof data === 'undefined') {
        return;
      }
      chart = nv.models.multiBarChart()
        .margin({right: 100})
        .x(function(d) { return d.x; })
        .y(function(d) { return d.y; })
        // FIXME: workaround for this issue: https://github.com/novus/nvd3/pull/1722
        .useInteractiveGuideline(false)
        .stacked(true)
        .rightAlignYAxis(true);
      chart.xAxis.tickFormat(function(d, i) { return d3.time.format('%m/%d %H:%M')(new Date(d)); });

      chart.yAxis.tickFormat(d3.format(',.2f'));
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

directivesModule.directive('chartMultiBar', chartMultiBar);

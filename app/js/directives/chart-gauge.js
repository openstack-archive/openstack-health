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

      var passes = data[0].value;
      var failures = data[1].value;
      var total = passes + failures;
      var DEFAULT_FAIL_RATE = 0;
      var percentOfPasses = (passes / total * 100) || DEFAULT_FAIL_RATE;
      var percentOfFailures = (failures / total * 100) || DEFAULT_FAIL_RATE;
      var passesText = 'Passes: ' + percentOfPasses.toFixed(2) + '%';
      var failuresText = 'Failures: ' + percentOfFailures.toFixed(2) + '%';

      svg.append('text')
          .attr('x', '50%')
          .attr('y', '65%')
          .style('font-size','24px')
          .attr("text-anchor", "middle")
          .text(passesText);
      svg.append('text')
          .attr('x', '50%')
          .attr('y', '80%')
          .style('font-size','24px')
          .attr("text-anchor", "middle")
          .text(failuresText);

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

'use strict';

var directivesModule = require('./_index.js');

var $ = require('jquery');

/**
 * @ngInject
 */
function chartStock() {
  var link = function(scope, el) {
    var chartOptions = {
      chart: { reflow: true, margin: 0 },
      xAxis: {
        categories: []
      },
      yAxis: {
        title: {
          text: 'Counts'
        },
        plotLines: [{
          value: 0,
          width: 1,
          color: '#808080'
        }]
      },
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle',
        borderWidth: 0
      }
    };

    var container = $("<div>")
        .css('min-width', '310px')
        .css('height', '400px')
        .css('margin', '0 auto')
        .highcharts('StockChart', chartOptions)
        .appendTo(el);

    var chart = container.highcharts();

    scope.$watch("projectEntries", function(entries) {
      if (typeof entries === "undefined") {
        return;
      }

      chart.addSeries({
        name: "Pass",
        data: entries.map(function(e) { return e.pass; })
      });
      chart.addSeries({
        name: "Fail",
        data: entries.map(function(e) { return e.fail; })
      });
      chart.xAxis[0].setCategories(entries.map(function(e) { return e.range; }));

      chart.setSize(container.width(), 400);
    });
  };

  return {
    restrict: 'EA',
    scope: {
      'projectEntries': '='
    },
    link: link
  };
}

directivesModule.directive('chartStock', chartStock);

'use strict';

var directivesModule = require('./_index.js');

var Highcharts = require('highcharts');
var $ = require('jquery');

/**
 * @ngInject
 */
function chartGauge() {
  var link = function(scope, el) {
    var chartOptions = {
      chart: { type: 'solidgauge' },
      title: scope.project.name,
      pane: {
        center: ['50%', '85%'],
        size: '140%',
        startAngle: -90,
        endAngle: 90,
        background: {
          backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || '#EEE',
          innerRadius: '60%',
          outerRadius: '100%',
          shape: 'arc'
        }
      },
      tooltip: { enabled: false },
      yAxis: {
        min: 0,
        max: 100,
        stops: [
          [0.6, '#DF5353'], // red
          [0.8, '#DFDF00'], // yellow
          [1.0, '#00BF00']  // green
        ],
        lineWidth: 0,
        minorTickInterval: null,
        tickPixelInterval: 400,
        tickWidth: 0,
        labels: { y: 16 },
        title: {
          y: -70,
          text: scope.projectname
        }
      },
      plotOptions: {
        solidgauge: {
          dataLabels: {
            y: 5,
            borderWidth: 0,
            useHTML: true
          }
        }
      },
      credits: { enabled: false }
    };

    var container = $("<div>")
        .css('width', '300px')
        .css('height', '200px')
        .css('margin', '0 auto')
        .highcharts(chartOptions)
        .appendTo(el);

    var total = scope.project.pass + scope.project.fail;

    var chart = container.highcharts();
    chart.setTitle(scope.project.name);
    chart.addSeries({
      name: "Pass %",
      data: [ 100 * (scope.project.pass / total) ],
      dataLabels: {
        format: '%'
      }
    });
  };

  return {
    restrict: 'EA',
    scope: {
      'project': '='
    },
    link: link
  };
}

directivesModule.directive('chartGauge', chartGauge);

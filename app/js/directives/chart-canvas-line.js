'use strict';

var directivesModule = require('./_index.js');

/**
 * @ngInject
 */
function chartCanvasLine() {
  var link = function(scope, el, attrs, ctrl) {
    var base = ctrl.createCanvas(ctrl.width, ctrl.height, false);
    var baseDirty = false;

    var overlay = ctrl.createCanvas(ctrl.width, ctrl.height, false);
    var overlayDirty = false;

    var stroke = scope.stroke || 'black';
    var lineWidth = scope.lineWidth || 1;

    var dataset = null;
    var screenX = null;
    var screenY = null;
    var dataX = null;
    var dataY = null;

    var nearest = null;

    function updateAxes() {
      dataset = ctrl.datasets[scope.dataset];
      if (!dataset) {
        return;
      }

      var axes = scope.axes.split(/[\s,]+/).map(function(name) {
        return ctrl.axes[name];
      });
      screenX = axes.find(function(a) { return a.orient === 'horizontal'; });
      screenY = axes.find(function(a) { return a.orient === 'vertical'; });

      dataX = ctrl.data(dataset.name, screenX.name);
      dataY = ctrl.data(dataset.name, screenY.name);
    }

    function renderBase() {
      var dataset = ctrl.datasets[scope.dataset];
      if (!dataset) {
        return;
      }

      var ctx = base.ctx;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth * base.ratio;

      ctx.beginPath();
      ctx.moveTo(screenX.scale(dataX[0]), screenY.scale(dataY[0]));
      for (var i = 1; i < dataX.length; i++) {
        ctx.lineTo(screenX.scale(dataX[i]), screenY.scale(dataY[i]));
      }

      ctx.stroke();

      baseDirty = false;
    }

    function renderOverlay() {
      var ctx = overlay.ctx;
      ctx.clearRect(0, 0, overlay.canvas.width, overlay.canvas.height);

      if (nearest) {
        ctx.fillStyle = 'rgba(50, 50, 50, 0.15)';
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.75)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.arc(
          screenX.scale(screenX.mapper(nearest)),
          screenY.scale(screenY.mapper(nearest)),
          5 * overlay.ratio,
          0, Math.PI * 2
        );

        ctx.fill();
        ctx.stroke();
      }

      overlayDirty = false;
    }

    function handleUpdate() {
      updateAxes();

      baseDirty = true;
      overlayDirty = true;
    }

    scope.$on('render', function(event, canvas) {
      if (baseDirty) {
        renderBase();
      }

      canvas.ctx.drawImage(base.canvas, 0, 0);
    });

    scope.$on('renderOverlay', function(event, canvas) {
      if (overlayDirty) {
        renderOverlay();
      }

      canvas.ctx.drawImage(overlay.canvas, 0, 0);
    });

    scope.$on('update', handleUpdate);

    scope.$on('resize', function(event, width, height) {
      base.resize(width, height);
      overlay.resize(width, height);
    });

    scope.$on('mousemove', function(event, p) {
      if (!dataset) {
        return;
      }

      nearest = ctrl.nearestPoint(p, dataset, screenX, screenY, 10 * base.ratio);
      overlayDirty = true;
      ctrl.render();

      if (nearest) {
        ctrl.tooltips.set(dataset.name, {
          points: [nearest],
          style: stroke
        });
      } else {
        ctrl.tooltips.delete(dataset.name);
      }
    });

    scope.$on('mouseout', function() {
      if (!dataset) {
        return;
      }

      nearest = null;
      overlayDirty = true;
      ctrl.render();

      ctrl.tooltips.delete(dataset.name);
    });
  };

  return {
    restrict: 'E',
    require: '^chart',
    link: link,
    scope: {
      dataset: '@',
      axes: '@',
      lineWidth: '=',
      stroke: '@'
    }
  };
}

directivesModule.directive('chartCanvasLine', chartCanvasLine);

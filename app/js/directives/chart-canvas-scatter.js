'use strict';

var directivesModule = require('./_index.js');

/**
 * @ngInject
 */
function chartCanvasScatter() {
  var link = function(scope, el, attrs, ctrl) {
    var base = ctrl.createCanvas(ctrl.width, ctrl.height, false);
    var baseDirty = true;

    var overlay = ctrl.createCanvas(ctrl.width, ctrl.height, false);
    var overlayDirty = true;

    var fill = scope.fill || 'blue';
    var stroke = scope.stroke || 'blue';
    var lineWidth = scope.lineWidth || 1;
    var radius = scope.radius || 1;

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
      if (!dataX || !dataY) {
        return;
      }

      var ctx = base.ctx;
      ctx.clearRect(0, 0, base.canvas.width, base.canvas.height);

      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;

      for (var i = 0; i < dataX.length; i++) {
        ctx.beginPath();
        ctx.arc(
          screenX.scale(dataX[i]), screenY.scale(dataY[i]),
          radius * base.ratio,
          0, Math.PI * 2
        );

        if (scope.fill) {
          ctx.fill();
        }

        if (scope.stroke) {
          ctx.stroke();
        }
      }

      baseDirty = false;
    }

    function renderOverlay() {
      var ctx = overlay.ctx;
      ctx.clearRect(0, 0, overlay.canvas.width, overlay.canvas.height);

      if (nearest) {
        ctx.fillStyle = 'rgba(50, 50, 50, 0.25)';
        ctx.strokeStyle = 'rgba(100, 100, 100, 1.0)';
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
          style: fill
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
      radius: '=',
      lineWidth: '=',
      fill: '@',
      stroke: '@'
    }
  };
}

directivesModule.directive('chartCanvasScatter', chartCanvasScatter);

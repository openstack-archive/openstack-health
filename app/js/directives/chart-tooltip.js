'use strict';

var d3Array = require('d3-array');

var directivesModule = require('./_index.js');

function capToRange(preferredPosition, size, axis) {
  var range = axis.range();
  var axisMin = Math.min(range[0], range[1]);
  var axisMax = Math.max(range[0], range[1]);

  if (preferredPosition < axisMin) {
    return axisMin;
  } else if (preferredPosition + size > axisMax) {
    return axisMax - size;
  } else {
    return preferredPosition;
  }
}

function fitsInAxis(choice) {
  var range = choice.axis.range();
  var axisMin = Math.min(range[0], range[1]);
  var axisMax = Math.max(range[0], range[1]);

  return choice.pos >= axisMin && choice.pos + choice.size < axisMax;
}

function decideOrientation(gravity, width, height, point, hAxis, vAxis) {
  var padding = 15;
  var choices = {
    left:   { pos: point.x - padding - width, size: width, axis: hAxis },
    right:  { pos: point.x + padding, size: width, axis: hAxis },
    top:    { pos: point.y - padding - height, size: height, axis: vAxis },
    bottom: { pos: point.y + padding, size: height, axis: vAxis }
  };

  if (fitsInAxis(choices[gravity])) {
    return choices[gravity];
  } else {
    // this would be better if it explicitly picked the axis opposite the
    // requested gravity, but we'll pick the first acceptable alignment for
    // simplicity
    var valid = Object.keys(choices).find(function(choiceName) {
      return fitsInAxis(choices[choiceName]);
    });

    if (valid) {
      return choices[valid];
    } else {
      return choices.right;
    }
  }
}

function computePosition(gravity, width, height, point, hAxis, vAxis) {
  // attempt to center the tooltip relative to the mouse along the opposite axis
  // if the rect falls outside the axes we can move it without worrying about
  // the cursor getting in the way
  var centerX = capToRange(point.x - width / 2, width, hAxis);
  var centerY = capToRange(point.y - height / 2, height, vAxis);

  // attempt to position along the primary axis based on user-specified gravity
  // this will be overridden if it won't fit to prevent being covered by the
  // cursor
  var orient = decideOrientation(gravity, width, height, point, hAxis, vAxis);
  if (orient.axis === hAxis) {
    return { x: orient.pos, y: centerY };
  } else { // orientation.axis === vAxis
    return { x: centerX, y: orient.pos };
  }
}

/**
 * @ngInject
 */
function chartTooltip() {
  var link = function(scope, el, attrs, ctrl) {
    var overlay = ctrl.createCanvas(ctrl.width, ctrl.height, false);
    var overlayDirty = false;

    function renderOverlay() {
      var r = overlay.ratio;
      var ctx = overlay.ctx;
      ctx.clearRect(0, 0, overlay.canvas.width, overlay.canvas.height);

      var primary = ctrl.axes[scope.primary];
      var secondary = ctrl.axes[scope.secondary];

      var primaryFormat = primary.granularFormat || primary.scale.tickFormat();
      var secondaryFormat = secondary.granularFormat || secondary.scale.tickFormat();

      var secondaryValues = [];
      var points = [];
      ctrl.tooltips.forEach(function(v, k) {
        v.points.forEach(function(point) {
          points.push(point);

          var mapped = secondary.mapper(point);
          secondaryValues.push({
            text: secondaryFormat(mapped),
            datasetTitle: ctrl.datasets[k].title,
            style: v.style
          });
        });
      });

      if (points.length === 0) {
        return;
      }

      var fontNormal = Math.floor(12 * r) + 'px sans-serif';
      var fontBold = 'bold ' + fontNormal;

      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.font = fontBold;

      // measure widths needed for bounding box
      var primaryMean = d3Array.mean(points, primary.mapper);
      var primaryFormatted = primaryFormat(primaryMean);
      var primaryWidth = ctx.measureText(primaryFormatted).width;

      ctx.font = fontNormal;
      var maxNameWidth = d3Array.max(secondaryValues.map(function(v) {
        return ctx.measureText(v.datasetTitle).width;
      }));

      ctx.font = fontBold;
      var maxValueWidth = d3Array.max(secondaryValues.map(function(v) {
        return ctx.measureText(v.text).width;
      }));

      var padding = 5 * r;
      var rowSize = 18 * r;

      // find the bounding box
      var width = Math.floor(Math.max(
          2 * padding + primaryWidth,
          4 * padding + rowSize + maxNameWidth + maxValueWidth)) + 1;
      var height = Math.floor(
          (rowSize + padding) * (points.length + 1) + padding) + 1;

      var gravity = scope.gravity || 'right';
      var hAxis = primary.orient === 'horizontal' ? primary : secondary;
      var vAxis = primary.orient === 'vertical' ? primary : secondary;
      var pos = computePosition(
          gravity, width, height, ctrl.mousePoint,
          hAxis.scale, vAxis.scale);
      var x = Math.floor(pos.x);
      var y = Math.floor(pos.y);

      // draw tooltip box
      ctx.strokeStyle = 'black';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.moveTo(x + 0.5, y + 0.5);
      ctx.lineTo(x + width + 0.5, y + 0.5);
      ctx.lineTo(x + width + 0.5, y + height + 0.5);
      ctx.lineTo(x + 0.5, y + height + 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // draw the header
      ctx.fillStyle = 'black';
      ctx.font = fontBold;
      ctx.fillText(primaryFormatted, x + padding, y + padding + rowSize / 2);

      ctx.font = fontNormal;
      for (var row = 0; row < points.length; row++) {
        var value = secondaryValues[row];
        var rowY = y + padding + (rowSize + padding) * (row + 1);

        // draw colored square
        ctx.fillStyle = value.style;
        ctx.beginPath();
        ctx.moveTo(x + padding + 0.5, rowY + 0.5);
        ctx.lineTo(x + padding + rowSize + 0.5, rowY + 0.5);
        ctx.lineTo(x + padding + rowSize + 0.5, rowY + rowSize + 0.5);
        ctx.lineTo(x + padding + 0.5, rowY + rowSize + 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // draw dataset label
        ctx.font = fontNormal;
        ctx.fillStyle = 'black';
        ctx.fillText(
            value.datasetTitle,
            x + 2 * padding + rowSize,
            rowY + rowSize / 2);

        // draw value label
        ctx.font = fontBold;
        ctx.fillText(
          value.text,
          x + 3 * padding + rowSize + maxNameWidth,
          rowY + rowSize / 2);
      }

      overlayDirty = false;
    }

    scope.$on('renderOverlay', function(event, canvas) {
      if (overlayDirty) {
        renderOverlay();
      }

      canvas.ctx.drawImage(overlay.canvas, 0, 0);
    });

    scope.$on('update', renderOverlay);

    scope.$on('resize', function(event, width, height) {
      overlay.resize(width, height);
    });

    scope.$on('mousemove', function() {
      overlayDirty = true;
      ctrl.render();
    });

    scope.$on('mouseout', function() {
      overlayDirty = true;
      ctrl.render();
    });
  };

  return {
    restrict: 'E',
    require: '^chart',
    link: link,
    scope: {
      primary: '@',
      secondary: '@',
      gravity: '@'
    }
  };
}

directivesModule.directive('chartTooltip', chartTooltip);

'use strict';

var d3Scale = require('d3-scale');
var d3Format = require('d3-format');
var d3TimeFormat = require('d3-time-format');

var directivesModule = require('./_index.js');

function mapperFromPath(path) {
  return function(object) {
    if (path.startsWith('.')) {
      path = path.substring(1);
    }

    var parts = path.split('.');
    var current = object;
    for (var i = 0; i < parts.length; i++) {
      current = current[parts[i]];
    }

    return current;
  };
}

// amounts (in scaled pixels) to extend the in-canvas padding depending on
// axis alignment. these are hand-selected 'reasonable' values for now, but
// could be computed automatically in the future by measuring tick text lenths
var paddingSizes = {
  top: { top: 15, bottom: 10 },
  bottom: { bottom: 15, top: 10 },
  left: { left: 25, right: 20 },
  right: { right: 25, left: 20 }
};

var textAlignMap = {
  top: 'center',
  bottom: 'center',
  left: 'end',
  right: 'start'
};

var textBaselineMap = {
  top: 'bottom',
  bottom: 'top',
  left: 'middle',
  right: 'middle'
};

// directional unit vectors used to compute axis offsets for label placement
var orthoVectors = {
  top: [0, -1],
  bottom: [0, 1],
  left: [-1, 0],
  right: [1, 0]
};

var oppositeAlignMap = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left'
};

function screenCoordsForAxis(orient, align, self, opposite) {
  var selfRange = self.range();
  var oppositeRange = opposite.range();

  var norm = align === 'left' || align === 'top';
  var vertical = orient === 'vertical';
  var oppositeIndex = vertical ? norm ? 0 : 1 : norm ? 1 : 0;
  var oppositeCoord = oppositeRange[oppositeIndex];

  var start = [selfRange[norm ? 1 : 0], oppositeCoord];
  var end = [selfRange[norm ? 0 : 1], oppositeCoord];

  // for vertical axes, start and end map to (y, x) and should be flipped
  if (vertical) {
    start.reverse();
    end.reverse();
  }

  var tick = function(value) {
    var selfCoord = self(value);
    var direction = norm;
    if (!vertical) {
      direction = !direction;
    }

    var tickStart = [selfCoord, oppositeRange[direction ? 0 : 1]];
    var tickEnd = [selfCoord, oppositeRange[direction ? 1 : 0]];
    if (vertical) {
      tickStart.reverse();
      tickEnd.reverse();
    }

    return {
      start: tickStart, end: tickEnd
    };
  };

  return { start: start, end: end, tick: tick };
}

function labelOffset(point, align, amount) {
  var vec = orthoVectors[align];
  return [point[0] + amount * vec[0], point[1] + amount * vec[1]];
}

function clamp(point, axis, extent, size) {
  point = point.slice(); // don't modify original

  var min = Math.min(extent[0], extent[1]);
  var max = Math.max(extent[0], extent[1]);
  var half = size / 2;

  var index = (axis === 'x') ? 0 : 1;
  if (point[index] - half < min) {
    point[index] = min + half;
  } else if (point[index] + half > max) {
    point[index] = max - half;
  }

  return point;
}

function formatter(type, specifier) {
  // d3's formatters aren't as lenient as printf() and only format a single
  // value. we want to be able to show a suffix (for units, etc) so we'll add
  // our own using '|' as a field separator
  var tokens = specifier.split('|', 2);
  var suffix = '';
  if (tokens.length == 2) {
    suffix = tokens[1];
  }

  var func = (type === 'time' ? d3TimeFormat.timeFormat : d3Format.format);
  var format = func(tokens[0]);
  return function(input) {
    return format(input) + suffix;
  };
}

/**
 * @ngInject
 */
function chartAxis() {
  var link = function(scope, el, attrs, ctrl) { // eslint-disable-line complexity
    var background = ctrl.createCanvas(ctrl.width, ctrl.height, false);

    var scale = null;
    if (scope.type === 'linear') {
      scale = d3Scale.scaleLinear();
    } else if (scope.type === 'time') {
      scale = d3Scale.scaleTime();
    } else {
      throw new Error('Unsupported scale type: ' + scope.type);
    }

    if (!scope.mapper && !scope.path) {
      throw new Error('A mapper function or path is required!');
    }

    var orient = scope.orient;
    var mapper = scope.mapper || mapperFromPath(scope.path);
    var grid = typeof scope.grid === 'undefined' ? true : scope.grid;
    var draw = typeof scope.draw === 'undefined' ? false : scope.draw;
    var labels = typeof scope.labels === 'undefined' ? true : scope.labels;

    // canvas renderers aggressively anti-alias by default making straight lines
    // blurry, offsetting points by 0.5 works around the issue
    var crispy = function(d) { return Math.floor(d) + 0.5; };

    var coarseFormat = null;
    if (scope.coarseFormat) {
      coarseFormat = formatter(scope.type, scope.coarseFormat);
    }

    var granularFormat = null;
    if (scope.granularFormat) {
      granularFormat = formatter(scope.type, scope.granularFormat);
    }

    var align;
    if (scope.align) {
      align = scope.align;
    } else if (orient === 'horizontal') {
      align = 'left';
    } else { // orient === 'vertical'
      align = 'bottom';
    }

    ctrl.setAxis(
        scope.name, scale, mapper, orient, scope.domain,
        coarseFormat, granularFormat);
    ctrl.pushPadding(paddingSizes[align]);

    var font = Math.floor(10 * background.ratio) + 'px sans-serif';

    function renderBackground() {
      background.resize(ctrl.width, ctrl.height);

      var axis = ctrl.axes[scope.name];
      var ticks = axis.scale.ticks(scope.ticks || 5);
      var opposite = ctrl.axes[scope.opposes];
      var tickFormat = coarseFormat || axis.scale.tickFormat();

      var point = screenCoordsForAxis(orient, align, axis.scale, opposite.scale);

      var ctx = background.ctx;
      ctx.strokeStyle = scope.stroke || 'black';
      ctx.font = font;

      if (draw) {
        ctx.lineWidth = scope.lineWidth || 1;
        ctx.beginPath();
        ctx.moveTo.apply(ctx, point.start.map(crispy));
        ctx.lineTo.apply(ctx, point.end.map(crispy));
        ctx.stroke();
      }

      // not going to bother DPI scaling the line, it (subjectively) seems
      // nicer to keep it 1 pixel wide
      ctx.lineWidth = 1;
      ticks.forEach(function(tick) {
        var tickPoint = point.tick(tick);

        if (grid) {
          ctx.globalAlpha = 0.1;
          ctx.beginPath();
          ctx.moveTo.apply(ctx, tickPoint.start.map(crispy));
          ctx.lineTo.apply(ctx, tickPoint.end.map(crispy));
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        if (labels) {
          var pos = labelOffset(tickPoint.start, align, 5).map(crispy);
          ctx.textBaseline = textBaselineMap[align];
          ctx.textAlign = textAlignMap[align];

          ctx.fillText(tickFormat(tick), pos[0], pos[1]);
        }
      });
    }

    scope.$on('update', renderBackground);

    scope.$on('renderBackground', function(event, canvas) {
      canvas.ctx.drawImage(background.canvas, 0, 0);
    });

    scope.$on('renderOverlay', function(event, canvas) {
      if (ctrl.mousePoint && ctrl.mousePoint.inBounds) {
        var axis = ctrl.axes[scope.name];
        var opposite = ctrl.axes[scope.opposes];
        var mouseAxis = (orient === 'horizontal') ? 'x' : 'y';
        var value = axis.scale.invert(ctrl.mousePoint[mouseAxis]);
        var flipped = oppositeAlignMap[align];

        var point = screenCoordsForAxis(orient, flipped, axis.scale, opposite.scale);
        var tick = point.tick(value);

        var ctx = canvas.ctx;
        ctx.lineWidth = 1;
        ctx.strokeStyle = scope.stroke || 'black';
        ctx.globalAlpha = 0.25;
        ctx.font = font;

        ctx.beginPath();
        ctx.moveTo.apply(ctx, tick.start.map(crispy));
        ctx.lineTo.apply(ctx, tick.end.map(crispy));
        ctx.stroke();

        ctx.globalAlpha = 1.0;

        var format = granularFormat || axis.scale.tickFormat();
        var labelPos = labelOffset(tick.start, flipped, 5);

        var formatted = format(value);
        var size;
        if (orient === 'horizontal') {
          size = ctx.measureText(formatted).width;
        } else {
          size = ctx.measureText('m').width; // meh
        }

        var metricsAxis = (orient === 'horizontal') ? 'width' : 'height';
        labelPos = clamp(labelPos, mouseAxis, axis.scale.range(), size);

        ctx.textBaseline = textBaselineMap[flipped];
        ctx.textAlign = textAlignMap[flipped];
        ctx.fillText(format(value), labelPos[0], labelPos[1]);
      }
    });
  };

  return {
    restrict: 'E',
    require: '^chart',
    link: link,
    scope: {
      name: '@',
      opposes: '@',
      type: '@',
      domain: '=',
      range: '=',
      path: '@',
      mapper: '=',
      orient: '@',
      align: '@',
      lineWidth: '=',
      ticks: '=',
      stroke: '@',
      grid: '=',
      draw: '=',
      labels: '=',
      coarseFormat: '@',
      granularFormat: '@'
    }
  };
}

directivesModule.directive('chartAxis', chartAxis);

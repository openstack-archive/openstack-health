'use strict';

var d3Array = require('d3-array');

var directivesModule = require('./_index.js');

/**
 * @ngInject
 */
function chart($window) {

  /**
   * @ngInject
   */
  var controller = function($scope) {
    var self = this;
    self.canvas = null;
    self.padding = { top: 10, right: 25, bottom: 10, left: 25 };
    self.margin = { top: 0, right: 0, bottom: 0, left: 0 };
    self.axes = {};
    self.datasets = {};
    self.tooltips = new Map();
    self.linked = false;
    self.mousePoint = null;
    self.mousePointDirty = false;
    self.dragging = false;

    /**
     * Creates an empty canvas with the specified width and height, returning
     * the element and its 2d context. The element will not be appended to the
     * document and may be used for offscreen rendering.
     * @param  {number}  [w]   the canvas width in px, or null
     * @param  {number}  [h]   the canvas height in px, or null
     * @param  {boolean} scale if true, scale all drawing operations based on
     *                         the current device pixel ratio
     * @return {object}        an object containing the canvas, its 2d context,
     *                         and other properties
     */
    self.createCanvas = function(w, h, scale) {
      w = w || self.width + self.margin.left + self.margin.right;
      h = h || 200 + self.margin.top + self.margin.bottom;
      if (typeof scale === 'undefined') {
        scale = true;
      }

      /** @type {HTMLCanvasElement} */
      var canvas = angular.element('<canvas>')[0];
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';

      /** @type {CanvasRenderingContext2D} */
      var ctx = canvas.getContext('2d');
      var devicePixelRatio = $window.devicePixelRatio || 1;

      canvas.ratio = devicePixelRatio;
      canvas.width = w * devicePixelRatio;
      canvas.height = h * devicePixelRatio;

      if (scale) {
        ctx.scale(ratio, devicePixelRatio);
      }

      var resize = function(w, h) {
        canvas.width = w * devicePixelRatio;
        canvas.style.width = w + 'px';
        if (typeof h !== 'undefined') {
          canvas.height = h * devicePixelRatio;
          canvas.style.height = h + 'px';
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        if (scale) {
          ctx.scale(devicePixelRatio, devicePixelRatio);
        }
      };

      return {
        canvas: canvas, ctx: ctx,
        scale: scale, ratio: devicePixelRatio, resize: resize
      };
    };

    /**
     * For each (axis, dataset) combination, creates a cache of mapped values
     * and calculates extents. If no explicit domain is specified, axes will
     * have their domains set to fit the extent of the data and expanded as per
     * d3-scale's `scale.nice()`.
     */
    self.recalc = function() {
      angular.forEach(self.axes, function(axis) {
        var mins = [];
        var maxes = [];

        angular.forEach(self.datasets, function(dataset) {
          var mapped = dataset.data.map(axis.mapper);
          var extent = d3Array.extent(mapped);
          mins.push(extent[0]);
          maxes.push(extent[1]);

          dataset.mapped[axis.name] = mapped;
          dataset.extent[axis.name] = extent;
        });

        axis.extent = [ d3Array.min(mins), d3Array.max(maxes) ];

        if (axis.domain) {
          axis.scale.domain(axis.domain);
        } else {
          axis.scale.domain(axis.extent).nice();
        }
      });
    };

    self.setAxis = function(
          name, scale, mapper, orient, domain, coarseFormat, granularFormat) {
      self.axes[name] = {
        name: name,
        scale: scale,
        mapper: mapper,
        orient: orient,
        domain: domain,
        extent: null,
        coarseFormat: coarseFormat,
        granularFormat: granularFormat
      };

      // recalc is called at the end of link, don't do it here if not necessary
      if (self.linked) {
        self.recalc();
        self.update();
      }
    };

    self.setDataset = function(name, title, data) {
      self.datasets[name] = {
        name: name,
        title: title,
        data: data,
        mapped: {},
        extent: {}
      };

      if (self.linked) {
        self.recalc();
        self.update();
      }
    };

    /**
     * Adds the value of each named prop of `diff` to the current padding.
     * For example, a `diff` of `{ top: 10 }` will add 10 to the current
     * padding's `top` field.
     * @param  {object} diff an object containing named values to add
     */
    self.pushPadding = function(diff) {
      Object.keys(diff).forEach(function(key) {
        self.padding[key] += diff[key];
      });
    };

    /**
     * Returns data from `datasetName` as mapped for use with `axisName`.
     * @param  {string} datasetName the name of the dataset
     * @param  {string} axisName    the name of the axis
     * @return {number[]}           a list of values
     */
    self.data = function(datasetName, axisName) {
      var dataset = self.datasets[datasetName];
      return dataset.mapped[axisName];
    };

    self.dataNearAxis = function(point, dataset, axisX, radius) {
      var xMin = axisX.scale.invert(point.x - radius);
      var xMax = axisX.scale.invert(point.x + radius);

      var bisectorX = d3Array.bisector(axisX.mapper);

      return dataset.data.slice(
        bisectorX.left(dataset.data, xMin),
        bisectorX.right(dataset.data, xMax)
      );
    };

    self.nearestPoint = function(point, dataset, axisX, axisY, radius) {
      // it would be simpler to do an array intersection with two calls to
      // dataNearAxis(), but then we'll need to bisect the entire dataset twice
      // instead, we can filter the now-filtered list to save some cycles
      var nearX = self.dataNearAxis(point, dataset, axisX, radius);
      var radiusSq = radius * radius;

      var dist = function(d) {
        return Math.pow(axisX.scale(axisX.mapper(d)) - point.x, 2) +
            Math.pow(axisY.scale(axisY.mapper(d)) - point.y, 2);
      };

      var candidates = nearX.map(function(d) {
        return { datum: d, distanceSq: dist(d) };
      }).filter(function(d) {
        return d.distanceSq < radiusSq;
      }).sort(function(a, b) {
        return a.distanceSq - b.distanceSq;
      });

      if (candidates.length === 0) {
        return null;
      } else {
        return candidates[0].datum;
      }
    };

    self.update = function() {
      $scope.$broadcast('update');
      self.render();
    };

    /**
     * Request an animation frame from the browser, and call all registered
     * animation callbacks when it occurs. If an animation has already been
     * requested but has not completed, this method will return immediately.
     */
    self.render = function() {
      if (self.renderId) {
        return;
      }

      self.renderId = requestAnimationFrame(function(timestamp) {
        if (self.mousePointDirty) {
          if (self.mousePoint) {
            $scope.$broadcast('mousemove', self.mousePoint);
          }

          self.mousePointDirty = false;
        }

        self.canvas.ctx.clearRect(
            0, 0,
            self.canvas.canvas.width, self.canvas.canvas.height);

        $scope.$broadcast('renderBackground', self.canvas, timestamp);
        $scope.$broadcast('render', self.canvas, timestamp);
        $scope.$broadcast('renderOverlay', self.canvas, timestamp);
        self.renderId = null;
      });
    };
  };

  var link = function(scope, el, attrs, ctrl) {
    el.css('display', 'block');
    el.css('width', attrs.width);
    el.css('height', attrs.height);

    var updateSize = function() {
      var style = getComputedStyle(el[0]);

      ctrl.width = el[0].clientWidth -
          ctrl.margin.left -
          ctrl.margin.right -
          parseFloat(style.paddingLeft) -
          parseFloat(style.paddingRight);

      ctrl.height = el[0].clientHeight -
          ctrl.margin.top -
          ctrl.margin.bottom -
          parseFloat(style.paddingTop) -
          parseFloat(style.paddingBottom);

      if (ctrl.canvas) {
        ctrl.canvas.resize(ctrl.width, ctrl.height);
      }

      var scale = $window.devicePixelRatio || 1;
      angular.forEach(ctrl.axes, function(axis) {
        if (axis.orient === 'vertical') {
          // swapped for screen y
          axis.scale.range([
            (ctrl.height - ctrl.padding.bottom) * scale,
            ctrl.padding.top * scale
          ]);
        } else if (axis.orient === 'horizontal') {
          axis.scale.range([
            ctrl.padding.left * scale,
            (ctrl.width - ctrl.padding.right) * scale
          ]);
        }
      });

      scope.$broadcast('resize', ctrl.width, ctrl.height);
    };

    updateSize();
    scope.$on('windowResize', function() {
      updateSize();
      ctrl.update();
    });

    var createMouseEvent = function(evt) {
      var r = ctrl.canvas.canvas.getBoundingClientRect();
      var ratio = ctrl.canvas.ratio;
      var ret = {
        x: (evt.clientX - r.left) * ratio,
        y: (evt.clientY - r.top) * ratio,
        dragging: ctrl.dragging
      };

      ret.inBounds =
          ret.x > ratio * ctrl.padding.left &&
          ret.x < ratio * (ctrl.width - ctrl.padding.right) &&
          ret.y > ratio * ctrl.padding.top &&
          ret.y < ratio * (ctrl.height - ctrl.padding.bottom);

      return ret;
    };

    ctrl.canvas = ctrl.createCanvas(ctrl.width, ctrl.height, false);
    ctrl.canvas.canvas.unselectable = 'on';
    ctrl.canvas.canvas.onselectstart = function() { return false; };
    ctrl.canvas.canvas.style.userSelect = 'none';
    el.append(ctrl.canvas.canvas);

    ctrl.canvas.canvas.addEventListener('mousedown', function(evt) {
      evt.preventDefault();
      ctrl.dragging = true;
      ctrl.mousePoint = createMouseEvent(evt);
      scope.$broadcast('mousedown', ctrl.mousePoint);
    });

    ctrl.canvas.canvas.addEventListener('mouseup', function(evt) {
      // note: this may not give correct behavior for off-canvas drags
      ctrl.dragging = false;
      ctrl.mousePoint = createMouseEvent(evt);
      scope.$broadcast('mouseup', ctrl.mousePoint);
    });

    ctrl.canvas.canvas.addEventListener('mousemove', function(evt) {
      // move events can occur more often than redraws, so we'll delay event
      // dispatching to the beginning of render(), and call render() for every
      // movement event
      // note that in some situations this could cause events to be executed
      // out-of-order

      ctrl.mousePointDirty = true;
      ctrl.mousePoint = createMouseEvent(evt);
      ctrl.render();
    });

    ctrl.canvas.canvas.addEventListener('mouseout', function(evt) {
      ctrl.mousePoint = null;
      scope.$broadcast('mouseout', createMouseEvent(evt));
    });

    ctrl.linked = true;
    ctrl.update();
  };

  return {
    controller: controller,
    link: link,
    controllerAs: 'chart',
    restrict: 'E',
    transclude: true,
    template: '<ng-transclude></ng-transclude>',
    scope: {
      width: '@',
      height: '@'
    }
  };
}

directivesModule.directive('chart', chart);

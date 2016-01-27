'use strict';

var directivesModule = require('./_index.js');

function indexInParent(element) {
  var siblings = element.parent().children();

  for (var i = 0; i < siblings.length; i++) {
    if (siblings[i] === element[0]) {
      return i;
    }
  }

  return null;
}

/**
 * @ngInject
 */
function tableSort($compile) {
  var presort = function(table, colIndex, controller) {
    // remove any old carets
    var nodes = table[0].querySelectorAll('th span.sort-caret');
    angular.element(nodes).remove();

    if (controller.sortColumn === colIndex) {
      controller.sortReversed = !controller.sortReversed;
    } else {
      controller.sortColumn = colIndex;
      controller.sortReversed = true;
    }

    var th = angular.element(table.find('th')[colIndex]);
    if (controller.sortReversed) {
      th.append(angular.element('<span class="fa fa-fw fa-caret-up sort-caret"></span>'));
    } else {
      th.append(angular.element('<span class="fa fa-fw fa-caret-down sort-caret"></span>'));
    }
  };

  var link = function(scope, el, attrs, controller) {
    // find all header cells
    var headerCells = el.find('th');

    angular.forEach(headerCells, function(th) {
      th = angular.element(th);
      var index = indexInParent(th);

      // make sure sort-field is defined, otherwise this col is not sortable
      var field = th.attr('sort-field');
      if (typeof field === 'undefined') {
        return;
      }

      // if valid, make sure the user can tell
      th.css('cursor', 'pointer');
      th[0].onselectstart = function() { return false; };

      // store the sort field info in the controller for later use
      controller.sortFields[index] = field;

      // add a click listener
      th.bind('click', function(event) {
        presort(el, indexInParent(angular.element(this)), controller);
        controller.doSort();
        scope.$apply();
      });

      // check each cell for default param
      var def = th.attr('sort-default');
      if (typeof def !== 'undefined') {
        presort(el, indexInParent(th), controller);

        if (def === 'reverse' || def === 'reversed') {
          // sort again to flip
          presort(el, indexInParent(th), controller);
        }
      }
    });

    controller.doSort();
  };

  /**
   * @ngInject
   */
  var controller = function($scope) {
    var vm = this;
    vm.sortFields = {};
    vm.sortColumn = null;
    vm.sortReversed = true;

    vm.data = null;
    vm.dataSorted = [];

    var compare = function(v1, v2) {
      if (v1 < v2) {
        return -1;
      } else if (v1 > v2) {
        return 1;
      } else {
        return 0;
      }
    };

    vm.doSort = function() {
      if (vm.data === null) {
        vm.dataSorted = [];
        return;
      }

      if (vm.sortColumn === null) {
        vm.dataSorted = vm.data;
        return;
      }

      var field = vm.sortFields[vm.sortColumn];
      vm.dataSorted = vm.data.sort(function(a, b) {
        var ret = compare(a[field], b[field]);
        return vm.sortReversed ? -1 * ret : ret;
      });
    };

    $scope.$watch('data', function(value) {
      vm.data = value;

      if (!value) {
        vm.dataSorted = [];
      } else {
        vm.doSort();
      }
    });
  };

  return {
    restrict: 'A',
    scope: {
      'data': '='
    },
    link: link,
    controller: controller,
    controllerAs: 'table'
  };
}

directivesModule.directive('tableSort', tableSort);

function tableRef() {
  var link = function(scope, el, attrs, tableSortController) {
    scope[attrs.tableRef] = tableSortController;
  };

  // high priority (> 1000) so we run before other directives, e.g. ng-repeat
  // we need to inject the table reference into the scope in time for other
  // directives on this element to be able to see it
  return {
    restrict: 'A',
    priority: 1001,
    require: '^tableSort',
    scope: true,
    link: link
  };
}

directivesModule.directive('tableRef', tableRef);

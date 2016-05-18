'use strict';

var directivesModule = require('./_index.js');

function maxColspan(element) {
  var thead = element.find('thead');

  var max = 0;
  angular.forEach(element.find('tr'), function(row) {
    var count = angular.element(row).find('th').length;
    if (count > max) {
      max = count;
    }
  });

  return max;
}

/**
 * @ngInject
 */
function nest($compile) {

  /**
   * @ngInject
   */
  function controller($scope) {
    var self = this;
    self.open = false;

    self.toggle = function() {
      self.open = !self.open;
    };

    $scope.$watch('isOpen', function(value, old) {
      if (value === old) {
        return;
      }

      self.open = value;
    });
  }

  function link(scope, el, attrs, ctrl) {
    var container = null;
    var dest = null;
    var tag = el.prop('tagName');
    if (tag === 'TR' || tag === 'TH') {
      // assumes table -> t(head|body) -> tr -> t(d|h)
      var table = el.parent().parent();
      var cols = maxColspan(table);

      container = angular.element('<tr>');
      dest = angular.element('<td>');
      dest.attr('colspan', cols);
      container.append(dest);
    } else {
      dest = angular.element('<div>');
      container = dest;
    }

    container.addClass('nest');

    if (scope.nest) {
      // do some dirty hacks to make sure we pass the correct scope
      //
      // since we're appending as a sibling inside an ng-repeat, the effective
      // scope when the template renders will be wrong even though we compiled
      // and linked the element with our current scope
      // as a workaround, we'll make our scope available to the template as
      // 'scope' by literally passing '$parent' to the directive
      var include = angular.element('<nest-transclude ' +
          'template-url="' + scope.nest + '" ' +
          'scope="$parent"></nest-transclude>');
      $compile(include)(scope);
      dest.append(include);
    }

    scope.$watch(function() { return ctrl.open; }, function(val, old) {
      if (val) {
        el.after(container);
      } else {
        container.remove();
      }
    });
  }

  return {
    restrict: 'A',
    scope: {
      'isOpen': '=',
      'nest': '@'
    },
    require: 'nest',
    controller: controller,
    controllerAs: 'nest',
    link: link
  };
}

directivesModule.directive('nest', nest);

function nestToggle() {
  function link(scope, el, attrs, nestController) {
    el.on('click', function() {
      nestController.toggle();
      scope.$apply();
    });
  }

  return {
    restrict: 'A',
    require: '^^nest',
    scope: true,
    link: link
  };
}

directivesModule.directive('nestToggle', nestToggle);

function nestIndicator() {
  function link(scope, el, attrs, nestController) {
    var fa = angular.element('<i></i>');
    fa.addClass('fa fa-fw');
    el.append(fa);

    function update() {
      if (fa.hasClass('fa-minus-square-o')) {
        fa.removeClass('fa-minus-square-o');
      }

      if (fa.hasClass('fa-plus-square-o')) {
        fa.removeClass('fa-plus-square-o');
      }

      if (nestController.open) {
        fa.addClass('fa-minus-square-o');
      } else {
        fa.addClass('fa-plus-square-o');
      }
    }

    scope.$watch(function() {
      return nestController.open;
    }, function(val, old) {
      if (val === old) {
        return;
      }

      update();
    });

    update();
  }

  return {
    restrict: 'A',
    require: '^^nest',
    scope: true,
    link: link
  };
}

directivesModule.directive('nestIndicator', nestIndicator);

function nestTransclude() {
  return {
    restrict: 'EA',
    transclude: true,
    scope: {
      'scope': '='
    },
    templateUrl: function(element, attrs) {
      return attrs.templateUrl;
    }
  };
}
directivesModule.directive('nestTransclude', nestTransclude);

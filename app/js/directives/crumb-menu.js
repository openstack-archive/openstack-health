'use strict';

var directivesModule = require('./_index.js');

/**
 * @ngInject
 */
function crumbMenu() {
  var link = function(scope, element, attrs, ctrl, transclude) {
    transclude(function(clone) {
      angular.element(element[0].querySelector('ol')).append(clone);
    });
  };

  return {
    restrict: 'E',
    transclude: true,
    templateUrl: 'crumb-menu.html',
    link: link
  };
}

directivesModule.directive('crumbMenu', crumbMenu);

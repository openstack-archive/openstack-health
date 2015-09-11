'use strict';

var directivesModule = require('./_index.js');

/**
 * @ngInject
 */
function sunburst() {
  var link = function(scope, el, attrs) {

    var init = function() {
      // TODO d3 init
    };

    var update = function() {
      // TODO d3 update
    };

    scope.$on('windowResize', function() {
      // TODO handle resize
    });
  };

  return {
    restrict: 'EA',
    scope: {
      'dataset': '&'
    },
    link: link
  };
}

directivesModule.directive('sunburst', sunburst);

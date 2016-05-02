'use strict';

var directivesModule = require('./_index.js');

/**
 * @ngInject
 */
function loadingIndicator() {
  return {
    restrict : 'EA',
    templateUrl: 'templates/loading-indicator.html',
    scope: true
  };
}

directivesModule.directive('loadingIndicator', loadingIndicator);

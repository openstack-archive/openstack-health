'use strict';

var directivesModule = require('./_index.js');

/**
 * @ngInject
 */
function loadingIndicator() {
  return {
    restrict : 'EA',
    templateUrl: 'loading-indicator.html',
    scope: true
  };
}

directivesModule.directive('loadingIndicator', loadingIndicator);

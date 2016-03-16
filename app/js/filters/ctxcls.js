'use strict';

var filtersModule = require('./_index.js');

/**
 * @ngInject
 */
function ctxcls($filter) {
  return function(input) {
    return input > 0.15 ? 'danger'
         : input > 0.08 ? 'warning'
         : input > 0 ? 'info'
         : 'success';
  };
}

filtersModule.filter('ctxcls', ctxcls);

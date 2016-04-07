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

/**
 * @ngInject
 */
function ctxnum() {
  return function(input, multiple) {
    var m = multiple;
    if (!multiple) {
      m = 1;
    }
    return input === 'danger' ? 0.15 * m
         : input === 'warning' ? 0.08 * m
         : input === 'info' ? 0
         : input === 'success' ? 0
         : null;
  };
}

filtersModule.filter('ctxcls', ctxcls);
filtersModule.filter('ctxnum', ctxnum);

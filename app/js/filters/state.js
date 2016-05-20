'use strict';

var filtersModule = require('./_index.js');

/**
 * @ngInject
 */
function anyState($state) {
  return function(input, params) {
    if (angular.isArray(input)) {
      return input.some(function(el) { return $state.is(el); });
    } else {
      return $state.is(input, params);
    }
  };
}

filtersModule.filter('anyState', anyState);

'use strict';

var filtersModule = require('./_index.js');

function percentage($filter) {
  return function(input, decimals) {
    return $filter('number')(input * 100, decimals || 2) + '%';
  };
}

filtersModule.filter('percentage', percentage);

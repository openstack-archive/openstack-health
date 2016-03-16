'use strict';

var filtersModule = require('./_index.js');

/**
 * @ngInject
 */
function regex($filter) {
  return function(input, field, regex) {
    if (!input) {
      return [];
    }
    var pattern = null;
    var out = [];
    try {
      pattern = new RegExp(regex);
    } catch (e) {
      return input;
    }

    for (var i = 0; i < input.length; i++) {
      if (pattern.test(input[i][field])) {
        out.push(input[i]);
      }
    }
    return out;
  };
}

filtersModule.filter('regex', regex);

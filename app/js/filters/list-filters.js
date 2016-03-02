'use strict';

var filtersModule = require('./_index.js');

var split = function(input, delim) {
  if (typeof input === 'undefined' || input === null) {
    return [];
  }

  delim = delim || ',';

  return input.split(delim);
};

var join = function(input, delim) {
  if (typeof input === 'undefined' || input === null) {
    return '';
  }

  delim = delim || ', ';

  return input.join(delim);
};

var pick = function(input, index) {
  if (typeof input === 'undefined' || input === null) {
    return '';
  }

  return input[index];
};

var pickRight = function(input, index) {
  if (typeof input === 'undefined' || input === null) {
    return '';
  }

  return input[input.length - index];
};

var slice = function(input, begin, end) {
  if (typeof input === 'undefined' || input === null) {
    return [];
  }

  return input.slice(begin, end);
};

var first = function(input, length) {
  if (typeof input === 'undefined' || input === null) {
    return '';
  }

  length = length || 1;

  return input.slice(0, input.length - length);
};

var last = function(input, length) {
  if (typeof input === 'undefined' || input === null) {
    return '';
  }

  length = length || 1;

  return input.slice(input.length - length, input.length);
};

filtersModule.filter('split', function() { return split; });
filtersModule.filter('join', function() { return join; });
filtersModule.filter('pick', function() { return pick; });
filtersModule.filter('pickRight', function() { return pickRight; });
filtersModule.filter('slice', function() { return slice; });
filtersModule.filter('first', function() { return first; });
filtersModule.filter('last', function() { return last; });

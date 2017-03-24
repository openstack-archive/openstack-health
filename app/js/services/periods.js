'use strict';

var servicesModule = require('./_index.js');

/**
 * @ngInject
 */
var periodsService = function() {
  var service = {};
  var periods = {
    'home': {
      'sec': {'min':        null,
              'max':        {'hours': 6},
              'preference': {'hours': 1}},
      'min': {'min':        null,
              'max':        {'days': 1},
              'preference': {'hours': 12}},
      'hour': {'min':       {'hours': 12},
               'max':       {'months': 3},
               'preference': {'weeks': 1}},
      'day': {'min':        {'hours': 48},
              'max':        null,
              'preference': {'months': 3}}
    },
    'job': {
      'sec': {'min':        null,
              'max':        {'hours': 6},
              'preference': {'hours': 1}},
      'min': {'min':        null,
              'max':        {'days': 1},
              'preference': {'hours': 12}},
      'hour': {'min':       {'hours': 12},
               'max':       {'months': 1},
               'preference': {'weeks': 1}},
      'day': {'min':        {'hours': 48},
              'max':        null,
              'preference': {'months': 3}}
    },
    'test': {
      'sec': {'min':        null,
              'max':        {'hours': 6},
              'preference': {'hours': 1}},
      'min': {'min':        null,
              'max':        {'days': 1},
              'preference': {'hours': 12}},
      'hour': {'min':       {'hours': 12},
               'max':       {'months': 3},
               'preference': {'weeks': 1}},
      'day': {'min':        {'hours': 48},
              'max':        null,
              'preference': {'months': 3}}
    },
    'grouped-runs': {
      'sec': {'min':        null,
              'max':        {'hours': 6},
              'preference': {'hours': 1}},
      'min': {'min':        null,
              'max':        {'days': 1},
              'preference': {'hours': 12}},
      'hour': {'min':       {'hours': 12},
               'max':       {'months': 3},
               'preference': {'weeks': 2}},
      'day': {'min':        {'hours': 48},
              'max':        null,
              'preference': {'months': 3}}
    }
  };

  service.get = function(page, resolution) {
    var min = null;
    var max = null;
    var preference = null;
    var confBaseVal = periods[page];
    if (resolution === 'sec') {
      min = confBaseVal.sec.min;
      max = confBaseVal.sec.max;
      preference = confBaseVal.sec.preference;
    } else if (resolution === 'min') {
      min = confBaseVal.min.min;
      max = confBaseVal.min.max;
      preference = confBaseVal.min.preference;
    } else if (resolution === 'hour') {
      min = confBaseVal.hour.min;
      max = confBaseVal.hour.max;
      preference = confBaseVal.hour.preference;
    } else if (resolution === 'day') {
      min = confBaseVal.day.min;
      max = confBaseVal.day.max;
      preference = confBaseVal.day.preference;
    }
    return {'min': min, 'max': max, 'preference': preference};
  };
  return service;
};

servicesModule.service('periodsService', periodsService);

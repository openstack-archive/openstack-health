'use strict';

var servicesModule = require('./_index.js');

/**
 * @ngInject
 */
var viewService = function($rootScope) {
  var resolutionOptions = [
    { name: 'Second', key: 'sec', window: 0.01 },
    { name: 'Minute', key: 'min', window: 0.5 },
    { name: 'Hour', key: 'hour', window: 1 },
    { name: 'Day', key: 'day', window: 10 }
  ];
  var resolution = resolutionOptions[2];
  var groupKey = 'project';

  return {
    resolution: function(res) {
      if (arguments.length === 1) {
        resolution = res;
        $rootScope.$broadcast('view:resolution', res);
      }

      return resolution;
    },

    windowStart: function(endDate, days) {
      var ret = new Date(endDate);
      var diff = Math.ceil(resolution.window * days);
      ret.setDate(ret.getDate() - diff);

      return ret;
    },

    resolutionOptions: function() {
      return resolutionOptions;
    },

    groupKey: function(key) {
      if (arguments.length === 1) {
        groupKey = key;
        $rootScope.$broadcast('view:groupKey', groupKey);
      }

      return groupKey;
    }
  };
};

servicesModule.factory('viewService', viewService);

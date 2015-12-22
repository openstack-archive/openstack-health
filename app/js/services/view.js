'use strict';

var servicesModule = require('./_index.js');

/**
 * @ngInject
 */
var viewService = function($rootScope) {
  var resolutionOptions = [
    { name: 'Second', key: 'sec'},
    { name: 'Minute', key: 'min' },
    { name: 'Hour', key: 'hour' },
    { name: 'Day', key: 'day' }
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

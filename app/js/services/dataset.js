'use strict';

var servicesModule = require('./_index.js');

/**
 * @ngInject
 */
function DatasetService($q, $http) {

  var service = {};

  service.list = function() {
    return $http({
      cache: true,
      url: 'data/config.json',
      method: 'GET'
    });
  };

  service.raw = function(dataset) {
    return $http({
      cache: true,
      url: dataset.raw,
      method: 'GET'
    });
  };

  service.details = function(dataset) {
    return $http({
      cache: true,
      url: dataset.details,
      method: 'GET'
    });
  };

  service.tree = function(dataset) {
    return $http({
      cache: true,
      url: dataset.tree,
      method: 'GET'
    });
  };

  service.dstat = function(dataset) {
    return $http({
      cache: true,
      url: dataset.dstat,
      method: 'GET'
    });
  };

  return service;

}

servicesModule.service('datasetService', DatasetService);

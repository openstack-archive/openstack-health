'use strict';

var servicesModule = require('./_index.js');

function ConfigService($http, $log, $q) {
  var service = {};

  service.get = function() {
    return $q(function(resolve, reject) {
      $http({
        cache: true,
        url: 'config.json',
        method: 'GET'
      }).then(function(response) {
        $log.log(response);
        resolve(response.data);
      }, function(reason) {
        reject(reason);
      });
    });
  };

  return service;
}

servicesModule.service('config', ConfigService);

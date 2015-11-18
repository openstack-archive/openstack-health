'use strict';

var servicesModule = require('./_index.js');

/**
 * @ngInject
 */
var pageTitleService = function($rootScope, AppSettings) {
  var titlelize = function(title) {
    return title.charAt(0).toUpperCase() + title.slice(1);
  };

  this.update = function(title) {
    $rootScope.pageTitle = '';

    if (title) {
      $rootScope.pageTitle += titlelize(title);
      $rootScope.pageTitle += ' \u2014 ';
    }

    $rootScope.pageTitle += AppSettings.appTitle;
  };
};

servicesModule.service('pageTitleService', pageTitleService);

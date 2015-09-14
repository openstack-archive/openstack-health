'use strict';

/**
 * @ngInject
 */
function OnConfig($stateProvider, $locationProvider, $urlRouterProvider) {

  $stateProvider
    .state('home', {
      url: '/',
      controller: 'HomeCtrl as home',
      templateUrl: 'home.html',
      title: 'Home'
    });

  $urlRouterProvider.otherwise('/');

}

module.exports = OnConfig;

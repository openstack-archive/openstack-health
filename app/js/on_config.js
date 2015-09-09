'use strict';

/**
 * @ngInject
 */
function OnConfig($stateProvider, $locationProvider, $urlRouterProvider) {

  $locationProvider.html5Mode(true);

  $stateProvider
    .state('home', {
      url: '/',
      controller: 'ExampleCtrl as home',
      templateUrl: 'home.html',
      title: 'Home'
    })
    .state('timeline', {
      url: '/timeline/:dataset',
      controller: 'TimelineCtrl as timeline',
      templateUrl: 'timeline.html',
      title: 'Timeline'
    });

  $urlRouterProvider.otherwise('/');

}

module.exports = OnConfig;

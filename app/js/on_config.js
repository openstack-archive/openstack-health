'use strict';

/**
 * @ngInject
 */
function OnConfig($stateProvider, $locationProvider, $urlRouterProvider) {

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
    })
    .state('sunburst', {
      url: '/sunburst/:dataset',
      controller: 'SunburstCtrl as sunburst',
      templateUrl: 'sunburst.html',
      title: 'Sunburst'
    });

  $urlRouterProvider.otherwise('/');

}

module.exports = OnConfig;

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
    })
    .state('timeline', {
      url: '/timeline/{datasetId:int}',
      controller: 'TimelineCtrl as timeline',
      templateUrl: 'timeline.html',
      title: 'Timeline'
    })
    .state('sunburst', {
      url: '/sunburst/{datasetId:int}',
      controller: 'SunburstCtrl as sunburst',
      templateUrl: 'sunburst.html',
      title: 'Sunburst'
    });

  $urlRouterProvider.otherwise('/');

}

module.exports = OnConfig;

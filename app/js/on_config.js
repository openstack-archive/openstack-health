'use strict';

/**
 * @ngInject
 */
function OnConfig($stateProvider, $locationProvider, $urlRouterProvider) {
  $stateProvider
    .state('home', {
      url: '/',
      controller: 'HomeController as home',
      templateUrl: 'home.html',
      title: 'Home',
      resolve:  /*@ngInject*/ {
        'startDate': function() {
          return new Date();
        }
      }
    })
    .state('groupedRuns', {
      url: '/g/*runMetadataKey/*name',
      controller: 'GroupedRunsController as groupedRuns',
      templateUrl: 'grouped-runs.html',
      title: '',
      resolve: /*@ngInject*/ {
        'runMetadataKey': function($stateParams) {
          return $stateParams.runMetadataKey;
        },
        'name': function($stateParams) {
          return $stateParams.name;
        },
        'currentDate': function() {
          return new Date();
        }
      }
    })
    .state('tests', {
      url: '/tests',
      controller: 'TestsController as tests',
      templateUrl: 'tests.html',
      title: 'Tests'
    })
    .state('job', {
      url: '/job/:jobName',
      controller: 'JobController as job',
      templateUrl: 'job.html',
      title: 'Job',
      resolve: /*@ngInject*/ {
        'jobName': function($stateParams) {
          return $stateParams.jobName;
        },
        'startDate': function() {
          return new Date();
        }
      }
    });

  $urlRouterProvider.otherwise('/');
}

module.exports = OnConfig;

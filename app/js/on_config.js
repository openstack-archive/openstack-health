'use strict';

/**
 * @ngInject
 */
function OnConfig($stateProvider, $locationProvider, $urlRouterProvider, $sceDelegateProvider) {
  $sceDelegateProvider.resourceUrlWhitelist(['self','http://health.openstack.org/**']);

  $stateProvider
    .state('home', {
      url: '/',
      controller: 'HomeController as home',
      templateUrl: 'home.html',
      title: 'Home'
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
        }
      }
    })
    .state('tests', {
      url: '/tests',
      controller: 'TestsController as tests',
      templateUrl: 'tests.html',
      title: 'Tests'
    })
    .state('testsDetail', {
      url: '/tests/:key',
      controller: 'TestsDetailController as testsDetail',
      templateUrl: 'tests-detail.html',
      title: 'Tests Detail',
      resolve: /*@ngInject*/ {
        'key': function($stateParams) {
          return $stateParams.key;
        }
      }
    })
    .state('job', {
      url: '/job/:jobName',
      controller: 'JobController as job',
      templateUrl: 'job.html',
      title: 'Job',
      resolve: /*@ngInject*/ {
        'jobName': function($stateParams) {
          return $stateParams.jobName;
        }
      }
    })
    .state('test', {
      url: '/test/:testId',
      controller: 'TestController as testCtrl',
      templateUrl: 'test.html',
      title: 'Test',
      resolve: /*@ngInject*/ {
        'testId': function($stateParams) {
          return $stateParams.testId;
        }
      }
    });

  $urlRouterProvider.otherwise('/');
}

module.exports = OnConfig;

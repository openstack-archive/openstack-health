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
    .state('project', {
      url: '/project/:projectName',
      controller: 'ProjectCtrl as project',
      templateUrl: 'project.html',
      title: 'Project',
      resolve: {
        "projectName": function($stateParams) {
            return $stateParams.projectName;
        }
      }
    });

  $urlRouterProvider.otherwise('/');

}

module.exports = OnConfig;

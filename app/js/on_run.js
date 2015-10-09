'use strict';

/**
 * @ngInject
 */
function OnRun ($rootScope, AppSettings) {

  // change page title based on state
  var disable = $rootScope.$on('$stateChangeSuccess', function(event, toState) {
    $rootScope.pageTitle = '';

    if (toState.title) {
      $rootScope.pageTitle += toState.title;
      $rootScope.pageTitle += ' \u2014 ';
    }

    $rootScope.pageTitle += AppSettings.appTitle;
  });

  $rootScope.$on('$destroy', disable);
}

module.exports = OnRun;

'use strict';

/**
 * @ngInject
 */
function OnRun ($rootScope, pageTitleService) {

  // change page title based on state
  var disable = $rootScope.$on('$stateChangeSuccess', function(event, toState) {
    pageTitleService.update(toState.title);
  });

  $rootScope.$on('$destroy', disable);
}

module.exports = OnRun;

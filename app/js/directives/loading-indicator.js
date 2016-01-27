'use strict';

var directivesModule = require('./_index.js');
/**
 * @ngInject
 */
function loadingIndicator() {
  return {
    restrict : 'EA',
    template: "<div class='alert alert-info' role='alert'>" +
"<i class='fa fa-spinner fa-pulse fa-1x'></i> <strong>Loading...</strong>" +
'</div>',
    link : function(scope, element) {
      scope.$on('loading-started', function() {
        element.css({'display' : ''});
      });

      scope.$on('loading-complete', function() {
        element.css({'display' : 'none'});
      });
    }
  };
}

directivesModule.directive('loadingIndicator', loadingIndicator);

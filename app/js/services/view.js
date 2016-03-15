'use strict';

var servicesModule = require('./_index.js');

var moment = require('moment');

/**
 * @ngInject
 */
var viewService = function($rootScope, $location) {
  var resolutionOptions = [
    { name: 'Second', key: 'sec' },
    { name: 'Minute', key: 'min' },
    { name: 'Hour', key: 'hour' },
    { name: 'Day', key: 'day' }
  ];
  var resolution = resolutionOptions[2];
  var groupKey = $location.search().groupKey || 'project';

  var resKey = $location.search().resolutionKey || resolution.key;
  angular.forEach(resolutionOptions, function(resOpt) {
    if (resOpt.key === resKey) {
      resolution = resOpt;
    }
  });

  var regActionSuccess = $rootScope.$on('$locationChangeSuccess', function() {
    $location.search('groupKey', groupKey);
    $location.search('resolutionKey', resolution.key);
    if (userDuration !== null) {
      $location.search('duration', userDuration.toISOString());
    }
    if (periodEnd !== null) {
      $location.search('end', periodEnd.toISOString());
    }
  });

  var periodEnd = new Date();
  var periodOptions = [
    moment.duration({ hours: 1 }),
    moment.duration({ hours: 12 }),
    moment.duration({ days: 1 }),
    moment.duration({ weeks: 1 }),
    moment.duration({ weeks: 2 }),
    moment.duration({ months: 1 }),
    moment.duration({ months: 3 }),
    moment.duration({ months: 6 })
  ];
  var preferredDuration = null;
  var userDuration = null;
  var periods = periodOptions;

  var searchDuration = $location.search().duration;
  if (searchDuration) {
    userDuration = moment.duration(searchDuration);
  }

  var searchEnd = $location.search().end;
  if (searchEnd) {
    periodEnd = new Date(searchEnd);
  }

  var selectDuration = function() {
    if (userDuration) {
      return userDuration;
    } else if (preferredDuration) {
      return preferredDuration;
    } else {
      return periodOptions[0];
    }
  };

  return {
    resolution: function(res) {
      if (arguments.length === 1) {
        resolution = res;
        $rootScope.$broadcast('view:resolution', res);
      }

      return resolution;
    },

    resolutionOptions: function() {
      return resolutionOptions;
    },

    groupKey: function(key) {
      if (arguments.length === 1) {
        groupKey = key;
        $rootScope.$broadcast('view:groupKey', groupKey);
      }

      return groupKey;
    },

    duration: function() {
      return selectDuration();
    },

    periodEnd: function(end) {
      if (arguments.length === 0) {
        return periodEnd;
      }

      $location.search('end', end.toISOString());

      periodEnd = end;
      $rootScope.$broadcast('view:periodEnd', end);
      $rootScope.$broadcast('view:period', false);

      return end;
    },

    periodStart: function() {
      return moment(periodEnd)
          .subtract(selectDuration())
          .toDate();
    },

    periodOptions: function() {
      return periodOptions;
    },

    periods: function(min, max, correct) {
      if (arguments.length === 0) {
        return periods;
      }

      correct = (typeof correct === 'undefined' ? false : correct);

      var filtered = periodOptions.slice();
      if (min) {
        var d = moment.duration(min);
        filtered = filtered.filter(function(period) {
          return period >= d;
        });
      }

      if (max) {
        var d = moment.duration(max);
        filtered = filtered.filter(function(period) {
          return period <= d;
        });
      }

      if (filtered.length === 0) {
        throw new Error('Invalid period requirements');
      }

      periods = filtered;
      $rootScope.$broadcast('view:periods', periods);

      if (correct && userDuration) {
        if (min && userDuration < moment.duration(min)) {
          userDuration = filtered[0];
          $rootScope.$broadcast('view:duration', userDuration, true);
          $rootScope.$broadcast('view:period', true);
        } else if (max && userDuration > moment.duration(max)) {
          userDuration = filtered[filtered.length - 1];
          $rootScope.$broadcast('view:duration', userDuration, true);
          $rootScope.$broadcast('view:period', true);
        }
      }

      return filtered;
    },

    userDuration: function(duration) {
      if (arguments.length === 0) {
        return userDuration;
      }

      userDuration = moment.duration(duration);
      $rootScope.$broadcast('view:duration', duration, false);
      $rootScope.$broadcast('view:period', false);

      $location.search('duration', userDuration.toISOString());

      return duration;
    },

    preferredDuration: function(duration) {
      if (arguments.length === 0) {
        return preferredDuration;
      }

      preferredDuration = moment.duration(duration);

      // if no user override is active, send a notification
      if (!userDuration) {
        $rootScope.$broadcast('view:duration', preferredDuration, false);
        $rootScope.$broadcast('view:period', false);
      }

      return duration;
    }
  };
};

servicesModule.factory('viewService', viewService);

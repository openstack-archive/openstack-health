'use strict';

var controllersModule = require('./_index');

/**
 * @ngInject
 */
function HomeController($scope, healthService, projectService, viewService, $location) {

  var byFailRateDesc = function(project1, project2) {
    // To get descending order, project2 should come first
    return project2.metrics.failRate - project1.metrics.failRate;
  };

  var byDate = function(entryA, entryB) {
    return entryA.x - entryB.x;
  };

  var configurePeriods = function() {
    vm.hold += 1;

    var res = viewService.resolution();
    var min = null;
    var max = null;
    var preference = null;

    if (res.key === 'sec') {
      max = { hours: 6 };
      preference = { hours: 1 };
    } else if (res.key === 'min') {
      max = { days: 1 };
      preference = { hours: 12 };
    } else if (res.key === 'hour') {
      min = { hours: 12 };
      max = { months: 3 };
      preference = { months: 1 };
    } else if (res.key === 'day') {
      min = { hours: 48 };
      preference = { months: 3 };
    }

    viewService.periods(min, max, true);
    viewService.preferredDuration(preference);

    vm.hold -= 1;
  };

  var processData = function(data) {
    var projects = projectService.createProjects(data.runs);
    var blanks = projectService.findBlanks(data.runs);
    var dateStats = projectService.getStatsByDate(projects);
    var entries = getChartEntries(dateStats, blanks);

    vm.chartData = [
      { key: 'Passes', values: entries.passes, color: 'blue' },
      { key: 'Failures', values: entries.failures, color: 'red' }
    ];
    vm.chartDataRate = [{ key: '% Failures', values: entries.failRate }];
    vm.projects = projects
      .sort(byFailRateDesc)
      .map(function(project) { return generateGaugeData(project); });
  };

  var getChartEntries = function(dateStats, blanks) {
    var entries = { passes: [], failures: [], failRate: [] };
    angular.forEach(blanks, function(date) {
      var tempDate = new Date(date);
      entries.passes.push(generateChartData(tempDate, 0));
      entries.failures.push(generateChartData(tempDate, 0));
      entries.failRate.push(generateChartData(tempDate, 0));
    });
    angular.forEach(dateStats, function(stats) {
      entries.passes.push(generateChartData(stats.date, stats.metrics.passes));
      entries.failures.push(generateChartData(stats.date, stats.metrics.failures));
      entries.failRate.push(generateChartData(stats.date, stats.metrics.failRate));
    });
    entries.passes = entries.passes.sort(byDate);
    entries.failures = entries.failures.sort(byDate);
    entries.failRate = entries.failRate.sort(byDate);
    return entries;
  };

  var generateChartData = function(date, value) {
    return { x: date.getTime(), y: value };
  };

  var generateGaugeData = function(project) {
    return {
      name: project.name,
      data: [
        { key: 'Passes', value: project.metrics.passes, color: 'blue' },
        { key: 'Failures', value: project.metrics.failures, color: 'red' }
      ]
    };
  };

  var loadData = function() {
    // don't update if configurePeriods() is in progress - it may throw an extra
    // period update
    if (vm.hold > 0) {
      return;
    }

    healthService.getRunsGroupedByMetadataPerDatetime(vm.groupKey, {
      start_date: viewService.periodStart(),
      stop_date: viewService.periodEnd(),
      datetime_resolution: viewService.resolution().key
    }).then(function(response) {
      processData(response.data);
      vm.loaded = true;
    });
  };

  // ViewModel
  var vm = this;
  vm.loadData = loadData;
  vm.groupKey = viewService.groupKey();

  vm.searchProject = $location.search().searchProject || '';
  vm.loaded = false;
  vm.hold = 0;

  configurePeriods();
  loadData();

  $scope.$on('view:groupKey', function(event, groupKey) {
    vm.groupKey = groupKey;
    configurePeriods();
    loadData();
  });

  $scope.$on('view:resolution', function(event, resolution) {
    configurePeriods();
    loadData();
  });

  $scope.$on('view:period', function(event, corrected) {
    if (vm.loaded && !corrected) {
      loadData();
    }
  });

  vm.onSearchChange = function() {
    $location.search('searchProject', $scope.home.searchProject);
  };
}
controllersModule.controller('HomeController', HomeController);

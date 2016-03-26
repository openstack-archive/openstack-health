'use strict';

var controllersModule = require('./_index');

var d3 = require('d3');

/**
 * @ngInject
 */
function HomeController(
    $scope, $location, $sce,
    healthService, projectService, viewService, tooltipService, periodsService) {

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
    var periods = periodsService.get('home', res.key);

    viewService.periods(periods.min, periods.max, true);
    viewService.preferredDuration(periods.preference);

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
      .map(function(project) { return generateHorizontalBarData(project); });
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

  var pctFormat = d3.format('.2f');
  var metrics = function(d, name) {
    if (d.data.metrics) {
      return d.data.metrics[name];
    } else {
      return 'n/a';
    }
  };

  var generateHorizontalTooltip = tooltipService.generator([
    [
      'Passes',
      function(d) { return pctFormat((1 - d.failRate) * 100) + '%'; },
      function(d) { return '(' + d.passes + ')'; }
    ], [
      'Failures',
      function(d) { return pctFormat(d.failRate * 100) + '%'; },
      function(d) { return '(' + d.failures + ')'; }
    ]
  ], { colors: ['blue', 'red'] });

  var generateHorizontalBarData = function(project) {
    return {
      name: project.name,
      passRate: 1 - project.metrics.failRate,
      failRate: project.metrics.failRate,
      passes: project.metrics.passes,
      failures: project.metrics.failures,
      tooltip: $sce.trustAsHtml(generateHorizontalTooltip(project.metrics))
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
    healthService.getRecentFailedTests().then(function(response) {
      vm.recentTests = response.data;
    });
  };

  // ViewModel
  var vm = this;
  vm.loadData = loadData;
  vm.groupKey = viewService.groupKey();
  vm.searchProject = $location.search().searchProject || '';
  vm.loaded = false;
  vm.hold = 0;
  vm.recentTests = [];

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
    $location.search('searchProject', $scope.home.searchProject).replace();
  };
}
controllersModule.controller('HomeController', HomeController);

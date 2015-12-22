'use strict';

var controllersModule = require('./_index');

/**
 * @ngInject
 */
function HomeController($scope, healthService, startDate, projectService, viewService) {

  var byFailRateDesc = function(project1, project2) {
    // To get descending order, project2 should come first
    return project2.metrics.failRate - project1.metrics.failRate;
  };

  var processData = function(data) {
    var projects = projectService.createProjects(data.runs);
    var dateStats = projectService.getStatsByDate(projects);
    var entries = getChartEntries(dateStats);

    vm.chartData = [
      { key: 'Passes', values: entries.passes, color: "blue" },
      { key: 'Failures', values: entries.failures, color: "red" }
    ];
    vm.chartDataRate = [{ key: '% Failures', values: entries.failRate }];
    vm.projects = projects
      .sort(byFailRateDesc)
      .map(function(project) { return generateGaugeData(project); });
  };

  var getChartEntries = function(dateStats) {
    var entries = { passes: [], failures: [], failRate: [] };

    angular.forEach(dateStats, function(stats) {
      entries.passes.push(generateChartData(stats.date, stats.metrics.passes));
      entries.failures.push(generateChartData(stats.date, stats.metrics.failures));
      entries.failRate.push(generateChartData(stats.date, stats.metrics.failRate));
    });

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

  var loadData = function(runMetadataKey) {
    var start = new Date(startDate);
    start.setDate(start.getDate() - 20);

    healthService.getRunsGroupedByMetadataPerDatetime(vm.groupKey, {
      start_date: start,
      datetime_resolution: viewService.resolution().key
    }).then(function(response) {
      processData(response.data);
    });
  };

  // ViewModel
  var vm = this;
  vm.loadData = loadData;
  vm.groupKey = viewService.groupKey();
  vm.searchProject = '';

  loadData();

  $scope.$on('view:groupKey', function(event, groupKey) {
    vm.groupKey = groupKey;
    loadData(groupKey);
  });

  $scope.$on('view:resolution', function(event, resolution) {
    loadData();
  });
}
controllersModule.controller('HomeController', HomeController);

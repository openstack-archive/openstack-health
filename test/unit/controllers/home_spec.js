describe('HomeController', function() {
  beforeEach(function() {
    module('app');
  });

  var $controller, homeController, projectService;
  var mockResponse = { data: {} };
  var mockMetadataKeysResponse = {
    data: {
      runs: {
        metadata: {
          keys: ['filename', 'project', 'voting']
        }
      }
    }
  };

  beforeEach(inject(function(_$controller_) {
    $controller = _$controller_;

    var defaultStartDate = new Date();
    var healthService = {
      getRunsGroupedByMetadataPerDatetime: function(key, options) {
        return { then: function(callback) { callback(mockResponse); } };
      },
      getRunMetadataKeys: function() {
        return {
          then: function(callback) { callback(mockMetadataKeysResponse); }
        };
      }
    };
    projectService = {
      createProjects: function() { return []; },
      getStatsByDate: function() { return []; }
    };

    homeController = $controller('HomeController', {
      healthService: healthService,
      startDate: defaultStartDate,
      projectService: projectService
    });
  }));

  describe('chart data', function() {
    var timestamp;

    beforeEach(function() {
      var date = new Date('2015-10-01T20:00:00');
      timestamp = date.getTime();
      var metrics = { passes: 3, failures: 4, failRate: 0.57 };
      var stats = [{ date: date, metrics: metrics }];
      projectService.getStatsByDate = function() { return stats; };
      homeController.loadData();
    });

    it('should contain data for passes and failures', function() {
      var expectedPasses = {
        key: 'Passes', values: [{ x: timestamp, y: 3 }], color: 'blue'
      };
      var expectedFailures = {
        key: 'Failures', values: [{ x: timestamp, y: 4 }], color: 'red'
      };
      expect(homeController.chartData).toContain(expectedPasses);
      expect(homeController.chartData).toContain(expectedFailures);
    });

    it('should contain data for failure rate', function() {
      var expectedChartDataRate = [{
        key: '% Failures', values: [{ x: 1443729600000, y: 0.57 }]
      }];
      expect(homeController.chartDataRate).toEqual(expectedChartDataRate);
    });
  });

  it('should generate project data', function() {
    projectService.createProjects = function() {
      return [{ name: 'p1', metrics: { passes: 1, failures: 2 }}];
    };
    homeController.loadData();

    var project = homeController.projects[0];
    expect(project.name).toEqual('p1');
    expect(project.data.length).toEqual(2);
    expect(project.data).toContain({ key: 'Passes', value: 1, color: 'blue'});
    expect(project.data).toContain({ key: 'Failures', value: 2, color: 'red'});
  });

  it('should sort projects by descending percentage of failures', function() {
    projectService.createProjects = function() {
      return [{ name: 'p1', metrics: { failRate: 1 }},
              { name: 'p2', metrics: { failRate: 3 }},
              { name: 'p3', metrics: { failRate: 2 }}];
    };
    homeController.loadData();

    var sortedProjects = homeController.projects.map(function(p) { return p.name; });
    expect(sortedProjects[0]).toEqual('p2');
    expect(sortedProjects[1]).toEqual('p3');
    expect(sortedProjects[2]).toEqual('p1');
  });
});

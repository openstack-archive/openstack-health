describe('HomeController', function() {
  beforeEach(function() {
    module('app');
  });

  var $scope, $controller, homeController, projectService;
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
  var mockRecentFailed = [
    {
      'link': 'http://logs.openstack.org/97/280597/1/gate/gate-tempest-dsvm-ironic-pxe_ipa/61f4153',
      'start_time': '2016-02-17T11:38:43.185384',
      'stop_time': '2016-02-17T11:50:04.465870',
      'test_id': 'ironic.test_baremetal_basic_ops.BaremetalBasicOps.test_baremetal_server_ops'
    },
    {
      'link': 'http://logs.openstack.org/49/277949/2/gate/gate-tempest-dsvm-ironic-pxe_ipa/8ac452c',
      'start_time': '2016-02-17T10:29:32.448360',
      'stop_time': '2016-02-17T10:44:33.880733',
      'test_id': 'ironic.test_baremetal_basic_ops.BaremetalBasicOps.test_baremetal_server_ops'
    }
  ];

  beforeEach(inject(function($rootScope, _$controller_) {
    $scope = $rootScope.$new();
    $controller = _$controller_;

    var healthService = {
      getRunsGroupedByMetadataPerDatetime: function(key, options) {
        return { then: function(callback) { callback(mockResponse); } };
      },
      getRunMetadataKeys: function() {
        return {
          then: function(callback) { callback(mockMetadataKeysResponse); }
        };
      },
      getRecentFailedTests: function() {
        return {
          then: function(callback) { callback(mockRecentFailed); }
        };
      }
    };
    projectService = {
      createProjects: function() { return []; },
      getStatsByDate: function() { return []; },
      findBlanks: function() { return []; }
    };

    homeController = $controller('HomeController', {
      $scope: $scope,
      healthService: healthService,
      projectService: projectService
    });
  }));

  describe('chart data', function() {
    var timestamp;

    beforeEach(function() {
      var date = new Date('2015-10-01T20:00:00.000Z');
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
      return [{ name: 'p1',
                metrics: { passes: 1, failures: 2, failRate: 0.4 }}];
    };
    homeController.loadData();

    var project = homeController.projects[0];
    expect(project.name).toEqual('p1');
    expect(project.passRate).toEqual(0.6);
    expect(project.failRate).toEqual(0.4);
    expect(project.passes).toEqual(1);
    expect(project.failures).toEqual(2);
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

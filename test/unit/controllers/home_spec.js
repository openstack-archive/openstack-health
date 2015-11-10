describe('HomeController', function() {
  beforeEach(function() {
    module('app');
    module('app.controllers');
  });

  var $httpBackend, $controller, healthService;
  var API_ROOT = 'http://8.8.4.4:8080';
  var DEFAULT_START_DATE = new Date();

  beforeEach(inject(function(_$httpBackend_, _$controller_, _healthService_) {
    $httpBackend = _$httpBackend_;
    mockConfigService();
    mockHealthService();

    $controller = _$controller_;

    healthService = _healthService_;
  }));

  function mockHealthService() {
    var startTime = new Date(DEFAULT_START_DATE);
    startTime.setDate(startTime.getDate() - 20);

    var expectedResponse = {
      runs: {
        '2015-10-01T20:00:00': {
          'openstack/heat': [
            { fail: 0, pass: 40, skip: 1 }
          ],
          'openstack/keystone': [
            { fail: 1, pass: 3, skip: 0 },
            { fail: 1, pass: 3, skip: 0 },
            { fail: 1, pass: 3, skip: 0 }
          ],
          'openstack/tempest': [
            { fail: 0, pass: 1149, skip: 119 },
            { fail: 0, pass: 40, skip: 1 },
            { fail: 1, pass: 6, skip: 0 }
          ]
        }
      }
    };
    var endpoint = API_ROOT +
      '/runs/group_by/project?callback=JSON_CALLBACK&' +
      'datetime_resolution=hour&' +
      'start_date=' +
      startTime.toISOString();
    $httpBackend.expectJSONP(endpoint)
    .respond(200, expectedResponse);
  }

  function mockConfigService() {
    var expectedResponse = { apiRoot: API_ROOT };
    var endpoint = 'config.json';
    $httpBackend.expectGET(endpoint).respond(200, expectedResponse);
  }

  it('should process chart data correctly', function() {
    var homeController = $controller('HomeController', {
      healthService: healthService,
      startDate: DEFAULT_START_DATE
    });
    $httpBackend.flush();

    var expectedChartData = [{
      key: 'Passes',
      values: [{
        x: 1443729600000,
        y: 3 }
      ],
      color: 'blue' }, {
        key: 'Failures',
        values: [{
          x: 1443729600000,
          y: 4 }
        ],
        color: 'red'
      }
    ];
    expect(homeController.chartData).toEqual(expectedChartData);
  });

  it('should sort projects by descending percentage of failures', function() {
    var homeController = $controller('HomeController', {
      healthService: healthService,
      startDate: DEFAULT_START_DATE
    });
    $httpBackend.flush();

    var sortedProjects = homeController.projects.map(function(p) { return p.name; });
    expect(sortedProjects[0]).toEqual('openstack/keystone');
    expect(sortedProjects[1]).toEqual('openstack/tempest');
    expect(sortedProjects[2]).toEqual('openstack/heat');
  });

  it('should process chart data rate correctly', function() {
    var homeController = $controller('HomeController', {
      healthService: healthService,
      startDate: DEFAULT_START_DATE
    });
    $httpBackend.flush();

    var expectedChartDataRate = [{
      key: '% Failures',
      values: [{
        x: 1443729600000,
        y: 0.5714285714285714
      }]
    }];
    expect(homeController.chartDataRate).toEqual(expectedChartDataRate);
  });

  it('should process project data correctly', function() {
    var homeController = $controller('HomeController', {
      healthService: healthService,
      startDate: DEFAULT_START_DATE
    });
    $httpBackend.flush();

    var projectData = function(name, passes, failures) {
      return {
        name: name,
        data: [
          { key: 'Passes',   value: passes, color: 'blue' },
          { key: 'Failures', value: failures, color: 'red' }
        ]
      };
    };

    var expectedProjects = [
      projectData('openstack/keystone', 0, 3),
      projectData('openstack/tempest', 2, 1),
      projectData('openstack/heat', 1, 0)
    ];
    expect(homeController.projects).toEqual(expectedProjects);
  });
});

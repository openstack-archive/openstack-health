describe('ProjectController', function() {
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
      timedelta: [
        {
          datetime: "2014-11-19",
          job_data: [
            {
              fail: 1,
              job_name: "gate-grenade-dsvm",
              mean_run_time: 1154.6675000000002,
              pass: 27
            },
            {
              fail: 0,
              job_name: "gate-tempest-dsvm-full",
              mean_run_time: 4366.415384615385,
              pass: 13
            },
            {
              fail: 0,
              job_name: "gate-tempest-dsvm-neutron-full",
              mean_run_time: 5170.95,
              pass: 12
            },
            {
              fail: 1,
              job_name: "gate-tempest-dsvm-neutron-heat-slow",
              mean_run_time: 273.05544444444445,
              pass: 17
            },
            {
              fail: 0,
              job_name: "gate-tempest-dsvm-postgres-full",
              mean_run_time: 4439.482857142857,
              pass: 14
            }
          ]
        }
      ]
    };

    var endpoint = API_ROOT +
      '/projects/openstack/cinder/runs?callback=JSON_CALLBACK&' +
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
    var projectController = $controller('ProjectController', {
      healthService: healthService,
      projectName: 'openstack/cinder',
      startDate: DEFAULT_START_DATE
    });
    $httpBackend.flush();

    var expectedChartData = [{
      key: 'Passes',
      values: [{
        x: 1416355200000, y: 83
      }],
      color: 'blue'
    }, {
      key: 'Failures',
      values: [{
        x: 1416355200000,
        y: 2
      }],
      color: 'red'
    }];
    expect(projectController.chartData).toEqual(expectedChartData);
  });

  it('should process chart data rate correctly', function() {
    var projectController = $controller('ProjectController', {
      healthService: healthService,
      projectName: 'openstack/cinder',
      startDate: DEFAULT_START_DATE
    });
    $httpBackend.flush();

    var expectedChartDataRate = [{
      key: '% Failures',
      values: [{
        x: 1416355200000,
        y: 0.023529411764705883
      }]
    }];
    expect(projectController.chartDataRate).toEqual(expectedChartDataRate);
  });
});

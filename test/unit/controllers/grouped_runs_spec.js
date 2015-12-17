describe('GroupedRunsController', function() {
  beforeEach(function() {
    module('app');
    module('app.controllers');
  });

  var $httpBackend, $controller, healthService;
  var API_ROOT = 'http://8.8.4.4:8080';
  var DEFAULT_CURRENT_DATE = new Date();

  beforeEach(inject(function(_$httpBackend_, _$controller_, _healthService_) {
    $httpBackend = _$httpBackend_;
    mockConfigService();
    mockHealthService();
    $controller = _$controller_;
    healthService = _healthService_;
  }));

  function mockHealthService() {
    var startDate = new Date(DEFAULT_CURRENT_DATE);
    startDate.setDate(startDate.getDate() - 20);
    var stopDate = new Date(DEFAULT_CURRENT_DATE);

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
      '/runs/key/project/openstack/cinder?callback=JSON_CALLBACK&' +
      'datetime_resolution=hour&' +
      'start_date=' + startDate.toISOString() + '&' +
      'stop_date=' + stopDate.toISOString();
    $httpBackend.expectJSONP(endpoint)
    .respond(200, expectedResponse);
  }

  function mockConfigService() {
    var expectedResponse = { apiRoot: API_ROOT };
    var endpoint = 'config.json';
    $httpBackend.expectGET(endpoint).respond(200, expectedResponse);
  }

  it('should process chart data correctly', function() {
    var groupedRunsController = $controller('GroupedRunsController', {
      healthService: healthService,
      runMetadataKey: 'project',
      name: 'openstack/cinder',
      currentDate: DEFAULT_CURRENT_DATE
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
    expect(groupedRunsController.chartData).toEqual(expectedChartData);
  });

  it('should process chart data rate correctly', function() {
    var groupedRunsController = $controller('GroupedRunsController', {
      healthService: healthService,
      runMetadataKey: 'project',
      name: 'openstack/cinder',
      currentDate: DEFAULT_CURRENT_DATE
    });
    $httpBackend.flush();

    var expectedChartDataRate = [{
      key: '% Failures',
      values: [{
        x: 1416355200000,
        y: 0.023529411764705883
      }]
    }];
    expect(groupedRunsController.chartDataRate).toEqual(expectedChartDataRate);
  });
});

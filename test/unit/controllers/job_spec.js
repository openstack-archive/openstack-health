describe('JobController', function() {
  beforeEach(function() {
    module('app');
    module('app.controllers');
  });

  var $scope, $httpBackend, $controller, healthService, viewService;
  var API_ROOT = 'http://8.8.4.4:8080';
  var DEFAULT_END_DATE = new Date();
  var DEFAULT_START_DATE = new Date(
      (+DEFAULT_END_DATE) -
      (1000 * 60 * 60 * 24 * 7));

  beforeEach(inject(function($rootScope, _$httpBackend_, _$controller_, _healthService_) {
    $httpBackend = _$httpBackend_;
    mockConfigService();
    mockHealthService();

    $scope = $rootScope.$new();
    $controller = _$controller_;
    healthService = _healthService_;

    viewService = {
      resolution: function() { return { name: 'Hour', key: 'hour' }; },
      periods: function() {},
      preferredDuration: function() {},
      periodStart: function() { return DEFAULT_START_DATE; },
      periodEnd: function() { return DEFAULT_END_DATE; }
    };
  }));

  function mockHealthService() {
    var expectedResponse = {
      tests: {
        "2014-11-19T01:00:00": {
          "tempest.api.compute.admin.test_fixed_ips:FixedIPsTestJson.test_list_fixed_ip_details": {
            fail: 1,
            pass: 27,
            skip: 0,
            run_time: 1
          },
          "tempest.api.compute.admin.test_fixed_ips:FixedIPsTestJson.test_set_reserve": {
            fail: 0,
            pass: 13,
            skip: 0,
            run_time: 1
          },
          "tempest.api.compute.admin.test_fixed_ips:FixedIPsTestJson.test_set_unreserve": {
            fail: 0,
            pass: 12,
            skip: 1,
            run_time: 1
          }
        }
      }
    };
    var endpoint = API_ROOT +
        '/build_name/gate-tempest-dsvm-neutron-full/test_runs?' +
        'callback=JSON_CALLBACK&' +
        'datetime_resolution=hour&' +
        'start_date=' + DEFAULT_START_DATE.toISOString() + '&' +
        'stop_date=' + DEFAULT_END_DATE.toISOString();

    $httpBackend.expectJSONP(endpoint).respond(200, expectedResponse);

    var recentResponse = [
      {
        "build_name": "gate-tempest-dsvm-ceilometer-mysql-neutron-full",
        "id": "27ea6c72-4148-4a69-84ae-4b69ad88715b",
        "link": "http://logs.openstack.org/31/234831/15/ceilo-mysql-neutron-full/7cb2c63",
        "start_date": "2016-01-12T23:05:00",
        "status": "success"
      },
      {
        "build_name": "gate-tempest-dsvm-neutron-full",
        "id": "97e11ee7-d1f9-40a8-b598-377f4013248d",
        "link": "http://logs.openstack.org/77/188877/55/neutron-full/eb3c685",
        "start_date": "2016-01-12T18:53:45",
        "status": "success"
      },
      {
        "build_name": "gate-tempest-dsvm-large-ops",
        "id": "f25490d5-39e4-4f74-8151-30d6b2522b9b",
        "link": "http://logs.openstack.org/49/264349/4/large-ops/488cd67",
        "start_date": "2016-01-12T18:35:36",
        "status": "success"
      },
      {
        "build_name": "gate-tempest-dsvm-neutron-full",
        "id": "a94f8306-e737-461a-8e10-5f90113cbd02",
        "link": "http://logs.openstack.org/82/262082/6/neutron-full/f8ea4fd",
        "start_date": "2016-01-12T16:37:23",
        "status": "success"
      }
    ];

    var endpointRecent = API_ROOT +
      '/runs/key/build_name/gate-tempest-dsvm-neutron-full/recent?callback=JSON_CALLBACK';
    $httpBackend.expectJSONP(endpointRecent)
      .respond(200, recentResponse);
  }

  function mockConfigService() {
    var expectedResponse = { apiRoot: API_ROOT };
    var endpoint = 'config.json';
    $httpBackend.expectGET(endpoint).respond(200, expectedResponse);
  }

  it('should process chart data correctly', function() {
    var jobController = $controller('JobController', {
      $scope: $scope,
      healthService: healthService,
      jobName: 'gate-tempest-dsvm-neutron-full',
      startDate: DEFAULT_START_DATE,
      viewService: viewService
    });
    $httpBackend.flush();

    var expectedChartData = [{
      key: 'Passes',
      values: [{
        x: 1416358800000,
        y: 52
      }],
      color: 'blue'
    }, {
      key: 'Failures',
      values: [{
        x: 1416358800000,
        y: 1
      }],
      color: 'red'
    }, {
      key: 'Skips',
      values: [{
        x: 1416358800000,
        y: 1
      }],
      color: 'violet'
    }];
    expect(jobController.chartData).toEqual(expectedChartData);
  });

  it('should process chart data rate correctly', function() {
    var jobController = $controller('JobController', {
      $scope: $scope,
      healthService: healthService,
      jobName: 'gate-tempest-dsvm-neutron-full',
      viewService: viewService
    });
    $httpBackend.flush();

    var expectedChartDataRate = [{
      key: '% Failures',
      values: [{
        x: 1416358800000,
        y: 0.018867924528301886
      }]
    }];
    expect(jobController.chartDataRate).toEqual(expectedChartDataRate);
  });

  it('should process tests correctly', function() {
    var jobController = $controller('JobController', {
      $scope: $scope,
      healthService: healthService,
      jobName: 'gate-tempest-dsvm-neutron-full',
      viewService: viewService
    });
    $httpBackend.flush();

    var expectedTests = [{
      name: 'tempest.api.compute.admin.test_fixed_ips:FixedIPsTestJson.test_list_fixed_ip_details',
      passes: 27,
      failures: 1,
      skips: 0,
      failuresRate: 3.5714285714285716,
      meanRuntime: 1
    }, {
      name: 'tempest.api.compute.admin.test_fixed_ips:FixedIPsTestJson.test_set_reserve',
      passes: 13,
      failures: 0,
      skips: 0,
      failuresRate: 0,
      meanRuntime: 1
    }, {
      name: 'tempest.api.compute.admin.test_fixed_ips:FixedIPsTestJson.test_set_unreserve',
      passes: 12,
      skips: 1,
      failures: 0,
      failuresRate: 0,
      meanRuntime: 1
    }];

    expect(jobController.tests).toEqual(expectedTests);
  });
});

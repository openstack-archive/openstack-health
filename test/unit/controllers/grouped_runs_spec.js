describe('GroupedRunsController', function() {
  beforeEach(function() {
    module('app');
    module('app.controllers');
  });
  beforeEach(module(function ($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist(['self','http://8.8.4.4:8080/**']);
  }));
  var $scope, $httpBackend, $controller, healthService, viewService;
  var API_ROOT = 'http://8.8.4.4:8080';
  var DEFAULT_END_DATE = new Date();
  var DEFAULT_START_DATE = new Date(
      (+DEFAULT_END_DATE) -
      (1000 * 60 * 60 * 24 * 7));

  beforeEach(inject(function($rootScope, _$httpBackend_, _$controller_, _healthService_) {
    $scope = $rootScope.$new();
    $httpBackend = _$httpBackend_;
    mockConfigService();
    mockHealthService();
    $controller = _$controller_;
    healthService = _healthService_;

    viewService = {
      resolution: function() { return { name: 'Hour', key: 'hour' }; },
      groupKey: function() { return 'project'; },
      periods: function() {},
      preferredDuration: function() {},
      periodStart: function() { return DEFAULT_START_DATE; },
      periodEnd: function() { return DEFAULT_END_DATE; }
    };
  }));

  function mockHealthService() {
    var expectedResponse = {
      timedelta: [
        {
          datetime: '2014-11-19T00:00:00.000Z',
          job_data: [
            {
              fail: 1,
              job_name: 'gate-grenade-dsvm',
              mean_run_time: 1154.6675000000002,
              pass: 27
            },
            {
              fail: 0,
              job_name: 'gate-tempest-dsvm-full',
              mean_run_time: 4366.415384615385,
              pass: 13
            },
            {
              fail: 0,
              job_name: 'gate-tempest-dsvm-neutron-full',
              mean_run_time: 5170.95,
              pass: 12
            },
            {
              fail: 1,
              job_name: 'gate-tempest-dsvm-neutron-heat-slow',
              mean_run_time: 273.05544444444445,
              pass: 17
            },
            {
              fail: 0,
              job_name: 'gate-tempest-dsvm-postgres-full',
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
        'start_date=' + DEFAULT_START_DATE.toISOString() + '&' +
        'stop_date=' + DEFAULT_END_DATE.toISOString();

    $httpBackend.expectJSONP(endpoint).respond(200, expectedResponse);

    var recentResponse = [
      {
        'build_name': 'gate-tempest-dsvm-ceilometer-mysql-neutron-full',
        'id': '27ea6c72-4148-4a69-84ae-4b69ad88715b',
        'link': 'http://logs.openstack.org/31/234831/15/ceilo-mysql-neutron-full/7cb2c63',
        'start_date': '2016-01-12T23:05:00',
        'status': 'success'
      },
      {
        'build_name': 'gate-tempest-dsvm-neutron-full',
        'id': '97e11ee7-d1f9-40a8-b598-377f4013248d',
        'link': 'http://logs.openstack.org/77/188877/55/neutron-full/eb3c685',
        'start_date': '2016-01-12T18:53:45',
        'status': 'success'
      },
      {
        'build_name': 'gate-tempest-dsvm-large-ops',
        'id': 'f25490d5-39e4-4f74-8151-30d6b2522b9b',
        'link': 'http://logs.openstack.org/49/264349/4/large-ops/488cd67',
        'start_date': '2016-01-12T18:35:36',
        'status': 'success'
      },
      {
        'build_name': 'gate-tempest-dsvm-neutron-full',
        'id': 'a94f8306-e737-461a-8e10-5f90113cbd02',
        'link': 'http://logs.openstack.org/82/262082/6/neutron-full/f8ea4fd',
        'start_date': '2016-01-12T16:37:23',
        'status': 'success'
      }
    ];

    var endpointRecent = API_ROOT +
      '/runs/key/project/openstack/cinder/recent?callback=JSON_CALLBACK';
    $httpBackend.expectJSONP(endpointRecent)
      .respond(200, recentResponse);
  }

  function mockConfigService() {
    var expectedResponse = { apiRoot: API_ROOT };
    var endpoint = 'config.json';
    $httpBackend.expectGET(endpoint).respond(200, expectedResponse);
  }

  it('should process chart data correctly', function() {
    var groupedRunsController = $controller('GroupedRunsController', {
      $scope: $scope,
      healthService: healthService,
      runMetadataKey: 'project',
      name: 'openstack/cinder',
      viewService: viewService
    });
    $httpBackend.flush();

    expect(groupedRunsController.passes).toEqual([{
      x: 1416355200000, y: 83
    }]);

    expect(groupedRunsController.failures).toEqual([{
      x: 1416355200000,
      y: 2
    }]);
  });

  it('should process chart data rate correctly', function() {
    var groupedRunsController = $controller('GroupedRunsController', {
      $scope: $scope,
      healthService: healthService,
      runMetadataKey: 'project',
      name: 'openstack/cinder',
      viewService: viewService
    });
    $httpBackend.flush();

    expect(groupedRunsController.failRates).toEqual([{
      x: 1416355200000,
      y: 2.3529411764705883
    }]);
  });
});

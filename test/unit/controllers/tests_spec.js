describe('TestsController', function() {
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
    var expectedResponse = {
      tests: [
        {
          failure: 5592,
          id: "00187173-ab23-4181-9a15-e291a0d8e2d1",
          run_count: 55920,
          run_time: 0.608151,
          success: 55920,
          test_id: "tempest.api.identity.admin.v2.test_users.one"
        },
        {
          failure: 0,
          id: "001c6860-c966-4c0b-9928-ecccd162bed0",
          run_count: 4939,
          run_time: 5.97596,
          success: 4939,
          test_id: "tempest.api.volume.admin.test_snapshots_actions.two"
        },
        {
          failure: 1,
          id: "002a15e0-f6d1-472a-bd66-bb13ac4d77aa",
          run_count: 32292,
          run_time: 1.18864,
          success: 32291,
          test_id: "tempest.api.network.test_routers.three"
        }
      ]
    };

    var endpoint = API_ROOT + '/tests?callback=JSON_CALLBACK';
    $httpBackend.expectJSONP(endpoint)
    .respond(200, expectedResponse);
  }

  function mockConfigService() {
    var expectedResponse = { apiRoot: API_ROOT };
    var endpoint = 'config.json';
    $httpBackend.expectGET(endpoint).respond(200, expectedResponse);
  }

  it('should process chart data correctly', function() {
    var testsController = $controller('TestsController', {
      healthService: healthService
    });
    $httpBackend.flush();

    var expectedChartData = {
      'tempest.api.identity': [{
        key: 'tempest.api.identity',
        values: [{
          label: 'tempest.api.identity.admin.v2.test_users.one',
          value: 10
        }],
        tests: [{
          failure: 5592,
          id: '00187173-ab23-4181-9a15-e291a0d8e2d1',
          run_count: 55920,
          run_time: 0.608151,
          success: 55920,
          test_id: 'tempest.api.identity.admin.v2.test_users.one',
          failureAverage: 10
        }]
      }],
      'tempest.api.volume': [{
        key: 'tempest.api.volume',
        values: [],
        tests: [{
          failure: 0,
          id: '001c6860-c966-4c0b-9928-ecccd162bed0',
          run_count: 4939,
          run_time: 5.97596,
          success: 4939,
          test_id: 'tempest.api.volume.admin.test_snapshots_actions.two',
          failureAverage: 0
        }]
      }],
      'tempest.api.network': [{
        key: 'tempest.api.network',
        values: [],
        tests: [{
          failure: 1,
          id: '002a15e0-f6d1-472a-bd66-bb13ac4d77aa',
          run_count: 32292,
          run_time: 1.18864,
          success: 32291,
          test_id: 'tempest.api.network.test_routers.three',
          failureAverage: 0.00309674222717701
        }]
      }]
    };
    expect(testsController.chartData).toEqual(expectedChartData);
  });
});

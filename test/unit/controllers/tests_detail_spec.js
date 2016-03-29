describe('TestsDetailController', function() {
  beforeEach(function() {
    module('app');
    module('app.controllers');
  });

  var $scope, $httpBackend, $controller, healthService;
  var API_ROOT = 'http://8.8.4.4:8080';
  var DEFAULT_START_DATE = new Date();

  beforeEach(inject(function($rootScope, _$httpBackend_, _$controller_, _healthService_) {
    $httpBackend = _$httpBackend_;

    mockConfigService();

    $scope = $rootScope.$new();
    $controller = _$controller_;
    healthService = _healthService_;
  }));

  function mockHealthService(offset, limit, count) {
    if (typeof count === 'undefined') {
      count = limit;
    }

    var tests = [];
    for (var i = 0; i < count; i++) {
      tests.push({
        failure: 0,
        id: offset + i,
        run_count: 0,
        run_time: 0,
        success: 0,
        test_id: 'tempest.Test' + (offset + i)
      });
    }

    $httpBackend.expectJSONP(API_ROOT + '/tests/prefix/tempest?' + [
      'callback=JSON_CALLBACK',
      'limit=' + limit,
      'offset=' + offset
    ].join('&')).respond(200, { tests: tests });
  }

  function mockConfigService() {
    var expectedResponse = { apiRoot: API_ROOT };
    var endpoint = 'config.json';
    $httpBackend.expectGET(endpoint).respond(200, expectedResponse);
  }

  it('should load and process test data correctly', function() {
    mockHealthService(0, 100);
    var testsDetailController = $controller('TestsDetailController', {
      healthService: healthService,
      $scope: $scope,
      key: 'tempest'
    });
    $httpBackend.flush();

    expect(testsDetailController.tests[0].test_id).toEqual('tempest.Test0');
    expect(testsDetailController.tests.length).toEqual(100);
    expect(testsDetailController.max).toEqual(100);
    expect(testsDetailController.end).toBe(false);
  });

  it('should paginate correctly', function() {
    mockHealthService(0, 100);
    var testsDetailController = $controller('TestsDetailController', {
      healthService: healthService,
      $scope: $scope,
      key: 'tempest'
    });
    $httpBackend.flush();

    expect(testsDetailController.backAllowed).toBe(false);
    expect(testsDetailController.nextAllowed).toBe(true);

    mockHealthService(100, 100, 50);
    testsDetailController.nextPage();
    $httpBackend.flush();

    expect(testsDetailController.tests.length).toEqual(50);
    expect(testsDetailController.offset).toEqual(100);
    expect(testsDetailController.max).toEqual(150);
    expect(testsDetailController.end).toBe(true);
    expect(testsDetailController.backAllowed).toBe(true);
    expect(testsDetailController.nextAllowed).toBe(false);
  });
});

describe('TestsController', function() {
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
    mockHealthService();

    $scope = $rootScope.$new();
    $controller = _$controller_;
    healthService = _healthService_;
  }));

  function mockHealthService() {
    var expectedResponse = [
      'os_brick',
      'neutron_taas',
      'neutron_lib',
      'manila_tempest_tests',
      'heatclient',
      'solar/test/test_system_log_details',
      'test_base',
      'heat_keystone',
      'test_images',
      'test_hacking'
    ];

    var endpoint = API_ROOT + '/tests/prefix?callback=JSON_CALLBACK';
    $httpBackend.expectJSONP(endpoint).respond(200, expectedResponse);
  }

  function mockConfigService() {
    var expectedResponse = { apiRoot: API_ROOT };
    var endpoint = 'config.json';
    $httpBackend.expectGET(endpoint).respond(200, expectedResponse);
  }

  it('should process prefixes correctly', function() {
    var testsController = $controller('TestsController', {
      healthService: healthService,
      $scope: $scope
    });
    $httpBackend.flush();

    var expectedData = [
      'heat_keystone',
      'heatclient',
      'manila_tempest_tests',
      'neutron_lib',
      'neutron_taas',
      'os_brick',
      'solar/test/test_system_log_details',
      'test_base',
      'test_hacking',
      'test_images'
    ];

    expect(testsController.prefixes).toEqual(expectedData);
  });
});

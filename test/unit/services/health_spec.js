describe('HealthService', function() {
  beforeEach(function() {
    module('app');
    module('app.services');
  });

  var $httpBackend, healthService;
  var API_ROOT = 'http://8.8.4.4:8080';
  var DEFAULT_START_TIME = '2010-01-01T01:00:00';
  var DEFAULT_END_TIME = '2010-01-21T01:00:00';

  beforeEach(inject(function(_$httpBackend_, _healthService_) {
    $httpBackend = _$httpBackend_;
    healthService = _healthService_;

    $httpBackend.expectGET('config.json').respond(200, { apiRoot: API_ROOT });
  }));

  it('should get runs from build name', function() {
    var expectedResponse = [{ data: 'data' }, {}, {}];
    var endpoint = API_ROOT + '/build_name/openstack/cinder/runs?callback=JSON_CALLBACK';
    $httpBackend.expectJSONP(endpoint)
      .respond(200, expectedResponse);

    var onSuccess = function(response) {
      expect(response.status).toEqual(200);
      expect(response.data).toEqual(expectedResponse);
    };

    var onFailure = function(response) {
      throw new Error('should not execute this!');
    };

    healthService.getRunsFromBuildName('openstack/cinder')
      .then(onSuccess, onFailure);
    $httpBackend.flush();
  });

  it('should get runs grouped by metadata per datetime', function() {
    var expectedResponse = [{ data: 'data' }, {}, {}];
    var endpoint = API_ROOT +
                   '/runs/group_by/project?callback=JSON_CALLBACK&end_time=' +
                   DEFAULT_END_TIME +
                   '&start_time=' +
                   DEFAULT_START_TIME;
    $httpBackend.expectJSONP(endpoint)
      .respond(200, expectedResponse);

    var onSuccess = function(response) {
      expect(response.status).toEqual(200);
      expect(response.data).toEqual(expectedResponse);
    };

    var onFailure = function(response) {
      throw new Error('should not execute this!');
    };

    var options = {
      start_time: DEFAULT_START_TIME,
      end_time: DEFAULT_END_TIME
    };

    healthService.getRunsGroupedByMetadataPerDatetime('project', options)
      .then(onSuccess, onFailure);
    $httpBackend.flush();
  });

  it('should get runs', function() {
    var expectedResponse = [{ data: 'data' }, {}, {}];
    var endpoint = API_ROOT +
                   '/runs?callback=JSON_CALLBACK&end_time=' +
                   DEFAULT_END_TIME +
                   '&start_time=' +
                   DEFAULT_START_TIME;
    $httpBackend.expectJSONP(endpoint)
      .respond(200, expectedResponse);

    var onSuccess = function(response) {
      expect(response.status).toEqual(200);
      expect(response.data).toEqual(expectedResponse);
    };

    var onFailure = function(response) {
      throw new Error('should not execute this!');
    };

    var options = {
      start_time: DEFAULT_START_TIME,
      end_time: DEFAULT_END_TIME
    };

    healthService.getRuns(options)
      .then(onSuccess, onFailure);
    $httpBackend.flush();
  });

  it('should get runs from project', function() {
    var expectedResponse = [{ data: 'data' }, {}, {}];
    var endpoint = API_ROOT +
                   '/project/openstack/cinder/runs?' +
                   'callback=JSON_CALLBACK&' +
                   'start_date=' + DEFAULT_START_TIME + '&' +
                   'stop_date=' + DEFAULT_END_TIME;
    $httpBackend.expectJSONP(endpoint)
      .respond(200, expectedResponse);

    var onSuccess = function(response) {
      expect(response.status).toEqual(200);
      expect(response.data).toEqual(expectedResponse);
    };

    var onFailure = function(response) {
      throw new Error('should not execute this!');
    };

    var options = {
      start_date: DEFAULT_START_TIME,
      stop_date: DEFAULT_END_TIME
    };

    healthService.getRunsForRunMetadataKey('project', 'openstack/cinder', options)
      .then(onSuccess, onFailure);
    $httpBackend.flush();
  });

  it('should get tests from run', function() {
    var expectedResponse = [{ data: 'data' }, {}, {}];
    var endpoint = API_ROOT + '/run/run-id-12345/tests?callback=JSON_CALLBACK';
    $httpBackend.expectJSONP(endpoint)
      .respond(200, expectedResponse);

    var onSuccess = function(response) {
      expect(response.status).toEqual(200);
      expect(response.data).toEqual(expectedResponse);
    };

    var onFailure = function(response) {
      throw new Error('should not execute this!');
    };

    healthService.getTestsFromRun('run-id-12345')
      .then(onSuccess, onFailure);
    $httpBackend.flush();
  });

  it('should get test runs from run', function() {
    var expectedResponse = [{ data: 'data' }, {}, {}];
    var endpoint = API_ROOT + '/run/run-id-12345/test_runs?callback=JSON_CALLBACK';
    $httpBackend.expectJSONP(endpoint)
      .respond(200, expectedResponse);

    var onSuccess = function(response) {
      expect(response.status).toEqual(200);
      expect(response.data).toEqual(expectedResponse);
    };

    var onFailure = function(response) {
      throw new Error('should not execute this!');
    };

    healthService.getRunTestRuns('run-id-12345')
      .then(onSuccess, onFailure);
    $httpBackend.flush();
  });

  it('should get all tests', function() {
    var expectedResponse = [{ data: 'data' }, {}, {}];
    var endpoint = API_ROOT + '/tests?callback=JSON_CALLBACK';
    $httpBackend.expectJSONP(endpoint)
      .respond(200, expectedResponse);

    var onSuccess = function(response) {
      expect(response.status).toEqual(200);
      expect(response.data).toEqual(expectedResponse);
    };

    var onFailure = function(response) {
      throw new Error('should not execute this!');
    };

    healthService.getTests()
      .then(onSuccess, onFailure);
    $httpBackend.flush();
  });

  it('should get all run metadata keys', function() {
    var expectedResponse = [{ data: 'data' }, {}, {}];
    var endpoint = API_ROOT + '/runs/metadata/keys?callback=JSON_CALLBACK';
    $httpBackend.expectJSONP(endpoint)
      .respond(200, expectedResponse);

    var onSuccess = function(response) {
      expect(response.status).toEqual(200);
      expect(response.data).toEqual(expectedResponse);
    };

    var onFailure = function(response) {
      throw new Error('should not execute this!');
    };

    healthService.getRunMetadataKeys()
      .then(onSuccess, onFailure);
    $httpBackend.flush();
  });
});

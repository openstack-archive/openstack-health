describe('ConfigService', function() {
  beforeEach(function() {
    module('app');
    module('app.services');
  });

  var config, $httpBackend;

  beforeEach(inject(function(_$httpBackend_, _config_) {
    $httpBackend = _$httpBackend_;
    config = _config_;
  }));

  it('should get app configuration and pass it to your method', function() {
    var apiRoot = 'http://8.8.4.4:8080';
    var expectedResponse = [{ apiRoot: apiRoot }];
    $httpBackend.expectGET('config.json').respond(200, expectedResponse);

    var onSuccess = function(configResponse) {
      expect(configResponse[0].apiRoot).toEqual(apiRoot);
    };

    var onFailure = function() {
      throw new Error('should not execute this!');
    };

    config.get().then(onSuccess, onFailure);

    $httpBackend.flush();
  });

  it('should execute your fallback in case of an error', function() {
    var expectedResponse = [{}, {}, {}];
    $httpBackend.expectGET('config.json').respond(500, expectedResponse);

    var onSuccess = function(configResponse) {
      throw new Error('should not execute this!');
    };

    var onFailure = function(reason) {
      expect(reason.status).toEqual(500);
      expect(reason.data).toEqual(expectedResponse);
    };

    config.get().then(onSuccess, onFailure);

    $httpBackend.flush();
  });
});

describe('HomeController', function() {

  beforeEach(module('app'));

  var ctrl;

  beforeEach(inject(function($controller) {
    ctrl = $controller('HomeController', {});
  }));

  it('sanity check', function() {
    expect(1).toEqual(1);
  });
});

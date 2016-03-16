describe('Ctxcls Filter', function() {

  var ctxclsFilter;

  beforeEach(function() {
    module('app');
    module('app.filters');
  });

  beforeEach(inject(function(_ctxclsFilter_) {
    ctxclsFilter = _ctxclsFilter_;
  }));

  it('should return an error context class', function() {
    expect(ctxclsFilter(1)).toBe('danger');
  });

  it('should return an error context class', function() {
    expect(ctxclsFilter(0.151)).toBe('danger');
  });

  it('should return an waring context class', function() {
    expect(ctxclsFilter(0.15)).toBe('warning');
  });

  it('should return an waring context class', function() {
    expect(ctxclsFilter(0.081)).toBe('warning');
  });

  it('should return an info context class', function() {
    expect(ctxclsFilter(0.08)).toBe('info');
  });

  it('should return an info context class', function() {
    expect(ctxclsFilter(0.01)).toBe('info');
  });

  it('should return an success context class', function() {
    expect(ctxclsFilter(0)).toBe('success');
  });
});

describe('Percentage Filter', function() {

  var percentageFilter;

  beforeEach(function() {
    module('app');
    module('app.filters');
  });

  beforeEach(inject(function(_percentageFilter_) {
    percentageFilter = _percentageFilter_;
  }));

  it('should format a percentage correctly', function() {
    expect(percentageFilter(0.987654321)).toBe('98.77%');
  });

  it('should format a percentage using the specified decimal precision', function() {
    expect(percentageFilter(0.987654321, 3)).toBe('98.765%');
  });
});

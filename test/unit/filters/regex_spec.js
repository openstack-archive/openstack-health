describe('Regex Filter', function() {

  var regexFilter;
  var input = [{'id': 1, 'name': 'foo'},
               {'id': 2, 'name': 'bar'},
               {'id': 3, 'name': 'koo'}];

  beforeEach(function() {
    module('app');
    module('app.filters');
  });

  beforeEach(inject(function(_regexFilter_) {
    regexFilter = _regexFilter_;
  }));

  it('should get a object correctly', function() {
    expect(regexFilter(input, 'name', 'foo')).toEqual([
      {'id':1, 'name': 'foo'}]);
  });

  it('should get 2 objects correctly', function() {
    expect(regexFilter(input, 'name', 'foo|koo')).toEqual([
      {'id':1, 'name': 'foo'},
      {'id':3, 'name': 'koo'}]);
  });

  it('should get no object correctly', function() {
    expect(regexFilter(input, 'name', 'baar')).toEqual([]);
  });

  it('should get objects correctly', function() {
    expect(regexFilter(input, 'name', 'f|b|k')).toEqual([
                 {'id': 1, 'name': 'foo'},
                 {'id': 2, 'name': 'bar'},
                 {'id': 3, 'name': 'koo'}
    ]);
  });

  it('should get all objects correctly', function() {
    expect(regexFilter(input, 'name', '')).toEqual([
                 {'id': 1, 'name': 'foo'},
                 {'id': 2, 'name': 'bar'},
                 {'id': 3, 'name': 'koo'}
    ]);
  });
});

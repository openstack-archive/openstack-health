describe('TooltipService', function() {
  var $compile;
  var tooltipService;
  var sampleData;

  beforeEach(function() {
    module('app');
    module('app.services');

    inject(function($injector) {
      $compile = $injector.get('$compile');
      tooltipService = $injector.get('tooltipService');
    });

    sampleData = {
      index: 0,
      value: 0,
      color: 'green',
      data: { custom: 123 }
    };
  });

  it('should generate a simple tooltip', function() {
    var generator = tooltipService.generator([['Value']]);
    var element = angular.element(generator(sampleData))[0];

    expect(element.classList).toContain('osh-tooltip');
    expect(element.querySelectorAll('tr').length).toEqual(1);
    expect(element.querySelectorAll('td').length).toEqual(1);
    expect(element.querySelectorAll('th').length).toEqual(0);
  });

  it('should generate a tooltip with a header', function() {
    var generator = tooltipService.generator([
      ['Value']
    ], { title: 'test', header: ['column'] });

    var element = angular.element(generator(sampleData))[0];

    expect(element.querySelectorAll('tr').length).toEqual(3);
    expect(element.querySelectorAll('thead tr').length).toEqual(2);
    expect(element.querySelectorAll('thead tr')[0].innerText).toEqual('test');
    expect(element.querySelectorAll('thead tr')[1].innerText).toEqual('column');
    expect(element.querySelector('tbody tr td').innerText).toEqual('Value');
  });

  it('should generate a tooltip with custom columns', function() {
    var generator = tooltipService.generator([
      ['Value', function(d) { return d.value; }],
      ['Custom', function(d) { return d.data.custom; }]
    ]);
    var element = angular.element(generator(sampleData))[0];

    expect(element.querySelectorAll('tr').length).toEqual(2);
    expect(element.querySelectorAll('td').length).toEqual(4);

    var rows = element.querySelectorAll('tbody tr');
    expect(rows[0].children[0].innerText).toEqual('Value');
    expect(rows[0].children[1].innerText).toEqual('0');
    expect(rows[1].children[0].innerText).toEqual('Custom');
    expect(rows[1].children[1].innerText).toEqual('123');
  });

  it('should generate a tooltip with colors', function() {
    var generator = tooltipService.generator([
      ['Value', function(d) { return d.value; }],
      ['Custom', function(d) { return d.data.custom; }]
    ], { colors: ['red', 'blue'] });
    var element = angular.element(generator(sampleData))[0];

    expect(element.querySelectorAll('tr').length).toEqual(2);
    expect(element.querySelectorAll('td').length).toEqual(6);

    var guides = element.querySelectorAll('td:first-child.legend-color-guide');
    expect(guides.length).toEqual(2);
    expect(guides[0].children[0].getAttribute('style')).toEqual('background-color: red;');
    expect(guides[1].children[0].getAttribute('style')).toEqual('background-color: blue;');
  });
});

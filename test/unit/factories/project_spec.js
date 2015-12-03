describe('ProjectFactory', function() {
  var projectFactory, project;

  beforeEach(function() {
    module('app');
    module('app.factories');

    var mockMetricsService = {
      getFailRate: function() { return 0.5; },
      getNewMetrics: function() { return 'new metrics'; },
      addMetrics: function() { return 'added metrics'; },
      calculateRunMetrics: function() { return 'run metrics'; }
    };

    module(function($provide) {
      $provide.value('metricsService', mockMetricsService);
    });

    inject(function($injector) {
      projectFactory = $injector.get('projectFactory');
    });

    project = projectFactory.create('openstack/keystone');
  });

  it('should create a project', function() {
    expect(project.name).toEqual('openstack/keystone');
    expect(project.runs).toEqual([]);
    expect(project.metrics).toEqual('new metrics');
  });

  it('should add runs to an existing project', function() {
    var date = '2015-10-01T20:00:00';
    var runEntries = ['foo', 'bar'];
    project.addRuns(date, runEntries);

    var run = project.runs[0];
    expect(run.date).toEqual(new Date(date));
    expect(run.entries).toEqual(runEntries);
    expect(run.metrics).toEqual('run metrics');
  });

  it('should not add empty runs', function() {
    var date = '2015-10-01T20:00:00';

    project.addRuns(date, []);

    expect(project.runs.length).toEqual(0);
  });

  it('should add runs from different dates to an existing project', function() {
    var date0 = '2015-10-01T20:00:00';
    var date1 = '2015-11-11T20:00:00';

    project.addRuns(date0, ['foo']);
    project.addRuns(date1, ['bar']);

    expect(project.runs.length).toEqual(2);

    expect(project.runs[0].date).toEqual(new Date(date0));
    expect(project.runs[1].date).toEqual(new Date(date1));
  });

  it('should aggregate metrics across all runs', function() {
    project.addRuns('2015-10-10T20:00:00', ['foo']);
    project.addRuns('2015-11-11T20:00:00', ['bar']);
    project.addRuns('2015-12-12T20:00:00', ['baz']);

    expect(project.metrics).toEqual('added metrics');
  });
});

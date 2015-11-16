describe('ProjectService', function() {
  var projectService;

  beforeEach(function() {
    module('app.services');

    var mockProjectFactory = {
      create: function(name) {
        return {addRuns: function() {}};
      }
    };
    var mockMetricsService = {
      getFailRate: function() { return 0.5; },
      getNewMetrics: function() { return {}; },
      addMetrics: function() { return 'updated'; }
    };

    module(function($provide) {
      $provide.value('projectFactory', mockProjectFactory);
      $provide.value('metricsService', mockMetricsService);
    });

    inject(function($injector) {
      projectService = $injector.get('projectService');
    });
  });

  it('should create projects from runs per datetime', function() {
    var runs = {
      '2015-10-10T20:00:00': {
        'openstack/heat': [{ fail: 1, pass: 0, skip: 0 }],
        'openstack/keystone': [{ fail: 0, pass: 1, skip: 0 }],
        'openstack/tempest': [{ fail: 0, pass: 0, skip: 1 }]
      }
    };

    var projects = projectService.createProjects(runs);

    expect(projects.length).toEqual(3);
  });

  it('should update projects from different datetimes', function() {
    var runs = {
      '2015-10-10t20:00:00': {
        'openstack/tempest': [{ fail: 0, pass: 0, skip: 1 }]
      },
      '2015-11-11t20:00:00': {
        'openstack/heat': [{ fail: 1, pass: 0, skip: 0 }],
        'openstack/tempest': [{ fail: 0, pass: 0, skip: 1 }]
      }
    };

    var projects = projectService.createProjects(runs);

    expect(projects.length).toEqual(2);
  });

  it('should aggregate project stats by date', function() {
    var generateProject = function(name, date, passes, failures, skips) {
      return {
        name: name,
        runs: [{ date: date, passes: passes, failures: failures, skips: skips }]
      };
    };
    var date1 = new Date('2015-10-10T20:00:00');
    var date2 = new Date('2015-11-11T20:00:00');
    var projects = [
      generateProject('p1', date1, 1, 2, 3),
      generateProject('p2', date1, 4, 5, 6),
      generateProject('p3', date2, 7, 8, 9),
      generateProject('p4', date2, 0, 1, 2)
    ];

    var stats = projectService.getStatsByDate(projects);

    expect(stats.length).toEqual(2);

    expect(stats[0].date).toEqual(date1);
    expect(stats[0].metrics).toEqual('updated');

    expect(stats[1].date).toEqual(date2);
    expect(stats[1].metrics).toEqual('updated');
  });
});

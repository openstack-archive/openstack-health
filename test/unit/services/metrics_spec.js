describe('MetricService', function() {
  var metricsService;

  beforeEach(function() {
    module('app.services');

    inject(function($injector) {
      metricsService = $injector.get('metricsService');
    });
  });

  it('should create a new metrics object', function() {
    var date = new Date();
    var metrics = metricsService.getNewMetrics(date);

    expect(metrics.passes).toEqual(0);
    expect(metrics.failures).toEqual(0);
    expect(metrics.skips).toEqual(0);
  });

  it('should calculate fail rate', function() {
    var objects = [
      { metrics: { passes: 0, failures: 0 }, expectedFailRate: 0 },
      { metrics: { passes: 0, failures: 1 }, expectedFailRate: 1 },
      { metrics: { passes: 2, failures: 1 }, expectedFailRate: 0.33 },
      { metrics: { passes: 1, failures: 2 }, expectedFailRate: 0.67 },
      { metrics: { passes: 1, failures: 3 }, expectedFailRate: 0.75 }
    ];

    angular.forEach(objects, function(obj) {
      var failRate = metricsService.getFailRate(obj.metrics);
      expect(failRate).toEqual(obj.expectedFailRate);
    });
  });

  it('should calculate run metrics', function() {
    var runEntries = [
      { fail: 0, pass: 1149, skip: 119 },
      { fail: 0, pass: 40, skip: 1 },
      { fail: 1, pass: 6, skip: 0 },
      { fail: 0, pass: 0, skip: 1 }
    ];
    var metrics = metricsService.calculateRunMetrics(runEntries);

    expect(metrics.passes).toEqual(2);
    expect(metrics.failures).toEqual(1);
    expect(metrics.skips).toEqual(1);
  });

  describe('update metrics', function() {
    var metrics, newMetric;

    beforeEach(function() {
      metrics = { passes: 0, failures: 1, skips: 2, failRate: 1 };
      var metrics2 = { passes: 1, failures: 2, skips: 3, failRate: 1 };
      newMetric = metricsService.addMetrics(metrics, metrics2);
    });

    it('should add new passes, failures, and skips', function() {
      expect(newMetric.passes).toEqual(1);
      expect(newMetric.failures).toEqual(3);
      expect(newMetric.skips).toEqual(5);
    });

    it('should recalculate fail rate', function() {
      expect(newMetric.failRate).toEqual(0.75);
    });

    it('should not have side effects in the original metrics', function() {
      expect(metrics.passes).toEqual(0);
      expect(metrics.failures).toEqual(1);
      expect(metrics.skips).toEqual(2);
      expect(metrics.failRate).toEqual(1);
    });
  });

});

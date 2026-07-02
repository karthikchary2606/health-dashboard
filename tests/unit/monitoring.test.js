const monitoringService = require('../../server/services/monitoring');

describe('MonitoringService', () => {
  beforeEach(() => {
    monitoringService.reset();
  });

  test('logs plan generation metrics', () => {
    monitoringService.logPlanGeneration('user123', 87);
    const metrics = monitoringService.getMetrics();

    expect(metrics.personalization.totalPlansGenerated).toBe(1);
    expect(metrics.personalization.avgPlanGenerationMs).toBe(87);
  });

  test('calculates effective diet cache hit rate', () => {
    monitoringService.logEffectiveDiet('user1', 'VEGETARIAN', 'VEGETARIAN', true);
    monitoringService.logEffectiveDiet('user2', 'VEGETARIAN', 'NON_VEGETARIAN', false);

    const metrics = monitoringService.getMetrics();
    expect(metrics.caching.cacheHitRate).toBe('50.00%');
  });

  test('logs profile updates', () => {
    monitoringService.logProfileUpdate('user123', ['dietType', 'age']);
    const metrics = monitoringService.getMetrics();

    expect(metrics.profileUpdates.totalUpdates).toBe(1);
  });
});

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Metrics Dashboard', () => {
  test('GET /api/metrics returns aggregated metrics', async () => {
    const response = await request(app)
      .get('/api/metrics');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('personalization');
    expect(response.body).toHaveProperty('caching');
    expect(response.body).toHaveProperty('feedback');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('Metrics have correct structure', async () => {
    const response = await request(app)
      .get('/api/metrics');

    expect(response.status).toBe(200);
    
    // Check personalization metrics
    expect(response.body.personalization).toHaveProperty('avgPlanGenerationMs');
    expect(response.body.personalization).toHaveProperty('totalPlansGenerated');
    expect(response.body.personalization).toHaveProperty('status');
    expect(typeof response.body.personalization.avgPlanGenerationMs).toBe('number');
    expect(typeof response.body.personalization.totalPlansGenerated).toBe('number');

    // Check caching metrics
    expect(response.body.caching).toHaveProperty('cacheHitRate');
    expect(response.body.caching).toHaveProperty('effectiveDietCacheHits');
    expect(response.body.caching).toHaveProperty('effectiveDietCacheMisses');
    expect(response.body.caching).toHaveProperty('status');

    // Check feedback metrics
    expect(response.body.feedback).toHaveProperty('totalResponses');
    expect(response.body.feedback).toHaveProperty('averageMealSatisfaction');
    expect(response.body.feedback).toHaveProperty('averagePersonalizationMatch');
    expect(response.body.feedback).toHaveProperty('status');
  });

  test('Metrics have correct status values', async () => {
    const response = await request(app)
      .get('/api/metrics');

    expect(response.status).toBe(200);
    const validStatuses = ['healthy', 'warning', 'excellent', 'strong', 'insufficient-data', 'needs-attention'];
    
    expect(validStatuses).toContain(response.body.personalization.status);
    expect(validStatuses).toContain(response.body.caching.status);
    expect(validStatuses).toContain(response.body.feedback.status);
  });

  test('Personalization status is healthy when avg time < 150ms', async () => {
    const response = await request(app)
      .get('/api/metrics');

    expect(response.status).toBe(200);
    
    if (response.body.personalization.avgPlanGenerationMs < 150) {
      expect(response.body.personalization.status).toBe('healthy');
    }
  });

  test('Personalization status is warning when avg time >= 150ms', async () => {
    const response = await request(app)
      .get('/api/metrics');

    expect(response.status).toBe(200);
    
    if (response.body.personalization.avgPlanGenerationMs >= 150) {
      expect(response.body.personalization.status).toBe('warning');
    }
  });

  test('Cache status is excellent when hit rate > 90%', async () => {
    const response = await request(app)
      .get('/api/metrics');

    expect(response.status).toBe(200);
    const hitRate = parseFloat(response.body.caching.cacheHitRate);
    
    if (hitRate > 90) {
      expect(response.body.caching.status).toBe('excellent');
    }
  });

  test('Cache status is needs-attention when hit rate <= 90%', async () => {
    const response = await request(app)
      .get('/api/metrics');

    expect(response.status).toBe(200);
    const hitRate = parseFloat(response.body.caching.cacheHitRate);
    
    if (hitRate <= 90) {
      expect(response.body.caching.status).toBe('needs-attention');
    }
  });

  test('Feedback status is insufficient-data with no responses', async () => {
    const response = await request(app)
      .get('/api/metrics');

    expect(response.status).toBe(200);
    
    if (response.body.feedback.totalResponses === 0) {
      expect(response.body.feedback.status).toBe('insufficient-data');
    }
  });

  test('Timestamp is valid ISO string', async () => {
    const response = await request(app)
      .get('/api/metrics');

    expect(response.status).toBe(200);
    expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    expect(new Date(response.body.timestamp).getTime()).toBeGreaterThan(0);
  });

  test('Response includes valid numeric values', async () => {
    const response = await request(app)
      .get('/api/metrics');

    expect(response.status).toBe(200);
    expect(response.body.personalization.avgPlanGenerationMs).toBeGreaterThanOrEqual(0);
    expect(response.body.personalization.totalPlansGenerated).toBeGreaterThanOrEqual(0);
    expect(response.body.caching.effectiveDietCacheHits).toBeGreaterThanOrEqual(0);
    expect(response.body.caching.effectiveDietCacheMisses).toBeGreaterThanOrEqual(0);
  });
});

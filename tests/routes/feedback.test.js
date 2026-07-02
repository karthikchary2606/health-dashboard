const request = require('supertest');
const app = require('../../server');
const fs = require('fs');
const path = require('path');

describe('Feedback API', () => {
  const FEEDBACK_LOG_PATH = path.join(__dirname, '../../server/logs/feedback.jsonl');

  beforeEach(() => {
    // Clean up feedback log before each test
    if (fs.existsSync(FEEDBACK_LOG_PATH)) {
      fs.unlinkSync(FEEDBACK_LOG_PATH);
    }
  });

  test('POST /api/feedback submits feedback successfully', async () => {
    const feedbackData = {
      mealSatisfaction: 4,
      personalizationMatch: 3,
      additionalFeedback: 'Great variety!',
      submittedAt: new Date().toISOString()
    };

    const response = await request(app)
      .post('/api/feedback')
      .send(feedbackData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.feedbackId).toBeDefined();
    expect(response.body.message).toBe('Feedback recorded successfully');
  });

  test('POST /api/feedback requires mealSatisfaction', async () => {
    const response = await request(app)
      .post('/api/feedback')
      .send({
        personalizationMatch: 3,
        additionalFeedback: 'Test',
        submittedAt: new Date().toISOString()
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('required');
  });

  test('POST /api/feedback requires personalizationMatch', async () => {
    const response = await request(app)
      .post('/api/feedback')
      .send({
        mealSatisfaction: 4,
        additionalFeedback: 'Test',
        submittedAt: new Date().toISOString()
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('required');
  });

  test('POST /api/feedback validates rating range', async () => {
    const response = await request(app)
      .post('/api/feedback')
      .send({
        mealSatisfaction: 5,
        personalizationMatch: 3,
        submittedAt: new Date().toISOString()
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('between 1 and 4');
  });

  test('POST /api/feedback accepts optional additionalFeedback', async () => {
    const response = await request(app)
      .post('/api/feedback')
      .send({
        mealSatisfaction: 4,
        personalizationMatch: 3,
        submittedAt: new Date().toISOString()
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  test('GET /api/feedback/summary returns aggregated data', async () => {
    // Submit some feedback
    await request(app)
      .post('/api/feedback')
      .send({
        mealSatisfaction: 4,
        personalizationMatch: 3,
        additionalFeedback: 'Excellent!',
        submittedAt: new Date().toISOString()
      });

    await request(app)
      .post('/api/feedback')
      .send({
        mealSatisfaction: 2,
        personalizationMatch: 4,
        additionalFeedback: 'Could improve meals',
        submittedAt: new Date().toISOString()
      });

    const response = await request(app)
      .get('/api/feedback/summary');

    expect(response.status).toBe(200);
    expect(response.body.totalResponses).toBe(2);
    expect(response.body.averageMealSatisfaction).toBe(3);
    expect(response.body.averagePersonalizationMatch).toBe(3.5);
    expect(response.body.averageCombined).toBe(3.25);
    expect(response.body.feedbackPieces.length).toBe(2);
    expect(response.body.timestamp).toBeDefined();
  });

  test('GET /api/feedback/summary returns empty state when no feedback', async () => {
    const response = await request(app)
      .get('/api/feedback/summary');

    expect(response.status).toBe(200);
    expect(response.body.totalResponses).toBe(0);
    expect(response.body.averageMealSatisfaction).toBe(0);
    expect(response.body.averagePersonalizationMatch).toBe(0);
    expect(response.body.feedbackPieces).toEqual([]);
  });

  test('GET /api/feedback/summary only includes feedback with comments', async () => {
    // Submit feedback with and without comments
    await request(app)
      .post('/api/feedback')
      .send({
        mealSatisfaction: 4,
        personalizationMatch: 3,
        additionalFeedback: 'Great!',
        submittedAt: new Date().toISOString()
      });

    await request(app)
      .post('/api/feedback')
      .send({
        mealSatisfaction: 2,
        personalizationMatch: 4,
        additionalFeedback: null,
        submittedAt: new Date().toISOString()
      });

    const response = await request(app)
      .get('/api/feedback/summary');

    expect(response.status).toBe(200);
    expect(response.body.totalResponses).toBe(2);
    expect(response.body.feedbackPieces.length).toBe(1);
    expect(response.body.feedbackPieces[0].feedback).toBe('Great!');
  });

  test('GET /api/feedback/summary limits feedback pieces to last 10', async () => {
    // Submit more than 10 pieces of feedback
    for (let i = 0; i < 15; i++) {
      await request(app)
        .post('/api/feedback')
        .send({
          mealSatisfaction: 3,
          personalizationMatch: 3,
          additionalFeedback: `Feedback ${i}`,
          submittedAt: new Date().toISOString()
        });
    }

    const response = await request(app)
      .get('/api/feedback/summary');

    expect(response.status).toBe(200);
    expect(response.body.totalResponses).toBe(15);
    expect(response.body.feedbackPieces.length).toBe(10);
  });

  test('Feedback is persisted to JSONL file', async () => {
    const feedbackData = {
      mealSatisfaction: 4,
      personalizationMatch: 3,
      additionalFeedback: 'Test persistence',
      submittedAt: new Date().toISOString()
    };

    await request(app)
      .post('/api/feedback')
      .send(feedbackData);

    expect(fs.existsSync(FEEDBACK_LOG_PATH)).toBe(true);
    const content = fs.readFileSync(FEEDBACK_LOG_PATH, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    expect(lines.length).toBe(1);

    const entry = JSON.parse(lines[0]);
    expect(entry.mealSatisfaction).toBe(4);
    expect(entry.personalizationMatch).toBe(3);
    expect(entry.additionalFeedback).toBe('Test persistence');
  });
});

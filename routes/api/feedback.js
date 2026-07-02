// routes/api/feedback.js
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const FEEDBACK_LOG_PATH = path.join(__dirname, '../../server/logs/feedback.jsonl');

function ensureFeedbackDir() {
  const dir = path.dirname(FEEDBACK_LOG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// POST /api/feedback - Submit new feedback
router.post('/', (req, res) => {
  try {
    ensureFeedbackDir();

    const { mealSatisfaction, personalizationMatch, additionalFeedback } = req.body;

    // Validate input
    if (!mealSatisfaction || !personalizationMatch) {
      return res.status(400).json({ 
        error: 'mealSatisfaction and personalizationMatch are required' 
      });
    }

    if (mealSatisfaction < 1 || mealSatisfaction > 4 || 
        personalizationMatch < 1 || personalizationMatch > 4) {
      return res.status(400).json({ 
        error: 'Ratings must be between 1 and 4' 
      });
    }

    const feedbackEntry = {
      id: `feedback-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: req.user?.id || 'anonymous',
      mealSatisfaction,
      personalizationMatch,
      additionalFeedback,
      submittedAt: req.body.submittedAt
    };

    // Append to JSONL file
    fs.appendFileSync(
      FEEDBACK_LOG_PATH,
      JSON.stringify(feedbackEntry) + '\n'
    );

    res.status(201).json({
      success: true,
      feedbackId: feedbackEntry.id,
      message: 'Feedback recorded successfully'
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ error: 'Failed to record feedback' });
  }
});

// GET /api/feedback/summary - Get aggregated feedback statistics
router.get('/summary', (req, res) => {
  try {
    ensureFeedbackDir();

    if (!fs.existsSync(FEEDBACK_LOG_PATH)) {
      return res.json({
        totalResponses: 0,
        averageMealSatisfaction: 0,
        averagePersonalizationMatch: 0,
        averageCombined: 0,
        feedbackPieces: [],
        timestamp: new Date().toISOString()
      });
    }

    const content = fs.readFileSync(FEEDBACK_LOG_PATH, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const feedbackEntries = lines.map(line => JSON.parse(line));

    if (feedbackEntries.length === 0) {
      return res.json({
        totalResponses: 0,
        averageMealSatisfaction: 0,
        averagePersonalizationMatch: 0,
        averageCombined: 0,
        feedbackPieces: [],
        timestamp: new Date().toISOString()
      });
    }

    const mealSatisfactionSum = feedbackEntries.reduce((sum, f) => sum + f.mealSatisfaction, 0);
    const personalizationMatchSum = feedbackEntries.reduce((sum, f) => sum + f.personalizationMatch, 0);

    const averageMealSatisfaction = (mealSatisfactionSum / feedbackEntries.length).toFixed(2);
    const averagePersonalizationMatch = (personalizationMatchSum / feedbackEntries.length).toFixed(2);
    const averageCombined = ((parseFloat(averageMealSatisfaction) + parseFloat(averagePersonalizationMatch)) / 2).toFixed(2);

    const feedbackPieces = feedbackEntries
      .filter(f => f.additionalFeedback && f.additionalFeedback.trim())
      .map(f => ({
        feedback: f.additionalFeedback,
        mealSatisfaction: f.mealSatisfaction,
        personalizationMatch: f.personalizationMatch,
        submittedAt: f.timestamp
      }))
      .slice(-10); // Last 10 pieces of feedback

    res.json({
      totalResponses: feedbackEntries.length,
      averageMealSatisfaction: parseFloat(averageMealSatisfaction),
      averagePersonalizationMatch: parseFloat(averagePersonalizationMatch),
      averageCombined: parseFloat(averageCombined),
      feedbackPieces,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Feedback summary error:', error);
    res.status(500).json({ error: 'Failed to retrieve feedback summary' });
  }
});

module.exports = router;

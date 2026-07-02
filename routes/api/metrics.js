const express = require('express');
const monitoringService = require('../../server/services/monitoring');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// GET /api/metrics - Aggregated metrics for dashboard
router.get('/', (req, res) => {
  try {
    // Get monitoring metrics
    const monitoring = monitoringService.getMetrics();

    // Get feedback summary
    const feedbackPath = path.join(__dirname, '../../server/logs/feedback.jsonl');
    let feedback = {
      totalResponses: 0,
      averageMealSatisfaction: 0,
      averagePersonalizationMatch: 0
    };

    if (fs.existsSync(feedbackPath)) {
      const content = fs.readFileSync(feedbackPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      if (lines.length > 0) {
        const feedbackEntries = lines.map(line => JSON.parse(line));
        const mealSum = feedbackEntries.reduce((sum, f) => sum + f.mealSatisfaction, 0);
        const personalizationSum = feedbackEntries.reduce((sum, f) => sum + f.personalizationMatch, 0);

        feedback = {
          totalResponses: feedbackEntries.length,
          averageMealSatisfaction: (mealSum / feedbackEntries.length).toFixed(2),
          averagePersonalizationMatch: (personalizationSum / feedbackEntries.length).toFixed(2)
        };
      }
    }

    // Combine all metrics
    const aggregated = {
      timestamp: new Date().toISOString(),
      personalization: {
        avgPlanGenerationMs: monitoring.personalization.avgPlanGenerationMs,
        totalPlansGenerated: monitoring.personalization.totalPlansGenerated,
        status: monitoring.personalization.avgPlanGenerationMs < 150 ? 'healthy' : 'warning'
      },
      caching: {
        cacheHitRate: monitoring.caching.cacheHitRate,
        effectiveDietCacheHits: monitoring.caching.effectiveDietCacheHits,
        effectiveDietCacheMisses: monitoring.caching.effectiveDietCacheMisses,
        status: parseFloat(monitoring.caching.cacheHitRate) > 90 ? 'excellent' : 'needs-attention'
      },
      feedback: {
        totalResponses: feedback.totalResponses,
        averageMealSatisfaction: feedback.averageMealSatisfaction,
        averagePersonalizationMatch: feedback.averagePersonalizationMatch,
        status: feedback.totalResponses > 0 && (
          feedback.averageMealSatisfaction >= 3.0 && 
          feedback.averagePersonalizationMatch >= 3.0
        ) ? 'strong' : 'insufficient-data'
      }
    };

    res.json(aggregated);
  } catch (error) {
    console.error('Metrics retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve metrics',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

const fs = require('fs');
const path = require('path');

class MonitoringService {
  constructor() {
    this.metrics = {
      plans: {
        total: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0
      },
      effectiveDiet: {
        cacheHits: 0,
        cacheMisses: 0,
        hitRate: 0
      },
      profileUpdates: {
        total: 0,
        lastUpdate: null
      }
    };
    this.logFilePath = path.join(__dirname, '../logs/monitoring.log');
    this.ensureLogDir();
  }

  ensureLogDir() {
    const logDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  logEffectiveDiet(userId, profileDietType, effectiveDietType, isCacheHit) {
    const event = {
      timestamp: new Date().toISOString(),
      type: 'effective_diet_inference',
      userId,
      profileDietType,
      effectiveDietType,
      isCacheHit,
      inferenceOccurred: profileDietType !== effectiveDietType
    };

    if (isCacheHit) {
      this.metrics.effectiveDiet.cacheHits++;
    } else {
      this.metrics.effectiveDiet.cacheMisses++;
    }

    this.updateHitRate();
    this.writeLog(event);
  }

  logPlanGeneration(userId, generationTimeMs, planType = 'standard') {
    const event = {
      timestamp: new Date().toISOString(),
      type: 'plan_generation',
      userId,
      generationTimeMs,
      planType
    };

    this.metrics.plans.total++;
    this.metrics.plans.totalTime += generationTimeMs;
    this.metrics.plans.avgTime = this.metrics.plans.totalTime / this.metrics.plans.total;
    this.metrics.plans.minTime = Math.min(this.metrics.plans.minTime, generationTimeMs);
    this.metrics.plans.maxTime = Math.max(this.metrics.plans.maxTime, generationTimeMs);

    this.writeLog(event);
  }

  logProfileUpdate(userId, changedFields = []) {
    const event = {
      timestamp: new Date().toISOString(),
      type: 'profile_update',
      userId,
      changedFields,
      triggersPlanRegeneration: changedFields.includes('dietType') ||
                                 changedFields.includes('foodPreferences')
    };

    this.metrics.profileUpdates.total++;
    this.metrics.profileUpdates.lastUpdate = event.timestamp;

    this.writeLog(event);
  }

  updateHitRate() {
    const total = this.metrics.effectiveDiet.cacheHits + this.metrics.effectiveDiet.cacheMisses;
    this.metrics.effectiveDiet.hitRate = total > 0
      ? (this.metrics.effectiveDiet.cacheHits / total * 100).toFixed(2)
      : 0;
  }

  writeLog(event) {
    const logEntry = JSON.stringify(event);
    fs.appendFileSync(this.logFilePath, logEntry + '\n');
  }

  getMetrics() {
    return {
      timestamp: new Date().toISOString(),
      personalization: {
        avgPlanGenerationMs: this.metrics.plans.avgTime || 0,
        minPlanGenerationMs: this.metrics.plans.minTime === Infinity ? 0 : this.metrics.plans.minTime,
        maxPlanGenerationMs: this.metrics.plans.maxTime || 0,
        totalPlansGenerated: this.metrics.plans.total
      },
      caching: {
        effectiveDietCacheHits: this.metrics.effectiveDiet.cacheHits,
        effectiveDietCacheMisses: this.metrics.effectiveDiet.cacheMisses,
        cacheHitRate: `${this.metrics.effectiveDiet.hitRate}%`
      },
      profileUpdates: {
        totalUpdates: this.metrics.profileUpdates.total,
        lastUpdateTime: this.metrics.profileUpdates.lastUpdate
      }
    };
  }

  reset() {
    this.metrics = {
      plans: {
        total: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0
      },
      effectiveDiet: {
        cacheHits: 0,
        cacheMisses: 0,
        hitRate: 0
      },
      profileUpdates: {
        total: 0,
        lastUpdate: null
      }
    };
  }
}

module.exports = new MonitoringService();

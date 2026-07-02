const monitoringService = require('../services/monitoring.js');

function metricsMiddleware(req, res, next) {
  const startTime = Date.now();

  res.on('finish', () => {
    const endTime = Date.now();
    const duration = endTime - startTime;

    if (req.path === '/api/profile/plan' && req.method === 'GET') {
      const userId = req.user?.id || 'anonymous';
      monitoringService.logPlanGeneration(userId, duration, 'standard');
    }
  });

  next();
}

module.exports = metricsMiddleware;

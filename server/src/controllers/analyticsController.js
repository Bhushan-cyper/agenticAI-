const analyticsService = require('../services/analyticsService');

class AnalyticsController {
  async getOverview(req, res, next) {
    try {
      const metrics = await analyticsService.getOverview();
      res.status(200).json({
        success: true,
        metrics,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AnalyticsController();

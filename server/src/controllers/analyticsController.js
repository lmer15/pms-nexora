const analyticsService = require('../services/analyticsAggregator');
const exportService = require('../services/pdfGenerator');
const { validationResult } = require('express-validator');

class AnalyticsController {
  async healthCheck(req, res) {
    try {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'analytics'
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: error.message
      });
    }
  }

  async getGlobalAnalytics(req, res) {
    try {
      const { range = '4w' } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role;


      const analytics = await analyticsService.getGlobalAnalytics(userId, userRole, range);
      
      res.json(analytics);
    } catch (error) {
      console.error('Global analytics error:', error);
      res.status(500).json({
        error: 'Failed to fetch global analytics',
        message: error.message
      });
    }
  }

  async getFacilityAnalytics(req, res) {
    try {
      const { facilityId } = req.params;
      const { range = '4w' } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role;

      const analytics = await analyticsService.getFacilityAnalytics(
        facilityId, 
        userId, 
        userRole, 
        range
      );
      res.json(analytics);
    } catch (error) {
      console.error('Facility analytics error:', error);
      res.status(500).json({
        error: 'Failed to fetch facility analytics',
        message: error.message
      });
    }
  }

  async getMemberAnalytics(req, res) {
    try {
      const { memberId } = req.params;
      const { range = '4w' } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Check if user can access this member's analytics
      const canAccess = await analyticsService.canAccessMemberAnalytics(
        memberId, 
        userId, 
        userRole
      );

      if (!canAccess) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have permission to view this member\'s analytics'
        });
      }

      const analytics = await analyticsService.getMemberAnalytics(
        memberId, 
        userId, 
        userRole, 
        range
      );
      
      res.json(analytics);
    } catch (error) {
      console.error('Member analytics error:', error);
      res.status(500).json({
        error: 'Failed to fetch member analytics',
        message: error.message
      });
    }
  }

  async exportGlobalAnalytics(req, res) {
    try {
      const { range = '4w' } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role;

      const exportResult = await exportService.generateGlobalPDF(userId, userRole, range);
      
      res.json(exportResult);
    } catch (error) {
      console.error('Global export error:', error);
      res.status(500).json({
        error: 'Failed to export global analytics',
        message: error.message
      });
    }
  }

  async exportFacilityAnalytics(req, res) {
    try {
      const { facilityId } = req.params;
      const { range = '4w' } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role;

      const exportResult = await exportService.generateFacilityPDF(
        facilityId, 
        userId, 
        userRole, 
        range
      );
      
      res.json(exportResult);
    } catch (error) {
      console.error('Facility export error:', error);
      res.status(500).json({
        error: 'Failed to export facility analytics',
        message: error.message
      });
    }
  }

  async exportMemberAnalytics(req, res) {
    try {
      const { memberId } = req.params;
      const { range = '4w' } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Check access permissions
      const canAccess = await analyticsService.canAccessMemberAnalytics(
        memberId, 
        userId, 
        userRole
      );

      if (!canAccess) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have permission to export this member\'s analytics'
        });
      }

      const exportResult = await exportService.generateMemberPDF(
        memberId, 
        userId, 
        userRole, 
        range
      );
      
      res.json(exportResult);
    } catch (error) {
      console.error('Member export error:', error);
      res.status(500).json({
        error: 'Failed to export member analytics',
        message: error.message
      });
    }
  }
}

module.exports = new AnalyticsController();

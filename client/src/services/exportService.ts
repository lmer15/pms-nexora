import { analyticsService } from './analyticsService';
import { TimeRange } from '../types/analytics';

export class ExportService {
  async exportGlobalAnalytics(range: TimeRange = '4w'): Promise<void> {
    try {
      const exportResponse = await analyticsService.exportGlobalAnalytics(range);
      await analyticsService.downloadExport(exportResponse.downloadUrl, exportResponse.filename);
    } catch (error) {
      console.error('Global analytics export failed:', error);
      throw new Error('Failed to export global analytics');
    }
  }

  async exportFacilityAnalytics(facilityId: string, range: TimeRange = '4w'): Promise<void> {
    try {
      const exportResponse = await analyticsService.exportFacilityAnalytics(facilityId, range);
      await analyticsService.downloadExport(exportResponse.downloadUrl, exportResponse.filename);
    } catch (error) {
      console.error('Facility analytics export failed:', error);
      throw new Error('Failed to export facility analytics');
    }
  }

  async exportMemberAnalytics(memberId: string, range: TimeRange = '4w'): Promise<void> {
    try {
      const exportResponse = await analyticsService.exportMemberAnalytics(memberId, range);
      await analyticsService.downloadExport(exportResponse.downloadUrl, exportResponse.filename);
    } catch (error) {
      console.error('Member analytics export failed:', error);
      throw new Error('Failed to export member analytics');
    }
  }

  generateFilename(scope: 'global' | 'facility' | 'member', name: string, range: TimeRange): string {
    const date = new Date().toISOString().split('T')[0];
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    return `nexora-analytics-${scope}-${sanitizedName}-${range}-${date}.pdf`;
  }

  formatExportSummary(data: any, scope: string): string {
    const timestamp = new Date().toLocaleString();
    
    switch (scope) {
      case 'global':
        return `Global Analytics Report\nGenerated: ${timestamp}\n\nOverall utilization: ${data.kpis.avgUtilization}%\nActive members: ${data.kpis.activeMembers}\nTotal facilities: ${data.kpis.totalFacilities}`;
      
      case 'facility':
        return `Facility Analytics Report\nGenerated: ${timestamp}\n\nFacility: ${data.facility.name}\nAverage utilization: ${data.kpis.avgUtilization}%\nActive members: ${data.kpis.activeMembers}`;
      
      case 'member':
        return `Member Analytics Report\nGenerated: ${timestamp}\n\nMember: ${data.member.name}\nUtilization: ${data.kpis.utilization}%\nTotal tasks: ${data.kpis.totalTasks}`;
      
      default:
        return `Analytics Report\nGenerated: ${timestamp}`;
    }
  }
}

export const exportService = new ExportService();
export default exportService;

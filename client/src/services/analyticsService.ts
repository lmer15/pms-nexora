import { 
  GlobalAnalyticsResponse, 
  FacilityAnalyticsResponse, 
  MemberAnalyticsResponse,
  TimeRange,
  ExportResponse 
} from '../types/analytics';
import api from '../api/api';

class AnalyticsService {
  private async request<T>(endpoint: string, options: any = {}): Promise<T> {
    try {
      const response = await api.get(`/analytics${endpoint}`, options);
      return response.data;
    } catch (error: any) {
      console.error('Analytics API error:', error.response?.data || error.message);
      throw new Error(`Analytics API error: ${error.response?.status || 'Unknown'} ${error.response?.statusText || error.message}`);
    }
  }

  async getGlobalAnalytics(range: TimeRange = '4w', forceRefresh: boolean = false): Promise<GlobalAnalyticsResponse> {
    const params: any = { range };
    if (forceRefresh) {
      params._t = Date.now().toString();
    }
    return this.request<GlobalAnalyticsResponse>('/global', { params });
  }

  async getFacilityAnalytics(facilityId: string, range: TimeRange = '4w'): Promise<FacilityAnalyticsResponse> {
    return this.request<FacilityAnalyticsResponse>(`/facility/${facilityId}`, { params: { range } });
  }

  async getMemberAnalytics(memberId: string, range: TimeRange = '4w', facilityId?: string): Promise<MemberAnalyticsResponse> {
    const params: any = { range };
    if (facilityId) {
      params.facilityId = facilityId;
    }
    return this.request<MemberAnalyticsResponse>(`/member/${memberId}`, { params });
  }

  async exportGlobalAnalytics(range: TimeRange = '4w'): Promise<ExportResponse> {
    return this.request<ExportResponse>('/export/global', { params: { range } });
  }

  async exportFacilityAnalytics(facilityId: string, range: TimeRange = '4w'): Promise<ExportResponse> {
    return this.request<ExportResponse>(`/export/facility/${facilityId}`, { params: { range } });
  }

  async exportMemberAnalytics(memberId: string, range: TimeRange = '4w'): Promise<ExportResponse> {
    return this.request<ExportResponse>(`/export/member/${memberId}`, { params: { range } });
  }

  async downloadExport(downloadUrl: string, filename: string): Promise<void> {
    try {
      // Construct the full URL for the PDF file
      const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const serverBaseUrl = baseUrl.replace('/api', ''); // Remove /api to get server base URL
      const fullUrl = `${serverBaseUrl}${downloadUrl}`;
      
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error('Failed to download export file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }

  // Health check endpoint
  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;

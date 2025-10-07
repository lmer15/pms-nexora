import { 
  GlobalAnalyticsResponse, 
  FacilityAnalyticsResponse, 
  MemberAnalyticsResponse,
  TimeRange,
  ExportResponse 
} from '../types/analytics';
import { API_BASE_URL as BASE_URL } from '../config/api';
import { storage } from '../utils/storage';

const API_BASE_URL = `${BASE_URL}/analytics`;

class AnalyticsService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = storage.getToken();
    console.log('Request token available:', !!token);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    console.log('Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`Analytics API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getGlobalAnalytics(range: TimeRange = '4w'): Promise<GlobalAnalyticsResponse> {
    return this.request<GlobalAnalyticsResponse>(`/global?range=${range}`);
  }

  async getFacilityAnalytics(facilityId: string, range: TimeRange = '4w'): Promise<FacilityAnalyticsResponse> {
    return this.request<FacilityAnalyticsResponse>(`/facility/${facilityId}?range=${range}`);
  }

  async getMemberAnalytics(memberId: number, range: TimeRange = '4w'): Promise<MemberAnalyticsResponse> {
    return this.request<MemberAnalyticsResponse>(`/member/${memberId}?range=${range}`);
  }

  async exportGlobalAnalytics(range: TimeRange = '4w'): Promise<ExportResponse> {
    return this.request<ExportResponse>(`/export/global?range=${range}`);
  }

  async exportFacilityAnalytics(facilityId: string, range: TimeRange = '4w'): Promise<ExportResponse> {
    return this.request<ExportResponse>(`/export/facility/${facilityId}?range=${range}`);
  }

  async exportMemberAnalytics(memberId: number, range: TimeRange = '4w'): Promise<ExportResponse> {
    return this.request<ExportResponse>(`/export/member/${memberId}?range=${range}`);
  }

  async downloadExport(downloadUrl: string, filename: string): Promise<void> {
    try {
      const response = await fetch(downloadUrl);
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

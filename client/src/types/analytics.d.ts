export interface AnalyticsMeta {
  generatedAt: string;
  range: string;
}

export interface KPIDelta {
  avgUtilization?: number;
  criticalFacilities?: number;
  activeMembers?: number;
  totalFacilities?: number;
}

export interface GlobalKPIs {
  activeMembers: number;
  totalFacilities: number;
  avgUtilization: number;
  criticalFacilities: number;
  delta: KPIDelta;
}

export interface FacilitySummary {
  id: number;
  name: string;
  avgUtilization: number;
  membersCount: number;
  statusDistribution: {
    balanced: number;
    caution: number;
    overloaded: number;
  };
}

export interface MemberSummary {
  id: number;
  name: string;
  avatarUrl?: string;
  facilityId: number;
  facilityName: string;
  role: string;
  tasks: {
    total: number;
    ongoing: number;
    completed: number;
  };
  utilization: number;
  status: 'balanced' | 'caution' | 'overloaded';
  trend: number;
}

export interface GlobalAnalyticsResponse {
  meta: AnalyticsMeta;
  kpis: GlobalKPIs;
  facilities: FacilitySummary[];
  members: MemberSummary[];
}

export interface FacilityKPIs {
  activeMembers: number;
  pendingTasks: number;
  avgUtilization: number;
}

export interface ChartData {
  distribution: {
    balanced: number;
    caution: number;
    overloaded: number;
  };
  utilizationSeries: Array<{
    week: string;
    utilization: number;
  }>;
}

export interface FacilityAnalyticsResponse {
  meta: AnalyticsMeta;
  facility: {
    id: number;
    name: string;
    projects: number;
  };
  kpis: FacilityKPIs;
  charts: ChartData;
  members: MemberSummary[];
}

export interface MemberDetails {
  id: number;
  name: string;
  avatarUrl?: string;
  facilityId: number;
  role: string;
  capacity: number;
}

export interface MemberKPIs {
  totalTasks: number;
  ongoing: number;
  completed: number;
  utilization: number;
  trend: number;
}

export interface MemberChartData {
  taskDistribution: {
    completed: number;
    ongoing: number;
    pending: number;
  };
  utilizationSeries: Array<{
    date: string;
    utilization: number;
  }>;
}

export interface TimelineItem {
  taskId: number;
  project: string;
  start: string;
  end: string;
  status: 'completed' | 'ongoing' | 'pending';
}

export interface MemberAnalyticsResponse {
  meta: AnalyticsMeta;
  member: MemberDetails;
  kpis: MemberKPIs;
  charts: MemberChartData;
  timeline: TimelineItem[];
  insights: string[];
}

export interface Insight {
  id: string;
  type: 'warning' | 'info' | 'success';
  message: string;
  action?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ExportRequest {
  scope: 'global' | 'facility' | 'member';
  id?: number;
  range: string;
  format: 'pdf';
}

export interface ExportResponse {
  downloadUrl: string;
  filename: string;
  expiresAt: string;
}

export type AnalyticsScope = 'global' | 'facility' | 'member';
export type TimeRange = '1w' | '2w' | '4w' | '8w' | '12w';
export type MemberStatus = 'balanced' | 'caution' | 'overloaded';

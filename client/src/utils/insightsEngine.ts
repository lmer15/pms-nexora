import { Insight } from '../types/analytics';
import { GlobalAnalyticsResponse, FacilityAnalyticsResponse, MemberAnalyticsResponse } from '../types/analytics';

export class InsightsEngine {
  static generateGlobalInsights(data: GlobalAnalyticsResponse): Insight[] {
    const insights: Insight[] = [];
    const { kpis, facilities, members } = data;

    // Rule 1: Persistent overload detection
    const overloadedMembers = members.filter(m => m.utilization >= 100);
    if (overloadedMembers.length > 0) {
      const persistentOverload = overloadedMembers.filter(m => m.trend > 0);
      if (persistentOverload.length > 0) {
        insights.push({
          id: 'persistent-overload',
          type: 'warning',
          severity: 'high',
          message: `Persistent overload detected for ${persistentOverload.length} member(s): ${persistentOverload.map(m => m.name).join(', ')} over capacity.`,
          action: 'Consider redistributing tasks or increasing capacity.'
        });
      }
    }

    // Rule 2: Facility critical utilization
    const criticalFacilities = facilities.filter(f => f.avgUtilization >= 90);
    if (criticalFacilities.length > 0) {
      insights.push({
        id: 'critical-facility',
        type: 'danger',
        severity: 'critical',
        message: `Facility ${criticalFacilities[0].name} at critical utilization (${criticalFacilities[0].avgUtilization}%) — recommend immediate capacity review.`,
        action: 'Review resource allocation and consider adding capacity.'
      });
    }

    // Rule 3: Low utilization opportunity
    const lowUtilFacilities = facilities.filter(f => f.avgUtilization < 40);
    if (lowUtilFacilities.length > 0) {
      insights.push({
        id: 'low-utilization',
        type: 'info',
        severity: 'medium',
        message: `Low utilization in ${lowUtilFacilities[0].name} (${lowUtilFacilities[0].avgUtilization}%) suggests available capacity for redistribution.`,
        action: 'Consider reallocating resources to overloaded facilities.'
      });
    }

    // Rule 4: Rebalancing opportunity
    const overloadedCount = members.filter(m => m.status === 'overloaded').length;
    const underutilizedCount = members.filter(m => m.utilization < 60).length;
    if (overloadedCount > 0 && underutilizedCount > 0) {
      insights.push({
        id: 'rebalancing-opportunity',
        type: 'info',
        severity: 'medium',
        message: `Potential to rebalance tasks: ${overloadedCount} overloaded vs ${underutilizedCount} underutilized members.`,
        action: 'Review task distribution across team members.'
      });
    }

    // Rule 5: Overall trend analysis
    if (kpis.delta.avgUtilization && kpis.delta.avgUtilization > 5) {
      insights.push({
        id: 'increasing-utilization',
        type: 'warning',
        severity: 'medium',
        message: `Overall utilization increased by ${kpis.delta.avgUtilization}% this period.`,
        action: 'Monitor trends and prepare for capacity planning.'
      });
    }

    // Always provide at least one actionable insight
    if (insights.length === 0) {
      insights.push({
        id: 'stable-operations',
        type: 'success',
        severity: 'low',
        message: 'Operations are running smoothly with balanced utilization across facilities.',
        action: 'Continue monitoring and maintain current resource allocation.'
      });
    }

    return insights.slice(0, 4); // Limit to 4 insights
  }

  static generateFacilityInsights(data: FacilityAnalyticsResponse): Insight[] {
    const insights: Insight[] = [];
    const { kpis, facility, members } = data;

    // Facility-specific overload detection
    const overloadedMembers = members.filter(m => m.utilization >= 100);
    if (overloadedMembers.length > 0) {
      insights.push({
        id: 'facility-overload',
        type: 'warning',
        severity: 'high',
        message: `${overloadedMembers.length} member(s) in ${facility.name} are over capacity.`,
        action: 'Redistribute tasks or request additional resources.'
      });
    }

    // High facility utilization
    if (kpis.avgUtilization >= 90) {
      insights.push({
        id: 'high-facility-util',
        type: 'danger',
        severity: 'critical',
        message: `${facility.name} utilization at ${kpis.avgUtilization}% - approaching capacity limits.`,
        action: 'Immediate capacity review and resource planning required.'
      });
    } else if (kpis.avgUtilization < 40) {
      insights.push({
        id: 'low-facility-util',
        type: 'info',
        severity: 'medium',
        message: `${facility.name} utilization at ${kpis.avgUtilization}% - capacity available for additional work.`,
        action: 'Consider taking on additional projects or supporting other facilities.'
      });
    }

    // Task distribution analysis
    const totalTasks = members.reduce((sum, m) => sum + m.tasks.total, 0);
    const pendingTasks = members.reduce((sum, m) => sum + (m.tasks.total - m.tasks.completed - m.tasks.ongoing), 0);
    
    if (pendingTasks > totalTasks * 0.3) {
      insights.push({
        id: 'high-pending-tasks',
        type: 'warning',
        severity: 'medium',
        message: `${pendingTasks} pending tasks (${Math.round((pendingTasks / totalTasks) * 100)}% of total) in ${facility.name}.`,
        action: 'Review task prioritization and resource allocation.'
      });
    }

    return insights.slice(0, 4);
  }

  static generateMemberInsights(data: MemberAnalyticsResponse): Insight[] {
    const insights: Insight[] = [];
    const { kpis, member } = data;

    // Member overload detection
    if (kpis.utilization >= 100) {
      insights.push({
        id: 'member-overload',
        type: 'danger',
        severity: 'critical',
        message: `${member.name} is at ${kpis.utilization}% utilization - risk of burnout.`,
        action: 'Immediately redistribute tasks or reduce workload.'
      });
    } else if (kpis.utilization >= 90) {
      insights.push({
        id: 'member-high-util',
        type: 'warning',
        severity: 'high',
        message: `${member.name} utilization at ${kpis.utilization}% - approaching capacity limits.`,
        action: 'Monitor workload and consider task redistribution.'
      });
    }

    // Trend analysis
    if (kpis.trend > 10) {
      insights.push({
        id: 'increasing-workload',
        type: 'warning',
        severity: 'medium',
        message: `${member.name}'s workload increased by ${kpis.trend}% this period.`,
        action: 'Review recent task assignments and workload distribution.'
      });
    } else if (kpis.trend < -10) {
      insights.push({
        id: 'decreasing-workload',
        type: 'info',
        severity: 'low',
        message: `${member.name}'s workload decreased by ${Math.abs(kpis.trend)}% this period.`,
        action: 'Consider assigning additional tasks to maintain productivity.'
      });
    }

    // Task completion analysis
    const completionRate = (kpis.completed / kpis.totalTasks) * 100;
    if (completionRate >= 90) {
      insights.push({
        id: 'high-completion-rate',
        type: 'success',
        severity: 'low',
        message: `${member.name} has excellent task completion rate (${completionRate.toFixed(1)}%).`,
        action: 'Consider for additional responsibilities or leadership opportunities.'
      });
    } else if (completionRate < 60) {
      insights.push({
        id: 'low-completion-rate',
        type: 'warning',
        severity: 'medium',
        message: `${member.name} has low task completion rate (${completionRate.toFixed(1)}%).`,
        action: 'Review task complexity and provide additional support or training.'
      });
    }

    // Always provide at least one insight
    if (insights.length === 0) {
      insights.push({
        id: 'stable-performance',
        type: 'success',
        severity: 'low',
        message: `${member.name} is performing well with balanced workload and good task completion.`,
        action: 'Continue current task allocation and monitor performance.'
      });
    }

    return insights.slice(0, 4);
  }

  static getInsightIcon(type: string): string {
    switch (type) {
      case 'danger':
        return '⚠️';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      default:
        return 'ℹ️';
    }
  }

  static getInsightColor(type: string): string {
    switch (type) {
      case 'danger':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      case 'info':
        return '#3B82F6';
      case 'success':
        return '#10B981';
      default:
        return '#6B7280';
    }
  }
}

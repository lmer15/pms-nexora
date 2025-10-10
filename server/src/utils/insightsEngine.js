class InsightsEngine {
  static generateGlobalInsights(data) {
    const insights = [];
    const { kpis, facilities, members } = data;

    // Rule 1: Overload detection based on real utilization data
    const overloadedMembers = members.filter(m => m.utilization >= 100);
    if (overloadedMembers.length > 0) {
      insights.push({
        id: 'member-overload',
        type: 'warning',
        severity: 'high',
        message: `${overloadedMembers.length} member(s) are over capacity: ${overloadedMembers.map(m => m.name).join(', ')} (${overloadedMembers.map(m => m.utilization.toFixed(1)).join('%, ')}%).`,
        action: 'Immediately redistribute tasks or increase capacity to prevent burnout.'
      });
    }

    // Rule 1b: High utilization warning (90-99%)
    const highUtilMembers = members.filter(m => m.utilization >= 90 && m.utilization < 100);
    if (highUtilMembers.length > 0) {
      insights.push({
        id: 'high-utilization',
        type: 'warning',
        severity: 'medium',
        message: `${highUtilMembers.length} member(s) approaching capacity limits: ${highUtilMembers.map(m => m.name).join(', ')} (${highUtilMembers.map(m => m.utilization.toFixed(1)).join('%, ')}%).`,
        action: 'Monitor workload closely and prepare for task redistribution.'
      });
    }

    // Rule 2: Facility critical utilization
    const criticalFacilities = facilities.filter(f => f.avgUtilization >= 90);
    if (criticalFacilities.length > 0) {
      insights.push({
        id: 'critical-facility',
        type: 'danger',
        severity: 'critical',
        message: `${criticalFacilities.length} facility(ies) at critical utilization: ${criticalFacilities.map(f => `${f.name} (${f.avgUtilization.toFixed(1)}%)`).join(', ')}.`,
        action: 'Immediate capacity review and resource reallocation required.'
      });
    }

    // Rule 3: Low utilization opportunity
    const lowUtilFacilities = facilities.filter(f => f.avgUtilization < 40);
    if (lowUtilFacilities.length > 0) {
      insights.push({
        id: 'low-utilization',
        type: 'info',
        severity: 'medium',
        message: `${lowUtilFacilities.length} facility(ies) with low utilization: ${lowUtilFacilities.map(f => `${f.name} (${f.avgUtilization.toFixed(1)}%)`).join(', ')}.`,
        action: 'Consider reallocating resources to overloaded facilities or assigning additional projects.'
      });
    }

    // Rule 4: Rebalancing opportunity based on actual utilization data
    const overloadedCount = members.filter(m => m.utilization >= 100).length;
    const underutilizedCount = members.filter(m => m.utilization < 60).length;
    if (overloadedCount > 0 && underutilizedCount > 0) {
      insights.push({
        id: 'rebalancing-opportunity',
        type: 'info',
        severity: 'medium',
        message: `Task rebalancing opportunity: ${overloadedCount} overloaded member(s) vs ${underutilizedCount} underutilized member(s).`,
        action: 'Review task distribution and consider moving tasks from overloaded to underutilized members.'
      });
    }

    // Rule 5: Task distribution analysis
    const totalTasks = members.reduce((sum, m) => sum + m.tasks.total, 0);
    const totalCompleted = members.reduce((sum, m) => sum + m.tasks.completed, 0);
    const totalOngoing = members.reduce((sum, m) => sum + m.tasks.ongoing, 0);
    
    if (totalTasks > 0) {
      const completionRate = (totalCompleted / totalTasks) * 100;
      const ongoingRate = (totalOngoing / totalTasks) * 100;
      
      if (completionRate < 50) {
        insights.push({
          id: 'low-completion-rate',
          type: 'warning',
          severity: 'medium',
          message: `Low overall completion rate: ${completionRate.toFixed(1)}% of tasks completed across all facilities.`,
          action: 'Review task complexity, deadlines, and resource allocation to improve completion rates.'
        });
      }
      
      if (ongoingRate > 40) {
        insights.push({
          id: 'high-ongoing-tasks',
          type: 'info',
          severity: 'low',
          message: `High ongoing task ratio: ${ongoingRate.toFixed(1)}% of tasks are in progress.`,
          action: 'Monitor task progress and ensure adequate resources for completion.'
        });
      }
    }

    // Rule 6: Overall trend analysis (if delta data is available)
    if (kpis.delta && kpis.delta.avgUtilization && kpis.delta.avgUtilization > 5) {
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
      const totalMembers = members.length;
      const avgUtilization = kpis.avgUtilization;
      
      if (avgUtilization >= 70 && avgUtilization <= 90) {
        insights.push({
          id: 'optimal-operations',
          type: 'success',
          severity: 'low',
          message: `Operations are running optimally with ${avgUtilization.toFixed(1)}% average utilization across ${totalMembers} members.`,
          action: 'Continue monitoring and maintain current resource allocation.'
        });
      } else if (avgUtilization < 70) {
        insights.push({
          id: 'underutilized-operations',
          type: 'info',
          severity: 'medium',
          message: `Operations are underutilized with ${avgUtilization.toFixed(1)}% average utilization across ${totalMembers} members.`,
          action: 'Consider taking on additional projects or optimizing resource allocation.'
        });
      } else {
        insights.push({
          id: 'stable-operations',
          type: 'success',
          severity: 'low',
          message: `Operations are running smoothly with ${avgUtilization.toFixed(1)}% average utilization across ${totalMembers} members.`,
          action: 'Continue monitoring and maintain current resource allocation.'
        });
      }
    }

    return insights.slice(0, 4); // Limit to 4 insights
  }

  static generateFacilityInsights(data) {
    const insights = [];
    const { kpis, facility, members } = data;

    // Facility-specific overload detection
    const overloadedMembers = members.filter(m => m.utilization >= 100);
    if (overloadedMembers.length > 0) {
      insights.push({
        id: 'facility-overload',
        type: 'warning',
        severity: 'high',
        message: `${overloadedMembers.length} member(s) in ${facility.name} are over capacity: ${overloadedMembers.map(m => `${m.name} (${m.utilization.toFixed(1)}%)`).join(', ')}.`,
        action: 'Immediately redistribute tasks or request additional resources to prevent burnout.'
      });
    }

    // High utilization warning for facility members
    const highUtilMembers = members.filter(m => m.utilization >= 90 && m.utilization < 100);
    if (highUtilMembers.length > 0) {
      insights.push({
        id: 'facility-high-util',
        type: 'warning',
        severity: 'medium',
        message: `${highUtilMembers.length} member(s) in ${facility.name} approaching capacity: ${highUtilMembers.map(m => `${m.name} (${m.utilization.toFixed(1)}%)`).join(', ')}.`,
        action: 'Monitor workload closely and prepare for task redistribution.'
      });
    }

    // High facility utilization
    if (kpis.avgUtilization >= 90) {
      insights.push({
        id: 'high-facility-util',
        type: 'danger',
        severity: 'critical',
        message: `${facility.name} at critical utilization (${kpis.avgUtilization.toFixed(1)}%) - approaching capacity limits.`,
        action: 'Immediate capacity review and resource planning required.'
      });
    } else if (kpis.avgUtilization < 40) {
      insights.push({
        id: 'low-facility-util',
        type: 'info',
        severity: 'medium',
        message: `${facility.name} has low utilization (${kpis.avgUtilization.toFixed(1)}%) - capacity available for additional work.`,
        action: 'Consider taking on additional projects or supporting other facilities.'
      });
    }

    // Task distribution analysis
    const totalTasks = members.reduce((sum, m) => sum + m.tasks.total, 0);
    const totalCompleted = members.reduce((sum, m) => sum + m.tasks.completed, 0);
    const totalOngoing = members.reduce((sum, m) => sum + m.tasks.ongoing, 0);
    const pendingTasks = totalTasks - totalCompleted - totalOngoing;
    
    if (totalTasks > 0) {
      const completionRate = (totalCompleted / totalTasks) * 100;
      const pendingRate = (pendingTasks / totalTasks) * 100;
      
      if (pendingRate > 30) {
        insights.push({
          id: 'high-pending-tasks',
          type: 'warning',
          severity: 'medium',
          message: `${pendingTasks} pending tasks (${pendingRate.toFixed(1)}% of total) in ${facility.name}.`,
          action: 'Review task prioritization and resource allocation to improve task flow.'
        });
      }
      
      if (completionRate < 60) {
        insights.push({
          id: 'low-completion-rate',
          type: 'warning',
          severity: 'medium',
          message: `Low completion rate in ${facility.name}: ${completionRate.toFixed(1)}% of tasks completed.`,
          action: 'Review task complexity, deadlines, and provide additional support to improve completion rates.'
        });
      }
    }

    // Always provide at least one insight for facilities
    if (insights.length === 0) {
      const totalMembers = members.length;
      const avgUtilization = kpis.avgUtilization;
      
      if (avgUtilization >= 70 && avgUtilization <= 90) {
        insights.push({
          id: 'facility-optimal',
          type: 'success',
          severity: 'low',
          message: `${facility.name} is operating optimally with ${avgUtilization.toFixed(1)}% utilization across ${totalMembers} members.`,
          action: 'Continue monitoring and maintain current resource allocation.'
        });
      } else if (avgUtilization < 70) {
        insights.push({
          id: 'facility-underutilized',
          type: 'info',
          severity: 'medium',
          message: `${facility.name} is underutilized with ${avgUtilization.toFixed(1)}% utilization across ${totalMembers} members.`,
          action: 'Consider taking on additional projects or supporting other facilities.'
        });
      } else {
        insights.push({
          id: 'facility-stable',
          type: 'success',
          severity: 'low',
          message: `${facility.name} is operating smoothly with ${avgUtilization.toFixed(1)}% utilization across ${totalMembers} members.`,
          action: 'Continue monitoring and maintain current resource allocation.'
        });
      }
    }

    return insights.slice(0, 4);
  }

  static generateMemberInsights(data) {
    const insights = [];
    const { kpis, member } = data;

    // If member data is not available, return empty insights
    if (!member) {
      console.log('Member data not available for insights generation');
      return insights;
    }

    // Member overload detection
    if (kpis.utilization >= 100) {
      insights.push({
        id: 'member-overload',
        type: 'danger',
        severity: 'critical',
        message: `${member.name} is at ${kpis.utilization.toFixed(1)}% utilization - risk of burnout.`,
        action: 'Immediately redistribute tasks or reduce workload to prevent burnout.'
      });
    } else if (kpis.utilization >= 90) {
      insights.push({
        id: 'member-high-util',
        type: 'warning',
        severity: 'high',
        message: `${member.name} utilization at ${kpis.utilization.toFixed(1)}% - approaching capacity limits.`,
        action: 'Monitor workload closely and consider task redistribution.'
      });
    } else if (kpis.utilization < 40) {
      insights.push({
        id: 'member-low-util',
        type: 'info',
        severity: 'low',
        message: `${member.name} has low utilization (${kpis.utilization.toFixed(1)}%) - capacity available for additional tasks.`,
        action: 'Consider assigning additional tasks or responsibilities to optimize productivity.'
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
    if (kpis.totalTasks > 0) {
      const completionRate = (kpis.completed / kpis.totalTasks) * 100;
      const ongoingRate = (kpis.ongoing / kpis.totalTasks) * 100;
      
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
      
      if (ongoingRate > 50) {
        insights.push({
          id: 'high-ongoing-tasks',
          type: 'info',
          severity: 'low',
          message: `${member.name} has many ongoing tasks (${ongoingRate.toFixed(1)}% of total).`,
          action: 'Monitor task progress and ensure adequate time for completion.'
        });
      }
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

  static getInsightIcon(type) {
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

  static getInsightColor(type) {
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

module.exports = InsightsEngine;

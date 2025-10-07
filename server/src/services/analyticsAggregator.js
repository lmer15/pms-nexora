const Facility = require('../models/Facility');
const UserFacility = require('../models/UserFacility');
const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { getTimeRangeDates } = require('../utils/dateUtils');
const insightsEngine = require('../utils/insightsEngine');

class AnalyticsAggregator {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getGlobalAnalytics(userId, userRole, range = '4w') {
    const cacheKey = `global_${userId}_${userRole}_${range}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const { start, end } = getTimeRangeDates(range);
    
    try {
      // Get facilities user has access to
      const accessibleFacilities = await this.getAccessibleFacilities(userId, userRole);
      const facilityIds = accessibleFacilities.map(f => f.id);

      if (facilityIds.length === 0) {
        return this.getEmptyGlobalResponse(range);
      }

      // Aggregate KPIs
      const kpis = await this.aggregateGlobalKPIs(facilityIds, start, end);
      
      // Get facility summaries
      const facilities = await this.getFacilitySummaries(facilityIds, start, end);
      
      // Get member summaries
      const members = await this.getMemberSummaries(facilityIds, start, end);

      const response = {
        meta: {
          generatedAt: new Date().toISOString(),
          range
        },
        kpis,
        facilities,
        members
      };

      this.setCachedData(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Global analytics aggregation error:', error);
      throw error;
    }
  }

  async getFacilityAnalytics(facilityId, userId, userRole, range = '4w') {
    const cacheKey = `facility_${facilityId}_${userId}_${userRole}_${range}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const { start, end } = getTimeRangeDates(range);

    try {
      // Verify access to facility
      const hasAccess = await this.hasFacilityAccess(facilityId, userId, userRole);
      
      if (!hasAccess) {
        throw new Error('Access denied to facility');
      }

      // Get facility details
      const facility = await this.getFacilityDetails(facilityId);
      
      // Aggregate facility KPIs
      const kpis = await this.aggregateFacilityKPIs(facilityId, start, end);
      
      // Get chart data
      const charts = await this.getFacilityChartData(facilityId, start, end);
      
      // Get member summaries for this facility
      const members = await this.getMemberSummaries([facilityId], start, end);

      const response = {
        meta: {
          generatedAt: new Date().toISOString(),
          range
        },
        facility,
        kpis,
        charts,
        members
      };

      this.setCachedData(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Facility analytics aggregation error:', error);
      throw error;
    }
  }

  async getMemberAnalytics(memberId, userId, userRole, range = '4w') {
    const cacheKey = `member_${memberId}_${userId}_${userRole}_${range}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const { start, end } = getTimeRangeDates(range);

    try {
      // Get member details
      const member = await this.getMemberDetails(memberId);
      
      // Aggregate member KPIs
      const kpis = await this.aggregateMemberKPIs(memberId, start, end);
      
      // Get chart data
      const charts = await this.getMemberChartData(memberId, start, end);
      
      // Get timeline data
      const timeline = await this.getMemberTimeline(memberId, start, end);
      
      // Generate insights
      const insights = insightsEngine.generateMemberInsights({
        meta: { generatedAt: new Date().toISOString(), range },
        member,
        kpis,
        charts,
        timeline
      });

      const response = {
        meta: {
          generatedAt: new Date().toISOString(),
          range
        },
        member,
        kpis,
        charts,
        timeline,
        insights: insights.map(i => i.message)
      };

      this.setCachedData(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Member analytics aggregation error:', error);
      throw error;
    }
  }

  async canAccessMemberAnalytics(memberId, userId, userRole) {
    try {
      // userId here is the database user ID (set by auth middleware)
      const requestingUser = await User.findById(userId);
      if (!requestingUser) {
        return false;
      }
      
      // 1. SELF-ACCESS: User can always access their own analytics
      if (String(memberId) === String(requestingUser.id)) {
        return true;
      }

      // 2. FACILITY-BASED ACCESS: Check if user belongs to the same facility
      const member = await this.getMemberDetails(memberId);
      if (!member) {
        return false;
      }

      const userFacilities = await UserFacility.findByUser(requestingUser.id);
      
      // Find the user's role in the same facility as the member
      const userFacility = userFacilities.find(uf => uf.facilityId === member.facilityId);
      if (!userFacility) {
        return false;
      }

      // 3. ROLE-BASED ACCESS: Enhanced permissions based on role
      const requestingUserRole = userFacility.role;

      // Owner and Manager can access all members in their facility
      if (['owner', 'manager'].includes(requestingUserRole)) {
        return true;
      }

      // Members can access other members in same facility (basic level)
      if (requestingUserRole === 'member') {
        return true;
      }

      // Default: no access
      return false;
    } catch (error) {
      console.error('Member access check error:', error);
      return false;
    }
  }

  // Helper methods
  async getAccessibleFacilities(userId, userRole) {
    const userFacilities = await UserFacility.findByUser(userId);
    const facilityIds = userFacilities.map(uf => uf.facilityId);
    
    if (facilityIds.length === 0) {
      return [];
    }
    
    const facilities = await Promise.all(
      facilityIds.map(id => Facility.findById(id))
    );
    
    return facilities
      .filter(f => f && !f.deletedAt)
      .map(f => ({ id: f.id, name: f.name }));
  }

  async hasFacilityAccess(facilityId, userId, userRole) {
    const userFacilities = await UserFacility.findByUser(userId);
    return userFacilities.some(uf => uf.facilityId === facilityId);
  }

  // Get access level for member analytics
  async getMemberAccessLevel(memberId, userId, userRole) {
    try {
      const requestingUser = await User.findById(userId);
      if (!requestingUser) return 'none';

      // Self-access: full access
      if (String(memberId) === String(requestingUser.id)) {
        return 'self';
      }

      const member = await this.getMemberDetails(memberId);
      if (!member) return 'none';

      const userFacilities = await UserFacility.findByUser(requestingUser.id);
      const userFacility = userFacilities.find(uf => uf.facilityId === member.facilityId);
      
      if (!userFacility) return 'none';

      // Role-based access levels
      if (['owner', 'manager'].includes(userFacility.role)) {
        return 'manager';
      }
      
      if (userFacility.role === 'member') {
        return 'peer';
      }

      return 'none';
    } catch (error) {
      console.error('Error getting member access level:', error);
      return 'none';
    }
  }

  // Filter member data based on access level
  filterMemberDataByAccessLevel(data, accessLevel) {
    const filtered = { ...data };

    switch (accessLevel) {
      case 'self':
        // Full access - return all data
        return filtered;
        
      case 'manager':
        // Manager access - return all data
        return filtered;
        
      case 'peer':
        // Peer access - limit sensitive information
        return {
          ...filtered,
          member: {
            ...filtered.member,
            // Hide sensitive personal information for peers
            email: undefined,
            personalDetails: undefined
          },
          insights: filtered.insights.filter(insight => 
            !insight.includes('personal') && !insight.includes('private')
          )
        };
        
      case 'none':
      default:
        // No access
        throw new Error('Access denied');
    }
  }

  async aggregateGlobalKPIs(facilityIds, start, end) {
    try {
      // Get all members across facilities
      const allUserFacilities = await Promise.all(
        facilityIds.map(facilityId => UserFacility.findByFacility(facilityId))
      );
      const flatUserFacilities = allUserFacilities.flat();
      const uniqueUserIds = [...new Set(flatUserFacilities.map(uf => uf.userId))];
      
      // Get tasks for these users
      const allUserTasks = await Promise.all(
        uniqueUserIds.map(userId => Task.findByAssignee(userId))
      );
      const flatTasks = allUserTasks.flat();
      
      // Calculate metrics
      const activeMembers = uniqueUserIds.length;
      const totalFacilities = facilityIds.length;
      
      // Calculate facility-based utilization
      const facilityUtilizations = await Promise.all(
        facilityIds.map(async (facilityId) => {
          // Get projects for this facility
          const facilityProjects = await Project.findByFacility(facilityId);
          const activeProjects = facilityProjects.filter(p => !p.deletedAt);
          
          if (activeProjects.length === 0) return 0;
          
          // Get all tasks from these projects
          const allProjectTasks = await Promise.all(
            activeProjects.map(project => Task.findByProject(project.id))
          );
          const facilityTasks = allProjectTasks.flat();
          
          if (facilityTasks.length === 0) return 0;
          
          // Calculate facility utilization based on task completion
          const completedTasks = facilityTasks.filter(t => t.status === 'completed').length;
          const inProgressTasks = facilityTasks.filter(t => t.status === 'in-progress' || t.status === 'in_progress').length;
          const totalTasks = facilityTasks.length;
          
          // Facility utilization = (completed + in-progress) / total tasks
          const facilityUtilization = (completedTasks + inProgressTasks) / totalTasks * 100;
          
          return facilityUtilization;
        })
      );
      
      // Calculate average utilization across all facilities
      const avgUtilization = facilityUtilizations.length > 0 ? 
        facilityUtilizations.reduce((sum, util) => sum + util, 0) / facilityUtilizations.length : 0;
      
      
      // Calculate critical facilities based on multiple risk factors
      const facilityRiskScores = await Promise.all(
        facilityIds.map(async (facilityId) => {
          // Get projects for this facility
          const facilityProjects = await Project.findByFacility(facilityId);
          const activeProjects = facilityProjects.filter(p => !p.deletedAt);
          
          // Get all tasks from these projects
          const allProjectTasks = await Promise.all(
            activeProjects.map(project => Task.findByProject(project.id))
          );
          const facilityTasks = allProjectTasks.flat();
          
          // Risk factors for critical status
          const overdueTasks = facilityTasks.filter(t => 
            t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
          ).length;
          
          const blockedTasks = facilityTasks.filter(t => t.status === 'blocked' || t.status === 'review').length;
          
          const highPriorityTasks = facilityTasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length;
          
          const totalTasks = facilityTasks.length;
          const totalProjects = activeProjects.length;
          
          // Calculate utilization
          const completedTasks = facilityTasks.filter(t => t.status === 'completed').length;
          const utilization = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
          
          // Critical score calculation (0-100, higher = more critical)
          let criticalScore = 0;
          
          // Overdue tasks penalty (up to 40 points)
          if (totalTasks > 0) {
            criticalScore += Math.min((overdueTasks / totalTasks) * 40, 40);
          }
          
          // Blocked tasks penalty (up to 30 points)
          if (totalTasks > 0) {
            criticalScore += Math.min((blockedTasks / totalTasks) * 30, 30);
          }
          
          // High priority tasks pressure (up to 20 points)
          if (totalTasks > 0) {
            criticalScore += Math.min((highPriorityTasks / totalTasks) * 20, 20);
          }
          
          // Low utilization penalty (up to 10 points)
          if (utilization < 50) {
            criticalScore += (50 - utilization) * 0.2;
          }
          
          return {
            facilityId,
            criticalScore,
            overdueTasks,
            blockedTasks,
            highPriorityTasks,
            utilization,
            totalTasks,
            totalProjects
          };
        })
      );
      
      // A facility is critical if its critical score is above 60
      const criticalFacilities = facilityRiskScores.filter(f => f.criticalScore >= 60).length;

      return {
        activeMembers,
        totalFacilities,
        avgUtilization: Math.round(avgUtilization * 10) / 10,
        criticalFacilities,
        delta: {
          avgUtilization: 0, // Would calculate from historical data
          criticalFacilities: 0
        }
      };
    } catch (error) {
      console.error('Error aggregating global KPIs:', error);
      return {
        activeMembers: 0,
        totalFacilities: 0,
        avgUtilization: 0,
        criticalFacilities: 0,
        delta: {
          avgUtilization: 0,
          criticalFacilities: 0
        }
      };
    }
  }

  async getFacilitySummaries(facilityIds, start, end) {
    try {
      const summaries = await Promise.all(
        facilityIds.map(async (facilityId) => {
          const facility = await Facility.findById(facilityId);
          if (!facility) return null;
          
          const userFacilities = await UserFacility.findByFacility(facilityId);
          const userIds = userFacilities.map(uf => uf.userId);
          
          // Get projects for this facility
          const facilityProjects = await Project.findByFacility(facilityId);
          const activeProjects = facilityProjects.filter(p => !p.deletedAt);
          
          // Get all tasks from these projects
          const allProjectTasks = await Promise.all(
            activeProjects.map(project => Task.findByProject(project.id))
          );
          const facilityTasks = allProjectTasks.flat();
          
          const membersCount = userIds.length;
          
          // Calculate facility utilization based on task completion
          const completedTasks = facilityTasks.filter(t => t.status === 'completed').length;
          const inProgressTasks = facilityTasks.filter(t => t.status === 'in-progress' || t.status === 'in_progress').length;
          const totalTasks = facilityTasks.length;
          
          // Facility utilization = (completed + in-progress) / total tasks
          const avgUtilization = totalTasks > 0 ? 
            (completedTasks + inProgressTasks) / totalTasks * 100 : 0;
          
          // Calculate status distribution for members
          const overdueTasks = facilityTasks.filter(t => 
            t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
          ).length;
          const cautionTasks = facilityTasks.filter(t => 
            t.dueDate && new Date(t.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && 
            new Date(t.dueDate) > new Date() && t.status !== 'completed'
          ).length;
          const balancedTasks = totalTasks - overdueTasks - cautionTasks;
          
          return {
            id: facility.id,
            name: facility.name,
            avgUtilization: Math.round(avgUtilization * 10) / 10,
            membersCount,
            statusDistribution: {
              balanced: Math.max(0, balancedTasks),
              caution: cautionTasks,
              overloaded: overdueTasks
            }
          };
        })
      );
      
      return summaries.filter(s => s !== null);
    } catch (error) {
      console.error('Error getting facility summaries:', error);
      return [];
    }
  }

  async getMemberSummaries(facilityIds, start, end) {
    try {
      const allUserFacilities = await Promise.all(
        facilityIds.map(facilityId => UserFacility.findByFacility(facilityId))
      );
      const flatUserFacilities = allUserFacilities.flat();
      
      // Group by user to avoid duplicates
      const userFacilityMap = new Map();
      flatUserFacilities.forEach(userFacility => {
        if (!userFacilityMap.has(userFacility.userId)) {
          userFacilityMap.set(userFacility.userId, []);
        }
        userFacilityMap.get(userFacility.userId).push(userFacility);
      });
      
      const allSummaries = [];
      
      for (const [userId, userFacilities] of userFacilityMap.entries()) {
        const user = await User.findById(userId);
        if (!user) continue;
        
        // Create separate entries for each facility where user is owner
        for (const userFacility of userFacilities) {
          if (userFacility.role === 'owner') {
            const facility = await Facility.findById(userFacility.facilityId);
            if (!facility) continue;
            
            // Get tasks from this specific facility only
            const facilityProjects = await Project.findByFacility(facility.id);
            const projectTasks = await Promise.all(
              facilityProjects.map(project => Task.findByProject(project.id))
            );
            const facilityTasks = projectTasks.flat();
            
            const totalTasks = facilityTasks.length;
            const ongoingTasks = facilityTasks.filter(t => 
              t.status === 'in_progress' || t.status === 'in-progress' || t.status === 'review'
            ).length;
            const completedTasks = facilityTasks.filter(t => 
              t.status === 'completed' || t.status === 'done'
            ).length;
            const overdueTasks = facilityTasks.filter(t => 
              t.dueDate && new Date(t.dueDate) < new Date() && 
              t.status !== 'completed' && t.status !== 'done'
            ).length;
            
            // Calculate utilization for this specific facility
            const utilization = totalTasks > 0 ? 
              ((completedTasks + ongoingTasks) / totalTasks) * 100 : 0;
            
            // Determine status for this facility
            let status = 'balanced';
            if (overdueTasks > 0) {
              status = 'overloaded';
            } else if (facilityTasks.some(t => 
              t.dueDate && new Date(t.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && 
              new Date(t.dueDate) > new Date() && t.status !== 'completed' && t.status !== 'done'
            )) {
              status = 'caution';
            }
            
            allSummaries.push({
              id: user.id,
              name: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
              avatarUrl: user.profilePicture,
              facilityId: facility.id,
              facilityName: facility.name,
              role: userFacility.role,
              tasks: {
                total: totalTasks,
                ongoing: ongoingTasks,
                completed: completedTasks
              },
              utilization: Math.round(utilization * 10) / 10,
              status,
              trend: 0
            });
          }
        }
      }
      
      const summaries = allSummaries;
      
      return summaries
        .filter(s => s !== null)
        .sort((a, b) => b.utilization - a.utilization);
    } catch (error) {
      console.error('Error getting member summaries:', error);
      return [];
    }
  }

  async getFacilityDetails(facilityId) {
    try {
      const facility = await Facility.findById(facilityId);
      if (!facility || facility.deletedAt) return null;
      
      const projects = await Project.findByFacility(facilityId);
      const activeProjects = projects.filter(p => !p.deletedAt);
      
      return {
        id: facility.id,
        name: facility.name,
        projects: activeProjects.length
      };
    } catch (error) {
      console.error('Error getting facility details:', error);
      return null;
    }
  }

  async aggregateFacilityKPIs(facilityId, start, end) {
    try {
      const userFacilities = await UserFacility.findByFacility(facilityId);
      const userIds = userFacilities.map(uf => uf.userId);
      
      // Get all tasks for facility members
      const allTasks = await Promise.all(
        userIds.map(userId => Task.findByAssignee(userId))
      );
      const flatTasks = allTasks.flat();
      
      // Filter tasks by date range
      const filteredTasks = flatTasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= start && taskDate <= end;
      });
      
      const activeMembers = userIds.length;
      const pendingTasks = filteredTasks.filter(t => t.status !== 'completed').length;
      
      // Calculate average utilization
      const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
      const overdueTasks = filteredTasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
      ).length;
      const totalTasks = filteredTasks.length;
      
      const avgUtilization = totalTasks > 0 ? 
        ((completedTasks * 1.0 + overdueTasks * 1.2 + (totalTasks - completedTasks - overdueTasks) * 0.8) / totalTasks) * 100 : 0;

      return {
        activeMembers,
        pendingTasks,
        avgUtilization: Math.round(avgUtilization * 10) / 10
      };
    } catch (error) {
      console.error('Error aggregating facility KPIs:', error);
      return {
        activeMembers: 0,
        pendingTasks: 0,
        avgUtilization: 0
      };
    }
  }

  async getFacilityChartData(facilityId, start, end) {
    try {
      const userFacilities = await UserFacility.findByFacility(facilityId);
      const userIds = userFacilities.map(uf => uf.userId);
      
      // Get all tasks for facility members
      const allTasks = await Promise.all(
        userIds.map(userId => Task.findByAssignee(userId))
      );
      const flatTasks = allTasks.flat();
      
      // Filter tasks by date range
      const filteredTasks = flatTasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= start && taskDate <= end;
      });
      
      // Calculate distribution
      const overdueTasks = filteredTasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
      ).length;
      
      const cautionTasks = filteredTasks.filter(t => 
        t.dueDate && new Date(t.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && 
        new Date(t.dueDate) > new Date() && t.status !== 'completed'
      ).length;
      
      const balancedTasks = filteredTasks.length - overdueTasks - cautionTasks;
      
      // Generate utilization series (simplified - weekly data)
      const utilizationSeries = [];
      const currentDate = new Date(start);
      const endDate = new Date(end);
      
      while (currentDate <= endDate) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const weekTasks = filteredTasks.filter(task => {
          const taskDate = new Date(task.createdAt);
          return taskDate >= weekStart && taskDate < weekEnd;
        });
        
        const weekCompleted = weekTasks.filter(t => t.status === 'completed').length;
        const weekOverdue = weekTasks.filter(t => 
          t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
        ).length;
        const weekTotal = weekTasks.length;
        
        const weekUtilization = weekTotal > 0 ? 
          ((weekCompleted * 1.0 + weekOverdue * 1.2 + (weekTotal - weekCompleted - weekOverdue) * 0.8) / weekTotal) * 100 : 0;
        
        utilizationSeries.push({
          week: weekStart.toISOString().split('T')[0],
          utilization: Math.round(weekUtilization * 10) / 10
        });
        
        currentDate.setDate(currentDate.getDate() + 7);
      }

      return {
        distribution: {
          balanced: Math.max(0, balancedTasks),
          caution: cautionTasks,
          overloaded: overdueTasks
        },
        utilizationSeries
      };
    } catch (error) {
      console.error('Error getting facility chart data:', error);
      return {
        distribution: {
          balanced: 0,
          caution: 0,
          overloaded: 0
        },
        utilizationSeries: []
      };
    }
  }

  async getMemberDetails(memberId) {
    try {
      console.log('getMemberDetails called with memberId:', memberId);
      const user = await User.findById(memberId);
      console.log('User found:', user ? 'Yes' : 'No', user ? { id: user.id, email: user.email } : null);
      if (!user) return null;
      
      const userFacilities = await UserFacility.findByUser(memberId);
      console.log('User facilities found:', userFacilities.length, userFacilities);
      if (userFacilities.length === 0) return null;
      
      const userFacility = userFacilities[0]; // Use first facility
      const facility = await Facility.findById(userFacility.facilityId);
      console.log('Facility found:', facility ? 'Yes' : 'No', facility ? { id: facility.id, name: facility.name } : null);
      
      const result = {
        id: user.id,
        name: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        avatarUrl: user.profilePicture,
        facilityId: facility.id,
        role: userFacility.role,
        capacity: 8 // Default capacity
      };
      console.log('getMemberDetails returning:', result);
      return result;
    } catch (error) {
      console.error('Error getting member details:', error);
      return null;
    }
  }

  async aggregateMemberKPIs(memberId, start, end) {
    try {
      const allTasks = await Task.findByAssignee(memberId);
      
      // Filter tasks by date range
      const filteredTasks = allTasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= start && taskDate <= end;
      });
      
      const totalTasks = filteredTasks.length;
      const ongoing = filteredTasks.filter(t => t.status === 'in_progress').length;
      const completed = filteredTasks.filter(t => t.status === 'completed').length;
      
      // Calculate utilization
      const overdueTasks = filteredTasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
      ).length;
      
      const utilization = totalTasks > 0 ? 
        ((completed * 1.0 + overdueTasks * 1.2 + (totalTasks - completed - overdueTasks) * 0.8) / totalTasks) * 100 : 0;

      return {
        totalTasks,
        ongoing,
        completed,
        utilization: Math.round(utilization * 10) / 10,
        trend: 0 // Would calculate from historical data
      };
    } catch (error) {
      console.error('Error aggregating member KPIs:', error);
      return {
        totalTasks: 0,
        ongoing: 0,
        completed: 0,
        utilization: 0,
        trend: 0
      };
    }
  }

  async getMemberChartData(memberId, start, end) {
    try {
      const allTasks = await Task.findByAssignee(memberId);
      
      // Filter tasks by date range
      const filteredTasks = allTasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= start && taskDate <= end;
      });
      
      // Task distribution
      const completed = filteredTasks.filter(t => t.status === 'completed').length;
      const ongoing = filteredTasks.filter(t => t.status === 'in_progress').length;
      const pending = filteredTasks.filter(t => t.status === 'pending').length;
      
      // Generate utilization series (daily data)
      const utilizationSeries = [];
      const currentDate = new Date(start);
      const endDate = new Date(end);
      
      while (currentDate <= endDate) {
        const dayTasks = filteredTasks.filter(task => {
          const taskDate = new Date(task.createdAt);
          return taskDate.toDateString() === currentDate.toDateString();
        });
        
        const dayCompleted = dayTasks.filter(t => t.status === 'completed').length;
        const dayOverdue = dayTasks.filter(t => 
          t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
        ).length;
        const dayTotal = dayTasks.length;
        
        const dayUtilization = dayTotal > 0 ? 
          ((dayCompleted * 1.0 + dayOverdue * 1.2 + (dayTotal - dayCompleted - dayOverdue) * 0.8) / dayTotal) * 100 : 0;
        
        utilizationSeries.push({
          date: currentDate.toISOString().split('T')[0],
          utilization: Math.round(dayUtilization * 10) / 10
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return {
        taskDistribution: {
          completed,
          ongoing,
          pending
        },
        utilizationSeries
      };
    } catch (error) {
      console.error('Error getting member chart data:', error);
      return {
        taskDistribution: {
          completed: 0,
          ongoing: 0,
          pending: 0
        },
        utilizationSeries: []
      };
    }
  }

  async getMemberTimeline(memberId, start, end) {
    try {
      const allTasks = await Task.findByAssignee(memberId);
      
      // Filter tasks by date range and get project info
      const filteredTasks = allTasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= start && taskDate <= end;
      });
      
      // Get project information for each task
      const timelineItems = await Promise.all(
        filteredTasks.slice(0, 20).map(async (task) => {
          const project = task.projectId ? await Project.findById(task.projectId) : null;
          
          return {
            taskId: task.id,
            project: project ? project.name : 'No Project',
            start: task.createdAt,
            end: task.dueDate || task.createdAt,
            status: task.status
          };
        })
      );
      
      return timelineItems.sort((a, b) => new Date(b.start) - new Date(a.start));
    } catch (error) {
      console.error('Error getting member timeline:', error);
      return [];
    }
  }

  getEmptyGlobalResponse(range) {
    return {
      meta: {
        generatedAt: new Date().toISOString(),
        range
      },
      kpis: {
        activeMembers: 0,
        totalFacilities: 0,
        avgUtilization: 0,
        criticalFacilities: 0,
        delta: {
          avgUtilization: 0,
          criticalFacilities: 0
        }
      },
      facilities: [],
      members: []
    };
  }

  // Cache management
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

module.exports = new AnalyticsAggregator();

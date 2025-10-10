const Facility = require('../models/Facility');
const UserFacility = require('../models/UserFacility');
const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { getTimeRangeDates } = require('../utils/dateUtils');
const insightsEngine = require('../utils/insightsEngine');
const logger = require('../utils/logger');

class AnalyticsAggregator {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 1 * 60 * 1000; // 1 minute (reduced for real-time insights)
  }

  // Helper function to convert Firestore Timestamp to Date
  convertFirestoreTimestamp(timestamp) {
    if (!timestamp) return null;
    
    try {
      // Handle Firestore Timestamp objects
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
      } else if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000);
      } else {
        return new Date(timestamp);
      }
    } catch (e) {
      logger.warn('Failed to convert timestamp', { timestamp, error: e.message });
      return null;
    }
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

      // Get facility summaries first (with user roles and user-specific task filtering)
      const facilities = await this.getFacilitySummaries(facilityIds, start, end, accessibleFacilities, userId);
      
      // Debug: Show total tasks across all facilities
      const totalTasksAcrossFacilities = facilities.reduce((sum, facility) => {
        const facilityTasks = facility.statusDistribution.balanced + facility.statusDistribution.caution + facility.statusDistribution.overloaded;
        return sum + facilityTasks;
      }, 0);
      
      // Aggregate KPIs using facility data for consistency
      const kpis = await this.aggregateGlobalKPIs(facilityIds, start, end, facilities);
      
      // Get member summaries (filtered by user assignment for members)
      const members = await this.getMemberSummaries(facilityIds, start, end, userId, accessibleFacilities);

      // Calculate global task counts (deduplicated across all facilities)
      const globalTaskCounts = await this.getGlobalTaskCounts(facilityIds, start, end);

      // Generate insights using the insights engine
      const insights = insightsEngine.generateGlobalInsights({
        meta: { generatedAt: new Date().toISOString(), range },
        kpis,
        facilities,
        members
      });

      const response = {
        meta: {
          generatedAt: new Date().toISOString(),
          range
        },
        kpis,
        facilities,
        members,
        globalTaskCounts,
        insights: insights
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

      // Generate insights using the insights engine
      const insights = insightsEngine.generateFacilityInsights({
        meta: { generatedAt: new Date().toISOString(), range },
        facility,
        kpis,
        charts,
        members
      });

      const response = {
        meta: {
          generatedAt: new Date().toISOString(),
          range
        },
        facility,
        kpis,
        charts,
        members,
        insights: insights
      };

      this.setCachedData(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Facility analytics aggregation error:', error);
      throw error;
    }
  }

  async getMemberAnalytics(memberId, userId, userRole, range = '4w', facilityId = null) {
    const cacheKey = `member_${memberId}_${userId}_${userRole}_${range}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const { start, end } = getTimeRangeDates(range);

    try {
      
      // Get member details
      const member = await this.getMemberDetails(memberId);
      
      // If getMemberDetails failed, try to get basic user info
      let memberInfo = member;
      if (!member) {
        let user = await User.findById(memberId);
        if (!user) {
          user = await User.findByFirebaseUid(memberId);
        }
        if (user) {
          memberInfo = {
            id: user.id,
            name: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            avatarUrl: user.profilePicture,
            facilityId: facilityId, // Use provided facilityId
            role: 'member', // Default role
            capacity: 8 // Default capacity
          };
        }
      }
      
      // Use provided facilityId or fallback to member's facility
      const targetFacilityId = facilityId || (memberInfo ? memberInfo.facilityId : null);
      
      // Aggregate member KPIs (pass facilityId if available)
      const kpis = await this.aggregateMemberKPIs(memberId, start, end, targetFacilityId);
      
      // Get chart data
      const charts = await this.getMemberChartData(memberId, start, end, targetFacilityId);
      
      // Get timeline data
      const timeline = await this.getMemberTimeline(memberId, start, end, targetFacilityId);
      
      // Generate insights (only if member data is available)
      const insights = memberInfo ? insightsEngine.generateMemberInsights({
        meta: { generatedAt: new Date().toISOString(), range },
        member: memberInfo,
        kpis,
        charts,
        timeline
      }) : [];

      const response = {
        meta: {
          generatedAt: new Date().toISOString(),
          range
        },
        member: memberInfo || {
          id: memberId,
          name: 'Unknown Member',
          avatarUrl: null,
          facilityId: null,
          role: 'unknown',
          capacity: 8
        },
        kpis,
        charts,
        timeline,
        insights: insights
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
      logger.debug('canAccessMemberAnalytics called', { memberId, userId, userRole });
      
      // userId here is the database user ID (set by auth middleware)
      const requestingUser = await User.findById(userId);
      if (!requestingUser) {
        logger.warn('Requesting user not found', { userId });
        return false;
      }
      
      logger.debug('Requesting user found', { id: requestingUser.id, email: requestingUser.email });
      
      // 1. SELF-ACCESS: User can always access their own analytics
      if (String(memberId) === String(requestingUser.id)) {
        logger.debug('Self-access granted', { memberId, userId });
        return true;
      }

      const accessibleFacilities = await this.getAccessibleFacilities(userId, userRole);
      logger.debug('User accessible facilities', { facilities: accessibleFacilities });
      
      if (accessibleFacilities.length > 0) {
        logger.debug('Access granted - user has access to facilities (global dashboard pattern)');
        return true;
      }

      // 3. LEGACY FACILITY-BASED ACCESS: Check if user belongs to the same facility as member
      const member = await this.getMemberDetails(memberId);
      if (member) {
        logger.debug('Member details found', { member });

        const userFacilities = await UserFacility.findByUser(requestingUser.id);
        logger.debug('User facilities', { facilities: userFacilities });
        
        // Find the user's role in the same facility as the member
        const userFacility = userFacilities.find(uf => uf.facilityId === member.facilityId);
        if (userFacility) {
          logger.debug('User found in same facility as member', { role: userFacility.role });
          return true;
        }
      }

      // 4. FALLBACK: If member details not found but user has manager/owner role anywhere
      const userFacilities = await UserFacility.findByUser(requestingUser.id);
      const hasManagerAccess = userFacilities.some(uf => ['owner', 'manager'].includes(uf.role));
      if (hasManagerAccess) {
        logger.debug('Access granted - user has manager/owner role in at least one facility');
        return true;
      }

      logger.debug('Access denied - no access pattern matched');
      return false;
    } catch (error) {
      logger.error('Member access check error', error);
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
      .map(f => {
        // Find the user's role in this facility
        const userFacility = userFacilities.find(uf => uf.facilityId === f.id);
        return { 
          id: f.id, 
          name: f.name,
          userRole: userFacility ? userFacility.role : 'guest'
        };
      });
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

  async aggregateGlobalKPIs(facilityIds, start, end, facilities = null) {
    try {
      // Get all members across facilities
      const allUserFacilities = await Promise.all(
        facilityIds.map(facilityId => UserFacility.findByFacility(facilityId))
      );
      const flatUserFacilities = allUserFacilities.flat();
      const uniqueUserIds = [...new Set(flatUserFacilities.map(uf => uf.userId))];
      
      // Calculate metrics
      const activeMembers = uniqueUserIds.length;
      const totalFacilities = facilityIds.length;
      
      // Use facility data if provided, otherwise calculate
      let avgUtilization = 0;
      if (facilities && facilities.length > 0) {
        // Use pre-calculated facility utilizations for consistency
        const facilityUtilizations = facilities.map(f => f.avgUtilization);
        avgUtilization = facilityUtilizations.reduce((sum, util) => sum + util, 0) / facilityUtilizations.length;
      } else {
        // Fallback: calculate facility-based utilization
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
            
            // Filter tasks by date range to match facility calculation
            const filteredTasks = facilityTasks.filter(task => {
              const createdDate = this.convertFirestoreTimestamp(task.createdAt);
              const updatedDate = this.convertFirestoreTimestamp(task.updatedAt);
              const isCompleted = task.status === 'completed' || task.status === 'done';
              
              const inDateRange = (createdDate && createdDate >= start && createdDate <= end) || 
                                 (updatedDate && updatedDate >= start && updatedDate <= end);
              
              return inDateRange || (!isCompleted);
            });
            
            if (filteredTasks.length === 0) {
              return 0;
            }
            
            // Calculate facility utilization using same logic as facility-specific calculation
            const completedTasks = filteredTasks.filter(t => t.status === 'completed' || t.status === 'done').length;
            const inProgressTasks = filteredTasks.filter(t => 
              t.status === 'in-progress' || t.status === 'in_progress' || t.status === 'review'
            ).length;
            const pendingTasks = filteredTasks.filter(t => 
              t.status === 'todo' || t.status === 'pending' || t.status === 'not-started'
            ).length;
            const overdueTasks = filteredTasks.filter(t => {
              if (!t.dueDate) return false;
              const dueDate = this.convertFirestoreTimestamp(t.dueDate);
              return dueDate && dueDate < new Date() && t.status !== 'completed' && t.status !== 'done';
            }).length;
            const totalTasks = filteredTasks.length;
            const weightedScore = (completedTasks * 1.0 + inProgressTasks * 0.8 + overdueTasks * 1.2 + pendingTasks * 0.2);
            const facilityUtilization = Math.min((weightedScore / totalTasks) * 100, 100);
            
            return facilityUtilization;
          })
        );
        
        // Calculate average utilization across all facilities
        avgUtilization = facilityUtilizations.length > 0 ? 
          facilityUtilizations.reduce((sum, util) => sum + util, 0) / facilityUtilizations.length : 0;
      }
      
      
      // Calculate critical facilities based on multiple risk factors
      let criticalFacilities = 0;
      if (facilities && facilities.length > 0) {
        // Use facility data for critical calculation
        criticalFacilities = facilities.filter(f => f.avgUtilization >= 90).length;
      } else {
        // Fallback: calculate critical facilities
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
        criticalFacilities = facilityRiskScores.filter(f => f.criticalScore >= 60).length;
      }

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

  async getFacilitySummaries(facilityIds, start, end, accessibleFacilities = [], userId = null) {
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
          
          // Get all tasks from facility projects only (no cross-facility tasks)
          const allProjectTasks = await Promise.all(
            activeProjects.map(project => Task.findByProject(project.id))
          );
          const facilityTasks = allProjectTasks.flat();
          
          const membersCount = userIds.length;
          
          
          // Filter tasks by date range to match facility calculation
          let filteredTasks = facilityTasks.filter(task => {
            const createdDate = this.convertFirestoreTimestamp(task.createdAt);
            const updatedDate = this.convertFirestoreTimestamp(task.updatedAt);
            const isCompleted = task.status === 'completed' || task.status === 'done';
            
            // Include tasks that:
            // 1. Were created/updated in the date range, OR
            // 2. Are not completed (active tasks) regardless of creation date
            const inDateRange = (createdDate && createdDate >= start && createdDate <= end) || 
                               (updatedDate && updatedDate >= start && updatedDate <= end);
            
            return inDateRange || (!isCompleted);
          });

          // Find user's role in this facility
          const userFacilityInfo = accessibleFacilities.find(af => af.id === facilityId);
          const userRole = userFacilityInfo ? userFacilityInfo.userRole : 'guest';

          // Filter tasks by user assignment if user is not owner/manager
          if (userId && userRole === 'member') {
            filteredTasks = filteredTasks.filter(task => {
              // Check if user is assigned to this task
              const assigneeIds = task.assigneeIds || [];
              const isAssigned = assigneeIds.includes(userId);
              
              // Also check if user is assigned to the project
              const project = activeProjects.find(p => p.id === task.projectId);
              const projectAssignees = project ? (project.assignees || []) : [];
              const isProjectAssigned = projectAssignees.includes(userId);
              
              return isAssigned || isProjectAssigned;
            });
          }

          if (filteredTasks.length === 0) {
            return {
              id: facility.id,
              name: facility.name,
              avgUtilization: 0,
              membersCount,
              userRole,
              statusDistribution: {
                balanced: 0,
                caution: 0,
                overloaded: 0
              }
            };
          }
          
          // Calculate facility utilization using same logic as facility-specific calculation
          const completedTasks = filteredTasks.filter(t => t.status === 'completed' || t.status === 'done').length;
          const inProgressTasks = filteredTasks.filter(t => 
            t.status === 'in-progress' || t.status === 'in_progress' || t.status === 'review'
          ).length;
          const pendingTasks = filteredTasks.filter(t => 
            t.status === 'todo' || t.status === 'pending' || t.status === 'not-started'
          ).length;
          const overdueTasks = filteredTasks.filter(t => {
            if (!t.dueDate) return false;
            const dueDate = this.convertFirestoreTimestamp(t.dueDate);
            return dueDate && dueDate < new Date() && t.status !== 'completed' && t.status !== 'done';
          }).length;
          const totalTasks = filteredTasks.length;
          
          // Debug: Show all unique task statuses
          const uniqueStatuses = [...new Set(filteredTasks.map(t => t.status))];
          
          
          // More sophisticated utilization calculation
          const weightedScore = (completedTasks * 1.0 + inProgressTasks * 0.8 + overdueTasks * 1.2 + pendingTasks * 0.2);
          const avgUtilization = Math.min((weightedScore / totalTasks) * 100, 100);
          
          
          // Calculate status distribution for members using filtered tasks
          const cautionTasks = filteredTasks.filter(t => {
            if (!t.dueDate) return false;
            const dueDate = this.convertFirestoreTimestamp(t.dueDate);
            const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            return dueDate && dueDate <= weekFromNow && 
                   dueDate > new Date() && t.status !== 'completed' && t.status !== 'done';
          }).length;
          const balancedTasks = totalTasks - overdueTasks - cautionTasks;
          
          return {
            id: facility.id,
            name: facility.name,
            avgUtilization: Math.round(avgUtilization * 10) / 10,
            membersCount,
            userRole,
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

  async getGlobalTaskCounts(facilityIds, start, end) {
    try {
      
      // Get all projects across all facilities
      const allProjects = await Promise.all(
        facilityIds.map(facilityId => Project.findByFacility(facilityId))
      );
      const flatProjects = allProjects.flat();
      const activeProjects = flatProjects.filter(p => !p.deletedAt);
      
      // Get all tasks from these projects
      const allProjectTasks = await Promise.all(
        activeProjects.map(project => Task.findByProject(project.id))
      );
      const flatTasks = allProjectTasks.flat();
      
      // Filter tasks by date range
      const filteredTasks = flatTasks.filter(task => {
        const createdDate = this.convertFirestoreTimestamp(task.createdAt);
        const updatedDate = this.convertFirestoreTimestamp(task.updatedAt);
        const isCompleted = task.status === 'completed' || task.status === 'done';
        
        // Include tasks that:
        // 1. Were created/updated in the date range, OR
        // 2. Are not completed (active tasks) regardless of creation date
        const inDateRange = (createdDate && createdDate >= start && createdDate <= end) || 
                           (updatedDate && updatedDate >= start && updatedDate <= end);
        
        return inDateRange || (!isCompleted);
      });
      
      // Deduplicate tasks (in case same task appears in multiple projects)
      const uniqueTasks = filteredTasks.filter((task, index, self) => 
        index === self.findIndex(t => t.id === task.id)
      );
      
      // Count by status - all 5 statuses (overdue takes priority over other statuses)
      const overdueTasks = uniqueTasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed' && t.status !== 'done'
      ).length;
      
      // For non-overdue tasks, count by their actual status
      const nonOverdueTasks = uniqueTasks.filter(t => 
        !(t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed' && t.status !== 'done')
      );
      
      const doneTasks = nonOverdueTasks.filter(t => 
        t.status === 'completed' || t.status === 'done'
      ).length;
      
      const inProgressTasks = nonOverdueTasks.filter(t => 
        t.status === 'in-progress' || t.status === 'in_progress'
      ).length;
      
      const reviewTasks = nonOverdueTasks.filter(t => 
        t.status === 'review'
      ).length;
      
      const pendingTasks = nonOverdueTasks.filter(t => 
        t.status === 'todo' || t.status === 'pending' || t.status === 'not-started'
      ).length;
      
      const totalTasks = uniqueTasks.length;
      
      
      return {
        done: doneTasks,
        inProgress: inProgressTasks,
        review: reviewTasks,
        pending: pendingTasks,
        overdue: overdueTasks,
        total: totalTasks
      };
    } catch (error) {
      console.error('Error getting global task counts:', error);
      return {
        done: 0,
        inProgress: 0,
        review: 0,
        pending: 0,
        overdue: 0,
        total: 0
      };
    }
  }

  async getMemberSummaries(facilityIds, start, end, userId = null, accessibleFacilities = []) {
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
        // Try to find user by database ID first (since UserFacility stores database user IDs)
        let user = await User.findById(userId);
        if (!user) {
          // If not found by database ID, try by Firebase UID (for backward compatibility)
          user = await User.findByFirebaseUid(userId);
        }
        if (!user) {
          logger.warn(`User with ID ${userId} not found in User collection, skipping analytics for this user`);
          continue;
        }
        
        
        // Use the actual user's database ID for task matching (not the original userId which might be Firebase UID)
        const userDatabaseId = user.id;
        
        // Create separate entries for each facility where user is a member
        for (const userFacility of userFacilities) {
          const facility = await Facility.findById(userFacility.facilityId);
          if (!facility) {
            logger.warn(`Facility ${userFacility.facilityId} not found, skipping`);
            continue;
          }
          
          
          // Get facility projects first
          const facilityProjects = await Project.findByFacility(facility.id);
          const activeProjects = facilityProjects.filter(p => !p.deletedAt);
          const deletedProjects = facilityProjects.filter(p => p.deletedAt);
          
          // Let's also check if there are projects that might be associated with this facility but not found by findByFacility
          const allProjects = await Project.findAll();
          const projectsWithThisFacility = allProjects.filter(p => p.facilityId === facility.id);
          
          // Check if there's a discrepancy
          if (projectsWithThisFacility.length !== facilityProjects.length) {
            logger.warn(`DISCREPANCY FOUND! findByFacility found ${facilityProjects.length} projects, but direct facilityId search found ${projectsWithThisFacility.length} projects`);
            const missingProjects = projectsWithThisFacility.filter(p => !facilityProjects.find(fp => fp.id === p.id));
            logger.warn(`Missing projects: ${missingProjects.map(p => p.id).join(', ')}`);
          }
          
          // Check tasks in deleted projects too
          let flatDeletedProjectTasks = [];
          if (deletedProjects.length > 0) {
            const deletedProjectTasks = await Promise.all(
              deletedProjects.map(project => Task.findByProject(project.id))
            );
            flatDeletedProjectTasks = deletedProjectTasks.flat();
          }
          
          // Get all tasks from facility projects using the same method as facility controller
          const allProjectIds = facilityProjects.map(p => p.id); // Include ALL projects (active + deleted)
          const totalTaskCount = await Task.countByProjectIds(allProjectIds);
          
          // Let's also manually count tasks to verify
          const manualCount = await Promise.all(
            allProjectIds.map(async (projectId) => {
              const tasks = await Task.findByProject(projectId);
              return tasks.length;
            })
          );
          const manualTotal = manualCount.reduce((sum, count) => sum + count, 0);
          
          // Also get individual project tasks for detailed analysis
          const projectTasks = await Promise.all(
            activeProjects.map(project => Task.findByProject(project.id))
          );
          const flatProjectTasks = projectTasks.flat();
          
          // Check if there are tasks directly associated with facility (not through projects)
          const directFacilityTasks = await Task.findByField('facilityId', facility.id);
          
          // Check for orphaned tasks (tasks without projectId)
          const orphanedTasks = await Task.findByField('projectId', null);
          
          // Check for tasks with empty projectId
          const emptyProjectTasks = await Task.findByField('projectId', '');
          
          // Check for tasks that might be associated with this facility but not through projects
          const allTasks = await Task.findAll();
          const tasksWithThisFacility = allTasks.filter(t => t.facilityId === facility.id);
          
          // Check if there are tasks that should be counted but aren't
          const tasksInFacilityProjects = allTasks.filter(t => allProjectIds.includes(t.projectId));
          
          // Check for any discrepancy
          const expectedTotal = tasksInFacilityProjects.length + directFacilityTasks.length;
          
          // Use the total task count from countByProjectIds (includes all projects) + direct facility tasks
          const allFacilityTasks = [...flatProjectTasks, ...flatDeletedProjectTasks, ...directFacilityTasks];
          const actualTotalTasks = totalTaskCount + directFacilityTasks.length;
          
          // Filter tasks to only include those assigned to this user in THIS facility
          let userFacilityTasks = allFacilityTasks.filter(task => {
            // Check assigneeIds array (plural) - use user's database ID for matching
            if (Array.isArray(task.assigneeIds)) {
              return task.assigneeIds.includes(userDatabaseId) || task.assigneeIds.includes(user.firebaseUid);
            }
            // Fallback to single assigneeId for backward compatibility
            if (Array.isArray(task.assigneeId)) {
              return task.assigneeId.includes(userDatabaseId) || task.assigneeId.includes(user.firebaseUid);
            } else {
              return task.assigneeId === userDatabaseId || task.assigneeId === user.firebaseUid;
            }
          });
          
          // If still no tasks found, check for tasks assigned by email or name
          if (userFacilityTasks.length === 0 && user.email) {
            userFacilityTasks = allFacilityTasks.filter(task => 
              task.assigneeEmail === user.email || 
              (task.assigneeName && task.assigneeName.toLowerCase().includes(user.email.split('@')[0].toLowerCase()))
            );
          }
          
          // If still no tasks found, check if user is assigned to the project (project-level assignment)
          if (userFacilityTasks.length === 0) {
            const userProjectTasks = [];
            for (const project of activeProjects) {
              // Check if user is assigned to this project
              if (project.assignees && project.assignees.includes(userDatabaseId)) {
                const projectTasks = flatProjectTasks.filter(task => task.projectId === project.id);
                userProjectTasks.push(...projectTasks);
              }
            }
            userFacilityTasks = userProjectTasks;
          }
          
          // Only use fallback distribution if absolutely no tasks are found and there are unassigned tasks
          if (userFacilityTasks.length === 0) {
            const unassignedTasks = allFacilityTasks.filter(task => {
              // Check if task has no assignees (empty array or null/undefined)
              const hasNoAssigneeIds = !task.assigneeIds || 
                (Array.isArray(task.assigneeIds) && task.assigneeIds.length === 0) ||
                task.assigneeIds === null || task.assigneeIds === undefined;
              
              const hasNoAssigneeId = !task.assigneeId || 
                (Array.isArray(task.assigneeId) && task.assigneeId.length === 0) ||
                task.assigneeId === null || task.assigneeId === undefined;
              
              return (hasNoAssigneeIds && hasNoAssigneeId) && !task.assigneeEmail && !task.assigneeName;
            });
            
            if (unassignedTasks.length > 0) {
              
              // Get all facility members to distribute unassigned tasks fairly
              const facilityUserFacilities = await UserFacility.findByFacility(facility.id);
              const facilityMemberIds = facilityUserFacilities.map(uf => uf.userId);
              const memberIndex = facilityMemberIds.indexOf(userDatabaseId);
            
              if (memberIndex !== -1) {
                // Distribute unassigned tasks evenly among all members
                const tasksPerMember = Math.ceil(unassignedTasks.length / facilityMemberIds.length);
              const startIndex = memberIndex * tasksPerMember;
                const endIndex = Math.min(startIndex + tasksPerMember, unassignedTasks.length);
              
                userFacilityTasks = unassignedTasks.slice(startIndex, endIndex);
              }
            }
          }
          
          
          // Debug: Show task assignment details
          if (allFacilityTasks.length > 0) {
            allFacilityTasks.slice(0, 3).forEach((task, index) => {
            const isAssigned = Array.isArray(task.assigneeIds) 
              ? task.assigneeIds.includes(userId) || task.assigneeIds.includes(user.firebaseUid)
              : (Array.isArray(task.assigneeId) 
                ? task.assigneeId.includes(userId) || task.assigneeId.includes(user.firebaseUid)
                : task.assigneeId === userId || task.assigneeId === user.firebaseUid);
            });
          }
          
          // Debug: Show project assignment details
          if (activeProjects.length > 0) {
            activeProjects.slice(0, 3).forEach((project, index) => {
            });
          }
          
          // Filter tasks by date range first, then deduplicate
          const dateFilteredTasks = userFacilityTasks.filter(task => {
            const createdDate = this.convertFirestoreTimestamp(task.createdAt);
            const updatedDate = this.convertFirestoreTimestamp(task.updatedAt);
            const isCompleted = task.status === 'completed' || task.status === 'done';
            
            // Include tasks that:
            // 1. Were created/updated in the date range, OR
            // 2. Are not completed (active tasks) regardless of creation date
            const inDateRange = (createdDate && createdDate >= start && createdDate <= end) || 
                               (updatedDate && updatedDate >= start && updatedDate <= end);
            
            return inDateRange || (!isCompleted);
          });
          
          // Use only facility-specific tasks (no global user tasks) - deduplicate after date filtering
          const uniqueTasks = dateFilteredTasks.filter((task, index, self) => 
            index === self.findIndex(t => t.id === task.id)
          );
          
          const totalTasks = uniqueTasks.length;
          const ongoingTasks = uniqueTasks.filter(t => 
            t.status === 'in_progress' || t.status === 'in-progress' || t.status === 'ongoing' || t.status === 'review'
          ).length;
          const completedTasks = uniqueTasks.filter(t => 
            t.status === 'completed' || t.status === 'done'
          ).length;
          const overdueTasks = uniqueTasks.filter(t => 
            t.dueDate && new Date(t.dueDate) < new Date() && 
            t.status !== 'completed' && t.status !== 'done'
          ).length;
          
          // Calculate utilization for this specific facility with weighted scoring
          let utilization = 0;
          let status = 'balanced';
          
          if (totalTasks > 0) {
            const pendingTasks = totalTasks - completedTasks - ongoingTasks;
            const weightedScore = (completedTasks * 1.0 + ongoingTasks * 0.8 + overdueTasks * 1.2 + pendingTasks * 0.2);
            utilization = Math.min((weightedScore / totalTasks) * 100, 100);
            
            // Determine status for this facility with more nuanced logic
            const upcomingDeadlines = uniqueTasks.filter(t => 
              t.dueDate && new Date(t.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && 
              new Date(t.dueDate) > new Date() && t.status !== 'completed' && t.status !== 'done'
            ).length;
            
            // More sophisticated status determination
            if (overdueTasks > 0) {
              status = 'overloaded';
            } else if (upcomingDeadlines > 2 || (ongoingTasks > 5 && totalTasks > 10)) {
              status = 'caution';
            } else if (utilization < 30 && totalTasks > 0) {
              status = 'balanced'; // Low utilization but has tasks
            } else if (utilization >= 80) {
              status = 'caution'; // High utilization
            } else {
              status = 'balanced';
            }
          } else {
            // No tasks assigned - consider as balanced
            status = 'balanced';
            utilization = 0;
          }
          
          // Calculate trend by comparing with previous period (facility-specific)
          let trend = 0;
          try {
            const periodDuration = end.getTime() - start.getTime();
            const previousEnd = new Date(start);
            const previousStart = new Date(previousEnd.getTime() - periodDuration);
            
            const allProjectTasksForTrend = await Promise.all(
              activeProjects.map(project => Task.findByProject(project.id))
            );
            const flatAllProjectTasks = allProjectTasksForTrend.flat();
            const allUserProjectTasks = flatAllProjectTasks.filter(task => {
              // Check assigneeIds array (plural) first - use user's database ID for matching
              if (Array.isArray(task.assigneeIds)) {
                return task.assigneeIds.includes(userDatabaseId) || task.assigneeIds.includes(user.firebaseUid);
              }
              // Fallback to single assigneeId for backward compatibility
              if (Array.isArray(task.assigneeId)) {
                return task.assigneeId.includes(userDatabaseId) || task.assigneeId.includes(user.firebaseUid);
              } else {
                return task.assigneeId === userDatabaseId || task.assigneeId === user.firebaseUid;
              }
            });
            
            // If still no tasks found, check for tasks assigned by email or name
            if (allUserProjectTasks.length === 0 && user.email) {
              const emailMatchedTasks = flatAllProjectTasks.filter(task => 
                task.assigneeEmail === user.email || 
                (task.assigneeName && task.assigneeName.toLowerCase().includes(user.email.split('@')[0].toLowerCase()))
              );
              allUserProjectTasks.push(...emailMatchedTasks);
            }
            
            // Deduplicate
            const uniqueAllTasks = allUserProjectTasks.filter((task, index, self) => 
              index === self.findIndex(t => t.id === task.id)
            );
            
            
            // Get previous period tasks for trend calculation
            const previousTasks = uniqueAllTasks.filter(task => {
              const taskDate = new Date(task.createdAt);
              return taskDate >= previousStart && taskDate < previousEnd;
            });
            
            const previousCompleted = previousTasks.filter(t => 
              t.status === 'completed' || t.status === 'done'
            ).length;
            
            
            if (previousCompleted > 0) {
              trend = Math.round(((completedTasks - previousCompleted) / previousCompleted) * 100);
            } else if (completedTasks > 0 && previousCompleted === 0) {
              // Calculate trend based on total tasks in both periods for more realistic percentages
              const currentTotal = uniqueAllTasks.filter(task => {
                const taskDate = new Date(task.createdAt);
                return taskDate >= start && taskDate <= end;
              }).length;
              
              const previousTotal = previousTasks.length;
              
              
              if (previousTotal > 0) {
                // If there were tasks in previous period but none completed, show improvement
                trend = Math.min(100, Math.round((completedTasks / previousTotal) * 100));
              } else if (currentTotal > 0) {
                // If no previous activity, show completion rate as trend (capped at reasonable level)
                const completionRate = (completedTasks / currentTotal) * 100;
                trend = Math.min(50, Math.round(completionRate)); // Cap at 50% for new activity
              } else {
                // If we have completed tasks but no total tasks in current period, show positive trend
                trend = Math.min(25, completedTasks * 5); // Small positive trend for any completions
              }
            } else if (completedTasks === 0 && previousCompleted > 0) {
              // Show negative trend if no current completions but had previous ones
              trend = -100;
            } else if (completedTasks > 0) {
              // If we have completed tasks but no previous data, show a small positive trend
              trend = Math.min(25, completedTasks * 5); // Small positive trend for any completions
            } else if (totalTasks > 0) {
              // If we have tasks but no completions, show a small negative trend
              trend = -Math.min(15, totalTasks * 2); // Small negative trend for no completions
            } else {
              trend = 0;
            }
            
          } catch (error) {
            logger.warn(`Could not calculate trend for user ${userId} in facility ${facility.id}: ${error.message}`);
          }
          
          allSummaries.push({
            id: user.id.toString(), // Convert to string for frontend compatibility
            name: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            avatarUrl: user.profilePicture,
            facilityId: facility.id.toString(), // Convert to string for frontend compatibility
            facilityName: facility.name,
            role: userFacility.role,
            tasks: {
              total: totalTasks,
              ongoing: ongoingTasks,
              completed: completedTasks
            },
            utilization: Math.round(utilization * 10) / 10,
            status,
            trend
          });
        }
      }
      
      const summaries = allSummaries;
      
      
      // Filter members based on user's role and access
      let filteredSummaries = summaries
        .filter(s => s !== null)
        .filter(s => facilityIds.includes(s.facilityId)); // Ensure member belongs to requested facility (string comparison)

      // If user is a member, only show their own data
      if (userId) {
        const userFacilityRoles = accessibleFacilities.reduce((acc, af) => {
          acc[af.id] = af.userRole;
          return acc;
        }, {});

        filteredSummaries = filteredSummaries.filter(summary => {
          const userRoleInFacility = userFacilityRoles[summary.facilityId];
          
          // If user is owner/manager in this facility, show all members
          if (['owner', 'manager'].includes(userRoleInFacility)) {
            return true;
          }
          
          // If user is member in this facility, only show their own data
          if (userRoleInFacility === 'member') {
            return summary.id === userId.toString();
          }
          
          // If user is guest, don't show any members
          return false;
        });
        
      }

      filteredSummaries = filteredSummaries.sort((a, b) => b.utilization - a.utilization);
      
      
      // Final validation - ensure all returned members belong to the requested facilities
      const invalidMembers = filteredSummaries.filter(s => !facilityIds.includes(s.facilityId));
      if (invalidMembers.length > 0) {
        logger.warn(`WARNING: Found ${invalidMembers.length} members not belonging to requested facilities`, { invalidMembers: invalidMembers.map(m => ({ id: m.id, name: m.name, facilityId: m.facilityId })) });
      }
      
      return filteredSummaries;
    } catch (error) {
      logger.error('Error getting member summaries', error);
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
      
      // Get tasks from facility projects only (no cross-facility tasks)
      const facilityProjects = await Project.findByFacility(facilityId);
      const activeProjects = facilityProjects.filter(p => !p.deletedAt);
      
      // Get all tasks from facility projects
      const projectTasks = await Promise.all(
        activeProjects.map(project => Task.findByProject(project.id))
      );
      const uniqueTasks = projectTasks.flat();
      
      // Debug: Show sample task dates
      if (uniqueTasks.length > 0) {
        uniqueTasks.slice(0, 3).forEach((task, index) => {
          let createdDate = 'null';
          let updatedDate = 'null';
          
          try {
            if (task.createdAt) {
              // Handle Firestore Timestamp objects
              if (task.createdAt.toDate && typeof task.createdAt.toDate === 'function') {
                createdDate = task.createdAt.toDate().toISOString();
              } else if (task.createdAt.seconds) {
                createdDate = new Date(task.createdAt.seconds * 1000).toISOString();
              } else {
                createdDate = new Date(task.createdAt).toISOString();
              }
            }
          } catch (e) {
            createdDate = `invalid: ${task.createdAt}`;
          }
          
          try {
            if (task.updatedAt) {
              // Handle Firestore Timestamp objects
              if (task.updatedAt.toDate && typeof task.updatedAt.toDate === 'function') {
                updatedDate = task.updatedAt.toDate().toISOString();
              } else if (task.updatedAt.seconds) {
                updatedDate = new Date(task.updatedAt.seconds * 1000).toISOString();
              } else {
                updatedDate = new Date(task.updatedAt).toISOString();
              }
            }
          } catch (e) {
            updatedDate = `invalid: ${task.updatedAt}`;
          }
          
        });
      }
      
      const filteredTasks = uniqueTasks.filter(task => {
        const createdDate = this.convertFirestoreTimestamp(task.createdAt);
        const updatedDate = this.convertFirestoreTimestamp(task.updatedAt);
        const isCompleted = task.status === 'completed' || task.status === 'done';
        
        // Include tasks that:
        // 1. Were created/updated in the date range, OR
        // 2. Are not completed (active tasks) regardless of creation date
        const inDateRange = (createdDate && createdDate >= start && createdDate <= end) || 
                           (updatedDate && updatedDate >= start && updatedDate <= end);
        
        return inDateRange || (!isCompleted);
      });
      
      const activeMembers = userIds.length;
      
      // Calculate average utilization
      const completedTasks = filteredTasks.filter(t => t.status === 'completed' || t.status === 'done').length;
      const overdueTasks = filteredTasks.filter(t => {
        if (!t.dueDate) return false;
        const dueDate = this.convertFirestoreTimestamp(t.dueDate);
        return dueDate && dueDate < new Date() && t.status !== 'completed' && t.status !== 'done';
      }).length;
      const totalTasks = filteredTasks.length;
      
      // More sophisticated utilization calculation
      const inProgressTasks = filteredTasks.filter(t => 
        t.status === 'in-progress' || t.status === 'in_progress' || t.status === 'review'
      ).length;
      const pendingTasks = filteredTasks.filter(t => 
        t.status === 'todo' || t.status === 'pending' || t.status === 'not-started'
      );
      const pendingTasksList = pendingTasks.map(t => ({
        id: t.id,
        name: t.name || t.title || 'Untitled Task',
        status: t.status,
        dueDate: t.dueDate ? this.convertFirestoreTimestamp(t.dueDate) : null
      }));

      const overdueTasksList = filteredTasks.filter(t => {
        if (!t.dueDate) return false;
        const dueDate = this.convertFirestoreTimestamp(t.dueDate);
        return dueDate && dueDate < new Date() && t.status !== 'completed' && t.status !== 'done';
      }).map(t => ({
        id: t.id,
        name: t.name || t.title || 'Untitled Task',
        status: t.status,
        dueDate: t.dueDate ? this.convertFirestoreTimestamp(t.dueDate) : null
      }));

      const weightedScore = (completedTasks * 1.0 + inProgressTasks * 0.8 + overdueTasksList.length * 1.2 + pendingTasksList.length * 0.2);
      const avgUtilization = totalTasks > 0 ? Math.min((weightedScore / totalTasks) * 100, 100) : 0;

      

      // Calculate daily task distribution for calendar
      const dailyTaskData = new Map();
      
      // Get all tasks with due dates for the current month
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      // Initialize all days in the month
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        const dateString = date.toISOString().split('T')[0];
        dailyTaskData.set(dateString, {
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          overdueTasks: 0,
          pendingTasks: 0,
          workload: 0
        });
      }
      
      
      // Count tasks by due date
      let tasksWithDueDates = 0;
      filteredTasks.forEach(task => {
        if (task.dueDate) {
          tasksWithDueDates++;
          const dueDate = this.convertFirestoreTimestamp(task.dueDate);
          if (dueDate) {
            const dueDateString = dueDate.toISOString().split('T')[0];
            const dayData = dailyTaskData.get(dueDateString);
            
            if (dayData) {
              dayData.totalTasks++;
              
              if (task.status === 'completed' || task.status === 'done') {
                dayData.completedTasks++;
              } else if (task.status === 'in-progress' || task.status === 'in_progress' || task.status === 'review') {
                dayData.inProgressTasks++;
              } else if (task.status === 'todo' || task.status === 'pending' || task.status === 'not-started') {
                dayData.pendingTasks++;
              }
              
              // Check if overdue
              if (dueDate < new Date() && task.status !== 'completed' && task.status !== 'done') {
                dayData.overdueTasks++;
              }
            } else {
            }
          } else {
            logger.warn(`[Calendar] Could not convert dueDate for task: ${task.id}`);
          }
        }
      });
      
      
      // Calculate daily workload using the same weighted system
      dailyTaskData.forEach((dayData, dateString) => {
        if (dayData.totalTasks > 0) {
          const weightedScore = (
            dayData.completedTasks * 1.0 +
            dayData.inProgressTasks * 0.8 +
            dayData.overdueTasks * 1.2 +
            dayData.pendingTasks * 0.2
          );
          dayData.workload = Math.min((weightedScore / dayData.totalTasks) * 100, 100);
          
        }
      });

      return {
        activeMembers,
        pendingTasks: pendingTasksList.length,
        overdueTasks: overdueTasksList.length,
        avgUtilization: Math.round(avgUtilization * 10) / 10,
        pendingTasksList,
        overdueTasksList,
        dailyTaskData: Object.fromEntries(dailyTaskData)
      };
    } catch (error) {
      console.error('Error aggregating facility KPIs:', error);
      return {
        activeMembers: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        avgUtilization: 0
      };
    }
  }

  async getFacilityChartData(facilityId, start, end) {
    try {
      const userFacilities = await UserFacility.findByFacility(facilityId);
      const userIds = userFacilities.map(uf => uf.userId);
      
      // Get tasks from facility projects only (no cross-facility tasks)
      const facilityProjects = await Project.findByFacility(facilityId);
      const activeProjects = facilityProjects.filter(p => !p.deletedAt);
      const projectTasks = await Promise.all(
        activeProjects.map(project => Task.findByProject(project.id))
      );
      const uniqueTasks = projectTasks.flat();
      
      const filteredTasks = uniqueTasks.filter(task => {
        const createdDate = this.convertFirestoreTimestamp(task.createdAt);
        const updatedDate = this.convertFirestoreTimestamp(task.updatedAt);
        const isCompleted = task.status === 'completed' || task.status === 'done';
        
        const inDateRange = (createdDate && createdDate >= start && createdDate <= end) || 
                           (updatedDate && updatedDate >= start && updatedDate <= end);
        
        return inDateRange || (!isCompleted);
      });
      
      // Calculate distribution
      const overdueTasks = filteredTasks.filter(t => {
        if (!t.dueDate) return false;
        try {
          const dueDate = new Date(t.dueDate);
          return !isNaN(dueDate.getTime()) && dueDate < new Date() && t.status !== 'completed' && t.status !== 'done';
        } catch (e) {
          return false;
        }
      }).length;
      
      const cautionTasks = filteredTasks.filter(t => {
        if (!t.dueDate) return false;
        try {
          const dueDate = new Date(t.dueDate);
          const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          return !isNaN(dueDate.getTime()) && dueDate <= weekFromNow && 
                 dueDate > new Date() && t.status !== 'completed' && t.status !== 'done';
        } catch (e) {
          return false;
        }
      }).length;
      
      const balancedTasks = filteredTasks.length - overdueTasks - cautionTasks;
      
      // Generate utilization series (weekly data based on real task data)
      const utilizationSeries = [];
      const currentDate = new Date(start);
      const endDate = new Date(end);
      
      while (currentDate <= endDate) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        // Get tasks that were active during this week
        const weekTasks = filteredTasks.filter(task => {
          let createdDate = null;
          let updatedDate = null;
          let dueDate = null;
          
          try {
            if (task.createdAt) {
              createdDate = new Date(task.createdAt);
              if (isNaN(createdDate.getTime())) createdDate = null;
            }
          } catch (e) {
            createdDate = null;
          }
          
          try {
            if (task.updatedAt) {
              updatedDate = new Date(task.updatedAt);
              if (isNaN(updatedDate.getTime())) updatedDate = null;
            }
          } catch (e) {
            updatedDate = null;
          }
          
          try {
            if (task.dueDate) {
              dueDate = new Date(task.dueDate);
              if (isNaN(dueDate.getTime())) dueDate = null;
            }
          } catch (e) {
            dueDate = null;
          }
          
          // Task is relevant if it was created, updated, or due during this week
          return (createdDate && createdDate >= weekStart && createdDate < weekEnd) ||
                 (updatedDate && updatedDate >= weekStart && updatedDate < weekEnd) ||
                 (dueDate && dueDate >= weekStart && dueDate < weekEnd);
        });
        
        const weekCompleted = weekTasks.filter(t => t.status === 'completed' || t.status === 'done').length;
        const weekOverdue = weekTasks.filter(t => {
          if (!t.dueDate) return false;
          try {
            const dueDate = new Date(t.dueDate);
            return !isNaN(dueDate.getTime()) && dueDate < new Date() && t.status !== 'completed' && t.status !== 'done';
          } catch (e) {
            return false;
          }
        }).length;
        const weekInProgress = weekTasks.filter(t => 
          t.status === 'in-progress' || t.status === 'in-progress' || t.status === 'review'
        ).length;
        const weekTotal = weekTasks.length;
        
        const weekUtilization = weekTotal > 0 ? 
          ((weekCompleted * 1.0 + weekInProgress * 0.8 + weekOverdue * 1.2 + (weekTotal - weekCompleted - weekInProgress - weekOverdue) * 0.2) / weekTotal) * 100 : 0;
        
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
      logger.debug('getMemberDetails called', { memberId });
      // Try to find user by database ID first (since UserFacility stores database user IDs)
      let user = await User.findById(memberId);
      if (!user) {
        // If not found by database ID, try by Firebase UID (for backward compatibility)
        user = await User.findByFirebaseUid(memberId);
      }
      logger.debug('User found', { found: !!user, user: user ? { id: user.id, email: user.email } : null });
      if (!user) {
        logger.warn(`User with ID ${memberId} not found in User collection`);
        return null;
      }
      
      const userFacilities = await UserFacility.findByUser(memberId);
      logger.debug('User facilities found', { count: userFacilities.length, facilities: userFacilities });
      if (userFacilities.length === 0) return null;
      
      const userFacility = userFacilities[0]; // Use first facility
      const facility = await Facility.findById(userFacility.facilityId);
      logger.debug('Facility found', { found: !!facility, facility: facility ? { id: facility.id, name: facility.name } : null });
      
      // If facility doesn't exist, return null to indicate member details not found
      if (!facility) {
        logger.warn(`Facility ${userFacility.facilityId} not found for user ${memberId}`);
        return null;
      }
      
      const result = {
        id: user.id,
        name: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        avatarUrl: user.profilePicture,
        facilityId: facility.id,
        role: userFacility.role,
        capacity: 8 // Default capacity
      };
      logger.debug('getMemberDetails returning', { result });
      return result;
    } catch (error) {
      logger.error('Error getting member details', error);
      return null;
    }
  }

  async aggregateMemberKPIs(memberId, start, end, facilityId = null) {
    try {
      let filteredTasks = [];
      
      // Get the actual user to determine the correct database ID for task matching
      let user = await User.findById(memberId);
      if (!user) {
        user = await User.findByFirebaseUid(memberId);
      }
      const userDatabaseId = user ? user.id : memberId;
      
      if (facilityId) {
        // Get facility-specific tasks
        const facilityProjects = await Project.findByFacility(facilityId);
        const activeProjects = facilityProjects.filter(p => !p.deletedAt);
        
        const projectTasks = await Promise.all(
          activeProjects.map(project => Task.findByProject(project.id))
        );
        const flatProjectTasks = projectTasks.flat();
        
        // Filter tasks assigned to this member in this facility using same logic as facility analytics
        let userTasks = flatProjectTasks.filter(task => {
          // Check assigneeIds array (plural) first - use user's database ID for matching
          if (Array.isArray(task.assigneeIds)) {
            return task.assigneeIds.includes(userDatabaseId) || (user && task.assigneeIds.includes(user.firebaseUid));
          }
          // Fallback to single assigneeId for backward compatibility
          if (Array.isArray(task.assigneeId)) {
            return task.assigneeId.includes(userDatabaseId) || (user && task.assigneeId.includes(user.firebaseUid));
          } else {
            return task.assigneeId === userDatabaseId || (user && task.assigneeId === user.firebaseUid);
          }
        });
        
        // If still no tasks found, check for tasks assigned by email or name (same as facility analytics)
        if (userTasks.length === 0 && user && user.email) {
          userTasks = flatProjectTasks.filter(task => 
            task.assigneeEmail === user.email || 
            (task.assigneeName && task.assigneeName.toLowerCase().includes(user.email.split('@')[0].toLowerCase()))
          );
        }
        
        // If still no tasks found, check if user is assigned to the project (project-level assignment)
        if (userTasks.length === 0) {
          const userProjectTasks = [];
          for (const project of activeProjects) {
            // Check if user is assigned to this project
            if (project.assignees && project.assignees.includes(userDatabaseId)) {
              const projectTasks = flatProjectTasks.filter(task => task.projectId === project.id);
              userProjectTasks.push(...projectTasks);
            }
          }
          userTasks = userProjectTasks;
        }
        
        // Filter by date range using same logic as facility analytics
        filteredTasks = userTasks.filter(task => {
          const createdDate = this.convertFirestoreTimestamp(task.createdAt);
          const updatedDate = this.convertFirestoreTimestamp(task.updatedAt);
          const isCompleted = task.status === 'completed' || task.status === 'done';
          
          // Include tasks that:
          // 1. Were created/updated in the date range, OR
          // 2. Are not completed (active tasks) regardless of creation date
          const inDateRange = (createdDate && createdDate >= start && createdDate <= end) || 
                             (updatedDate && updatedDate >= start && updatedDate <= end);
          
          return inDateRange || (!isCompleted);
        });
      } else {
        // Fallback to global tasks (for backward compatibility)
        let allTasks = await Task.findByAssignee(userDatabaseId);
        
        // If no tasks found and user exists, try Firebase UID
        if (allTasks.length === 0 && user) {
          allTasks = await Task.findByAssignee(user.firebaseUid);
        }
        
        filteredTasks = allTasks.filter(task => {
          const createdDate = this.convertFirestoreTimestamp(task.createdAt);
          const updatedDate = this.convertFirestoreTimestamp(task.updatedAt);
          const isCompleted = task.status === 'completed' || task.status === 'done';
          
          // Include tasks that:
          // 1. Were created/updated in the date range, OR
          // 2. Are not completed (active tasks) regardless of creation date
          const inDateRange = (createdDate && createdDate >= start && createdDate <= end) || 
                             (updatedDate && updatedDate >= start && updatedDate <= end);
          
          return inDateRange || (!isCompleted);
        });
      }
      
      const totalTasks = filteredTasks.length;
      const ongoing = filteredTasks.filter(t => t.status === 'in_progress' || t.status === 'ongoing' || t.status === 'in-progress' || t.status === 'review').length;
      const completed = filteredTasks.filter(t => t.status === 'completed' || t.status === 'done').length;
      
      // Calculate utilization
      const overdueTasks = filteredTasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed' && t.status !== 'done'
      ).length;
      
      // More sophisticated utilization calculation
      const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress' || t.status === 'in_progress' || t.status === 'ongoing' || t.status === 'review').length;
      const pendingTasks = totalTasks - completed - inProgressTasks; // Match facility analytics calculation
      const weightedScore = (completed * 1.0 + inProgressTasks * 0.8 + overdueTasks * 1.2 + pendingTasks * 0.2);
      const utilization = totalTasks > 0 ? Math.min((weightedScore / totalTasks) * 100, 100) : 0;

      // Calculate trend by comparing with previous period (same logic as facility analytics)
      let trend = 0;
      try {
        const periodDuration = end.getTime() - start.getTime();
        const previousEnd = new Date(start);
        const previousStart = new Date(previousEnd.getTime() - periodDuration);
        
        // Get tasks from previous period using same logic as facility analytics
        let previousTasks = [];
        if (facilityId) {
          // Get facility-specific tasks for previous period (same as facility analytics)
          const facilityProjects = await Project.findByFacility(facilityId);
          const activeProjects = facilityProjects.filter(p => !p.deletedAt);
          
          const allProjectTasksForTrend = await Promise.all(
            activeProjects.map(project => Task.findByProject(project.id))
          );
          const flatAllProjectTasks = allProjectTasksForTrend.flat();
          
          const allUserProjectTasks = flatAllProjectTasks.filter(task => {
            // Check assigneeIds array (plural) first - use user's database ID for matching
            if (Array.isArray(task.assigneeIds)) {
              return task.assigneeIds.includes(userDatabaseId) || task.assigneeIds.includes(user.firebaseUid);
            }
            // Fallback to single assigneeId for backward compatibility
            if (Array.isArray(task.assigneeId)) {
              return task.assigneeId.includes(userDatabaseId) || task.assigneeId.includes(user.firebaseUid);
            } else {
              return task.assigneeId === userDatabaseId || task.assigneeId === user.firebaseUid;
            }
          });
          
          // If still no tasks found, check for tasks assigned by email or name
          if (allUserProjectTasks.length === 0 && user.email) {
            const emailMatchedTasks = flatAllProjectTasks.filter(task => 
              task.assigneeEmail === user.email || 
              (task.assigneeName && task.assigneeName.toLowerCase().includes(user.email.split('@')[0].toLowerCase()))
            );
            allUserProjectTasks.push(...emailMatchedTasks);
          }
          
          // Deduplicate
          const uniqueAllTasks = allUserProjectTasks.filter((task, index, self) => 
            index === self.findIndex(t => t.id === task.id)
          );
          
          // Get previous period tasks for trend calculation (same as facility analytics - only by createdAt)
          previousTasks = uniqueAllTasks.filter(task => {
            const taskDate = new Date(task.createdAt);
            return taskDate >= previousStart && taskDate < previousEnd;
          });
        } else {
          // Fallback to global tasks for previous period
          let allTasks = await Task.findByAssignee(userDatabaseId);
          if (allTasks.length === 0 && user) {
            allTasks = await Task.findByAssignee(user.firebaseUid);
          }
          
          // Filter by previous period date range (only by createdAt like facility analytics)
          previousTasks = allTasks.filter(task => {
            const taskDate = new Date(task.createdAt);
            return taskDate >= previousStart && taskDate < previousEnd;
          });
        }
        
        const previousCompleted = previousTasks.filter(t => t.status === 'completed' || t.status === 'done').length;
        
        if (previousCompleted > 0) {
          trend = Math.round(((completed - previousCompleted) / previousCompleted) * 100);
        } else if (completed > 0 && previousCompleted === 0) {
          // Calculate trend based on total tasks in both periods for more realistic percentages (same as facility analytics)
          let currentTotal = 0;
          if (facilityId) {
            // Get current period tasks using same logic as facility analytics
            const facilityProjects = await Project.findByFacility(facilityId);
            const activeProjects = facilityProjects.filter(p => !p.deletedAt);
            
            const allProjectTasksForTrend = await Promise.all(
              activeProjects.map(project => Task.findByProject(project.id))
            );
            const flatAllProjectTasks = allProjectTasksForTrend.flat();
            
            const allUserProjectTasks = flatAllProjectTasks.filter(task => {
              if (Array.isArray(task.assigneeIds)) {
                return task.assigneeIds.includes(userDatabaseId) || task.assigneeIds.includes(user.firebaseUid);
              }
              if (Array.isArray(task.assigneeId)) {
                return task.assigneeId.includes(userDatabaseId) || task.assigneeId.includes(user.firebaseUid);
              } else {
                return task.assigneeId === userDatabaseId || task.assigneeId === user.firebaseUid;
              }
            });
            
            if (allUserProjectTasks.length === 0 && user.email) {
              const emailMatchedTasks = flatAllProjectTasks.filter(task => 
                task.assigneeEmail === user.email || 
                (task.assigneeName && task.assigneeName.toLowerCase().includes(user.email.split('@')[0].toLowerCase()))
              );
              allUserProjectTasks.push(...emailMatchedTasks);
            }
            
            const uniqueAllTasks = allUserProjectTasks.filter((task, index, self) => 
              index === self.findIndex(t => t.id === task.id)
            );
            
            // Filter current period tasks by createdAt only (same as facility analytics)
            currentTotal = uniqueAllTasks.filter(task => {
              const taskDate = new Date(task.createdAt);
              return taskDate >= start && taskDate <= end;
            }).length;
          } else {
            // Fallback to global tasks
            let allTasks = await Task.findByAssignee(userDatabaseId);
            if (allTasks.length === 0 && user) {
              allTasks = await Task.findByAssignee(user.firebaseUid);
            }
            
            currentTotal = allTasks.filter(task => {
              const taskDate = new Date(task.createdAt);
              return taskDate >= start && taskDate <= end;
            }).length;
          }
          
          const previousTotal = previousTasks.length;
          
          if (previousTotal > 0) {
            // If there were tasks in previous period but none completed, show improvement
            trend = Math.min(100, Math.round((completed / previousTotal) * 100));
          } else if (currentTotal > 0) {
            // If no previous activity, show completion rate as trend (capped at reasonable level)
            const completionRate = (completed / currentTotal) * 100;
            trend = Math.min(50, Math.round(completionRate)); // Cap at 50% for new activity
          } else {
            // If we have completed tasks but no total tasks in current period, show positive trend
            trend = Math.min(25, completed * 5); // Small positive trend for any completions
          }
        } else if (completed === 0 && previousCompleted > 0) {
          // Show negative trend if no current completions but had previous ones
          trend = -100;
        } else if (completed > 0) {
          // If we have completed tasks but no previous data, show a small positive trend
          trend = Math.min(25, completed * 5); // Small positive trend for any completions
        } else if (totalTasks > 0) {
          // If we have tasks but no completions, show a small negative trend
          trend = -Math.min(15, totalTasks * 2); // Small negative trend for no completions
        } else {
          trend = 0;
        }
      } catch (error) {
        console.warn(`Could not calculate trend for member ${memberId}: ${error.message}`);
        trend = 0;
      }

      return {
        totalTasks,
        ongoing,
        completed,
        utilization: Math.round(utilization * 10) / 10,
        trend: trend
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

  async getMemberChartData(memberId, start, end, facilityId = null) {
    try {
      // Get the actual user to determine the correct database ID for task matching
      let user = await User.findById(memberId);
      if (!user) {
        user = await User.findByFirebaseUid(memberId);
      }
      const userDatabaseId = user ? user.id : memberId;
      
      // Use provided facilityId or get member details to find the facility
      let targetFacilityId = facilityId;
      if (!targetFacilityId) {
        const member = await this.getMemberDetails(memberId);
        targetFacilityId = member ? member.facilityId : null;
      }
      
      let filteredTasks = [];
      
      if (targetFacilityId) {
        // Get facility-specific tasks (same logic as aggregateMemberKPIs)
        const facilityProjects = await Project.findByFacility(targetFacilityId);
        const activeProjects = facilityProjects.filter(p => !p.deletedAt);
        
        const projectTasks = await Promise.all(
          activeProjects.map(project => Task.findByProject(project.id))
        );
        const flatProjectTasks = projectTasks.flat();
        
        // Filter tasks assigned to this member in this facility
        const userTasks = flatProjectTasks.filter(task => {
          // Check assigneeIds array (plural) first - use user's database ID for matching
          if (Array.isArray(task.assigneeIds)) {
            return task.assigneeIds.includes(userDatabaseId) || (user && task.assigneeIds.includes(user.firebaseUid));
          }
          // Fallback to single assigneeId for backward compatibility
          if (Array.isArray(task.assigneeId)) {
            return task.assigneeId.includes(userDatabaseId) || (user && task.assigneeId.includes(user.firebaseUid));
          } else {
            return task.assigneeId === userDatabaseId || (user && task.assigneeId === user.firebaseUid);
          }
        });
        
        // Filter by date range
        filteredTasks = userTasks.filter(task => {
          const taskDate = task.createdAt && task.createdAt.toDate ? task.createdAt.toDate() : new Date(task.createdAt);
          return taskDate >= start && taskDate <= end;
        });
      } else {
        // Fallback to global tasks (for backward compatibility)
        let allTasks = await Task.findByAssignee(userDatabaseId);
        
        // If no tasks found and user exists, try Firebase UID
        if (allTasks.length === 0 && user) {
          allTasks = await Task.findByAssignee(user.firebaseUid);
        }
      
      // Filter tasks by date range
        filteredTasks = allTasks.filter(task => {
          const taskDate = task.createdAt && task.createdAt.toDate ? task.createdAt.toDate() : new Date(task.createdAt);
        return taskDate >= start && taskDate <= end;
      });
      }
      
      // Task distribution - handle different status formats
      const done = filteredTasks.filter(t => t.status === 'completed' || t.status === 'done').length;
      const inProgress = filteredTasks.filter(t => t.status === 'in_progress' || t.status === 'in-progress').length;
      const review = filteredTasks.filter(t => t.status === 'review').length;
      const pending = filteredTasks.filter(t => t.status === 'pending' || t.status === 'todo' || t.status === 'not_started').length;
      const overdue = filteredTasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed' && t.status !== 'done'
      ).length;
      
      // Generate utilization series (daily data)
      const utilizationSeries = [];
      const currentDate = new Date(start);
      const endDate = new Date(end);
      
      while (currentDate <= endDate) {
        const dayTasks = filteredTasks.filter(task => {
          const taskDate = task.createdAt && task.createdAt.toDate ? task.createdAt.toDate() : new Date(task.createdAt);
          return taskDate.toDateString() === currentDate.toDateString();
        });
        
        const dayCompleted = dayTasks.filter(t => t.status === 'completed' || t.status === 'done').length;
        const dayOverdue = dayTasks.filter(t => 
          t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed' && t.status !== 'done'
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
          done,
          inProgress,
          review,
          pending,
          overdue
        },
        utilizationSeries
      };
    } catch (error) {
      console.error('Error getting member chart data:', error);
      return {
        taskDistribution: {
          done: 0,
          inProgress: 0,
          review: 0,
          pending: 0,
          overdue: 0
        },
        utilizationSeries: []
      };
    }
  }

  async getMemberTimeline(memberId, start, end, facilityId = null) {
    try {
      // Get the actual user to determine the correct database ID for task matching
      let user = await User.findById(memberId);
      if (!user) {
        user = await User.findByFirebaseUid(memberId);
      }
      const userDatabaseId = user ? user.id : memberId;
      
      // Use provided facilityId or get member details to find the facility
      let targetFacilityId = facilityId;
      if (!targetFacilityId) {
        const member = await this.getMemberDetails(memberId);
        targetFacilityId = member ? member.facilityId : null;
      }
      
      let filteredTasks = [];
      
      if (targetFacilityId) {
        // Get facility-specific tasks (same logic as aggregateMemberKPIs)
        const facilityProjects = await Project.findByFacility(targetFacilityId);
        const activeProjects = facilityProjects.filter(p => !p.deletedAt);
        
        const projectTasks = await Promise.all(
          activeProjects.map(project => Task.findByProject(project.id))
        );
        const flatProjectTasks = projectTasks.flat();
        
        // Filter tasks assigned to this member in this facility
        const userTasks = flatProjectTasks.filter(task => {
          // Check assigneeIds array (plural) first - use user's database ID for matching
          if (Array.isArray(task.assigneeIds)) {
            return task.assigneeIds.includes(userDatabaseId) || (user && task.assigneeIds.includes(user.firebaseUid));
          }
          // Fallback to single assigneeId for backward compatibility
          if (Array.isArray(task.assigneeId)) {
            return task.assigneeId.includes(userDatabaseId) || (user && task.assigneeId.includes(user.firebaseUid));
          } else {
            return task.assigneeId === userDatabaseId || (user && task.assigneeId === user.firebaseUid);
          }
        });
        
        // Filter by date range using same logic as aggregateMemberKPIs
        filteredTasks = userTasks.filter(task => {
          const createdDate = this.convertFirestoreTimestamp(task.createdAt);
          const updatedDate = this.convertFirestoreTimestamp(task.updatedAt);
          const isCompleted = task.status === 'completed' || task.status === 'done';

          const inDateRange = (createdDate && createdDate >= start && createdDate <= end) || 
                             (updatedDate && updatedDate >= start && updatedDate <= end);
          
          return inDateRange || (!isCompleted);
        });
      } else {
        // Fallback to global tasks (for backward compatibility)
        let allTasks = await Task.findByAssignee(userDatabaseId);
        
        // If no tasks found and user exists, try Firebase UID
        if (allTasks.length === 0 && user) {
          allTasks = await Task.findByAssignee(user.firebaseUid);
        }
        
        // Filter tasks by date range using same logic as aggregateMemberKPIs
        filteredTasks = allTasks.filter(task => {
          const createdDate = this.convertFirestoreTimestamp(task.createdAt);
          const updatedDate = this.convertFirestoreTimestamp(task.updatedAt);
          const isCompleted = task.status === 'completed' || task.status === 'done';
          
          const inDateRange = (createdDate && createdDate >= start && createdDate <= end) || 
                             (updatedDate && updatedDate >= start && updatedDate <= end);
          
          return inDateRange || (!isCompleted);
        });
      }
      
      // Get project information for each task
      const timelineItems = await Promise.all(
        filteredTasks.slice(0, 20).map(async (task) => {
          const project = task.projectId ? await Project.findById(task.projectId) : null;
          
          // Convert Firestore timestamps to proper date strings
          const startDate = this.convertFirestoreTimestamp(task.createdAt);
          const endDate = this.convertFirestoreTimestamp(task.dueDate) || startDate;
          
          const timelineItem = {
            taskId: task.id,
            name: task.name || task.title || `Task #${task.id}`,
            project: project ? project.name : 'No Project',
            start: startDate ? startDate.toISOString() : new Date().toISOString(),
            end: endDate ? endDate.toISOString() : new Date().toISOString(),
            status: task.status || 'pending'
          };
          
          
          return timelineItem;
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

  clearCache() {
    this.cache.clear();
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

module.exports = new AnalyticsAggregator();

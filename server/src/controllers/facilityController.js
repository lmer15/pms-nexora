const Facility = require('../models/Facility');
const UserFacility = require('../models/UserFacility');
const User = require('../models/User');
const FacilityInvitation = require('../models/FacilityInvitation');
const FacilityShareLink = require('../models/FacilityShareLink');
const FacilityJoinRequest = require('../models/FacilityJoinRequest');
const Project = require('../models/Project');
const Task = require('../models/Task');
const TaskComment = require('../models/TaskComment');
const TaskAttachment = require('../models/TaskAttachment');
const TaskDependency = require('../models/TaskDependency');
const TaskSubtask = require('../models/TaskSubtask');
const TaskTimeLog = require('../models/TaskTimeLog');
const TaskActivityLog = require('../models/TaskActivityLog');
const Note = require('../models/Note');
const { sendFacilityInvitationEmail, sendFacilityInvitationToExistingUser } = require('../services/emailService');
const cacheService = require('../services/cacheService');

exports.getFacilities = async (req, res) => {
  try {
    // Use the database user ID from req.user, not req.userId (which is Firebase UID)
    const userId = req.user?.id || req.userId;
    
    
    const facilities = await Facility.findByMember(userId);
    
    // Keep database user IDs for consistency with JWT tokens
    const facilitiesWithFirebaseUids = facilities;
    
    // Get statistics for each facility efficiently with caching
    const facilitiesWithStats = await Promise.all(
      facilitiesWithFirebaseUids.map(async (facility) => {
        try {
          // Check cache first
          const cachedStats = cacheService.getFacilityStats(facility.id);
          if (cachedStats) {
            return {
              ...facility,
              ...cachedStats
            };
          }

          // Get member count with limit to reduce reads
          const relationships = await UserFacility.findByFacility(facility.id);
          const memberCount = relationships.length;

          // Get project count with limit
          const projects = await Project.findByFacility(facility.id);
          const projectCount = projects.length;

          // Get task count across all projects (limit to recent projects for performance)
          let totalTaskCount = 0;
          if (projects.length > 0) {
            // Only count tasks for the first 10 projects to reduce reads
            const limitedProjectIds = projects.slice(0, 10).map(p => p.id);
            totalTaskCount = await Task.countByProjectIds(limitedProjectIds);
            
            // If there are more than 10 projects, estimate the total
            if (projects.length > 10) {
              const avgTasksPerProject = totalTaskCount / limitedProjectIds.length;
              totalTaskCount = Math.round(avgTasksPerProject * projects.length);
            }
          }

          const stats = {
            status: facility.status || 'active',
            memberCount,
            projectCount,
            taskCount: totalTaskCount
          };

          // Cache the stats
          cacheService.setFacilityStats(facility.id, stats);

          return {
            ...facility,
            ...stats
          };
        } catch (statsError) {
          console.error(`Error fetching stats for facility ${facility.id}:`, statsError);
          return {
            ...facility,
            status: facility.status || 'active',
            memberCount: 0,
            projectCount: 0,
            taskCount: 0
          };
        }
      })
    );

    res.json(facilitiesWithStats);
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({ message: 'Server error fetching facilities' });
  }
};

exports.getFacilityById = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    
    // Check if user is owner or member using UserFacility relationships
    const userId = req.user?.id || req.userId;
    let userRelationship = await UserFacility.findByUserAndFacility(userId, req.params.id);
    let isOwner = facility.ownerId === userId;
    let isMember = userRelationship && userRelationship.length > 0;
    
    // If no relationship found with database user ID, try with Firebase UID
    if (!isMember && req.user?.firebaseUid) {
      userRelationship = await UserFacility.findByUserAndFacility(req.user.firebaseUid, req.params.id);
      isMember = userRelationship && userRelationship.length > 0;
      
      // Also check if owner is Firebase UID
      if (!isOwner) {
        isOwner = facility.ownerId === req.user.firebaseUid;
      }
    }
    
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Access denied to this facility' });
    }
    
    res.json(facility);
  } catch (error) {
    console.error('Error fetching facility:', error);
    res.status(500).json({ message: 'Server error fetching facility' });
  }
};

// Get facility with all data (optimized for cost reduction)
exports.getFacilityWithData = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeTasks = 'true' } = req.query;
    
    // Get facility
    const facility = await Facility.findById(id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    
    // Check authorization
    const userId = req.user?.id || req.userId;
    let userRelationship = await UserFacility.findByUserAndFacility(userId, id);
    let isOwner = facility.ownerId === userId;
    let isMember = userRelationship && userRelationship.length > 0;
    
    // If no relationship found with database user ID, try with Firebase UID
    if (!isMember && req.user?.firebaseUid) {
      userRelationship = await UserFacility.findByUserAndFacility(req.user.firebaseUid, id);
      isMember = userRelationship && userRelationship.length > 0;
      
      // Also check if owner is Firebase UID
      if (!isOwner) {
        isOwner = facility.ownerId === req.user.firebaseUid;
      }
    }
    
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Access denied to this facility' });
    }
    
    // Get projects
    const projects = await Project.findByFacility(id);
    
    let tasksData = {};
    if (includeTasks === 'true' && projects.length > 0) {
      // Batch load all tasks for all projects
      const projectIds = projects.map(p => p.id);
      const Task = require('../models/Task');
      tasksData = await Task.findByProjects(projectIds);
      
      // Get all unique assignee IDs for batch lookup
      const allTasks = Object.values(tasksData).flat();
      
      // Handle both assigneeId (singular) and assigneeIds (plural) field names
      const assigneeIds = [...new Set(
        allTasks.flatMap(task => {
          if (task.assigneeIds && Array.isArray(task.assigneeIds)) {
            return task.assigneeIds; // Handle assigneeIds (plural, array)
          } else if (task.assigneeId) {
            return [task.assigneeId]; // Handle assigneeId (singular, string)
          }
          return [];
        }).filter(Boolean)
      )];
      
      
      // Batch fetch user profiles to populate assignee names
      if (assigneeIds.length > 0) {
        const User = require('../models/User');
        const userProfiles = await User.getProfilesByIds(assigneeIds);
        
        // Add assignee names to all tasks
        Object.keys(tasksData).forEach(projectId => {
          tasksData[projectId] = tasksData[projectId].map(task => {
            const taskData = { ...task };
            
            // Handle both assigneeId (singular) and assigneeIds (plural) field names
            if (task.assigneeIds && Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0) {
              // Handle assigneeIds (plural, array) - send all assignees
              taskData.assignees = task.assigneeIds.map(assigneeId => ({
                id: assigneeId,
                name: userProfiles[assigneeId]?.displayName || 
                      userProfiles[assigneeId]?.email || 
                      'Unknown User',
                profilePicture: userProfiles[assigneeId]?.profilePicture
              }));
              
              // Keep backward compatibility - use first assignee for primary fields
              const primaryAssigneeId = task.assigneeIds[0];
              taskData.assignee = primaryAssigneeId;
              taskData.assigneeId = primaryAssigneeId;
              taskData.assigneeName = userProfiles[primaryAssigneeId]?.displayName || 
                                     userProfiles[primaryAssigneeId]?.email || 
                                     'Unknown User';
              taskData.assigneeProfilePicture = userProfiles[primaryAssigneeId]?.profilePicture;
              
            } else if (task.assigneeId) {
              // Handle assigneeId (singular, string)
              taskData.assignees = [{
                id: task.assigneeId,
                name: userProfiles[task.assigneeId]?.displayName || 
                      userProfiles[task.assigneeId]?.email || 
                      'Unknown User',
                profilePicture: userProfiles[task.assigneeId]?.profilePicture
              }];
              
              taskData.assignee = task.assigneeId;
              taskData.assigneeName = userProfiles[task.assigneeId]?.displayName || 
                                     userProfiles[task.assigneeId]?.email || 
                                     'Unknown User';
              taskData.assigneeProfilePicture = userProfiles[task.assigneeId]?.profilePicture;
              
            }
            
            // Convert timestamps to ISO strings
            if (task.createdAt && typeof task.createdAt.toDate === 'function') {
              taskData.createdAt = task.createdAt.toDate().toISOString();
            } else if (task.createdAt instanceof Date) {
              taskData.createdAt = task.createdAt.toISOString();
            }
            
            if (task.updatedAt && typeof task.updatedAt.toDate === 'function') {
              taskData.updatedAt = task.updatedAt.toDate().toISOString();
            } else if (task.updatedAt instanceof Date) {
              taskData.updatedAt = task.updatedAt.toISOString();
            }
            
            return taskData;
          });
        });
      }
    }
    
    // Format response
    const response = {
      facility,
      projects: projects.map(project => ({
        ...project,
        tasks: tasksData[project.id] || []
      }))
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching facility with data:', error);
    res.status(500).json({ message: 'Server error fetching facility data' });
  }
};

exports.createFacility = async (req, res) => {
  try {
    const cacheService = require('../services/cacheService');
    const User = require('../models/User');
    
    // Use database user ID as ownerId for consistency with JWT tokens
    const ownerId = req.user?.id || req.userId;
    console.log('createFacility: Using database user ID as ownerId:', ownerId);
    const facilityData = { ...req.body };
    delete facilityData.ownerId; // Remove ownerId from body, use authenticated user
    delete facilityData.location; // Remove location from facility data
    const facility = await Facility.createFacility(facilityData, ownerId);

    // Add owner to UserFacility collection for proper authorization
    try {
      console.log(`Adding owner ${ownerId} (database user ID) to facility ${facility.id} with role 'owner'`);
      const ownerRelationship = await UserFacility.addUserToFacility(ownerId, facility.id, 'owner');
      console.log('Owner relationship created:', ownerRelationship);
    } catch (userFacilityError) {
      console.error('Error adding owner to UserFacility:', userFacilityError);
      
      // If the error is "already a member", that's actually OK - the owner is already in the system
      if (userFacilityError.message.includes('already a member')) {
        console.log('Owner is already a member, continuing...');
      } else {
        throw new Error('Failed to set up facility ownership: ' + userFacilityError.message);
      }
    }

    // Invalidate cache for this user's facilities
    cacheService.invalidateFacilityStats(facility.id);
    cacheService.invalidateUserFacilities(ownerId);

    res.status(201).json(facility);
  } catch (error) {
    console.error('Error creating facility:', error);
    res.status(500).json({ message: 'Server error creating facility' });
  }
};

exports.updateFacility = async (req, res) => {
  try {
    console.log('Updating facility:', req.params.id, 'with data:', req.body);
    const updatedFacility = await Facility.update(req.params.id, req.body);
    if (!updatedFacility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    
    // Invalidate cache for this facility
    cacheService.invalidateFacilityStats(req.params.id);
    
    console.log('Successfully updated facility:', updatedFacility);
    res.json(updatedFacility);
  } catch (error) {
    console.error('Error updating facility:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error updating facility',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.deleteFacility = async (req, res) => {
  try {
    const facilityId = req.params.id;
    // Check if facility exists and user is the owner
    const facility = await Facility.findById(facilityId);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    
    if (facility.ownerId !== req.userId) {
      return res.status(403).json({ message: 'Only the facility owner can delete the facility' });
    }

    // Get all projects in this facility
    const projects = await Project.findByFacility(facilityId);

    // Delete all tasks and their related data for each project
    const taskDeletePromises = projects.map(async (project) => {
      try {
        const tasks = await Task.findByProject(project.id);
        
        return Promise.all(tasks.map(async (task) => {
          try {
            // Delete all task-related data
            const taskDeletePromises = [
              // Delete task comments
              TaskComment.findByTask(task.id).then(comments => {
                if (comments && comments.length > 0) {
                  return Promise.all(comments.map(comment => TaskComment.delete(comment.id)));
                }
                return [];
              }).catch(error => {
                console.error(`Error deleting comments for task ${task.id}:`, error);
                throw error;
              }),
          
              // Delete task attachments
              TaskAttachment.findByTask(task.id).then(attachments => {
                if (attachments && attachments.length > 0) {
                  return Promise.all(attachments.map(attachment => TaskAttachment.delete(attachment.id)));
                }
                return [];
              }).catch(error => {
                console.error(`Error deleting attachments for task ${task.id}:`, error);
                throw error;
              }),
          
              // Delete task dependencies
              TaskDependency.findByTask(task.id).then(dependencies => {
                if (dependencies && dependencies.length > 0) {
                  return Promise.all(dependencies.map(dependency => TaskDependency.delete(dependency.id)));
                }
                return [];
              }).catch(error => {
                console.error(`Error deleting dependencies for task ${task.id}:`, error);
                throw error;
              }),
              
              // Delete task subtasks
              TaskSubtask.findByTask(task.id).then(subtasks => {
                if (subtasks && subtasks.length > 0) {
                  return Promise.all(subtasks.map(subtask => TaskSubtask.delete(subtask.id)));
                }
                return [];
              }).catch(error => {
                console.error(`Error deleting subtasks for task ${task.id}:`, error);
                throw error;
              }),
              
              // Delete task time logs
              TaskTimeLog.findByTask(task.id).then(timeLogs => {
                if (timeLogs && timeLogs.length > 0) {
                  return Promise.all(timeLogs.map(timeLog => TaskTimeLog.delete(timeLog.id)));
                }
                return [];
              }).catch(error => {
                console.error(`Error deleting time logs for task ${task.id}:`, error);
                throw error;
              }),
              
              // Delete task activity logs
              TaskActivityLog.findByTask(task.id).then(activityLogs => {
                if (activityLogs && activityLogs.length > 0) {
                  return Promise.all(activityLogs.map(activityLog => TaskActivityLog.delete(activityLog.id)));
                }
                return [];
              }).catch(error => {
                console.error(`Error deleting activity logs for task ${task.id}:`, error);
                throw error;
              })
        ];

            // Wait for all task-related data to be deleted
            await Promise.all(taskDeletePromises);
            
            // Delete the task itself
            return Task.delete(task.id);
          } catch (taskError) {
            console.error(`Error deleting task ${task.id}:`, taskError);
            throw taskError;
          }
        }));
      } catch (projectError) {
        console.error(`Error processing project ${project.id}:`, projectError);
        throw projectError;
      }
    });

    // Wait for all tasks to be deleted
    await Promise.all(taskDeletePromises);

    // Delete all projects in the facility
    const projectDeletePromises = projects.map(async (project) => {
      try {
        return await Project.delete(project.id);
      } catch (error) {
        console.error(`Error deleting project ${project.id}:`, error);
        throw error;
      }
    });
    await Promise.all(projectDeletePromises);

    // Delete all facility-related data
    const facilityDeletePromises = [
      // Delete user-facility relationships
      UserFacility.findByFacility(facilityId).then(relationships => {
        if (relationships && relationships.length > 0) {
          return Promise.all(relationships.map(relationship => UserFacility.delete(relationship.id)));
        }
        return [];
      }).catch(error => {
        console.error(`Error deleting user-facility relationships for facility ${facilityId}:`, error);
        throw error;
      }),
      
      // Delete facility invitations
      FacilityInvitation.findByFacility(facilityId).then(invitations => {
        if (invitations && invitations.length > 0) {
          return Promise.all(invitations.map(invitation => FacilityInvitation.delete(invitation.id)));
        }
        return [];
      }).catch(error => {
        console.error(`Error deleting facility invitations for facility ${facilityId}:`, error);
        throw error;
      }),
      
      // Delete facility share links
      FacilityShareLink.findByFacility(facilityId).then(shareLinks => {
        if (shareLinks && shareLinks.length > 0) {
          return Promise.all(shareLinks.map(shareLink => FacilityShareLink.delete(shareLink.id)));
        }
        return [];
      }).catch(error => {
        console.error(`Error deleting facility share links for facility ${facilityId}:`, error);
        throw error;
      }),
      
      // Delete facility join requests
      FacilityJoinRequest.findByFacility(facilityId).then(joinRequests => {
        if (joinRequests && joinRequests.length > 0) {
          return Promise.all(joinRequests.map(joinRequest => FacilityJoinRequest.delete(joinRequest.id)));
        }
        return [];
      }).catch(error => {
        console.error(`Error deleting facility join requests for facility ${facilityId}:`, error);
        throw error;
      }),
      
      // Delete facility notes
      Note.findByFacility(facilityId).then(notes => {
        if (notes && notes.length > 0) {
          return Promise.all(notes.map(note => Note.delete(note.id)));
        }
        return [];
      }).catch(error => {
        console.error(`Error deleting facility notes for facility ${facilityId}:`, error);
        throw error;
      })
    ];

    // Wait for all facility-related data to be deleted
    await Promise.all(facilityDeletePromises);

    // Get all user-facility relationships before deleting them for cache invalidation
    const userRelationships = await UserFacility.findByFacility(facilityId);
    const affectedUserIds = userRelationships.map(rel => rel.userId);

    // Finally delete the facility itself
    try {
      const deleted = await Facility.delete(facilityId);
      if (!deleted) {
        return res.status(404).json({ message: 'Facility not found' });
      }

      
      // Invalidate cache for all affected users and the facility
      affectedUserIds.forEach(userId => {
        cacheService.invalidateUserFacilities(userId);
      });
      cacheService.invalidateFacility(facilityId);
      
      res.json({ message: 'Facility and all related data deleted successfully' });
    } catch (facilityDeleteError) {
      console.error(`Error deleting facility ${facilityId}:`, facilityDeleteError);
      throw facilityDeleteError;
    }
  } catch (error) {
    console.error('Error deleting facility:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error deleting facility',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ============ FACILITY SHARING FUNCTIONALITY ============

// Search users by email for invitations
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.json({ users: [] });
    }

    // Search for users by email (case-insensitive partial match)
    const users = await User.query([
      { field: 'email', operator: '>=', value: query.toLowerCase() },
      { field: 'email', operator: '<', value: query.toLowerCase() + '\uf8ff' }
    ]);

    // Format user data for frontend
    const formattedUsers = users.slice(0, 10).map(user => ({
      id: user.id,
      email: user.email,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
      firstName: user.firstName,
      lastName: user.lastName,
      avatarColor: generateAvatarColor(user.email)
    }));

    res.json({ users: formattedUsers });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Server error searching users' });
  }
};

// Send invitation by email
exports.sendInvitation = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { email, role = 'member' } = req.body;
    const inviterUserId = req.userId;


    // Validate input
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'Invalid email address format' });
    }

    // Get facility details
    const facility = await Facility.findById(facilityId);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    // Get inviter details - try different approaches
    let inviterUser;
    try {
      inviterUser = await User.findByFirebaseUid(inviterUserId);
      if (!inviterUser) {
        // Try finding by ID directly
        inviterUser = await User.findById(inviterUserId);
      }
    } catch (userError) {
      console.error('Error finding inviter user:', userError);
    }

    // If we still can't find the user, use a default name
    const inviterName = inviterUser 
      ? (`${inviterUser.firstName || ''} ${inviterUser.lastName || ''}`.trim() || inviterUser.email)
      : 'Facility Admin';

    // Check if user is trying to invite themselves
    if (inviterUser && inviterUser.email.toLowerCase() === email.toLowerCase().trim()) {
      return res.status(400).json({ message: 'You cannot invite yourself' });
    }

    // Check if user is already a member
    const inviteeUser = await User.findByEmail(email.toLowerCase().trim());
    if (inviteeUser) {
      const existingMembership = await UserFacility.findByUserAndFacility(inviteeUser.firebaseUid, facilityId);
      if (existingMembership && existingMembership.length > 0) {
        return res.status(400).json({ message: 'User is already a member of this facility' });
      }
    }

    // Create invitation
    const invitation = await FacilityInvitation.createInvitation(facilityId, inviterUserId, email, role);

    // Send email notification
    try {
      if (inviteeUser) {
        // User exists in system - send personalized email
        await sendFacilityInvitationToExistingUser(inviteeUser, invitation, facility, inviterName);
      } else {
        // New user - send general invitation email
        await sendFacilityInvitationEmail(email.toLowerCase().trim(), invitation, facility, inviterName);
      }
      
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the invitation creation if email fails
      // The invitation is still created in the database
    }

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.inviteeEmail,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    if (error.message.includes('already sent')) {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error sending invitation' });
  }
};

// Get facility members with user details
exports.getFacilityMembers = async (req, res) => {
  try {
    const { facilityId } = req.params;

    // Get all user-facility relationships
    const relationships = await UserFacility.findByFacility(facilityId);
    
    // Get facility owner info
    const facility = await Facility.findById(facilityId);
    
    // Ensure facility owner is included in the members list with proper role
    const ownerInRelationships = relationships.some(rel => rel.userId === facility.ownerId);
    
    if (!ownerInRelationships && facility.ownerId) {
      relationships.push({
        id: `owner-${facility.ownerId}`, // Unique ID for owner
        userId: facility.ownerId,
        facilityId: facilityId,
        role: 'owner',
        joinedAt: facility.createdAt || new Date().toISOString(),
        createdAt: facility.createdAt || new Date().toISOString(),
        updatedAt: facility.updatedAt || new Date().toISOString()
      });
    } else if (ownerInRelationships) {
      // If owner is in relationships, ensure their role is 'owner'
      const ownerRelation = relationships.find(rel => rel.userId === facility.ownerId);
      if (ownerRelation && ownerRelation.role !== 'owner') {
        ownerRelation.role = 'owner';
      }
    }
    
    // Fetch user details for each member
    const membersWithDetails = await Promise.all(
      relationships.map(async (relation) => {
        try {
          
          // Try multiple approaches to find the user
          let user = await User.findById(relation.userId);
          
          if (!user) {
            // Try finding by Firebase UID as fallback
            user = await User.findByFirebaseUid(relation.userId);
          }
          
          // Use database user ID for consistency with JWT tokens
          let userDatabaseId = relation.userId;
          if (user && user.id && relation.userId !== user.id) {
            userDatabaseId = user.id;
          }
          
          if (!user) {
            // Return basic info with the user ID as fallback
            return {
              id: userDatabaseId,
              relationshipId: relation.id,
              name: `User ${userDatabaseId.substring(0, 8)}...`,
              email: `user-${userDatabaseId.substring(0, 8)}@unknown.com`,
              username: `user-${userDatabaseId.substring(0, 8)}`,
              role: relation.role,
              joinedAt: relation.joinedAt,
              profilePicture: null,
              avatarColor: generateAvatarColor(userDatabaseId),
              isOwner: userDatabaseId === facility.ownerId
            };
          }

          // Build full name from available fields
          let fullName = '';
          if (user.firstName && user.lastName) {
            fullName = `${user.firstName} ${user.lastName}`.trim();
          } else if (user.firstName) {
            fullName = user.firstName;
          } else if (user.lastName) {
            fullName = user.lastName;
          } else if (user.displayName) {
            fullName = user.displayName;
          } else if (user.email) {
            fullName = user.email.split('@')[0];
          } else {
            fullName = `User ${relation.userId.substring(0, 8)}`;
          }


          return {
            id: userDatabaseId,
            relationshipId: relation.id,
            name: fullName,
            email: user.email || `user-${userDatabaseId.substring(0, 8)}@unknown.com`,
            username: user.email ? user.email.split('@')[0] : `user-${userDatabaseId.substring(0, 8)}`,
            role: relation.role,
            joinedAt: relation.joinedAt,
            profilePicture: user.profilePicture || null,
            avatarColor: generateAvatarColor(user.email || userDatabaseId),
            isOwner: userDatabaseId === facility.ownerId
          };
        } catch (userError) {
          console.error(`Error fetching user details for ${relation.userId}:`, userError);
          return {
            id: userDatabaseId,
            relationshipId: relation.id,
            name: `User ${userDatabaseId.substring(0, 8)}...`,
            email: `user-${userDatabaseId.substring(0, 8)}@error.com`,
            username: `user-${userDatabaseId.substring(0, 8)}`,
            role: relation.role,
            joinedAt: relation.joinedAt,
            profilePicture: null,
            avatarColor: generateAvatarColor(userDatabaseId),
            isOwner: userDatabaseId === facility.ownerId
          };
        }
      })
    );


    res.json({
      members: membersWithDetails,
      totalCount: membersWithDetails.length
    });
  } catch (error) {
    console.error('Error fetching facility members:', error);
    res.status(500).json({ message: 'Server error fetching facility members' });
  }
};

// Get current user's role in facility (efficient endpoint)
exports.getUserRole = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const userId = req.user?.id || req.userId;

    // Get facility info
    const facility = await Facility.findById(facilityId);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    // Check if user is the facility owner (try both database user ID and Firebase UID)
    let isOwner = facility.ownerId === userId;
    if (!isOwner && req.user?.firebaseUid) {
      isOwner = facility.ownerId === req.user.firebaseUid;
    }

    if (isOwner) {
      return res.json({
        role: 'owner',
        isOwner: true
      });
    }

    // Check user's role in the facility
    let relationships = await UserFacility.findByUserAndFacility(userId, facilityId);
    
    // If no relationship found with database user ID, try with Firebase UID
    if ((!relationships || relationships.length === 0) && req.user?.firebaseUid) {
      relationships = await UserFacility.findByUserAndFacility(req.user.firebaseUid, facilityId);
    }
    
    if (relationships && relationships.length > 0) {
      return res.json({
        role: relationships[0].role,
        isOwner: false
      });
    }

    // User is not a member - give them guest access
    return res.json({
      role: 'guest',
      isOwner: false
    });

  } catch (error) {
    console.error('Error fetching user role:', error);
    res.status(500).json({ message: 'Server error fetching user role' });
  }
};

// Get facility statistics (member count, project count, etc.)
exports.getFacilityStats = async (req, res) => {
  try {
    const { facilityId } = req.params;

    // Get member count
    const relationships = await UserFacility.findByFacility(facilityId);
    const memberCount = relationships.length;

    // Get project count
    const projects = await Project.findByFacility(facilityId);
    const projectCount = projects.length;

    // Get task statistics across all projects
    let totalTaskCount = 0;
    let completedTaskCount = 0;
    let openTaskCount = 0;
    let overdueTaskCount = 0;
    let nearestDueDate = null;

    for (const project of projects) {
      const tasks = await Task.findByProject(project.id);
      totalTaskCount += tasks.length;

      tasks.forEach(task => {
        // Count completed tasks
        if (task.status === 'completed' || task.status === 'done') {
          completedTaskCount++;
        } else {
          openTaskCount++;
        }

        // Check for overdue tasks
        if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed' && task.status !== 'done') {
          overdueTaskCount++;
        }

        // Find nearest due date
        if (task.dueDate && (task.status !== 'completed' && task.status !== 'done')) {
          const dueDate = new Date(task.dueDate);
          if (!nearestDueDate || dueDate < nearestDueDate) {
            nearestDueDate = dueDate;
          }
        }
      });
    }

    // Calculate completion percentage
    const completionPercentage = totalTaskCount > 0 ? Math.round((completedTaskCount / totalTaskCount) * 100) : 0;

    res.json({
      memberCount,
      projectCount,
      taskCount: totalTaskCount,
      completedTaskCount,
      openTaskCount,
      overdueTaskCount,
      completionPercentage,
      nearestDueDate: nearestDueDate ? nearestDueDate.toISOString() : null
    });
  } catch (error) {
    console.error('Error fetching facility stats:', error);
    res.status(500).json({ message: 'Server error fetching facility statistics' });
  }
};

// Get facility tags
exports.getFacilityTags = async (req, res) => {
  try {
    const { facilityId } = req.params;
    
    // Find all projects in the facility
    const projects = await Project.findByFacility(facilityId);
    
    // Get all unique tags from tasks in these projects
    const allTags = new Set();
    
    for (const project of projects) {
      const tasks = await Task.findByProject(project.id);
      tasks.forEach(task => {
        if (task.tags && Array.isArray(task.tags)) {
          task.tags.forEach(tag => allTags.add(tag));
        }
      });
    }
    
    // Convert Set to Array and sort
    const uniqueTags = Array.from(allTags).sort();
    
    res.json(uniqueTags);
  } catch (error) {
    console.error('Error fetching facility tags:', error);
    res.status(500).json({ message: 'Server error fetching facility tags' });
  }
};

// Update member role
exports.updateMemberRole = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { targetUserId, newRole } = req.body;

    // Update the user-facility relationship
    await UserFacility.updateUserRole(req.targetUserRelation.id, newRole);

    // Invalidate cache for the user and facility
    cacheService.invalidateUserFacilities(targetUserId);
    cacheService.invalidateFacilityStats(facilityId);
    cacheService.invalidateFacilityMembers(facilityId);

    res.json({
      message: 'Member role updated successfully',
      userId: targetUserId,
      newRole: newRole
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ message: 'Server error updating member role' });
  }
};

// Remove member from facility
exports.removeMember = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { targetUserId } = req.body;
    const currentUserId = req.userId;

    // Prevent self-removal (use leave facility endpoint instead)
    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: 'Use leave facility endpoint to remove yourself' });
    }

    // Get target user's relationship
    let actualTargetUserId = targetUserId;
    let targetRelation = await UserFacility.findByUserAndFacility(actualTargetUserId, facilityId);
    
    // If not found, try to find by Firebase UID by looking up the user first
    if (!targetRelation || targetRelation.length === 0) {
      const User = require('../models/User');
      const user = await User.findByFirebaseUid(targetUserId);
      if (user && user.id) {
        actualTargetUserId = user.id;
        targetRelation = await UserFacility.findByUserAndFacility(actualTargetUserId, facilityId);
      }
    }
    
    if (!targetRelation || targetRelation.length === 0) {
      return res.status(404).json({ message: 'User is not a member of this facility' });
    }

    // Remove the user from facility
    await UserFacility.removeUserFromFacility(actualTargetUserId, facilityId);

    // Invalidate cache for the removed member and facility
    cacheService.invalidateUserFacilities(actualTargetUserId);
    cacheService.invalidateFacilityStats(facilityId);
    cacheService.invalidateFacilityMembers(facilityId);

    res.json({
      message: 'Member removed successfully',
      userId: actualTargetUserId
    });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ message: 'Server error removing member' });
  }
};

// Generate shareable link
exports.generateShareLink = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { role = 'member', expirationDays = null } = req.body;
    const creatorUserId = req.userId;

    // Check if active link already exists
    const existingLink = await FacilityShareLink.findActiveLinkByFacility(facilityId);
    if (existingLink) {
      const shareUrl = FacilityShareLink.generateShareUrl(existingLink.linkId);
      return res.json({
        message: 'Active share link already exists',
        shareLink: {
          id: existingLink.id,
          linkId: existingLink.linkId,
          url: shareUrl,
          role: existingLink.role,
          expiresAt: existingLink.expiresAt,
          usageCount: existingLink.usageCount
        }
      });
    }

    // Create new share link
    const shareLink = await FacilityShareLink.createShareLink(facilityId, creatorUserId, role, expirationDays);
    const shareUrl = FacilityShareLink.generateShareUrl(shareLink.linkId);

    res.status(201).json({
      message: 'Share link generated successfully',
      shareLink: {
        id: shareLink.id,
        linkId: shareLink.linkId,
        url: shareUrl,
        role: shareLink.role,
        expiresAt: shareLink.expiresAt,
        usageCount: shareLink.usageCount
      }
    });
  } catch (error) {
    console.error('Error generating share link:', error);
    res.status(500).json({ message: 'Server error generating share link' });
  }
};

// Get active share link
exports.getShareLink = async (req, res) => {
  try {
    const { facilityId } = req.params;

    const shareLink = await FacilityShareLink.findActiveLinkByFacility(facilityId);
    
    if (!shareLink) {
      return res.status(404).json({ message: 'No active share link found' });
    }

    const shareUrl = FacilityShareLink.generateShareUrl(shareLink.linkId);

    res.json({
      shareLink: {
        id: shareLink.id,
        linkId: shareLink.linkId,
        url: shareUrl,
        role: shareLink.role,
        expiresAt: shareLink.expiresAt,
        usageCount: shareLink.usageCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching share link' });
  }
};

// Update share link role
exports.updateShareLinkRole = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { role } = req.body;
    const updatedBy = req.userId;

    const shareLink = await FacilityShareLink.findActiveLinkByFacility(facilityId);
    if (!shareLink) {
      return res.status(404).json({ message: 'No active share link found' });
    }

    await FacilityShareLink.updateShareLinkRole(shareLink.id, role, updatedBy);

    res.json({
      message: 'Share link role updated successfully',
      role: role
    });
  } catch (error) {
    console.error('Error updating share link role:', error);
    res.status(500).json({ message: 'Server error updating share link role' });
  }
};

// Deactivate share link
exports.deactivateShareLink = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const deactivatedBy = req.userId;

    const shareLink = await FacilityShareLink.findActiveLinkByFacility(facilityId);
    if (!shareLink) {
      return res.status(404).json({ message: 'No active share link found' });
    }

    await FacilityShareLink.deactivateShareLink(shareLink.id, deactivatedBy);

    res.json({
      message: 'Share link deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating share link:', error);
    res.status(500).json({ message: 'Server error deactivating share link' });
  }
};

// Join facility via share link (for direct invitations only)
exports.joinViaShareLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const joiningUserId = req.userId;

    // Find share link
    const shareLink = await FacilityShareLink.findByLinkId(linkId);
    if (!shareLink) {
      return res.status(404).json({ message: 'Invalid or expired share link' });
    }

    // Use database user ID directly
    const userDatabaseId = joiningUserId;

    // Check if user is already a member (using database user ID)
    const existingMembership = await UserFacility.findByUserAndFacility(userDatabaseId, shareLink.facilityId);
    if (existingMembership && existingMembership.length > 0) {
      return res.status(400).json({ message: 'You are already a member of this facility' });
    }

    // Use the share link (this will validate expiration and usage limits)
    await FacilityShareLink.useShareLink(shareLink.id);

    // Add user to facility using database user ID
    await UserFacility.addUserToFacility(userDatabaseId, shareLink.facilityId, shareLink.role);

    // Invalidate cache for the new member so they can see the facility immediately
    cacheService.invalidateUserFacilities(userDatabaseId);
    cacheService.invalidateFacilityStats(shareLink.facilityId);
    cacheService.invalidateFacilityMembers(shareLink.facilityId);

    // Get facility details
    const facility = await Facility.findById(shareLink.facilityId);

    res.json({
      message: 'Successfully joined facility',
      facility: {
        id: facility.id,
        name: facility.name,
        description: facility.description
      },
      role: shareLink.role
    });
  } catch (error) {
    console.error('Error joining via share link:', error);
    if (error.message.includes('expired') || error.message.includes('limit')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error joining facility' });
  }
};

// Request to join facility via share link (creates join request)
exports.requestToJoinViaShareLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { message = '' } = req.body;
    const requestingUserId = req.userId;

    // Find share link
    const shareLink = await FacilityShareLink.findByLinkId(linkId);
    if (!shareLink) {
      return res.status(404).json({ message: 'Invalid or expired share link' });
    }

    // Check if user is already a member
    const existingMembership = await UserFacility.findByUserAndFacility(requestingUserId, shareLink.facilityId);
    if (existingMembership && existingMembership.length > 0) {
      return res.status(400).json({ message: 'You are already a member of this facility' });
    }

    // Check if user already has a pending join request
    const existingRequest = await FacilityJoinRequest.findPendingRequest(shareLink.facilityId, requestingUserId);
    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending join request for this facility' });
    }

    // Create join request
    const joinRequest = await FacilityJoinRequest.createJoinRequest(
      shareLink.facilityId,
      requestingUserId,
      message,
      shareLink.linkId
    );

    // Use the share link to track usage
    await FacilityShareLink.useShareLink(shareLink.id);

    res.status(201).json({
      message: 'Join request submitted successfully',
      joinRequest: {
        id: joinRequest.id,
        facilityId: shareLink.facilityId,
        status: joinRequest.status,
        createdAt: joinRequest.createdAt
      }
    });
  } catch (error) {
    console.error('Error requesting to join via share link:', error);
    if (error.message.includes('expired') || error.message.includes('limit')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('already')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error submitting join request' });
  }
};

// Get join requests for facility
exports.getJoinRequests = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { status = 'pending' } = req.query;

    const joinRequests = await FacilityJoinRequest.findByFacility(facilityId, status);


    // Fetch user details for each request
    const requestsWithDetails = await Promise.all(
      joinRequests.map(async (request) => {
        try {
          
          // Try multiple approaches to find the user
          let user = await User.findByFirebaseUid(request.requestingUserId);
          
          if (!user) {
            // Try finding by document ID as fallback
            user = await User.findById(request.requestingUserId);
          }
          
          if (!user) {
            console.warn(`User not found for join request: ${request.requestingUserId}`);
            return {
              id: request.id,
              user: {
                id: request.requestingUserId,
                name: `User ${request.requestingUserId.substring(0, 8)}...`,
                email: `user-${request.requestingUserId.substring(0, 8)}@unknown.com`,
                username: `user-${request.requestingUserId.substring(0, 8)}`,
                avatarColor: generateAvatarColor(request.requestingUserId)
              },
              message: request.message,
              status: request.status,
              createdAt: request.createdAt,
              updatedAt: request.updatedAt
            };
          }

          // Build full name from available fields
          let fullName = '';
          if (user.firstName && user.lastName) {
            fullName = `${user.firstName} ${user.lastName}`.trim();
          } else if (user.firstName) {
            fullName = user.firstName;
          } else if (user.lastName) {
            fullName = user.lastName;
          } else if (user.displayName) {
            fullName = user.displayName;
          } else if (user.email) {
            fullName = user.email.split('@')[0];
          } else {
            fullName = `User ${request.requestingUserId.substring(0, 8)}`;
          }


          return {
            id: request.id,
            user: {
              id: request.requestingUserId,
              name: fullName,
              email: user.email || `user-${request.requestingUserId.substring(0, 8)}@unknown.com`,
              username: user.email ? user.email.split('@')[0] : `user-${request.requestingUserId.substring(0, 8)}`,
              avatarColor: generateAvatarColor(user.email || request.requestingUserId),
              profilePicture: user.profilePicture || null
            },
            message: request.message,
            status: request.status,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt
          };
        } catch (userError) {
          console.error(`Error fetching user details for join request ${request.requestingUserId}:`, userError);
          return {
            id: request.id,
            user: {
              id: request.requestingUserId,
              name: `User ${request.requestingUserId.substring(0, 8)}...`,
              email: `user-${request.requestingUserId.substring(0, 8)}@error.com`,
              username: `user-${request.requestingUserId.substring(0, 8)}`,
              avatarColor: generateAvatarColor(request.requestingUserId)
            },
            message: request.message,
            status: request.status,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt
          };
        }
      })
    );


    res.json({
      joinRequests: requestsWithDetails,
      totalCount: requestsWithDetails.length
    });
  } catch (error) {
    console.error('Error fetching join requests:', error);
    res.status(500).json({ message: 'Server error fetching join requests' });
  }
};

// Approve join request
exports.approveJoinRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { assignedRole = 'member' } = req.body;
    const approvedBy = req.userId;

    // Approve the request
    const request = await FacilityJoinRequest.approveJoinRequest(requestId, approvedBy, assignedRole);

    // Use database user ID directly
    const userDatabaseId = request.requestingUserId;

    // Add user to facility using database user ID
    await UserFacility.addUserToFacility(userDatabaseId, request.facilityId, assignedRole);

    // Invalidate cache for the new member so they can see the facility immediately
    cacheService.invalidateUserFacilities(userDatabaseId);
    cacheService.invalidateFacilityStats(request.facilityId);
    cacheService.invalidateFacilityMembers(request.facilityId);

    res.json({
      message: 'Join request approved successfully',
      requestId: requestId,
      assignedRole: assignedRole
    });
  } catch (error) {
    if (error.message.includes('already a member')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error approving join request' });
  }
};

// Reject join request
exports.rejectJoinRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason } = req.body;
    const rejectedBy = req.userId;

    await FacilityJoinRequest.rejectJoinRequest(requestId, rejectedBy, rejectionReason);

    res.json({
      message: 'Join request rejected successfully',
      requestId: requestId
    });
  } catch (error) {
    console.error('Error rejecting join request:', error);
    res.status(500).json({ message: 'Server error rejecting join request' });
  }
};

// Leave facility (for members to remove themselves)
exports.leaveFacility = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const leavingUserId = req.userId;

    // Check if user is the facility owner
    const facility = await Facility.findById(facilityId);
    if (facility && facility.ownerId === leavingUserId) {
      return res.status(400).json({ 
        message: 'Facility owners cannot leave. Transfer ownership or delete the facility instead.' 
      });
    }

    // Remove user from facility
    await UserFacility.removeUserFromFacility(leavingUserId, facilityId);

    // Invalidate cache for the leaving member and facility
    cacheService.invalidateUserFacilities(leavingUserId);
    cacheService.invalidateFacilityStats(facilityId);
    cacheService.invalidateFacilityMembers(facilityId);

    res.json({
      message: 'Successfully left facility'
    });
  } catch (error) {
    console.error('Error leaving facility:', error);
    if (error.message.includes('not a member')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error leaving facility' });
  }
};

// Get invitation details by token (public endpoint)
exports.getInvitationDetails = async (req, res) => {
  try {
    const { token } = req.params;

    // Find invitation by token
    const invitation = await FacilityInvitation.findByToken(token);
    if (!invitation) {
      return res.status(404).json({ message: 'Invalid invitation link' });
    }

    // Check invitation status and expiration
    const now = new Date();
    const expirationDate = new Date(invitation.expiresAt);
    let statusMessage = null;


    if (invitation.status === 'expired' || now > expirationDate) {
      // Mark as expired if not already
      if (invitation.status === 'pending') {
        await FacilityInvitation.update(invitation.id, { 
          status: 'expired', 
          updatedAt: new Date().toISOString() 
        });
        invitation.status = 'expired';
      }
      statusMessage = `This invitation expired on ${expirationDate.toLocaleDateString()}`;
    } else if (invitation.status === 'accepted') {
      statusMessage = 'This invitation has already been accepted';
    } else if (invitation.status === 'rejected') {
      statusMessage = 'This invitation has been declined';
    } else if (invitation.status === 'cancelled') {
      statusMessage = 'This invitation has been cancelled';
    }

    // Get facility details
    const facility = await Facility.findById(invitation.facilityId);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    // Get inviter details
    let inviterUser;
    try {
      inviterUser = await User.findByFirebaseUid(invitation.inviterUserId);
      if (!inviterUser) {
        inviterUser = await User.findById(invitation.inviterUserId);
      }
    } catch (userError) {
      console.error('Error finding inviter user:', userError);
    }

    const inviterName = inviterUser 
      ? (`${inviterUser.firstName || ''} ${inviterUser.lastName || ''}`.trim() || inviterUser.email)
      : 'Facility Admin';

    res.json({
      invitation: {
        id: invitation.id,
        facilityId: invitation.facilityId,
        facilityName: facility.name,
        facilityDescription: facility.description,
        inviterName: inviterName,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        status: invitation.status,
        statusMessage: statusMessage
      }
    });
  } catch (error) {
    console.error('Error fetching invitation details:', error);
    res.status(500).json({ message: 'Server error fetching invitation details' });
  }
};

// Accept invitation
exports.acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const acceptingUserId = req.userId;

    // Accept the invitation
    const invitation = await FacilityInvitation.acceptInvitation(token, acceptingUserId);

    // Use database user ID directly
    const userDatabaseId = acceptingUserId;

    // Add user to facility using database user ID
    await UserFacility.addUserToFacility(userDatabaseId, invitation.facilityId, invitation.role);

    // Invalidate cache for the new member so they can see the facility immediately
    cacheService.invalidateUserFacilities(userDatabaseId);
    cacheService.invalidateFacilityStats(invitation.facilityId);
    cacheService.invalidateFacilityMembers(invitation.facilityId);

    // Get facility details for response
    const facility = await Facility.findById(invitation.facilityId);

    res.json({
      message: 'Invitation accepted successfully',
      facility: {
        id: facility.id,
        name: facility.name,
        description: facility.description
      },
      role: invitation.role
    });
  } catch (error) {
    if (error.message.includes('expired') || error.message.includes('valid')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('already a member')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error accepting invitation' });
  }
};

// Reject invitation (public endpoint)
exports.rejectInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    // Find invitation by token first
    const invitation = await FacilityInvitation.findByToken(token);
    if (!invitation) {
      return res.status(404).json({ message: 'Invalid or expired invitation' });
    }

    // Reject the invitation
    await FacilityInvitation.rejectInvitation(invitation.id);

    res.json({
      message: 'Invitation rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting invitation:', error);
    if (error.message.includes('valid')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error rejecting invitation' });
  }
};

// Helper function to generate avatar color based on email
function generateAvatarColor(email) {
  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
    '#EC4899', '#F43F5E'
  ];
  
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

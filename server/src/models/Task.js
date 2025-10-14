const FirestoreService = require('../services/firestoreService');

class Task extends FirestoreService {
  constructor() {
    super('tasks');
  }

  // Find tasks by project with caching (excludes soft-deleted tasks)
  async findByProject(projectId) {
    try {
      const cacheService = require('../services/cacheService');
      
      // Check cache first
      const cachedTasks = cacheService.getProjectTasks(projectId);
      if (cachedTasks) {
        return cachedTasks;
      }

      const tasks = await this.findByField('projectId', projectId);
      
      // Filter out soft-deleted tasks
      const activeTasks = tasks.filter(task => !task.deletedAt);
      
      // Cache the results
      cacheService.setProjectTasks(projectId, activeTasks);
      
      return activeTasks;
    } catch (error) {
      console.error('Error finding tasks by project:', error);
      return [];
    }
  }

  // Batch load tasks for multiple projects (cost optimization)
  async findByProjects(projectIds) {
    try {
      if (!projectIds || projectIds.length === 0) return [];
      
      const cacheService = require('../services/cacheService');
      const results = {};
      const uncachedProjectIds = [];
      
      // Check cache for each project
      for (const projectId of projectIds) {
        const cachedTasks = cacheService.getProjectTasks(projectId);
        if (cachedTasks) {
          results[projectId] = cachedTasks;
        } else {
          uncachedProjectIds.push(projectId);
        }
      }
      
      // Load uncached projects in batches
      if (uncachedProjectIds.length > 0) {
        const batchSize = 10; // Firestore 'in' queries are limited to 10 items
        
        for (let i = 0; i < uncachedProjectIds.length; i += batchSize) {
          const batch = uncachedProjectIds.slice(i, i + batchSize);
          
          try {
            const snapshot = await this.collection.where('projectId', 'in', batch).get();
            
            // Group tasks by projectId
            const batchResults = {};
            batch.forEach(projectId => {
              batchResults[projectId] = [];
            });
            
            snapshot.forEach(doc => {
              const taskData = { id: doc.id, ...doc.data() };
              const projectId = taskData.projectId;
              if (batchResults[projectId]) {
                batchResults[projectId].push(taskData);
              }
            });
            
            // Cache and add to results
            Object.keys(batchResults).forEach(projectId => {
              const tasks = batchResults[projectId];
              cacheService.setProjectTasks(projectId, tasks);
              results[projectId] = tasks;
            });
          } catch (batchError) {
            console.error(`Error fetching tasks for batch ${batch.join(', ')}:`, batchError);
            // Fallback to individual queries
            for (const projectId of batch) {
              try {
                const tasks = await this.findByField('projectId', projectId);
                cacheService.setProjectTasks(projectId, tasks);
                results[projectId] = tasks;
              } catch (individualError) {
                console.error(`Error fetching tasks for project ${projectId}:`, individualError);
                results[projectId] = [];
              }
            }
          }
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error finding tasks by projects:', error);
      return {};
    }
  }

  // Find tasks by assignee
  async findByAssignee(userId) {
    try {
      const tasks = await this.findByField('assigneeId', userId);
      // Filter out soft-deleted tasks
      return tasks.filter(task => !task.deletedAt);
    } catch (error) {
      console.error('Error finding tasks by assignee:', error);
      return [];
    }
  }

  // Find tasks by status
  async findByStatus(status) {
    try {
      return await this.findByField('status', status);
    } catch (error) {
      console.error('Error finding tasks by status:', error);
      return [];
    }
  }

  // Find tasks by priority
  async findByPriority(priority) {
    try {
      return await this.findByField('priority', priority);
    } catch (error) {
      console.error('Error finding tasks by priority:', error);
      return [];
    }
  }

  // Find tasks by user (alias for findByAssignee for backward compatibility)
  async findByUser(userId) {
    return this.findByAssignee(userId);
  }

  // Update task status
  async updateStatus(taskId, status) {
    const validStatuses = ['todo', 'in-progress', 'review', 'completed'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    return this.update(taskId, { status });
  }

  // Update task priority
  async updatePriority(taskId, priority) {
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      throw new Error('Invalid priority');
    }

    return this.update(taskId, { priority });
  }

  // Assign task to user
  async assignTask(taskId, userId) {
    return this.update(taskId, { assigneeId: userId });
  }

  // Create task with project
  async createTask(taskData, projectId, creatorId) {
    const data = {
      ...taskData,
      projectId,
      creatorId,
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      startDate: taskData.startDate || null,
      estimatedDuration: taskData.estimatedDuration || null,
      actualCompletionDate: taskData.actualCompletionDate || null,
      progress: taskData.progress || 0,
      tags: taskData.tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return this.create(data);
  }

  // Get tasks with project info
  async getTasksWithProject(userId = null) {
    // This would require a more complex query or joining
    // For now, return all tasks
    const tasks = await this.findAll();

    // In a real implementation, you might want to fetch project details
    // and filter by user permissions
    return tasks;
  }

  // Query tasks with filters and pagination
  async query(filters = [], options = {}) {
    const { limit = 50, offset = 0, orderBy = [] } = options;
    
    let query = this.collection;
    
    // Apply filters
    filters.forEach(filter => {
      query = query.where(filter.field, filter.operator, filter.value);
    });
    
    // Apply ordering
    orderBy.forEach(order => {
      query = query.orderBy(order.field, order.direction || 'asc');
    });
    
    // Apply pagination
    if (offset > 0) {
      query = query.offset(offset);
    }
    if (limit > 0) {
      query = query.limit(limit);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Find tasks with due dates in a specific range (for deadline reminders)
  async findTasksByDueDateRange(startDate, endDate) {
    try {
      const filters = [
        { field: 'dueDate', operator: '>=', value: startDate.toISOString() },
        { field: 'dueDate', operator: '<=', value: endDate.toISOString() }
      ];
      
      const tasks = await this.query(filters);
      
      // Filter out soft-deleted tasks and tasks without assignees
      return tasks.filter(task => 
        !task.deletedAt && 
        task.assigneeIds && 
        task.assigneeIds.length > 0
      );
    } catch (error) {
      console.error('Error finding tasks by due date range:', error);
      return [];
    }
  }

  // Count tasks by multiple project IDs efficiently (excludes soft-deleted tasks)
  async countByProjectIds(projectIds) {
    if (!projectIds || projectIds.length === 0) return 0;
    
    try {
      // Firestore 'in' queries are limited to 10 items
      const chunks = [];
      for (let i = 0; i < projectIds.length; i += 10) {
        chunks.push(projectIds.slice(i, i + 10));
      }
      
      const promises = chunks.map(chunk => 
        this.collection.where('projectId', 'in', chunk).get()
      );
      
      const snapshots = await Promise.all(promises);
      
      let totalCount = 0;
      snapshots.forEach(snapshot => {
        // Filter out soft-deleted tasks
        snapshot.docs.forEach(doc => {
          const task = doc.data();
          if (!task.deletedAt) {
            totalCount++;
          }
        });
      });
      
      return totalCount;
    } catch (error) {
      console.error('Error counting tasks by project IDs:', error);
      return 0;
    }
  }
}

module.exports = new Task();

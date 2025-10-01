// Simple in-memory cache service to reduce Firestore reads
class CacheService {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL
  }

  // Generate cache key
  generateKey(prefix, ...params) {
    return `${prefix}:${params.join(':')}`;
  }

  // Get cached value
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  // Set cached value
  set(key, value, ttl = this.defaultTTL) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl
    });
  }

  // Delete cached value
  delete(key) {
    this.cache.delete(key);
  }

  // Clear all cache
  clear() {
    this.cache.clear();
  }

  // Cache facility stats
  getFacilityStats(facilityId) {
    return this.get(this.generateKey('facility_stats', facilityId));
  }

  setFacilityStats(facilityId, stats, ttl = 60 * 60 * 1000) { // EMERGENCY: Extended to 1 hour to reduce reads
    this.set(this.generateKey('facility_stats', facilityId), stats, ttl);
  }

  // Cache project tasks count
  getProjectTasksCount(projectId) {
    return this.get(this.generateKey('project_tasks_count', projectId));
  }

  setProjectTasksCount(projectId, count, ttl = 1 * 60 * 1000) { // 1 minute for task counts
    this.set(this.generateKey('project_tasks_count', projectId), count, ttl);
  }

  // Cache user profiles
  getUserProfiles(userIds) {
    const key = this.generateKey('user_profiles', userIds.sort().join(','));
    return this.get(key);
  }

  setUserProfiles(userIds, profiles, ttl = 2 * 60 * 60 * 1000) { // EMERGENCY: Extended to 2 hours to reduce reads
    const key = this.generateKey('user_profiles', userIds.sort().join(','));
    this.set(key, profiles, ttl);
  }

  // Cache facilities for user
  getUserFacilities(userId) {
    return this.get(this.generateKey('user_facilities', userId));
  }

  setUserFacilities(userId, facilities, ttl = 10 * 60 * 1000) { // 10 minutes
    this.set(this.generateKey('user_facilities', userId), facilities, ttl);
  }

  // Cache projects for facility
  getFacilityProjects(facilityId) {
    return this.get(this.generateKey('facility_projects', facilityId));
  }

  setFacilityProjects(facilityId, projects, ttl = 5 * 60 * 1000) { // 5 minutes
    this.set(this.generateKey('facility_projects', facilityId), projects, ttl);
  }

  // Cache tasks for project
  getProjectTasks(projectId) {
    return this.get(this.generateKey('project_tasks', projectId));
  }

  setProjectTasks(projectId, tasks, ttl = 2 * 60 * 1000) { // 2 minutes
    this.set(this.generateKey('project_tasks', projectId), tasks, ttl);
  }

  // Cache facility members
  getFacilityMembers(facilityId) {
    return this.get(this.generateKey('facility_members', facilityId));
  }

  setFacilityMembers(facilityId, members, ttl = 15 * 60 * 1000) { // 15 minutes
    this.set(this.generateKey('facility_members', facilityId), members, ttl);
  }

  // Invalidate cache when data changes
  invalidateFacilityStats(facilityId) {
    this.delete(this.generateKey('facility_stats', facilityId));
  }

  invalidateProjectTasksCount(projectId) {
    this.delete(this.generateKey('project_tasks_count', projectId));
  }

  invalidateUserProfiles(userIds) {
    const key = this.generateKey('user_profiles', userIds.sort().join(','));
    this.delete(key);
  }

  invalidateUserFacilities(userId) {
    this.delete(this.generateKey('user_facilities', userId));
  }

  invalidateFacilityProjects(facilityId) {
    this.delete(this.generateKey('facility_projects', facilityId));
  }

  invalidateProjectTasks(projectId) {
    this.delete(this.generateKey('project_tasks', projectId));
  }

  invalidateFacilityMembers(facilityId) {
    this.delete(this.generateKey('facility_members', facilityId));
  }

  // Invalidate all caches related to a facility
  invalidateFacility(facilityId) {
    this.invalidateFacilityStats(facilityId);
    this.invalidateFacilityProjects(facilityId);
    this.invalidateFacilityMembers(facilityId);
  }

  // Invalidate all caches related to a project
  invalidateProject(projectId) {
    this.invalidateProjectTasks(projectId);
    this.invalidateProjectTasksCount(projectId);
  }
}

module.exports = new CacheService();
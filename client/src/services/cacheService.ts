// Client-side cache service to reduce API calls and Firestore reads
interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL

  // Generate cache key
  private generateKey(prefix: string, ...params: (string | number)[]): string {
    return `${prefix}:${params.join(':')}`;
  }

  // Get cached value
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value as T;
  }

  // Set cached value
  set<T>(key: string, value: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl
    });
  }

  // Delete cached value
  delete(key: string): void {
    this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Cache facility data
  getFacility(facilityId: string) {
    return this.get(this.generateKey('facility', facilityId));
  }

  setFacility(facilityId: string, facility: any, ttl: number = 10 * 60 * 1000) { // 10 minutes
    this.set(this.generateKey('facility', facilityId), facility, ttl);
  }

  // Cache facility stats
  getFacilityStats(facilityId: string) {
    return this.get(this.generateKey('facility_stats', facilityId));
  }

  setFacilityStats(facilityId: string, stats: any, ttl: number = 60 * 60 * 1000) { // EMERGENCY: Extended to 1 hour to reduce reads
    this.set(this.generateKey('facility_stats', facilityId), stats, ttl);
  }

  // Cache project data
  getProjects(facilityId: string) {
    return this.get(this.generateKey('projects', facilityId));
  }

  setProjects(facilityId: string, projects: any[], ttl: number = 5 * 60 * 1000) { // 5 minutes
    this.set(this.generateKey('projects', facilityId), projects, ttl);
  }

  // Cache tasks for a project
  getProjectTasks(projectId: string, options?: any) {
    const key = this.generateKey('project_tasks', projectId, JSON.stringify(options || {}));
    return this.get(key);
  }

  setProjectTasks(projectId: string, tasks: any[], options?: any, ttl: number = 30 * 60 * 1000) { // EMERGENCY: Extended to 30 minutes to reduce reads
    const key = this.generateKey('project_tasks', projectId, JSON.stringify(options || {}));
    this.set(key, tasks, ttl);
  }

  // Cache user profiles
  getUserProfiles(userIds: string[]) {
    const key = this.generateKey('user_profiles', userIds.sort().join(','));
    return this.get(key);
  }

  setUserProfiles(userIds: string[], profiles: any, ttl: number = 2 * 60 * 60 * 1000) { // EMERGENCY: Extended to 2 hours to reduce reads
    const key = this.generateKey('user_profiles', userIds.sort().join(','));
    this.set(key, profiles, ttl);
  }

  // Invalidate cache when data changes
  invalidateFacility(facilityId: string) {
    this.delete(this.generateKey('facility', facilityId));
    this.delete(this.generateKey('facility_stats', facilityId));
    this.delete(this.generateKey('projects', facilityId));
  }

  invalidateProject(projectId: string) {
    // Clear all task caches for this project
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.includes(`project_tasks:${projectId}`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.delete(key));
  }

  invalidateTask(projectId: string) {
    this.invalidateProject(projectId);
  }

  // Get cache size for debugging
  getCacheSize(): number {
    return this.cache.size;
  }

  // Get cache keys for debugging
  getCacheKeys(): string[] {
    return Array.from(this.cache.keys());
  }
}

export const cacheService = new CacheService();
export default cacheService;

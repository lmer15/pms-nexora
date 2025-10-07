// Utility to reset rate limiting state and clear all caches
import requestManager from '../services/requestManager';
import rateLimitMonitor from './rateLimitMonitor';
import cacheService from '../services/cacheService';

export const resetRateLimitingState = () => {
  console.log('🔄 Resetting rate limiting state...');
  
  // Reset request manager
  requestManager.clear();
  requestManager.resetCircuitBreakers();
  
  // Reset rate limit monitor
  rateLimitMonitor.reset();
  
  // Clear all caches
  cacheService.clearAll();
  
  console.log('✅ Rate limiting state reset complete');
  console.log('📊 Current status:', requestManager.getStatus());
};

// Auto-reset if there are too many failed requests
export const checkAndResetIfNeeded = () => {
  const stats = rateLimitMonitor.getStats();
  const failureRate = ((stats.failedRequests / stats.totalRequests) * 100) || 0;
  
  if (stats.totalRequests > 100 && failureRate > 80) {
    console.warn('⚠️ High failure rate detected, auto-resetting rate limiting state');
    resetRateLimitingState();
  }
};

// Export for console access in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).resetRateLimiting = resetRateLimitingState;
  (window as any).requestManager = requestManager;
  (window as any).rateLimitMonitor = rateLimitMonitor;
}

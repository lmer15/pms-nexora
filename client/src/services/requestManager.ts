import { taskService } from '../api/taskService';
import rateLimitMonitor from '../utils/rateLimitMonitor';
import api from '../api/api';

interface RequestState {
  promise: Promise<any>;
  timestamp: number;
  retryCount: number;
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

class RequestManager {
  private pendingRequests = new Map<string, RequestState>();
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;
  private readonly maxConcurrentRequests = 3;
  private readonly requestTimeout = 10000; // 10 seconds
  private readonly circuitBreakerThreshold = 5;
  private readonly circuitBreakerTimeout = 30000; // 30 seconds

  // Direct API call method (bypasses taskService to avoid recursion)
  private async getSubtasksDirect(taskId: string): Promise<any[]> {
    const response = await api.get(`/tasks/${taskId}/subtasks`);
    return response.data;
  }

  // Request deduplication
  async getSubtasks(taskId: string): Promise<any[]> {
    const cacheKey = `subtasks_${taskId}`;
    
    // Check if request is already pending
    const existingRequest = this.pendingRequests.get(cacheKey);
    if (existingRequest) {
      // If request is not too old (less than 30 seconds), return the existing promise
      if (Date.now() - existingRequest.timestamp < 30000) {
        console.log(`🔄 Reusing pending request for task ${taskId}`);
        return existingRequest.promise;
      } else {
        // Remove stale request
        this.pendingRequests.delete(cacheKey);
      }
    }

    // Check circuit breaker
    if (this.isCircuitBreakerOpen(cacheKey)) {
      console.warn(`🚫 Circuit breaker open for task ${taskId}, returning empty array`);
      return [];
    }

    // Create new request using direct API call
    const requestPromise = this.executeRequest(cacheKey, () => this.getSubtasksDirect(taskId));
    
    // Store the request
    this.pendingRequests.set(cacheKey, {
      promise: requestPromise,
      timestamp: Date.now(),
      retryCount: 0
    });

    // Clean up after request completes
    requestPromise.finally(() => {
      this.pendingRequests.delete(cacheKey);
    });

    return requestPromise;
  }

  private async executeRequest(cacheKey: string, requestFn: () => Promise<any>): Promise<any> {
    const startTime = Date.now();
    
    try {
      const result = await Promise.race([
        requestFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), this.requestTimeout)
        )
      ]);

      const responseTime = Date.now() - startTime;
      
      // Record successful request
      rateLimitMonitor.recordRequest(true, responseTime);
      
      // Reset circuit breaker on success
      this.resetCircuitBreaker(cacheKey);
      return result;

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      // Record failed request
      rateLimitMonitor.recordRequest(false, responseTime, error.response?.status);
      
      this.recordFailure(cacheKey);
      throw error;
    }
  }

  private isCircuitBreakerOpen(cacheKey: string): boolean {
    const breaker = this.circuitBreakers.get(cacheKey);
    if (!breaker) return false;

    if (breaker.state === 'OPEN') {
      // Check if timeout has passed
      if (Date.now() - breaker.lastFailureTime > this.circuitBreakerTimeout) {
        breaker.state = 'HALF_OPEN';
        console.log(`🔄 Circuit breaker half-open for ${cacheKey}`);
        return false;
      }
      return true;
    }

    return false;
  }

  private recordFailure(cacheKey: string): void {
    const breaker = this.circuitBreakers.get(cacheKey) || {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED' as const
    };

    breaker.failures++;
    breaker.lastFailureTime = Date.now();

    if (breaker.failures >= this.circuitBreakerThreshold) {
      breaker.state = 'OPEN';
      console.warn(`🚫 Circuit breaker opened for ${cacheKey} after ${breaker.failures} failures`);
    }

    this.circuitBreakers.set(cacheKey, breaker);
  }

  private resetCircuitBreaker(cacheKey: string): void {
    const breaker = this.circuitBreakers.get(cacheKey);
    if (breaker) {
      breaker.failures = 0;
      breaker.state = 'CLOSED';
      this.circuitBreakers.set(cacheKey, breaker);
    }
  }

  // Batch processing with controlled concurrency
  async processBatch<T>(
    items: T[],
    processor: (item: T) => Promise<any>,
    options: {
      batchSize?: number;
      delayBetweenBatches?: number;
      maxConcurrency?: number;
    } = {}
  ): Promise<any[]> {
    const {
      batchSize = 5,
      delayBetweenBatches = 1000,
      maxConcurrency = 3
    } = options;

    const results: any[] = [];
    const errors: any[] = [];

    // Process in batches
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      // Process batch with controlled concurrency
      const batchPromises = batch.map(async (item, index) => {
        try {
          // Add delay between requests in the same batch
          if (index > 0) {
            await new Promise(resolve => setTimeout(resolve, 200 * index));
          }
          
          const result = await processor(item);
          return { success: true, result, item };
        } catch (error) {
          console.warn(`❌ Failed to process item:`, error);
          return { success: false, error, item };
        }
      });

      // Wait for batch to complete
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process results
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            results.push(result.value.result);
          } else {
            errors.push(result.value.error);
          }
        } else {
          errors.push(result.reason);
        }
      });

      // Add delay between batches (except for the last batch)
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    if (errors.length > 0) {
      console.warn(`⚠️ Completed batch processing with ${errors.length} errors`);
    }

    return results;
  }

  // Batch subtask loading with direct API calls
  async getSubtasksBatch(taskIds: string[]): Promise<Record<string, any[]>> {
    const results: Record<string, any[]> = {};
    
    // Process in batches with controlled concurrency
    const batchResults = await this.processBatch(
      taskIds,
      async (taskId: string) => {
        try {
          const subtasks = await this.getSubtasksDirect(taskId);
          return { taskId, subtasks };
        } catch (error) {
          console.warn(`Failed to load subtasks for task ${taskId}:`, error);
          return { taskId, subtasks: [] };
        }
      },
      {
        batchSize: 3, // Reduced batch size to be more conservative
        delayBetweenBatches: 2000, // Increased delay between batches
        maxConcurrency: 2 // Reduced max concurrency
      }
    );

    // Convert results to the expected format
    batchResults.forEach(({ taskId, subtasks }) => {
      results[taskId] = subtasks;
    });

    return results;
  }

  // Clear all pending requests and reset circuit breakers
  clear(): void {
    this.pendingRequests.clear();
    this.circuitBreakers.clear();
    this.requestQueue = [];
    this.isProcessingQueue = false;
  }

  // Reset all circuit breakers to closed state
  resetCircuitBreakers(): void {
    this.circuitBreakers.clear();
    console.log('🔄 All circuit breakers reset');
  }

  // Get current status
  getStatus(): {
    pendingRequests: number;
    openCircuitBreakers: number;
    queueLength: number;
  } {
    const openCircuitBreakers = Array.from(this.circuitBreakers.values())
      .filter(breaker => breaker.state === 'OPEN').length;

    return {
      pendingRequests: this.pendingRequests.size,
      openCircuitBreakers,
      queueLength: this.requestQueue.length
    };
  }
}

// Export singleton instance
export const requestManager = new RequestManager();
export default requestManager;

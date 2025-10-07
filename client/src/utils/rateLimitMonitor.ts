// Rate limiting monitoring and debugging utility

interface RateLimitStats {
  totalRequests: number;
  successfulRequests: number;
  rateLimitedRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastResetTime: number;
}

class RateLimitMonitor {
  private stats: RateLimitStats = {
    totalRequests: 0,
    successfulRequests: 0,
    rateLimitedRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    lastResetTime: Date.now()
  };

  private responseTimes: number[] = [];
  private readonly maxResponseTimeSamples = 100;

  recordRequest(success: boolean, responseTime: number, statusCode?: number): void {
    this.stats.totalRequests++;
    this.stats.averageResponseTime = responseTime;

    if (success) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
      
      if (statusCode === 429) {
        this.stats.rateLimitedRequests++;
      }
    }

    // Track response times for average calculation
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > this.maxResponseTimeSamples) {
      this.responseTimes.shift();
    }

    // Update average response time
    this.stats.averageResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
  }

  getStats(): RateLimitStats {
    return { ...this.stats };
  }

  getSuccessRate(): number {
    if (this.stats.totalRequests === 0) return 0;
    return (this.stats.successfulRequests / this.stats.totalRequests) * 100;
  }

  getRateLimitRate(): number {
    if (this.stats.totalRequests === 0) return 0;
    return (this.stats.rateLimitedRequests / this.stats.totalRequests) * 100;
  }

  reset(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      rateLimitedRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastResetTime: Date.now()
    };
    this.responseTimes = [];
  }

  logStats(): void {
    const successRate = this.getSuccessRate();
    const rateLimitRate = this.getRateLimitRate();
    
    console.group('📊 Rate Limit Monitor Stats');
    console.log(`Total Requests: ${this.stats.totalRequests}`);
    console.log(`Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`Rate Limited: ${this.stats.rateLimitedRequests} (${rateLimitRate.toFixed(1)}%)`);
    console.log(`Failed Requests: ${this.stats.failedRequests}`);
    console.log(`Average Response Time: ${this.stats.averageResponseTime.toFixed(0)}ms`);
    console.log(`Last Reset: ${new Date(this.stats.lastResetTime).toLocaleTimeString()}`);
    console.groupEnd();
  }

  // Auto-log stats every 30 seconds if there's activity
  private autoLogInterval?: NodeJS.Timeout;

  startAutoLogging(): void {
    if (this.autoLogInterval) return;
    
    this.autoLogInterval = setInterval(() => {
      if (this.stats.totalRequests > 0) {
        this.logStats();
      }
    }, 30000);
  }

  stopAutoLogging(): void {
    if (this.autoLogInterval) {
      clearInterval(this.autoLogInterval);
      this.autoLogInterval = undefined;
    }
  }
}

// Export singleton instance
export const rateLimitMonitor = new RateLimitMonitor();

// Auto-start monitoring in development
if (process.env.NODE_ENV === 'development') {
  rateLimitMonitor.startAutoLogging();
}

export default rateLimitMonitor;

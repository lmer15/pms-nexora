import React, { useState, useEffect } from 'react';
import rateLimitMonitor from '../utils/rateLimitMonitor';
import requestManager from '../services/requestManager';

interface RateLimitStatusProps {
  className?: string;
}

const RateLimitStatus: React.FC<RateLimitStatusProps> = ({ className = '' }) => {
  const [stats, setStats] = useState(rateLimitMonitor.getStats());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(rateLimitMonitor.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const successRate = rateLimitMonitor.getSuccessRate();
  const rateLimitRate = rateLimitMonitor.getRateLimitRate();

  // Only show if there are requests and we're in development
  if (process.env.NODE_ENV !== 'development' || stats.totalRequests === 0) {
    return null;
  }

  const getStatusColor = () => {
    if (rateLimitRate > 10) return 'text-red-600';
    if (rateLimitRate > 5) return 'text-yellow-600';
    if (successRate > 90) return 'text-green-600';
    return 'text-blue-600';
  };

  const getStatusIcon = () => {
    if (rateLimitRate > 10) return '🚫';
    if (rateLimitRate > 5) return '⚠️';
    if (successRate > 90) return '✅';
    return '📊';
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div 
        className="bg-white border border-gray-300 rounded-lg shadow-lg p-3 cursor-pointer hover:shadow-xl transition-shadow"
        onClick={() => setIsVisible(!isVisible)}
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getStatusIcon()}</span>
          <div className="text-sm">
            <div className={`font-medium ${getStatusColor()}`}>
              {successRate.toFixed(1)}% success
            </div>
            <div className="text-xs text-gray-500">
              {stats.totalRequests} requests
            </div>
          </div>
        </div>
        
        {isVisible && (
          <div className="mt-3 pt-3 border-t border-gray-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span>Rate Limited:</span>
              <span className={rateLimitRate > 5 ? 'text-red-600' : 'text-gray-600'}>
                {stats.rateLimitedRequests} ({rateLimitRate.toFixed(1)}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Failed:</span>
              <span className="text-gray-600">{stats.failedRequests}</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Response:</span>
              <span className="text-gray-600">{stats.averageResponseTime.toFixed(0)}ms</span>
            </div>
            <div className="space-y-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  rateLimitMonitor.reset();
                  setStats(rateLimitMonitor.getStats());
                }}
                className="w-full px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
              >
                Reset Stats
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  requestManager.resetCircuitBreakers();
                  requestManager.clear();
                }}
                className="w-full px-2 py-1 bg-red-100 hover:bg-red-200 rounded text-xs text-red-700"
              >
                Reset Circuit Breakers
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RateLimitStatus;

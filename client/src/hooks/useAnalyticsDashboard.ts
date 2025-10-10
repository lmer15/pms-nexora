import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { TimeRange, Insight } from '../types/analytics';
import { analyticsService } from '../services/analyticsService';

interface UseAnalyticsDashboardOptions {
  fetchFunction: (range: TimeRange, ...args: any[]) => Promise<any>;
  fetchArgs?: any[];
  parseInsights?: (response: any) => Insight[];
}

export const useAnalyticsDashboard = <T>(
  options: UseAnalyticsDashboardOptions
) => {
  const { token } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('4w');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const fetchData = async (range: TimeRange) => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await options.fetchFunction(range, ...(options.fetchArgs || []));
      setData(response);
      
      // Parse insights if provided
      if (options.parseInsights) {
        const parsedInsights = options.parseInsights(response);
        setInsights(parsedInsights);
      } else if (response.insights && response.insights.length > 0) {
        // Handle insights as objects or strings (backward compatibility)
        const serverInsights = response.insights.map((insight: any, index: number) => {
          // If insight is already an object with proper structure, use it directly
          if (typeof insight === 'object' && insight.message) {
            return {
              id: insight.id || `insight-${index}`,
              type: insight.type || 'info',
              severity: insight.severity || 'medium',
              message: insight.message,
              action: insight.action || ''
            };
          }
          
          // Fallback: Parse insight type and severity from message content (for backward compatibility)
          const message = typeof insight === 'string' ? insight : String(insight);
          let type: 'warning' | 'info' | 'success' | 'danger' = 'info';
          let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
          
          if (message.includes('over capacity') || message.includes('burnout') || message.includes('critical')) {
            type = 'danger';
            severity = 'critical';
          } else if (message.includes('approaching') || message.includes('high') || message.includes('overload')) {
            type = 'warning';
            severity = 'high';
          } else if (message.includes('excellent') || message.includes('smoothly') || message.includes('well')) {
            type = 'success';
            severity = 'low';
          } else if (message.includes('low') || message.includes('available') || message.includes('opportunity')) {
            type = 'info';
            severity = 'medium';
          }
          
          return {
            id: `server-insight-${index}`,
            type,
            severity,
            message,
            action: 'Review the data and take appropriate action.'
          };
        });
        setInsights(serverInsights);
      } else {
        setInsights([]);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData(timeRange);
    } else {
      setLoading(false);
    }
  }, [timeRange, token, ...(options.fetchArgs || [])]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };

  return {
    data,
    insights,
    loading,
    error,
    timeRange,
    isDarkMode,
    fetchData,
    handleTimeRangeChange
  };
};

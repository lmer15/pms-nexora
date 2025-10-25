import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useFacilityRefresh } from '../../../context/FacilityRefreshContext';
import MemberKpiStrip from './MemberKpiStrip';
import MemberCharts from './MemberCharts';
import MemberTimeline from './MemberTimeline';
import MemberInsights from './MemberInsights';
import FiltersBar from '../shared/FiltersBar';
import ExportButton from '../shared/ExportButton';
import LoadingSkeleton, { KPICardSkeleton, ChartSkeleton, TableSkeleton } from '../shared/LoadingSkeleton';
import { MemberAnalyticsResponse, TimeRange, Insight } from '../../../types/analytics';
import { analyticsService } from '../../../services/analyticsService';
import { exportService } from '../../../services/exportService';
import { InsightsEngine } from '../../../utils/insightsEngine';
import { colors } from '../../../styles/designTokens';

interface MemberDashboardProps {
  className?: string;
  memberId?: string | null;
  facilityId?: string | null;
}

const MemberDashboard: React.FC<MemberDashboardProps> = ({
  className = '',
  memberId: propMemberId,
  facilityId: propFacilityId
}) => {
  const navigate = useNavigate();
  const { memberId: paramMemberId } = useParams<{ memberId: string }>();
  const memberId = propMemberId || paramMemberId;
  const { token } = useAuth();
  const { refreshTrigger, userProfileRefreshTrigger } = useFacilityRefresh();
  const [data, setData] = useState<MemberAnalyticsResponse | null>(null);
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

    if (!memberId) {
      setError('Invalid member ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`[DEBUG] Frontend: Fetching member analytics for memberId: ${memberId}, facilityId: ${propFacilityId}, range: ${range}`);
      const response = await analyticsService.getMemberAnalytics(memberId, range, propFacilityId || undefined);
      setData(response);
      
      // Generate insights using the insights engine
      const generatedInsights = InsightsEngine.generateMemberInsights(response);
      setInsights(generatedInsights);
    } catch (err) {
      console.error('Failed to fetch member analytics:', err);
      setError('Failed to load member analytics. Please try again.');
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
  }, [timeRange, memberId, token, refreshTrigger, userProfileRefreshTrigger]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };

  const handleTaskClick = (taskId: number) => {
    const facilityId = new URLSearchParams(window.location.search).get('facilityId');
    if (facilityId) {
      navigate(`/facility/${facilityId}`);
    } else {
      console.log(`Task ${taskId} details are available in the facility page`);
    }
  };

  const handleExport = async () => {
    if (!memberId) return;
    
    try {
      await exportService.exportMemberAnalytics(memberId, timeRange);
    } catch (error) {
      console.error('Export failed:', error);
      // You might want to show a toast notification here
    }
  };

  const handleBackToFacility = () => {
    // Use the facilityId from props first (passed from Facility Dashboard)
    // Fall back to data.member.facilityId if available
    // Finally fall back to global analytics
    const targetFacilityId = propFacilityId || data?.member.facilityId;
    
    if (targetFacilityId) {
      navigate(`/resources/analytics/facility/${targetFacilityId}`);
    } else {
      navigate('/resources/analytics/global');
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <button
                onClick={handleBackToFacility}
                className={`text-sm hover:underline transition-colors ${
                  isDarkMode 
                    ? 'text-green-400 hover:text-green-300' 
                    : 'text-green-600 hover:text-green-700'
                }`}
              >
                ← Back to Facility Analytics
              </button>
            </div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Member Analytics
            </h1>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              Loading member data...
            </p>
          </div>
          <div className={`w-32 h-10 rounded animate-pulse ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <KPICardSkeleton key={i} isDarkMode={isDarkMode} />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton isDarkMode={isDarkMode} />
          <ChartSkeleton isDarkMode={isDarkMode} />
        </div>
        
        <TableSkeleton isDarkMode={isDarkMode} />
        <TableSkeleton isDarkMode={isDarkMode} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className={`mb-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
          <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Error Loading Member Analytics
          </h3>
          <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {error}
          </p>
          <div className="space-x-4">
            <button
              onClick={() => fetchData(timeRange)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleBackToFacility}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              Back to Facility
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          No member data available
        </p>
        <button
          onClick={handleBackToFacility}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Back to Facility Analytics
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <button
              onClick={handleBackToFacility}
              className={`text-sm hover:underline transition-colors ${
                isDarkMode 
                  ? 'text-green-400 hover:text-green-300' 
                  : 'text-green-600 hover:text-green-700'
              }`}
            >
              ← Back to Facility Analytics
            </button>
            <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>/</span>
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Member Analytics
            </span>
          </div>
          
          {/* Member Profile */}
          <div className="flex items-center space-x-4 mb-4">
            <div 
              className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}
            >
              {data.member.avatarUrl ? (
                <img
                  src={data.member.avatarUrl}
                  alt={data.member.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                  {(data.member.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {data.member.name || 'Unknown User'}
              </h1>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                {data.member.role} • Capacity: {data.member.capacity} hours/week • Individual performance analytics
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <FiltersBar
            timeRange={timeRange}
            onTimeRangeChange={handleTimeRangeChange}
            isDarkMode={isDarkMode}
          />
          <ExportButton onExport={handleExport} isDarkMode={isDarkMode} />
        </div>
      </div>

      {/* KPI Strip */}
      <MemberKpiStrip kpis={data.kpis} isDarkMode={isDarkMode} />

      {/* Charts */}
      <MemberCharts charts={data.charts} isDarkMode={isDarkMode} />

      {/* Timeline and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MemberTimeline
          timeline={data.timeline}
          onTaskClick={handleTaskClick}
          isDarkMode={isDarkMode}
        />
        <MemberInsights insights={insights} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

export default MemberDashboard;

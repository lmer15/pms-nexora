import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
}

const MemberDashboard: React.FC<MemberDashboardProps> = ({
  className = ''
}) => {
  const navigate = useNavigate();
  const { memberId } = useParams<{ memberId: string }>();
  const [data, setData] = useState<MemberAnalyticsResponse | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('4w');

  const fetchData = async (range: TimeRange) => {
    if (!memberId || isNaN(parseInt(memberId))) {
      setError('Invalid member ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await analyticsService.getMemberAnalytics(parseInt(memberId), range);
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
    fetchData(timeRange);
  }, [timeRange, memberId]);

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };

  const handleTaskClick = (taskId: number) => {
    // Navigate to task detail - you might need to adjust this route based on your app structure
    navigate(`/tasks/${taskId}`);
  };

  const handleExport = async () => {
    if (!memberId) return;
    
    try {
      await exportService.exportMemberAnalytics(parseInt(memberId), timeRange);
    } catch (error) {
      console.error('Export failed:', error);
      // You might want to show a toast notification here
    }
  };

  const handleBackToFacility = () => {
    if (data?.member.facilityId) {
      navigate(`/resources/analytics/facility/${data.member.facilityId}`);
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
                className="text-sm text-blue-600 hover:underline"
              >
                ← Back to Facility Analytics
              </button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Member Analytics</h1>
            <p className="text-gray-600">Loading member data...</p>
          </div>
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <KPICardSkeleton key={i} />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        
        <TableSkeleton />
        <TableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-red-600 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <h3 className="text-lg font-medium mb-2">Error Loading Member Analytics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => fetchData(timeRange)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleBackToFacility}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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
        <p className="text-gray-600">No member data available</p>
        <button
          onClick={handleBackToFacility}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
              className="text-sm text-blue-600 hover:underline transition-colors"
            >
              ← Back to Facility Analytics
            </button>
          </div>
          
          {/* Member Profile */}
          <div className="flex items-center space-x-4 mb-4">
            <div 
              className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold"
              style={{ backgroundColor: colors.border }}
            >
              {data.member.avatarUrl ? (
                <img
                  src={data.member.avatarUrl}
                  alt={data.member.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span style={{ color: colors.neutralText }}>
                  {(data.member.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{data.member.name || 'Unknown User'}</h1>
              <p className="text-gray-600">
                {data.member.role} • Capacity: {data.member.capacity} hours/week
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <FiltersBar
            timeRange={timeRange}
            onTimeRangeChange={handleTimeRangeChange}
          />
          <ExportButton onExport={handleExport} />
        </div>
      </div>

      {/* KPI Strip */}
      <MemberKpiStrip kpis={data.kpis} />

      {/* Charts */}
      <MemberCharts charts={data.charts} />

      {/* Timeline and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MemberTimeline
          timeline={data.timeline}
          onTaskClick={handleTaskClick}
        />
        <MemberInsights insights={insights} />
      </div>
    </div>
  );
};

export default MemberDashboard;

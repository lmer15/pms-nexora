import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FacilityKpiStrip from './FacilityKpiStrip';
import FacilityCharts from './FacilityCharts';
import FacilityCalendar from './FacilityCalendar';
import FacilityTeamTable from './FacilityTeamTable';
import FacilityInsights from './FacilityInsights';
import FiltersBar from '../shared/FiltersBar';
import ExportButton from '../shared/ExportButton';
import LoadingSkeleton, { KPICardSkeleton, ChartSkeleton, TableSkeleton } from '../shared/LoadingSkeleton';
import { FacilityAnalyticsResponse, TimeRange, Insight } from '../../../types/analytics';
import { analyticsService } from '../../../services/analyticsService';
import { exportService } from '../../../services/exportService';
import { InsightsEngine } from '../../../utils/insightsEngine';
import { colors } from '../../../styles/designTokens';

interface FacilityDashboardProps {
  className?: string;
}

const FacilityDashboard: React.FC<FacilityDashboardProps> = ({
  className = ''
}) => {
  const navigate = useNavigate();
  const { facilityId } = useParams<{ facilityId: string }>();
  const [data, setData] = useState<FacilityAnalyticsResponse | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('4w');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchData = async (range: TimeRange) => {
    if (!facilityId) {
      setError('Facility ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await analyticsService.getFacilityAnalytics(facilityId, range);
      setData(response);
      
      // Generate insights using the insights engine
      const generatedInsights = InsightsEngine.generateFacilityInsights(response);
      setInsights(generatedInsights);
    } catch (err) {
      console.error('Failed to fetch facility analytics:', err);
      setError('Failed to load facility analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(timeRange);
  }, [timeRange, facilityId]);

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };

  const handleMemberClick = (memberId: number) => {
    navigate(`/resources/analytics/member/${memberId}`);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    // In a real implementation, you would filter the team table by this date
    console.log('Filtering by date:', date);
  };

  const handleExport = async () => {
    if (!facilityId) return;
    
    try {
      await exportService.exportFacilityAnalytics(facilityId, timeRange);
    } catch (error) {
      console.error('Export failed:', error);
      // You might want to show a toast notification here
    }
  };

  const handleBackToGlobal = () => {
    navigate('/resources/analytics/global');
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <button
                onClick={handleBackToGlobal}
                className="text-sm text-blue-600 hover:underline"
              >
                ← Back to Global Analytics
              </button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Facility Analytics</h1>
            <p className="text-gray-600">Loading facility data...</p>
          </div>
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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
          <h3 className="text-lg font-medium mb-2">Error Loading Facility Analytics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => fetchData(timeRange)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleBackToGlobal}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Global
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-gray-600">No facility data available</p>
        <button
          onClick={handleBackToGlobal}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Global Analytics
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
              onClick={handleBackToGlobal}
              className="text-sm text-blue-600 hover:underline transition-colors"
            >
              ← Back to Global Analytics
            </button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{data.facility.name}</h1>
          <p className="text-gray-600">Facility analytics and performance overview</p>
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
      <FacilityKpiStrip kpis={data.kpis} />

      {/* Charts */}
      <FacilityCharts charts={data.charts} />

      {/* Calendar and Team Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <FacilityCalendar onDateSelect={handleDateSelect} />
        </div>
        <div className="lg:col-span-2">
          <FacilityTeamTable
            members={data.members}
            onMemberClick={handleMemberClick}
          />
        </div>
      </div>

      {/* Insights */}
      <FacilityInsights insights={insights} />
    </div>
  );
};

export default FacilityDashboard;

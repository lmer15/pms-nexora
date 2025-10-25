import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '../../../hooks/useUserRole';
import { useAnalyticsDashboard } from '../../../hooks/useAnalyticsDashboard';
import { useFacilityRefresh } from '../../../context/FacilityRefreshContext';
import GlobalKpiStrip from './GlobalKpiStrip';
import GlobalCharts from './GlobalCharts';
import GlobalFacilitiesTable from './GlobalFacilitiesTable';
import GlobalInsights from './GlobalInsights';
import FiltersBar from '../shared/FiltersBar';
import ExportButton from '../shared/ExportButton';
import LoadingSkeleton, { KPICardSkeleton, ChartSkeleton, TableSkeleton } from '../shared/LoadingSkeleton';
import { GlobalAnalyticsResponse, TimeRange } from '../../../types/analytics';
import { analyticsService } from '../../../services/analyticsService';
import { exportService } from '../../../services/exportService';

interface GlobalDashboardProps {
  className?: string;
}

const GlobalDashboard: React.FC<GlobalDashboardProps> = ({
  className = ''
}) => {
  const navigate = useNavigate();
  const { refreshTrigger, userProfileRefreshTrigger } = useFacilityRefresh();
  const {
    data,
    insights,
    loading,
    error,
    timeRange,
    isDarkMode,
    fetchData,
    handleTimeRangeChange
  } = useAnalyticsDashboard<GlobalAnalyticsResponse>({
    fetchFunction: (range: TimeRange) => analyticsService.getGlobalAnalytics(range, true),
    refreshTriggers: [refreshTrigger, userProfileRefreshTrigger]
  });


  const handleFacilityClick = (facilityId: number) => {
    navigate(`/resources/analytics/facility/${facilityId}`);
  };


  const handleExport = async () => {
    try {
      await exportService.exportGlobalAnalytics(timeRange);
    } catch (error) {
      console.error('Export failed:', error);
      // You might want to show a toast notification here
    }
  };

  const getRoleBasedDescription = () => {
    return "Comprehensive overview of all facilities, projects, and tasks across your organization";
  };

  if (loading) {
    return (
      <div className={`space-y-6 p-6 ${className}`}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Global Analytics</h1>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Resource utilization and performance overview</p>
          </div>
          <div className={`w-32 h-10 rounded animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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
      <div className={`text-center py-12 p-6 ${className}`}>
        <div className="text-red-600 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Error Loading Analytics</h3>
          <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
          <button
            onClick={() => fetchData(timeRange)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`text-center py-12 p-6 ${className}`}>
        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No data available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Global Analytics</h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {getRoleBasedDescription()}
          </p>
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
      <GlobalKpiStrip kpis={data.kpis} facilities={data.facilities} isDarkMode={isDarkMode} />

      {/* Charts */}
      <GlobalCharts
        facilities={data.facilities}
        globalTaskCounts={data.globalTaskCounts}
        isDarkMode={isDarkMode}
      />

      {/* Facilities Table */}
      <GlobalFacilitiesTable
        facilities={data.facilities}
        onFacilityClick={handleFacilityClick}
        isDarkMode={isDarkMode}
      />

      {/* Insights */}
      <GlobalInsights insights={insights} isDarkMode={isDarkMode} />
    </div>
  );
};

export default GlobalDashboard;

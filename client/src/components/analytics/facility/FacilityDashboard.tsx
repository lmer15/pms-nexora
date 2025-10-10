import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import FacilityKpiStrip from './FacilityKpiStrip';
import FacilityCharts from './FacilityCharts';
import FacilityCalendar from './FacilityCalendar';
import FacilityTeamTable from './FacilityTeamTable';
import FacilityInsights from './FacilityInsights';
import AllMembersModal from './AllMembersModal';
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
  const { token } = useAuth();
  const [data, setData] = useState<FacilityAnalyticsResponse | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('4w');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isAllMembersModalOpen, setIsAllMembersModalOpen] = useState(false);
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
      
      // Use server-generated insights with proper object structure
      if (response.insights && response.insights.length > 0) {
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
      console.error('Failed to fetch facility analytics:', err);
      setError('Failed to load facility analytics. Please try again.');
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
  }, [timeRange, facilityId, token]);

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

  const handleMemberClick = (memberId: string) => {
    navigate(`/resources/analytics/member/${memberId}?facilityId=${facilityId}`);
  };

  const handleViewAllMembers = () => {
    setIsAllMembersModalOpen(true);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    // In a real implementation, you would filter the team table by this date
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
                className={`text-sm hover:underline transition-colors ${
                  isDarkMode 
                    ? 'text-green-400 hover:text-green-300' 
                    : 'text-green-600 hover:text-green-700'
                }`}
              >
                ← Back to Global Analytics
              </button>
            </div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Facility Analytics
            </h1>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              Loading facility data...
            </p>
          </div>
          <div className={`w-32 h-10 rounded animate-pulse ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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
            Error Loading Facility Analytics
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
              onClick={handleBackToGlobal}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
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
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          No facility data available
        </p>
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
              className={`text-sm hover:underline transition-colors ${
                isDarkMode 
                  ? 'text-green-400 hover:text-green-300' 
                  : 'text-green-600 hover:text-green-700'
              }`}
            >
              ← Back to Global Analytics
            </button>
            <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>/</span>
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Facility Analytics
            </span>
          </div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {data.facility.name}
          </h1>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            Project and task level analytics for this facility
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
      <FacilityKpiStrip kpis={data.kpis} isDarkMode={isDarkMode} />

      {/* Charts */}
      <FacilityCharts charts={data.charts} isDarkMode={isDarkMode} />

      {/* Calendar and Team Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex">
          <FacilityCalendar 
            facilityId={facilityId}
            onDateSelect={handleDateSelect}
            isDarkMode={isDarkMode}
            className="flex-1"
          />
        </div>
        <div className="lg:col-span-2 flex">
          <FacilityTeamTable
            members={data.members}
            onMemberClick={handleMemberClick}
            onViewAllMembers={handleViewAllMembers}
            isDarkMode={isDarkMode}
            className="flex-1"
          />
        </div>
      </div>

      {/* Insights */}
      <FacilityInsights insights={insights} isDarkMode={isDarkMode} />

      {/* All Members Modal */}
      <AllMembersModal
        isOpen={isAllMembersModalOpen}
        onClose={() => setIsAllMembersModalOpen(false)}
        members={data.members}
        onMemberClick={handleMemberClick}
        facilityName={data.facility.name}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default FacilityDashboard;

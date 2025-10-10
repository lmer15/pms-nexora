import React, { useState, useEffect } from 'react';
import Card from '../shared/Card';
import SectionHeader from '../shared/SectionHeader';
import { colors, spacing, radius, typography, transitions } from '../../../styles/designTokens';
import { analyticsService } from '../../../services/analyticsService';

interface FacilityCalendarProps {
  facilityId?: string;
  className?: string;
  isDarkMode?: boolean;
  onDateSelect?: (date: string) => void;
}

interface CalendarDayData {
  day: number;
  date: string;
  workload: number;
  originalWorkload: number;
  density: string;
  isToday: boolean;
  taskCount?: number;
}

const FacilityCalendar: React.FC<FacilityCalendarProps> = ({
  facilityId,
  className = '',
  isDarkMode = false,
  onDateSelect
}) => {
  const [workloadData, setWorkloadData] = useState<Map<string, number>>(new Map());
  const [dailyTaskData, setDailyTaskData] = useState<{ [date: string]: any }>({});
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  // Fetch workload data for the current month
  useEffect(() => {
    if (facilityId) {
      fetchWorkloadData();
    }
  }, [facilityId]);

  const fetchWorkloadData = async () => {
    if (!facilityId) return;
    
    try {
      setLoading(true);
      // Get analytics data for the current month to calculate workload
      const response = await analyticsService.getFacilityAnalytics(facilityId, '4w');
      
      // Create a workload map from real task data
      const workloadMap = new Map<string, number>();
      
      // Use real daily task data from backend
      if (response.kpis?.dailyTaskData) {
        Object.entries(response.kpis.dailyTaskData).forEach(([dateString, dayData]) => {
          workloadMap.set(dateString, dayData.workload);
        });
        setDailyTaskData(response.kpis.dailyTaskData);
      }
      
      setWorkloadData(workloadMap);
    } catch (error) {
      console.error('Failed to fetch workload data:', error);
      // Fallback to empty data
      setWorkloadData(new Map());
    } finally {
      setLoading(false);
    }
  };

  // Generate calendar data for the current month
  const generateCalendarData = (): (null | CalendarDayData)[] => {
    const year = currentYear;
    const month = currentMonth;
    const firstDay = new Date(Date.UTC(year, month, 1));
    const lastDay = new Date(Date.UTC(year, month + 1, 0));
    const daysInMonth = lastDay.getUTCDate();
    const startingDayOfWeek = firstDay.getUTCDay();
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    const calendar: (null | CalendarDayData)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendar.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      // Create date in UTC to avoid timezone issues
      const date = new Date(Date.UTC(year, month, day));
      const dateString = date.toISOString().split('T')[0];
      
      // Get workload from real data
      const workload = workloadData.get(dateString) || 0;
      const density = workload >= 80 ? 'high' : workload >= 50 ? 'medium' : 'low';
      
      
      const isToday = dateString === todayString;
      
      // Get real task count from daily data
      const dailyData = dailyTaskData[dateString];
      const taskCount = dailyData?.totalTasks || 0;
      
      calendar.push({
        day: day, // Use the loop day since we're creating UTC dates
        date: dateString,
        workload: Math.round(workload * 10) / 10, // Rounded for display
        originalWorkload: workload, // Keep original for tooltip
        density,
        isToday,
        taskCount: taskCount // Real task count from backend
      });
    }
    
    return calendar;
  };

  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const calendarData = generateCalendarData();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDensityColor = (density: string) => {
    switch (density) {
      case 'high':
        return colors.danger;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.success;
      default:
        return colors.border;
    }
  };

  const getDensityIntensity = (density: string, workload: number) => {
    if (workload === 0) {
      return 'bg-gray-400';
    }
    switch (density) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-200';
    }
  };


  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`} isDarkMode={isDarkMode}>
        <SectionHeader
          label="WORKLOAD DENSITY"
          title={`${monthNames[today.getMonth()]} ${today.getFullYear()}`}
          isDarkMode={isDarkMode}
        />
        <div className="mt-6 flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading workload data...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`h-full flex flex-col ${className}`} padding="lg" isDarkMode={isDarkMode}>
      <SectionHeader
        label="WORKLOAD DENSITY"
        title="Task Distribution Calendar"
        isDarkMode={isDarkMode}
      />
      
      {/* Month Navigation */}
      <div className="flex items-center justify-between" style={{ marginTop: spacing.md, marginBottom: spacing.md }}>
        {/* Left Side: Month Year Only */}
        <h3 
          className="font-bold whitespace-nowrap"
          style={{ 
            color: isDarkMode ? '#E5E7EB' : colors.neutralText,
            fontSize: typography.small.fontSize,
            fontWeight: 700
          }}
        >
          {monthNames[currentMonth]} {currentYear}
        </h3>
        
        {/* Right Side: Navigation with Today Button */}
        <div className="flex items-center" style={{ gap: spacing.xs }}>
          <button
            onClick={handlePreviousMonth}
            className={`p-1 rounded transition-colors ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
            style={{ 
              borderRadius: `${radius.sm}px`,
              transition: transitions.fast
            }}
            title="Previous month"
          >
            <svg className="w-4 h-4" style={{ color: isDarkMode ? '#9CA3AF' : colors.mutedText }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={handleToday}
            className="px-2 py-1 text-xs text-white rounded hover:opacity-90 transition-colors"
            style={{ 
              backgroundColor: colors.success,
              borderRadius: `${radius.sm}px`,
              transition: transitions.fast,
              fontSize: typography.caption.fontSize
            }}
            title="Go to current month"
          >
            TODAY
          </button>
          
          <button
            onClick={handleNextMonth}
            className={`p-1 rounded transition-colors ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
            style={{ 
              borderRadius: `${radius.sm}px`,
              transition: transitions.fast
            }}
            title="Next month"
          >
            <svg className="w-4 h-4" style={{ color: isDarkMode ? '#9CA3AF' : colors.mutedText }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col">
        <div className="grid grid-cols-7" style={{ gap: spacing.xs / 2, marginBottom: spacing.sm }}>
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div 
              key={day}
              className="text-center font-medium"
              style={{ 
                color: isDarkMode ? '#9CA3AF' : colors.mutedText,
                fontSize: typography.caption.fontSize,
                fontWeight: typography.caption.fontWeight,
                paddingTop: spacing.xs / 2,
                paddingBottom: spacing.xs / 2
              }}
            >
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarData.map((dayData, index) => {
            if (!dayData) {
              return <div key={index} className="h-8" />;
            }
            
            const day = dayData as CalendarDayData;
            
            return (
              <div
                key={index}
                className="w-full font-medium flex flex-col items-center justify-center"
                style={{
                  height: spacing.lg,
                  borderRadius: `${radius.sm}px`,
                  backgroundColor: day.isToday ? colors.success + '20' : 'transparent',
                  color: day.isToday ? colors.success : (isDarkMode ? '#E5E7EB' : colors.neutralText),
                  border: day.isToday ? `1px solid ${colors.success}` : 'none',
                  transition: transitions.fast,
                  fontSize: typography.caption.fontSize,
                  fontWeight: typography.caption.fontWeight
                }}
                title={`${day.date}: ${day.originalWorkload.toFixed(1)}% workload${day.taskCount ? `, ${day.taskCount} tasks` : ''} (${day.density} density)`}
              >
                <span>{day.day}</span>
                <div 
                  className={`w-2 h-1 rounded-full ${getDensityIntensity(day.density, day.originalWorkload)}`}
                  style={{ 
                    opacity: 0.7,
                    marginTop: spacing.xs / 4,
                    borderRadius: `${radius.sm / 2}px`
                  }}
                />
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-between" style={{ marginTop: spacing.sm }}>
        <div className="flex items-center" style={{ gap: spacing.sm }}>
          <div className="flex items-center" style={{ gap: spacing.xs / 2 }}>
            <div 
              className="rounded-full opacity-70"
              style={{ 
                width: 12,
                height: 8,
                backgroundColor: colors.mutedText,
                borderRadius: `${radius.sm / 2}px`
              }} 
            />
            <span 
              style={{ 
                color: isDarkMode ? '#9CA3AF' : colors.mutedText,
                fontSize: typography.caption.fontSize,
                fontWeight: typography.caption.fontWeight
              }}
            >
              No tasks (0%)
            </span>
          </div>
          <div className="flex items-center" style={{ gap: spacing.xs / 2 }}>
            <div 
              className="rounded-full opacity-70"
              style={{ 
                width: 12,
                height: 8,
                backgroundColor: colors.status.balanced,
                borderRadius: `${radius.sm / 2}px`
              }} 
            />
            <span 
              style={{ 
                color: isDarkMode ? '#9CA3AF' : colors.mutedText,
                fontSize: typography.caption.fontSize,
                fontWeight: typography.caption.fontWeight
              }}
            >
              Low (1-49%)
            </span>
          </div>
          <div className="flex items-center" style={{ gap: spacing.xs / 2 }}>
            <div 
              className="rounded-full opacity-70"
              style={{ 
                width: 12,
                height: 8,
                backgroundColor: colors.status.caution,
                borderRadius: `${radius.sm / 2}px`
              }} 
            />
            <span 
              style={{ 
                color: isDarkMode ? '#9CA3AF' : colors.mutedText,
                fontSize: typography.caption.fontSize,
                fontWeight: typography.caption.fontWeight
              }}
            >
              Medium (50-79%)
            </span>
          </div>
          <div className="flex items-center" style={{ gap: spacing.xs / 2 }}>
            <div 
              className="rounded-full opacity-70"
              style={{ 
                width: 12,
                height: 8,
                backgroundColor: colors.status.overloaded,
                borderRadius: `${radius.sm / 2}px`
              }} 
            />
            <span 
              style={{ 
                color: isDarkMode ? '#9CA3AF' : colors.mutedText,
                fontSize: typography.caption.fontSize,
                fontWeight: typography.caption.fontWeight
              }}
            >
              High (80%+)
            </span>
          </div>
        </div>
        </div>
      </div>
    </Card>
  );
};

export default FacilityCalendar;

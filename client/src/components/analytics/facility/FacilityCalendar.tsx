import React, { useState } from 'react';
import Card from '../shared/Card';
import SectionHeader from '../shared/SectionHeader';
import { colors } from '../../../styles/designTokens';

interface FacilityCalendarProps {
  onDateSelect?: (date: string) => void;
  className?: string;
}

const FacilityCalendar: React.FC<FacilityCalendarProps> = ({
  onDateSelect,
  className = ''
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Generate calendar data for the current month
  const generateCalendarData = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendar = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendar.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      
      // Simulate workload density (in a real app, this would come from data)
      const workload = Math.random() * 100;
      const density = workload >= 80 ? 'high' : workload >= 50 ? 'medium' : 'low';
      
      calendar.push({
        day,
        date: dateString,
        workload,
        density,
        isToday: dateString === today.toISOString().split('T')[0]
      });
    }
    
    return calendar;
  };

  const calendarData = generateCalendarData();
  const today = new Date();
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

  const getDensityIntensity = (density: string) => {
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

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  return (
    <Card className={`p-6 ${className}`}>
      <SectionHeader
        label="WORKLOAD DENSITY"
        title={`${monthNames[today.getMonth()]} ${today.getFullYear()}`}
      />
      
      <div className="mt-6">
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div 
              key={day}
              className="text-center text-xs font-medium py-2"
              style={{ color: colors.mutedText }}
            >
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarData.map((dayData, index) => {
            if (!dayData) {
              return <div key={index} className="h-8" />;
            }
            
            return (
              <button
                key={index}
                onClick={() => handleDateClick(dayData.date)}
                className={`
                  h-8 w-full rounded text-xs font-medium transition-all duration-150
                  ${selectedDate === dayData.date ? 'ring-2 ring-blue-500' : ''}
                  ${dayData.isToday ? 'ring-1 ring-gray-400' : ''}
                  hover:opacity-80
                `}
                style={{
                  backgroundColor: dayData.isToday ? colors.primary + '20' : 'transparent',
                  color: dayData.isToday ? colors.primary : colors.neutralText
                }}
                title={`${dayData.date}: ${dayData.workload.toFixed(0)}% workload`}
              >
                <div className="flex flex-col items-center">
                  <span>{dayData.day}</span>
                  <div 
                    className={`w-2 h-1 rounded-full mt-1 ${getDensityIntensity(dayData.density)}`}
                    style={{ opacity: 0.7 }}
                  />
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-2 bg-green-500 rounded-full opacity-70" />
              <span style={{ color: colors.mutedText }}>Low</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-2 bg-yellow-500 rounded-full opacity-70" />
              <span style={{ color: colors.mutedText }}>Medium</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-2 bg-red-500 rounded-full opacity-70" />
              <span style={{ color: colors.mutedText }}>High</span>
            </div>
          </div>
          
          {selectedDate && (
            <div className="text-right">
              <p className="font-medium" style={{ color: colors.neutralText }}>
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-xs" style={{ color: colors.mutedText }}>
                Click to filter table by date
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default FacilityCalendar;

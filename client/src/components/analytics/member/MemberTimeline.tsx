import React from 'react';
import Card from '../shared/Card';
import SectionHeader from '../shared/SectionHeader';
import { TimelineItem } from '../../../types/analytics';
import { formatDate } from '../../../utils/dateUtils';
import { getStatusColor } from '../../../utils/formatUtils';
import { colors } from '../../../styles/designTokens';

interface MemberTimelineProps {
  timeline: TimelineItem[];
  onTaskClick?: (taskId: number) => void;
  className?: string;
}

const MemberTimeline: React.FC<MemberTimelineProps> = ({
  timeline,
  onTaskClick,
  className = ''
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'ongoing':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'pending':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      completed: { bg: '#F0FDF4', text: '#065F46', label: 'Completed' },
      ongoing: { bg: '#EFF6FF', text: '#1E40AF', label: 'Ongoing' },
      pending: { bg: '#F8FAFC', text: '#6B7280', label: 'Pending' }
    };

    const style = statusStyles[status as keyof typeof statusStyles] || statusStyles.pending;

    return (
      <span 
        className="px-2 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        {style.label}
      </span>
    );
  };

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Card className={`p-6 ${className}`}>
      <SectionHeader
        label="RECENT ACTIVITY"
        title="Task Timeline"
        action={{
          label: 'View All Tasks',
          onClick: () => {
            // Navigate to all tasks view
            console.log('Navigate to all tasks view');
          }
        }}
      />
      
      <div className="mt-6">
        {timeline.length === 0 ? (
          <div 
            className="text-center py-8"
            style={{ color: colors.mutedText }}
          >
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM8 15V9h4v6H8z" clipRule="evenodd" />
            </svg>
            <p>No recent activity found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {timeline.map((item, index) => (
              <div
                key={item.taskId}
                className="flex items-start space-x-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors duration-150"
                style={{ borderColor: colors.border }}
              >
                {/* Status Icon */}
                <div 
                  className="flex-shrink-0 p-2 rounded-full"
                  style={{ 
                    backgroundColor: getStatusColor(item.status) + '20',
                    color: getStatusColor(item.status)
                  }}
                >
                  {getStatusIcon(item.status)}
                </div>
                
                {/* Task Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => onTaskClick?.(item.taskId)}
                      className="text-sm font-medium hover:underline transition-colors duration-150"
                      style={{ color: colors.primary }}
                    >
                      Task #{item.taskId}
                    </button>
                    {getStatusBadge(item.status)}
                  </div>
                  
                  <p 
                    className="text-sm font-medium mb-1"
                    style={{ color: colors.neutralText }}
                  >
                    {item.project}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-xs" style={{ color: colors.mutedText }}>
                    <div className="flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <span>Started: {formatDate(item.start)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <span>Due: {formatDate(item.end)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span>Duration: {calculateDuration(item.start, item.end)} days</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default MemberTimeline;

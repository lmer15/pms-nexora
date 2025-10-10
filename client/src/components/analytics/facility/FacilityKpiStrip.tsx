import React, { useState, useRef, useEffect } from 'react';
import Card from '../shared/Card';
import { FacilityKPIs } from '../../../types/analytics';
import { formatNumber, formatPercentage } from '../../../utils/formatUtils';
import { colors } from '../../../styles/designTokens';

interface FacilityKpiStripProps {
  kpis: FacilityKPIs;
  className?: string;
  isDarkMode?: boolean;
}

const FacilityKpiStrip: React.FC<FacilityKpiStripProps> = ({
  kpis,
  className = '',
  isDarkMode = false
}) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (cardType: string, event: React.MouseEvent) => {
    // Clear any existing timeout (both show and hide timeouts)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Show tooltip immediately
    // Check if the event target still exists
    if (!event.currentTarget) {
      return;
    }
    
    const rect = event.currentTarget.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const tooltipHeight = 300; // Approximate tooltip height
    const tooltipWidth = 320; // Approximate tooltip width
    
    // Position tooltip above the card by default
    let top = rect.top - tooltipHeight - 20;
    
    // If tooltip would go off the top of the screen, position it below the card
    if (top < 20) {
      top = rect.bottom + 20;
    }
    
    // Ensure tooltip doesn't go off the bottom of the screen
    if (top + tooltipHeight > viewportHeight - 20) {
      top = viewportHeight - tooltipHeight - 20;
    }
    
    // Center tooltip horizontally on the card
    let left = rect.left + rect.width / 2;
    
    // Ensure tooltip doesn't go off the right side of the screen
    if (left + tooltipWidth / 2 > viewportWidth - 20) {
      left = viewportWidth - tooltipWidth / 2 - 20;
    }
    
    // Ensure tooltip doesn't go off the left side of the screen
    if (left - tooltipWidth / 2 < 20) {
      left = tooltipWidth / 2 + 20;
    }
    
    setTooltipPosition({ top, left });
    setHoveredCard(cardType);
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Hide tooltip immediately
    setHoveredCard(null);
    setShowTooltip(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const ModalTooltip = ({ cardType, children }: { cardType: string; children: React.ReactNode }) => {
    if (hoveredCard !== cardType || !showTooltip) return <>{children}</>;

    const isPendingTasks = cardType === 'pending';
    const isOverdueTasks = cardType === 'overdue';
    
    // Determine if tooltip should be positioned above or below
    const isPositionedAbove = tooltipPosition.top < window.innerHeight / 2;

    return (
      <>
        {children}
        <div
          className={`fixed z-[9999] rounded-lg shadow-xl border p-4 max-w-sm w-80 pointer-events-auto ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-600' 
              : 'bg-white border-gray-200'
          }`}
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: isPositionedAbove 
              ? 'translateX(-50%) translateY(-100%)' 
              : 'translateX(-50%)'
          }}
          onMouseLeave={handleMouseLeave}
        >
          
          {/* Header */}
          <div className="flex items-center space-x-3 mb-3">
            <div className={`p-2 rounded-lg ${
              isPendingTasks 
                ? (kpis.pendingTasks > 10 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600')
                : (kpis.overdueTasks > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600')
            }`}>
              {isPendingTasks ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM8 15V9h4v6H8z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div>
              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {isPendingTasks ? 'Pending Tasks' : 'Overdue Tasks'}
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {isPendingTasks ? kpis.pendingTasks : kpis.overdueTasks} tasks
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`mb-3 p-2 rounded-lg ${
            isPendingTasks 
              ? (kpis.pendingTasks > 10 ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200')
              : (kpis.overdueTasks > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200')
          }`}>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isPendingTasks 
                  ? (kpis.pendingTasks > 10 ? 'bg-orange-500' : 'bg-green-500')
                  : (kpis.overdueTasks > 0 ? 'bg-red-500' : 'bg-green-500')
              }`} />
              <span className={`text-sm font-medium ${
                isPendingTasks 
                  ? (kpis.pendingTasks > 10 ? 'text-orange-800' : 'text-green-800')
                  : (kpis.overdueTasks > 0 ? 'text-red-800' : 'text-green-800')
              }`}>
                {isPendingTasks 
                  ? (kpis.pendingTasks > 10 ? 'High Volume' : 'Normal Level')
                  : (kpis.overdueTasks > 0 ? 'Urgent Action Required' : 'All On Track')
                }
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3">
            <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {isPendingTasks ? 'Pending Tasks' : 'Overdue Tasks'}
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {isPendingTasks ? (
                // Display actual pending tasks
                kpis.pendingTasksList && kpis.pendingTasksList.length > 0 ? (
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <p className="mb-2 font-medium">Pending Tasks:</p>
                    <div className="space-y-1">
                      {kpis.pendingTasksList.slice(0, 5).map((task, index) => (
                        <div key={task.id} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0" />
                          <span className="truncate" title={task.name}>
                            {task.name}
                          </span>
                        </div>
                      ))}
                      {kpis.pendingTasksList.length > 5 && (
                        <div className={`text-xs pl-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          +{kpis.pendingTasksList.length - 5} more tasks
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-green-600">No pending tasks</p>
                )
              ) : (
                // Display actual overdue tasks
                kpis.overdueTasksList && kpis.overdueTasksList.length > 0 ? (
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <p className="mb-2 font-medium">Overdue Tasks:</p>
                    <div className="space-y-1">
                      {kpis.overdueTasksList.slice(0, 5).map((task, index) => (
                        <div key={task.id} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                          <span className="truncate" title={task.name}>
                            {task.name}
                          </span>
                        </div>
                      ))}
                      {kpis.overdueTasksList.length > 5 && (
                        <div className={`text-xs pl-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          +{kpis.overdueTasksList.length - 5} more tasks
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-green-600">No overdue tasks</p>
                )
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className={`absolute left-1/2 transform -translate-x-1/2 ${
            isPositionedAbove ? 'top-full' : 'bottom-full'
          }`}>
            <div className={`w-3 h-3 border-r border-b transform ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600' 
                : 'bg-white border-gray-200'
            } ${isPositionedAbove ? 'rotate-45' : '-rotate-45'}`}></div>
          </div>
        </div>
      </>
    );
  };
  const kpiItems = [
    {
      label: 'Active Members',
      value: formatNumber(kpis.activeMembers),
      color: colors.primary,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
      )
    },
    {
      label: 'Pending Tasks',
      value: formatNumber(kpis.pendingTasks),
      color: kpis.pendingTasks > 10 ? colors.warning : colors.success,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM8 15V9h4v6H8z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      label: 'Overdue Tasks',
      value: formatNumber(kpis.overdueTasks),
      color: kpis.overdueTasks > 0 ? colors.danger : colors.success,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      label: 'Avg Utilization',
      value: formatPercentage(kpis.avgUtilization),
      color: kpis.avgUtilization >= 90 ? colors.danger : 
             kpis.avgUtilization >= 70 ? colors.warning : colors.success,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    }
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
        {kpiItems.map((item, index) => {
        const isPendingTasks = item.label === 'Pending Tasks';
        const isOverdueTasks = item.label === 'Overdue Tasks';
        
        const cardContent = (
          <div
            key={index}
            onMouseEnter={isPendingTasks || isOverdueTasks ? (e) => handleMouseEnter(isPendingTasks ? 'pending' : 'overdue', e) : undefined}
            onMouseLeave={isPendingTasks || isOverdueTasks ? handleMouseLeave : undefined}
          >
            <Card className="p-6" isDarkMode={isDarkMode}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: item.color + '20' }}
                  >
                    <div style={{ color: item.color }}>
                      {item.icon}
                    </div>
                  </div>
                  <div>
                    <p 
                      className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      {item.label}
                    </p>
                    <p 
                      className="text-2xl font-bold"
                      style={{ color: item.color }}
                    >
                      {item.value}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );
        
        return (isPendingTasks || isOverdueTasks) ? (
          <ModalTooltip 
            key={index}
            cardType={isPendingTasks ? 'pending' : 'overdue'}
          >
            {cardContent}
          </ModalTooltip>
        ) : cardContent;
      })}
    </div>
  );
};

export default FacilityKpiStrip;

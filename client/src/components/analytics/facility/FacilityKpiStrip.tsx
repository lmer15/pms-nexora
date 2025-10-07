import React from 'react';
import Card from '../shared/Card';
import { FacilityKPIs } from '../../../types/analytics';
import { formatNumber, formatPercentage } from '../../../utils/formatUtils';
import { colors } from '../../../styles/designTokens';

interface FacilityKpiStripProps {
  kpis: FacilityKPIs;
  className?: string;
}

const FacilityKpiStrip: React.FC<FacilityKpiStripProps> = ({
  kpis,
  className = ''
}) => {
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
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
      {kpiItems.map((item, index) => (
        <Card key={index} className="p-6">
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
                  className="text-sm font-medium"
                  style={{ color: colors.mutedText }}
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
      ))}
    </div>
  );
};

export default FacilityKpiStrip;

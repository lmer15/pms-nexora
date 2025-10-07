import React from 'react';
import Card from '../shared/Card';
import { MemberKPIs } from '../../../types/analytics';
import { formatNumber, formatPercentage, formatDeltaPercentage } from '../../../utils/formatUtils';
import { colors } from '../../../styles/designTokens';

interface MemberKpiStripProps {
  kpis: MemberKPIs;
  className?: string;
}

const MemberKpiStrip: React.FC<MemberKpiStripProps> = ({
  kpis,
  className = ''
}) => {
  const kpiItems = [
    {
      label: 'Total Tasks',
      value: formatNumber(kpis.totalTasks),
      color: colors.primary,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM8 15V9h4v6H8z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      label: 'Ongoing',
      value: formatNumber(kpis.ongoing),
      color: colors.warning,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      label: 'Completed',
      value: formatNumber(kpis.completed),
      color: colors.success,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      label: 'Utilization',
      value: formatPercentage(kpis.utilization),
      color: kpis.utilization >= 100 ? colors.danger : 
             kpis.utilization >= 80 ? colors.warning : colors.success,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      label: 'Trend',
      value: kpis.trend > 0 ? `+${formatDeltaPercentage(kpis.trend)}` : 
             kpis.trend < 0 ? formatDeltaPercentage(kpis.trend) : '—',
      color: kpis.trend > 0 ? colors.danger : 
             kpis.trend < 0 ? colors.success : colors.mutedText,
      icon: kpis.trend > 0 ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      ) : kpis.trend < 0 ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      )
    }
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 ${className}`}>
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

export default MemberKpiStrip;

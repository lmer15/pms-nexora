import React from 'react';
import Card from '../shared/Card';
import { GlobalKPIs } from '../../../types/analytics';
import { formatNumber, formatPercentage, formatDeltaPercentage } from '../../../utils/formatUtils';
import { colors } from '../../../styles/designTokens';

interface GlobalKpiStripProps {
  kpis: GlobalKPIs;
  className?: string;
  isDarkMode?: boolean;
}

const GlobalKpiStrip: React.FC<GlobalKpiStripProps> = ({
  kpis,
  className = '',
  isDarkMode = false
}) => {
  const kpiItems = [
    {
      label: 'Active Members',
      value: formatNumber(kpis.activeMembers),
      delta: kpis.delta.activeMembers,
      color: colors.primary
    },
    {
      label: 'Total Facilities',
      value: formatNumber(kpis.totalFacilities),
      delta: kpis.delta.totalFacilities,
      color: colors.primary
    },
    {
      label: 'Avg Utilization',
      value: formatPercentage(kpis.avgUtilization),
      delta: kpis.delta.avgUtilization,
      color: kpis.avgUtilization >= 90 ? colors.danger : kpis.avgUtilization >= 70 ? colors.warning : colors.success
    },
    {
      label: 'Critical Facilities',
      value: formatNumber(kpis.criticalFacilities),
      delta: kpis.delta.criticalFacilities,
      color: kpis.criticalFacilities > 0 ? colors.danger : colors.success
    }
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {kpiItems.map((item, index) => (
        <Card key={index} className="p-6" isDarkMode={isDarkMode}>
          <div className="flex items-center justify-between">
            <div>
              <p 
                className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                {item.label}
              </p>
              <p 
                className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                {item.value}
              </p>
            </div>
            {item.delta !== undefined && item.delta !== 0 && (
              <div className="text-right">
                <span 
                  className={`text-sm font-medium ${
                    item.delta > 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {item.delta > 0 ? '+' : ''}{formatDeltaPercentage(item.delta)}
                </span>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>vs last period</p>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default GlobalKpiStrip;

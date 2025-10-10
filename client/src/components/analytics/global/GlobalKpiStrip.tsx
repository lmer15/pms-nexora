import React, { useState } from 'react';
import Card from '../shared/Card';
import { GlobalKPIs, FacilitySummary } from '../../../types/analytics';
import { formatNumber, formatPercentage, formatDeltaPercentage } from '../../../utils/formatUtils';
import { colors } from '../../../styles/designTokens';

interface GlobalKpiStripProps {
  kpis: GlobalKPIs;
  facilities?: FacilitySummary[];
  className?: string;
  isDarkMode?: boolean;
}

const GlobalKpiStrip: React.FC<GlobalKpiStripProps> = ({
  kpis,
  facilities = [],
  className = '',
  isDarkMode = false
}) => {
  const [showCriticalModal, setShowCriticalModal] = useState(false);
  
  // Get critical facilities based on utilization >= 90%
  const criticalFacilities = facilities.filter(f => f.avgUtilization >= 90);
  const kpiItems = [
    {
      label: 'Active Members',
      value: formatNumber(kpis.activeMembers),
      delta: kpis.delta.activeMembers,
      color: colors.primary,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      gradient: isDarkMode 
        ? 'from-blue-600 to-blue-500' 
        : 'from-blue-500 to-blue-400',
      bgGradient: isDarkMode
        ? 'from-blue-900/20 to-blue-800/20'
        : 'from-blue-50 to-blue-100/50'
    },
    {
      label: 'Total Facilities',
      value: formatNumber(kpis.totalFacilities),
      delta: kpis.delta.totalFacilities,
      color: colors.primary,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      gradient: isDarkMode 
        ? 'from-purple-600 to-purple-500' 
        : 'from-purple-500 to-purple-400',
      bgGradient: isDarkMode
        ? 'from-purple-900/20 to-purple-800/20'
        : 'from-purple-50 to-purple-100/50'
    },
    {
      label: 'Avg Utilization',
      value: formatPercentage(kpis.avgUtilization),
      delta: kpis.delta.avgUtilization,
      color: kpis.avgUtilization >= 90 ? colors.danger : kpis.avgUtilization >= 70 ? colors.warning : colors.success,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      gradient: kpis.avgUtilization >= 90 
        ? (isDarkMode ? 'from-red-600 to-red-500' : 'from-red-500 to-red-400')
        : kpis.avgUtilization >= 70 
        ? (isDarkMode ? 'from-yellow-600 to-yellow-500' : 'from-yellow-500 to-yellow-400')
        : (isDarkMode ? 'from-green-600 to-green-500' : 'from-green-500 to-green-400'),
      bgGradient: kpis.avgUtilization >= 90
        ? (isDarkMode ? 'from-red-900/20 to-red-800/20' : 'from-red-50 to-red-100/50')
        : kpis.avgUtilization >= 70
        ? (isDarkMode ? 'from-yellow-900/20 to-yellow-800/20' : 'from-yellow-50 to-yellow-100/50')
        : (isDarkMode ? 'from-green-900/20 to-green-800/20' : 'from-green-50 to-green-100/50')
    },
    {
      label: 'Critical Facilities',
      value: formatNumber(kpis.criticalFacilities),
      delta: kpis.delta.criticalFacilities,
      color: kpis.criticalFacilities > 0 ? colors.danger : colors.success,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      gradient: kpis.criticalFacilities > 0 
        ? (isDarkMode ? 'from-red-600 to-red-500' : 'from-red-500 to-red-400')
        : (isDarkMode ? 'from-green-600 to-green-500' : 'from-green-500 to-green-400'),
      bgGradient: kpis.criticalFacilities > 0
        ? (isDarkMode ? 'from-red-900/20 to-red-800/20' : 'from-red-50 to-red-100/50')
        : (isDarkMode ? 'from-green-900/20 to-green-800/20' : 'from-green-50 to-green-100/50')
    }
  ];

  return (
    <>
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
        {kpiItems.map((item, index) => {
          const isCriticalFacilities = item.label === 'Critical Facilities';
          
          return (
            <Card 
              key={index} 
              className={`p-6 relative overflow-hidden group transition-all duration-300 hover:scale-105 hover:shadow-xl min-h-[180px] ${
                isDarkMode ? 'hover:shadow-blue-500/10' : 'hover:shadow-blue-500/20'
              } ${isCriticalFacilities ? 'cursor-pointer' : ''}`} 
              isDarkMode={isDarkMode}
              onClick={isCriticalFacilities ? () => setShowCriticalModal(true) : undefined}
            >
          {/* Background Gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${item.bgGradient} opacity-30`} />
          
          {/* Content */}
          <div className="relative z-10 h-full flex flex-col">
            {/* Top Row: Icon and Delta */}
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${item.gradient} text-white shadow-lg`}>
                {item.icon}
              </div>
              {item.delta !== undefined && item.delta !== 0 && (
                <div className="text-right">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    item.delta > 0 
                      ? (isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700')
                      : (isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700')
                  }`}>
                    <svg 
                      className={`w-3 h-3 mr-1 ${item.delta > 0 ? 'rotate-0' : 'rotate-180'}`} 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    {Math.abs(item.delta).toFixed(1)}%
                  </div>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    vs last period
                  </p>
                </div>
              )}
            </div>

            {/* Middle Section: Label and Value */}
            <div className="flex-1">
              <p 
                className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
              >
                {item.label}
              </p>
              <p 
                className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}
              >
                {item.value}
              </p>
            </div>
            
            {/* Bottom Section: Status Indicator */}
            <div className="flex items-center space-x-2 mt-auto">
              <div className={`w-2 h-2 rounded-full ${
                item.label === 'Avg Utilization' 
                  ? (kpis.avgUtilization >= 90 ? 'bg-red-500' : kpis.avgUtilization >= 70 ? 'bg-yellow-500' : 'bg-green-500')
                  : item.label === 'Critical Facilities'
                  ? (kpis.criticalFacilities > 0 ? 'bg-red-500' : 'bg-green-500')
                  : 'bg-blue-500'
              }`} />
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {item.label === 'Avg Utilization' 
                  ? (kpis.avgUtilization >= 90 ? 'High Load' : kpis.avgUtilization >= 70 ? 'Moderate' : 'Optimal')
                  : item.label === 'Critical Facilities'
                  ? (kpis.criticalFacilities > 0 ? 'Attention Needed' : 'All Good')
                  : 'Active'
                }
              </span>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-16 h-16 opacity-5">
              <div className={`w-full h-full bg-gradient-to-br ${item.gradient} rounded-full blur-xl`} />
            </div>
          </div>
        </Card>
          );
        })}
      </div>

      {/* Critical Facilities Modal */}
      {showCriticalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  kpis.criticalFacilities > 0 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-green-100 text-green-600'
                }`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Critical Facilities
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Current Status: {criticalFacilities.length} facilities need attention
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCriticalModal(false)}
                className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'text-gray-500'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className={`mb-6 p-4 rounded-lg ${
                criticalFacilities.length > 0 
                  ? 'bg-red-50 border border-red-200' 
                  : 'bg-green-50 border border-green-200'
              } ${isDarkMode ? 'bg-opacity-20' : ''}`}>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    criticalFacilities.length > 0 ? 'bg-red-500' : 'bg-green-500'
                  }`} />
                  <span className={`font-medium ${
                    criticalFacilities.length > 0 ? 'text-red-800' : 'text-green-800'
                  } ${isDarkMode ? 'text-white' : ''}`}>
                    {criticalFacilities.length > 0 ? 'Attention Needed' : 'All Good'}
                  </span>
                </div>
                <p className={`mt-2 text-sm ${
                  criticalFacilities.length > 0 ? 'text-red-700' : 'text-green-700'
                } ${isDarkMode ? 'text-gray-300' : ''}`}>
                  {criticalFacilities.length > 0 
                    ? `${criticalFacilities.length} facilities require immediate attention`
                    : 'All facilities are operating within normal parameters'
                  }
                </p>
              </div>

              <div className="space-y-4">
                <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  What makes a facility critical?
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Overdue Tasks
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Tasks that have passed their due date and remain incomplete
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Blocked Tasks
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Tasks that cannot progress due to dependencies or blockers
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        High Priority Tasks
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Critical tasks that require immediate attention
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Low Utilization
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Facilities with significantly low task completion rates
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Critical Facilities List */}
              {criticalFacilities.length > 0 && (
                <div className="mt-6">
                  <h4 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Critical Facilities ({criticalFacilities.length})
                  </h4>
                  <div className="space-y-2">
                    {criticalFacilities.map((facility) => (
                      <div key={facility.id} className={`p-3 rounded-lg border ${
                        isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {facility.name}
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {facility.membersCount} members
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
                            }`}>
                              {facility.avgUtilization.toFixed(1)}% utilization
                            </div>
                            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {facility.statusDistribution.overloaded || 0} overloaded tasks
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`flex justify-end p-6 border-t ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => setShowCriticalModal(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalKpiStrip;
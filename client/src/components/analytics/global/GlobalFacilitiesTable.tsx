import React from 'react';
import Card from '../shared/Card';
import SectionHeader from '../shared/SectionHeader';
import DataTable from '../shared/DataTable';
import ProgressBar from '../shared/ProgressBar';
import Tooltip from '../../ui/Tooltip';
import { FacilitySummary } from '../../../types/analytics';
import { formatNumber, getStatusColor } from '../../../utils/formatUtils';
import { colors } from '../../../styles/designTokens';

interface GlobalFacilitiesTableProps {
  facilities: FacilitySummary[];
  onFacilityClick: (facilityId: number) => void;
  className?: string;
  isDarkMode?: boolean;
}

const GlobalFacilitiesTable: React.FC<GlobalFacilitiesTableProps> = ({
  facilities,
  onFacilityClick,
  className = '',
  isDarkMode = false
}) => {
  // Helper function to determine if facility is clickable
  const isFacilityClickable = (userRole?: string) => {
    return userRole && ['owner', 'manager'].includes(userRole);
  };

  // Helper function to get role styling
  const getRoleStyling = (userRole?: string) => {
    if (!userRole) return { 
      bg: isDarkMode ? 'bg-gray-800' : 'bg-gray-100', 
      text: isDarkMode ? 'text-gray-300' : 'text-gray-600', 
      label: 'Guest' 
    };
    
    switch (userRole) {
      case 'owner':
        return { 
          bg: isDarkMode ? 'bg-purple-800' : 'bg-purple-100', 
          text: isDarkMode ? 'text-purple-300' : 'text-purple-700', 
          label: 'Owner' 
        };
      case 'manager':
        return { 
          bg: isDarkMode ? 'bg-blue-800' : 'bg-blue-100', 
          text: isDarkMode ? 'text-blue-300' : 'text-blue-700', 
          label: 'Manager' 
        };
      case 'member':
        return { 
          bg: isDarkMode ? 'bg-green-800' : 'bg-green-100', 
          text: isDarkMode ? 'text-green-300' : 'text-green-700', 
          label: 'Member' 
        };
      default:
        return { 
          bg: isDarkMode ? 'bg-gray-800' : 'bg-gray-100', 
          text: isDarkMode ? 'text-gray-300' : 'text-gray-600', 
          label: 'Guest' 
        };
    }
  };
  const columns = [
    {
      key: 'name' as keyof FacilitySummary,
      label: 'Facility',
      sortable: true,
      render: (value: string, row: FacilitySummary) => {
        const isClickable = isFacilityClickable(row.userRole);
        const roleStyling = getRoleStyling(row.userRole);
        const tooltipContent = isClickable 
          ? `Click to view detailed analytics for ${value || 'Unknown Facility'}\nMembers: ${row.membersCount}\nUtilization: ${row.avgUtilization.toFixed(1)}%\nYour Role: ${roleStyling.label}`
          : `🚫 Not Allowed`;
        
        return (
          <Tooltip 
            content={tooltipContent}
            position="top"
            delay={100}
          >
            <div className="flex items-center space-x-3">
              <div 
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              >
                <span className={isDarkMode ? 'text-gray-200' : 'text-gray-900'}>
                  {(value || 'F').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  {isClickable ? (
                    <button
                      onClick={() => onFacilityClick(row.id)}
                      className={`text-sm font-medium hover:underline transition-colors duration-150 ${
                        isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                      }`}
                    >
                      {value || 'Unknown Facility'}
                    </button>
                  ) : (
                    <span className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {value || 'Unknown Facility'}
                    </span>
                  )}
                  
                  {/* Role Badge */}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleStyling.bg} ${roleStyling.text}`}>
                    {roleStyling.label}
                  </span>
                </div>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {row.membersCount} members
                </p>
              </div>
            </div>
          </Tooltip>
        );
      }
    },
    {
      key: 'membersCount' as keyof FacilitySummary,
      label: 'Members',
      sortable: true,
      render: (value: number) => (
        <div className="text-sm">
          <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatNumber(value || 0)}</div>
          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            active members
          </div>
        </div>
      )
    },
    {
      key: 'avgUtilization' as keyof FacilitySummary,
      label: 'Avg Utilization',
      sortable: true,
      render: (value: number, row: FacilitySummary) => {
        // Use facility-level utilization (not individual member utilization)
        const utilization = row.avgUtilization;
        
        // Create detailed tooltip content
        const tooltipContent = `Utilization: ${utilization.toFixed(1)}%\nMembers: ${row.membersCount}\nStatus: ${utilization >= 90 ? 'Overloaded' : utilization >= 70 ? 'Caution' : 'Balanced'}`;
        
        return (
          <div className="w-32">
            <Tooltip 
              content={tooltipContent}
              position="top"
              delay={300}
              className="w-full"
            >
              <ProgressBar
                value={utilization}
                max={100}
                size="sm"
                color="auto"
                showPercentage={true}
                isDarkMode={isDarkMode}
              />
            </Tooltip>
          </div>
        );
      }
    },
    {
      key: 'statusDistribution' as keyof FacilitySummary,
      label: 'Status Distribution',
      sortable: false,
      render: (value: any) => {
        const totalTasks = (value?.balanced || 0) + (value?.caution || 0) + (value?.overloaded || 0);
        const tooltipContent = `Task Status Distribution:\n• Balanced: ${value?.balanced || 0} tasks\n• Caution: ${value?.caution || 0} tasks\n• Overloaded: ${value?.overloaded || 0} tasks\nTotal: ${totalTasks} tasks`;
        
        return (
          <Tooltip 
            content={tooltipContent}
            position="top"
            delay={300}
          >
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div 
                  className="w-2 h-2 rounded-full bg-green-500"
                ></div>
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {value?.balanced || 0}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <div 
                  className="w-2 h-2 rounded-full bg-orange-500"
                ></div>
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {value?.caution || 0}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <div 
                  className="w-2 h-2 rounded-full bg-red-500"
                ></div>
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {value?.overloaded || 0}
                </span>
              </div>
            </div>
          </Tooltip>
        );
      }
    }
  ];

  return (
    <Card className={`p-6 ${className}`} isDarkMode={isDarkMode}>
      <SectionHeader
        label="FACILITY OVERVIEW"
        title="Facility Analytics"
        isDarkMode={isDarkMode}
        action={{
          label: 'View All',
          onClick: () => {
            // Navigate to detailed facilities view
          }
        }}
      />
      
      <div className="mt-6">
        <DataTable
          data={facilities}
          columns={columns}
          onRowClick={(row) => {
            if (isFacilityClickable(row.userRole)) {
              onFacilityClick(row.id);
            }
          }}
          emptyMessage="No facility data available"
          isDarkMode={isDarkMode}
        />
      </div>
    </Card>
  );
};

export default GlobalFacilitiesTable;

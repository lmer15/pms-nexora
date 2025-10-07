import React from 'react';
import Card from '../shared/Card';
import SectionHeader from '../shared/SectionHeader';
import DataTable from '../shared/DataTable';
import ProgressBar from '../shared/ProgressBar';
import { FacilitySummary, MemberSummary } from '../../../types/analytics';
import { formatNumber, getStatusColor } from '../../../utils/formatUtils';
import { colors } from '../../../styles/designTokens';

interface GlobalFacilitiesTableProps {
  facilities: FacilitySummary[];
  members: MemberSummary[];
  onFacilityClick: (facilityId: number) => void;
  className?: string;
  isDarkMode?: boolean;
}

const GlobalFacilitiesTable: React.FC<GlobalFacilitiesTableProps> = ({
  facilities,
  members,
  onFacilityClick,
  className = '',
  isDarkMode = false
}) => {
  const columns = [
    {
      key: 'name' as keyof FacilitySummary,
      label: 'Facility',
      sortable: true,
      render: (value: string, row: FacilitySummary) => (
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
          <div>
            <button
              onClick={() => onFacilityClick(row.id)}
              className={`text-sm font-medium hover:underline transition-colors duration-150 ${
                isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              {value || 'Unknown Facility'}
            </button>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {row.membersCount} members
            </p>
          </div>
        </div>
      )
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
        // Find the member data for this facility to get the correct utilization
        const memberData = members.find(member => 
          member.facilityId === row.id && member.role === 'owner'
        );
        const utilization = memberData ? memberData.utilization : 0;
        
        
        return (
          <div className="w-32">
            <ProgressBar
              value={utilization}
              max={100}
              size="sm"
              color="auto"
              showPercentage={true}
              isDarkMode={isDarkMode}
            />
          </div>
        );
      }
    },
    {
      key: 'statusDistribution' as keyof FacilitySummary,
      label: 'Status Distribution',
      sortable: false,
      render: (value: any) => (
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
      )
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
            console.log('Navigate to all facilities view');
          }
        }}
      />
      
      <div className="mt-6">
        <DataTable
          data={facilities}
          columns={columns}
          onRowClick={(row) => onFacilityClick(row.id)}
          emptyMessage="No facility data available"
          isDarkMode={isDarkMode}
        />
      </div>
    </Card>
  );
};

export default GlobalFacilitiesTable;

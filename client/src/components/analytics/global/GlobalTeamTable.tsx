import React from 'react';
import Card from '../shared/Card';
import SectionHeader from '../shared/SectionHeader';
import DataTable from '../shared/DataTable';
import AvatarStack from '../shared/AvatarStack';
import ProgressBar from '../shared/ProgressBar';
import { MemberSummary } from '../../../types/analytics';
import { formatNumber, getStatusColor } from '../../../utils/formatUtils';
import { colors } from '../../../styles/designTokens';

interface GlobalTeamTableProps {
  members: MemberSummary[];
  onMemberClick: (memberId: string) => void;
  className?: string;
  isDarkMode?: boolean;
}

const GlobalTeamTable: React.FC<GlobalTeamTableProps> = ({
  members,
  onMemberClick,
  className = '',
  isDarkMode = false
}) => {
  const columns = [
    {
      key: 'name' as keyof MemberSummary,
      label: 'Member',
      sortable: true,
      render: (value: string, row: MemberSummary) => (
        <div className="flex items-center space-x-3">
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}
          >
            {row.avatarUrl ? (
              <img
                src={row.avatarUrl}
                alt={row.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className={isDarkMode ? 'text-gray-200' : 'text-gray-900'}>
                {(row.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <button
              onClick={() => onMemberClick(row.id)}
              className={`text-sm font-medium hover:underline transition-colors duration-150 ${
                isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              {row.name || 'Unknown User'}
            </button>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {row.facilityName || 'Unknown Facility'}
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'role' as keyof MemberSummary,
      label: 'Role',
      sortable: true,
      render: (value: string) => (
        <span 
          className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
            isDarkMode 
              ? 'bg-gray-700 text-gray-200' 
              : 'bg-gray-200 text-gray-900'
          }`}
        >
          {value || 'member'}
        </span>
      )
    },
    {
      key: 'tasks' as keyof MemberSummary,
      label: 'Tasks',
      sortable: true,
      render: (value: any) => (
        <div className="text-sm">
          <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatNumber(value?.total || 0)}
          </div>
          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {value?.ongoing || 0} ongoing, {value?.completed || 0} completed
          </div>
        </div>
      )
    },
    {
      key: 'utilization' as keyof MemberSummary,
      label: 'Utilization',
      sortable: true,
      render: (value: number) => (
        <div className="w-24">
          <ProgressBar
            value={value || 0}
            max={100}
            size="sm"
            color="auto"
            showPercentage={true}
            isDarkMode={isDarkMode}
          />
        </div>
      )
    },
    {
      key: 'status' as keyof MemberSummary,
      label: 'Status',
      sortable: true,
      render: (value: string) => {
        const statusColor = getStatusColor(value || 'balanced');
        return (
          <span 
            className="px-2 py-1 rounded-full text-xs font-medium capitalize"
            style={{
              backgroundColor: statusColor + '20',
              color: statusColor
            }}
          >
            {value || 'balanced'}
          </span>
        );
      }
    },
    {
      key: 'trend' as keyof MemberSummary,
      label: 'Trend',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center space-x-1">
          {(value || 0) > 0 ? (
            <>
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-green-600 font-medium">+{value}%</span>
            </>
          ) : (value || 0) < 0 ? (
            <>
              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-red-600 font-medium">{value}%</span>
            </>
          ) : (
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>—</span>
          )}
        </div>
      )
    }
  ];

  return (
    <Card className={`p-6 ${className}`} isDarkMode={isDarkMode}>
      <SectionHeader
        label="TEAM MEMBERS"
        title="Member Performance"
        isDarkMode={isDarkMode}
        action={{
          label: 'View All',
          onClick: () => {
            // Navigate to detailed member view
          }
        }}
      />
      
      <div className="mt-6">
        <DataTable
          data={members}
          columns={columns}
          onRowClick={(row) => onMemberClick(row.id)}
          emptyMessage="No member data available"
          isDarkMode={isDarkMode}
        />
      </div>
    </Card>
  );
};

export default GlobalTeamTable;

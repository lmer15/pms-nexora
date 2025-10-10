import React, { useState } from 'react';
import Card from '../shared/Card';
import SectionHeader from '../shared/SectionHeader';
import DataTable from '../shared/DataTable';
import ProgressBar from '../shared/ProgressBar';
import Tooltip from '../../ui/Tooltip';
import { MemberSummary } from '../../../types/analytics';
import { formatNumber, getStatusColor } from '../../../utils/formatUtils';
import { colors } from '../../../styles/designTokens';

interface FacilityTeamTableProps {
  members: MemberSummary[];
  onMemberClick: (memberId: string) => void;
  onViewAllMembers?: () => void;
  className?: string;
  isDarkMode?: boolean;
}

const FacilityTeamTable: React.FC<FacilityTeamTableProps> = ({
  members,
  onMemberClick,
  onViewAllMembers,
  className = '',
  isDarkMode = false
}) => {
  // Limit to 4 members initially
  const displayedMembers = members.slice(0, 4);
  const hasMoreMembers = members.length > 4;
  const columns = [
    {
      key: 'name' as keyof MemberSummary,
      label: 'Member',
      sortable: true,
      render: (value: string, row: MemberSummary) => {
        const tooltipContent = `Click to view detailed analytics for ${row.name}\nRole: ${row.role}\nUtilization: ${row.utilization.toFixed(1)}%\nTasks: ${row.tasks?.total || 0} total`;
        
        return (
          <Tooltip 
            content={tooltipContent}
            position="right"
            delay={300}
            className="w-full"
          >
            <div className="flex items-center space-x-3 text-left">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
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
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                    {(row.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <button
                  onClick={() => onMemberClick(row.id)}
                  className="text-sm font-medium hover:underline transition-colors duration-150 text-left block"
                  style={{ color: colors.primary }}
                >
                  {row.name}
                </button>
                <p className={`text-xs text-left ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {row.role}
                </p>
              </div>
            </div>
          </Tooltip>
        );
      }
    },
    {
      key: 'tasks' as keyof MemberSummary,
      label: 'Tasks',
      sortable: true,
      render: (value: any) => (
        <div className="text-sm">
          <div className="font-medium">{formatNumber(value?.total || 0)}</div>
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
      render: (value: number, row: MemberSummary) => {
        const tooltipContent = `Utilization: ${(value || 0).toFixed(1)}%\nStatus: ${value >= 90 ? 'Overloaded' : value >= 70 ? 'Caution' : 'Balanced'}\nMember: ${row.name}`;
        
        return (
          <div className="w-24">
            <Tooltip 
              content={tooltipContent}
              position="top"
              delay={300}
              className="w-full"
            >
              <ProgressBar
                value={value || 0}
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
      key: 'status' as keyof MemberSummary,
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <span 
          className="px-2 py-1 rounded-full text-xs font-medium capitalize"
          style={{
            backgroundColor: getStatusColor(value || 'balanced') + '20',
            color: getStatusColor(value || 'balanced')
          }}
        >
          {value || 'balanced'}
        </span>
      )
    },
    {
      key: 'trend' as keyof MemberSummary,
      label: 'Trend',
      sortable: true,
      render: (value: number, row: MemberSummary) => {
        const trendValue = value || 0;
        let tooltipContent = '';
        
        if (trendValue > 0) {
          tooltipContent = `Utilization increased by ${trendValue}% this period\nMember: ${row.name}\nTrend: Positive growth`;
        } else if (trendValue < 0) {
          tooltipContent = `Utilization decreased by ${Math.abs(trendValue)}% this period\nMember: ${row.name}\nTrend: Declining performance`;
        } else {
          tooltipContent = `No change in utilization this period\nMember: ${row.name}\nTrend: Stable performance`;
        }
        
        return (
          <Tooltip 
            content={tooltipContent}
            position="top"
            delay={300}
            className="w-full"
          >
            <div className="flex items-center space-x-1">
              {trendValue > 0 ? (
                <>
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-green-600 font-medium">+{trendValue}%</span>
                </>
              ) : trendValue < 0 ? (
                <>
                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-red-600 font-medium">{trendValue}%</span>
                </>
              ) : (
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>—</span>
              )}
            </div>
          </Tooltip>
        );
      }
    }
  ];

  return (
    <Card className={`p-6 h-full flex flex-col ${className}`} isDarkMode={isDarkMode}>
      <SectionHeader
        label="TEAM MEMBERS"
        title="Member Performance"
        action={hasMoreMembers ? {
          label: `View More (${members.length} total)`,
          onClick: onViewAllMembers || (() => {})
        } : undefined}
        isDarkMode={isDarkMode}
      />
      
      <div className="mt-6 flex-1">
        <DataTable
          data={displayedMembers}
          columns={columns}
          onRowClick={(row) => onMemberClick(row.id)}
          emptyMessage="No member data available"
          isDarkMode={isDarkMode}
        />
      </div>
    </Card>
  );
};

export default FacilityTeamTable;

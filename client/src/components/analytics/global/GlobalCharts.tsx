import React from 'react';
import Card from '../shared/Card';
import SectionHeader from '../shared/SectionHeader';
import { FacilitySummary, MemberSummary } from '../../../types/analytics';
import { colors } from '../../../styles/designTokens';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface GlobalChartsProps {
  facilities: FacilitySummary[];
  members: MemberSummary[];
  className?: string;
  isDarkMode?: boolean;
}

const GlobalCharts: React.FC<GlobalChartsProps> = ({
  facilities,
  members,
  className = '',
  isDarkMode = false
}) => {
  // Prepare facility data for bar chart (showing owned facilities)
  const ownedFacilities = facilities.filter(facility => 
    members.some(member => member.facilityId === facility.id && member.role === 'owner')
  );
  
  const facilityBarData = ownedFacilities.map(facility => {
    // Find the member data for this facility to get the correct utilization
    const memberData = members.find(member => member.facilityId === facility.id && member.role === 'owner');
    const utilization = memberData ? memberData.utilization : 0;
    
    return {
      name: facility.name.length > 15 ? facility.name.substring(0, 15) + '...' : facility.name,
      fullName: facility.name,
      utilization: utilization,
      members: facility.membersCount,
      fill: utilization >= 90 ? (isDarkMode ? '#F87171' : '#EF4444') : 
            utilization >= 70 ? (isDarkMode ? '#FBBF24' : '#F59E0B') : 
            (isDarkMode ? '#34D399' : '#10B981')
    };
  });

  const hasMemberTaskData = members.length > 0 && members[0].tasks && 
    (members[0].tasks.total > 0 || members[0].tasks.completed > 0 || members[0].tasks.ongoing > 0);
  
  let taskStatusCounts;
  
  if (hasMemberTaskData) {
    // Use member task data
    taskStatusCounts = members.reduce((acc, member) => {
      acc.completed += member.tasks?.completed || 0;
      acc.ongoing += member.tasks?.ongoing || 0;
      acc.total += member.tasks?.total || 0;
      return acc;
    }, { completed: 0, ongoing: 0, total: 0 });
  } else {
    // Fallback: calculate from facility data
    taskStatusCounts = facilities.reduce((acc, facility) => {
      const totalTasks = facility.statusDistribution.balanced + 
                        facility.statusDistribution.caution + 
                        facility.statusDistribution.overloaded;
      acc.completed += facility.statusDistribution.balanced;
      acc.ongoing += facility.statusDistribution.caution;
      acc.total += totalTasks;
      return acc;
    }, { completed: 0, ongoing: 0, total: 0 });
  }

  const pendingTasks = taskStatusCounts.total - taskStatusCounts.completed - taskStatusCounts.ongoing;

  const taskStatusData = [
    {
      name: 'Completed',
      value: taskStatusCounts.completed,
      color: isDarkMode ? '#34D399' : '#10B981',
      fullName: 'Completed Tasks'
    },
    {
      name: 'In Progress',
      value: taskStatusCounts.ongoing,
      color: isDarkMode ? '#60A5FA' : '#3B82F6',
      fullName: 'In Progress Tasks'
    },
    {
      name: 'Pending',
      value: Math.max(0, pendingTasks),
      color: isDarkMode ? '#FBBF24' : '#F59E0B',
      fullName: 'Pending Tasks'
    }
  ].filter(item => item.value > 0);

  // If no data, show a placeholder
  const hasData = taskStatusData.length > 0;
  
  

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div 
          className={`p-3 border rounded-lg shadow-lg ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-600' 
              : 'bg-white border-gray-200'
          }`}
        >
          <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{data.fullName}</p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Utilization:</span>{' '}
            <span className="font-medium">{data.utilization.toFixed(1)}%</span>
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Members:</span>{' '}
            <span className="font-medium">{data.members}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const totalTasks = taskStatusCounts.total;
      return (
        <div 
          className={`p-3 border rounded-lg shadow-lg ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-600' 
              : 'bg-white border-gray-200'
          }`}
        >
          <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{data.fullName}</p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Tasks:</span>{' '}
            <span className="font-medium">{data.value}</span>
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Percentage:</span>{' '}
            <span className="font-medium">
              {totalTasks > 0 ? ((data.value / totalTasks) * 100).toFixed(1) : 0}%
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {/* Facility Utilization Bar Chart */}
      <Card className="p-6" isDarkMode={isDarkMode}>
        <SectionHeader
          label="FACILITY PERFORMANCE"
          title="Utilization by Owned Facilities"
          isDarkMode={isDarkMode}
        />
        <div className="mt-6 h-80">
          {facilityBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={facilityBarData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: isDarkMode ? '#9CA3AF' : '#6B7280' }}
                  stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: isDarkMode ? '#9CA3AF' : '#6B7280' }}
                  stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="utilization" 
                  radius={[4, 4, 0, 0]}
                  fill={isDarkMode ? '#60A5FA' : '#3B82F6'}
                >
                  {facilityBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className={`mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No facility data available</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Task Status Distribution Pie Chart */}
      <Card className="p-6" isDarkMode={isDarkMode}>
        <SectionHeader
          label="TASK STATUS"
          title="Work Progress Overview"
          isDarkMode={isDarkMode}
        />
        <div className="mt-6 h-80">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className={`mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No task data available</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          {taskStatusData.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                {item.fullName} ({item.value})
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default GlobalCharts;

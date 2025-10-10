import React from 'react';
import Card from '../shared/Card';
import SectionHeader from '../shared/SectionHeader';
import { MemberChartData } from '../../../types/analytics';
import { colors } from '../../../styles/designTokens';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

interface MemberChartsProps {
  charts: MemberChartData;
  className?: string;
  isDarkMode?: boolean;
}

const MemberCharts: React.FC<MemberChartsProps> = ({
  charts,
  className = '',
  isDarkMode = false
}) => {
  // Prepare task distribution data for pie chart
  const taskDistributionData = [
    {
      name: 'Done',
      value: charts.taskDistribution.done,
      color: colors.success
    },
    {
      name: 'In-Progress',
      value: charts.taskDistribution.inProgress,
      color: colors.primary
    },
    {
      name: 'Review',
      value: charts.taskDistribution.review,
      color: colors.warning
    },
    {
      name: 'Pending',
      value: charts.taskDistribution.pending,
      color: colors.mutedText
    },
    {
      name: 'Overdue',
      value: charts.taskDistribution.overdue,
      color: colors.danger
    }
  ].filter(item => item.value > 0);

  const totalTasks = charts.taskDistribution.done + charts.taskDistribution.inProgress + 
                    charts.taskDistribution.review + charts.taskDistribution.pending + 
                    charts.taskDistribution.overdue;

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div 
          className={`p-3 border rounded-lg shadow-lg ${
            isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
          }`}
        >
          <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {data.name}
          </p>
          <p className="text-sm">
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Tasks:</span>{' '}
            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {data.value}
            </span>
          </p>
          <p className="text-sm">
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Percentage:</span>{' '}
            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {totalTasks > 0 ? ((data.value / totalTasks) * 100).toFixed(1) : 0}%
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  const LineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className={`p-3 border rounded-lg shadow-lg ${
            isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
          }`}
        >
          <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {new Date(label).toLocaleDateString()}
          </p>
          <p className="text-sm">
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Utilization:</span>{' '}
            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {payload[0].value.toFixed(1)}%
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {/* Task Distribution Pie Chart */}
      <Card className="p-6" isDarkMode={isDarkMode}>
        <SectionHeader
          label="TASK DISTRIBUTION"
          title="Work Breakdown"
          isDarkMode={isDarkMode}
        />
        <div className="mt-6 h-80">
          {totalTasks > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM8 15V9h4v6H8z" clipRule="evenodd" />
                </svg>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No task data available</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Legend */}
        {totalTasks > 0 && (
          <div className="mt-4 flex justify-center space-x-6">
            {taskDistributionData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Utilization Trend Line Chart */}
      <Card className="p-6" isDarkMode={isDarkMode}>
        <SectionHeader
          label="UTILIZATION TREND"
          title="Daily Performance"
          isDarkMode={isDarkMode}
        />
        <div className="mt-6 h-80">
          {charts.utilizationSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.utilizationSeries} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: isDarkMode ? '#9CA3AF' : '#6B7280' }}
                  stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: isDarkMode ? '#9CA3AF' : '#6B7280' }}
                  stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  domain={[0, 100]}
                />
                <Tooltip content={<LineTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="utilization" 
                  stroke={colors.primary}
                  strokeWidth={3}
                  dot={{ fill: colors.primary, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: colors.primary, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No utilization data available</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MemberCharts;

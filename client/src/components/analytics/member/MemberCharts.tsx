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
}

const MemberCharts: React.FC<MemberChartsProps> = ({
  charts,
  className = ''
}) => {
  // Prepare task distribution data for pie chart
  const taskDistributionData = [
    {
      name: 'Completed',
      value: charts.taskDistribution.completed,
      color: colors.success
    },
    {
      name: 'Ongoing',
      value: charts.taskDistribution.ongoing,
      color: colors.warning
    },
    {
      name: 'Pending',
      value: charts.taskDistribution.pending,
      color: colors.mutedText
    }
  ].filter(item => item.value > 0);

  const totalTasks = charts.taskDistribution.completed + charts.taskDistribution.ongoing + charts.taskDistribution.pending;

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div 
          className="bg-white p-3 border rounded-lg shadow-lg"
          style={{ borderColor: colors.border }}
        >
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">
            <span style={{ color: colors.mutedText }}>Tasks:</span>{' '}
            <span className="font-medium">{data.value}</span>
          </p>
          <p className="text-sm">
            <span style={{ color: colors.mutedText }}>Percentage:</span>{' '}
            <span className="font-medium">
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
          className="bg-white p-3 border rounded-lg shadow-lg"
          style={{ borderColor: colors.border }}
        >
          <p className="font-medium">{new Date(label).toLocaleDateString()}</p>
          <p className="text-sm">
            <span style={{ color: colors.mutedText }}>Utilization:</span>{' '}
            <span className="font-medium">{payload[0].value.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {/* Task Distribution Pie Chart */}
      <Card className="p-6">
        <SectionHeader
          label="TASK DISTRIBUTION"
          title="Work Breakdown"
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
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM8 15V9h4v6H8z" clipRule="evenodd" />
                </svg>
                <p className="text-gray-500">No task data available</p>
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
                <span className="text-sm" style={{ color: colors.neutralText }}>
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Utilization Trend Line Chart */}
      <Card className="p-6">
        <SectionHeader
          label="UTILIZATION TREND"
          title="Daily Performance"
        />
        <div className="mt-6 h-80">
          {charts.utilizationSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.utilizationSeries} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke={colors.mutedText}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke={colors.mutedText}
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
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-gray-500">No utilization data available</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MemberCharts;

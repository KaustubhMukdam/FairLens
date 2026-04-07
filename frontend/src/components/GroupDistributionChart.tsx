import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface GroupDistributionChartProps {
  protectedGroupsStats: Record<string, {
    value_counts: Record<string, number>;
    target_distribution_by_group: Record<string, Record<string, number>>;
  }>;
}

export const GroupDistributionChart = ({ protectedGroupsStats }: GroupDistributionChartProps) => {
  // Extract first protected attribute's distribution
  const firstAttr = Object.keys(protectedGroupsStats)[0];
  if (!firstAttr) {
    return <div className="text-gray-500 text-sm">No group data available</div>;
  }

  const groupData = protectedGroupsStats[firstAttr]?.target_distribution_by_group || {};

  // Transform to chart data
  const chartData = Object.entries(groupData).map(([group, distribution]) => ({
    group,
    outcomeRate: (parseFloat(distribution['1'] as any) || 0) * 100,
  }));

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Outcome Rate by Group ({firstAttr})</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="group" tick={{ fontSize: 12 }} />
          <YAxis label={{ value: 'Outcome Rate (%)', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            formatter={(value) => `${(value as number).toFixed(1)}%`}
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
          />
          <Bar dataKey="outcomeRate" fill="#4F46E5" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 text-sm text-gray-600">
        <p>Positive outcome rates per group in the {firstAttr} protected attribute</p>
      </div>
    </div>
  );
};

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
  // Design system colors
  const colors = {
    primary: '#3525cd',
    surface: '#e2e2e9',
    outline: '#c7c4d8',
    text: '#464555',
  };

  // Extract first protected attribute's distribution
  const firstAttr = Object.keys(protectedGroupsStats)[0];
  if (!firstAttr) {
    return <div className="body-sm text-on-surface-variant">No group data available</div>;
  }

  const groupData = protectedGroupsStats[firstAttr]?.target_distribution_by_group || {};

  // Transform to chart data
  const chartData = Object.entries(groupData).map(([group, distribution]) => ({
    group,
    outcomeRate: (parseFloat(distribution['1'] as any) || 0) * 100,
  }));

  return (
    <div className="card">
      <div className="mb-6">
        <h3 className="title-md font-bold text-on-background">Outcome Rate by Group</h3>
        <p className="body-sm text-on-surface-variant mt-1">Percentage of positive outcomes per protected group</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.surface} vertical={false} />
          <XAxis dataKey="group" tick={{ fontSize: 11, fill: colors.text }} />
          <YAxis
            label={{ value: 'Outcome Rate (%)', angle: -90, position: 'insideLeft', fill: colors.text }}
            tick={{ fontSize: 11, fill: colors.text }}
          />
          <Tooltip
            formatter={(value) => `${(value as number).toFixed(1)}%`}
            contentStyle={{
              backgroundColor: '#ffffff',
              border: `1px solid ${colors.outline}`,
              borderRadius: '0.5rem',
            }}
            labelStyle={{ color: colors.text }}
          />
          <Bar dataKey="outcomeRate" fill={colors.primary} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 body-sm text-on-surface-variant">
        <p>Positive outcome rates per group in the {firstAttr} protected attribute</p>
      </div>
    </div>
  );
};

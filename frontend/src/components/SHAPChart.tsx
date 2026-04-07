import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface SHAPChartProps {
  features: Array<{
    feature_name: string;
    mean_abs_shap: number;
    is_protected_attribute: boolean;
  }>;
}

export const SHAPChart = ({ features }: SHAPChartProps) => {
  // Sort and take top 10
  const topFeatures = features.slice(0, 10).map((f) => ({
    name: f.feature_name,
    value: f.mean_abs_shap,
    isProtected: f.is_protected_attribute,
  }));

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Driving the Model?</h3>
      <p className="text-sm text-gray-600 mb-4">Top 10 features by SHAP importance</p>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={topFeatures}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={190} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => (typeof value === 'number' ? value.toFixed(4) : value)}
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
          />
          <Bar dataKey="value" fill="#4F46E5" radius={[0, 8, 8, 0]}>
            {topFeatures.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.isProtected ? '#F59E0B' : '#4F46E5'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-indigo-500 rounded" />
          <span>Non-protected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-amber-500 rounded" />
          <span>Protected attribute</span>
        </div>
      </div>
    </div>
  );
};

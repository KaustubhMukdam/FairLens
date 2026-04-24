import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { AuditResult } from '../store/auditStore';

interface FairnessRadarProps {
  result: AuditResult;
}

export const FairnessRadar = ({ result }: FairnessRadarProps) => {
  // Design system colors
  const colors = {
    primary: '#3525cd',
    secondary: '#58579b',
    error: '#ba1a1a',
    warning: '#f9ab00',
    success: '#36a100',
    surface: '#e2e2e9',
    outline: '#c7c4d8',
  };

  // Get color based on severity
  const getSeverityColor = (value: number): string => {
    if (value >= 80) return colors.success;      // Green - excellent
    if (value >= 60) return colors.warning;      // Amber - warning
    return colors.error;                          // Red - critical
  };

  // Extract metrics from fairness_metrics array
  const metrics: Record<string, number> = {};
  result.fairness_metrics.forEach((m) => {
    metrics[m.metric_name] = m.value;
  });

  // Normalize metrics to 0-100 scale for radar visualization
  const data = [
    {
      metric: 'Demographic Parity',
      value: Math.max(0, Math.min(100, metrics['Demographic Parity'] || 0)),
      fullMark: 100,
      color: getSeverityColor(metrics['Demographic Parity'] || 0),
    },
    {
      metric: 'Equalized Odds',
      value: Math.max(0, Math.min(100, metrics['Equalized Odds'] || 0)),
      fullMark: 100,
      color: getSeverityColor(metrics['Equalized Odds'] || 0),
    },
    {
      metric: 'Predictive Parity',
      value: Math.max(0, Math.min(100, metrics['Predictive Parity'] || 0)),
      fullMark: 100,
      color: getSeverityColor(metrics['Predictive Parity'] || 0),
    },
    {
      metric: 'Disparate Impact',
      value: Math.max(0, Math.min(100, metrics['Disparate Impact Ratio'] || 0)),
      fullMark: 100,
      color: getSeverityColor(metrics['Disparate Impact Ratio'] || 0),
    },
    {
      metric: 'Individual Fairness',
      value: Math.max(0, Math.min(100, metrics['Individual Fairness'] || 0)),
      fullMark: 100,
      color: getSeverityColor(metrics['Individual Fairness'] || 0),
    },
  ];

  return (
    <div className="card">
      <div className="mb-6">
        <h3 className="title-md font-bold text-on-background">Fairness Dimensions</h3>
        <p className="body-sm text-on-surface-variant mt-1">Five-metric assessment across fairness principles</p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={data} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
          <PolarGrid stroke={colors.surface} strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fontSize: 12, fill: '#464555' }}
            angle={90}
            orientation="outer"
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#464555' }}
          />
          <Radar
            name="Fairness Score"
            dataKey="value"
            stroke={colors.primary}
            fill="#4f46e5"
            fillOpacity={0.2}
            isAnimationActive
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value) => [(value as number).toFixed(1), 'Score']}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>

      {/* Metric Legend */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {data.map((item) => (
          <div key={item.metric} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-3 h-3 rounded-full mt-1" style={{ backgroundColor: item.color }} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{item.metric}</p>
              <p className="text-xs text-gray-600">{item.value.toFixed(1)}/100</p>
            </div>
          </div>
        ))}
      </div>

      {/* Color Legend */}
      <div className="mt-4 flex gap-4 text-xs text-gray-600 border-t border-gray-200 pt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Excellent (80+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Warning (60-79)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Critical (&lt;60)</span>
        </div>
      </div>
    </div>
  );
};

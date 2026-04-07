interface BiasScoreCardProps {
  metricName: string;
  value: number;
  severity: 'GREEN' | 'AMBER' | 'RED';
  threshold: string;
  description: string;
  affectedGroups: string[];
}

export const BiasScoreCard = ({
  metricName,
  value,
  severity,
  threshold,
  description,
  affectedGroups,
}: BiasScoreCardProps) => {
  const severityColors = {
    GREEN: { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-200 text-green-900' },
    AMBER: { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-200 text-amber-900' },
    RED: { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-200 text-red-900' },
  };

  const colors = severityColors[severity];

  return (
    <div className={`rounded-lg p-6 border border-gray-200 ${colors.bg}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{metricName}</h3>
          <p className="text-xs text-gray-600 mt-1">{description}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded ${colors.badge}`}>
          {severity === 'GREEN' ? 'PASS' : severity === 'AMBER' ? 'WARN' : 'FAIL'}
        </span>
      </div>

      <div className={`text-3xl font-bold ${colors.text} mb-3`}>{value.toFixed(3)}</div>

      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              severity === 'GREEN'
                ? 'bg-green-500'
                : severity === 'AMBER'
                  ? 'bg-amber-500'
                  : 'bg-red-500'
            }`}
            style={{ width: `${Math.min((value / 1) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-1">Threshold: {threshold}</p>
      </div>

      {affectedGroups.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">Affected groups:</p>
          <div className="flex flex-wrap gap-2">
            {affectedGroups.map((group) => (
              <span key={group} className="text-xs bg-white px-2 py-1 rounded-full border border-gray-300">
                {group}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

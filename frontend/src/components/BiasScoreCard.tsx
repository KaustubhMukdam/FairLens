interface BiasScoreCardProps {
  metricName: string;
  value: number;
  severity: 'RED' | 'AMBER' | 'GREEN';
  threshold: string;
  description: string;
  affectedGroups: string[];
}

const SEVERITY_CONFIG = {
  RED: {
    bar: 'bg-error',
    badge: 'bg-error-container text-on-error-container',
    border: 'border-error',
    label: 'FAIL',
  },
  AMBER: {
    bar: 'bg-yellow-400',
    badge: 'bg-yellow-100 text-yellow-800',
    border: 'border-yellow-400',
    label: 'AMBER',
  },
  GREEN: {
    bar: 'bg-primary',
    badge: 'bg-primary-container text-on-primary-container',
    border: 'border-primary',
    label: 'PASS',
  },
};

export const BiasScoreCard = ({
  metricName,
  value,
  severity,
  threshold,
  description,
  affectedGroups,
}: BiasScoreCardProps) => {
  const cfg = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.RED;
  // Normalize value to % for bar (clamp 0–1)
  const barWidth = Math.min(100, Math.max(0, Math.abs(value) * 100));

  return (
    <div className={`bg-surface-container-lowest rounded-xl p-6 border-l-4 ${cfg.border} relative overflow-hidden`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-bold text-slate-900">{metricName}</h4>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.badge}`}>
          {cfg.label}
        </div>
      </div>

      <div className="flex items-end gap-3 mb-4">
        <span className="text-3xl font-black text-on-surface tracking-tighter">
          {Number.isFinite(value) ? value.toFixed(3) : 'N/A'}
        </span>
        <span className="text-xs text-slate-400 mb-1">vs {threshold} target</span>
      </div>

      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${cfg.bar} transition-all duration-500 rounded-full`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {affectedGroups?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {affectedGroups.slice(0, 3).map((g) => (
            <span key={g} className="text-[10px] bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant font-medium">
              {g}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

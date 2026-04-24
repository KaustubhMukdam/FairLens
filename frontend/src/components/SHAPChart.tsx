interface Feature {
  feature_name: string;
  mean_abs_shap: number;
  is_protected_attribute: boolean;
}

interface SHAPChartProps {
  features: Feature[];
}

export const SHAPChart = ({ features }: SHAPChartProps) => {
  if (!features || features.length === 0) {
    return <p className="text-sm text-on-surface-variant">No SHAP data available.</p>;
  }

  const maxShap = Math.max(...features.map((f) => f.mean_abs_shap), 0.001);

  return (
    <div className="space-y-4">
      {features.slice(0, 8).map((feature) => {
        const width = (feature.mean_abs_shap / maxShap) * 100;
        const isProtected = feature.is_protected_attribute;

        return (
          <div key={feature.feature_name} className="space-y-1">
            <div className={`flex justify-between text-[10px] font-bold uppercase tracking-wider ${
              isProtected ? 'text-secondary' : 'text-on-surface-variant'
            }`}>
              <span>
                {feature.feature_name}
                {isProtected && (
                  <span className="ml-1 text-secondary normal-case font-medium">(Protected)</span>
                )}
              </span>
              <span>+{feature.mean_abs_shap.toFixed(2)}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isProtected ? 'bg-secondary-container' : 'bg-primary'
                }`}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface AuditRunningProps {
  progress: number;
  currentStep: string;
}

const STEPS = [
  { id: 1, name: 'Dataset parsed', icon: 'description', description: 'Rows and columns validated' },
  { id: 2, name: 'Distribution analysis', icon: 'bar_chart', description: 'Group distributions computed' },
  { id: 3, name: 'Computing fairness metrics', icon: 'sync', description: 'Testing Disparate Impact & Equal Opportunity' },
  { id: 4, name: 'SHAP explainability', icon: 'query_stats', description: 'Feature importance analysis' },
  { id: 5, name: 'Generating Gemini audit report', icon: 'auto_awesome', description: 'AI narrative and remediation steps' },
];

export const AuditRunning = ({ progress, currentStep }: AuditRunningProps) => {
  // SVG ring: circumference = 2π × 100 ≈ 628.32
  const CIRCUMFERENCE = 628.32;
  const dashOffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  const getStepStatus = (stepId: number) => {
    const stepThreshold = (stepId - 1) * 20;
    if (progress >= stepThreshold + 20) return 'completed';
    if (progress > stepThreshold) return 'active';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      {/* ── TopNavBar ── */}
      <nav className="fixed top-0 w-full z-50 bg-slate-50/80 backdrop-blur-xl">
        <div className="flex justify-between items-center px-8 py-4 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-xl font-black tracking-tighter text-indigo-700 uppercase">FairLens</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a className="text-slate-500 hover:text-indigo-600 tracking-tight leading-snug" href="#">Platform</a>
            <a className="text-slate-500 hover:text-indigo-600 tracking-tight leading-snug" href="#">Methodology</a>
            <a className="text-slate-500 hover:text-indigo-600 tracking-tight leading-snug" href="#">Documentation</a>
          </div>
          <div />
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="flex-grow flex items-center justify-center pt-24 pb-20 px-6">
        <div className="max-w-2xl w-full flex flex-col items-center">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold tracking-tight text-on-background mb-4">Running Fairness Audit</h1>
            <p className="text-on-surface-variant max-w-md mx-auto leading-relaxed">
              The Sovereign Auditor is meticulously evaluating your model's decision logic for systemic bias and disparate impact.
            </p>
          </div>

          {/* ── Circular Progress Ring ── */}
          <div className="relative flex items-center justify-center mb-16">
            {/* Outer glass ring */}
            <div className="absolute w-64 h-64 rounded-full border border-outline-variant/10 bg-surface-container-low/30 backdrop-blur-sm" />
            {/* SVG Ring */}
            <svg className="w-56 h-56" viewBox="0 0 224 224">
              {/* background track */}
              <circle
                cx="112" cy="112"
                r="100"
                fill="transparent"
                stroke="#e2e2e9"
                strokeWidth="6"
              />
              {/* progress arc */}
              <circle
                cx="112" cy="112"
                r="100"
                fill="transparent"
                stroke="#3525cd"
                strokeWidth="6"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="progress-ring__circle"
              />
            </svg>
            {/* Center label */}
            <div className="absolute flex flex-col items-center">
              <span className="text-5xl font-black tracking-tighter text-primary">
                {progress}<span className="text-2xl">%</span>
              </span>
              <span className="label-sm text-on-surface-variant mt-1">Processing</span>
            </div>
          </div>

          {/* ── Pipeline Steps ── */}
          <div className="w-full max-w-md space-y-4">
            {STEPS.map((step) => {
              const status = getStepStatus(step.id);
              const isCompleted = status === 'completed';
              const isActive = status === 'active';

              if (isCompleted) {
                return (
                  <div key={step.id} className="flex items-center p-4 rounded-xl bg-surface-container-lowest transition-all hover:translate-x-1 duration-150">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center mr-4">
                      <span className="material-symbols-outlined text-emerald-600 text-lg filled">check_circle</span>
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-semibold text-on-surface">{step.name}</p>
                    </div>
                    <div className="h-1 w-12 bg-emerald-100 rounded-full" />
                  </div>
                );
              }

              if (isActive) {
                return (
                  <div key={step.id} className="flex items-center p-4 rounded-xl bg-surface-container-low border-l-4 border-primary transition-all duration-300">
                    <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center mr-4">
                      <span className="material-symbols-outlined text-primary text-lg animate-clinical-spin">sync</span>
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-bold text-primary">{step.name}...</p>
                      <p className="text-xs text-on-primary-fixed-variant font-medium opacity-70">{step.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                      <div className="w-1.5 h-1.5 bg-primary/40 rounded-full" />
                      <div className="w-1.5 h-1.5 bg-primary/20 rounded-full" />
                    </div>
                  </div>
                );
              }

              return (
                <div key={step.id} className="flex items-center p-4 rounded-xl bg-surface-container-low/50 opacity-60">
                  <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center mr-4">
                    <span className="material-symbols-outlined text-on-surface-variant text-lg">{step.icon}</span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-medium text-on-surface-variant">{step.name}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info footer */}
          <div className="mt-12 text-center">
            <p className="text-sm font-medium text-on-surface-variant bg-primary-fixed/30 px-6 py-2 rounded-full inline-block">
              <span className="material-symbols-outlined align-middle mr-1 text-base">info</span>
              {currentStep || 'Initializing audit pipeline…'}
            </p>
          </div>
        </div>
      </main>

      {/* ── Fixed Bottom Progress Bar ── */}
      <div className="fixed bottom-0 left-0 w-full h-1.5 bg-surface-container z-50">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%`, boxShadow: '0 0 10px rgba(53,37,205,0.4)' }}
        />
      </div>

      {/* ── Footer ── */}
      <footer className="bg-slate-50 w-full flex flex-col md:flex-row justify-between items-center px-12 py-8 border-t border-slate-200 pb-6">
        <div className="font-bold text-slate-700">FairLens AI</div>
        <div className="text-slate-500 text-sm mt-4 md:mt-0">© 2024 FairLens AI. Sovereign Auditor Protocol.</div>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a className="text-slate-400 hover:text-slate-600 text-xs font-medium uppercase tracking-widest" href="#">Privacy Policy</a>
          <a className="text-slate-400 hover:text-slate-600 text-xs font-medium uppercase tracking-widest" href="#">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
};

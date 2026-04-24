import { useState, useCallback } from 'react';
import { useAuditStore } from '../store/auditStore';
import { useAuditStatus } from '../hooks/useAuditStatus';
import { AuditRunning } from './AuditRunning';
import { BiasScoreCard } from './BiasScoreCard';
import { SHAPChart } from './SHAPChart';
import { NarrativeReport } from './NarrativeReport';
import { ChatPanel } from './ChatPanel';
import { GroupDistributionChart } from './GroupDistributionChart';

interface AuditReportProps {
  auditId: string;
}

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'metrics', label: 'Metrics', icon: 'analytics' },
  { id: 'features', label: 'Feature Importance', icon: 'query_stats' },
  { id: 'gemini', label: 'Gemini Report', icon: 'auto_awesome' },
  { id: 'remediation', label: 'Remediation', icon: 'build' },
];

export const AuditReport = ({ auditId }: AuditReportProps) => {
  const { auditResult, isLoading } = useAuditStore();
  const [progress, setProgress] = useState(0);
  const [currentStep] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const handleComplete = useCallback(() => {
    setProgress(100);
  }, []);

  useAuditStatus(auditId, handleComplete);

  // Show progress screen while running
  if (isLoading || !auditResult || auditResult.status === 'PENDING' || auditResult.status === 'RUNNING') {
    const p = auditResult?.progress_pct ?? progress;
    const step = auditResult?.current_step ?? currentStep;
    return <AuditRunning progress={p} currentStep={step} />;
  }

  if (auditResult.status === 'FAILED') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-surface-container-lowest rounded-xl p-10 shadow-clinical intent-bar border-l-4 border-error max-w-md w-full">
          <h2 className="text-2xl font-bold text-on-background mb-3">Audit Failed</h2>
          <p className="body-md text-on-surface-variant">{auditResult.error_message || 'An unknown error occurred.'}</p>
        </div>
      </div>
    );
  }

  const { fairness_metrics = [], shap_results, dataset_info, narrative, protected_attributes = [] } = auditResult;
  const redCount = fairness_metrics.filter((m) => m.severity === 'RED').length;
  const amberCount = fairness_metrics.filter((m) => m.severity === 'AMBER').length;
  const severityLevel = redCount >= 3 ? 'HIGH' : amberCount > 0 ? 'MEDIUM' : 'LOW';

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/* ── TopNavBar ── */}
      <header className="bg-slate-50/80 backdrop-blur-xl fixed top-0 w-full z-50">
        <div className="flex justify-between items-center px-8 py-4 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-xl font-black tracking-tighter text-indigo-700 uppercase">FairLens</span>
          </div>
          <nav className="hidden md:flex gap-x-8 tracking-tight leading-snug">
            <a className="text-indigo-700 font-semibold border-b-2 border-indigo-600" href="#">Platform</a>
            <a className="text-slate-500 hover:text-indigo-600 transition-colors" href="#">Methodology</a>
            <a className="text-slate-500 hover:text-indigo-600 transition-colors" href="#">Documentation</a>
          </nav>
          <div className="flex gap-4">
            <button className="text-indigo-600 px-4 py-2 font-medium">Sign In</button>
            <button className="bg-primary-container text-on-primary-container px-6 py-2 rounded-full font-bold hover:scale-95 duration-200 transition-all">
              Get Started
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-16 min-h-screen">
        {/* ── Sidebar ── */}
        <aside className="bg-slate-50 h-screen w-64 fixed left-0 flex flex-col py-8 gap-y-2 top-16 z-40">
          <div className="px-6 mb-8">
            <h2 className="text-lg font-bold text-slate-900">Audit Session</h2>
            <p className="text-xs text-slate-500 font-medium tracking-widest uppercase">
              ID: {auditId.slice(-6).toUpperCase()}
            </p>
          </div>

          <nav className="flex-1 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              // Severity dot color for sidebar
              const dotColor = item.id === 'metrics' || item.id === 'gemini' || item.id === 'overview'
                ? (redCount > 0 ? 'bg-error' : 'bg-primary-container')
                : 'bg-secondary-container';

              return (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`w-full flex items-center px-6 py-3 transition-all group ${
                    isActive
                      ? 'text-indigo-700 font-bold bg-indigo-50 border-l-4 border-indigo-600 translate-x-1'
                      : 'text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined mr-3">{item.icon}</span>
                  <span className="label-sm font-medium tracking-widest uppercase">{item.label}</span>
                  <div className={`ml-auto w-2 h-2 rounded-full ${dotColor}`} />
                </button>
              );
            })}
          </nav>

          <div className="px-6 mt-auto">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined">add</span>
              New Audit
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="ml-64 flex-1 p-12 pr-24 bg-background">
          {/* ── Section A: Overview Banner ── */}
          <section id="overview" className="mb-12">
            <div className="bg-surface-container-lowest rounded-xl shadow-clinical p-8 flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/3 flex flex-col items-center border-r border-slate-100 pr-8">
                <span className="label-sm tracking-widest text-slate-400 mb-2">RISK ASSESSMENT</span>
                <div className={`px-6 py-3 rounded-full text-xl font-black tracking-tighter uppercase mb-4 ${
                  severityLevel === 'HIGH'
                    ? 'bg-error text-white'
                    : severityLevel === 'MEDIUM'
                    ? 'bg-yellow-400 text-yellow-900'
                    : 'bg-emerald-500 text-white'
                }`}>
                  {severityLevel} SEVERITY
                </div>
                <p className="text-center body-md text-on-surface-variant font-medium">
                  {redCount} of {fairness_metrics.length} metrics failed.
                </p>
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="headline-md font-bold text-on-surface mb-2">Audit Summary</h2>
                    <p className="body-md text-on-surface-variant max-w-md">
                      {redCount} of {fairness_metrics.length} core fairness metrics failed.{' '}
                      {protected_attributes.join(' and ')} {protected_attributes.length > 1 ? 'are' : 'is'} significant predictor{protected_attributes.length > 1 ? 's' : ''} of outcome.
                    </p>
                  </div>
                  {/* Mini radar placeholder */}
                  <div className="relative h-32 w-32 flex-shrink-0">
                    <svg className="w-full h-full text-primary opacity-20" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="0.5" />
                      <circle cx="50" cy="50" fill="none" r="30" stroke="currentColor" strokeWidth="0.5" />
                      <path d="M50 5 L95 50 L50 95 L5 50 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-slate-400">RADAR</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Section B: Fairness Metrics ── */}
          <section id="metrics" className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="title-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">balance</span>
                FAIRNESS METRICS
              </h3>
              <span className="label-sm text-slate-400">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {fairness_metrics.map((metric) => (
                <BiasScoreCard
                  key={metric.metric_name}
                  metricName={metric.metric_name}
                  value={metric.value}
                  severity={metric.severity}
                  threshold={metric.threshold}
                  description={metric.description}
                  affectedGroups={metric.affected_groups}
                />
              ))}
            </div>
          </section>

          {/* ── Section C+D: Distribution + SHAP ── */}
          <section id="features" className="mb-12">
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
              {/* Distribution Chart */}
              <div className="xl:col-span-3 bg-surface-container-lowest rounded-xl p-8 shadow-clinical">
                <h3 className="title-sm font-bold text-on-surface mb-8">Outcome Rate by Protected Group</h3>
                <GroupDistributionChart
                  protectedGroupsStats={dataset_info?.protected_groups_stats as Record<string, {
                    value_counts: Record<string, number>;
                    target_distribution_by_group: Record<string, Record<string, number>>;
                  }>}
                />
              </div>
              {/* SHAP Panel */}
              <div className="xl:col-span-2 bg-surface-container-lowest rounded-xl p-8 shadow-clinical">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="title-sm font-bold text-on-surface leading-tight">What's Driving the Model?</h3>
                  <div className="bg-secondary-container/20 text-on-secondary-container p-1 rounded">
                    <span className="material-symbols-outlined text-sm">warning</span>
                  </div>
                </div>
                <SHAPChart features={shap_results?.top_features ?? []} />
              </div>
            </div>
          </section>

          {/* ── Section E: Gemini Glass Panel ── */}
          <section id="gemini" className="mb-12">
            <div className="glass-ai rounded-2xl p-10 border-l-8 border-secondary-container">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-indigo-600 text-white px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-lg shadow-indigo-200">
                  <span className="material-symbols-outlined text-sm filled">auto_awesome</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Gemini Report</span>
                </div>
                <h2 className="headline-md font-bold text-indigo-900 tracking-tight">AI-Generated Audit Findings</h2>
              </div>
              <NarrativeReport narrative={narrative} />
              <ChatPanel auditId={auditId} />
            </div>
          </section>

          {/* ── Section F: Remediation ── */}
          <section id="remediation" className="mb-24">
            <div className="bg-surface-container-lowest rounded-xl p-10 shadow-clinical">
              <h3 className="title-sm font-bold text-on-surface mb-8 uppercase tracking-widest">Strategic Remediation Protocol</h3>
              {narrative?.remediation_steps?.length ? (
                <div className="space-y-6">
                  {narrative.remediation_steps.map((step: string, i: number) => (
                    <div key={i} className="flex gap-6 group">
                      <div className="flex-none w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center font-black text-slate-300 border border-slate-100">
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div className="flex-1 pb-6 border-b border-slate-50 last:border-0">
                        <p className="body-md text-on-surface-variant">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="body-md text-on-surface-variant">No remediation steps available.</p>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* ── Floating Export Button ── */}
      <button
        onClick={() => window.print()}
        className="fixed bottom-10 right-10 bg-primary hover:bg-primary-container text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 font-bold transition-all hover:scale-105 active:scale-95 group z-[100]"
      >
        <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">ios_share</span>
        Export Comprehensive Report
      </button>

      {/* ── Footer ── */}
      <footer className="bg-slate-50 ml-64">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 py-8 border-t border-slate-200">
          <p className="body-md text-slate-700 font-bold">© 2024 FairLens AI. Sovereign Auditor Protocol.</p>
          <div className="flex gap-8 mt-4 md:mt-0">
            <a className="text-slate-400 hover:text-indigo-600 underline" href="#">Privacy Policy</a>
            <a className="text-slate-400 hover:text-indigo-600 underline" href="#">Terms of Service</a>
            <a className="text-slate-400 hover:text-indigo-600 underline" href="#">Security Audit</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

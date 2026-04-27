import { useState } from 'react';
import { useAuditStore } from '../store/auditStore';
import { apiClient } from '../api/client';

interface AuditSetupProps {
  columns: string[];
  fileName: string;
  fileId: string;
  onAuditStart: (auditId: string) => void;
  onBack: () => void;
}

type DomainContext = 'hiring' | 'lending' | 'healthcare' | 'criminal_justice' | 'other';

const DOMAINS: { value: DomainContext; label: string }[] = [
  { value: 'hiring', label: 'Hiring' },
  { value: 'lending', label: 'Lending' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'other', label: 'Other' },
];

export const AuditSetup = ({ columns, fileName, fileId, onAuditStart, onBack }: AuditSetupProps) => {
  const { setAuditId } = useAuditStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetCol, setTargetCol] = useState('');
  const [predictionCol, setPredictionCol] = useState('');
  const [protectedAttrs, setProtectedAttrs] = useState<string[]>([]);
  const [attrDropdown, setAttrDropdown] = useState('');
  const [domain, setDomain] = useState<DomainContext>('hiring');

  const addAttribute = (attr: string) => {
    if (attr && !protectedAttrs.includes(attr)) {
      setProtectedAttrs([...protectedAttrs, attr]);
      setAttrDropdown('');
    }
  };

  const removeAttribute = (attr: string) =>
    setProtectedAttrs(protectedAttrs.filter((a) => a !== attr));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!targetCol) { setError('Target Column is required'); return; }
    if (protectedAttrs.length === 0) { setError('Select at least one Protected Attribute'); return; }

    setLoading(true);
    try {
      const response = await apiClient.post('/audit/run', {
        file_id: fileId,
        target_column: targetCol,
        prediction_column: predictionCol || undefined,
        protected_attributes: protectedAttrs,
        domain_context: domain,
      });
      const { audit_id } = response.data;
      setAuditId(audit_id);
      onAuditStart(audit_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start audit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      {/* ── TopNavBar ── */}
      <nav className="fixed top-0 w-full z-50 bg-slate-50/80 backdrop-blur-xl">
        <div className="flex justify-between items-center px-8 py-4 max-w-[1440px] mx-auto left-0 right-0">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-xl font-black tracking-tighter text-indigo-700 uppercase">FairLens</span>
          </div>
          <div className="hidden md:flex gap-x-8 items-center">
            <a className="text-slate-500 hover:text-indigo-600 tracking-tight leading-snug" href="#">Platform</a>
            <a className="text-slate-500 hover:text-indigo-600 tracking-tight leading-snug" href="#">Methodology</a>
            <a className="text-slate-500 hover:text-indigo-600 tracking-tight leading-snug" href="#">Documentation</a>
          </div>
          <div className="flex gap-x-4">
            <button onClick={onBack} className="text-slate-500 hover:text-indigo-600 px-4 py-2 text-sm font-medium">← Back</button>
          </div>
        </div>
      </nav>

      <main className="flex-grow flex items-center justify-center pt-24 pb-12 px-6">
        {/* ── Wizard Card ── */}
        <div className="w-full max-w-[600px] bg-surface-container-lowest rounded-xl p-8 md:p-12 shadow-clinical relative overflow-hidden">

          {/* Left primary intent bar */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />

          {/* ── Step Indicator ── */}
          <div className="flex justify-between items-center mb-12 relative">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-surface-container-highest -z-0" />
            {/* Step 1 — done */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-surface-container-highest border-2 border-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-sm text-outline">check</span>
              </div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-outline">Upload</span>
            </div>
            {/* Step 2 — active */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary border-4 border-primary-fixed flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-primary">Configure</span>
            </div>
            {/* Step 3 — pending */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-surface-container-lowest border-2 border-surface-container-highest flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-surface-container-highest" />
              </div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-outline">Run</span>
            </div>
          </div>

          {/* Header */}
          <div className="space-y-1 mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-on-background">Configure Your Audit</h1>
            <p className="text-sm text-on-surface-variant">Define the structural parameters for the fairness engine.</p>
            <p className="text-xs text-outline">Dataset: {fileName}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-error-container border border-error/20 rounded-lg p-4">
                <p className="text-on-error-container text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Target Column */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold tracking-wider uppercase text-on-surface-variant">
                Target Column
              </label>
              <div className="relative">
                <select
                  value={targetCol}
                  onChange={(e) => setTargetCol(e.target.value)}
                  className="w-full bg-surface-container-highest border-none rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                >
                  <option value="">Select target column…</option>
                  {columns.map((col) => <option key={col} value={col}>{col}</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <span className="material-symbols-outlined text-outline">expand_more</span>
                </div>
              </div>
            </div>

            {/* Prediction Column */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold tracking-wider uppercase text-on-surface-variant">
                Prediction Column
              </label>
              <input
                type="text"
                value={predictionCol}
                onChange={(e) => setPredictionCol(e.target.value)}
                placeholder="Leave blank if no model predictions"
                className="w-full bg-surface-container-highest border-none rounded-lg py-3 px-4 text-sm placeholder:text-outline/60 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Protected Attributes */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold tracking-wider uppercase text-on-surface-variant">
                Protected Attributes
              </label>
              <div className="min-h-[48px] bg-surface-container-highest rounded-lg p-2 flex flex-wrap gap-2 items-center">
                {protectedAttrs.map((attr) => (
                  <div key={attr} className="flex items-center bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-medium">
                    {attr}
                    <button type="button" onClick={() => removeAttribute(attr)} className="ml-1 hover:opacity-70">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                ))}
                <div className="relative flex-1 min-w-[100px]">
                  <select
                    value={attrDropdown}
                    onChange={(e) => addAttribute(e.target.value)}
                    className="w-full bg-transparent border-none text-sm py-1 focus:ring-0 appearance-none cursor-pointer text-outline"
                  >
                    <option value="">Add attribute…</option>
                    {columns.filter((c) => !protectedAttrs.includes(c)).map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Domain Context — Radio Grid */}
            <div className="space-y-3">
              <label className="block text-[11px] font-bold tracking-wider uppercase text-on-surface-variant">
                Domain Context
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {DOMAINS.map((d) => (
                  <label
                    key={d.value}
                    className={`flex items-center justify-center p-3 rounded-lg cursor-pointer transition-all ${
                      domain === d.value
                        ? 'bg-primary-fixed border-2 border-primary/20'
                        : 'bg-surface-container border-2 border-transparent hover:bg-surface-container-high'
                    }`}
                  >
                    <input
                      type="radio"
                      name="domain"
                      value={d.value}
                      checked={domain === d.value}
                      onChange={() => setDomain(d.value)}
                      className="hidden"
                    />
                    <span className="text-xs font-semibold">{d.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-4 rounded-full font-bold text-sm tracking-wide shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2 hover:-translate-y-px transition-all active:scale-95 disabled:opacity-60"
              >
                {loading ? 'Starting Audit…' : 'Run Fairness Audit'}
                {!loading && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
              </button>
              <div className="mt-4 text-center">
                <p className="text-[10px] text-outline font-medium tracking-tight">
                  Using 3 public demo datasets. No PII stored.
                </p>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center px-12 py-8">
        <div className="font-bold text-slate-700 mb-4 md:mb-0">© 2024 FairLens AI. Sovereign Auditor Protocol.</div>
        <div className="flex gap-x-8">
          <a className="text-slate-400 hover:text-slate-600 body-md" href="#">Privacy Policy</a>
          <a className="text-slate-400 hover:text-slate-600 body-md" href="#">Terms of Service</a>
          <a className="text-slate-400 hover:text-slate-600 body-md" href="#">Security Audit</a>
        </div>
      </footer>
    </div>
  );
};

import { useState } from 'react';
import { useAuditStore } from './store/auditStore';
import { AuditReport } from './components/AuditReport';
import { AuditSetup } from './components/AuditSetup';
import { apiClient } from './api/client';
import './App.css';

function App() {
  const { auditId, uploadedFile, setUploadedFile, setAuditId } = useAuditStore();
  const [columns, setColumns] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileId, setFileId] = useState<string>('');

  // Step 3: Audit in progress or complete → show report
  if (auditId) {
    return <AuditReport auditId={auditId} />;
  }

  // Step 2: File uploaded, show config form
  if (uploadedFile && columns.length > 0) {
    return (
      <AuditSetup
        columns={columns}
        fileName={uploadedFile.name}
        fileId={fileId}
        onAuditStart={(id) => setAuditId(id)}
        onBack={() => {
          setUploadedFile(null);
          setColumns([]);
          setFileId('');
          setError(null);
        }}
      />
    );
  }

  const parseCSVHeaders = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const firstLine = text.split('\n')[0];
          const headers = firstLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
          resolve(headers.filter(Boolean));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/upload/dataset', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const headers = await parseCSVHeaders(file);
      setUploadedFile(file);
      setColumns(headers);
      setFileId(res.data.file_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  // Step 1: Landing page — Sovereign Auditor design
  return (
    <div className="min-h-screen bg-background text-on-background">
      {/* ── TopNavBar ── */}
      <nav className="fixed top-0 w-full z-50 bg-slate-50/80 backdrop-blur-xl">
        <div className="flex justify-between items-center px-8 py-4 max-w-[1440px] mx-auto tracking-tight leading-snug">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-xl font-black tracking-tighter text-indigo-700 uppercase">FairLens</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a className="text-indigo-700 font-semibold border-b-2 border-indigo-600 py-1 transition-colors" href="#how">How it works</a>
            <a className="text-slate-500 hover:text-indigo-600 transition-colors" href="#methodology">Methodology</a>
            <a className="text-slate-500 hover:text-indigo-600 transition-colors" href="#docs">Documentation</a>
            <a className="text-slate-500 hover:text-indigo-600 transition-colors" href="https://github.com/KaustubhMukdam/FairLens" target="_blank" rel="noreferrer">GitHub</a>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-500 hover:text-indigo-600 font-medium px-4 py-2 transition-all">Sign In</button>
            <button
              className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-full font-bold hover:bg-primary hover:text-white transition-all shadow-sm"
              onClick={() => document.getElementById('upload-input')?.click()}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-24 px-8 max-w-[1440px] mx-auto">
        {/* ── Hero ── */}
        <header id="how" className="mb-24 flex flex-col items-center text-center max-w-4xl mx-auto scroll-mt-32">
          <span className="label-sm font-medium tracking-widest uppercase text-primary mb-6 bg-primary-fixed px-4 py-1 rounded-full">
            Sovereign AI Auditing
          </span>
          <h1 className="display-lg font-extrabold leading-[1.1] tracking-tighter text-on-background mb-8">
            Detect AI Bias Before It{' '}
            <span className="text-primary italic">Harms People</span>
          </h1>
          <p className="text-lg text-on-surface-variant leading-relaxed mb-10 max-w-2xl">
            Upload a dataset or model predictions. Get a full fairness audit powered by Google Gemini in under 60 seconds.
          </p>
          <div className="flex gap-4">
            <label htmlFor="upload-input" className="btn btn-primary flex items-center gap-2 cursor-pointer">
              <span>Start Free Audit</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </label>
            <a className="btn btn-secondary" href="#methodology">View Methodology</a>
          </div>
        </header>

        {/* ── Main Canvas ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Drop Zone */}
          <section className="lg:col-span-7">
            <div
              className={`bg-surface-container-lowest rounded-xl flex flex-col items-center justify-center p-12 border-2 border-dashed relative overflow-hidden group cursor-pointer transition-all min-h-[500px] ${
                dragOver
                  ? 'border-primary bg-primary-fixed/20'
                  : 'border-outline-variant hover:border-primary-fixed-dim hover:bg-surface-container-low'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFileUpload(file);
              }}
              onClick={() => document.getElementById('upload-input')?.click()}
            >
              {/* Ghost blobs */}
              <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-fixed blur-3xl rounded-full" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-secondary-container blur-3xl rounded-full" />
              </div>

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-primary-fixed flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: '2.5rem' }}>upload_file</span>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-on-background">Drop your CSV here</h3>
                <p className="text-on-surface-variant mb-8 font-medium">Or click to browse your computer</p>

                {uploading ? (
                  <div className="flex items-center gap-3 text-primary font-semibold">
                    <span className="material-symbols-outlined animate-clinical-spin">sync</span>
                    Uploading…
                  </div>
                ) : (
                  <div className="flex flex-wrap justify-center gap-3">
                    {['CSV & JSON', 'Parquet', 'Max 500MB'].map((tag) => (
                      <div key={tag} className="flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-lg label-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        {tag}
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <p className="mt-4 text-sm text-error font-medium">{error}</p>
                )}
              </div>

              <input
                id="upload-input"
                type="file"
                accept=".csv,.json,.parquet"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                disabled={uploading}
              />
            </div>
          </section>

          {/* Right: Demo Cards */}
          <section className="lg:col-span-5 flex flex-col gap-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="headline-md font-bold text-on-background">Interactive Demo</h2>
              <span className="label-sm text-outline tracking-widest font-bold">SELECT SCENARIO</span>
            </div>

            <DemoCard
              icon="person_search"
              iconBg="bg-secondary-container"
              iconText="text-on-secondary-container"
              intentClass="intent-bar-secondary"
              title="Hiring Model"
              description="UCI Adult Income dataset — gender & race bias"
              fileName="adult_income_sample.csv"
              onRun={handleFileUpload}
              disabled={uploading}
            />

            <DemoCard
              icon="account_balance"
              iconBg="bg-primary-fixed"
              iconText="text-primary"
              intentClass="intent-bar-primary"
              title="Lending Model"
              description="German Credit dataset — age & sex bias"
              fileName="german_credit_sample.csv"
              onRun={handleFileUpload}
              disabled={uploading}
            />

            <DemoCard
              icon="gavel"
              iconBg="bg-tertiary-fixed"
              iconText="text-on-surface-variant"
              intentClass="intent-bar-secondary"
              title="Criminal Justice"
              description="COMPAS dataset — racial bias in recidivism"
              fileName="compas_sample.csv"
              onRun={handleFileUpload}
              disabled={uploading}
            />

            {/* Gemini Badge */}
            <div className="mt-2 p-5 rounded-xl bg-primary-fixed/30 border border-primary-fixed flex items-center gap-4">
              <span className="material-symbols-outlined text-primary filled">auto_awesome</span>
              <p className="text-sm text-on-secondary-fixed-variant leading-snug">
                <strong>Gemini 2.5 Pro Enabled:</strong> Context-aware bias detection for high-stakes enterprise decisions.
              </p>
            </div>
          </section>
        </div>

        {/* ── Methodology ── */}
        <section id="methodology" className="mt-24 scroll-mt-32">
          <div className="rounded-2xl bg-white border border-slate-200 p-8 md:p-10">
            <div className="max-w-4xl">
              <p className="text-xs font-bold tracking-[0.2em] text-indigo-600 mb-3">METHODOLOGY</p>
              <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-5">How FairLens audits model fairness</h3>
              <p className="text-slate-600 leading-relaxed mb-8">
                FairLens runs a transparent fairness workflow over your uploaded dataset to identify disparate outcomes across sensitive groups.
                The audit combines statistical checks with LLM-generated explanations so teams can move from detection to remediation quickly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 p-5 bg-slate-50">
                <p className="text-sm font-bold text-slate-900 mb-2">1. Data Validation</p>
                <p className="text-sm text-slate-600">Checks schema, missing values, and target consistency before analysis begins.</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-5 bg-slate-50">
                <p className="text-sm font-bold text-slate-900 mb-2">2. Fairness Metrics</p>
                <p className="text-sm text-slate-600">Computes parity and performance gaps across protected groups for measurable bias signals.</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-5 bg-slate-50">
                <p className="text-sm font-bold text-slate-900 mb-2">3. Risk Scoring</p>
                <p className="text-sm text-slate-600">Assigns severity bands to findings so teams can prioritize what to fix first.</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-5 bg-slate-50">
                <p className="text-sm font-bold text-slate-900 mb-2">4. Explainability Layer</p>
                <p className="text-sm text-slate-600">Generates plain-language recommendations and mitigation ideas for stakeholders.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Documentation ── */}
        <section id="docs" className="mt-16 scroll-mt-32">
          <div className="rounded-2xl bg-slate-900 text-white p-8 md:p-10">
            <p className="text-xs font-bold tracking-[0.2em] text-indigo-200 mb-3">DOCUMENTATION</p>
            <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-5">Build and integrate with confidence</h3>
            <p className="text-slate-200 leading-relaxed mb-8 max-w-3xl">
              Explore setup guides, API details, and architecture docs for deploying FairLens in research and production workflows.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="https://github.com/KaustubhMukdam/FairLens#readme" target="_blank" rel="noreferrer" className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 p-5 transition-colors">
                <p className="font-bold mb-1">Getting Started</p>
                <p className="text-sm text-slate-200">Install dependencies and run frontend/backend locally.</p>
              </a>
              <a href="https://github.com/KaustubhMukdam/FairLens/tree/main/docs" target="_blank" rel="noreferrer" className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 p-5 transition-colors">
                <p className="font-bold mb-1">Technical Docs</p>
                <p className="text-sm text-slate-200">Read system design, testing, and implementation plans.</p>
              </a>
              <a href="https://github.com/KaustubhMukdam/FairLens" target="_blank" rel="noreferrer" className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 p-5 transition-colors">
                <p className="font-bold mb-1">Source Code</p>
                <p className="text-sm text-slate-200">Browse the repository, issues, and contribution history.</p>
              </a>
            </div>
          </div>
        </section>

        {/* ── Trust Bar ── */}
        <section className="mt-32 pt-16 border-t border-surface-container">
          <p className="text-center label-sm font-bold tracking-widest text-outline mb-10">TRUSTED BY SOVEREIGN AUDIT TEAMS</p>
          <div className="flex flex-wrap justify-center items-center gap-16 opacity-40 grayscale">
            {['FINTECH', 'DATA_GOV', 'AI_WATCH', 'SECURE_LABS'].map((name) => (
              <span key={name} className="text-2xl font-black italic tracking-tighter">{name}</span>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-slate-50 border-t border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 py-8 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-6 mb-6 md:mb-0">
            <span className="font-bold text-slate-700">FairLens AI</span>
            <span className="body-md text-slate-500">© 2024 FairLens AI. Sovereign Auditor Protocol.</span>
          </div>
          <div className="flex gap-8">
            <a className="text-slate-400 hover:text-slate-600 transition-all" href="#">Privacy Policy</a>
            <a className="text-slate-400 hover:text-slate-600 transition-all" href="#">Terms of Service</a>
            <a className="text-slate-400 hover:text-slate-600 transition-all" href="#">Security Audit</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Demo Card Component ── */
interface DemoCardProps {
  icon: string;
  iconBg: string;
  iconText: string;
  intentClass: string;
  title: string;
  description: string;
  fileName: string;
  onRun: (file: File) => void;
  disabled: boolean;
}

function DemoCard({ icon, iconBg, iconText, intentClass, title, description, fileName, onRun, disabled }: DemoCardProps) {
  const handleClick = async () => {
    if (disabled) return;
    try {
      const response = await fetch(`/fixtures/${fileName}`);
      if (!response.ok) throw new Error('Failed to load demo file');
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: 'text/csv' });
      onRun(file);
    } catch (err) {
      console.error('Failed to load demo:', err);
    }
  };

  return (
    <div
      className={`bg-surface-container-lowest rounded-xl p-6 intent-bar ${intentClass} transition-all hover:translate-x-1 duration-150 group cursor-pointer`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-5">
        <div className={`w-12 h-12 flex-shrink-0 rounded-lg ${iconBg} flex items-center justify-center`}>
          <span className={`material-symbols-outlined ${iconText}`}>{icon}</span>
        </div>
        <div className="flex-grow">
          <h4 className="title-sm font-bold text-on-background mb-1">{title}</h4>
          <p className="body-md text-on-surface-variant mb-4">{description}</p>
          <button
            className="text-primary font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all disabled:opacity-50"
            disabled={disabled}
          >
            {disabled ? 'Loading…' : 'Run Demo'}
            <span className="material-symbols-outlined text-lg">arrow_right_alt</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

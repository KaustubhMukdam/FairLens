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

  // Step 3: If audit is in progress or complete, show the report
  if (auditId) {
    return <AuditReport auditId={auditId} />;
  }

  // Step 2: If file is uploaded but audit not started, show config form
  if (uploadedFile && columns.length > 0) {
    return (
      <AuditSetup
        columns={columns}
        fileName={uploadedFile.name}
        onAuditStart={(id) => {
          setAuditId(id);
        }}
        onBack={() => {
          setUploadedFile(null);
          setColumns([]);
          setError(null);
        }}
      />
    );
  }

  // Helper: Parse CSV headers
  const parseCSVHeaders = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const firstLine = text.split('\n')[0];
          const headers = firstLine.split(',').map((h) => h.trim());
          resolve(headers);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      // Upload to backend
      const formData = new FormData();
      formData.append('file', file);

      await apiClient.post('/upload/dataset', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Parse headers
      const headers = await parseCSVHeaders(file);
      setUploadedFile(file);
      setColumns(headers);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to upload file';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  // Step 1: Show landing page with upload and demo options
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-indigo-600">• FAIRLENS</h1>
          <nav className="flex items-center gap-8">
            <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">
              How it works
            </a>
            <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">
              Methodology
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-gray-900 font-medium">
              GitHub
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <p className="text-sm font-semibold text-indigo-600 mb-4">SOVEREIGN AI AUDITING</p>
        <h2 className="text-5xl font-bold text-gray-900 mb-4">
          Detect AI Bias <span className="text-indigo-600">Before It Harms People</span>
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Upload a dataset or model predictions. Get a full fairness audit powered by Google Gemini in under 60 seconds.
        </p>

        {error && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          {/* Upload Zone */}
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-indigo-500 transition">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Drop your CSV here</h3>
            <p className="text-gray-600 mb-6">Or click to browse your computer</p>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              id="file-input"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                if (file) {
                  handleFileUpload(file);
                }
              }}
              disabled={uploading}
            />
            <label
              htmlFor="file-input"
              className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold cursor-pointer transition disabled:opacity-50"
            >
              {uploading ? '⏳ Uploading...' : 'Choose File'}
            </label>
            <p className="text-xs text-gray-500 mt-6">CSV format • Max 500MB</p>
          </div>

          {/* Demo Scenarios */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-900 text-left mb-4">Interactive Demo</h3>

            <DemoCard
              icon="👤"
              title="Hiring Model"
              description="UCI Adult Income dataset — gender & race bias"
              fileName="adult_income_sample.csv"
              onRun={handleFileUpload}
              disabled={uploading}
            />

            <DemoCard
              icon="🏦"
              title="Lending Model"
              description="German Credit dataset — age & sex bias"
              fileName="german_credit_sample.csv"
              onRun={handleFileUpload}
              disabled={uploading}
            />

            <DemoCard
              icon="⚖️"
              title="Criminal Justice"
              description="COMPAS dataset — racial bias in recidivism"
              fileName="compas_sample.csv"
              onRun={handleFileUpload}
              disabled={uploading}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-gray-600 text-sm">
          <p>© 2024 FairLens AI. Sovereign Auditor Protocol.</p>
        </div>
      </footer>
    </div>
  );
}

interface DemoCardProps {
  icon: string;
  title: string;
  description: string;
  fileName: string;
  onRun: (file: File) => void;
  disabled: boolean;
}

function DemoCard({ icon, title, description, fileName, onRun, disabled }: DemoCardProps) {
  const handleClick = async () => {
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
    <button
      onClick={handleClick}
      disabled={disabled}
      className="w-full bg-white rounded-lg p-4 border border-gray-200 hover:border-indigo-300 hover:shadow-md transition cursor-pointer disabled:opacity-50 text-left"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <h4 className="font-bold text-gray-900">{title}</h4>
      <p className="text-sm text-gray-600 my-2">{description}</p>
      <span className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm">
        {disabled ? '⏳ Loading...' : 'Run Demo →'}
      </span>
    </button>
  );
}

export default App;


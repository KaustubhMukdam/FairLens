import { useState } from 'react';
import { api } from '../../api/client';
import { useAuditStore } from '../../store/auditStore';

interface DemoSelectorProps {
  onDemoStart: (fileName: string) => void;
}

export const DemoSelector = ({ onDemoStart }: DemoSelectorProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setUploadedFile } = useAuditStore();

  const demos = [
    {
      id: 'hiring',
      icon: '👤',
      title: 'Hiring Model',
      description: 'UCI Adult Income dataset — gender & race bias',
      file: 'adult_income_sample.csv',
      domain: 'hiring',
    },
    {
      id: 'lending',
      icon: '🏦',
      title: 'Lending Model',
      description: 'German Credit dataset — age & sex bias',
      file: 'german_credit_sample.csv',
      domain: 'lending',
    },
    {
      id: 'criminal',
      icon: '⚖️',
      title: 'Criminal Justice',
      description: 'COMPAS dataset — racial bias in recidivism',
      file: 'compas_sample.csv',
      domain: 'criminal_justice',
    },
  ];

  const handleRunDemo = async (demo: typeof demos[0]) => {
    setLoading(demo.id);
    setError(null);

    try {
      // Fetch the CSV file
      const response = await fetch(`/fixtures/${demo.file}`);
      if (!response.ok) throw new Error('Failed to load demo file');

      const blob = await response.blob();
      const file = new File([blob], demo.file, { type: 'text/csv' });

      // Upload to backend
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await api.post('/upload/dataset', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadedFile(file);
      onDemoStart(demo.file);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to upload demo';
      setError(msg);
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-gray-900 text-left mb-4">Interactive Demo</h3>
      <p className="text-sm text-gray-600 mb-4 text-left">SELECT SCENARIO</p>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
      )}

      {demos.map((demo) => (
        <div
          key={demo.id}
          className="bg-white rounded-lg p-4 border border-gray-200 hover:border-indigo-300 hover:shadow-md transition"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-2xl mb-2">{demo.icon}</div>
              <h4 className="font-bold text-gray-900">{demo.title}</h4>
              <p className="text-sm text-gray-600 my-2">{demo.description}</p>
            </div>
            <button
              onClick={() => handleRunDemo(demo)}
              disabled={!!loading}
              className="ml-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition disabled:opacity-50 whitespace-nowrap"
            >
              {loading === demo.id ? '...' : 'Run Demo →'}
            </button>
          </div>
        </div>
      ))}

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-700 mt-4">
        ⚡ Gemini 1.5 Pro Enabled: Context-aware bias detection for high-stakes enterprise decisions.
      </div>
    </div>
  );
};
          <h3 className="font-semibold text-lg text-gray-900 mb-2">{demo.title}</h3>
          <p className="text-sm text-gray-500 text-center">{demo.desc}</p>
        </button>
      ))}
    </div>
  );
};

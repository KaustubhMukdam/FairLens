import { useState } from 'react';
import { useAuditStore } from '../store/auditStore';
import { apiClient } from '../api/client';

interface AuditSetupProps {
  columns: string[];
  fileName: string;
  onAuditStart: (auditId: string) => void;
  onBack: () => void;
}

type DomainContext = 'hiring' | 'lending' | 'healthcare' | 'other';

export const AuditSetup = ({
  columns,
  fileName,
  onAuditStart,
  onBack,
}: AuditSetupProps) => {
  const { setAuditId } = useAuditStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [targetCol, setTargetCol] = useState('');
  const [predictionCol, setPredictionCol] = useState('');
  const [protectedAttrs, setProtectedAttrs] = useState<string[]>([]);
  const [domain, setDomain] = useState<DomainContext>('other');
  const [attrDropdown, setAttrDropdown] = useState('');

  const domains: { value: DomainContext; label: string; icon: string }[] = [
    { value: 'hiring', label: 'Hiring', icon: '👤' },
    { value: 'lending', label: 'Lending', icon: '🏦' },
    { value: 'healthcare', label: 'Healthcare', icon: '⚕️' },
    { value: 'other', label: 'Other', icon: '⚙️' },
  ];

  const addAttribute = (attr: string) => {
    if (attr && !protectedAttrs.includes(attr)) {
      setProtectedAttrs([...protectedAttrs, attr]);
      setAttrDropdown('');
    }
  };

  const removeAttribute = (attr: string) => {
    setProtectedAttrs(protectedAttrs.filter((a) => a !== attr));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation
    if (!targetCol) {
      setError('Target Column is required');
      setLoading(false);
      return;
    }
    if (protectedAttrs.length === 0) {
      setError('Select at least one Protected Attribute');
      setLoading(false);
      return;
    }

    try {
      // POST /audit/run to backend
      const response = await apiClient.post('/audit/run', {
        target_column: targetCol,
        prediction_column: predictionCol || null,
        protected_attributes: protectedAttrs,
        domain_context: domain,
      });

      const { audit_id } = response.data;
      setAuditId(audit_id);
      onAuditStart(audit_id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start audit';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Configure Audit</h1>
          <p className="text-gray-600">
            {fileName} • {columns.length} columns detected
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center gap-8 mb-8">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
              ✓
            </div>
            <span className="text-xs text-gray-600 mt-2">Upload</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
              2
            </div>
            <span className="text-xs text-indigo-600 font-semibold">Configure</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center font-bold">
              3
            </div>
            <span className="text-xs text-gray-600 mt-2">Run</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Target Column */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Target Column <span className="text-red-500">*</span>
              </label>
              <select
                value={targetCol}
                onChange={(e) => setTargetCol(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select the target column...</option>
                {columns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">The column you want to audit for bias</p>
            </div>

            {/* Prediction Column */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Prediction Column (Optional)
              </label>
              <select
                value={predictionCol}
                onChange={(e) => setPredictionCol(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select prediction column...</option>
                {columns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Your model's output predictions (if available)
              </p>
            </div>

            {/* Protected Attributes */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Protected Attributes <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 mb-2">
                <select
                  value={attrDropdown}
                  onChange={(e) => addAttribute(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Add protected attribute...</option>
                  {columns
                    .filter((col) => !protectedAttrs.includes(col))
                    .map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                </select>
              </div>
              {/* Tag Chips */}
              <div className="flex flex-wrap gap-2">
                {protectedAttrs.map((attr) => (
                  <div
                    key={attr}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium flex items-center gap-2"
                  >
                    {attr}
                    <button
                      type="button"
                      onClick={() => removeAttribute(attr)}
                      className="hover:text-indigo-900 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              {protectedAttrs.length === 0 && (
                <p className="text-xs text-amber-600 mt-2">Select at least one attribute</p>
              )}
            </div>

            {/* Domain Context */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Domain Context <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {domains.map((d) => (
                  <label
                    key={d.value}
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition ${
                      domain === d.value
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="domain"
                      value={d.value}
                      checked={domain === d.value}
                      onChange={(e) => setDomain(e.target.value as DomainContext)}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="ml-3 flex items-center gap-2">
                      <span className="text-lg">{d.icon}</span>
                      <span className="font-medium text-gray-900">{d.label}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !targetCol || protectedAttrs.length === 0}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition disabled:opacity-50 text-lg"
            >
              {loading ? '⏳ Starting Audit...' : '▶️ Run Fairness Audit →'}
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={onBack}
              className="w-full py-2 text-gray-600 hover:text-gray-900 font-medium text-sm"
            >
              ← Back to Upload
            </button>
          </form>
        </div>

        {/* Disclaimer */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>
            💡 <strong>What is a fairness audit?</strong> We analyze your model's predictions
            across demographic groups to detect and quantify bias.
          </p>
          <p>Your data never leaves your organization — all processing is done on your backend.</p>
        </div>
      </div>
    </div>
  );
};

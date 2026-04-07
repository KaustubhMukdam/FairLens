import { useState, useEffect } from 'react';
import { useAuditStore } from '../store/auditStore';
import { useAuditStatus } from '../hooks/useAuditStatus';
import { BiasScoreCard } from './BiasScoreCard';
import { GroupDistributionChart } from './GroupDistributionChart';
import { SHAPChart } from './SHAPChart';
import { NarrativeReport } from './NarrativeReport';
import { ChatPanel } from './ChatPanel';
import { AuditRunning } from './AuditRunning';
import { FairnessRadar } from './FairnessRadar';

interface AuditReportProps {
  auditId: string;
}

export const AuditReport = ({ auditId }: AuditReportProps) => {
  const { auditResult, isLoading } = useAuditStore();
  const [localProgress, setLocalProgress] = useState(0);
  const [localStep, setLocalStep] = useState('');

  useAuditStatus(auditId, () => {
    setLocalProgress(100);
  });

  // Update progress from store
  useEffect(() => {
    if (auditResult) {
      setLocalProgress(auditResult.progress_pct || 0);
      setLocalStep(auditResult.current_step || '');
    }
  }, [auditResult]);

  if (isLoading || !auditResult) {
    return <AuditRunning progress={localProgress} currentStep={localStep} />;
  }

  if (auditResult.status === 'FAILED') {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md w-full border border-red-200 bg-red-50">
          <h2 className="text-xl font-bold text-red-900 mb-4">Audit Failed</h2>
          <p className="text-red-700">{auditResult.error_message || 'An error occurred during the audit'}</p>
        </div>
      </div>
    );
  }

  const { fairness_metrics, shap_results, dataset_info, narrative, protected_attributes } = auditResult;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Audit Results</h1>
              <p className="text-sm text-gray-600 mt-1">{auditResult.filename}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Target Column</p>
                <p className="font-semibold text-gray-900">{auditResult.target_column}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Protected Attributes</p>
                <p className="font-semibold text-gray-900">{protected_attributes?.join(', ')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="sticky top-20 space-y-2">
              <a href="#overview" className="block px-4 py-2 rounded-lg bg-indigo-100 text-indigo-900 font-semibold text-sm">
                Overview
              </a>
              <a href="#metrics" className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-semibold text-sm">
                Fairness Metrics
              </a>
              <a href="#shap" className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-semibold text-sm">
                Feature Importance
              </a>
              <a href="#narrative" className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-semibold text-sm">
                AI Report
              </a>
              <a href="#chat" className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-semibold text-sm">
                Q&A
              </a>
              <button className="w-full mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition">
                Export Report
              </button>
            </nav>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            <section id="overview" className="space-y-6">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Overall Bias Severity</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {fairness_metrics.filter((m) => m.severity === 'RED').length} of {fairness_metrics.length} metrics failed
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-block px-4 py-2 rounded-lg font-bold ${
                      fairness_metrics.filter((m) => m.severity === 'RED').length >= 3
                        ? 'bg-red-100 text-red-900'
                        : fairness_metrics.filter((m) => m.severity === 'AMBER').length > 0
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-green-100 text-green-900'
                    }`}>
                      {fairness_metrics.filter((m) => m.severity === 'RED').length >= 3
                        ? 'HIGH SEVERITY'
                        : fairness_metrics.filter((m) => m.severity === 'AMBER').length > 0
                          ? 'MEDIUM SEVERITY'
                          : 'LOW SEVERITY'}
                    </div>
                  </div>
                </div>
              </div>
              <FairnessRadar result={auditResult} />
            </section>

            {/* Fairness Metrics */}
            <section id="metrics">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Fairness Metrics</h2>
              <div className="grid grid-cols-1 gap-4">
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

            {/* Charts */}
            <section id="shap" className="space-y-6">
              <GroupDistributionChart protectedGroupsStats={dataset_info.protected_groups_stats as Record<string, {
                value_counts: Record<string, number>;
                target_distribution_by_group: Record<string, Record<string, number>>;
              }>} />
              <SHAPChart features={shap_results.top_features} />
            </section>

            {/* Narrative */}
            <section id="narrative">
              <NarrativeReport narrative={narrative} />
            </section>

            {/* Chat */}
            <section id="chat">
              <ChatPanel auditId={auditId} />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

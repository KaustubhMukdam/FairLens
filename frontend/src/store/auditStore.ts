import { create } from 'zustand';

export interface AuditResult {
  audit_id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED';
  file_id: string;
  filename: string;
  target_column: string;
  protected_attributes: string[];
  dataset_info: {
    missing_values: Record<string, number>;
    class_imbalance_ratio: number;
    target_distribution: Record<string, number>;
    protected_groups_stats: Record<string, unknown>;
  };
  fairness_metrics: Array<{
    metric_name: string;
    value: number;
    severity: 'GREEN' | 'AMBER' | 'RED';
    threshold: string;
    affected_groups: string[];
    description: string;
  }>;
  shap_results: {
    top_features: Array<{
      feature_name: string;
      mean_abs_shap: number;
      is_protected_attribute: boolean;
    }>;
    protected_attr_in_top_k: boolean;
    protected_attrs_found: string[];
  };
  narrative: {
    summary: string;
    severity_rating: 'HIGH' | 'MEDIUM' | 'LOW';
    affected_groups: string[];
    root_cause_analysis: string;
    remediation_steps: string[];
    plain_english_explanation: string;
  };
  progress_pct: number;
  current_step: string;
  error_message: string | null;
  created_at: string | null;
  completed_at: string | null;
}

interface AuditStore {
  auditId: string | null;
  auditResult: AuditResult | null;
  uploadedFile: File | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setAuditId: (id: string) => void;
  setAuditResult: (result: AuditResult) => void;
  setUploadedFile: (file: File | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAuditStore = create<AuditStore>((set) => ({
  auditId: null,
  auditResult: null,
  uploadedFile: null,
  isLoading: false,
  error: null,

  setAuditId: (id: string) => set({ auditId: id }),
  setAuditResult: (result: AuditResult) => set({ auditResult: result }),
  setUploadedFile: (file: File | null) => set({ uploadedFile: file }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  reset: () => set({
    auditId: null,
    auditResult: null,
    uploadedFile: null,
    isLoading: false,
    error: null,
  }),
}));

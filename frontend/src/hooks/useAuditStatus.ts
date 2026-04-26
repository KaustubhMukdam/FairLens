import { useEffect, useCallback, useRef } from 'react';
import { useAuditStore, type AuditResult } from '../store/auditStore';
import { apiClient } from '../api/client';

export const useAuditStatus = (auditId: string | null, onComplete?: (result: AuditResult) => void) => {
  const { setAuditResult, setLoading, setError } = useAuditStore();
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const fetchStatus = useCallback(async () => {
    if (!auditId) return;

    try {
      // First, get status
      const statusRes = await apiClient.get(`/audit/${auditId}/status`);
      const { status, progress_pct, current_step, error_message } = statusRes.data;

      if (status === 'PENDING' || status === 'RUNNING') {
        const runningResult: AuditResult = {
          audit_id: auditId,
          status,
          file_id: '',
          filename: '',
          target_column: '',
          protected_attributes: [],
          dataset_info: {
            missing_values: {},
            class_imbalance_ratio: 0,
            target_distribution: {},
            protected_groups_stats: {},
          },
          fairness_metrics: [],
          shap_results: {
            top_features: [],
            protected_attr_in_top_k: false,
            protected_attrs_found: [],
          },
          narrative: {
            summary: '',
            severity_rating: 'LOW',
            affected_groups: [],
            root_cause_analysis: '',
            remediation_steps: [],
            plain_english_explanation: '',
          },
          progress_pct: progress_pct ?? 0,
          current_step: current_step ?? 'running',
          error_message: error_message ?? null,
          created_at: null,
          completed_at: null,
        };

        setAuditResult(runningResult);
        return false; // Continue polling
      }

      if (status === 'FAILED') {
        const failedResult: AuditResult = {
          audit_id: auditId,
          status: 'FAILED',
          file_id: '',
          filename: '',
          target_column: '',
          protected_attributes: [],
          dataset_info: {
            missing_values: {},
            class_imbalance_ratio: 0,
            target_distribution: {},
            protected_groups_stats: {},
          },
          fairness_metrics: [],
          shap_results: {
            top_features: [],
            protected_attr_in_top_k: false,
            protected_attrs_found: [],
          },
          narrative: {
            summary: '',
            severity_rating: 'LOW',
            affected_groups: [],
            root_cause_analysis: '',
            remediation_steps: [],
            plain_english_explanation: '',
          },
          progress_pct: progress_pct ?? 0,
          current_step: current_step ?? 'failed',
          error_message: error_message ?? 'Audit failed',
          created_at: null,
          completed_at: null,
        };

        setAuditResult(failedResult);
        setLoading(false);
        return true;
      }

      // If complete, fetch full results
      if (status === 'COMPLETE') {
        const resultRes = await apiClient.get(`/audit/${auditId}`);
        setAuditResult(resultRes.data);
        setLoading(false);

        if (onCompleteRef.current) {
          onCompleteRef.current(resultRes.data);
        }

        return true; // Signal to stop polling
      }

      return false; // Continue polling
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch audit status';
      setError(errorMsg);
      setLoading(false);
      return true; // Stop polling on error
    }
  }, [auditId, setAuditResult, setLoading, setError]);

  useEffect(() => {
    if (!auditId) return;

    setLoading(true);
    let pollingInterval: ReturnType<typeof setInterval>;

    // Fetch immediately
    fetchStatus().then((shouldStop) => {
      if (!shouldStop) {
        // Then poll every 2 seconds
        pollingInterval = setInterval(async () => {
          const shouldStop = await fetchStatus();
          if (shouldStop) {
            clearInterval(pollingInterval);
          }
        }, 2000);
      }
    });

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [auditId, fetchStatus, setLoading]);
};

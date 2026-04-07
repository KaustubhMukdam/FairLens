import { useEffect, useCallback } from 'react';
import { useAuditStore, type AuditResult } from '../store/auditStore';
import { apiClient } from '../api/client';

export const useAuditStatus = (auditId: string | null, onComplete?: (result: AuditResult) => void) => {
  const { setAuditResult, setLoading, setError } = useAuditStore();

  const fetchStatus = useCallback(async () => {
    if (!auditId) return;

    try {
      // First, get status
      const statusRes = await apiClient.get(`/audit/${auditId}/status`);
      const { status } = statusRes.data;

      // If complete, fetch full results
      if (status === 'COMPLETE' || status === 'FAILED') {
        const resultRes = await apiClient.get(`/audit/${auditId}`);
        setAuditResult(resultRes.data);
        setLoading(false);

        if (onComplete) {
          onComplete(resultRes.data);
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
  }, [auditId, setAuditResult, setLoading, setError, onComplete]);

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

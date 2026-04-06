from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.models.metrics import MetricResult, SHAPResult

class AuditStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETE = "COMPLETE"
    FAILED = "FAILED"

class UploadResponse(BaseModel):
    file_id: str
    filename: str
    columns: List[str]
    row_count: int

class AuditRequest(BaseModel):
    file_id: str
    target_column: str
    protected_attributes: List[str]
    prediction_column: Optional[str] = None
    domain_context: Optional[str] = None  # e.g., "hiring", "lending", "healthcare"

class AuditResult(BaseModel):
    """Complete audit result schema with all metrics and explanations."""
    audit_id: str
    status: AuditStatus
    file_id: str
    filename: str
    target_column: str
    protected_attributes: List[str]
    
    # Dataset info
    dataset_info: Optional[Dict[str, Any]] = None  # Results from dataset_scanner
    
    # Fairness metrics
    fairness_metrics: Optional[List[MetricResult]] = None
    
    # SHAP explainability
    shap_results: Optional[SHAPResult] = None
    
    # Progress tracking
    progress_pct: int = 0
    current_step: Optional[str] = None  # "scanning", "metrics", "shap", "complete"
    
    # Error tracking
    error_message: Optional[str] = None
    
    # Timestamps
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    completed_at: Optional[str] = None

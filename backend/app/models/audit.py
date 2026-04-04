from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

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

class AuditResult(BaseModel):
    # Shell schema for now. Will be populated in Phase 2 & 5.
    status: AuditStatus
    results: Optional[Dict[str, Any]] = None

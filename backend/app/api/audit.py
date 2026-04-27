"""
Audit Orchestration API
=======================

Main endpoint for running complete fairness audits on uploaded datasets.
Coordinates the full pipeline:
1. Download dataset from GCS
2. Parse and validate data
3. Scan dataset for basic statistics
4. Compute fairness metrics
5. Compute SHAP explainability
6. Store results and return audit_id

The endpoint runs asynchronously as a background task to avoid blocking.
"""

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from fastapi.responses import JSONResponse
from datetime import datetime
import traceback
import uuid
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError

import pandas as pd
from app.models.audit import AuditRequest, AuditResult, AuditStatus
from app.services.gcs_service import download_file
from app.utils.file_parser import parse_csv, validate_columns
from app.core.dataset_scanner import scan_dataset
from app.core.bias_detector import compute_fairness_metrics
from app.core.shap_explainer import explain_predictions
from app.services.firestore_service import get_firestore_service
from app.services.gemini_service import generate_audit_narrative
from app.config import settings

router = APIRouter(prefix="/audit", tags=["audit"])


def _parse_csv_with_timeout(file_bytes: bytes, timeout_seconds: int) -> pd.DataFrame:
    """Parse CSV in a worker thread so stalled parses fail fast with a clear error."""
    executor = ThreadPoolExecutor(max_workers=1)
    future = executor.submit(parse_csv, file_bytes)
    try:
        return future.result(timeout=timeout_seconds)
    except FuturesTimeoutError as exc:
        future.cancel()
        raise TimeoutError(
            f"CSV parsing exceeded {timeout_seconds}s. Try a smaller file or fewer columns."
        ) from exc
    finally:
        executor.shutdown(wait=False, cancel_futures=True)


def _run_audit_pipeline(
    audit_id: str,
    file_id: str,
    target_column: str,
    protected_attributes: list[str],
    prediction_column: str = None,
    filename: str = None,
    request: AuditRequest = None
):
    """
    Background task that runs the complete audit pipeline.
    Updates Firestore with progress at each step.
    """
    fs = get_firestore_service()
    
    try:
        # Step 1: Initialize audit record
        fs.update_audit(audit_id, {
            "status": AuditStatus.RUNNING.value,
            "progress_pct": 5,
            "current_step": "downloading"
        })
        
        # Step 2: Download file from GCS
        try:
            file_bytes = download_file(file_id)
        except Exception as e:
            raise RuntimeError(f"Failed to download file: {str(e)}")
        
        # Step 3: Parse CSV
        fs.update_audit(audit_id, {
            "progress_pct": 15,
            "current_step": "parsing"
        })
        
        try:
            df = _parse_csv_with_timeout(file_bytes, settings.csv_parse_timeout_seconds)
        except Exception as e:
            raise ValueError(f"Failed to parse CSV: {str(e)}")
        
        # Validate required columns exist
        required_cols = [target_column] + protected_attributes
        if prediction_column:
            required_cols.append(prediction_column)
        validate_columns(df, required_cols)
        
        # Step 4: Basic data quality checks
        if len(df) < settings.min_audit_rows:
            raise ValueError(
                f"Dataset must have at least {settings.min_audit_rows} rows"
            )
        
        if df[target_column].nunique() > 2:
            raise ValueError("Target column must be binary classification")
        
        # Step 5: Dataset Scanner
        fs.update_audit(audit_id, {
            "progress_pct": 30,
            "current_step": "scanning_dataset"
        })
        
        dataset_info = scan_dataset(df, protected_attributes, target_column)
        
        # Step 6: Prepare data for metrics
        y_true = df[target_column]
        
        # If no prediction column provided, use simple heuristic or raise error
        if prediction_column and prediction_column in df.columns:
            y_pred = df[prediction_column]
        else:
            # For demo purposes, use a simple model
            # Train a decision tree as prediction proxy
            from sklearn.tree import DecisionTreeClassifier
            from sklearn.preprocessing import LabelEncoder
            
            X = df.drop(columns=[target_column] + protected_attributes, errors='ignore')
            # Encode categorical columns
            for col in X.select_dtypes(include=['object']).columns:
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col].astype(str))
            # Fill missing
            X = X.fillna(X.mean(numeric_only=True))
            
            if X.empty:
                # If no features left, use first protected attribute as proxy
                y_pred = pd.Series([1] * len(df))
            else:
                tree = DecisionTreeClassifier(max_depth=2, random_state=42)
                tree.fit(X, y_true)
                y_pred = pd.Series(tree.predict(X))
        
        sensitive_features = df[protected_attributes]
        
        # Step 7: Compute Fairness Metrics
        fs.update_audit(audit_id, {
            "progress_pct": 55,
            "current_step": "computing_metrics"
        })
        
        try:
            # Prepare X for individual fairness computation
            X = df.drop(columns=[target_column] + protected_attributes, errors='ignore')
            for col in X.select_dtypes(include=['object']).columns:
                from sklearn.preprocessing import LabelEncoder
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col].astype(str))
            X = X.fillna(X.mean(numeric_only=True))
            
            metrics = compute_fairness_metrics(
                y_true,
                y_pred,
                sensitive_features,
                X=X if not X.empty else None
            )
        except Exception as e:
            print(f"Error computing metrics: {e}")
            metrics = []
        
        # Step 8: Compute SHAP Explainability
        fs.update_audit(audit_id, {
            "progress_pct": 75,
            "current_step": "computing_shap"
        })
        
        try:
            shap_results = explain_predictions(
                df,
                target_column,
                protected_attributes
            )
        except Exception as e:
            print(f"Error computing SHAP: {e}")
            from app.models.metrics import SHAPResult
            shap_results = SHAPResult(
                top_features=[],
                protected_attr_in_top_k=False,
                protected_attrs_found=[]
            )
        
        # Step 9: Generate Gemini Narrative
        fs.update_audit(audit_id, {
            "progress_pct": 90,
            "current_step": "generating_narrative"
        })
        
        narrative = None
        try:
            # Prepare audit data for Gemini
            audit_data = {
                "target_column": target_column,
                "protected_attributes": protected_attributes,
                "dataset_info": dataset_info,
                "fairness_metrics": [m.model_dump() for m in metrics] if metrics else [],
                "shap_results": shap_results.model_dump() if shap_results else {},
                "domain_context": getattr(request, 'domain_context', None) or 'general'
            }
            narrative = generate_audit_narrative(audit_data)
        except Exception as e:
            print(f"Error generating Gemini narrative: {e}")
            narrative = None
        
        # Step 10: Assemble complete result
        audit_result = AuditResult(
            audit_id=audit_id,
            status=AuditStatus.COMPLETE,
            file_id=file_id,
            filename=filename or "unknown",
            target_column=target_column,
            protected_attributes=protected_attributes,
            dataset_info=dataset_info,
            fairness_metrics=metrics,
            shap_results=shap_results,
            narrative=narrative,
            progress_pct=95,
            current_step="storing_results",
            completed_at=datetime.utcnow().isoformat()
        )
        
        # Step 11: Store results in Firestore
        fs.update_audit(audit_id, {
            "status": AuditStatus.COMPLETE.value,
            "progress_pct": 100,
            "current_step": "complete",
            "completed_at": datetime.utcnow().isoformat(),
            "results": audit_result.model_dump()
        })
    
    except Exception as e:
        # Update with error status
        error_msg = str(e)
        traceback_str = traceback.format_exc()
        print(f"ERROR in audit pipeline {audit_id}: {error_msg}\n{traceback_str}")
        
        fs.update_audit(audit_id, {
            "status": AuditStatus.FAILED.value,
            "progress_pct": 0,
            "current_step": "failed",
            "error_message": error_msg,
            "completed_at": datetime.utcnow().isoformat()
        })


@router.post("/run", response_model=dict)
async def run_audit(request: AuditRequest, background_tasks: BackgroundTasks):
    """
    Trigger a new fairness audit on an uploaded dataset.
    
    Returns immediately with audit_id for polling status.
    Actual computation happens in background task.
    
    Args:
        request: AuditRequest with file_id, target_column, protected_attributes
        background_tasks: FastAPI background tasks
    
    Returns:
        {audit_id: str, status: "PENDING"}
    
    Raises:
        HTTPException: If file_id not found or invalid request
    """
    try:
        # Validate request
        if not request.file_id or not request.target_column or not request.protected_attributes:
            raise HTTPException(
                status_code=400,
                detail="file_id, target_column, and protected_attributes are required"
            )
        
        if len(request.protected_attributes) == 0:
            raise HTTPException(
                status_code=400,
                detail="At least one protected attribute must be specified"
            )
        
        # Generate audit ID
        audit_id = f"audit_{uuid.uuid4().hex[:12]}"
        
        # Initialize audit in Firestore
        fs = get_firestore_service()
        fs.create_audit(
            audit_id,
            file_id=request.file_id,
            target_column=request.target_column,
            protected_attributes=request.protected_attributes,
            prediction_column=request.prediction_column,
            domain_context=request.domain_context
        )
        
        # Queue background task
        background_tasks.add_task(
            _run_audit_pipeline,
            audit_id=audit_id,
            file_id=request.file_id,
            target_column=request.target_column,
            protected_attributes=request.protected_attributes,
            prediction_column=request.prediction_column,
            filename=request.file_id,
            request=request
        )
        
        return {
            "audit_id": audit_id,
            "status": AuditStatus.PENDING.value,
            "message": "Audit initiated. Use /audit/{audit_id}/status to check progress."
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in run_audit: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{audit_id}/status", response_model=dict)
async def get_audit_status(audit_id: str):
    """
    Poll the status and progress of an ongoing audit.
    
    Args:
        audit_id: Audit identifier from /audit/run response
    
    Returns:
        {
            audit_id: str,
            status: "PENDING" | "RUNNING" | "COMPLETE" | "FAILED",
            progress_pct: int (0-100),
            current_step: str,
            error_message: optional str
        }
    """
    fs = get_firestore_service()
    audit = fs.get_audit(audit_id)
    
    if not audit:
        raise HTTPException(status_code=404, detail=f"Audit {audit_id} not found")
    
    return {
        "audit_id": audit_id,
        "status": audit.get("status", "UNKNOWN"),
        "progress_pct": audit.get("progress_pct", 0),
        "current_step": audit.get("current_step"),
        "error_message": audit.get("error_message")
    }


@router.get("/{audit_id}", response_model=dict)
async def get_audit_result(audit_id: str):
    """
    Retrieve the complete audit results.
    
    Args:
        audit_id: Audit identifier
    
    Returns:
        Complete AuditResult with all metrics, SHAP, and dataset info
    
    Raises:
        HTTPException 404: Audit not found
        HTTPException 202: Audit still running
    """
    fs = get_firestore_service()
    audit = fs.get_audit(audit_id)
    
    if not audit:
        raise HTTPException(status_code=404, detail=f"Audit {audit_id} not found")
    
    status = audit.get("status")
    
    if status == AuditStatus.PENDING.value or status == AuditStatus.RUNNING.value:
        return JSONResponse(
            status_code=202,
            content={
                "audit_id": audit_id,
                "status": status,
                "progress_pct": audit.get("progress_pct", 0),
                "message": "Audit is still running. Please retry in a few seconds."
            }
        )
    
    if status == AuditStatus.FAILED.value:
        return {
            "audit_id": audit_id,
            "status": AuditStatus.FAILED.value,
            "file_id": audit.get("file_id", ""),
            "filename": audit.get("filename") or audit.get("file_id", ""),
            "target_column": audit.get("target_column", ""),
            "protected_attributes": audit.get("protected_attributes", []),
            "dataset_info": audit.get("dataset_info") or {
                "missing_values": {},
                "class_imbalance_ratio": 0,
                "target_distribution": {},
                "protected_groups_stats": {}
            },
            "fairness_metrics": audit.get("fairness_metrics") or [],
            "shap_results": audit.get("shap_results") or {
                "top_features": [],
                "protected_attr_in_top_k": False,
                "protected_attrs_found": []
            },
            "narrative": audit.get("narrative") or {
                "summary": "",
                "severity_rating": "LOW",
                "affected_groups": [],
                "root_cause_analysis": "",
                "remediation_steps": [],
                "plain_english_explanation": ""
            },
            "progress_pct": audit.get("progress_pct", 0),
            "current_step": audit.get("current_step", "failed"),
            "error_message": audit.get("error_message", "Unknown error"),
            "created_at": audit.get("created_at"),
            "completed_at": audit.get("completed_at")
        }
    
    # Return complete results
    results = audit.get("results", {})
    return results


@router.get("", response_model=list)
async def list_recent_audits(limit: int = Query(50, ge=1, le=100)):
    """
    List recent audit sessions (for dashboard/history).
    
    Args:
        limit: Maximum number of audits to return (1-100)
    
    Returns:
        List of audit summaries (status, progress, timestamps)
    """
    fs = get_firestore_service()
    audits = fs.list_audits(limit=limit)
    
    return [
        {
            "audit_id": audit.get("audit_id"),
            "status": audit.get("status"),
            "progress_pct": audit.get("progress_pct"),
            "created_at": audit.get("created_at"),
            "completed_at": audit.get("completed_at"),
            "target_column": audit.get("target_column"),
            "protected_attributes": audit.get("protected_attributes")
        }
        for audit in audits
    ]


@router.delete("/{audit_id}")
async def delete_audit(audit_id: str):
    """
    Delete an audit session (cleanup).
    
    Args:
        audit_id: Audit identifier
    
    Returns:
        {message: "Audit deleted"}
    """
    fs = get_firestore_service()
    fs.delete_audit(audit_id)
    
    return {"message": f"Audit {audit_id} deleted"}

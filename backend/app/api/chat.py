"""
Chat API Endpoint for FairLens
===============================

Handles follow-up questions about audits using Gemini with full audit context.
"""

from fastapi import APIRouter, HTTPException, Path
from app.models.chat import ChatRequest, ChatResponse
from app.services.gemini_service import answer_audit_question
from app.services.firestore_service import get_firestore_service
from typing import Dict, Any

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/{audit_id}", response_model=ChatResponse)
async def chat_about_audit(
    audit_id: str = Path(..., description="Audit ID to query"),
    request: ChatRequest = None
) -> ChatResponse:
    """
    Answer a question about a specific audit using Gemini.
    
    Takes the user's question, retrieves the full audit from Firestore,
    and calls Gemini to answer with complete audit context.
    
    Args:
        audit_id: Audit identifier from /audit/run response
        request: ChatRequest with question
    
    Returns:
        ChatResponse with answer from Gemini
    
    Raises:
        HTTPException: If audit not found or Gemini fails
    """
    if not request or not request.question:
        raise HTTPException(
            status_code=400,
            detail="question field is required"
        )
    
    # Fetch audit from Firestore
    fs = get_firestore_service()
    audit_data = fs.get_audit(audit_id)
    
    if not audit_data:
        raise HTTPException(
            status_code=404,
            detail=f"Audit {audit_id} not found"
        )
    
    # Check if audit is complete
    status = audit_data.get("status", "unknown")
    if status != "COMPLETE":
        raise HTTPException(
            status_code=202,
            detail=f"Audit still {status}. Please wait for completion before asking questions."
        )
    
    # Get answer from Gemini
    try:
        # The actual metrics and narrative are stored under the "results" key in Firestore
        audit_results = audit_data.get("results", {})
        
        # Copy domain_context from root if it exists
        if "domain_context" in audit_data and "domain_context" not in audit_results:
            audit_results["domain_context"] = audit_data["domain_context"]
            
        answer = answer_audit_question(audit_results, request.question)
        return ChatResponse(answer=answer, audit_id=audit_id)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate answer: {str(e)}"
        )


@router.get("/{audit_id}/suggested-questions", response_model=Dict[str, list])
async def get_suggested_questions(
    audit_id: str = Path(..., description="Audit ID")
):
    """
    Get suggested questions for an audit based on its results.
    
    Returns a list of pre-generated questions relevant to the audit findings.
    """
    fs = get_firestore_service()
    audit_data = fs.get_audit(audit_id)
    
    if not audit_data:
        raise HTTPException(status_code=404, detail=f"Audit {audit_id} not found")
    
    # Extract key info for questions
    protected_attrs = audit_data.get("protected_attributes", [])
    highest_metric = _find_highest_severity_metric(audit_data)
    
    questions = [
        "Which groups are most affected by unfairness in this model?",
        "What are the main causes of the fairness issues detected?",
        "What concrete steps can we take to address these fairness violations?",
    ]
    
    # Add domain-specific questions
    if protected_attrs:
        questions.append(
            f"How does the model treat {protected_attrs[0]} differently from other groups?"
        )
    
    if highest_metric:
        questions.append(
            f"Why is the {highest_metric} metric showing a violation?"
        )
    
    return {"suggested_questions": questions[:5]}


def _find_highest_severity_metric(audit_data: Dict[str, Any]) -> str:
    """Find the metric with highest severity."""
    metrics = audit_data.get("fairness_metrics", [])
    if not metrics:
        return ""
    
    severity_order = {"RED": 3, "AMBER": 2, "GREEN": 1}
    highest = max(
        metrics,
        key=lambda m: severity_order.get(m.get("severity", "GREEN"), 0)
    )
    return highest.get("metric_name", "")

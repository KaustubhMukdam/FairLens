"""
Gemini Service for FairLens
============================

Generates structured audit narratives and answers follow-up questions using
Google Gemini 1.5 Pro via Vertex AI.

Key Functions:
- generate_audit_narrative: Creates structured JSON audit report
- answer_audit_question: Answers follow-up questions with audit context
"""

import json
import os
import vertexai
from vertexai.generative_models import GenerativeModel, Content, Part
from typing import Dict, Any, Optional
from app.config import settings


_vertexai_initialized = False


def _init_vertexai():
    """Initialize Vertex AI with project credentials."""
    global _vertexai_initialized
    
    if _vertexai_initialized:
        return
    
    try:
        # Ensure GOOGLE_APPLICATION_CREDENTIALS is set
        if 'GOOGLE_APPLICATION_CREDENTIALS' not in os.environ:
            from pathlib import Path
            creds_path = Path('./service-account.json')
            if creds_path.exists():
                os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = str(creds_path.resolve())
                print(f"Set GOOGLE_APPLICATION_CREDENTIALS to {creds_path.resolve()}")
        
        # Verify credentials file exists
        creds_file = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
        if not creds_file or not os.path.exists(creds_file):
            raise ValueError(f"Credentials file not found: {creds_file}")
        
        print(f"Initializing Vertex AI with project: {settings.google_cloud_project}")
        vertexai.init(
            project=settings.google_cloud_project,
            location=settings.vertex_ai_location
        )
        _vertexai_initialized = True
        print("Vertex AI initialized successfully")
        
    except Exception as e:
        print(f"Warning: Vertex AI initialization failed: {e}")
        print(f"GOOGLE_APPLICATION_CREDENTIALS: {os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')}")
        print("Gemini features will not be available.")


def generate_audit_narrative(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a structured plain-language audit narrative using Gemini.
    
    Args:
        audit_data: Complete audit result containing:
            - target_column: Name of target being predicted
            - protected_attributes: List of protected attribute names
            - dataset_info: Dataset statistics from scanner
            - fairness_metrics: List of 5 metric results
            - shap_results: Top SHAP features
            - domain_context: Optional domain (hiring, lending, criminal_justice)
    
    Returns:
        {
            "summary": "Executive summary",
            "severity_rating": "HIGH|MEDIUM|LOW",
            "affected_groups": ["group1", "group2", ...],
            "root_cause_analysis": "Analysis of why bias exists",
            "remediation_steps": [
                "Step 1: ...",
                "Step 2: ...",
            ],
            "plain_english_explanation": "Detailed explanation"
        }
    """
    try:
        _init_vertexai()
        
        # Construct context prompt from audit data
        prompt = _build_audit_context_prompt(audit_data)
        
        # Get domain context if available
        domain = audit_data.get("domain_context", "general")
        
        system_prompt = f"""You are an expert AI fairness auditor. Your role is to analyze machine learning model audits and provide clear, actionable insights.

Domain: {domain}
Target Variable: {audit_data.get('target_column', 'unknown')}
Protected Attributes: {', '.join(audit_data.get('protected_attributes', []))}

Analyze the audit data below and provide a structured JSON response with the following fields:
- summary: Executive summary (2-3 sentences)
- severity_rating: One of HIGH, MEDIUM, LOW based on metric violations
- affected_groups: List of groups disproportionately affected
- root_cause_analysis: Why fairness issues exist (consider feature importance from SHAP)
- remediation_steps: List of 3-5 concrete steps to address fairness issues
- plain_english_explanation: Detailed explanation of findings for non-technical stakeholders

Be specific about groups and metrics. Reference actual violation values where available."""

        full_prompt = f"{system_prompt}\n\nAudit Data:\n{prompt}\n\nProvide response as valid JSON only, no markdown."
        
        # Call Gemini 1.5 Pro
        model = GenerativeModel("gemini-1.5-pro")
        
        response = model.generate_content(
            full_prompt,
            generation_config={
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 2048,
            }
        )
        
        # Parse response
        response_text = response.text.strip()
        
        # Clean up markdown code blocks if present
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
            response_text = response_text.strip()
        if response_text.endswith("```"):
            response_text = response_text[:-3].strip()
        
        narrative = json.loads(response_text)
        
        # Ensure required fields
        narrative.setdefault("summary", "Unable to generate summary")
        narrative.setdefault("severity_rating", "MEDIUM")
        narrative.setdefault("affected_groups", [])
        narrative.setdefault("root_cause_analysis", "")
        narrative.setdefault("remediation_steps", [])
        narrative.setdefault("plain_english_explanation", "")
        
        return narrative
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error in Gemini response: {e}")
        return _fallback_narrative()
    except Exception as e:
        print(f"Error calling Gemini: {e}")
        return _fallback_narrative()


def answer_audit_question(
    audit_data: Dict[str, Any],
    question: str
) -> str:
    """
    Answer a follow-up question about an audit using Gemini with full audit context.
    
    Args:
        audit_data: Complete audit result
        question: User's question about the audit
    
    Returns:
        Plain-text answer from Gemini
    """
    try:
        _init_vertexai()
        
        # Build audit context
        context = _build_audit_context_prompt(audit_data)
        
        system_prompt = f"""You are an expert AI fairness auditor answering questions about a model audit.

Protected Attributes: {', '.join(audit_data.get('protected_attributes', []))}
Target Variable: {audit_data.get('target_column', 'unknown')}

Answer the user's question based on the audit data provided below. Be specific and reference actual numbers/metrics when available. Keep response concise (2-3 paragraphs max)."""

        full_prompt = f"{system_prompt}\n\nAudit Data:\n{context}\n\nQuestion: {question}"
        
        model = GenerativeModel("gemini-1.5-pro")
        
        response = model.generate_content(
            full_prompt,
            generation_config={
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 1024,
            }
        )
        
        return response.text.strip()
        
    except Exception as e:
        print(f"Error answering question via Gemini: {e}")
        return f"I encountered an error processing your question: {str(e)}"


def _build_audit_context_prompt(audit_data: Dict[str, Any]) -> str:
    """Build a formatted prompt from audit data."""
    lines = []
    
    # Dataset info
    if "dataset_info" in audit_data:
        info = audit_data["dataset_info"]
        lines.append("## Dataset Statistics")
        lines.append(f"- Total Rows: {info.get('total_rows', 'Unknown')}")
        lines.append(f"- Missing Values: {info.get('missing_values', {})}")
        lines.append(f"- Class Imbalance Ratio: {info.get('class_imbalance_ratio', 'Unknown')}")
        lines.append("")
    
    # Metrics
    if "fairness_metrics" in audit_data:
        lines.append("## Fairness Metrics")
        for metric in audit_data["fairness_metrics"]:
            name = metric.get("metric_name", "Unknown")
            value = metric.get("value", "N/A")
            severity = metric.get("severity", "Unknown")
            lines.append(f"- {name}: {value:.4f} ({severity})")
        lines.append("")
    
    # SHAP features
    if "shap_results" in audit_data:
        shap_data = audit_data["shap_results"]
        lines.append("## Top SHAP Features (Feature Importance)")
        if "top_features" in shap_data:
            for i, feature in enumerate(shap_data["top_features"][:5], 1):
                name = feature.get("feature_name", "Unknown")
                importance = feature.get("mean_abs_shap", 0)
                is_protected = feature.get("is_protected_attribute", False)
                protected_flag = " [PROTECTED ATTRIBUTE]" if is_protected else ""
                lines.append(f"  {i}. {name}: {importance:.4f}{protected_flag}")
        lines.append("")
    
    # Protected attributes
    if "protected_attributes" in audit_data:
        lines.append("## Protected Attributes")
        for attr in audit_data["protected_attributes"]:
            lines.append(f"- {attr}")
        lines.append("")
    
    return "\n".join(lines)


def _fallback_narrative() -> Dict[str, Any]:
    """Return a fallback narrative when Gemini fails."""
    return {
        "summary": "Unable to generate narrative due to API error. Review metrics above.",
        "severity_rating": "MEDIUM",
        "affected_groups": [],
        "root_cause_analysis": "Refer to fairness metrics for detailed analysis.",
        "remediation_steps": [
            "Review fairness metrics above",
            "Consult with domain experts on trade-offs",
            "Consider stratified re-training on underrepresented groups"
        ],
        "plain_english_explanation": "The Gemini service is temporarily unavailable. Please review the computed metrics to understand fairness issues."
    }

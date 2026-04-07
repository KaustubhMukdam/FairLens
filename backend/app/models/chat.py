"""
Chat Models for FairLens
========================

Pydantic models for chat request/response.
"""

from pydantic import BaseModel
from typing import Optional


class ChatRequest(BaseModel):
    """Chat request with audit context."""
    question: str
    domain_context: Optional[str] = None


class ChatResponse(BaseModel):
    """Chat response from Gemini."""
    answer: str
    audit_id: str

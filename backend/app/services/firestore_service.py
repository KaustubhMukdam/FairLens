"""
Firestore Service for FairLens
===============================

Handles storage and retrieval of audit sessions and results in Google Cloud Firestore.
Includes fallback for local file storage during development without GCP credentials.

Functions:
- create_audit: Initialize a new audit session
- update_audit: Update audit with new status or results
- get_audit: Retrieve audit details
- delete_audit: Remove an audit session (cleanup)
"""

import json
import os
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
from app.config import settings
from app.models.audit import AuditStatus

try:
    from google.cloud import firestore
    FIRESTORE_AVAILABLE = True
except ImportError:
    FIRESTORE_AVAILABLE = False


class FirestoreService:
    """
    Service for Firestore operations with automatic fallback to local storage.
    """
    
    def __init__(self):
        self.use_local = False
        self.local_storage_path = "/tmp/fairlens_audits"
        
        try:
            if FIRESTORE_AVAILABLE:
                self.client = firestore.Client(
                    project=settings.google_cloud_project
                )
                self.collection_name = settings.firestore_collection
            else:
                raise Exception("Firestore not available")
        except Exception as e:
            print(f"WARNING: Firestore initialization failed: {e}")
            print(f"Falling back to local file storage at {self.local_storage_path}")
            self.use_local = True
            os.makedirs(self.local_storage_path, exist_ok=True)
    
    def create_audit(self, audit_id: str, **initial_data) -> None:
        """
        Create a new audit session with initial metadata.
        
        Args:
            audit_id: Unique identifier for the audit
            **initial_data: Initial audit data (file_id, target_column, etc.)
        """
        audit_doc = {
            "audit_id": audit_id,
            "status": AuditStatus.PENDING.value,
            "progress_pct": 0,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            **initial_data
        }
        
        if self.use_local:
            self._local_save(audit_id, audit_doc)
        else:
            try:
                self.client.collection(self.collection_name).document(audit_id).set(audit_doc)
            except Exception as e:
                print(f"ERROR saving audit to Firestore: {e}")
                self._local_save(audit_id, audit_doc)
    
    def update_audit(self, audit_id: str, updates: Dict[str, Any]) -> None:
        """
        Update an existing audit with new information.
        
        Args:
            audit_id: Audit identifier
            updates: Dictionary of fields to update
        """
        updates["updated_at"] = datetime.utcnow().isoformat()
        
        if self.use_local:
            audit_doc = self._local_load(audit_id)
            if audit_doc:
                audit_doc.update(updates)
                self._local_save(audit_id, audit_doc)
        else:
            try:
                self.client.collection(self.collection_name).document(audit_id).update(updates)
            except Exception as e:
                print(f"ERROR updating audit in Firestore: {e}")
                audit_doc = self._local_load(audit_id)
                if audit_doc:
                    audit_doc.update(updates)
                    self._local_save(audit_id, audit_doc)
    
    def get_audit(self, audit_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a complete audit record.
        
        Args:
            audit_id: Audit identifier
        
        Returns:
            Dictionary with audit data, or None if not found
        """
        if self.use_local:
            return self._local_load(audit_id)
        
        try:
            doc = self.client.collection(self.collection_name).document(audit_id).get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            print(f"ERROR retrieving audit from Firestore: {e}")
            return self._local_load(audit_id)
    
    def delete_audit(self, audit_id: str) -> None:
        """
        Delete an audit session (cleanup).
        
        Args:
            audit_id: Audit identifier
        """
        if self.use_local:
            local_path = os.path.join(self.local_storage_path, f"{audit_id}.json")
            if os.path.exists(local_path):
                os.remove(local_path)
        else:
            try:
                self.client.collection(self.collection_name).document(audit_id).delete()
            except Exception as e:
                print(f"ERROR deleting audit from Firestore: {e}")
    
    def list_audits(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        List recent audits (for dashboard).
        
        Args:
            limit: Maximum number of audits to return
        
        Returns:
            List of audit records
        """
        if self.use_local:
            audits = []
            for filename in os.listdir(self.local_storage_path):
                if filename.endswith('.json'):
                    audit_id = filename[:-5]
                    audit = self._local_load(audit_id)
                    if audit:
                        audits.append(audit)
            # Sort by created_at descending
            audits.sort(key=lambda x: x.get('created_at', ''), reverse=True)
            return audits[:limit]
        
        try:
            docs = (
                self.client.collection(self.collection_name)
                .order_by("created_at", direction=firestore.Query.DESCENDING)
                .limit(limit)
                .stream()
            )
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            print(f"ERROR listing audits from Firestore: {e}")
            return []
    
    # Local storage helper methods
    
    def _local_save(self, audit_id: str, data: Dict[str, Any]) -> None:
        """Save audit to local JSON file."""
        filepath = os.path.join(self.local_storage_path, f"{audit_id}.json")
        try:
            # Convert numpy types to native Python types for JSON serialization
            data_serializable = self._make_json_serializable(data)
            with open(filepath, 'w') as f:
                json.dump(data_serializable, f, indent=2)
        except Exception as e:
            print(f"ERROR saving audit to local storage: {e}")
    
    def _local_load(self, audit_id: str) -> Optional[Dict[str, Any]]:
        """Load audit from local JSON file."""
        filepath = os.path.join(self.local_storage_path, f"{audit_id}.json")
        try:
            if os.path.exists(filepath):
                with open(filepath, 'r') as f:
                    return json.load(f)
            return None
        except Exception as e:
            print(f"ERROR loading audit from local storage: {e}")
            return None
    
    @staticmethod
    def _make_json_serializable(obj: Any) -> Any:
        """
        Convert numpy and other non-JSON-serializable types to JSON-compatible types.
        """
        import numpy as np
        from enum import Enum
        
        if isinstance(obj, Enum):
            # Handle Enum types - convert to their value
            return obj.value
        elif isinstance(obj, dict):
            return {k: FirestoreService._make_json_serializable(v) for k, v in obj.items()}
        elif isinstance(obj, (list, tuple)):
            return [FirestoreService._make_json_serializable(item) for item in obj]
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, (np.integer, np.floating)):
            return obj.item()
        elif isinstance(obj, np.bool_):
            return bool(obj)
        elif hasattr(obj, '__dict__'):
            # Pydantic models and other objects with __dict__
            try:
                if hasattr(obj, 'dict'):  # Pydantic v1
                    return obj.dict()
                elif hasattr(obj, 'model_dump'):  # Pydantic v2
                    return obj.model_dump()
                else:
                    return obj.__dict__
            except:
                return str(obj)
        else:
            return obj


# Global instance
_firestore_service = None


def get_firestore_service() -> FirestoreService:
    """Get or create singleton Firestore service instance."""
    global _firestore_service
    if _firestore_service is None:
        _firestore_service = FirestoreService()
    return _firestore_service

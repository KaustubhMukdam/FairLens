import uuid
from google.cloud import storage
import os
import tempfile
from pathlib import Path

from app.config import settings


def _get_local_upload_dir() -> Path:
    """Return a cross-platform temp directory for local upload fallback."""
    local_dir = Path(tempfile.gettempdir()) / "fairlens_uploads"
    local_dir.mkdir(parents=True, exist_ok=True)
    return local_dir


def _resolve_local_path(local_path: str) -> Path:
    """
    Resolve local file references from fallback URIs in a robust, cross-platform way.

    Supports legacy paths such as `/adult_income_sample.csv` by searching likely
    fixture and upload directories using the file basename.
    """
    raw = (local_path or "").strip()
    if not raw:
        raise RuntimeError("Empty local file path")

    candidate = Path(raw)
    if candidate.exists():
        return candidate

    if raw.startswith(("/", "\\")):
        cwd_candidate = Path.cwd() / raw.lstrip("/\\")
        if cwd_candidate.exists():
            return cwd_candidate

    basename = Path(raw).name
    backend_root = Path(__file__).resolve().parents[2]
    repo_root = backend_root.parent
    search_candidates = [
        _get_local_upload_dir() / basename,
        backend_root / "tests" / "fixtures" / basename,
        repo_root / "frontend" / "public" / "fixtures" / basename,
    ]

    for path in search_candidates:
        if path.exists():
            return path

    raise RuntimeError(
        f"Local file not found. Received '{raw}'. Tried: "
        + ", ".join(str(p) for p in search_candidates)
    )

def upload_file(file_bytes: bytes, filename: str) -> str:
    """Uploads a file to GCS and returns the unique file URI."""
    file_id = f"{uuid.uuid4()}_{filename}"
    bucket_name = settings.gcs_bucket_name
    
    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(file_id)
        blob.upload_from_string(file_bytes)
        return f"gs://{bucket_name}/{file_id}"
    except Exception as e:
        # For hackathon local development ease if ADC is missing
        print(f"Warning: Falling back to local file storage, GCS error: {e}")
        local_path = _get_local_upload_dir() / file_id
        with open(local_path, "wb") as f:
            f.write(file_bytes)
        return f"local://{local_path}"

def download_file(gcs_uri: str) -> bytes:
    """
    Downloads a file by its URI.
    
    Supports:
    - GCS: gs://bucket-name/file-id
    - Local: local:///tmp/fairlens_uploads/file-id
    
    Args:
        gcs_uri: Full URI to file (from upload_file())
    
    Returns:
        File bytes
    
    Raises:
        RuntimeError: If file cannot be downloaded
    """
    # Handle local storage fallback
    if gcs_uri.startswith("local://"):
        local_path = gcs_uri.replace("local://", "", 1)
        try:
            resolved_path = _resolve_local_path(local_path)
            with open(resolved_path, "rb") as f:
                return f.read()
        except Exception as e:
            raise RuntimeError(f"Failed to read local file {local_path}: {e}")
    
    # Handle GCS storage
    if gcs_uri.startswith("gs://"):
        try:
            # Parse GCS URI: gs://bucket-name/file-id
            parts = gcs_uri.replace("gs://", "", 1).split("/", 1)
            if len(parts) != 2:
                raise ValueError(f"Invalid GCS URI format: {gcs_uri}")
            
            bucket_name = parts[0]
            file_id = parts[1]
            
            storage_client = storage.Client()
            bucket = storage_client.bucket(bucket_name)
            blob = bucket.blob(file_id)
            return blob.download_as_bytes()
        except Exception as e:
            raise RuntimeError(f"GCS download failed: {e}")
    
    # Unknown URI format
    raise RuntimeError(f"Unknown file URI format: {gcs_uri}. Must start with 'gs://' or 'local://'.")

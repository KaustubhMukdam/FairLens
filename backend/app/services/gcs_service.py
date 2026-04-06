import uuid
from google.cloud import storage
import os

from app.config import settings

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
        # Create a local tmp directory if not exists
        os.makedirs('/tmp/fairlens_uploads', exist_ok=True)
        local_path = f"/tmp/fairlens_uploads/{file_id}"
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
            with open(local_path, "rb") as f:
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

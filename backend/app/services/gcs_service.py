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
    """Downloads a file from GCS by its URI."""
    if gcs_uri.startswith("local://"):
        local_path = gcs_uri.lstrip("local://")
        with open(local_path, "rb") as f:
            return f.read()
            
    try:
        bucket_name = gcs_uri.split("/")[2]
        file_id = "/".join(gcs_uri.split("/")[3:])
        
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(file_id)
        return blob.download_as_bytes()
    except Exception as e:
        raise RuntimeError(f"GCP Credentials missing or GCS fetch failed: {e}")

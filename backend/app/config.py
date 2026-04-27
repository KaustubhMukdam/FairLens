import base64
import json
import os
import tempfile
from typing import List, Optional
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

def _configure_google_credentials() -> None:
    """Populate GOOGLE_APPLICATION_CREDENTIALS from local file or env secrets."""
    existing_creds = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
    if existing_creds and Path(existing_creds).exists():
        return

    creds_json = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS_JSON')
    if creds_json:
        try:
            creds_data = json.loads(creds_json)
            temp_file = tempfile.NamedTemporaryFile(
                mode='w',
                encoding='utf-8',
                suffix='.json',
                prefix='fairlens-gcp-',
                delete=False,
            )
            with temp_file:
                json.dump(creds_data, temp_file)
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = temp_file.name
            print(f"[OK] Set GOOGLE_APPLICATION_CREDENTIALS from GOOGLE_APPLICATION_CREDENTIALS_JSON: {temp_file.name}")
            return
        except json.JSONDecodeError as exc:
            raise ValueError("GOOGLE_APPLICATION_CREDENTIALS_JSON must contain valid JSON") from exc

    creds_b64 = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS_B64')
    if creds_b64:
        try:
            decoded = base64.b64decode(creds_b64).decode('utf-8')
            creds_data = json.loads(decoded)
            temp_file = tempfile.NamedTemporaryFile(
                mode='w',
                encoding='utf-8',
                suffix='.json',
                prefix='fairlens-gcp-',
                delete=False,
            )
            with temp_file:
                json.dump(creds_data, temp_file)
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = temp_file.name
            print(f"[OK] Set GOOGLE_APPLICATION_CREDENTIALS from GOOGLE_APPLICATION_CREDENTIALS_B64: {temp_file.name}")
            return
        except Exception as exc:
            raise ValueError("GOOGLE_APPLICATION_CREDENTIALS_B64 must contain base64-encoded service account JSON") from exc

    local_creds_path = Path('./service-account.json').resolve()
    if local_creds_path.exists():
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = str(local_creds_path)
        print(f"[OK] Set GOOGLE_APPLICATION_CREDENTIALS to {local_creds_path}")


# Set up Google Cloud credentials before anything else
_configure_google_credentials()


class Settings(BaseSettings):
    # Google Cloud
    google_cloud_project: str = "fairlens-ai-biased-detection"
    google_application_credentials: Optional[str] = None
    gcs_bucket_name: str = "fairlens-uploads"
    firestore_collection: str = "audits"
    
    # Vertex AI
    vertex_ai_location: str = "us-central1"
    gemini_model: str = "gemini-2.5-pro"
    
    # App Settings
    backend_cors_origins: List[str] = [
        "http://localhost:5173",
        "https://fairlens.vercel.app",
        "https://fair-lens-bice.vercel.app",
        "https://fair-lens-git-main-kaustubhs-projects-8cdc8a98.vercel.app/",
        "https://fair-lens-5vvdwbizt-kaustubhs-projects-8cdc8a98.vercel.app/"
    ]
    backend_cors_origin_regex: Optional[str] = r"https://.*\.vercel\.app"
    max_upload_size_mb: int = 50
    min_audit_rows: int = 3
    csv_parse_timeout_seconds: int = 60

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()

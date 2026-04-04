from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Google Cloud
    google_cloud_project: str = "your-project-id"
    google_application_credentials: Optional[str] = None
    gcs_bucket_name: str = "fairlens-uploads"
    firestore_collection: str = "audits"
    
    # Vertex AI
    vertex_ai_location: str = "us-central1"
    gemini_model: str = "gemini-1.5-pro"
    
    # App Settings
    backend_cors_origins: List[str] = ["http://localhost:5173", "https://fairlens.vercel.app"]
    max_upload_size_mb: int = 50

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()

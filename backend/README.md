# FairLens Backend

FastAPI service for dataset upload, fairness audit orchestration, and Gemini-powered audit narratives.

## Local Development

1. Create and activate a Python 3.11 environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Copy `.env.example` to `.env` and fill in the Google Cloud values.
4. Start the API:

```bash
uvicorn app.main:app --reload --port 8002
```

The health check is available at `/health`.

## Environment Variables

Required or commonly used settings:

- `GOOGLE_CLOUD_PROJECT` - Google Cloud project ID.
- `GCS_BUCKET_NAME` - bucket used for uploaded CSVs.
- `FIRESTORE_COLLECTION` - Firestore collection used for audit records.
- `VERTEX_AI_LOCATION` - Vertex AI region, usually `us-central1`.
- `GEMINI_MODEL` - model name used by the audit pipeline.
- `BACKEND_CORS_ORIGINS` - JSON list of allowed frontend origins.
- `MAX_UPLOAD_SIZE_MB` - file upload size limit.

Credential options:

- `GOOGLE_APPLICATION_CREDENTIALS` - path to a local service account JSON file.
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` - raw service account JSON for Render secrets.
- `GOOGLE_APPLICATION_CREDENTIALS_B64` - base64-encoded service account JSON for secret storage.

## Render Deployment

Use the Render web UI or the checked-in `render.yaml` blueprint.

Render settings:

- Runtime: Python 3.11.
- Build command: `pip install -r requirements.txt`.
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- Environment variable: `PYTHON_VERSION=3.11.9`.

Set the Google Cloud variables in the Render dashboard. If you are not mounting a service account file, store the JSON in `GOOGLE_APPLICATION_CREDENTIALS_JSON` or `GOOGLE_APPLICATION_CREDENTIALS_B64`.

## Google Cloud Integrations

- Cloud Storage stores uploaded datasets and fallback local upload URIs.
- Firestore stores audit status, intermediate progress, and final results.
- Vertex AI Gemini generates the narrative summary and chat answers for completed audits.
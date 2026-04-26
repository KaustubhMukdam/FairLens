# FairLens

FairLens is an AI bias detection and fairness auditing platform for high-stakes ML use cases such as hiring, lending, and criminal justice. The system ingests CSV datasets, computes fairness metrics, generates SHAP-based explanations, and uses Google Gemini for narrative audit summaries and follow-up questions.

## Tech Stack

Frontend:
- React 19 + TypeScript
- Vite
- Tailwind CSS
- Axios, React Query, Zustand, Recharts

Backend:
- FastAPI + Uvicorn
- Pandas, NumPy, scikit-learn, SHAP, Fairlearn
- Google Cloud Storage, Firestore, Vertex AI Gemini

Deployment:
- Render for the backend API
- Vercel for the frontend app

Google integrations:
- Cloud Storage stores uploaded datasets and generated file references.
- Firestore stores audit jobs, progress updates, and results.
- Vertex AI powers the Gemini narrative summaries and chat responses.
- Service account credentials are loaded from a local file during development or from Render secrets in production.

## Local Setup

Backend:
1. `cd backend`
2. Install Python dependencies from `requirements.txt`
3. Copy `.env.example` to `.env` and fill in Google Cloud settings
4. Run `uvicorn app.main:app --reload --port 8002`

Frontend:
1. `cd frontend`
2. Run `npm install`
3. Set `VITE_API_URL` to your backend URL
4. Run `npm run dev`

## Deployment Overview

Backend on Render:
- Use Python 3.11 for the service runtime.
- Set `PYTHON_VERSION=3.11.9` in the Render environment.
- Set Google Cloud env vars, including `GOOGLE_CLOUD_PROJECT`, `GCS_BUCKET_NAME`, `FIRESTORE_COLLECTION`, and either `GOOGLE_APPLICATION_CREDENTIALS_JSON` or `GOOGLE_APPLICATION_CREDENTIALS_B64`.
- Expose the app with `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

Frontend on Vercel:
- Set `VITE_API_URL` to the Render backend URL.
- Build with `npm run build` and serve the generated `dist` output.

See the platform-specific docs in [backend/README.md](backend/README.md), [frontend/README.md](frontend/README.md), and [datasets/README.md](datasets/README.md).

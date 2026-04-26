# FairLens Frontend

React + Vite single-page app for uploading datasets, configuring audits, and viewing fairness results.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Set `VITE_API_URL` if your backend is not running on `http://localhost:8002`.
3. Start the app:

```bash
npm run dev
```

## Build

```bash
npm run build
```

The production output is written to `dist/`.

## Environment Variables

- `VITE_API_URL` - base URL for the FastAPI backend.

If this is not set, the app falls back to `http://localhost:8002`.

## Vercel Deployment

Deploy the repository using the Vercel web UI and point the project root to `frontend/`.

Recommended settings:

- Framework preset: Vite.
- Build command: `npm run build`.
- Output directory: `dist`.
- Environment variable: `VITE_API_URL=<your Render backend URL>`.

The included `vercel.json` adds an SPA rewrite so direct refreshes keep routing on the client side.

## If you face any error
If you face the error of audit failed, then just refresh the page. It will bring back the home page and you can start the process again. This is a known issue that we are working on fixing. We apologize for the inconvenience.
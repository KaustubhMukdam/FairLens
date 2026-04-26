from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .api import upload, audit, chat

app = FastAPI(title="FairLens API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_origin_regex=settings.backend_cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(audit.router)
app.include_router(chat.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}


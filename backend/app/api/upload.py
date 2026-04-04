from fastapi import APIRouter, File, UploadFile, HTTPException
from app.models.audit import UploadResponse
from app.utils.file_parser import parse_csv
from app.services.gcs_service import upload_file
from app.config import settings

router = APIRouter(prefix="/upload", tags=["upload"])

@router.post("/dataset", response_model=UploadResponse)
async def upload_dataset(file: UploadFile = File(...)):
    # Read the file
    try:
        file_bytes = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to read file.")
        
    # Validate file size
    file_size_mb = len(file_bytes) / (1024 * 1024)
    if file_size_mb > settings.max_upload_size_mb:
        raise HTTPException(status_code=400, detail=f"File exceeds maximum allowed size of {settings.max_upload_size_mb}MB")
        
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    try:
        df = parse_csv(file_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    columns = df.columns.tolist()
    row_count = len(df)
    
    uri = upload_file(file_bytes, file.filename)
    
    # Store the unique identifier
    file_id = uri.split("/")[-1]
    
    return UploadResponse(
        file_id=file_id,
        filename=file.filename,
        columns=columns,
        row_count=row_count
    )

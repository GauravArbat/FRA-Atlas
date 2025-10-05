from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import uuid
import os
from datetime import datetime

from .models.schemas import ProcessingResult, DocumentMetadata
from .services.processor import DocumentProcessor
from .services.database import DatabaseService
from .config import settings

app = FastAPI(title="FRA Digitization Pipeline", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

processor = DocumentProcessor()
db_service = DatabaseService()

@app.post("/upload", response_model=ProcessingResult)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    state: Optional[str] = None,
    district: Optional[str] = None
):
    """Upload single document for processing"""
    if not file.filename.lower().endswith(('.pdf', '.jpg', '.jpeg', '.png', '.tiff')):
        raise HTTPException(400, "Unsupported file format")
    
    document_id = str(uuid.uuid4())
    
    # Save file temporarily
    file_path = f"/tmp/{document_id}_{file.filename}"
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Queue processing
    background_tasks.add_task(processor.process_document, document_id, file_path, state, district)
    
    return ProcessingResult(
        document_id=document_id,
        status="queued",
        message="Document queued for processing"
    )

@app.post("/ingest-batch")
async def ingest_batch(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    state: Optional[str] = None,
    district: Optional[str] = None
):
    """Batch upload multiple documents"""
    batch_id = str(uuid.uuid4())
    document_ids = []
    
    for file in files:
        document_id = str(uuid.uuid4())
        document_ids.append(document_id)
        
        file_path = f"/tmp/{document_id}_{file.filename}"
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        background_tasks.add_task(processor.process_document, document_id, file_path, state, district)
    
    return {
        "batch_id": batch_id,
        "document_ids": document_ids,
        "status": "queued",
        "count": len(files)
    }

@app.get("/status/{document_id}")
async def get_status(document_id: str):
    """Get processing status of document"""
    result = await db_service.get_document_status(document_id)
    if not result:
        raise HTTPException(404, "Document not found")
    return result

@app.get("/export/{format}")
async def export_data(
    format: str,
    state: Optional[str] = None,
    district: Optional[str] = None,
    village: Optional[str] = None
):
    """Export processed data in various formats"""
    if format not in ['json', 'geojson', 'shapefile']:
        raise HTTPException(400, "Unsupported export format")
    
    return await processor.export_data(format, state, district, village)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
import logging
from datetime import datetime

from src.services.ocr_service import OCRService
from src.services.document_processor import DocumentProcessor
from src.services.spatial_processor import SpatialProcessor
from src.services.database_service import DatabaseService
from src.models.document_models import DocumentProcessRequest, ProcessedDocument

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="FRA Atlas Data Processor",
    description="Data processing service for Forest Rights Act Atlas",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ocr_service = OCRService()
document_processor = DocumentProcessor()
spatial_processor = SpatialProcessor()
db_service = DatabaseService()

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "FRA Atlas Data Processor",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "ocr": ocr_service.is_available(),
            "database": await db_service.is_connected(),
            "spatial": spatial_processor.is_available()
        },
        "timestamp": datetime.now().isoformat()
    }

@app.post("/process-document", response_model=ProcessedDocument)
async def process_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    document_type: str = "fra_claim",
    claim_id: Optional[str] = None
):
    """
    Process uploaded document with OCR and data extraction
    """
    try:
        # Validate file type
        allowed_types = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff']
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if file_ext not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Allowed: {', '.join(allowed_types)}"
            )

        # Save uploaded file
        upload_path = f"uploads/{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        os.makedirs(os.path.dirname(upload_path), exist_ok=True)
        
        with open(upload_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Process document
        processed_data = await document_processor.process_document(
            file_path=upload_path,
            document_type=document_type,
            claim_id=claim_id
        )

        # Add to background tasks for database update
        background_tasks.add_task(
            db_service.save_processed_document,
            processed_data
        )

        return processed_data

    except Exception as e:
        logger.error(f"Error processing document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract-spatial-data")
async def extract_spatial_data(
    file: UploadFile = File(...),
    claim_id: str = None
):
    """
    Extract spatial data from uploaded files (shapefiles, KML, etc.)
    """
    try:
        # Save uploaded file
        upload_path = f"uploads/spatial_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        os.makedirs(os.path.dirname(upload_path), exist_ok=True)
        
        with open(upload_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Process spatial data
        spatial_data = await spatial_processor.process_spatial_file(
            file_path=upload_path,
            claim_id=claim_id
        )

        return {
            "message": "Spatial data processed successfully",
            "data": spatial_data
        }

    except Exception as e:
        logger.error(f"Error processing spatial data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/batch-process")
async def batch_process_documents(
    background_tasks: BackgroundTasks,
    request: DocumentProcessRequest
):
    """
    Process multiple documents in batch
    """
    try:
        results = []
        
        for document in request.documents:
            # Process each document
            processed = await document_processor.process_document(
                file_path=document.file_path,
                document_type=document.document_type,
                claim_id=document.claim_id
            )
            results.append(processed)

        # Add batch processing to background tasks
        background_tasks.add_task(
            db_service.save_batch_processed_documents,
            results
        )

        return {
            "message": f"Batch processing initiated for {len(results)} documents",
            "processed_count": len(results),
            "results": results
        }

    except Exception as e:
        logger.error(f"Error in batch processing: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/processing-status/{task_id}")
async def get_processing_status(task_id: str):
    """
    Get the status of a processing task
    """
    try:
        status = await db_service.get_processing_status(task_id)
        return status
    except Exception as e:
        logger.error(f"Error getting processing status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)




from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import json
from datetime import datetime

app = FastAPI(title="FRA Digitization Pipeline", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "FRA Digitization Pipeline", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/ocr")
async def process_ocr(file: UploadFile = File(...)):
    """Mock OCR processing endpoint"""
    return {
        "status": "success",
        "text": f"Mock OCR result for {file.filename}",
        "confidence": 0.95,
        "language": "eng+hin"
    }

@app.post("/ner")
async def process_ner(data: dict):
    """Mock NER processing endpoint"""
    return {
        "status": "success",
        "entities": [
            {"text": "Sample Village", "label": "LOCATION", "confidence": 0.9},
            {"text": "John Doe", "label": "PERSON", "confidence": 0.85}
        ]
    }

@app.post("/cv/detect")
async def computer_vision(file: UploadFile = File(...)):
    """Mock computer vision endpoint"""
    return {
        "status": "success",
        "detections": [
            {"type": "signature", "confidence": 0.88, "bbox": [100, 200, 150, 250]},
            {"type": "stamp", "confidence": 0.92, "bbox": [300, 400, 350, 450]}
        ]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
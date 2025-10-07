from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

app = FastAPI(title="FRA Digitization Pipeline")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "FRA Digitization Pipeline API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": str(datetime.utcnow())}

@app.post("/upload")
async def upload_document():
    return {
        "success": True,
        "status": "completed",
        "message": "Document processed successfully",
        "confidence": 0.85,
        "text": "Sample extracted text from FRA document",
        "fraInfo": {
            "applicantName": "Sample Applicant",
            "village": "Sample Village",
            "district": "Sample District",
            "state": "Sample State",
            "area": "2.5 hectares",
            "claimNumber": "IFR/2024/001",
            "pattaNumber": "P001"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
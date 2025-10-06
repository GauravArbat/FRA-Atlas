from fastapi import FastAPI
from datetime import datetime

app = FastAPI(title="FRA Digitization Pipeline")

@app.get("/")
async def root():
    return {"message": "FRA Digitization Pipeline API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": str(datetime.utcnow())}

@app.post("/upload")
async def upload_document():
    return {"status": "queued", "message": "Document processing"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
from fastapi import FastAPI
from datetime import datetime

app = FastAPI(title="FRA Data Processor")

@app.get("/")
async def root():
    return {"message": "FRA Data Processor API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": str(datetime.utcnow())}

@app.post("/process")
async def process_data():
    return {"status": "processed"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
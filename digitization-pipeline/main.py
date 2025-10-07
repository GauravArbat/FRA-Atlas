from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import pytesseract
from PIL import Image
import io
import re
import spacy

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
async def upload_document(file: UploadFile = File(...)):
    try:
        # Read file content
        content = await file.read()
        
        # Process image with OCR
        image = Image.open(io.BytesIO(content))
        text = pytesseract.image_to_string(image)
        
        # Extract FRA information using NER + regex
        fraInfo = extract_fra_entities(text)
        
        return {
            "success": True,
            "status": "completed",
            "message": "Document processed successfully",
            "confidence": 0.85,
            "text": text,
            "fraInfo": fraInfo
        }
    except Exception as e:
        return {
            "success": False,
            "status": "error",
            "message": f"Processing failed: {str(e)}"
        }

def extract_name(text):
    patterns = [r'Name[:\s]*([A-Za-z\s]+)', r'Applicant[:\s]*([A-Za-z\s]+)']
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return "Unknown"

def extract_village(text):
    patterns = [r'Village[:\s]*([A-Za-z\s]+)', r'Gram[:\s]*([A-Za-z\s]+)']
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return "Unknown"

def extract_district(text):
    match = re.search(r'District[:\s]*([A-Za-z\s]+)', text, re.IGNORECASE)
    return match.group(1).strip() if match else "Unknown"

def extract_state(text):
    match = re.search(r'State[:\s]*([A-Za-z\s]+)', text, re.IGNORECASE)
    return match.group(1).strip() if match else "Unknown"

def extract_area(text):
    patterns = [r'Area[:\s]*([0-9\.]+\s*[A-Za-z]+)', r'([0-9\.]+\s*hectare)', r'([0-9\.]+\s*acre)']
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return "Unknown"

def extract_claim_number(text):
    match = re.search(r'(IFR|CFR|CR)[/\-\s]*[0-9]+', text, re.IGNORECASE)
    return match.group(0) if match else "Unknown"

def extract_patta_number(text):
    patterns = [r'Patta[:\s]*([A-Za-z0-9/\-]+)', r'Plot[:\s]*([A-Za-z0-9/\-]+)']
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return "Unknown"

def extract_fra_entities(text):
    try:
        # Load spaCy model (fallback to regex if not available)
        nlp = spacy.load("en_core_web_sm")
        doc = nlp(text)
        
        entities = {
            "applicantName": None,
            "village": None,
            "district": None,
            "state": None,
            "area": None,
            "claimNumber": None,
            "pattaNumber": None
        }
        
        # Extract named entities
        for ent in doc.ents:
            if ent.label_ == "PERSON" and not entities["applicantName"]:
                entities["applicantName"] = ent.text
            elif ent.label_ == "GPE":  # Geopolitical entity
                if not entities["village"]:
                    entities["village"] = ent.text
                elif not entities["district"]:
                    entities["district"] = ent.text
                elif not entities["state"]:
                    entities["state"] = ent.text
        
        # Fallback to regex for missing entities
        if not entities["applicantName"]:
            entities["applicantName"] = extract_name(text)
        if not entities["village"]:
            entities["village"] = extract_village(text)
        if not entities["district"]:
            entities["district"] = extract_district(text)
        if not entities["state"]:
            entities["state"] = extract_state(text)
        
        entities["area"] = extract_area(text)
        entities["claimNumber"] = extract_claim_number(text)
        entities["pattaNumber"] = extract_patta_number(text)
        
        return entities
        
    except:
        # Fallback to regex-only extraction
        return {
            "applicantName": extract_name(text),
            "village": extract_village(text),
            "district": extract_district(text),
            "state": extract_state(text),
            "area": extract_area(text),
            "claimNumber": extract_claim_number(text),
            "pattaNumber": extract_patta_number(text)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
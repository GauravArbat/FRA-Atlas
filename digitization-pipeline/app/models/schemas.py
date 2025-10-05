from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class ClaimType(str, Enum):
    IFR = "IFR"
    CR = "CR"
    CFR = "CFR"

class ClaimStatus(str, Enum):
    PENDING = "Pending"
    VERIFIED = "Verified"
    GRANTED = "Granted"
    REJECTED = "Rejected"

class ProcessingStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class Coordinates(BaseModel):
    type: str
    coordinates: List[List[List[float]]]

class DocumentMetadata(BaseModel):
    document_id: str
    source_file: str
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    patta_holder: List[str] = []
    claim_type: Optional[ClaimType] = None
    claim_status: Optional[ClaimStatus] = None
    area_hectares: Optional[float] = None
    plot_number: Optional[str] = None
    coordinates: Optional[Coordinates] = None
    ocr_confidence: Optional[float] = None
    ner_confidence: Optional[float] = None
    languages: List[str] = []
    raw_ocr_text: Optional[str] = None
    extracted_fields: Dict[str, Any] = {}
    processed_at: Optional[datetime] = None
    verified: bool = False
    verified_by: Optional[str] = None

class ProcessingResult(BaseModel):
    document_id: str
    status: ProcessingStatus
    message: str
    metadata: Optional[DocumentMetadata] = None
    error: Optional[str] = None

class OCRResult(BaseModel):
    text: str
    confidence: float
    language: str
    bounding_boxes: List[Dict[str, Any]] = []

class NERResult(BaseModel):
    entities: List[Dict[str, Any]]
    confidence: float
    extracted_fields: Dict[str, Any]

class ExportRequest(BaseModel):
    format: str
    filters: Dict[str, Any] = {}
    include_geometry: bool = True
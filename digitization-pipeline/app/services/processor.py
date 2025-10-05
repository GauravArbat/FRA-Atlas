import cv2
import numpy as np
import pytesseract
from PIL import Image
import spacy
from langdetect import detect
import geopandas as gpd
from shapely.geometry import Point, Polygon
import json
import re
from typing import Dict, List, Optional, Tuple
import logging

from ..models.schemas import DocumentMetadata, OCRResult, NERResult, ClaimType, ClaimStatus
from ..utils.preprocessing import ImagePreprocessor
from ..utils.geo_parser import GeoParser
from .database import DatabaseService

logger = logging.getLogger(__name__)

class DocumentProcessor:
    def __init__(self):
        self.preprocessor = ImagePreprocessor()
        self.geo_parser = GeoParser()
        self.db_service = DatabaseService()
        
        # Load spaCy model (install: python -m spacy download en_core_web_sm)
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            logger.warning("spaCy model not found. Install with: python -m spacy download en_core_web_sm")
            self.nlp = None

    async def process_document(self, document_id: str, file_path: str, state: str = None, district: str = None):
        """Main processing pipeline"""
        try:
            # Update status
            await self.db_service.update_status(document_id, "processing")
            
            # 1. Preprocessing
            processed_image = self.preprocessor.enhance_image(file_path)
            
            # 2. OCR
            ocr_result = self.perform_ocr(processed_image)
            
            # 3. Language detection
            language = self.detect_language(ocr_result.text)
            
            # 4. NER and field extraction
            ner_result = self.extract_entities(ocr_result.text)
            
            # 5. Geo-parsing
            coordinates = self.geo_parser.parse_coordinates(ocr_result.text, ner_result.extracted_fields)
            
            # 6. Create metadata
            metadata = DocumentMetadata(
                document_id=document_id,
                source_file=file_path,
                state=state or ner_result.extracted_fields.get('state'),
                district=district or ner_result.extracted_fields.get('district'),
                village=ner_result.extracted_fields.get('village'),
                patta_holder=ner_result.extracted_fields.get('patta_holder', []),
                claim_type=self._parse_claim_type(ner_result.extracted_fields.get('claim_type')),
                claim_status=self._parse_claim_status(ner_result.extracted_fields.get('claim_status')),
                area_hectares=ner_result.extracted_fields.get('area_hectares'),
                plot_number=ner_result.extracted_fields.get('plot_number'),
                coordinates=coordinates,
                ocr_confidence=ocr_result.confidence,
                ner_confidence=ner_result.confidence,
                languages=[language],
                raw_ocr_text=ocr_result.text,
                extracted_fields=ner_result.extracted_fields
            )
            
            # 7. Save to database
            await self.db_service.save_document(metadata)
            await self.db_service.update_status(document_id, "completed")
            
            logger.info(f"Successfully processed document {document_id}")
            
        except Exception as e:
            logger.error(f"Error processing document {document_id}: {str(e)}")
            await self.db_service.update_status(document_id, "failed", str(e))

    def perform_ocr(self, image: np.ndarray) -> OCRResult:
        """Perform OCR with Tesseract"""
        try:
            # Convert numpy array to PIL Image
            pil_image = Image.fromarray(image)
            
            # OCR with confidence data
            data = pytesseract.image_to_data(pil_image, output_type=pytesseract.Output.DICT, lang='eng+hin')
            
            # Extract text and calculate confidence
            text_parts = []
            confidences = []
            
            for i, conf in enumerate(data['conf']):
                if int(conf) > 0:  # Filter out low confidence
                    text_parts.append(data['text'][i])
                    confidences.append(int(conf))
            
            text = ' '.join(text_parts)
            avg_confidence = np.mean(confidences) if confidences else 0
            
            return OCRResult(
                text=text,
                confidence=avg_confidence / 100.0,  # Normalize to 0-1
                language="multi"
            )
            
        except Exception as e:
            logger.error(f"OCR failed: {str(e)}")
            return OCRResult(text="", confidence=0.0, language="unknown")

    def detect_language(self, text: str) -> str:
        """Detect primary language of text"""
        try:
            return detect(text)
        except:
            return "en"  # Default to English

    def extract_entities(self, text: str) -> NERResult:
        """Extract FRA-specific entities using rules and NLP"""
        entities = []
        extracted_fields = {}
        
        # Rule-based extraction patterns
        patterns = {
            'village': r'(?:Village|ग्राम|गाँव)\s*:?\s*([A-Za-z\u0900-\u097F\s]+)',
            'district': r'(?:District|जिला)\s*:?\s*([A-Za-z\u0900-\u097F\s]+)',
            'state': r'(?:State|राज्य)\s*:?\s*([A-Za-z\u0900-\u097F\s]+)',
            'patta_holder': r'(?:Name|नाम|Holder)\s*:?\s*([A-Za-z\u0900-\u097F\s]+)',
            'area_hectares': r'(\d+\.?\d*)\s*(?:hectare|हेक्टेयर|acre|एकड़)',
            'plot_number': r'(?:Plot|Survey|खसरा)\s*(?:No\.?|Number)?\s*:?\s*([A-Za-z0-9\/\-]+)',
            'claim_type': r'(IFR|CFR|CR|Individual|Community|Forest Rights)',
            'claim_status': r'(Pending|Verified|Granted|Rejected|स्वीकृत|लंबित)'
        }
        
        for field, pattern in patterns.items():
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                if field == 'patta_holder':
                    extracted_fields[field] = [match.strip() for match in matches]
                elif field == 'area_hectares':
                    try:
                        extracted_fields[field] = float(matches[0])
                    except:
                        extracted_fields[field] = None
                else:
                    extracted_fields[field] = matches[0].strip()
                
                entities.append({
                    'label': field,
                    'value': extracted_fields[field],
                    'confidence': 0.8  # Rule-based confidence
                })
        
        # Use spaCy for additional entity extraction if available
        if self.nlp:
            doc = self.nlp(text)
            for ent in doc.ents:
                if ent.label_ in ['PERSON', 'GPE', 'ORG']:
                    entities.append({
                        'label': ent.label_,
                        'value': ent.text,
                        'confidence': 0.7
                    })
        
        avg_confidence = np.mean([e['confidence'] for e in entities]) if entities else 0.5
        
        return NERResult(
            entities=entities,
            confidence=avg_confidence,
            extracted_fields=extracted_fields
        )

    def _parse_claim_type(self, claim_type_str: str) -> Optional[ClaimType]:
        """Parse claim type from string"""
        if not claim_type_str:
            return None
        
        claim_type_str = claim_type_str.upper()
        if 'IFR' in claim_type_str or 'INDIVIDUAL' in claim_type_str:
            return ClaimType.IFR
        elif 'CFR' in claim_type_str or 'COMMUNITY' in claim_type_str:
            return ClaimType.CFR
        elif 'CR' in claim_type_str:
            return ClaimType.CR
        return None

    def _parse_claim_status(self, status_str: str) -> Optional[ClaimStatus]:
        """Parse claim status from string"""
        if not status_str:
            return None
        
        status_str = status_str.lower()
        if 'granted' in status_str or 'स्वीकृत' in status_str:
            return ClaimStatus.GRANTED
        elif 'pending' in status_str or 'लंबित' in status_str:
            return ClaimStatus.PENDING
        elif 'verified' in status_str:
            return ClaimStatus.VERIFIED
        elif 'rejected' in status_str:
            return ClaimStatus.REJECTED
        return None

    async def export_data(self, format: str, state: str = None, district: str = None, village: str = None):
        """Export processed data in various formats"""
        filters = {}
        if state:
            filters['state'] = state
        if district:
            filters['district'] = district
        if village:
            filters['village'] = village
        
        data = await self.db_service.get_documents(filters)
        
        if format == 'json':
            return {"documents": [doc.dict() for doc in data]}
        elif format == 'geojson':
            return self._create_geojson(data)
        elif format == 'shapefile':
            return await self._create_shapefile(data)

    def _create_geojson(self, documents: List[DocumentMetadata]) -> Dict:
        """Create GeoJSON from documents"""
        features = []
        
        for doc in documents:
            if doc.coordinates:
                feature = {
                    "type": "Feature",
                    "properties": {
                        "document_id": doc.document_id,
                        "state": doc.state,
                        "district": doc.district,
                        "village": doc.village,
                        "patta_holder": doc.patta_holder,
                        "claim_type": doc.claim_type,
                        "claim_status": doc.claim_status,
                        "area_hectares": doc.area_hectares,
                        "plot_number": doc.plot_number
                    },
                    "geometry": doc.coordinates.dict() if doc.coordinates else None
                }
                features.append(feature)
        
        return {
            "type": "FeatureCollection",
            "features": features
        }

    async def _create_shapefile(self, documents: List[DocumentMetadata]) -> str:
        """Create shapefile from documents"""
        # This would create actual shapefile using geopandas
        # For now, return path to generated file
        return "/tmp/fra_export.shp"
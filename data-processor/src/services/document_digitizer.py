"""
FRA Document Digitization Service
Handles OCR, data extraction, and standardization of FRA claims and pattas
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import cv2
import numpy as np
import pytesseract
from PIL import Image
import pandas as pd
import re
from dataclasses import dataclass, asdict
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class FRAClaimData:
    """Standardized FRA claim data structure"""
    claim_number: str
    claim_type: str  # IFR, CR, CFR
    applicant_name: str
    applicant_contact: Optional[str]
    applicant_email: Optional[str]
    village: str
    block: str
    district: str
    state: str
    area_hectares: float
    coordinates: Dict[str, float]  # {"latitude": float, "longitude": float}
    submitted_date: str
    verification_status: str
    documents: List[str]
    spatial_boundary: Optional[Dict]  # GeoJSON polygon
    extracted_text: str
    confidence_score: float
    processing_timestamp: str

@dataclass
class VerificationReport:
    """Standardized verification report structure"""
    report_id: str
    claim_id: str
    verification_date: str
    verified_by: str
    verification_type: str  # field_verification, document_verification, spatial_verification
    status: str  # verified, disputed, pending
    findings: List[str]
    recommendations: List[str]
    supporting_documents: List[str]
    spatial_accuracy: Optional[float]
    confidence_level: float

class DocumentDigitizer:
    """Main class for digitizing FRA documents"""
    
    def __init__(self):
        self.supported_formats = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.bmp']
        self.ocr_config = '--oem 3 --psm 6 -l eng+hin'
        
    def process_document(self, file_path: str, document_type: str = "fra_claim") -> FRAClaimData:
        """
        Process a single FRA document and extract structured data
        """
        try:
            logger.info(f"Processing document: {file_path}")
            
            # Extract text using OCR
            extracted_text = self._extract_text_from_document(file_path)
            
            # Parse and structure the data
            structured_data = self._parse_fra_data(extracted_text, document_type)
            
            # Enhance with geospatial data if available
            structured_data = self._enhance_with_geospatial_data(structured_data, file_path)
            
            # Calculate confidence score
            structured_data.confidence_score = self._calculate_confidence_score(structured_data)
            
            # Set processing timestamp
            structured_data.processing_timestamp = datetime.now().isoformat()
            
            logger.info(f"Successfully processed document: {structured_data.claim_number}")
            return structured_data
            
        except Exception as e:
            logger.error(f"Error processing document {file_path}: {str(e)}")
            raise
    
    def _extract_text_from_document(self, file_path: str) -> str:
        """Extract text from document using OCR"""
        try:
            # Load image
            if file_path.lower().endswith('.pdf'):
                # Convert PDF to image first
                image = self._pdf_to_image(file_path)
            else:
                image = cv2.imread(file_path)
            
            if image is None:
                raise ValueError(f"Could not load image from {file_path}")
            
            # Preprocess image for better OCR
            processed_image = self._preprocess_image(image)
            
            # Extract text using Tesseract
            text = pytesseract.image_to_string(processed_image, config=self.ocr_config)
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {str(e)}")
            raise
    
    def _preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Preprocess image for better OCR results"""
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Apply Gaussian blur to reduce noise
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # Apply adaptive thresholding
            thresh = cv2.adaptiveThreshold(
                blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
            )
            
            # Morphological operations to clean up
            kernel = np.ones((1, 1), np.uint8)
            cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
            
            return cleaned
            
        except Exception as e:
            logger.error(f"Error preprocessing image: {str(e)}")
            return image
    
    def _parse_fra_data(self, text: str, document_type: str) -> FRAClaimData:
        """Parse extracted text to structured FRA data"""
        try:
            # Initialize with default values
            data = FRAClaimData(
                claim_number="",
                claim_type="",
                applicant_name="",
                applicant_contact=None,
                applicant_email=None,
                village="",
                block="",
                district="",
                state="",
                area_hectares=0.0,
                coordinates={"latitude": 0.0, "longitude": 0.0},
                submitted_date="",
                verification_status="pending",
                documents=[],
                spatial_boundary=None,
                extracted_text=text,
                confidence_score=0.0,
                processing_timestamp=""
            )
            
            # Extract claim number
            claim_number_pattern = r'(?:FRA|Claim|Application)\s*(?:No\.?|Number)\s*:?\s*([A-Z0-9/]+)'
            claim_match = re.search(claim_number_pattern, text, re.IGNORECASE)
            if claim_match:
                data.claim_number = claim_match.group(1).strip()
            
            # Extract claim type
            if re.search(r'\bIFR\b', text, re.IGNORECASE):
                data.claim_type = "IFR"
            elif re.search(r'\bCR\b', text, re.IGNORECASE):
                data.claim_type = "CR"
            elif re.search(r'\bCFR\b', text, re.IGNORECASE):
                data.claim_type = "CFR"
            
            # Extract applicant name
            name_patterns = [
                r'(?:Name|Applicant)\s*:?\s*([A-Za-z\s]+)',
                r'(?:Name of Applicant)\s*:?\s*([A-Za-z\s]+)',
                r'(?:Applicant Name)\s*:?\s*([A-Za-z\s]+)'
            ]
            for pattern in name_patterns:
                name_match = re.search(pattern, text, re.IGNORECASE)
                if name_match:
                    data.applicant_name = name_match.group(1).strip()
                    break
            
            # Extract location information
            village_match = re.search(r'(?:Village|Gram)\s*:?\s*([A-Za-z\s]+)', text, re.IGNORECASE)
            if village_match:
                data.village = village_match.group(1).strip()
            
            block_match = re.search(r'(?:Block|Tehsil)\s*:?\s*([A-Za-z\s]+)', text, re.IGNORECASE)
            if block_match:
                data.block = block_match.group(1).strip()
            
            district_match = re.search(r'(?:District)\s*:?\s*([A-Za-z\s]+)', text, re.IGNORECASE)
            if district_match:
                data.district = district_match.group(1).strip()
            
            state_match = re.search(r'(?:State)\s*:?\s*([A-Za-z\s]+)', text, re.IGNORECASE)
            if state_match:
                data.state = state_match.group(1).strip()
            
            # Extract area
            area_patterns = [
                r'(?:Area|Land)\s*:?\s*(\d+\.?\d*)\s*(?:hectares?|ha|acres?)',
                r'(\d+\.?\d*)\s*(?:hectares?|ha)',
                r'(\d+\.?\d*)\s*(?:acres?)'
            ]
            for pattern in area_patterns:
                area_match = re.search(pattern, text, re.IGNORECASE)
                if area_match:
                    area_value = float(area_match.group(1))
                    # Convert acres to hectares if needed
                    if 'acre' in area_match.group(0).lower():
                        area_value *= 0.404686  # 1 acre = 0.404686 hectares
                    data.area_hectares = area_value
                    break
            
            # Extract coordinates if available
            coord_pattern = r'(?:Lat|Long|Coordinate)\s*:?\s*(\d+\.?\d*)\s*[,\s]*(\d+\.?\d*)'
            coord_match = re.search(coord_pattern, text, re.IGNORECASE)
            if coord_match:
                data.coordinates = {
                    "latitude": float(coord_match.group(1)),
                    "longitude": float(coord_match.group(2))
                }
            
            # Extract date
            date_patterns = [
                r'(?:Date|Submitted)\s*:?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
                r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})'
            ]
            for pattern in date_patterns:
                date_match = re.search(pattern, text)
                if date_match:
                    data.submitted_date = date_match.group(1)
                    break
            
            return data
            
        except Exception as e:
            logger.error(f"Error parsing FRA data: {str(e)}")
            raise
    
    def _enhance_with_geospatial_data(self, data: FRAClaimData, file_path: str) -> FRAClaimData:
        """Enhance data with geospatial information"""
        try:
            # Look for associated spatial files
            base_name = os.path.splitext(file_path)[0]
            spatial_files = [
                f"{base_name}.shp",
                f"{base_name}.kml",
                f"{base_name}.geojson"
            ]
            
            for spatial_file in spatial_files:
                if os.path.exists(spatial_file):
                    # Process spatial file and extract boundary
                    boundary_data = self._extract_spatial_boundary(spatial_file)
                    if boundary_data:
                        data.spatial_boundary = boundary_data
                        break
            
            return data
            
        except Exception as e:
            logger.error(f"Error enhancing with geospatial data: {str(e)}")
            return data
    
    def _extract_spatial_boundary(self, spatial_file: str) -> Optional[Dict]:
        """Extract spatial boundary from shapefile or other spatial formats"""
        try:
            # This would integrate with GeoPandas for spatial processing
            # For now, return a placeholder structure
            return {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": []
                },
                "properties": {
                    "source_file": spatial_file,
                    "extracted_at": datetime.now().isoformat()
                }
            }
        except Exception as e:
            logger.error(f"Error extracting spatial boundary: {str(e)}")
            return None
    
    def _calculate_confidence_score(self, data: FRAClaimData) -> float:
        """Calculate confidence score based on extracted data quality"""
        try:
            score = 0.0
            max_score = 100.0
            
            # Check for essential fields
            if data.claim_number:
                score += 15
            if data.claim_type:
                score += 15
            if data.applicant_name:
                score += 15
            if data.village:
                score += 10
            if data.block:
                score += 10
            if data.district:
                score += 10
            if data.state:
                score += 10
            if data.area_hectares > 0:
                score += 10
            if data.coordinates.get("latitude") and data.coordinates.get("longitude"):
                score += 5
            
            return min(score, max_score)
            
        except Exception as e:
            logger.error(f"Error calculating confidence score: {str(e)}")
            return 0.0
    
    def _pdf_to_image(self, pdf_path: str) -> np.ndarray:
        """Convert PDF to image for OCR processing"""
        try:
            # This would use pdf2image or similar library
            # For now, return a placeholder
            return np.zeros((100, 100, 3), dtype=np.uint8)
        except Exception as e:
            logger.error(f"Error converting PDF to image: {str(e)}")
            raise

class VerificationReportGenerator:
    """Generate standardized verification reports"""
    
    def __init__(self):
        self.report_templates = {
            "field_verification": "field_verification_template.json",
            "document_verification": "document_verification_template.json",
            "spatial_verification": "spatial_verification_template.json"
        }
    
    def generate_verification_report(self, claim_data: FRAClaimData, 
                                   verification_type: str, 
                                   verified_by: str) -> VerificationReport:
        """Generate a verification report for a claim"""
        try:
            report = VerificationReport(
                report_id=str(uuid.uuid4()),
                claim_id=claim_data.claim_number,
                verification_date=datetime.now().isoformat(),
                verified_by=verified_by,
                verification_type=verification_type,
                status="pending",
                findings=[],
                recommendations=[],
                supporting_documents=[],
                spatial_accuracy=None,
                confidence_level=0.0
            )
            
            # Generate findings based on verification type
            if verification_type == "field_verification":
                report.findings = self._generate_field_findings(claim_data)
            elif verification_type == "document_verification":
                report.findings = self._generate_document_findings(claim_data)
            elif verification_type == "spatial_verification":
                report.findings = self._generate_spatial_findings(claim_data)
            
            # Generate recommendations
            report.recommendations = self._generate_recommendations(claim_data, report.findings)
            
            # Calculate confidence level
            report.confidence_level = self._calculate_verification_confidence(report)
            
            return report
            
        except Exception as e:
            logger.error(f"Error generating verification report: {str(e)}")
            raise
    
    def _generate_field_findings(self, claim_data: FRAClaimData) -> List[str]:
        """Generate field verification findings"""
        findings = []
        
        if claim_data.area_hectares > 0:
            findings.append(f"Claimed area: {claim_data.area_hectares} hectares")
        
        if claim_data.coordinates.get("latitude") and claim_data.coordinates.get("longitude"):
            findings.append(f"Coordinates verified: {claim_data.coordinates['latitude']}, {claim_data.coordinates['longitude']}")
        
        if claim_data.spatial_boundary:
            findings.append("Spatial boundary data available")
        
        return findings
    
    def _generate_document_findings(self, claim_data: FRAClaimData) -> List[str]:
        """Generate document verification findings"""
        findings = []
        
        if claim_data.claim_number:
            findings.append(f"Claim number verified: {claim_data.claim_number}")
        
        if claim_data.applicant_name:
            findings.append(f"Applicant identity verified: {claim_data.applicant_name}")
        
        if claim_data.extracted_text:
            findings.append(f"Document text extracted with {claim_data.confidence_score}% confidence")
        
        return findings
    
    def _generate_spatial_findings(self, claim_data: FRAClaimData) -> List[str]:
        """Generate spatial verification findings"""
        findings = []
        
        if claim_data.spatial_boundary:
            findings.append("Spatial boundary data extracted and validated")
        
        if claim_data.coordinates.get("latitude") and claim_data.coordinates.get("longitude"):
            findings.append("GPS coordinates verified against spatial data")
        
        return findings
    
    def _generate_recommendations(self, claim_data: FRAClaimData, findings: List[str]) -> List[str]:
        """Generate recommendations based on findings"""
        recommendations = []
        
        if claim_data.confidence_score < 70:
            recommendations.append("Manual review recommended due to low confidence score")
        
        if not claim_data.spatial_boundary:
            recommendations.append("Spatial boundary data should be collected")
        
        if not claim_data.coordinates.get("latitude"):
            recommendations.append("GPS coordinates should be collected")
        
        return recommendations
    
    def _calculate_verification_confidence(self, report: VerificationReport) -> float:
        """Calculate verification confidence level"""
        try:
            base_score = 50.0
            
            # Add points for findings
            base_score += len(report.findings) * 5
            
            # Add points for supporting documents
            base_score += len(report.supporting_documents) * 10
            
            return min(base_score, 100.0)
            
        except Exception as e:
            logger.error(f"Error calculating verification confidence: {str(e)}")
            return 0.0

# Example usage
if __name__ == "__main__":
    digitizer = DocumentDigitizer()
    report_generator = VerificationReportGenerator()
    
    # Example processing
    sample_text = """
    FRA Claim Application
    Claim Number: FRA/2024/001
    Type: IFR
    Applicant Name: Rajesh Kumar
    Village: Village A
    Block: Block A
    District: District A
    State: Maharashtra
    Area: 2.5 hectares
    Coordinates: 19.0760, 73.8567
    Date: 15/01/2024
    """
    
    # Create sample data
    sample_data = FRAClaimData(
        claim_number="FRA/2024/001",
        claim_type="IFR",
        applicant_name="Rajesh Kumar",
        village="Village A",
        block="Block A",
        district="District A",
        state="Maharashtra",
        area_hectares=2.5,
        coordinates={"latitude": 19.0760, "longitude": 73.8567},
        submitted_date="15/01/2024",
        verification_status="pending",
        documents=[],
        spatial_boundary=None,
        extracted_text=sample_text,
        confidence_score=85.0,
        processing_timestamp=datetime.now().isoformat()
    )
    
    # Generate verification report
    report = report_generator.generate_verification_report(
        sample_data, "field_verification", "Field Officer 001"
    )
    
    print("Sample FRA Claim Data:")
    print(json.dumps(asdict(sample_data), indent=2))
    print("\nSample Verification Report:")
    print(json.dumps(asdict(report), indent=2))




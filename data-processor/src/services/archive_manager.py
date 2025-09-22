"""
Machine-Readable Archive Manager for FRA Atlas
Creates and manages standardized archives of FRA claims, verification reports, and pattas
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import pandas as pd
import sqlite3
from dataclasses import dataclass, asdict
import uuid
import hashlib
import zipfile
import shutil
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ArchiveMetadata:
    """Metadata for archive files"""
    archive_id: str
    archive_name: str
    archive_type: str  # claims, verification_reports, pattas, complete
    created_at: str
    created_by: str
    total_records: int
    total_size_bytes: int
    file_format: str  # json, csv, sqlite, zip
    schema_version: str
    description: str
    checksum: str

@dataclass
class ArchiveRecord:
    """Individual record in archive"""
    record_id: str
    record_type: str
    data: Dict[str, Any]
    metadata: Dict[str, Any]
    created_at: str
    updated_at: str
    checksum: str

class ArchiveManager:
    """Main class for managing machine-readable archives"""
    
    def __init__(self, archive_root: str = "archives"):
        self.archive_root = archive_root
        self.schema_version = "1.0"
        self.supported_formats = ["json", "csv", "sqlite", "zip"]
        
        # Create archive directory
        os.makedirs(self.archive_root, exist_ok=True)
        
    def create_claims_archive(self, claims_data: List[Dict], 
                            output_format: str = "json") -> ArchiveMetadata:
        """
        Create a machine-readable archive of FRA claims
        """
        try:
            logger.info(f"Creating claims archive in {output_format} format")
            
            archive_id = str(uuid.uuid4())
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            archive_name = f"fra_claims_archive_{timestamp}"
            
            # Create archive directory
            archive_dir = os.path.join(self.archive_root, archive_name)
            os.makedirs(archive_dir, exist_ok=True)
            
            # Process and standardize claims data
            standardized_data = self._standardize_claims_data(claims_data)
            
            # Create archive based on format
            if output_format == "json":
                archive_path = self._create_json_archive(standardized_data, archive_dir, archive_name)
            elif output_format == "csv":
                archive_path = self._create_csv_archive(standardized_data, archive_dir, archive_name)
            elif output_format == "sqlite":
                archive_path = self._create_sqlite_archive(standardized_data, archive_dir, archive_name)
            elif output_format == "zip":
                archive_path = self._create_zip_archive(standardized_data, archive_dir, archive_name)
            else:
                raise ValueError(f"Unsupported format: {output_format}")
            
            # Generate metadata
            metadata = self._generate_archive_metadata(
                archive_id, archive_name, "claims", archive_path, 
                len(standardized_data), output_format
            )
            
            # Save metadata
            metadata_path = os.path.join(archive_dir, "archive_metadata.json")
            with open(metadata_path, 'w') as f:
                json.dump(asdict(metadata), f, indent=2)
            
            logger.info(f"Successfully created claims archive: {archive_path}")
            return metadata
            
        except Exception as e:
            logger.error(f"Error creating claims archive: {str(e)}")
            raise
    
    def create_verification_reports_archive(self, reports_data: List[Dict], 
                                          output_format: str = "json") -> ArchiveMetadata:
        """
        Create a machine-readable archive of verification reports
        """
        try:
            logger.info(f"Creating verification reports archive in {output_format} format")
            
            archive_id = str(uuid.uuid4())
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            archive_name = f"fra_verification_reports_archive_{timestamp}"
            
            # Create archive directory
            archive_dir = os.path.join(self.archive_root, archive_name)
            os.makedirs(archive_dir, exist_ok=True)
            
            # Process and standardize reports data
            standardized_data = self._standardize_reports_data(reports_data)
            
            # Create archive based on format
            if output_format == "json":
                archive_path = self._create_json_archive(standardized_data, archive_dir, archive_name)
            elif output_format == "csv":
                archive_path = self._create_csv_archive(standardized_data, archive_dir, archive_name)
            elif output_format == "sqlite":
                archive_path = self._create_sqlite_archive(standardized_data, archive_dir, archive_name)
            elif output_format == "zip":
                archive_path = self._create_zip_archive(standardized_data, archive_dir, archive_name)
            else:
                raise ValueError(f"Unsupported format: {output_format}")
            
            # Generate metadata
            metadata = self._generate_archive_metadata(
                archive_id, archive_name, "verification_reports", archive_path, 
                len(standardized_data), output_format
            )
            
            # Save metadata
            metadata_path = os.path.join(archive_dir, "archive_metadata.json")
            with open(metadata_path, 'w') as f:
                json.dump(asdict(metadata), f, indent=2)
            
            logger.info(f"Successfully created verification reports archive: {archive_path}")
            return metadata
            
        except Exception as e:
            logger.error(f"Error creating verification reports archive: {str(e)}")
            raise
    
    def create_pattas_archive(self, pattas_data: List[Dict], 
                            output_format: str = "json") -> ArchiveMetadata:
        """
        Create a machine-readable archive of FRA pattas
        """
        try:
            logger.info(f"Creating pattas archive in {output_format} format")
            
            archive_id = str(uuid.uuid4())
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            archive_name = f"fra_pattas_archive_{timestamp}"
            
            # Create archive directory
            archive_dir = os.path.join(self.archive_root, archive_name)
            os.makedirs(archive_dir, exist_ok=True)
            
            # Process and standardize pattas data
            standardized_data = self._standardize_pattas_data(pattas_data)
            
            # Create archive based on format
            if output_format == "json":
                archive_path = self._create_json_archive(standardized_data, archive_dir, archive_name)
            elif output_format == "csv":
                archive_path = self._create_csv_archive(standardized_data, archive_dir, archive_name)
            elif output_format == "sqlite":
                archive_path = self._create_sqlite_archive(standardized_data, archive_dir, archive_name)
            elif output_format == "zip":
                archive_path = self._create_zip_archive(standardized_data, archive_dir, archive_name)
            else:
                raise ValueError(f"Unsupported format: {output_format}")
            
            # Generate metadata
            metadata = self._generate_archive_metadata(
                archive_id, archive_name, "pattas", archive_path, 
                len(standardized_data), output_format
            )
            
            # Save metadata
            metadata_path = os.path.join(archive_dir, "archive_metadata.json")
            with open(metadata_path, 'w') as f:
                json.dump(asdict(metadata), f, indent=2)
            
            logger.info(f"Successfully created pattas archive: {archive_path}")
            return metadata
            
        except Exception as e:
            logger.error(f"Error creating pattas archive: {str(e)}")
            raise
    
    def create_complete_archive(self, claims_data: List[Dict], 
                              reports_data: List[Dict], 
                              pattas_data: List[Dict],
                              spatial_data: List[Dict],
                              output_format: str = "zip") -> ArchiveMetadata:
        """
        Create a complete archive with all FRA data
        """
        try:
            logger.info("Creating complete FRA archive")
            
            archive_id = str(uuid.uuid4())
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            archive_name = f"fra_complete_archive_{timestamp}"
            
            # Create archive directory
            archive_dir = os.path.join(self.archive_root, archive_name)
            os.makedirs(archive_dir, exist_ok=True)
            
            # Create subdirectories
            claims_dir = os.path.join(archive_dir, "claims")
            reports_dir = os.path.join(archive_dir, "verification_reports")
            pattas_dir = os.path.join(archive_dir, "pattas")
            spatial_dir = os.path.join(archive_dir, "spatial_data")
            
            for subdir in [claims_dir, reports_dir, pattas_dir, spatial_dir]:
                os.makedirs(subdir, exist_ok=True)
            
            # Process each data type
            total_records = 0
            
            if claims_data:
                standardized_claims = self._standardize_claims_data(claims_data)
                self._create_json_archive(standardized_claims, claims_dir, "claims")
                total_records += len(standardized_claims)
            
            if reports_data:
                standardized_reports = self._standardize_reports_data(reports_data)
                self._create_json_archive(standardized_reports, reports_dir, "verification_reports")
                total_records += len(standardized_reports)
            
            if pattas_data:
                standardized_pattas = self._standardize_pattas_data(pattas_data)
                self._create_json_archive(standardized_pattas, pattas_dir, "pattas")
                total_records += len(standardized_pattas)
            
            if spatial_data:
                self._create_spatial_archive(spatial_data, spatial_dir)
                total_records += len(spatial_data)
            
            # Create master index
            master_index = self._create_master_index(archive_dir)
            
            # Create ZIP archive if requested
            if output_format == "zip":
                zip_path = os.path.join(self.archive_root, f"{archive_name}.zip")
                with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    for root, dirs, files in os.walk(archive_dir):
                        for file in files:
                            file_path = os.path.join(root, file)
                            arcname = os.path.relpath(file_path, archive_dir)
                            zipf.write(file_path, arcname)
                
                # Calculate size
                archive_size = os.path.getsize(zip_path)
                archive_path = zip_path
            else:
                archive_size = self._calculate_directory_size(archive_dir)
                archive_path = archive_dir
            
            # Generate metadata
            metadata = self._generate_archive_metadata(
                archive_id, archive_name, "complete", archive_path, 
                total_records, output_format
            )
            
            # Save metadata
            metadata_path = os.path.join(archive_dir, "archive_metadata.json")
            with open(metadata_path, 'w') as f:
                json.dump(asdict(metadata), f, indent=2)
            
            logger.info(f"Successfully created complete archive: {archive_path}")
            return metadata
            
        except Exception as e:
            logger.error(f"Error creating complete archive: {str(e)}")
            raise
    
    def _standardize_claims_data(self, claims_data: List[Dict]) -> List[Dict]:
        """Standardize claims data structure"""
        standardized = []
        
        for claim in claims_data:
            standardized_claim = {
                "record_id": str(uuid.uuid4()),
                "record_type": "fra_claim",
                "data": {
                    "claim_number": claim.get("claim_number", ""),
                    "claim_type": claim.get("claim_type", ""),
                    "applicant_name": claim.get("applicant_name", ""),
                    "applicant_contact": claim.get("applicant_contact", ""),
                    "applicant_email": claim.get("applicant_email", ""),
                    "village": claim.get("village", ""),
                    "block": claim.get("block", ""),
                    "district": claim.get("district", ""),
                    "state": claim.get("state", ""),
                    "area_hectares": claim.get("area_hectares", 0.0),
                    "coordinates": claim.get("coordinates", {}),
                    "submitted_date": claim.get("submitted_date", ""),
                    "verification_status": claim.get("verification_status", "pending"),
                    "documents": claim.get("documents", []),
                    "spatial_boundary": claim.get("spatial_boundary", None)
                },
                "metadata": {
                    "confidence_score": claim.get("confidence_score", 0.0),
                    "extracted_text": claim.get("extracted_text", ""),
                    "processing_timestamp": claim.get("processing_timestamp", datetime.now().isoformat()),
                    "data_source": claim.get("data_source", ""),
                    "schema_version": self.schema_version
                },
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "checksum": self._calculate_checksum(claim)
            }
            standardized.append(standardized_claim)
        
        return standardized
    
    def _standardize_reports_data(self, reports_data: List[Dict]) -> List[Dict]:
        """Standardize verification reports data structure"""
        standardized = []
        
        for report in reports_data:
            standardized_report = {
                "record_id": str(uuid.uuid4()),
                "record_type": "verification_report",
                "data": {
                    "report_id": report.get("report_id", ""),
                    "claim_id": report.get("claim_id", ""),
                    "verification_date": report.get("verification_date", ""),
                    "verified_by": report.get("verified_by", ""),
                    "verification_type": report.get("verification_type", ""),
                    "status": report.get("status", ""),
                    "findings": report.get("findings", []),
                    "recommendations": report.get("recommendations", []),
                    "supporting_documents": report.get("supporting_documents", []),
                    "spatial_accuracy": report.get("spatial_accuracy", None),
                    "confidence_level": report.get("confidence_level", 0.0)
                },
                "metadata": {
                    "schema_version": self.schema_version,
                    "generated_by": "FRA Atlas Archive Manager"
                },
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "checksum": self._calculate_checksum(report)
            }
            standardized.append(standardized_report)
        
        return standardized
    
    def _standardize_pattas_data(self, pattas_data: List[Dict]) -> List[Dict]:
        """Standardize pattas data structure"""
        standardized = []
        
        for patta in pattas_data:
            standardized_patta = {
                "record_id": str(uuid.uuid4()),
                "record_type": "fra_patta",
                "data": {
                    "patta_number": patta.get("patta_number", ""),
                    "claim_number": patta.get("claim_number", ""),
                    "applicant_name": patta.get("applicant_name", ""),
                    "village": patta.get("village", ""),
                    "block": patta.get("block", ""),
                    "district": patta.get("district", ""),
                    "state": patta.get("state", ""),
                    "area_hectares": patta.get("area_hectares", 0.0),
                    "coordinates": patta.get("coordinates", {}),
                    "issued_date": patta.get("issued_date", ""),
                    "valid_until": patta.get("valid_until", ""),
                    "status": patta.get("status", "active"),
                    "spatial_boundary": patta.get("spatial_boundary", None)
                },
                "metadata": {
                    "schema_version": self.schema_version,
                    "issued_by": patta.get("issued_by", ""),
                    "verification_status": patta.get("verification_status", "verified")
                },
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "checksum": self._calculate_checksum(patta)
            }
            standardized.append(standardized_patta)
        
        return standardized
    
    def _create_json_archive(self, data: List[Dict], output_dir: str, name: str) -> str:
        """Create JSON archive"""
        output_path = os.path.join(output_dir, f"{name}.json")
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        return output_path
    
    def _create_csv_archive(self, data: List[Dict], output_dir: str, name: str) -> str:
        """Create CSV archive"""
        output_path = os.path.join(output_dir, f"{name}.csv")
        
        # Flatten data for CSV
        flattened_data = []
        for record in data:
            flattened_record = {
                "record_id": record["record_id"],
                "record_type": record["record_type"],
                "created_at": record["created_at"],
                "updated_at": record["updated_at"],
                "checksum": record["checksum"]
            }
            
            # Flatten data fields
            for key, value in record["data"].items():
                if isinstance(value, (list, dict)):
                    flattened_record[key] = json.dumps(value)
                else:
                    flattened_record[key] = value
            
            # Flatten metadata fields
            for key, value in record["metadata"].items():
                flattened_record[f"meta_{key}"] = value
            
            flattened_data.append(flattened_record)
        
        # Create DataFrame and save
        df = pd.DataFrame(flattened_data)
        df.to_csv(output_path, index=False, encoding='utf-8')
        
        return output_path
    
    def _create_sqlite_archive(self, data: List[Dict], output_dir: str, name: str) -> str:
        """Create SQLite archive"""
        output_path = os.path.join(output_dir, f"{name}.db")
        
        conn = sqlite3.connect(output_path)
        cursor = conn.cursor()
        
        # Create table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS archive_records (
                record_id TEXT PRIMARY KEY,
                record_type TEXT,
                data TEXT,
                metadata TEXT,
                created_at TEXT,
                updated_at TEXT,
                checksum TEXT
            )
        ''')
        
        # Insert data
        for record in data:
            cursor.execute('''
                INSERT INTO archive_records 
                (record_id, record_type, data, metadata, created_at, updated_at, checksum)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                record["record_id"],
                record["record_type"],
                json.dumps(record["data"]),
                json.dumps(record["metadata"]),
                record["created_at"],
                record["updated_at"],
                record["checksum"]
            ))
        
        conn.commit()
        conn.close()
        
        return output_path
    
    def _create_zip_archive(self, data: List[Dict], output_dir: str, name: str) -> str:
        """Create ZIP archive with multiple formats"""
        zip_path = os.path.join(output_dir, f"{name}.zip")
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Add JSON version
            json_path = self._create_json_archive(data, output_dir, name)
            zipf.write(json_path, f"{name}.json")
            
            # Add CSV version
            csv_path = self._create_csv_archive(data, output_dir, name)
            zipf.write(csv_path, f"{name}.csv")
            
            # Add SQLite version
            sqlite_path = self._create_sqlite_archive(data, output_dir, name)
            zipf.write(sqlite_path, f"{name}.db")
        
        return zip_path
    
    def _create_spatial_archive(self, spatial_data: List[Dict], output_dir: str):
        """Create spatial data archive"""
        spatial_file = os.path.join(output_dir, "spatial_data.json")
        
        with open(spatial_file, 'w', encoding='utf-8') as f:
            json.dump(spatial_data, f, indent=2, ensure_ascii=False)
    
    def _create_master_index(self, archive_dir: str) -> str:
        """Create master index for complete archive"""
        index_data = {
            "archive_type": "complete",
            "created_at": datetime.now().isoformat(),
            "schema_version": self.schema_version,
            "contents": {
                "claims": "claims/claims.json",
                "verification_reports": "verification_reports/verification_reports.json",
                "pattas": "pattas/pattas.json",
                "spatial_data": "spatial_data/spatial_data.json"
            },
            "description": "Complete FRA Atlas Archive with all data types"
        }
        
        index_path = os.path.join(archive_dir, "master_index.json")
        with open(index_path, 'w', encoding='utf-8') as f:
            json.dump(index_data, f, indent=2, ensure_ascii=False)
        
        return index_path
    
    def _generate_archive_metadata(self, archive_id: str, archive_name: str, 
                                 archive_type: str, archive_path: str, 
                                 total_records: int, file_format: str) -> ArchiveMetadata:
        """Generate archive metadata"""
        archive_size = os.path.getsize(archive_path) if os.path.isfile(archive_path) else self._calculate_directory_size(archive_path)
        
        metadata = ArchiveMetadata(
            archive_id=archive_id,
            archive_name=archive_name,
            archive_type=archive_type,
            created_at=datetime.now().isoformat(),
            created_by="FRA Atlas Archive Manager",
            total_records=total_records,
            total_size_bytes=archive_size,
            file_format=file_format,
            schema_version=self.schema_version,
            description=f"FRA {archive_type.replace('_', ' ').title()} Archive",
            checksum=self._calculate_file_checksum(archive_path)
        )
        
        return metadata
    
    def _calculate_checksum(self, data: Dict) -> str:
        """Calculate checksum for data"""
        data_str = json.dumps(data, sort_keys=True)
        return hashlib.md5(data_str.encode()).hexdigest()
    
    def _calculate_file_checksum(self, file_path: str) -> str:
        """Calculate checksum for file"""
        if os.path.isfile(file_path):
            with open(file_path, 'rb') as f:
                return hashlib.md5(f.read()).hexdigest()
        else:
            # For directories, calculate checksum of all files
            checksums = []
            for root, dirs, files in os.walk(file_path):
                for file in files:
                    file_path_full = os.path.join(root, file)
                    with open(file_path_full, 'rb') as f:
                        checksums.append(hashlib.md5(f.read()).hexdigest())
            return hashlib.md5(''.join(checksums).encode()).hexdigest()
    
    def _calculate_directory_size(self, directory: str) -> int:
        """Calculate total size of directory"""
        total_size = 0
        for root, dirs, files in os.walk(directory):
            for file in files:
                file_path = os.path.join(root, file)
                total_size += os.path.getsize(file_path)
        return total_size

# Example usage
if __name__ == "__main__":
    archive_manager = ArchiveManager()
    
    # Sample claims data
    sample_claims = [
        {
            "claim_number": "FRA/2024/001",
            "claim_type": "IFR",
            "applicant_name": "Rajesh Kumar",
            "village": "Village A",
            "block": "Block A",
            "district": "District A",
            "state": "Maharashtra",
            "area_hectares": 2.5,
            "coordinates": {"latitude": 19.0760, "longitude": 73.8567},
            "submitted_date": "15/01/2024",
            "verification_status": "approved",
            "confidence_score": 85.0
        }
    ]
    
    # Create claims archive
    claims_metadata = archive_manager.create_claims_archive(sample_claims, "json")
    
    print("Claims Archive Metadata:")
    print(json.dumps(asdict(claims_metadata), indent=2))
    
    # Create complete archive
    complete_metadata = archive_manager.create_complete_archive(
        sample_claims, [], [], [], "zip"
    )
    
    print("\nComplete Archive Metadata:")
    print(json.dumps(asdict(complete_metadata), indent=2))




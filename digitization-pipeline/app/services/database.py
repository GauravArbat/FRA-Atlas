from sqlalchemy import create_engine, Column, String, Float, Boolean, DateTime, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geometry
import uuid
from datetime import datetime
from typing import List, Dict, Optional, Any
import logging
import os

from ..models.schemas import DocumentMetadata, ProcessingStatus

logger = logging.getLogger(__name__)

Base = declarative_base()

class FRARecord(Base):
    __tablename__ = 'fra_records'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(String, unique=True, nullable=False)
    source_file = Column(String)
    state = Column(String)
    district = Column(String)
    village = Column(String)
    patta_holder = Column(JSON)
    claim_type = Column(String)
    claim_status = Column(String)
    area_hectares = Column(Float)
    plot_number = Column(String)
    geom = Column(Geometry('GEOMETRY', srid=4326))
    ocr_confidence = Column(Float)
    ner_confidence = Column(Float)
    languages = Column(JSON)
    raw_ocr_text = Column(Text)
    extracted_fields = Column(JSON)
    processed_at = Column(DateTime, default=datetime.utcnow)
    verified = Column(Boolean, default=False)
    verified_by = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ProcessingJob(Base):
    __tablename__ = 'processing_jobs'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(String, unique=True, nullable=False)
    status = Column(String, default='queued')  # queued, processing, completed, failed
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DatabaseService:
    def __init__(self):
        # Database URL from environment or default
        database_url = os.getenv('DATABASE_URL', 'postgresql://fra_user:fra_password@localhost:5432/fra_atlas')
        
        try:
            self.engine = create_engine(database_url)
            self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
            
            # Create tables if they don't exist
            Base.metadata.create_all(bind=self.engine)
            logger.info("Database connection established")
            
        except Exception as e:
            logger.error(f"Database connection failed: {str(e)}")
            # Use in-memory storage as fallback
            self.engine = None
            self.in_memory_storage = {}
    
    async def save_document(self, metadata: DocumentMetadata):
        """Save processed document to database"""
        try:
            if self.engine:
                session = self.SessionLocal()
                try:
                    # Convert coordinates to WKT for PostGIS
                    geom_wkt = None
                    if metadata.coordinates:
                        geom_wkt = self._geojson_to_wkt(metadata.coordinates.dict())
                    
                    record = FRARecord(
                        document_id=metadata.document_id,
                        source_file=metadata.source_file,
                        state=metadata.state,
                        district=metadata.district,
                        village=metadata.village,
                        patta_holder=metadata.patta_holder,
                        claim_type=metadata.claim_type.value if metadata.claim_type else None,
                        claim_status=metadata.claim_status.value if metadata.claim_status else None,
                        area_hectares=metadata.area_hectares,
                        plot_number=metadata.plot_number,
                        geom=geom_wkt,
                        ocr_confidence=metadata.ocr_confidence,
                        ner_confidence=metadata.ner_confidence,
                        languages=metadata.languages,
                        raw_ocr_text=metadata.raw_ocr_text,
                        extracted_fields=metadata.extracted_fields,
                        verified=metadata.verified,
                        verified_by=metadata.verified_by
                    )
                    
                    session.add(record)
                    session.commit()
                    logger.info(f"Document {metadata.document_id} saved to database")
                    
                finally:
                    session.close()
            else:
                # Fallback to in-memory storage
                self.in_memory_storage[metadata.document_id] = metadata.dict()
                
        except Exception as e:
            logger.error(f"Failed to save document {metadata.document_id}: {str(e)}")
    
    async def get_document_status(self, document_id: str) -> Optional[Dict]:
        """Get processing status of document"""
        try:
            if self.engine:
                session = self.SessionLocal()
                try:
                    job = session.query(ProcessingJob).filter(ProcessingJob.document_id == document_id).first()
                    if job:
                        return {
                            "document_id": job.document_id,
                            "status": job.status,
                            "error_message": job.error_message,
                            "created_at": job.created_at,
                            "updated_at": job.updated_at
                        }
                finally:
                    session.close()
            else:
                # Check in-memory storage
                if document_id in self.in_memory_storage:
                    return {
                        "document_id": document_id,
                        "status": "completed",
                        "created_at": datetime.utcnow()
                    }
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get status for {document_id}: {str(e)}")
            return None
    
    async def update_status(self, document_id: str, status: str, error_message: str = None):
        """Update processing status"""
        try:
            if self.engine:
                session = self.SessionLocal()
                try:
                    job = session.query(ProcessingJob).filter(ProcessingJob.document_id == document_id).first()
                    if job:
                        job.status = status
                        job.error_message = error_message
                        job.updated_at = datetime.utcnow()
                    else:
                        job = ProcessingJob(
                            document_id=document_id,
                            status=status,
                            error_message=error_message
                        )
                        session.add(job)
                    
                    session.commit()
                    
                finally:
                    session.close()
            
        except Exception as e:
            logger.error(f"Failed to update status for {document_id}: {str(e)}")
    
    async def get_documents(self, filters: Dict[str, Any] = None) -> List[DocumentMetadata]:
        """Get documents with optional filters"""
        try:
            if self.engine:
                session = self.SessionLocal()
                try:
                    query = session.query(FRARecord)
                    
                    if filters:
                        if 'state' in filters:
                            query = query.filter(FRARecord.state == filters['state'])
                        if 'district' in filters:
                            query = query.filter(FRARecord.district == filters['district'])
                        if 'village' in filters:
                            query = query.filter(FRARecord.village == filters['village'])
                    
                    records = query.all()
                    
                    # Convert to DocumentMetadata objects
                    documents = []
                    for record in records:
                        # Convert WKT back to GeoJSON
                        coordinates = None
                        if record.geom:
                            coordinates = self._wkt_to_geojson(str(record.geom))
                        
                        doc = DocumentMetadata(
                            document_id=record.document_id,
                            source_file=record.source_file,
                            state=record.state,
                            district=record.district,
                            village=record.village,
                            patta_holder=record.patta_holder or [],
                            claim_type=record.claim_type,
                            claim_status=record.claim_status,
                            area_hectares=record.area_hectares,
                            plot_number=record.plot_number,
                            coordinates=coordinates,
                            ocr_confidence=record.ocr_confidence,
                            ner_confidence=record.ner_confidence,
                            languages=record.languages or [],
                            raw_ocr_text=record.raw_ocr_text,
                            extracted_fields=record.extracted_fields or {},
                            processed_at=record.processed_at,
                            verified=record.verified,
                            verified_by=record.verified_by
                        )
                        documents.append(doc)
                    
                    return documents
                    
                finally:
                    session.close()
            else:
                # Return from in-memory storage
                documents = []
                for doc_data in self.in_memory_storage.values():
                    documents.append(DocumentMetadata(**doc_data))
                return documents
                
        except Exception as e:
            logger.error(f"Failed to get documents: {str(e)}")
            return []
    
    def _geojson_to_wkt(self, geojson: Dict) -> str:
        """Convert GeoJSON to WKT for PostGIS"""
        try:
            from shapely.geometry import shape
            geom = shape(geojson)
            return geom.wkt
        except:
            return None
    
    def _wkt_to_geojson(self, wkt: str) -> Dict:
        """Convert WKT to GeoJSON"""
        try:
            from shapely.wkt import loads
            from shapely.geometry import mapping
            geom = loads(wkt)
            return mapping(geom)
        except:
            return None
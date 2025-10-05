import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://fra_user:fra_password@localhost:5432/fra_atlas"
    
    # Redis for Celery
    redis_url: str = "redis://localhost:6379/0"
    
    # OCR Settings
    tesseract_cmd: str = "/usr/bin/tesseract"  # Path to tesseract executable
    ocr_languages: str = "eng+hin+tel+ben+ori"  # Supported languages
    ocr_confidence_threshold: float = 0.8
    
    # Cloud OCR APIs (fallback)
    google_vision_api_key: str = ""
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    
    # File Storage
    upload_dir: str = "/tmp/uploads"
    processed_dir: str = "/tmp/processed"
    max_file_size: int = 50 * 1024 * 1024  # 50MB
    
    # Processing
    batch_size: int = 10
    worker_timeout: int = 300  # 5 minutes
    
    # NER Model
    ner_model_path: str = "./models/fra_ner_model"
    spacy_model: str = "en_core_web_sm"
    
    # Geo-processing
    india_bounds: dict = {
        "lat_min": 6.0, "lat_max": 37.0,
        "lon_min": 68.0, "lon_max": 97.0
    }
    
    # Security
    secret_key: str = "your-secret-key-change-in-production"
    
    # Logging
    log_level: str = "INFO"
    log_file: str = "digitization.log"
    
    class Config:
        env_file = ".env"

settings = Settings()
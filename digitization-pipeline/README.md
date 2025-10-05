# FRA Digitization Pipeline

Production-grade pipeline to convert legacy scanned FRA documents into structured digital data.

## Features

- **Multi-format Support**: PDF, JPEG, PNG, TIFF
- **Multi-language OCR**: Hindi, English, Telugu, Bengali, Odia
- **Advanced Preprocessing**: Deskew, denoise, contrast enhancement
- **Intelligent Extraction**: NER for FRA-specific entities
- **Geo-parsing**: Coordinate extraction and validation
- **PostGIS Integration**: Spatial data storage and querying
- **Export Formats**: JSON, GeoJSON, Shapefile
- **Human-in-the-loop**: Verification UI (coming soon)

## Quick Start

### Using Docker (Recommended)

```bash
# Clone and start services
git clone <repo-url>
cd digitization-pipeline
docker-compose up -d

# Check status
curl http://localhost:8001/health
```

### Manual Installation

```bash
# Install system dependencies (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install tesseract-ocr tesseract-ocr-hin tesseract-ocr-ben tesseract-ocr-tel tesseract-ocr-ori libgdal-dev gdal-bin libpq-dev

# Install Python dependencies
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Set environment variables
export DATABASE_URL="postgresql://fra_user:fra_password@localhost:5432/fra_atlas"
export REDIS_URL="redis://localhost:6379/0"

# Run the application
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

## API Usage

### Upload Single Document

```bash
curl -X POST "http://localhost:8001/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@document.pdf" \
  -F "state=Odisha" \
  -F "district=Nayagarh"
```

### Batch Upload

```bash
curl -X POST "http://localhost:8001/ingest-batch" \
  -H "Content-Type: multipart/form-data" \
  -F "files=@doc1.pdf" \
  -F "files=@doc2.jpg" \
  -F "state=Madhya Pradesh"
```

### Check Status

```bash
curl "http://localhost:8001/status/{document_id}"
```

### Export Data

```bash
# Export as GeoJSON
curl "http://localhost:8001/export/geojson?state=Odisha&district=Nayagarh"

# Export as JSON
curl "http://localhost:8001/export/json?village=Example Village"
```

## Data Schema

### Input Documents
- FRA claim forms (IFR/CR/CFR)
- Patta documents
- Verification reports
- Survey records

### Output Schema
```json
{
  "document_id": "uuid",
  "source_file": "s3://bucket/file.pdf",
  "state": "Odisha",
  "district": "Nayagarh", 
  "village": "Example Village",
  "patta_holder": ["Ramesh Soren"],
  "claim_type": "IFR|CR|CFR",
  "claim_status": "Pending|Verified|Granted",
  "area_hectares": 2.5,
  "plot_number": "123/A",
  "coordinates": {
    "type": "Polygon",
    "coordinates": [[[lon,lat], ...]]
  },
  "ocr_confidence": 0.91,
  "ner_confidence": 0.87,
  "languages": ["od", "en"],
  "raw_ocr_text": "...",
  "extracted_fields": {...},
  "processed_at": "2024-01-15T10:30:00Z",
  "verified": false
}
```

## Database Schema

```sql
CREATE TABLE fra_records (
    id UUID PRIMARY KEY,
    document_id TEXT UNIQUE,
    state TEXT,
    district TEXT,
    village TEXT,
    patta_holder JSONB,
    claim_type TEXT,
    claim_status TEXT,
    area_hectares NUMERIC,
    plot_number TEXT,
    geom GEOMETRY(POLYGON, 4326),
    ocr_confidence NUMERIC,
    ner_confidence NUMERIC,
    raw_ocr_text TEXT,
    extracted_fields JSONB,
    processed_at TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE
);
```

## Configuration

Environment variables in `.env`:

```env
DATABASE_URL=postgresql://fra_user:fra_password@localhost:5432/fra_atlas
REDIS_URL=redis://localhost:6379/0
OCR_LANGUAGES=eng+hin+tel+ben+ori
OCR_CONFIDENCE_THRESHOLD=0.8
GOOGLE_VISION_API_KEY=your-api-key
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## Performance Targets

- **OCR Accuracy**: ≥90% on standard scans
- **NER F1 Score**: ≥0.75 (initial), ≥0.85 (target)
- **Geo-matching**: ≥80% correct village assignment
- **Throughput**: 500 documents/day per worker

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Upload    │───▶│ Preprocessing │───▶│     OCR     │
│    API      │    │   (OpenCV)   │    │ (Tesseract) │
└─────────────┘    └──────────────┘    └─────────────┘
                                              │
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Export    │◀───│   PostGIS    │◀───│     NER     │
│ (GeoJSON/   │    │   Database   │    │  (spaCy)    │
│ Shapefile)  │    │              │    │             │
└─────────────┘    └──────────────┘    └─────────────┘
                          │
                   ┌──────────────┐
                   │ Geo-parsing  │
                   │ & Validation │
                   └──────────────┘
```

## Development

### Adding New Languages

1. Install Tesseract language pack:
   ```bash
   sudo apt-get install tesseract-ocr-<lang>
   ```

2. Update `OCR_LANGUAGES` in config:
   ```python
   ocr_languages: str = "eng+hin+tel+ben+ori+<new_lang>"
   ```

### Custom NER Training

1. Prepare training data in spaCy format
2. Train custom model:
   ```bash
   python -m spacy train config.cfg --output ./models --paths.train train.spacy --paths.dev dev.spacy
   ```

3. Update model path in config

### Adding Cadastral Integration

Implement cadastral matching in `geo_parser.py`:

```python
def query_cadastral_service(self, plot_number: str, village: str) -> Optional[Dict]:
    # Integrate with BhuNaksha or state portal APIs
    pass
```

## Monitoring

- **Logs**: `/app/logs/digitization.log`
- **Metrics**: OCR confidence, NER scores, processing time
- **Health Check**: `GET /health`

## Deployment

### AWS ECS Deployment

```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker build -t fra-digitization .
docker tag fra-digitization:latest <account>.dkr.ecr.us-east-1.amazonaws.com/fra-digitization:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/fra-digitization:latest

# Deploy using ECS task definition
aws ecs update-service --cluster fra-cluster --service digitization-service --force-new-deployment
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fra-digitization
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fra-digitization
  template:
    metadata:
      labels:
        app: fra-digitization
    spec:
      containers:
      - name: digitization-api
        image: fra-digitization:latest
        ports:
        - containerPort: 8001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: fra-secrets
              key: database-url
```

## Support

- **Documentation**: [API Docs](http://localhost:8001/docs)
- **Issues**: Create GitHub issue
- **Contact**: #fra-digitization Slack channel

## License

MIT License - see LICENSE file for details.
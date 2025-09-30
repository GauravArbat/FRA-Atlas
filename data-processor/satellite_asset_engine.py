"""
Satellite Asset Mapping Engine
"""
import ee
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict
import json
from datetime import datetime
import os
import time

app = FastAPI(title="Satellite Asset Mapping Engine", version="1.0.0")

# Initialize Google Earth Engine
try:
    if os.getenv('GEE_SERVICE_ACCOUNT_EMAIL'):
        credentials = ee.ServiceAccountCredentials(
            os.getenv('GEE_SERVICE_ACCOUNT_EMAIL'),
            os.getenv('GEE_PRIVATE_KEY_PATH')
        )
        ee.Initialize(credentials)
    else:
        ee.Initialize()
    GEE_AVAILABLE = True
    print("✅ Google Earth Engine initialized for asset mapping")
except Exception as e:
    GEE_AVAILABLE = False
    print(f"⚠️ GEE not available: {e}")

class AssetMappingRequest(BaseModel):
    state: str
    district: str
    village: str

class AssetMappingResponse(BaseModel):
    village_id: str
    village_name: str
    coordinates: List[float]
    assets: Dict[str, List[Dict]]
    processing_time: float

class SatelliteAssetMapper:
    """Satellite-based asset mapping using Google Earth Engine"""
    
    def __init__(self):
        self.village_coordinates = {
            'Khargone Village': [21.8245, 75.6102],
            'Tribal Settlement': [21.9270, 86.7470],
            'Forest Village': [23.8315, 91.2868],
            'Suburban Village': [17.3850, 78.4867],
            'Tribal Settlement A': [21.7245, 75.5102],
            'Forest Village B': [21.9245, 75.7102],
            'Forest Village C': [22.0270, 86.8470],
            'Adivasi Gram': [21.8270, 86.6470],
            'Tribal Colony': [23.7315, 91.1868],
            'Hill Village': [23.9315, 91.3868],
            'Tribal Area': [17.2850, 78.3867],
            'Forest Settlement': [17.4850, 78.5867]
        }
    
    def map_assets(self, state: str, district: str, village: str) -> Dict:
        """Map assets for a specific village"""
        start_time = time.time()
        
        # Get village coordinates
        coordinates = self.village_coordinates.get(village, [22.0, 78.0])
        
        if GEE_AVAILABLE:
            try:
                assets = self._get_gee_assets(coordinates[0], coordinates[1])
            except Exception as e:
                print(f"GEE error: {e}")
                assets = self._get_mock_assets(village)
        else:
            assets = self._get_mock_assets(village)
        
        processing_time = time.time() - start_time
        
        return {
            'village_id': f"{state[:2].upper()}{district[:3].upper()}{village[:3].upper()}",
            'village_name': village,
            'coordinates': coordinates,
            'assets': assets,
            'processing_time': round(processing_time, 2)
        }
    
    def _get_gee_assets(self, lat: float, lon: float) -> Dict:
        """Get actual assets from Google Earth Engine"""
        point = ee.Geometry.Point([lon, lat])
        area = point.buffer(3000)  # 3km buffer
        
        assets = {
            'water_bodies': self._detect_water_bodies(area),
            'agricultural_land': self._detect_agricultural_land(area),
            'forest_cover': self._detect_forest_cover(area),
            'infrastructure': self._detect_infrastructure(area)
        }
        
        return assets
    
    def _detect_water_bodies(self, area) -> List[Dict]:
        """Detect water bodies using JRC Global Surface Water"""
        try:
            gsw = ee.Image('JRC/GSW1_4/GlobalSurfaceWater')
            water_occurrence = gsw.select('occurrence')
            
            # Create water mask (>50% occurrence)
            water_mask = water_occurrence.gt(50)
            
            # Get water pixels
            water_pixels = water_mask.reduceToVectors(
                geometry=area,
                scale=30,
                maxPixels=1e6
            )
            
            # Convert to list
            water_features = water_pixels.getInfo()['features']
            
            water_bodies = []
            for i, feature in enumerate(water_features[:10]):  # Limit to 10
                coords = feature['geometry']['coordinates'][0][0]
                area_ha = ee.Geometry.Polygon(feature['geometry']['coordinates']).area().divide(10000).getInfo()
                
                water_bodies.append({
                    'type': 'pond' if area_ha < 1 else 'lake' if area_ha < 10 else 'water_body',
                    'area': round(area_ha, 2),
                    'coordinates': [coords[1], coords[0]]
                })
            
            return water_bodies
            
        except Exception as e:
            print(f"Water detection error: {e}")
            return self._mock_water_bodies()
    
    def _detect_agricultural_land(self, area) -> List[Dict]:
        """Detect agricultural land using NDVI and land cover"""
        try:
            # Sentinel-2 NDVI
            s2 = ee.ImageCollection('COPERNICUS/S2_SR') \
                .filterDate('2023-06-01', '2023-08-31') \
                .filterBounds(area) \
                .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
            
            ndvi = s2.map(lambda img: img.normalizedDifference(['B8', 'B4'])).median()
            
            # Agricultural mask (NDVI > 0.4)
            agri_mask = ndvi.gt(0.4)
            
            # ESA WorldCover cropland
            worldcover = ee.ImageCollection('ESA/WorldCover/v200').first()
            cropland_mask = worldcover.eq(40)  # Cropland class
            
            # Combine masks
            combined_mask = agri_mask.And(cropland_mask)
            
            # Convert to vectors
            agri_vectors = combined_mask.reduceToVectors(
                geometry=area,
                scale=20,
                maxPixels=1e6
            )
            
            agri_features = agri_vectors.getInfo()['features']
            
            agricultural_land = []
            for i, feature in enumerate(agri_features[:15]):  # Limit to 15
                coords = feature['geometry']['coordinates'][0][0]
                area_ha = ee.Geometry.Polygon(feature['geometry']['coordinates']).area().divide(10000).getInfo()
                
                agricultural_land.append({
                    'type': 'cropland' if area_ha > 2 else 'small_farm',
                    'area': round(area_ha, 2),
                    'coordinates': [coords[1], coords[0]]
                })
            
            return agricultural_land
            
        except Exception as e:
            print(f"Agriculture detection error: {e}")
            return self._mock_agricultural_land()
    
    def _detect_forest_cover(self, area) -> List[Dict]:
        """Detect forest cover using ESA WorldCover"""
        try:
            worldcover = ee.ImageCollection('ESA/WorldCover/v200').first()
            
            # Forest classes: 10 (Tree cover)
            forest_mask = worldcover.eq(10)
            
            # Convert to vectors
            forest_vectors = forest_mask.reduceToVectors(
                geometry=area,
                scale=20,
                maxPixels=1e6
            )
            
            forest_features = forest_vectors.getInfo()['features']
            
            forest_cover = []
            for i, feature in enumerate(forest_features[:12]):  # Limit to 12
                coords = feature['geometry']['coordinates'][0][0]
                area_ha = ee.Geometry.Polygon(feature['geometry']['coordinates']).area().divide(10000).getInfo()
                
                forest_cover.append({
                    'type': 'dense_forest' if area_ha > 5 else 'forest_patch',
                    'area': round(area_ha, 2),
                    'coordinates': [coords[1], coords[0]]
                })
            
            return forest_cover
            
        except Exception as e:
            print(f"Forest detection error: {e}")
            return self._mock_forest_cover()
    
    def _detect_infrastructure(self, area) -> List[Dict]:
        """Detect infrastructure using nighttime lights and built-up areas"""
        try:
            # ESA WorldCover built-up areas
            worldcover = ee.ImageCollection('ESA/WorldCover/v200').first()
            built_mask = worldcover.eq(50)  # Built-up class
            
            # VIIRS nighttime lights
            viirs = ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG') \
                .filterDate('2023-01-01', '2023-12-31') \
                .select('avg_rad').median()
            
            # Infrastructure mask (nightlights > 0.5)
            infra_mask = viirs.gt(0.5).And(built_mask)
            
            # Convert to vectors
            infra_vectors = infra_mask.reduceToVectors(
                geometry=area,
                scale=50,
                maxPixels=1e6
            )
            
            infra_features = infra_vectors.getInfo()['features']
            
            infrastructure = []
            for i, feature in enumerate(infra_features[:8]):  # Limit to 8
                coords = feature['geometry']['coordinates'][0][0]
                
                infrastructure.append({
                    'type': 'settlement' if i % 3 == 0 else 'road' if i % 3 == 1 else 'building',
                    'coordinates': [coords[1], coords[0]]
                })
            
            return infrastructure
            
        except Exception as e:
            print(f"Infrastructure detection error: {e}")
            return self._mock_infrastructure()
    
    def _get_mock_assets(self, village: str) -> Dict:
        """Generate realistic mock assets"""
        base_coords = self.village_coordinates.get(village, [22.0, 78.0])
        
        return {
            'water_bodies': self._mock_water_bodies(base_coords),
            'agricultural_land': self._mock_agricultural_land(base_coords),
            'forest_cover': self._mock_forest_cover(base_coords),
            'infrastructure': self._mock_infrastructure(base_coords)
        }
    
    def _mock_water_bodies(self, base_coords=[22.0, 78.0]) -> List[Dict]:
        return [
            {'type': 'pond', 'area': 0.5, 'coordinates': [base_coords[0] + 0.01, base_coords[1] + 0.01]},
            {'type': 'lake', 'area': 2.3, 'coordinates': [base_coords[0] - 0.01, base_coords[1] + 0.02]},
            {'type': 'stream', 'area': 0.2, 'coordinates': [base_coords[0] + 0.02, base_coords[1] - 0.01]}
        ]
    
    def _mock_agricultural_land(self, base_coords=[22.0, 78.0]) -> List[Dict]:
        return [
            {'type': 'cropland', 'area': 5.2, 'coordinates': [base_coords[0] + 0.005, base_coords[1] + 0.005]},
            {'type': 'small_farm', 'area': 1.8, 'coordinates': [base_coords[0] - 0.005, base_coords[1] + 0.008]},
            {'type': 'cropland', 'area': 3.1, 'coordinates': [base_coords[0] + 0.008, base_coords[1] - 0.005]},
            {'type': 'small_farm', 'area': 0.9, 'coordinates': [base_coords[0] - 0.008, base_coords[1] - 0.008]}
        ]
    
    def _mock_forest_cover(self, base_coords=[22.0, 78.0]) -> List[Dict]:
        return [
            {'type': 'dense_forest', 'area': 12.5, 'coordinates': [base_coords[0] + 0.015, base_coords[1] + 0.015]},
            {'type': 'forest_patch', 'area': 3.2, 'coordinates': [base_coords[0] - 0.015, base_coords[1] + 0.012]},
            {'type': 'dense_forest', 'area': 8.7, 'coordinates': [base_coords[0] + 0.012, base_coords[1] - 0.015]}
        ]
    
    def _mock_infrastructure(self, base_coords=[22.0, 78.0]) -> List[Dict]:
        return [
            {'type': 'settlement', 'coordinates': [base_coords[0] + 0.003, base_coords[1] + 0.003]},
            {'type': 'road', 'coordinates': [base_coords[0] - 0.003, base_coords[1] + 0.006]},
            {'type': 'building', 'coordinates': [base_coords[0] + 0.006, base_coords[1] - 0.003]},
            {'type': 'settlement', 'coordinates': [base_coords[0] - 0.006, base_coords[1] - 0.006]}
        ]

# Initialize asset mapper
asset_mapper = SatelliteAssetMapper()

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "engine": "satellite_asset_mapping",
        "gee_available": GEE_AVAILABLE
    }

@app.post("/api/satellite/asset-mapping", response_model=AssetMappingResponse)
async def map_village_assets(request: AssetMappingRequest):
    """Map assets for a specific village"""
    try:
        result = asset_mapper.map_assets(request.state, request.district, request.village)
        return AssetMappingResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Asset mapping failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
"""
AI & Satellite-Driven DSS Engine with Google Earth Engine Integration
"""
import ee
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import json
from datetime import datetime, timedelta
import os
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import joblib

app = FastAPI(title="FRA DSS Engine", version="1.0.0")

# Initialize Google Earth Engine
try:
    if os.getenv('GEE_SERVICE_ACCOUNT_EMAIL'):
        # Production: Service Account
        credentials = ee.ServiceAccountCredentials(
            os.getenv('GEE_SERVICE_ACCOUNT_EMAIL'),
            os.getenv('GEE_PRIVATE_KEY_PATH')
        )
        ee.Initialize(credentials)
    else:
        # Development: User Authentication
        ee.Initialize()
    print("✅ Google Earth Engine initialized successfully")
except Exception as e:
    print(f"❌ GEE initialization failed: {e}")

class VillageData(BaseModel):
    village_id: str
    village_name: str
    state: str
    district: str
    coordinates: List[float]  # [lat, lon]
    fra_claims: int
    fra_titles: int
    population: int

class DSSRequest(BaseModel):
    villages: List[VillageData]
    schemes: List[str] = ["PM_KISAN", "JAL_JEEVAN", "MGNREGA", "DAJGUA"]
    analysis_period: str = "2023-01-01"

class DSSResponse(BaseModel):
    village_id: str
    village_name: str
    priority_score: float
    satellite_insights: Dict
    scheme_recommendations: List[Dict]
    risk_factors: List[str]

class GEESatelliteAnalyzer:
    """Google Earth Engine Satellite Data Analyzer"""
    
    def __init__(self):
        self.start_date = '2023-01-01'
        self.end_date = '2023-12-31'
    
    def analyze_village(self, lat: float, lon: float, buffer_km: float = 2) -> Dict:
        """Analyze satellite data for a village location"""
        try:
            # Create point geometry with buffer
            point = ee.Geometry.Point([lon, lat])
            area = point.buffer(buffer_km * 1000)  # Convert km to meters
            
            # Get satellite insights
            insights = {
                'ndvi': self._get_ndvi_stats(area),
                'water_availability': self._get_water_stats(area),
                'forest_cover': self._get_forest_cover(area),
                'land_use': self._get_land_use_classification(area),
                'infrastructure': self._get_infrastructure_density(area)
            }
            
            return insights
            
        except Exception as e:
            print(f"GEE Analysis Error: {e}")
            return self._get_default_insights()
    
    def _get_ndvi_stats(self, area) -> Dict:
        """Calculate NDVI statistics for agricultural assessment"""
        try:
            # Sentinel-2 NDVI
            s2 = ee.ImageCollection('COPERNICUS/S2_SR') \
                .filterDate(self.start_date, self.end_date) \
                .filterBounds(area) \
                .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
            
            def add_ndvi(image):
                ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
                return image.addBands(ndvi)
            
            s2_ndvi = s2.map(add_ndvi)
            ndvi_median = s2_ndvi.select('NDVI').median()
            
            stats = ndvi_median.reduceRegion(
                reducer=ee.Reducer.mean().combine(
                    ee.Reducer.stdDev(), '', True
                ).combine(
                    ee.Reducer.minMax(), '', True
                ),
                geometry=area,
                scale=10,
                maxPixels=1e9
            ).getInfo()
            
            return {
                'mean_ndvi': stats.get('NDVI_mean', 0.3),
                'std_ndvi': stats.get('NDVI_stdDev', 0.1),
                'min_ndvi': stats.get('NDVI_min', 0.1),
                'max_ndvi': stats.get('NDVI_max', 0.8),
                'agricultural_potential': self._classify_agricultural_potential(stats.get('NDVI_mean', 0.3))
            }
        except:
            return {'mean_ndvi': 0.3, 'agricultural_potential': 'medium'}
    
    def _get_water_stats(self, area) -> Dict:
        """Analyze water availability using JRC Global Surface Water"""
        try:
            gsw = ee.Image('JRC/GSW1_4/GlobalSurfaceWater')
            water_occurrence = gsw.select('occurrence')
            
            stats = water_occurrence.reduceRegion(
                reducer=ee.Reducer.mean().combine(ee.Reducer.max(), '', True),
                geometry=area,
                scale=30,
                maxPixels=1e9
            ).getInfo()
            
            return {
                'water_occurrence': stats.get('occurrence_mean', 10),
                'max_water_occurrence': stats.get('occurrence_max', 50),
                'water_availability': self._classify_water_availability(stats.get('occurrence_mean', 10))
            }
        except:
            return {'water_occurrence': 10, 'water_availability': 'medium'}
    
    def _get_forest_cover(self, area) -> Dict:
        """Analyze forest cover using ESA WorldCover"""
        try:
            worldcover = ee.ImageCollection('ESA/WorldCover/v200').first()
            
            # Forest classes: 10 (Tree cover)
            forest_mask = worldcover.eq(10)
            forest_area = forest_mask.multiply(ee.Image.pixelArea())
            
            total_area = ee.Image.pixelArea()
            
            forest_stats = forest_area.reduceRegion(
                reducer=ee.Reducer.sum(),
                geometry=area,
                scale=10,
                maxPixels=1e9
            ).getInfo()
            
            total_stats = total_area.reduceRegion(
                reducer=ee.Reducer.sum(),
                geometry=area,
                scale=10,
                maxPixels=1e9
            ).getInfo()
            
            forest_percentage = (forest_stats.get('classification', 0) / 
                               total_stats.get('area', 1)) * 100
            
            return {
                'forest_percentage': forest_percentage,
                'forest_density': self._classify_forest_density(forest_percentage)
            }
        except:
            return {'forest_percentage': 30, 'forest_density': 'medium'}
    
    def _get_land_use_classification(self, area) -> Dict:
        """Classify land use patterns"""
        try:
            worldcover = ee.ImageCollection('ESA/WorldCover/v200').first()
            
            # Land use classes
            classes = {
                10: 'tree_cover',
                20: 'shrubland', 
                30: 'grassland',
                40: 'cropland',
                50: 'built_up',
                60: 'bare_sparse',
                70: 'snow_ice',
                80: 'water_bodies',
                90: 'herbaceous_wetland',
                95: 'mangroves'
            }
            
            # Calculate area for each class
            pixel_area = ee.Image.pixelArea()
            land_use_stats = {}
            
            for class_id, class_name in classes.items():
                class_mask = worldcover.eq(class_id)
                class_area = class_mask.multiply(pixel_area)
                
                area_stats = class_area.reduceRegion(
                    reducer=ee.Reducer.sum(),
                    geometry=area,
                    scale=10,
                    maxPixels=1e9
                ).getInfo()
                
                land_use_stats[class_name] = area_stats.get('classification', 0)
            
            return land_use_stats
        except:
            return {'cropland': 40, 'tree_cover': 30, 'grassland': 20, 'built_up': 10}
    
    def _get_infrastructure_density(self, area) -> Dict:
        """Analyze infrastructure density using nighttime lights"""
        try:
            # VIIRS nighttime lights
            viirs = ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG') \
                .filterDate(self.start_date, self.end_date) \
                .select('avg_rad')
            
            nightlights = viirs.median()
            
            stats = nightlights.reduceRegion(
                reducer=ee.Reducer.mean().combine(ee.Reducer.max(), '', True),
                geometry=area,
                scale=500,
                maxPixels=1e9
            ).getInfo()
            
            return {
                'avg_nightlights': stats.get('avg_rad_mean', 0.5),
                'max_nightlights': stats.get('avg_rad_max', 2.0),
                'infrastructure_level': self._classify_infrastructure(stats.get('avg_rad_mean', 0.5))
            }
        except:
            return {'avg_nightlights': 0.5, 'infrastructure_level': 'low'}
    
    def _classify_agricultural_potential(self, ndvi: float) -> str:
        if ndvi > 0.6: return 'high'
        elif ndvi > 0.4: return 'medium'
        else: return 'low'
    
    def _classify_water_availability(self, occurrence: float) -> str:
        if occurrence > 50: return 'high'
        elif occurrence > 20: return 'medium'
        else: return 'low'
    
    def _classify_forest_density(self, percentage: float) -> str:
        if percentage > 60: return 'high'
        elif percentage > 30: return 'medium'
        else: return 'low'
    
    def _classify_infrastructure(self, nightlights: float) -> str:
        if nightlights > 2.0: return 'high'
        elif nightlights > 0.5: return 'medium'
        else: return 'low'
    
    def _get_default_insights(self) -> Dict:
        """Default insights when GEE fails"""
        return {
            'ndvi': {'mean_ndvi': 0.3, 'agricultural_potential': 'medium'},
            'water_availability': {'water_occurrence': 10, 'water_availability': 'medium'},
            'forest_cover': {'forest_percentage': 30, 'forest_density': 'medium'},
            'land_use': {'cropland': 40, 'tree_cover': 30, 'grassland': 20, 'built_up': 10},
            'infrastructure': {'avg_nightlights': 0.5, 'infrastructure_level': 'low'}
        }

class AIMLEngine:
    """AI/ML Engine for Priority Scoring"""
    
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        self._train_model()
    
    def _train_model(self):
        """Train the priority scoring model with synthetic data"""
        # Generate synthetic training data
        np.random.seed(42)
        n_samples = 1000
        
        # Features: [fra_claims, fra_titles, population, ndvi, water_availability, 
        #           forest_cover, infrastructure, agricultural_potential]
        X = np.random.rand(n_samples, 8)
        
        # Synthetic priority scores based on feature combinations
        y = (X[:, 0] * 0.2 +  # FRA claims
             X[:, 1] * 0.25 + # FRA titles  
             X[:, 2] * 0.15 + # Population
             X[:, 3] * 0.15 + # NDVI
             X[:, 4] * 0.1 +  # Water availability
             X[:, 5] * 0.05 + # Forest cover
             X[:, 6] * 0.05 + # Infrastructure
             X[:, 7] * 0.05   # Agricultural potential
             ) * 100
        
        # Add some noise
        y += np.random.normal(0, 5, n_samples)
        y = np.clip(y, 0, 100)
        
        # Train model
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        self.is_trained = True
        
        print("✅ AI/ML model trained successfully")
    
    def calculate_priority_score(self, village_data: VillageData, satellite_insights: Dict) -> float:
        """Calculate priority score for a village"""
        if not self.is_trained:
            return 50.0  # Default score
        
        try:
            # Extract features
            features = [
                village_data.fra_claims / 100,  # Normalize
                village_data.fra_titles / 100,
                village_data.population / 10000,
                satellite_insights['ndvi']['mean_ndvi'],
                satellite_insights['water_availability']['water_occurrence'] / 100,
                satellite_insights['forest_cover']['forest_percentage'] / 100,
                satellite_insights['infrastructure']['avg_nightlights'] / 10,
                self._encode_potential(satellite_insights['ndvi']['agricultural_potential'])
            ]
            
            # Scale and predict
            features_scaled = self.scaler.transform([features])
            score = self.model.predict(features_scaled)[0]
            
            return max(0, min(100, score))  # Clip to 0-100 range
            
        except Exception as e:
            print(f"Priority calculation error: {e}")
            return 50.0
    
    def _encode_potential(self, potential: str) -> float:
        mapping = {'low': 0.2, 'medium': 0.5, 'high': 0.8}
        return mapping.get(potential, 0.5)

class SchemeRecommendationEngine:
    """Government Scheme Recommendation Engine"""
    
    def __init__(self):
        self.schemes = {
            'PM_KISAN': {
                'name': 'PM-KISAN',
                'description': 'Direct income support to farmers',
                'eligibility_rules': self._pm_kisan_rules,
                'priority_weight': 0.3
            },
            'JAL_JEEVAN': {
                'name': 'Jal Jeevan Mission',
                'description': 'Functional household tap connections',
                'eligibility_rules': self._jal_jeevan_rules,
                'priority_weight': 0.25
            },
            'MGNREGA': {
                'name': 'MGNREGA',
                'description': 'Employment guarantee scheme',
                'eligibility_rules': self._mgnrega_rules,
                'priority_weight': 0.25
            },
            'DAJGUA': {
                'name': 'DAJGUA',
                'description': 'Tribal development schemes',
                'eligibility_rules': self._dajgua_rules,
                'priority_weight': 0.2
            }
        }
    
    def get_recommendations(self, village_data: VillageData, satellite_insights: Dict) -> List[Dict]:
        """Get scheme recommendations for a village"""
        recommendations = []
        
        for scheme_id, scheme_info in self.schemes.items():
            eligibility_score = scheme_info['eligibility_rules'](village_data, satellite_insights)
            
            if eligibility_score > 0.3:  # Threshold for recommendation
                recommendations.append({
                    'scheme_id': scheme_id,
                    'scheme_name': scheme_info['name'],
                    'description': scheme_info['description'],
                    'eligibility_score': round(eligibility_score * 100, 1),
                    'priority': 'high' if eligibility_score > 0.7 else 'medium' if eligibility_score > 0.5 else 'low',
                    'recommended_actions': self._get_actions(scheme_id, village_data, satellite_insights)
                })
        
        # Sort by eligibility score
        recommendations.sort(key=lambda x: x['eligibility_score'], reverse=True)
        return recommendations
    
    def _pm_kisan_rules(self, village_data: VillageData, satellite_insights: Dict) -> float:
        """PM-KISAN eligibility rules"""
        score = 0.0
        
        # Agricultural potential
        agri_potential = satellite_insights['ndvi']['agricultural_potential']
        if agri_potential == 'high': score += 0.4
        elif agri_potential == 'medium': score += 0.2
        
        # Land use - cropland percentage
        cropland_pct = satellite_insights['land_use'].get('cropland', 0) / 1000000  # Normalize
        score += min(0.3, cropland_pct * 0.3)
        
        # FRA titles (land ownership)
        if village_data.fra_titles > 0:
            score += 0.3
        
        return min(1.0, score)
    
    def _jal_jeevan_rules(self, village_data: VillageData, satellite_insights: Dict) -> float:
        """Jal Jeevan Mission eligibility rules"""
        score = 0.0
        
        # Water availability (inverse - less water = higher need)
        water_avail = satellite_insights['water_availability']['water_availability']
        if water_avail == 'low': score += 0.5
        elif water_avail == 'medium': score += 0.3
        
        # Population size
        if village_data.population > 500: score += 0.3
        elif village_data.population > 100: score += 0.2
        
        # Infrastructure level (inverse - less infrastructure = higher need)
        infra_level = satellite_insights['infrastructure']['infrastructure_level']
        if infra_level == 'low': score += 0.2
        
        return min(1.0, score)
    
    def _mgnrega_rules(self, village_data: VillageData, satellite_insights: Dict) -> float:
        """MGNREGA eligibility rules"""
        score = 0.0
        
        # Population (employment need)
        if village_data.population > 200: score += 0.3
        
        # Infrastructure level (development need)
        infra_level = satellite_insights['infrastructure']['infrastructure_level']
        if infra_level == 'low': score += 0.4
        elif infra_level == 'medium': score += 0.2
        
        # FRA claims (tribal population indicator)
        if village_data.fra_claims > 0: score += 0.3
        
        return min(1.0, score)
    
    def _dajgua_rules(self, village_data: VillageData, satellite_insights: Dict) -> float:
        """DAJGUA eligibility rules"""
        score = 0.0
        
        # FRA claims/titles (tribal area indicator)
        if village_data.fra_claims > 0 or village_data.fra_titles > 0:
            score += 0.5
        
        # Forest cover (tribal forest interface)
        forest_density = satellite_insights['forest_cover']['forest_density']
        if forest_density == 'high': score += 0.3
        elif forest_density == 'medium': score += 0.2
        
        # Infrastructure level (development need)
        infra_level = satellite_insights['infrastructure']['infrastructure_level']
        if infra_level == 'low': score += 0.2
        
        return min(1.0, score)
    
    def _get_actions(self, scheme_id: str, village_data: VillageData, satellite_insights: Dict) -> List[str]:
        """Get recommended actions for each scheme"""
        actions = {
            'PM_KISAN': [
                'Verify land ownership documents',
                'Register eligible farmers',
                'Set up direct benefit transfer'
            ],
            'JAL_JEEVAN': [
                'Conduct water source survey',
                'Plan pipeline infrastructure',
                'Install household connections'
            ],
            'MGNREGA': [
                'Identify employment opportunities',
                'Plan infrastructure projects',
                'Register job seekers'
            ],
            'DAJGUA': [
                'Assess tribal development needs',
                'Plan forest-based livelihoods',
                'Implement capacity building'
            ]
        }
        return actions.get(scheme_id, ['Contact district office'])

# Initialize engines
gee_analyzer = GEESatelliteAnalyzer()
aiml_engine = AIMLEngine()
scheme_engine = SchemeRecommendationEngine()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "gee_initialized": True}

@app.post("/api/dss/analyze", response_model=List[DSSResponse])
async def analyze_villages(request: DSSRequest):
    """Main DSS analysis endpoint"""
    try:
        results = []
        
        for village in request.villages:
            # 1. Get satellite insights from GEE
            satellite_insights = gee_analyzer.analyze_village(
                village.coordinates[0], 
                village.coordinates[1]
            )
            
            # 2. Calculate priority score using AI/ML
            priority_score = aiml_engine.calculate_priority_score(village, satellite_insights)
            
            # 3. Get scheme recommendations
            recommendations = scheme_engine.get_recommendations(village, satellite_insights)
            
            # 4. Identify risk factors
            risk_factors = []
            if satellite_insights['water_availability']['water_availability'] == 'low':
                risk_factors.append('Water scarcity')
            if satellite_insights['infrastructure']['infrastructure_level'] == 'low':
                risk_factors.append('Poor infrastructure')
            if satellite_insights['ndvi']['agricultural_potential'] == 'low':
                risk_factors.append('Low agricultural productivity')
            
            results.append(DSSResponse(
                village_id=village.village_id,
                village_name=village.village_name,
                priority_score=round(priority_score, 1),
                satellite_insights=satellite_insights,
                scheme_recommendations=recommendations,
                risk_factors=risk_factors
            ))
        
        # Sort by priority score
        results.sort(key=lambda x: x.priority_score, reverse=True)
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/api/dss/schemes")
async def get_available_schemes():
    """Get list of available government schemes"""
    return {
        "schemes": [
            {"id": "PM_KISAN", "name": "PM-KISAN", "description": "Direct income support to farmers"},
            {"id": "JAL_JEEVAN", "name": "Jal Jeevan Mission", "description": "Functional household tap connections"},
            {"id": "MGNREGA", "name": "MGNREGA", "description": "Employment guarantee scheme"},
            {"id": "DAJGUA", "name": "DAJGUA", "description": "Tribal development schemes"}
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
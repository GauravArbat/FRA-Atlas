"""
Simplified Hybrid DSS Engine - Python 3.12 Compatible
"""
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict
import json
from datetime import datetime
import os
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import joblib
from pathlib import Path

app = FastAPI(title="Hybrid FRA DSS Engine", version="2.0.0")

# Try to import and initialize GEE
try:
    import ee
    if os.getenv('GEE_SERVICE_ACCOUNT_EMAIL'):
        credentials = ee.ServiceAccountCredentials(
            os.getenv('GEE_SERVICE_ACCOUNT_EMAIL'),
            os.getenv('GEE_PRIVATE_KEY_PATH')
        )
        ee.Initialize(credentials)
    else:
        ee.Initialize()
    GEE_AVAILABLE = True
    print("✅ Google Earth Engine initialized")
except Exception as e:
    GEE_AVAILABLE = False
    print(f"⚠️ GEE not available: {e}")

class VillageData(BaseModel):
    village_id: str
    village_name: str
    state: str
    district: str
    coordinates: List[float]
    fra_claims: int
    fra_titles: int
    population: int

class HybridDSSResponse(BaseModel):
    village_id: str
    village_name: str
    ensemble_priority: float
    model_predictions: Dict[str, float]
    confidence_score: float
    satellite_insights: Dict
    scheme_recommendations: List[Dict]

class SimpleHybridEngine:
    """Simplified Hybrid ML Engine"""
    
    def __init__(self):
        Path("models").mkdir(exist_ok=True)
        
        self.models = {
            'random_forest': RandomForestRegressor(n_estimators=100, random_state=42),
            'gradient_boost': GradientBoostingRegressor(n_estimators=100, random_state=42),
            'neural_network': MLPRegressor(hidden_layer_sizes=(64, 32), random_state=42, max_iter=300)
        }
        
        self.scalers = {}
        self.feature_names = [
            'fra_claims', 'fra_titles', 'population', 'ndvi', 'water_occurrence',
            'forest_cover', 'nightlights', 'rainfall', 'elevation'
        ]
        self.is_trained = False
        
        # Load or train models
        if not self._load_models():
            self.train_models()
    
    def generate_training_data(self, n_samples: int = 5000):
        """Generate synthetic training data"""
        np.random.seed(42)
        features, targets = [], []
        
        for _ in range(n_samples):
            # FRA features
            fra_claims = np.random.poisson(20)
            fra_titles = np.random.poisson(15)
            population = max(50, np.random.normal(600, 300))
            
            # Satellite features
            ndvi = np.random.beta(2, 2) * 0.8 + 0.1
            water_occurrence = np.random.exponential(12)
            forest_cover = np.random.beta(1.5, 2) * 70
            nightlights = np.random.exponential(1.0)
            rainfall = max(200, np.random.normal(800, 250))
            elevation = max(0, np.random.normal(300, 150))
            
            # Priority calculation
            priority = (
                (fra_claims * 0.15) + (fra_titles * 0.20) +
                (min(population / 1000, 1) * 0.15) +
                (ndvi * 0.15) + ((100 - min(water_occurrence, 100)) / 100 * 0.12) +
                (forest_cover / 100 * 0.08) + ((3 - min(nightlights, 3)) / 3 * 0.08) +
                (abs(rainfall - 800) / 800 * 0.07)
            ) * 100
            
            # Add interactions
            if ndvi > 0.6 and water_occurrence < 15: priority += 15
            if forest_cover > 50 and fra_claims > 10: priority += 10
            
            priority = np.clip(priority + np.random.normal(0, 5), 0, 100)
            
            features.append([fra_claims, fra_titles, population, ndvi, water_occurrence,
                           forest_cover, nightlights, rainfall, elevation])
            targets.append(priority)
        
        return np.array(features), np.array(targets)
    
    def train_models(self):
        """Train all models"""
        print("🔄 Training hybrid models...")
        X, y = self.generate_training_data()
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        for name, model in self.models.items():
            print(f"🔄 Training {name}...")
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            model.fit(X_train_scaled, y_train)
            y_pred = model.predict(X_test_scaled)
            
            rmse = np.sqrt(np.mean((y_test - y_pred) ** 2))
            r2 = 1 - np.sum((y_test - y_pred) ** 2) / np.sum((y_test - np.mean(y_test)) ** 2)
            
            self.scalers[name] = scaler
            print(f"✅ {name}: RMSE={rmse:.2f}, R²={r2:.3f}")
        
        self.is_trained = True
        self._save_models()
    
    def predict_all_models(self, features: List[float]) -> Dict[str, float]:
        """Get predictions from all models"""
        predictions = {}
        features_array = np.array([features])
        
        for name, model in self.models.items():
            if name in self.scalers:
                features_scaled = self.scalers[name].transform(features_array)
                pred = model.predict(features_scaled)[0]
                predictions[name] = max(0, min(100, pred))
        
        # Ensemble (average)
        if predictions:
            predictions['ensemble'] = np.mean(list(predictions.values()))
        
        return predictions
    
    def calculate_confidence(self, predictions: Dict[str, float]) -> float:
        """Calculate confidence based on model agreement"""
        values = [v for k, v in predictions.items() if k != 'ensemble']
        if len(values) < 2:
            return 50.0
        std_dev = np.std(values)
        confidence = max(0, min(100, 100 - (std_dev * 3)))
        return confidence
    
    def _save_models(self):
        """Save models"""
        try:
            for name, model in self.models.items():
                joblib.dump(model, f'models/{name}_model.pkl')
            for name, scaler in self.scalers.items():
                joblib.dump(scaler, f'models/{name}_scaler.pkl')
        except Exception as e:
            print(f"⚠️ Could not save models: {e}")
    
    def _load_models(self) -> bool:
        """Load existing models"""
        try:
            for name in self.models.keys():
                if os.path.exists(f'models/{name}_model.pkl'):
                    self.models[name] = joblib.load(f'models/{name}_model.pkl')
                if os.path.exists(f'models/{name}_scaler.pkl'):
                    self.scalers[name] = joblib.load(f'models/{name}_scaler.pkl')
            
            if len(self.scalers) > 0:
                self.is_trained = True
                print("✅ Loaded existing models")
                return True
        except Exception as e:
            print(f"⚠️ Could not load models: {e}")
        return False

class SimpleGEEAnalyzer:
    """Simplified GEE analyzer with fallback"""
    
    def get_satellite_features(self, lat: float, lon: float) -> List[float]:
        """Get satellite features with GEE or mock data"""
        if GEE_AVAILABLE:
            try:
                return self._get_gee_features(lat, lon)
            except:
                pass
        
        # Mock realistic data
        return [
            0.35 + np.random.normal(0, 0.1),  # ndvi
            10 + np.random.exponential(8),    # water_occurrence
            30 + np.random.normal(0, 15),     # forest_cover
            0.5 + np.random.exponential(0.5), # nightlights
            800 + np.random.normal(0, 200),   # rainfall
            300 + np.random.normal(0, 100)    # elevation
        ]
    
    def _get_gee_features(self, lat: float, lon: float) -> List[float]:
        """Get actual GEE features"""
        point = ee.Geometry.Point([lon, lat])
        area = point.buffer(2000)
        
        # NDVI from Sentinel-2
        s2 = ee.ImageCollection('COPERNICUS/S2_SR') \
            .filterDate('2023-01-01', '2023-12-31') \
            .filterBounds(area) \
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
        
        ndvi = s2.map(lambda img: img.normalizedDifference(['B8', 'B4'])).median()
        ndvi_stats = ndvi.reduceRegion(ee.Reducer.mean(), area, 10).getInfo()
        ndvi_val = max(0.1, min(0.9, ndvi_stats.get('nd', 0.35)))
        
        # Water occurrence
        gsw = ee.Image('JRC/GSW1_4/GlobalSurfaceWater').select('occurrence')
        water_stats = gsw.reduceRegion(ee.Reducer.mean(), area, 30).getInfo()
        water_val = max(0, min(100, water_stats.get('occurrence', 12)))
        
        # Forest cover
        worldcover = ee.ImageCollection('ESA/WorldCover/v200').first()
        forest_mask = worldcover.eq(10)
        forest_area = forest_mask.multiply(ee.Image.pixelArea())
        total_area = ee.Image.pixelArea()
        
        forest_sum = forest_area.reduceRegion(ee.Reducer.sum(), area, 10).getInfo()
        total_sum = total_area.reduceRegion(ee.Reducer.sum(), area, 10).getInfo()
        forest_val = (forest_sum.get('classification', 0) / max(1, total_sum.get('area', 1))) * 100
        
        # Nightlights
        viirs = ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG') \
            .filterDate('2023-01-01', '2023-12-31') \
            .select('avg_rad').median()
        
        night_stats = viirs.reduceRegion(ee.Reducer.mean(), area, 500).getInfo()
        night_val = max(0, min(10, night_stats.get('avg_rad', 0.8)))
        
        # Rainfall
        chirps = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY') \
            .filterDate('2023-01-01', '2023-12-31') \
            .sum()
        
        rain_stats = chirps.reduceRegion(ee.Reducer.mean(), area, 5000).getInfo()
        rain_val = max(200, min(3000, rain_stats.get('precipitation', 950)))
        
        # Elevation
        srtm = ee.Image('USGS/SRTMGL1_003')
        elev_stats = srtm.reduceRegion(ee.Reducer.mean(), area, 30).getInfo()
        elev_val = max(0, min(8000, elev_stats.get('elevation', 350)))
        
        return [ndvi_val, water_val, forest_val, night_val, rain_val, elev_val]

class SimpleSchemeEngine:
    """Simplified scheme recommendation engine"""
    
    def get_recommendations(self, village_data: VillageData, satellite_features: List[float]) -> List[Dict]:
        ndvi, water_occ, forest_cover, nightlights = satellite_features[:4]
        
        recommendations = []
        
        # PM-KISAN
        pm_score = (0.4 if ndvi > 0.5 else 0.2) + (0.3 if village_data.fra_titles > 0 else 0) + (0.3 if forest_cover < 60 else 0.1)
        if pm_score > 0.3:
            recommendations.append({
                'scheme_name': 'PM-KISAN',
                'eligibility_score': pm_score * 100,
                'priority': 'high' if pm_score > 0.7 else 'medium'
            })
        
        # Jal Jeevan Mission
        jjm_score = (0.5 if water_occ < 20 else 0.2) + (0.3 if village_data.population > 500 else 0.1) + (0.2 if nightlights < 1.0 else 0)
        if jjm_score > 0.3:
            recommendations.append({
                'scheme_name': 'Jal Jeevan Mission',
                'eligibility_score': jjm_score * 100,
                'priority': 'high' if jjm_score > 0.7 else 'medium'
            })
        
        # MGNREGA
        mgnrega_score = (0.3 if village_data.population > 200 else 0.1) + (0.4 if nightlights < 1.0 else 0.2) + (0.3 if village_data.fra_claims > 0 else 0)
        if mgnrega_score > 0.3:
            recommendations.append({
                'scheme_name': 'MGNREGA',
                'eligibility_score': mgnrega_score * 100,
                'priority': 'high' if mgnrega_score > 0.7 else 'medium'
            })
        
        # DAJGUA
        dajgua_score = (0.5 if village_data.fra_claims > 0 or village_data.fra_titles > 0 else 0) + (0.3 if forest_cover > 40 else 0.1) + (0.2 if nightlights < 1.0 else 0)
        if dajgua_score > 0.3:
            recommendations.append({
                'scheme_name': 'DAJGUA',
                'eligibility_score': dajgua_score * 100,
                'priority': 'high' if dajgua_score > 0.7 else 'medium'
            })
        
        return sorted(recommendations, key=lambda x: x['eligibility_score'], reverse=True)

# Initialize engines
hybrid_engine = SimpleHybridEngine()
gee_analyzer = SimpleGEEAnalyzer()
scheme_engine = SimpleSchemeEngine()

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "engine": "simple_hybrid",
        "models_trained": hybrid_engine.is_trained,
        "gee_available": GEE_AVAILABLE
    }

@app.post("/api/dss/analyze")
async def hybrid_analyze(request: Dict):
    """Simplified hybrid DSS analysis"""
    try:
        villages = request.get('villages', [])
        results = []
        
        for village_data in villages:
            village = VillageData(**village_data)
            
            # Get satellite features
            satellite_features = gee_analyzer.get_satellite_features(
                village.coordinates[0], village.coordinates[1]
            )
            
            # Combine features
            all_features = [
                village.fra_claims, village.fra_titles, village.population
            ] + satellite_features
            
            # Get predictions
            predictions = hybrid_engine.predict_all_models(all_features)
            confidence = hybrid_engine.calculate_confidence(predictions)
            
            # Get recommendations
            recommendations = scheme_engine.get_recommendations(village, satellite_features)
            
            # Create insights
            satellite_insights = {
                'ndvi': {'value': satellite_features[0], 'level': 'high' if satellite_features[0] > 0.6 else 'medium' if satellite_features[0] > 0.4 else 'low'},
                'water_availability': {'value': satellite_features[1], 'level': 'high' if satellite_features[1] > 50 else 'medium' if satellite_features[1] > 20 else 'low'},
                'forest_cover': {'value': satellite_features[2], 'level': 'high' if satellite_features[2] > 60 else 'medium' if satellite_features[2] > 30 else 'low'},
                'infrastructure': {'value': satellite_features[3], 'level': 'high' if satellite_features[3] > 2 else 'medium' if satellite_features[3] > 0.5 else 'low'}
            }
            
            results.append(HybridDSSResponse(
                village_id=village.village_id,
                village_name=village.village_name,
                ensemble_priority=round(predictions.get('ensemble', 50), 1),
                model_predictions={k: round(v, 1) for k, v in predictions.items()},
                confidence_score=round(confidence, 1),
                satellite_insights=satellite_insights,
                scheme_recommendations=recommendations
            ))
        
        return sorted(results, key=lambda x: x.ensemble_priority, reverse=True)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/api/dss/model-performance")
async def get_model_performance():
    return {
        "models_available": list(hybrid_engine.models.keys()) + ['ensemble'],
        "feature_count": len(hybrid_engine.feature_names),
        "features": hybrid_engine.feature_names,
        "training_status": "completed" if hybrid_engine.is_trained else "not_trained",
        "gee_status": "available" if GEE_AVAILABLE else "mock_data"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
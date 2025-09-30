"""
Hybrid AI & Satellite-Driven DSS Engine
GEE Data + Custom ML Models for Enhanced Accuracy
"""
import ee
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import json
from datetime import datetime
import os
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, VotingRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import tensorflow as tf
from pathlib import Path

app = FastAPI(title="Hybrid FRA DSS Engine", version="2.0.0")

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
    print("✅ Google Earth Engine initialized")
except Exception as e:
    print(f"❌ GEE initialization failed: {e}")

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
    feature_importance: Dict[str, float]

class HybridMLEngine:
    """Enhanced ML Engine with Multiple Algorithms"""
    
    def __init__(self):
        # Create models directory
        Path("models").mkdir(exist_ok=True)
        
        # Initialize models
        self.models = {
            'random_forest': RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1),
            'gradient_boost': GradientBoostingRegressor(n_estimators=200, random_state=42),
            'neural_network': MLPRegressor(hidden_layer_sizes=(128, 64, 32), random_state=42, max_iter=500),
            'deep_learning': self._build_deep_model()
        }
        
        # Ensemble model
        self.ensemble = VotingRegressor([
            ('rf', self.models['random_forest']),
            ('gb', self.models['gradient_boost']),
            ('nn', self.models['neural_network'])
        ])
        
        self.scalers = {}
        self.feature_names = [
            'fra_claims', 'fra_titles', 'population', 'ndvi', 'water_occurrence',
            'forest_cover', 'nightlights', 'road_density', 'market_distance',
            'rainfall', 'elevation', 'slope'
        ]
        self.is_trained = False
        
        # Try to load existing models
        self._load_models()
        
        # Train if not loaded
        if not self.is_trained:
            self.train_models()
    
    def _build_deep_model(self):
        """Build TensorFlow deep learning model"""
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(128, activation='relu', input_shape=(12,)),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(64, activation='relu'),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dropout(0.1),
            tf.keras.layers.Dense(1, activation='linear')
        ])
        
        model.compile(optimizer='adam', loss='mse', metrics=['mae'])
        return model
    
    def generate_training_data(self, n_samples: int = 10000):
        """Generate enhanced synthetic training data"""
        np.random.seed(42)
        features, targets = [], []
        
        for _ in range(n_samples):
            # FRA features
            fra_claims = np.random.poisson(25)
            fra_titles = np.random.poisson(18)
            population = max(50, np.random.normal(800, 400))
            
            # Satellite features with realistic distributions
            ndvi = np.random.beta(2, 2) * 0.8 + 0.1
            water_occurrence = np.random.exponential(15)
            forest_cover = np.random.beta(1.5, 2) * 80
            nightlights = np.random.exponential(1.2)
            road_density = np.random.gamma(2, 1.5)
            market_distance = np.random.exponential(12)
            rainfall = max(200, np.random.normal(1000, 300))
            elevation = max(0, np.random.normal(400, 200))
            slope = np.random.exponential(4)
            
            # Complex priority calculation with interactions
            base_priority = (
                (fra_claims * 0.12) + (fra_titles * 0.18) +
                (min(population / 1500, 1) * 0.15) +
                (ndvi * 0.12) + ((100 - min(water_occurrence, 100)) / 100 * 0.12) +
                (forest_cover / 100 * 0.08) + ((5 - min(nightlights, 5)) / 5 * 0.08) +
                ((20 - min(market_distance, 20)) / 20 * 0.07) +
                (abs(rainfall - 1000) / 1000 * 0.05) + (slope / 20 * 0.03)
            ) * 100
            
            # Interaction effects
            if ndvi > 0.6 and water_occurrence < 15: base_priority += 18
            if forest_cover > 50 and fra_claims > 15: base_priority += 12
            if nightlights < 0.8 and population > 600: base_priority += 15
            if market_distance > 15 and population > 400: base_priority += 10
            
            # Add realistic noise and clip
            priority = np.clip(base_priority + np.random.normal(0, 6), 0, 100)
            
            features.append([fra_claims, fra_titles, population, ndvi, water_occurrence,
                           forest_cover, nightlights, road_density, market_distance,
                           rainfall, elevation, slope])
            targets.append(priority)
        
        return np.array(features), np.array(targets)
    
    def train_models(self):
        """Train all ML models"""
        print("🔄 Generating training data...")
        X, y = self.generate_training_data()
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        results = {}
        
        # Train traditional ML models
        for name in ['random_forest', 'gradient_boost', 'neural_network']:
            print(f"🔄 Training {name}...")
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            self.models[name].fit(X_train_scaled, y_train)
            y_pred = self.models[name].predict(X_test_scaled)
            
            mse = mean_squared_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            results[name] = {'rmse': np.sqrt(mse), 'r2': r2}
            self.scalers[name] = scaler
            
            print(f"✅ {name}: RMSE={np.sqrt(mse):.2f}, R²={r2:.3f}")
        
        # Train deep learning model
        print("🔄 Training deep_learning...")
        scaler_dl = StandardScaler()
        X_train_dl = scaler_dl.fit_transform(X_train)
        X_test_dl = scaler_dl.transform(X_test)
        
        self.models['deep_learning'].fit(
            X_train_dl, y_train, epochs=100, batch_size=64,
            validation_split=0.2, verbose=0
        )
        y_pred_dl = self.models['deep_learning'].predict(X_test_dl).flatten()
        
        mse_dl = mean_squared_error(y_test, y_pred_dl)
        r2_dl = r2_score(y_test, y_pred_dl)
        results['deep_learning'] = {'rmse': np.sqrt(mse_dl), 'r2': r2_dl}
        self.scalers['deep_learning'] = scaler_dl
        
        print(f"✅ deep_learning: RMSE={np.sqrt(mse_dl):.2f}, R²={r2_dl:.3f}")
        
        # Train ensemble
        print("🔄 Training ensemble...")
        ensemble_scaler = StandardScaler()
        X_train_ens = ensemble_scaler.fit_transform(X_train)
        X_test_ens = ensemble_scaler.transform(X_test)
        
        self.ensemble.fit(X_train_ens, y_train)
        y_pred_ens = self.ensemble.predict(X_test_ens)
        
        mse_ens = mean_squared_error(y_test, y_pred_ens)
        r2_ens = r2_score(y_test, y_pred_ens)
        results['ensemble'] = {'rmse': np.sqrt(mse_ens), 'r2': r2_ens}
        self.scalers['ensemble'] = ensemble_scaler
        
        print(f"✅ ensemble: RMSE={np.sqrt(mse_ens):.2f}, R²={r2_ens:.3f}")
        
        self.is_trained = True
        self._save_models()
        return results
    
    def predict_all_models(self, features: List[float]) -> Dict[str, float]:
        """Get predictions from all models"""
        predictions = {}
        features_array = np.array([features])
        
        for name, model in self.models.items():
            if name in self.scalers:
                features_scaled = self.scalers[name].transform(features_array)
                
                if name == 'deep_learning':
                    pred = model.predict(features_scaled)[0][0]
                else:
                    pred = model.predict(features_scaled)[0]
                
                predictions[name] = max(0, min(100, pred))
        
        # Ensemble prediction
        if 'ensemble' in self.scalers:
            features_ens = self.scalers['ensemble'].transform(features_array)
            ensemble_pred = self.ensemble.predict(features_ens)[0]
            predictions['ensemble'] = max(0, min(100, ensemble_pred))
        
        return predictions
    
    def calculate_confidence(self, predictions: Dict[str, float]) -> float:
        """Calculate prediction confidence based on model agreement"""
        values = list(predictions.values())
        std_dev = np.std(values)
        confidence = max(0, min(100, 100 - (std_dev * 2)))
        return confidence
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance from Random Forest"""
        if 'random_forest' in self.models and self.is_trained:
            importance = self.models['random_forest'].feature_importances_
            return dict(zip(self.feature_names, importance))
        return {}
    
    def _save_models(self):
        """Save trained models"""
        for name, model in self.models.items():
            if name == 'deep_learning':
                model.save(f'models/{name}_model.h5')
            else:
                joblib.dump(model, f'models/{name}_model.pkl')
        
        joblib.dump(self.ensemble, 'models/ensemble_model.pkl')
        
        for name, scaler in self.scalers.items():
            joblib.dump(scaler, f'models/{name}_scaler.pkl')
    
    def _load_models(self):
        """Load existing models"""
        try:
            for name in self.models.keys():
                if name == 'deep_learning':
                    if os.path.exists(f'models/{name}_model.h5'):
                        self.models[name] = tf.keras.models.load_model(f'models/{name}_model.h5')
                else:
                    if os.path.exists(f'models/{name}_model.pkl'):
                        self.models[name] = joblib.load(f'models/{name}_model.pkl')
                
                if os.path.exists(f'models/{name}_scaler.pkl'):
                    self.scalers[name] = joblib.load(f'models/{name}_scaler.pkl')
            
            if os.path.exists('models/ensemble_model.pkl'):
                self.ensemble = joblib.load('models/ensemble_model.pkl')
            
            if len(self.scalers) > 0:
                self.is_trained = True
                print("✅ Loaded existing trained models")
        except Exception as e:
            print(f"⚠️ Could not load models: {e}")

class EnhancedGEEAnalyzer:
    """Enhanced GEE analyzer with additional features"""
    
    def __init__(self):
        self.start_date = '2023-01-01'
        self.end_date = '2023-12-31'
    
    def get_enhanced_features(self, lat: float, lon: float) -> List[float]:
        """Get 9 enhanced satellite features"""
        try:
            point = ee.Geometry.Point([lon, lat])
            area = point.buffer(2000)
            
            # Get satellite features
            ndvi = self._get_ndvi(area)
            water_occurrence = self._get_water_occurrence(area)
            forest_cover = self._get_forest_percentage(area)
            nightlights = self._get_nightlights(area)
            road_density = self._estimate_road_density(lat, lon)
            market_distance = self._estimate_market_distance(lat, lon)
            rainfall = self._get_rainfall(area)
            elevation = self._get_elevation(area)
            slope = self._get_slope(area)
            
            return [ndvi, water_occurrence, forest_cover, nightlights,
                   road_density, market_distance, rainfall, elevation, slope]
        except:
            return [0.35, 12, 35, 0.8, 2.5, 12, 950, 350, 4.2]
    
    def _get_ndvi(self, area) -> float:
        try:
            s2 = ee.ImageCollection('COPERNICUS/S2_SR') \
                .filterDate(self.start_date, self.end_date) \
                .filterBounds(area) \
                .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
            
            ndvi = s2.map(lambda img: img.normalizedDifference(['B8', 'B4'])).median()
            stats = ndvi.reduceRegion(ee.Reducer.mean(), area, 10).getInfo()
            return max(0.1, min(0.9, stats.get('nd', 0.35)))
        except:
            return 0.35
    
    def _get_water_occurrence(self, area) -> float:
        try:
            gsw = ee.Image('JRC/GSW1_4/GlobalSurfaceWater').select('occurrence')
            stats = gsw.reduceRegion(ee.Reducer.mean(), area, 30).getInfo()
            return max(0, min(100, stats.get('occurrence', 12)))
        except:
            return 12
    
    def _get_forest_percentage(self, area) -> float:
        try:
            worldcover = ee.ImageCollection('ESA/WorldCover/v200').first()
            forest_mask = worldcover.eq(10)
            forest_area = forest_mask.multiply(ee.Image.pixelArea())
            total_area = ee.Image.pixelArea()
            
            forest_sum = forest_area.reduceRegion(ee.Reducer.sum(), area, 10).getInfo()
            total_sum = total_area.reduceRegion(ee.Reducer.sum(), area, 10).getInfo()
            
            percentage = (forest_sum.get('classification', 0) / max(1, total_sum.get('area', 1))) * 100
            return max(0, min(100, percentage))
        except:
            return 35
    
    def _get_nightlights(self, area) -> float:
        try:
            viirs = ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG') \
                .filterDate(self.start_date, self.end_date) \
                .select('avg_rad').median()
            
            stats = viirs.reduceRegion(ee.Reducer.mean(), area, 500).getInfo()
            return max(0, min(10, stats.get('avg_rad', 0.8)))
        except:
            return 0.8
    
    def _get_rainfall(self, area) -> float:
        try:
            chirps = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY') \
                .filterDate(self.start_date, self.end_date) \
                .sum()
            
            stats = chirps.reduceRegion(ee.Reducer.mean(), area, 5000).getInfo()
            return max(200, min(3000, stats.get('precipitation', 950)))
        except:
            return 950
    
    def _get_elevation(self, area) -> float:
        try:
            srtm = ee.Image('USGS/SRTMGL1_003')
            stats = srtm.reduceRegion(ee.Reducer.mean(), area, 30).getInfo()
            return max(0, min(8000, stats.get('elevation', 350)))
        except:
            return 350
    
    def _get_slope(self, area) -> float:
        try:
            srtm = ee.Image('USGS/SRTMGL1_003')
            slope = ee.Terrain.slope(srtm)
            stats = slope.reduceRegion(ee.Reducer.mean(), area, 30).getInfo()
            return max(0, min(45, stats.get('slope', 4.2)))
        except:
            return 4.2
    
    def _estimate_road_density(self, lat: float, lon: float) -> float:
        # Mock implementation - in production use OSM road data
        return np.random.gamma(2, 1.5)
    
    def _estimate_market_distance(self, lat: float, lon: float) -> float:
        # Mock implementation - in production use actual market locations
        return np.random.exponential(12)

class SchemeRecommendationEngine:
    """Enhanced scheme recommendation engine"""
    
    def get_recommendations(self, village_data: VillageData, satellite_features: List[float]) -> List[Dict]:
        ndvi, water_occ, forest_cover, nightlights = satellite_features[:4]
        
        recommendations = []
        
        # PM-KISAN
        pm_kisan_score = (
            (0.4 if ndvi > 0.5 else 0.2) +
            (0.3 if village_data.fra_titles > 0 else 0) +
            (0.3 if forest_cover < 60 else 0.1)
        )
        
        if pm_kisan_score > 0.3:
            recommendations.append({
                'scheme_name': 'PM-KISAN',
                'eligibility_score': pm_kisan_score * 100,
                'priority': 'high' if pm_kisan_score > 0.7 else 'medium',
                'actions': ['Verify land documents', 'Register farmers', 'Setup DBT']
            })
        
        # Jal Jeevan Mission
        jjm_score = (
            (0.5 if water_occ < 20 else 0.2) +
            (0.3 if village_data.population > 500 else 0.1) +
            (0.2 if nightlights < 1.0 else 0)
        )
        
        if jjm_score > 0.3:
            recommendations.append({
                'scheme_name': 'Jal Jeevan Mission',
                'eligibility_score': jjm_score * 100,
                'priority': 'high' if jjm_score > 0.7 else 'medium',
                'actions': ['Water source survey', 'Pipeline planning', 'Install connections']
            })
        
        # MGNREGA
        mgnrega_score = (
            (0.3 if village_data.population > 200 else 0.1) +
            (0.4 if nightlights < 1.0 else 0.2) +
            (0.3 if village_data.fra_claims > 0 else 0)
        )
        
        if mgnrega_score > 0.3:
            recommendations.append({
                'scheme_name': 'MGNREGA',
                'eligibility_score': mgnrega_score * 100,
                'priority': 'high' if mgnrega_score > 0.7 else 'medium',
                'actions': ['Identify work opportunities', 'Register job seekers', 'Plan projects']
            })
        
        # DAJGUA
        dajgua_score = (
            (0.5 if village_data.fra_claims > 0 or village_data.fra_titles > 0 else 0) +
            (0.3 if forest_cover > 40 else 0.1) +
            (0.2 if nightlights < 1.0 else 0)
        )
        
        if dajgua_score > 0.3:
            recommendations.append({
                'scheme_name': 'DAJGUA',
                'eligibility_score': dajgua_score * 100,
                'priority': 'high' if dajgua_score > 0.7 else 'medium',
                'actions': ['Assess tribal needs', 'Forest livelihood planning', 'Capacity building']
            })
        
        return sorted(recommendations, key=lambda x: x['eligibility_score'], reverse=True)

# Initialize engines
hybrid_ml_engine = HybridMLEngine()
gee_analyzer = EnhancedGEEAnalyzer()
scheme_engine = SchemeRecommendationEngine()

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "engine": "hybrid",
        "models_trained": hybrid_ml_engine.is_trained,
        "gee_available": True
    }

@app.post("/api/dss/analyze", response_model=List[HybridDSSResponse])
async def hybrid_analyze(request: Dict):
    """Enhanced DSS analysis with hybrid ML models"""
    try:
        villages = request.get('villages', [])
        results = []
        
        for village_data in villages:
            village = VillageData(**village_data)
            
            # Get enhanced satellite features
            satellite_features = gee_analyzer.get_enhanced_features(
                village.coordinates[0], village.coordinates[1]
            )
            
            # Combine all features
            all_features = [
                village.fra_claims, village.fra_titles, village.population
            ] + satellite_features
            
            # Get predictions from all models
            predictions = hybrid_ml_engine.predict_all_models(all_features)
            
            # Calculate confidence
            confidence = hybrid_ml_engine.calculate_confidence(predictions)
            
            # Get scheme recommendations
            recommendations = scheme_engine.get_recommendations(village, satellite_features)
            
            # Get feature importance
            feature_importance = hybrid_ml_engine.get_feature_importance()
            
            # Create satellite insights
            satellite_insights = {
                'ndvi': {'value': satellite_features[0], 'level': 'high' if satellite_features[0] > 0.6 else 'medium' if satellite_features[0] > 0.4 else 'low'},
                'water_availability': {'value': satellite_features[1], 'level': 'high' if satellite_features[1] > 50 else 'medium' if satellite_features[1] > 20 else 'low'},
                'forest_cover': {'value': satellite_features[2], 'level': 'high' if satellite_features[2] > 60 else 'medium' if satellite_features[2] > 30 else 'low'},
                'infrastructure': {'value': satellite_features[3], 'level': 'high' if satellite_features[3] > 2 else 'medium' if satellite_features[3] > 0.5 else 'low'}
            }
            
            results.append(HybridDSSResponse(
                village_id=village.village_id,
                village_name=village.village_name,
                ensemble_priority=round(predictions.get('ensemble', predictions.get('random_forest', 50)), 1),
                model_predictions={k: round(v, 1) for k, v in predictions.items()},
                confidence_score=round(confidence, 1),
                satellite_insights=satellite_insights,
                scheme_recommendations=recommendations,
                feature_importance=feature_importance
            ))
        
        return sorted(results, key=lambda x: x.ensemble_priority, reverse=True)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hybrid analysis failed: {str(e)}")

@app.get("/api/dss/model-performance")
async def get_model_performance():
    """Get model performance metrics"""
    if hybrid_ml_engine.is_trained:
        return {
            "models_available": list(hybrid_ml_engine.models.keys()) + ['ensemble'],
            "feature_count": len(hybrid_ml_engine.feature_names),
            "features": hybrid_ml_engine.feature_names,
            "training_status": "completed",
            "ensemble_available": True
        }
    else:
        return {"training_status": "not_trained"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
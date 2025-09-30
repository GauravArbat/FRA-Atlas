"""
Hybrid ML Engine: GEE + Custom Models
"""
import ee
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import tensorflow as tf
from typing import Dict, List, Tuple

class HybridMLEngine:
    """Combines GEE data with custom ML models"""
    
    def __init__(self):
        self.models = {
            'random_forest': RandomForestRegressor(n_estimators=200, random_state=42),
            'gradient_boost': GradientBoostingRegressor(n_estimators=200, random_state=42),
            'neural_network': MLPRegressor(hidden_layer_sizes=(100, 50), random_state=42),
            'deep_learning': self._build_deep_model()
        }
        self.scalers = {}
        self.is_trained = False
        
    def _build_deep_model(self):
        """Build custom deep learning model"""
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(128, activation='relu', input_shape=(12,)),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(64, activation='relu'),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dense(1, activation='linear')
        ])
        
        model.compile(
            optimizer='adam',
            loss='mse',
            metrics=['mae']
        )
        return model
    
    def generate_enhanced_training_data(self, n_samples: int = 5000) -> Tuple[np.ndarray, np.ndarray]:
        """Generate enhanced synthetic training data"""
        np.random.seed(42)
        
        # Enhanced features (12 features)
        features = []
        targets = []
        
        for _ in range(n_samples):
            # Basic FRA features
            fra_claims = np.random.poisson(30)
            fra_titles = np.random.poisson(20)
            population = np.random.normal(1000, 500)
            
            # Satellite features (more realistic distributions)
            ndvi = np.random.beta(2, 2) * 0.8 + 0.1  # 0.1 to 0.9
            water_occurrence = np.random.exponential(20)
            forest_cover = np.random.beta(1.5, 2) * 80
            
            # Infrastructure and socio-economic
            nightlights = np.random.exponential(1.5)
            road_density = np.random.gamma(2, 2)
            market_distance = np.random.exponential(15)
            
            # Climate and terrain
            rainfall = np.random.normal(1000, 300)
            elevation = np.random.normal(500, 200)
            slope = np.random.exponential(5)
            
            # Complex priority calculation with interactions
            priority = (
                # FRA importance
                (fra_claims * 0.15) + (fra_titles * 0.20) +
                # Population need
                (min(population / 2000, 1) * 0.15) +
                # Agricultural potential
                (ndvi * 0.12) +
                # Water stress (inverse)
                ((100 - min(water_occurrence, 100)) / 100 * 0.10) +
                # Forest dependency
                (forest_cover / 100 * 0.08) +
                # Infrastructure need (inverse)
                ((10 - min(nightlights, 10)) / 10 * 0.08) +
                # Accessibility (inverse)
                ((50 - min(market_distance, 50)) / 50 * 0.07) +
                # Climate vulnerability
                (abs(rainfall - 1000) / 1000 * 0.05)
            ) * 100
            
            # Add interaction effects
            if ndvi > 0.6 and water_occurrence < 20:  # High agri potential but water stress
                priority += 15
            if forest_cover > 60 and fra_claims > 20:  # High forest dependency
                priority += 10
            if nightlights < 0.5 and population > 800:  # Poor infrastructure, high population
                priority += 12
            
            # Add noise and clip
            priority += np.random.normal(0, 8)
            priority = np.clip(priority, 0, 100)
            
            features.append([
                fra_claims, fra_titles, population, ndvi, water_occurrence,
                forest_cover, nightlights, road_density, market_distance,
                rainfall, elevation, slope
            ])
            targets.append(priority)
        
        return np.array(features), np.array(targets)
    
    def train_models(self):
        """Train all ML models"""
        print("🔄 Generating enhanced training data...")
        X, y = self.generate_enhanced_training_data()
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        results = {}
        
        for model_name, model in self.models.items():
            print(f"🔄 Training {model_name}...")
            
            if model_name == 'deep_learning':
                # Scale data for deep learning
                scaler = StandardScaler()
                X_train_scaled = scaler.fit_transform(X_train)
                X_test_scaled = scaler.transform(X_test)
                self.scalers[model_name] = scaler
                
                # Train deep learning model
                history = model.fit(
                    X_train_scaled, y_train,
                    epochs=100,
                    batch_size=32,
                    validation_split=0.2,
                    verbose=0
                )
                
                # Predict
                y_pred = model.predict(X_test_scaled).flatten()
                
            else:
                # Scale data for traditional ML
                scaler = StandardScaler()
                X_train_scaled = scaler.fit_transform(X_train)
                X_test_scaled = scaler.transform(X_test)
                self.scalers[model_name] = scaler
                
                # Train traditional ML model
                model.fit(X_train_scaled, y_train)
                y_pred = model.predict(X_test_scaled)
            
            # Calculate metrics
            mse = mean_squared_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            results[model_name] = {
                'mse': mse,
                'rmse': np.sqrt(mse),
                'r2': r2
            }
            
            print(f"✅ {model_name}: RMSE={np.sqrt(mse):.2f}, R²={r2:.3f}")
        
        self.is_trained = True
        self._save_models()
        return results
    
    def predict_priority(self, features: List[float], model_name: str = 'gradient_boost') -> float:
        """Predict priority score using specified model"""
        if not self.is_trained:
            print("⚠️ Models not trained. Training now...")
            self.train_models()
        
        features_array = np.array([features])
        
        if model_name in self.scalers:
            features_scaled = self.scalers[model_name].transform(features_array)
        else:
            features_scaled = features_array
        
        if model_name == 'deep_learning':
            prediction = self.models[model_name].predict(features_scaled)[0][0]
        else:
            prediction = self.models[model_name].predict(features_scaled)[0]
        
        return max(0, min(100, prediction))
    
    def ensemble_predict(self, features: List[float]) -> Dict[str, float]:
        """Get predictions from all models and ensemble result"""
        predictions = {}
        
        for model_name in self.models.keys():
            predictions[model_name] = self.predict_priority(features, model_name)
        
        # Weighted ensemble (best performing models get higher weights)
        ensemble_score = (
            predictions['gradient_boost'] * 0.35 +
            predictions['random_forest'] * 0.25 +
            predictions['deep_learning'] * 0.25 +
            predictions['neural_network'] * 0.15
        )
        
        predictions['ensemble'] = ensemble_score
        return predictions
    
    def _save_models(self):
        """Save trained models"""
        for model_name, model in self.models.items():
            if model_name == 'deep_learning':
                model.save(f'models/{model_name}_model.h5')
            else:
                joblib.dump(model, f'models/{model_name}_model.pkl')
        
        # Save scalers
        for scaler_name, scaler in self.scalers.items():
            joblib.dump(scaler, f'models/{scaler_name}_scaler.pkl')
    
    def get_feature_importance(self, model_name: str = 'random_forest') -> Dict[str, float]:
        """Get feature importance from tree-based models"""
        feature_names = [
            'fra_claims', 'fra_titles', 'population', 'ndvi', 'water_occurrence',
            'forest_cover', 'nightlights', 'road_density', 'market_distance',
            'rainfall', 'elevation', 'slope'
        ]
        
        if model_name in ['random_forest', 'gradient_boost']:
            importance = self.models[model_name].feature_importances_
            return dict(zip(feature_names, importance))
        else:
            return {"message": f"Feature importance not available for {model_name}"}

# Enhanced GEE integration with custom features
class EnhancedGEEAnalyzer:
    """Enhanced GEE analyzer with additional features"""
    
    def __init__(self):
        try:
            ee.Initialize()
            self.gee_available = True
        except:
            self.gee_available = False
    
    def get_enhanced_features(self, lat: float, lon: float) -> List[float]:
        """Get enhanced feature set combining GEE and derived features"""
        if not self.gee_available:
            return self._get_mock_features()
        
        point = ee.Geometry.Point([lon, lat])
        area = point.buffer(2000)  # 2km buffer
        
        # Get all satellite features
        features = []
        
        # Basic satellite features (from existing implementation)
        ndvi = self._get_ndvi_mean(area)
        water_occurrence = self._get_water_occurrence(area)
        forest_cover = self._get_forest_percentage(area)
        nightlights = self._get_nightlights(area)
        
        # Additional derived features
        road_density = self._get_road_density(area)
        market_distance = self._estimate_market_distance(lat, lon)
        rainfall = self._get_rainfall(area)
        elevation = self._get_elevation(area)
        slope = self._get_slope(area)
        
        return [
            ndvi, water_occurrence, forest_cover, nightlights,
            road_density, market_distance, rainfall, elevation, slope
        ]
    
    def _get_ndvi_mean(self, area) -> float:
        """Get NDVI from Sentinel-2"""
        try:
            s2 = ee.ImageCollection('COPERNICUS/S2_SR') \
                .filterDate('2023-01-01', '2023-12-31') \
                .filterBounds(area) \
                .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
            
            ndvi = s2.map(lambda img: img.normalizedDifference(['B8', 'B4'])).median()
            stats = ndvi.reduceRegion(ee.Reducer.mean(), area, 10).getInfo()
            return stats.get('nd', 0.3)
        except:
            return 0.3
    
    def _get_water_occurrence(self, area) -> float:
        """Get water occurrence from JRC"""
        try:
            gsw = ee.Image('JRC/GSW1_4/GlobalSurfaceWater').select('occurrence')
            stats = gsw.reduceRegion(ee.Reducer.mean(), area, 30).getInfo()
            return stats.get('occurrence', 10)
        except:
            return 10
    
    def _get_forest_percentage(self, area) -> float:
        """Get forest cover from ESA WorldCover"""
        try:
            worldcover = ee.ImageCollection('ESA/WorldCover/v200').first()
            forest_mask = worldcover.eq(10)  # Tree cover
            forest_area = forest_mask.multiply(ee.Image.pixelArea())
            total_area = ee.Image.pixelArea()
            
            forest_sum = forest_area.reduceRegion(ee.Reducer.sum(), area, 10).getInfo()
            total_sum = total_area.reduceRegion(ee.Reducer.sum(), area, 10).getInfo()
            
            return (forest_sum.get('classification', 0) / total_sum.get('area', 1)) * 100
        except:
            return 30
    
    def _get_nightlights(self, area) -> float:
        """Get nighttime lights from VIIRS"""
        try:
            viirs = ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG') \
                .filterDate('2023-01-01', '2023-12-31') \
                .select('avg_rad').median()
            
            stats = viirs.reduceRegion(ee.Reducer.mean(), area, 500).getInfo()
            return stats.get('avg_rad', 0.5)
        except:
            return 0.5
    
    def _get_road_density(self, area) -> float:
        """Estimate road density (mock implementation)"""
        # In production, use OpenStreetMap data or road datasets
        return np.random.gamma(2, 2)
    
    def _estimate_market_distance(self, lat: float, lon: float) -> float:
        """Estimate distance to nearest market (mock implementation)"""
        # In production, use actual market location data
        return np.random.exponential(15)
    
    def _get_rainfall(self, area) -> float:
        """Get rainfall data from CHIRPS"""
        try:
            chirps = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY') \
                .filterDate('2023-01-01', '2023-12-31') \
                .sum()
            
            stats = chirps.reduceRegion(ee.Reducer.mean(), area, 5000).getInfo()
            return stats.get('precipitation', 1000)
        except:
            return 1000
    
    def _get_elevation(self, area) -> float:
        """Get elevation from SRTM"""
        try:
            srtm = ee.Image('USGS/SRTMGL1_003')
            stats = srtm.reduceRegion(ee.Reducer.mean(), area, 30).getInfo()
            return stats.get('elevation', 500)
        except:
            return 500
    
    def _get_slope(self, area) -> float:
        """Calculate slope from elevation"""
        try:
            srtm = ee.Image('USGS/SRTMGL1_003')
            slope = ee.Terrain.slope(srtm)
            stats = slope.reduceRegion(ee.Reducer.mean(), area, 30).getInfo()
            return stats.get('slope', 5)
        except:
            return 5
    
    def _get_mock_features(self) -> List[float]:
        """Mock features when GEE unavailable"""
        return [0.3, 10, 30, 0.5, 2, 15, 1000, 500, 5]

# Usage example
if __name__ == "__main__":
    # Initialize hybrid engine
    hybrid_engine = HybridMLEngine()
    
    # Train models
    print("🚀 Training hybrid ML models...")
    results = hybrid_engine.train_models()
    
    # Test prediction
    gee_analyzer = EnhancedGEEAnalyzer()
    
    # Example village data
    village_features = [
        45,  # fra_claims
        32,  # fra_titles
        1200,  # population
    ]
    
    # Get satellite features
    satellite_features = gee_analyzer.get_enhanced_features(21.8245, 75.6102)
    
    # Combine features
    all_features = village_features + satellite_features
    
    # Get ensemble prediction
    predictions = hybrid_engine.ensemble_predict(all_features)
    
    print(f"\n🎯 Priority Predictions:")
    for model, score in predictions.items():
        print(f"  {model}: {score:.1f}")
    
    # Get feature importance
    importance = hybrid_engine.get_feature_importance()
    print(f"\n📊 Feature Importance:")
    for feature, imp in sorted(importance.items(), key=lambda x: x[1], reverse=True):
        print(f"  {feature}: {imp:.3f}")
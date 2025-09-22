"""
Geospatial Processing Service for FRA Atlas
Handles shapefile generation, spatial data processing, and geospatial analysis
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import geopandas as gpd
import pandas as pd
import shapely.geometry as geom
from shapely.geometry import Point, Polygon, MultiPolygon
import fiona
from fiona.crs import from_epsg
import numpy as np
from dataclasses import dataclass, asdict
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class SpatialData:
    """Standardized spatial data structure"""
    feature_id: str
    claim_number: str
    geometry: Dict  # GeoJSON geometry
    properties: Dict
    area_hectares: float
    perimeter_meters: float
    centroid: Tuple[float, float]  # (longitude, latitude)
    bounding_box: Tuple[float, float, float, float]  # (minx, miny, maxx, maxy)
    spatial_accuracy: float
    data_source: str
    created_at: str

@dataclass
class ShapefileMetadata:
    """Metadata for generated shapefiles"""
    filename: str
    file_path: str
    feature_count: int
    total_area_hectares: float
    crs: str
    created_at: str
    description: str
    attributes: List[str]

class GeospatialProcessor:
    """Main class for geospatial data processing"""
    
    def __init__(self):
        self.supported_formats = ['.shp', '.geojson', '.kml', '.kmz', '.gpkg']
        self.default_crs = 'EPSG:4326'  # WGS84
        self.projected_crs = 'EPSG:3857'  # Web Mercator for area calculations
        
    def process_spatial_file(self, file_path: str, claim_data: Dict) -> SpatialData:
        """
        Process a spatial file and extract standardized spatial data
        """
        try:
            logger.info(f"Processing spatial file: {file_path}")
            
            # Read spatial file
            gdf = self._read_spatial_file(file_path)
            
            # Validate and clean geometry
            gdf = self._validate_geometry(gdf)
            
            # Calculate spatial properties
            spatial_data = self._calculate_spatial_properties(gdf, claim_data)
            
            # Enhance with claim data
            spatial_data = self._enhance_with_claim_data(spatial_data, claim_data)
            
            logger.info(f"Successfully processed spatial file: {spatial_data.feature_id}")
            return spatial_data
            
        except Exception as e:
            logger.error(f"Error processing spatial file {file_path}: {str(e)}")
            raise
    
    def generate_shapefile(self, spatial_data_list: List[SpatialData], 
                          output_path: str, 
                          description: str = "FRA Claims Spatial Data") -> ShapefileMetadata:
        """
        Generate a standardized shapefile from spatial data
        """
        try:
            logger.info(f"Generating shapefile: {output_path}")
            
            # Convert spatial data to GeoDataFrame
            gdf = self._create_geodataframe(spatial_data_list)
            
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Write shapefile
            gdf.to_file(output_path, driver='ESRI Shapefile', crs=self.default_crs)
            
            # Generate metadata
            metadata = self._generate_shapefile_metadata(gdf, output_path, description)
            
            logger.info(f"Successfully generated shapefile: {output_path}")
            return metadata
            
        except Exception as e:
            logger.error(f"Error generating shapefile: {str(e)}")
            raise
    
    def create_central_repository(self, spatial_data_list: List[SpatialData], 
                                output_dir: str) -> Dict[str, Any]:
        """
        Create a central repository with spatial indexing
        """
        try:
            logger.info(f"Creating central repository: {output_dir}")
            
            # Create output directory
            os.makedirs(output_dir, exist_ok=True)
            
            # Generate master shapefile
            master_shapefile = os.path.join(output_dir, "fra_claims_master.shp")
            master_metadata = self.generate_shapefile(
                spatial_data_list, master_shapefile, "FRA Claims Master Dataset"
            )
            
            # Generate state-wise shapefiles
            state_files = self._generate_state_wise_files(spatial_data_list, output_dir)
            
            # Generate district-wise shapefiles
            district_files = self._generate_district_wise_files(spatial_data_list, output_dir)
            
            # Create spatial index
            spatial_index = self._create_spatial_index(spatial_data_list)
            
            # Generate summary statistics
            summary_stats = self._generate_summary_statistics(spatial_data_list)
            
            # Create repository metadata
            repository_metadata = {
                "repository_id": str(uuid.uuid4()),
                "created_at": datetime.now().isoformat(),
                "total_features": len(spatial_data_list),
                "total_area_hectares": sum(data.area_hectares for data in spatial_data_list),
                "master_shapefile": master_metadata,
                "state_files": state_files,
                "district_files": district_files,
                "spatial_index": spatial_index,
                "summary_statistics": summary_stats,
                "crs": self.default_crs,
                "description": "FRA Atlas Central Repository"
            }
            
            # Save repository metadata
            metadata_file = os.path.join(output_dir, "repository_metadata.json")
            with open(metadata_file, 'w') as f:
                json.dump(repository_metadata, f, indent=2)
            
            logger.info(f"Successfully created central repository: {output_dir}")
            return repository_metadata
            
        except Exception as e:
            logger.error(f"Error creating central repository: {str(e)}")
            raise
    
    def _read_spatial_file(self, file_path: str) -> gpd.GeoDataFrame:
        """Read spatial file and return GeoDataFrame"""
        try:
            if file_path.lower().endswith('.kml') or file_path.lower().endswith('.kmz'):
                # Handle KML files
                gdf = gpd.read_file(file_path, driver='KML')
            else:
                # Handle other formats
                gdf = gpd.read_file(file_path)
            
            # Ensure CRS is set
            if gdf.crs is None:
                gdf.crs = self.default_crs
            
            return gdf
            
        except Exception as e:
            logger.error(f"Error reading spatial file {file_path}: {str(e)}")
            raise
    
    def _validate_geometry(self, gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
        """Validate and clean geometry"""
        try:
            # Remove invalid geometries
            gdf = gdf[gdf.geometry.is_valid]
            
            # Fix invalid geometries
            gdf.geometry = gdf.geometry.buffer(0)
            
            # Ensure geometries are in the correct CRS
            if gdf.crs != self.default_crs:
                gdf = gdf.to_crs(self.default_crs)
            
            return gdf
            
        except Exception as e:
            logger.error(f"Error validating geometry: {str(e)}")
            raise
    
    def _calculate_spatial_properties(self, gdf: gpd.GeoDataFrame, claim_data: Dict) -> SpatialData:
        """Calculate spatial properties from geometry"""
        try:
            # Get the first feature (assuming single feature per file)
            geometry = gdf.geometry.iloc[0]
            
            # Calculate area in hectares
            # Convert to projected CRS for accurate area calculation
            gdf_projected = gdf.to_crs(self.projected_crs)
            area_m2 = gdf_projected.geometry.iloc[0].area
            area_hectares = area_m2 / 10000  # Convert to hectares
            
            # Calculate perimeter
            perimeter_meters = gdf_projected.geometry.iloc[0].length
            
            # Calculate centroid
            centroid = geometry.centroid
            centroid_coords = (centroid.x, centroid.y)
            
            # Calculate bounding box
            bounds = geometry.bounds
            bounding_box = (bounds[0], bounds[1], bounds[2], bounds[3])
            
            # Convert geometry to GeoJSON
            geometry_dict = json.loads(gpd.GeoSeries([geometry]).to_json())['features'][0]['geometry']
            
            # Create spatial data object
            spatial_data = SpatialData(
                feature_id=str(uuid.uuid4()),
                claim_number=claim_data.get('claim_number', ''),
                geometry=geometry_dict,
                properties={},
                area_hectares=area_hectares,
                perimeter_meters=perimeter_meters,
                centroid=centroid_coords,
                bounding_box=bounding_box,
                spatial_accuracy=95.0,  # Default accuracy
                data_source=claim_data.get('source_file', ''),
                created_at=datetime.now().isoformat()
            )
            
            return spatial_data
            
        except Exception as e:
            logger.error(f"Error calculating spatial properties: {str(e)}")
            raise
    
    def _enhance_with_claim_data(self, spatial_data: SpatialData, claim_data: Dict) -> SpatialData:
        """Enhance spatial data with claim information"""
        try:
            # Add claim properties
            spatial_data.properties = {
                'claim_number': claim_data.get('claim_number', ''),
                'claim_type': claim_data.get('claim_type', ''),
                'applicant_name': claim_data.get('applicant_name', ''),
                'village': claim_data.get('village', ''),
                'block': claim_data.get('block', ''),
                'district': claim_data.get('district', ''),
                'state': claim_data.get('state', ''),
                'submitted_date': claim_data.get('submitted_date', ''),
                'verification_status': claim_data.get('verification_status', 'pending'),
                'confidence_score': claim_data.get('confidence_score', 0.0)
            }
            
            return spatial_data
            
        except Exception as e:
            logger.error(f"Error enhancing with claim data: {str(e)}")
            return spatial_data
    
    def _create_geodataframe(self, spatial_data_list: List[SpatialData]) -> gpd.GeoDataFrame:
        """Create GeoDataFrame from spatial data list"""
        try:
            features = []
            for data in spatial_data_list:
                # Create geometry from GeoJSON
                geometry = geom.shape(data.geometry)
                
                # Create feature
                feature = {
                    'geometry': geometry,
                    'feature_id': data.feature_id,
                    'claim_number': data.claim_number,
                    'area_hectares': data.area_hectares,
                    'perimeter_meters': data.perimeter_meters,
                    'centroid_lon': data.centroid[0],
                    'centroid_lat': data.centroid[1],
                    'spatial_accuracy': data.spatial_accuracy,
                    'data_source': data.data_source,
                    'created_at': data.created_at,
                    **data.properties
                }
                features.append(feature)
            
            # Create GeoDataFrame
            gdf = gpd.GeoDataFrame(features, crs=self.default_crs)
            
            return gdf
            
        except Exception as e:
            logger.error(f"Error creating GeoDataFrame: {str(e)}")
            raise
    
    def _generate_shapefile_metadata(self, gdf: gpd.GeoDataFrame, 
                                   output_path: str, description: str) -> ShapefileMetadata:
        """Generate metadata for shapefile"""
        try:
            # Calculate total area
            gdf_projected = gdf.to_crs(self.projected_crs)
            total_area_m2 = gdf_projected.geometry.area.sum()
            total_area_hectares = total_area_m2 / 10000
            
            # Get attribute names
            attributes = [col for col in gdf.columns if col != 'geometry']
            
            metadata = ShapefileMetadata(
                filename=os.path.basename(output_path),
                file_path=output_path,
                feature_count=len(gdf),
                total_area_hectares=total_area_hectares,
                crs=str(gdf.crs),
                created_at=datetime.now().isoformat(),
                description=description,
                attributes=attributes
            )
            
            return metadata
            
        except Exception as e:
            logger.error(f"Error generating shapefile metadata: {str(e)}")
            raise
    
    def _generate_state_wise_files(self, spatial_data_list: List[SpatialData], 
                                 output_dir: str) -> Dict[str, str]:
        """Generate state-wise shapefiles"""
        try:
            state_files = {}
            
            # Group by state
            state_groups = {}
            for data in spatial_data_list:
                state = data.properties.get('state', 'Unknown')
                if state not in state_groups:
                    state_groups[state] = []
                state_groups[state].append(data)
            
            # Generate files for each state
            for state, data_list in state_groups.items():
                if data_list:  # Only create file if there's data
                    safe_state_name = state.replace(' ', '_').replace('/', '_')
                    state_file = os.path.join(output_dir, f"fra_claims_{safe_state_name}.shp")
                    
                    metadata = self.generate_shapefile(
                        data_list, state_file, f"FRA Claims - {state}"
                    )
                    state_files[state] = state_file
            
            return state_files
            
        except Exception as e:
            logger.error(f"Error generating state-wise files: {str(e)}")
            return {}
    
    def _generate_district_wise_files(self, spatial_data_list: List[SpatialData], 
                                    output_dir: str) -> Dict[str, str]:
        """Generate district-wise shapefiles"""
        try:
            district_files = {}
            
            # Group by district
            district_groups = {}
            for data in spatial_data_list:
                district = data.properties.get('district', 'Unknown')
                state = data.properties.get('state', 'Unknown')
                key = f"{state}_{district}"
                
                if key not in district_groups:
                    district_groups[key] = []
                district_groups[key].append(data)
            
            # Generate files for each district
            for key, data_list in district_groups.items():
                if data_list:  # Only create file if there's data
                    safe_key = key.replace(' ', '_').replace('/', '_')
                    district_file = os.path.join(output_dir, f"fra_claims_{safe_key}.shp")
                    
                    metadata = self.generate_shapefile(
                        data_list, district_file, f"FRA Claims - {key.replace('_', ', ')}"
                    )
                    district_files[key] = district_file
            
            return district_files
            
        except Exception as e:
            logger.error(f"Error generating district-wise files: {str(e)}")
            return {}
    
    def _create_spatial_index(self, spatial_data_list: List[SpatialData]) -> Dict[str, Any]:
        """Create spatial index for efficient querying"""
        try:
            spatial_index = {
                "type": "spatial_index",
                "created_at": datetime.now().isoformat(),
                "total_features": len(spatial_data_list),
                "bounds": {
                    "minx": float('inf'),
                    "miny": float('inf'),
                    "maxx": float('-inf'),
                    "maxy": float('-inf')
                },
                "grid_cells": {},
                "feature_lookup": {}
            }
            
            # Calculate overall bounds
            for data in spatial_data_list:
                bbox = data.bounding_box
                spatial_index["bounds"]["minx"] = min(spatial_index["bounds"]["minx"], bbox[0])
                spatial_index["bounds"]["miny"] = min(spatial_index["bounds"]["miny"], bbox[1])
                spatial_index["bounds"]["maxx"] = max(spatial_index["bounds"]["maxx"], bbox[2])
                spatial_index["bounds"]["maxy"] = max(spatial_index["bounds"]["maxy"], bbox[3])
                
                # Add to feature lookup
                spatial_index["feature_lookup"][data.feature_id] = {
                    "claim_number": data.claim_number,
                    "bounds": bbox,
                    "centroid": data.centroid
                }
            
            return spatial_index
            
        except Exception as e:
            logger.error(f"Error creating spatial index: {str(e)}")
            return {}
    
    def _generate_summary_statistics(self, spatial_data_list: List[SpatialData]) -> Dict[str, Any]:
        """Generate summary statistics"""
        try:
            if not spatial_data_list:
                return {}
            
            # Calculate statistics
            total_area = sum(data.area_hectares for data in spatial_data_list)
            avg_area = total_area / len(spatial_data_list)
            
            # Group by claim type
            claim_types = {}
            for data in spatial_data_list:
                claim_type = data.properties.get('claim_type', 'Unknown')
                if claim_type not in claim_types:
                    claim_types[claim_type] = {'count': 0, 'area': 0}
                claim_types[claim_type]['count'] += 1
                claim_types[claim_type]['area'] += data.area_hectares
            
            # Group by state
            states = {}
            for data in spatial_data_list:
                state = data.properties.get('state', 'Unknown')
                if state not in states:
                    states[state] = {'count': 0, 'area': 0}
                states[state]['count'] += 1
                states[state]['area'] += data.area_hectares
            
            statistics = {
                "total_features": len(spatial_data_list),
                "total_area_hectares": total_area,
                "average_area_hectares": avg_area,
                "claim_types": claim_types,
                "states": states,
                "generated_at": datetime.now().isoformat()
            }
            
            return statistics
            
        except Exception as e:
            logger.error(f"Error generating summary statistics: {str(e)}")
            return {}

# Example usage
if __name__ == "__main__":
    processor = GeospatialProcessor()
    
    # Create sample spatial data
    sample_spatial_data = [
        SpatialData(
            feature_id="1",
            claim_number="FRA/2024/001",
            geometry={
                "type": "Polygon",
                "coordinates": [[[73.8567, 19.0760], [73.8577, 19.0760], [73.8577, 19.0770], [73.8567, 19.0770], [73.8567, 19.0760]]]
            },
            properties={
                "claim_type": "IFR",
                "applicant_name": "Rajesh Kumar",
                "village": "Village A",
                "block": "Block A",
                "district": "District A",
                "state": "Maharashtra"
            },
            area_hectares=2.5,
            perimeter_meters=400.0,
            centroid=(73.8572, 19.0765),
            bounding_box=(73.8567, 19.0760, 73.8577, 19.0770),
            spatial_accuracy=95.0,
            data_source="sample_data.shp",
            created_at=datetime.now().isoformat()
        )
    ]
    
    # Generate shapefile
    output_path = "output/fra_claims_sample.shp"
    metadata = processor.generate_shapefile(sample_spatial_data, output_path)
    
    print("Generated Shapefile Metadata:")
    print(json.dumps(asdict(metadata), indent=2))
    
    # Create central repository
    repository_metadata = processor.create_central_repository(sample_spatial_data, "output/repository")
    
    print("\nRepository Metadata:")
    print(json.dumps(repository_metadata, indent=2))




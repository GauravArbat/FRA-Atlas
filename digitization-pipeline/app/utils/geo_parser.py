import re
import numpy as np
from shapely.geometry import Point, Polygon
from typing import Dict, List, Optional, Tuple, Any
import logging

logger = logging.getLogger(__name__)

class GeoParser:
    """Parse and validate geographic coordinates from text"""
    
    def __init__(self):
        # Indian coordinate bounds for validation
        self.india_bounds = {
            'lat_min': 6.0, 'lat_max': 37.0,
            'lon_min': 68.0, 'lon_max': 97.0
        }
    
    def parse_coordinates(self, text: str, extracted_fields: Dict[str, Any]) -> Optional[Dict]:
        """Main coordinate parsing function"""
        try:
            # Try different coordinate formats
            coords = self._extract_decimal_degrees(text)
            if not coords:
                coords = self._extract_dms_coordinates(text)
            if not coords:
                coords = self._extract_utm_coordinates(text)
            
            if coords:
                return self._create_geometry(coords)
            
            # If no coordinates found, try cadastral matching
            return self._attempt_cadastral_matching(extracted_fields)
            
        except Exception as e:
            logger.error(f"Coordinate parsing failed: {str(e)}")
            return None
    
    def _extract_decimal_degrees(self, text: str) -> List[Tuple[float, float]]:
        """Extract decimal degree coordinates"""
        # Pattern for decimal degrees (lon, lat)
        patterns = [
            r'(\d{1,3}\.\d{4,6})[,\s]+(\d{1,2}\.\d{4,6})',  # 77.1234, 28.5678
            r'(\d{1,3}°\d{1,2}'\d{1,2}\.?\d*"?)[,\s]+(\d{1,2}°\d{1,2}'\d{1,2}\.?\d*"?)',  # DMS format
            r'Lat[itude]*\s*:?\s*(\d{1,2}\.\d{4,6}).*?Lon[gitude]*\s*:?\s*(\d{1,3}\.\d{4,6})',  # Labeled format
        ]
        
        coordinates = []
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    if '°' in match[0]:  # DMS format
                        lon = self._dms_to_decimal(match[0])
                        lat = self._dms_to_decimal(match[1])
                    else:
                        lon, lat = float(match[0]), float(match[1])
                    
                    # Validate coordinates are within India
                    if self._validate_coordinates(lat, lon):
                        coordinates.append((lon, lat))
                        
                except (ValueError, IndexError):
                    continue
        
        return coordinates
    
    def _extract_dms_coordinates(self, text: str) -> List[Tuple[float, float]]:
        """Extract Degrees, Minutes, Seconds coordinates"""
        # Pattern for DMS: 28°35'17"N 77°12'27"E
        dms_pattern = r'(\d{1,2})°(\d{1,2})\'(\d{1,2}\.?\d*)"?\s*([NS])\s*(\d{1,3})°(\d{1,2})\'(\d{1,2}\.?\d*)"?\s*([EW])'
        
        coordinates = []
        matches = re.findall(dms_pattern, text, re.IGNORECASE)
        
        for match in matches:
            try:
                # Parse latitude
                lat_deg, lat_min, lat_sec, lat_dir = match[0:4]
                lat = float(lat_deg) + float(lat_min)/60 + float(lat_sec)/3600
                if lat_dir.upper() == 'S':
                    lat = -lat
                
                # Parse longitude
                lon_deg, lon_min, lon_sec, lon_dir = match[4:8]
                lon = float(lon_deg) + float(lon_min)/60 + float(lon_sec)/3600
                if lon_dir.upper() == 'W':
                    lon = -lon
                
                if self._validate_coordinates(lat, lon):
                    coordinates.append((lon, lat))
                    
            except (ValueError, IndexError):
                continue
        
        return coordinates
    
    def _extract_utm_coordinates(self, text: str) -> List[Tuple[float, float]]:
        """Extract UTM coordinates and convert to lat/lon"""
        # Pattern for UTM: Zone 43N 123456 1234567
        utm_pattern = r'(?:Zone\s*)?(\d{1,2})\s*([NS])\s*(\d{6,7})\s*(\d{7,8})'
        
        coordinates = []
        matches = re.findall(utm_pattern, text, re.IGNORECASE)
        
        for match in matches:
            try:
                zone, hemisphere, easting, northing = match
                
                # Convert UTM to lat/lon (simplified conversion)
                # In production, use pyproj for accurate conversion
                lat, lon = self._utm_to_latlon(int(zone), hemisphere, float(easting), float(northing))
                
                if self._validate_coordinates(lat, lon):
                    coordinates.append((lon, lat))
                    
            except (ValueError, IndexError):
                continue
        
        return coordinates
    
    def _dms_to_decimal(self, dms_str: str) -> float:
        """Convert DMS string to decimal degrees"""
        # Extract numbers from DMS string
        numbers = re.findall(r'\d+\.?\d*', dms_str)
        if len(numbers) >= 2:
            degrees = float(numbers[0])
            minutes = float(numbers[1]) if len(numbers) > 1 else 0
            seconds = float(numbers[2]) if len(numbers) > 2 else 0
            return degrees + minutes/60 + seconds/3600
        return 0.0
    
    def _utm_to_latlon(self, zone: int, hemisphere: str, easting: float, northing: float) -> Tuple[float, float]:
        """Simplified UTM to lat/lon conversion"""
        # This is a simplified conversion - use pyproj for production
        # Central meridian for the zone
        central_meridian = (zone - 1) * 6 - 180 + 3
        
        # Approximate conversion (not accurate for production use)
        lat = northing / 111320.0  # Rough conversion
        lon = central_meridian + (easting - 500000) / (111320.0 * np.cos(np.radians(lat)))
        
        if hemisphere.upper() == 'S':
            lat = -lat
        
        return lat, lon
    
    def _validate_coordinates(self, lat: float, lon: float) -> bool:
        """Validate coordinates are within Indian bounds"""
        return (self.india_bounds['lat_min'] <= lat <= self.india_bounds['lat_max'] and
                self.india_bounds['lon_min'] <= lon <= self.india_bounds['lon_max'])
    
    def _create_geometry(self, coordinates: List[Tuple[float, float]]) -> Dict:
        """Create GeoJSON geometry from coordinates"""
        if len(coordinates) == 1:
            # Single point
            return {
                "type": "Point",
                "coordinates": list(coordinates[0])
            }
        elif len(coordinates) >= 3:
            # Polygon (ensure closed)
            coords = list(coordinates)
            if coords[0] != coords[-1]:
                coords.append(coords[0])
            
            return {
                "type": "Polygon",
                "coordinates": [coords]
            }
        else:
            # LineString for 2 points
            return {
                "type": "LineString",
                "coordinates": coordinates
            }
    
    def _attempt_cadastral_matching(self, extracted_fields: Dict[str, Any]) -> Optional[Dict]:
        """Attempt to match plot numbers with cadastral data"""
        # This would integrate with external cadastral services
        # For now, return a placeholder point based on village/district
        
        village = extracted_fields.get('village')
        district = extracted_fields.get('district')
        state = extracted_fields.get('state')
        
        if village and district:
            # In production, this would query cadastral database
            # For now, return approximate coordinates for major districts
            approximate_coords = self._get_approximate_coordinates(district, state)
            if approximate_coords:
                return {
                    "type": "Point",
                    "coordinates": approximate_coords,
                    "source": "cadastral_approximation"
                }
        
        return None
    
    def _get_approximate_coordinates(self, district: str, state: str) -> Optional[List[float]]:
        """Get approximate coordinates for district centers"""
        # Sample district coordinates (in production, use comprehensive database)
        district_coords = {
            'balaghat': [80.1847, 21.8047],
            'nayagarh': [85.0956, 20.1289],
            'koraput': [82.7120, 18.8070],
            'ranchi': [85.3094, 23.3441],
            'raigarh': [83.3950, 21.8974]
        }
        
        district_key = district.lower().strip() if district else ''
        return district_coords.get(district_key)
    
    def calculate_area(self, geometry: Dict) -> Optional[float]:
        """Calculate area of geometry in hectares"""
        try:
            if geometry['type'] == 'Polygon':
                from shapely.geometry import shape
                from pyproj import Geod
                
                geom = shape(geometry)
                geod = Geod(ellps='WGS84')
                area, _ = geod.geometry_area_perimeter(geom)
                return abs(area) / 10000  # Convert to hectares
            
        except Exception as e:
            logger.error(f"Area calculation failed: {str(e)}")
        
        return None
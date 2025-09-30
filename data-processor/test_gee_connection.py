"""
Test Google Earth Engine Connection
"""
import ee

def test_gee_connection():
    try:
        # Initialize Earth Engine
        ee.Initialize()
        
        # Test basic functionality
        image = ee.Image('LANDSAT/LC08/C01/T1_TOA/LC08_044034_20140318')
        print(f"✅ GEE Connection successful!")
        print(f"✅ Test image ID: {image.get('system:id').getInfo()}")
        
        # Test Sentinel-2 collection
        s2 = ee.ImageCollection('COPERNICUS/S2_SR').limit(1)
        print(f"✅ Sentinel-2 collection accessible: {s2.size().getInfo()} images")
        
        # Test ESA WorldCover
        worldcover = ee.ImageCollection('ESA/WorldCover/v200').first()
        print(f"✅ ESA WorldCover accessible")
        
        # Test JRC Global Surface Water
        gsw = ee.Image('JRC/GSW1_4/GlobalSurfaceWater')
        print(f"✅ JRC Global Surface Water accessible")
        
        print("\n🎉 All GEE datasets are accessible!")
        return True
        
    except Exception as e:
        print(f"❌ GEE Connection failed: {e}")
        print("\n🔧 Troubleshooting steps:")
        print("1. Run: earthengine authenticate")
        print("2. Follow browser authentication")
        print("3. Ensure you have GEE access approved")
        return False

if __name__ == "__main__":
    test_gee_connection()
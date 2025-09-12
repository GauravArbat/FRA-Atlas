// Geospatial service for FRA data processing and visualization

export interface FRAClaim {
  id: string;
  applicantName: string;
  village: string;
  district: string;
  state: string;
  area: number;
  status: 'granted' | 'pending' | 'rejected';
  coordinates: [number, number];
  pattaNumber?: string;
  claimNumber?: string;
  caste?: string;
  phoneNumber?: string;
  email?: string;
  surveyNumber?: string;
  claimType: 'IFR' | 'CFR';
  grantedDate?: string;
  documents?: string[];
  extractedFrom?: string; // Source document
}

export interface GeospatialAnalysis {
  totalArea: number;
  grantedArea: number;
  pendingArea: number;
  rejectedArea: number;
  claimsByDistrict: Record<string, number>;
  claimsByStatus: Record<string, number>;
  claimsByType: Record<string, number>;
  densityMap: Array<{
    coordinates: [number, number];
    density: number;
    radius: number;
  }>;
}

// Target states districts for FRA implementation
const TARGET_STATE_DISTRICTS = {
  // Madhya Pradesh
  'Balaghat': { lat: 21.8047, lng: 80.1847, bounds: [[79.8, 21.5], [80.5, 22.1]], state: 'Madhya Pradesh' },
  'Mandla': { lat: 22.5986, lng: 80.3714, bounds: [[80.0, 22.3], [80.7, 22.9]], state: 'Madhya Pradesh' },
  'Dindori': { lat: 22.9422, lng: 81.0844, bounds: [[80.8, 22.6], [81.4, 23.2]], state: 'Madhya Pradesh' },
  'Seoni': { lat: 22.0853, lng: 79.5431, bounds: [[79.2, 21.8], [79.9, 22.4]], state: 'Madhya Pradesh' },
  'Chhindwara': { lat: 22.0572, lng: 78.9389, bounds: [[78.6, 21.8], [79.3, 22.3]], state: 'Madhya Pradesh' },
  'Betul': { lat: 21.9058, lng: 77.9019, bounds: [[77.6, 21.6], [78.2, 22.2]], state: 'Madhya Pradesh' },
  
  // Tripura
  'West Tripura': { lat: 23.8315, lng: 91.2868, bounds: [[91.0, 23.6], [91.6, 24.1]], state: 'Tripura' },
  'South Tripura': { lat: 23.1634, lng: 91.4346, bounds: [[91.1, 22.9], [91.8, 23.4]], state: 'Tripura' },
  'Dhalai': { lat: 23.8372, lng: 91.8624, bounds: [[91.5, 23.5], [92.2, 24.1]], state: 'Tripura' },
  'North Tripura': { lat: 24.1258, lng: 92.1686, bounds: [[91.8, 23.8], [92.5, 24.4]], state: 'Tripura' },
  
  // Odisha
  'Mayurbhanj': { lat: 21.9287, lng: 86.7350, bounds: [[86.4, 21.6], [87.1, 22.3]], state: 'Odisha' },
  'Keonjhar': { lat: 21.6297, lng: 85.5828, bounds: [[85.2, 21.3], [85.9, 21.9]], state: 'Odisha' },
  'Sundargarh': { lat: 22.1236, lng: 84.0186, bounds: [[83.7, 21.8], [84.4, 22.4]], state: 'Odisha' },
  'Kandhamal': { lat: 20.2333, lng: 84.1167, bounds: [[83.8, 19.9], [84.5, 20.6]], state: 'Odisha' },
  'Rayagada': { lat: 19.1677, lng: 83.4158, bounds: [[83.1, 18.8], [83.8, 19.5]], state: 'Odisha' },
  'Koraput': { lat: 18.8120, lng: 82.7108, bounds: [[82.4, 18.5], [83.1, 19.1]], state: 'Odisha' },
  
  // Telangana
  'Adilabad': { lat: 19.6677, lng: 78.5311, bounds: [[78.2, 19.3], [78.9, 20.0]], state: 'Telangana' },
  'Komaram Bheem': { lat: 19.1067, lng: 79.3089, bounds: [[79.0, 18.8], [79.6, 19.4]], state: 'Telangana' },
  'Mancherial': { lat: 18.8708, lng: 79.4578, bounds: [[79.1, 18.6], [79.8, 19.2]], state: 'Telangana' },
  'Bhadradri': { lat: 17.5500, lng: 80.8833, bounds: [[80.5, 17.2], [81.2, 17.9]], state: 'Telangana' },
  'Khammam': { lat: 17.2473, lng: 80.1514, bounds: [[79.8, 16.9], [80.5, 17.6]], state: 'Telangana' },
  'Mulugu': { lat: 18.1925, lng: 79.9167, bounds: [[79.6, 17.9], [80.3, 18.5]], state: 'Telangana' }
};

// Generate random coordinates within district bounds
function generateRandomCoordinates(district: string): [number, number] {
  const districtData = TARGET_STATE_DISTRICTS[district as keyof typeof TARGET_STATE_DISTRICTS];
  if (!districtData) {
    // Default to Balaghat, MP if district not found
    return [80.1847, 21.8047];
  }

  const [minLng, minLat] = districtData.bounds[0];
  const [maxLng, maxLat] = districtData.bounds[1];

  const lng = minLng + Math.random() * (maxLng - minLng);
  const lat = minLat + Math.random() * (maxLat - minLat);

  return [lng, lat];
}

// Generate sample FRA claims data
export function generateSampleFRAData(): FRAClaim[] {
  const sampleClaims: FRAClaim[] = [
    {
      id: 'FRA/MP/2024/001234',
      applicantName: 'श्री रामसिंह गोंड',
      village: 'Khairlanji',
      district: 'Balaghat',
      state: 'Madhya Pradesh',
      area: 2.5,
      status: 'granted',
      coordinates: generateRandomCoordinates('Balaghat'),
      pattaNumber: 'PATTA/MP/2024/001234',
      claimNumber: 'FRA/MP/2024/001234',
      caste: 'Gond (ST)',
      phoneNumber: '9876543210',
      surveyNumber: '45/2',
      claimType: 'IFR',
      grantedDate: '2024-03-15',
      documents: ['Revenue Records', 'Gram Sabha Resolution', 'Forest Department Records'],
      extractedFrom: 'OCR Document Processing'
    },
    {
      id: 'FRA/TR/2024/001235',
      applicantName: 'Smt. Kokborok Debbarma',
      village: 'Gandacherra',
      district: 'Dhalai',
      state: 'Tripura',
      area: 1.8,
      status: 'pending',
      coordinates: generateRandomCoordinates('Dhalai'),
      pattaNumber: 'PATTA/TR/2024/001235',
      claimNumber: 'FRA/TR/2024/001235',
      caste: 'Tripuri (ST)',
      phoneNumber: '9876543211',
      surveyNumber: '46/1',
      claimType: 'IFR',
      extractedFrom: 'OCR Document Processing'
    },
    {
      id: 'FRA/OD/2024/001236',
      applicantName: 'Shri Arjun Santal',
      village: 'Baripada',
      district: 'Mayurbhanj',
      state: 'Odisha',
      area: 3.2,
      status: 'granted',
      coordinates: generateRandomCoordinates('Mayurbhanj'),
      pattaNumber: 'PATTA/OD/2024/001236',
      claimNumber: 'FRA/OD/2024/001236',
      caste: 'Santal (ST)',
      phoneNumber: '9876543212',
      surveyNumber: '47/3',
      claimType: 'IFR',
      grantedDate: '2024-03-10',
      extractedFrom: 'OCR Document Processing'
    },
    {
      id: 'FRA/TG/2024/001237',
      applicantName: 'Gram Sabha Utnoor',
      village: 'Utnoor',
      district: 'Adilabad',
      state: 'Telangana',
      area: 15.0,
      status: 'granted',
      coordinates: generateRandomCoordinates('Adilabad'),
      pattaNumber: 'PATTA/TG/2024/001237',
      claimNumber: 'FRA/TG/2024/001237',
      claimType: 'CFR',
      grantedDate: '2024-02-28',
      extractedFrom: 'OCR Document Processing'
    },
    {
      id: 'FRA/MP/2024/001238',
      applicantName: 'Shri Bhil Singh',
      village: 'Mandla',
      district: 'Mandla',
      state: 'Madhya Pradesh',
      area: 2.1,
      status: 'rejected',
      coordinates: generateRandomCoordinates('Mandla'),
      claimNumber: 'FRA/MP/2024/001238',
      caste: 'Bhil (ST)',
      phoneNumber: '9876543213',
      surveyNumber: '12/5',
      claimType: 'IFR',
      extractedFrom: 'OCR Document Processing'
    },
    {
      id: 'FRA/OD/2024/001239',
      applicantName: 'Smt. Kondh Devi',
      village: 'Phulbani',
      district: 'Kandhamal',
      state: 'Odisha',
      area: 1.5,
      status: 'pending',
      coordinates: generateRandomCoordinates('Kandhamal'),
      claimNumber: 'FRA/OD/2024/001239',
      caste: 'Kondh (ST)',
      phoneNumber: '9876543214',
      surveyNumber: '23/7',
      claimType: 'IFR',
      extractedFrom: 'OCR Document Processing'
    }
  ];

  return sampleClaims;
}

// Process OCR/NER extracted data into FRA claims
export function processExtractedDataToFRA(
  extractedData: any,
  sourceDocument: string = 'OCR Document Processing'
): FRAClaim | null {
  try {
    // Extract basic information
    const applicantName = extractedData.applicantName || 
                         extractedData.name || 
                         'Unknown Applicant';
    
    const village = extractedData.village || 'Unknown Village';
    const district = extractedData.district || 'Unknown District';
    const state = extractedData.state || 'Maharashtra';
    
    // Extract area
    const areaMatch = extractedData.area?.match(/(\d+(?:\.\d+)?)/);
    const area = areaMatch ? parseFloat(areaMatch[1]) : 1.0;
    
    // Determine status
    const statusText = (extractedData.status || '').toLowerCase();
    let status: 'granted' | 'pending' | 'rejected' = 'pending';
    if (statusText.includes('granted') || statusText.includes('approved')) {
      status = 'granted';
    } else if (statusText.includes('rejected') || statusText.includes('denied')) {
      status = 'rejected';
    }
    
    // Determine claim type
    const claimTypeText = (extractedData.claimType || '').toUpperCase();
    const claimType: 'IFR' | 'CFR' = claimTypeText.includes('CFR') || 
                                   claimTypeText.includes('COMMUNITY') ? 'CFR' : 'IFR';
    
    // Generate coordinates based on district
    const coordinates = generateRandomCoordinates(district);
    
    // Generate unique ID
    const id = extractedData.claimNumber || 
               extractedData.pattaNumber || 
               `FRA/2024/${Date.now()}`;
    
    const fraClaim: FRAClaim = {
      id,
      applicantName,
      village,
      district,
      state,
      area,
      status,
      coordinates,
      pattaNumber: extractedData.pattaNumber,
      claimNumber: extractedData.claimNumber,
      caste: extractedData.caste,
      phoneNumber: extractedData.phoneNumber,
      email: extractedData.email,
      surveyNumber: extractedData.surveyNumber,
      claimType,
      grantedDate: extractedData.grantedDate,
      documents: extractedData.documents || [],
      extractedFrom: sourceDocument
    };
    
    return fraClaim;
  } catch (error) {
    console.error('Error processing extracted data to FRA claim:', error);
    return null;
  }
}

// Perform geospatial analysis
export function performGeospatialAnalysis(claims: FRAClaim[]): GeospatialAnalysis {
  const totalArea = claims.reduce((sum, claim) => sum + claim.area, 0);
  const grantedArea = claims
    .filter(claim => claim.status === 'granted')
    .reduce((sum, claim) => sum + claim.area, 0);
  const pendingArea = claims
    .filter(claim => claim.status === 'pending')
    .reduce((sum, claim) => sum + claim.area, 0);
  const rejectedArea = claims
    .filter(claim => claim.status === 'rejected')
    .reduce((sum, claim) => sum + claim.area, 0);

  const claimsByDistrict = claims.reduce((acc, claim) => {
    acc[claim.district] = (acc[claim.district] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const claimsByStatus = claims.reduce((acc, claim) => {
    acc[claim.status] = (acc[claim.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const claimsByType = claims.reduce((acc, claim) => {
    acc[claim.claimType] = (acc[claim.claimType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Generate density map (simplified)
  const densityMap = claims.map(claim => ({
    coordinates: claim.coordinates,
    density: 1, // Simplified density calculation
    radius: Math.sqrt(claim.area) * 1000 // Convert to meters
  }));

  return {
    totalArea,
    grantedArea,
    pendingArea,
    rejectedArea,
    claimsByDistrict,
    claimsByStatus,
    claimsByType,
    densityMap
  };
}

// Export data in various formats
export function exportFRAData(claims: FRAClaim[], format: 'json' | 'csv' | 'geojson'): string {
  switch (format) {
    case 'json':
      return JSON.stringify(claims, null, 2);
    
    case 'csv':
      const headers = [
        'ID', 'Applicant Name', 'Village', 'District', 'State', 'Area', 'Status',
        'Patta Number', 'Claim Number', 'Caste', 'Phone', 'Email', 'Survey Number',
        'Claim Type', 'Granted Date', 'Longitude', 'Latitude'
      ];
      const rows = claims.map(claim => [
        claim.id,
        claim.applicantName,
        claim.village,
        claim.district,
        claim.state,
        claim.area,
        claim.status,
        claim.pattaNumber || '',
        claim.claimNumber || '',
        claim.caste || '',
        claim.phoneNumber || '',
        claim.email || '',
        claim.surveyNumber || '',
        claim.claimType,
        claim.grantedDate || '',
        claim.coordinates[0],
        claim.coordinates[1]
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    
    case 'geojson':
      const geojson = {
        type: 'FeatureCollection',
        features: claims.map(claim => ({
          type: 'Feature',
          properties: {
            id: claim.id,
            applicantName: claim.applicantName,
            village: claim.village,
            district: claim.district,
            state: claim.state,
            area: claim.area,
            status: claim.status,
            pattaNumber: claim.pattaNumber,
            claimNumber: claim.claimNumber,
            caste: claim.caste,
            phoneNumber: claim.phoneNumber,
            email: claim.email,
            surveyNumber: claim.surveyNumber,
            claimType: claim.claimType,
            grantedDate: claim.grantedDate
          },
          geometry: {
            type: 'Point',
            coordinates: claim.coordinates
          }
        }))
      };
      return JSON.stringify(geojson, null, 2);
    
    default:
      return JSON.stringify(claims, null, 2);
  }
}

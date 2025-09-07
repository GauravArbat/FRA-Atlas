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

// Sample geospatial data for Maharashtra districts
const MAHARASHTRA_DISTRICTS = {
  'Pune': { lat: 18.5204, lng: 73.8567, bounds: [[73.5, 18.2], [74.2, 18.8]] },
  'Nashik': { lat: 19.9975, lng: 73.7898, bounds: [[73.4, 19.7], [74.1, 20.3]] },
  'Nagpur': { lat: 21.1458, lng: 79.0882, bounds: [[78.8, 20.9], [79.4, 21.4]] },
  'Aurangabad': { lat: 19.8762, lng: 75.3433, bounds: [[75.1, 19.6], [75.6, 20.1]] },
  'Kolhapur': { lat: 16.7050, lng: 74.2433, bounds: [[74.0, 16.4], [74.5, 17.0]] },
  'Sangli': { lat: 16.8524, lng: 74.5815, bounds: [[74.3, 16.6], [74.9, 17.1]] },
  'Satara': { lat: 17.6805, lng: 74.0183, bounds: [[73.7, 17.4], [74.3, 18.0]] },
  'Solapur': { lat: 17.6598, lng: 75.9064, bounds: [[75.6, 17.3], [76.2, 18.0]] },
  'Ahmednagar': { lat: 19.0952, lng: 74.7496, bounds: [[74.4, 18.8], [75.1, 19.4]] },
  'Jalgaon': { lat: 21.0077, lng: 75.5626, bounds: [[75.2, 20.7], [75.9, 21.3]] },
  'Dhule': { lat: 20.9028, lng: 74.7774, bounds: [[74.5, 20.6], [75.1, 21.2]] },
  'Nandurbar': { lat: 21.3667, lng: 74.2400, bounds: [[74.0, 21.1], [74.5, 21.6]] },
  'Thane': { lat: 19.2183, lng: 72.9781, bounds: [[72.7, 19.0], [73.3, 19.4]] },
  'Mumbai': { lat: 19.0760, lng: 72.8777, bounds: [[72.7, 18.9], [73.0, 19.3]] },
  'Raigad': { lat: 18.2500, lng: 73.0000, bounds: [[72.8, 18.0], [73.2, 18.5]] },
  'Ratnagiri': { lat: 16.9944, lng: 73.3000, bounds: [[73.0, 16.7], [73.6, 17.3]] },
  'Sindhudurg': { lat: 16.1667, lng: 73.5000, bounds: [[73.2, 15.9], [73.8, 16.4]] },
  'Osmanabad': { lat: 18.1667, lng: 76.0500, bounds: [[75.8, 17.9], [76.3, 18.4]] },
  'Latur': { lat: 18.4000, lng: 76.5833, bounds: [[76.3, 18.1], [76.9, 18.7]] },
  'Beed': { lat: 18.9833, lng: 75.7667, bounds: [[75.5, 18.7], [76.0, 19.3]] },
  'Jalna': { lat: 19.8333, lng: 75.8833, bounds: [[75.6, 19.6], [76.2, 20.1]] },
  'Parbhani': { lat: 19.2500, lng: 76.7833, bounds: [[76.5, 19.0], [77.1, 19.5]] },
  'Hingoli': { lat: 19.7167, lng: 77.1500, bounds: [[76.9, 19.4], [77.4, 20.0]] },
  'Nanded': { lat: 19.1500, lng: 77.3167, bounds: [[77.0, 18.9], [77.6, 19.4]] },
  'Washim': { lat: 20.1000, lng: 77.1333, bounds: [[76.9, 19.8], [77.4, 20.4]] },
  'Yavatmal': { lat: 20.4000, lng: 78.1333, bounds: [[77.9, 20.1], [78.4, 20.7]] },
  'Amravati': { lat: 20.9333, lng: 77.7500, bounds: [[77.5, 20.6], [78.0, 21.3]] },
  'Wardha': { lat: 20.7500, lng: 78.6167, bounds: [[78.3, 20.4], [78.9, 21.1]] },
  'Chandrapur': { lat: 19.9500, lng: 79.3000, bounds: [[79.0, 19.7], [79.6, 20.2]] },
  'Gadchiroli': { lat: 19.8000, lng: 80.0000, bounds: [[79.7, 19.5], [80.3, 20.1]] },
  'Bhandara': { lat: 21.1667, lng: 79.6500, bounds: [[79.3, 20.9], [80.0, 21.4]] },
  'Gondia': { lat: 21.4500, lng: 80.2000, bounds: [[79.9, 21.2], [80.5, 21.7]] }
};

// Generate random coordinates within district bounds
function generateRandomCoordinates(district: string): [number, number] {
  const districtData = MAHARASHTRA_DISTRICTS[district as keyof typeof MAHARASHTRA_DISTRICTS];
  if (!districtData) {
    // Default to Pune if district not found
    return [73.8567, 18.5204];
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
      id: 'FRA/2024/001234',
      applicantName: 'श्री रामदास किसान पाटिल',
      village: 'Ambegaon',
      district: 'Pune',
      state: 'Maharashtra',
      area: 2.5,
      status: 'granted',
      coordinates: generateRandomCoordinates('Pune'),
      pattaNumber: 'PATTA/MAH/2024/001234',
      claimNumber: 'FRA/2024/001234',
      caste: 'Scheduled Tribe (ST)',
      phoneNumber: '9876543210',
      email: 'ramdas.patil@email.com',
      surveyNumber: '45/2',
      claimType: 'IFR',
      grantedDate: '2024-03-15',
      documents: ['Revenue Records', 'Gram Sabha Resolution', 'Forest Department Records'],
      extractedFrom: 'OCR Document Processing'
    },
    {
      id: 'FRA/2024/001235',
      applicantName: 'Smt. Sunita Devi',
      village: 'Khed',
      district: 'Pune',
      state: 'Maharashtra',
      area: 1.8,
      status: 'pending',
      coordinates: generateRandomCoordinates('Pune'),
      pattaNumber: 'PATTA/MAH/2024/001235',
      claimNumber: 'FRA/2024/001235',
      caste: 'Scheduled Tribe (ST)',
      phoneNumber: '9876543211',
      surveyNumber: '46/1',
      claimType: 'IFR',
      extractedFrom: 'OCR Document Processing'
    },
    {
      id: 'FRA/2024/001236',
      applicantName: 'Shri Kisan Patil',
      village: 'Junnar',
      district: 'Pune',
      state: 'Maharashtra',
      area: 3.2,
      status: 'granted',
      coordinates: generateRandomCoordinates('Pune'),
      pattaNumber: 'PATTA/MAH/2024/001236',
      claimNumber: 'FRA/2024/001236',
      caste: 'Scheduled Tribe (ST)',
      phoneNumber: '9876543212',
      surveyNumber: '47/3',
      claimType: 'IFR',
      grantedDate: '2024-03-10',
      extractedFrom: 'OCR Document Processing'
    },
    {
      id: 'FRA/2024/001237',
      applicantName: 'Gram Sabha Ambegaon',
      village: 'Ambegaon',
      district: 'Pune',
      state: 'Maharashtra',
      area: 15.0,
      status: 'granted',
      coordinates: generateRandomCoordinates('Pune'),
      pattaNumber: 'PATTA/MAH/2024/001237',
      claimNumber: 'FRA/2024/001237',
      claimType: 'CFR',
      grantedDate: '2024-02-28',
      extractedFrom: 'OCR Document Processing'
    },
    {
      id: 'FRA/2024/001238',
      applicantName: 'Shri Rajesh Kumar',
      village: 'Nashik',
      district: 'Nashik',
      state: 'Maharashtra',
      area: 2.1,
      status: 'rejected',
      coordinates: generateRandomCoordinates('Nashik'),
      claimNumber: 'FRA/2024/001238',
      caste: 'Scheduled Tribe (ST)',
      phoneNumber: '9876543213',
      surveyNumber: '12/5',
      claimType: 'IFR',
      extractedFrom: 'OCR Document Processing'
    },
    {
      id: 'FRA/2024/001239',
      applicantName: 'Smt. Meera Bai',
      village: 'Nagpur',
      district: 'Nagpur',
      state: 'Maharashtra',
      area: 1.5,
      status: 'pending',
      coordinates: generateRandomCoordinates('Nagpur'),
      claimNumber: 'FRA/2024/001239',
      caste: 'Scheduled Tribe (ST)',
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

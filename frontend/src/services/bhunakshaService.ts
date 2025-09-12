// Bhunaksha-style land records service for FRA Atlas
export interface LandRecord {
  khasraNumber: string;
  surveyNumber: string;
  area: string;
  classification: string;
  ownerName: string;
  fatherName: string;
  village: string;
  district: string;
  state: string;
  fraStatus: 'IFR Granted' | 'CFR Granted' | 'Pending' | 'Rejected' | 'Not Applied';
  boundaries: any; // GeoJSON
  mutationHistory: Array<{
    date: string;
    type: string;
    details: string;
  }>;
}

export interface VillageMap {
  villageCode: string;
  villageName: string;
  district: string;
  totalPlots: number;
  fraPlots: number;
  boundaries: any; // GeoJSON
}

// Mock Bhunaksha data for target states
const MOCK_LAND_RECORDS: Record<string, LandRecord[]> = {
  'Balaghat': [
    {
      khasraNumber: '45/2',
      surveyNumber: 'MP-BAL-001',
      area: '2.25 hectares',
      classification: 'Forest Land (Sarkar)',
      ownerName: 'Ramsingh Gond',
      fatherName: 'Late Bhimsingh Gond',
      village: 'Khairlanji',
      district: 'Balaghat',
      state: 'Madhya Pradesh',
      fraStatus: 'IFR Granted',
      boundaries: {
        type: 'Polygon',
        coordinates: [[[80.1847, 21.8047], [80.1857, 21.8047], [80.1857, 21.8057], [80.1847, 21.8057], [80.1847, 21.8047]]]
      },
      mutationHistory: [
        { date: '2024-03-15', type: 'FRA Grant', details: 'Individual Forest Rights granted under FRA 2006' },
        { date: '2024-01-15', type: 'Application', details: 'FRA claim application submitted' }
      ]
    },
    {
      khasraNumber: '46/1',
      surveyNumber: 'MP-BAL-002',
      area: '1.75 hectares',
      classification: 'Forest Land (Sarkar)',
      ownerName: 'Bhil Singh',
      fatherName: 'Kalu Singh',
      village: 'Khairlanji',
      district: 'Balaghat',
      state: 'Madhya Pradesh',
      fraStatus: 'Pending',
      boundaries: {
        type: 'Polygon',
        coordinates: [[[80.1867, 21.8067], [80.1877, 21.8067], [80.1877, 21.8077], [80.1867, 21.8077], [80.1867, 21.8067]]]
      },
      mutationHistory: [
        { date: '2024-02-10', type: 'Application', details: 'FRA claim application under review' }
      ]
    }
  ],
  'Mayurbhanj': [
    {
      khasraNumber: '67/3',
      surveyNumber: 'OD-MAY-001',
      area: '3.2 hectares',
      classification: 'Forest Land (Government)',
      ownerName: 'Arjun Santal',
      fatherName: 'Mangal Santal',
      village: 'Baripada',
      district: 'Mayurbhanj',
      state: 'Odisha',
      fraStatus: 'IFR Granted',
      boundaries: {
        type: 'Polygon',
        coordinates: [[[86.7350, 21.9287], [86.7360, 21.9287], [86.7360, 21.9297], [86.7350, 21.9297], [86.7350, 21.9287]]]
      },
      mutationHistory: [
        { date: '2024-03-10', type: 'FRA Grant', details: 'Individual Forest Rights granted' },
        { date: '2024-01-10', type: 'Application', details: 'FRA claim submitted with documents' }
      ]
    }
  ],
  'Dhalai': [
    {
      khasraNumber: '23/7',
      surveyNumber: 'TR-DHA-001',
      area: '1.8 hectares',
      classification: 'Forest Land (Reserved)',
      ownerName: 'Kokborok Debbarma',
      fatherName: 'Tripura Debbarma',
      village: 'Gandacherra',
      district: 'Dhalai',
      state: 'Tripura',
      fraStatus: 'Pending',
      boundaries: {
        type: 'Polygon',
        coordinates: [[[91.8624, 23.8372], [91.8634, 23.8372], [91.8634, 23.8382], [91.8624, 23.8382], [91.8624, 23.8372]]]
      },
      mutationHistory: [
        { date: '2024-01-20', type: 'Application', details: 'FRA claim application submitted' }
      ]
    }
  ],
  'Adilabad': [
    {
      khasraNumber: '89/1',
      surveyNumber: 'TG-ADI-001',
      area: '15.0 hectares',
      classification: 'Forest Land (Community)',
      ownerName: 'Gram Sabha Utnoor',
      fatherName: '',
      village: 'Utnoor',
      district: 'Adilabad',
      state: 'Telangana',
      fraStatus: 'CFR Granted',
      boundaries: {
        type: 'Polygon',
        coordinates: [[[78.5311, 19.6677], [78.5321, 19.6677], [78.5321, 19.6687], [78.5311, 19.6687], [78.5311, 19.6677]]]
      },
      mutationHistory: [
        { date: '2024-02-28', type: 'CFR Grant', details: 'Community Forest Rights granted to Gram Sabha' },
        { date: '2024-01-05', type: 'Application', details: 'CFR claim application by Gram Sabha' }
      ]
    }
  ]
};

// Bhunaksha-style search functions
export const searchByKhasra = async (district: string, village: string, khasraNumber: string): Promise<LandRecord | null> => {
  const records = MOCK_LAND_RECORDS[district] || [];
  return records.find(r => r.village === village && r.khasraNumber === khasraNumber) || null;
};

export const searchByOwner = async (district: string, ownerName: string): Promise<LandRecord[]> => {
  const records = MOCK_LAND_RECORDS[district] || [];
  return records.filter(r => r.ownerName.toLowerCase().includes(ownerName.toLowerCase()));
};

export const getVillageRecords = async (district: string, village: string): Promise<LandRecord[]> => {
  const records = MOCK_LAND_RECORDS[district] || [];
  return records.filter(r => r.village === village);
};

export const getDistrictSummary = async (district: string) => {
  const records = MOCK_LAND_RECORDS[district] || [];
  const totalPlots = records.length;
  const fraGranted = records.filter(r => r.fraStatus.includes('Granted')).length;
  const fraPending = records.filter(r => r.fraStatus === 'Pending').length;
  const totalArea = records.reduce((sum, r) => sum + parseFloat(r.area), 0);

  return {
    district,
    totalPlots,
    fraGranted,
    fraPending,
    totalArea: totalArea.toFixed(2),
    coveragePercent: ((fraGranted / totalPlots) * 100).toFixed(1)
  };
};

// Generate land record certificate (Bhunaksha-style)
// Get all land records across all districts
export const getAllLandRecords = async (): Promise<LandRecord[]> => {
  const allRecords: LandRecord[] = [];
  Object.values(MOCK_LAND_RECORDS).forEach(districtRecords => {
    allRecords.push(...districtRecords);
  });
  return allRecords;
};

export const generateLandCertificate = (record: LandRecord): string => {
  return `
    FOREST RIGHTS ACT - LAND RECORD CERTIFICATE
    
    Khasra Number: ${record.khasraNumber}
    Survey Number: ${record.surveyNumber}
    
    Owner Details:
    Name: ${record.ownerName}
    Father's Name: ${record.fatherName}
    
    Location:
    Village: ${record.village}
    District: ${record.district}
    State: ${record.state}
    
    Land Details:
    Area: ${record.area}
    Classification: ${record.classification}
    FRA Status: ${record.fraStatus}
    
    Generated on: ${new Date().toLocaleDateString()}
    
    This is a computer generated certificate.
  `;
};
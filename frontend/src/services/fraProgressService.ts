interface FRAProgress {
  level: 'village' | 'block' | 'district' | 'state';
  name: string;
  totalClaims: number;
  pendingClaims: number;
  approvedClaims: number;
  grantedClaims: number;
  rejectedClaims: number;
  totalArea: number;
  grantedArea: number;
  progressPercentage: number;
  lastUpdated: string;
  children?: FRAProgress[];
}

class FRAProgressService {
  private apiKey = process.env.REACT_APP_DATA_GOV_API_KEY || '';
  
  async getProgressData(level: string, name?: string): Promise<FRAProgress[]> {
    // Use simulated real-time data (government APIs have CORS restrictions)
    console.log('🔄 Loading simulated real-time FRA progress data...');
    
    switch (level) {
      case 'state':
        return this.generateStateProgress();
      case 'district':
        return this.generateDistrictProgress(name);
      case 'block':
        return this.generateBlockProgress(name);
      case 'village':
        return this.generateVillageProgress(name);
      default:
        return this.generateStateProgress();
    }
  }

  private async fetchRealTimeData(level: string, name?: string): Promise<FRAProgress[]> {
    const endpoints = [
      'https://api.data.gov.in/resource/fra-implementation-status',
      'https://tribal.nic.in/api/fra-progress',
      'https://fra.gov.in/api/claims-status'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${endpoint}?level=${level}&name=${name || ''}`, {
          headers: {
            'Accept': 'application/json',
            ...(this.apiKey && { 'X-API-Key': this.apiKey })
          }
        });

        if (response.ok) {
          const data = await response.json();
          return this.normalizeRealTimeData(data, level);
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${endpoint}:`, error);
        continue;
      }
    }

    throw new Error('All real-time data sources unavailable');
  }

  private normalizeRealTimeData(data: any, level: string): FRAProgress[] {
    const records = data.records || data.data || data;
    
    return records.map((record: any) => ({
      level: level as any,
      name: record.name || record.district_name || record.state_name || 'Unknown',
      totalClaims: parseInt(record.total_claims || record.claims_submitted || '0'),
      pendingClaims: parseInt(record.pending_claims || record.under_review || '0'),
      approvedClaims: parseInt(record.approved_claims || record.approved || '0'),
      grantedClaims: parseInt(record.granted_claims || record.titles_granted || '0'),
      rejectedClaims: parseInt(record.rejected_claims || record.rejected || '0'),
      totalArea: parseFloat(record.total_area || record.area_claimed || '0'),
      grantedArea: parseFloat(record.granted_area || record.area_granted || '0'),
      progressPercentage: Math.round(
        (parseInt(record.granted_claims || '0') / parseInt(record.total_claims || '1')) * 100
      ),
      lastUpdated: record.last_updated || new Date().toISOString()
    }));
  }

  private generateStateProgress(): FRAProgress[] {
    const states = [
      { name: 'Madhya Pradesh', claims: 2847, granted: 1623, area: 6542.3 },
      { name: 'Tripura', claims: 892, granted: 567, area: 2134.8 },
      { name: 'Odisha', claims: 2156, granted: 1289, area: 4987.6 },
      { name: 'Telangana', claims: 1456, granted: 834, area: 3298.7 }
    ];

    return states.map(state => {
      const pending = Math.floor(state.claims * 0.28);
      const approved = Math.floor(state.claims * 0.18);
      const rejected = Math.floor(state.claims * 0.12);
      
      return {
        level: 'state' as const,
        name: state.name,
        totalClaims: state.claims,
        pendingClaims: pending,
        approvedClaims: approved,
        grantedClaims: state.granted,
        rejectedClaims: rejected,
        totalArea: state.area,
        grantedArea: state.granted * 2.3,
        progressPercentage: Math.round((state.granted / state.claims) * 100),
        lastUpdated: new Date().toISOString()
      };
    });
  }

  private generateDistrictProgress(stateName?: string): FRAProgress[] {
    const districts = {
      'Madhya Pradesh': [
        { name: 'Khargone', claims: 234, granted: 145, area: 567.8 },
        { name: 'Dhar', claims: 198, granted: 123, area: 456.2 },
        { name: 'Jhabua', claims: 287, granted: 167, area: 678.9 },
        { name: 'Alirajpur', claims: 156, granted: 89, area: 345.6 },
        { name: 'Barwani', claims: 178, granted: 98, area: 423.7 },
        { name: 'Dewas', claims: 145, granted: 87, area: 334.5 },
        { name: 'Indore', claims: 123, granted: 76, area: 289.3 },
        { name: 'Ujjain', claims: 134, granted: 78, area: 312.4 },
        { name: 'Ratlam', claims: 167, granted: 94, area: 389.6 },
        { name: 'Mandsaur', claims: 189, granted: 112, area: 445.8 }
      ],
      'Odisha': [
        { name: 'Mayurbhanj', claims: 298, granted: 178, area: 689.4 },
        { name: 'Keonjhar', claims: 234, granted: 145, area: 567.8 },
        { name: 'Sundargarh', claims: 267, granted: 156, area: 623.7 },
        { name: 'Kandhamal', claims: 189, granted: 112, area: 445.8 },
        { name: 'Koraput', claims: 223, granted: 134, area: 523.6 },
        { name: 'Kalahandi', claims: 198, granted: 123, area: 467.9 },
        { name: 'Rayagada', claims: 167, granted: 98, area: 389.2 },
        { name: 'Nabarangpur', claims: 145, granted: 87, area: 334.5 },
        { name: 'Malkangiri', claims: 178, granted: 104, area: 412.3 },
        { name: 'Gajapati', claims: 134, granted: 78, area: 312.4 }
      ],
      'Tripura': [
        { name: 'West Tripura', claims: 234, granted: 145, area: 567.8 },
        { name: 'Dhalai', claims: 189, granted: 112, area: 445.8 },
        { name: 'Gomati', claims: 167, granted: 98, area: 389.2 },
        { name: 'Khowai', claims: 145, granted: 87, area: 334.5 },
        { name: 'North Tripura', claims: 123, granted: 76, area: 289.3 },
        { name: 'Sepahijala', claims: 134, granted: 78, area: 312.4 },
        { name: 'South Tripura', claims: 178, granted: 104, area: 412.3 },
        { name: 'Unakoti', claims: 156, granted: 89, area: 345.6 }
      ],
      'Telangana': [
        { name: 'Adilabad', claims: 267, granted: 156, area: 623.7 },
        { name: 'Khammam', claims: 234, granted: 145, area: 567.8 },
        { name: 'Warangal Rural', claims: 198, granted: 123, area: 456.2 },
        { name: 'Warangal Urban', claims: 145, granted: 87, area: 334.5 },
        { name: 'Karimnagar', claims: 189, granted: 112, area: 445.8 },
        { name: 'Nizamabad', claims: 167, granted: 98, area: 389.2 },
        { name: 'Medak', claims: 134, granted: 78, area: 312.4 },
        { name: 'Nalgonda', claims: 178, granted: 104, area: 412.3 }
      ],
      'Jharkhand': [
        { name: 'Ranchi', claims: 298, granted: 178, area: 689.4 },
        { name: 'Gumla', claims: 234, granted: 145, area: 567.8 },
        { name: 'Simdega', claims: 189, granted: 112, area: 445.8 },
        { name: 'West Singhbhum', claims: 267, granted: 156, area: 623.7 },
        { name: 'East Singhbhum', claims: 198, granted: 123, area: 456.2 },
        { name: 'Lohardaga', claims: 145, granted: 87, area: 334.5 },
        { name: 'Khunti', claims: 167, granted: 98, area: 389.2 },
        { name: 'Saraikela Kharsawan', claims: 134, granted: 78, area: 312.4 }
      ],
      'Chhattisgarh': [
        { name: 'Bastar', claims: 345, granted: 201, area: 798.6 },
        { name: 'Dantewada', claims: 267, granted: 156, area: 623.7 },
        { name: 'Sukma', claims: 234, granted: 145, area: 567.8 },
        { name: 'Bijapur', claims: 189, granted: 112, area: 445.8 },
        { name: 'Narayanpur', claims: 198, granted: 123, area: 456.2 },
        { name: 'Kondagaon', claims: 167, granted: 98, area: 389.2 },
        { name: 'Kanker', claims: 145, granted: 87, area: 334.5 },
        { name: 'Jagdalpur', claims: 178, granted: 104, area: 412.3 }
      ],
      'Andhra Pradesh': [
        { name: 'Srikakulam', claims: 189, granted: 112, area: 445.8 },
        { name: 'Vizianagaram', claims: 167, granted: 98, area: 389.2 },
        { name: 'Visakhapatnam', claims: 145, granted: 87, area: 334.5 },
        { name: 'East Godavari', claims: 198, granted: 123, area: 456.2 },
        { name: 'West Godavari', claims: 134, granted: 78, area: 312.4 },
        { name: 'Krishna', claims: 123, granted: 76, area: 289.3 },
        { name: 'Guntur', claims: 167, granted: 98, area: 389.2 }
      ],
      'Gujarat': [
        { name: 'Dahod', claims: 234, granted: 145, area: 567.8 },
        { name: 'Panchmahal', claims: 189, granted: 112, area: 445.8 },
        { name: 'Vadodara', claims: 167, granted: 98, area: 389.2 },
        { name: 'Bharuch', claims: 145, granted: 87, area: 334.5 },
        { name: 'Narmada', claims: 123, granted: 76, area: 289.3 },
        { name: 'Tapi', claims: 129, granted: 67, area: 298.7 }
      ],
      'Rajasthan': [
        { name: 'Udaipur', claims: 198, granted: 123, area: 456.2 },
        { name: 'Dungarpur', claims: 167, granted: 98, area: 389.2 },
        { name: 'Banswara', claims: 145, granted: 87, area: 334.5 },
        { name: 'Pratapgarh', claims: 123, granted: 76, area: 289.3 },
        { name: 'Sirohi', claims: 123, granted: 39, area: 289.0 }
      ],
      'Maharashtra': [
        { name: 'Gadchiroli', claims: 267, granted: 156, area: 623.7 },
        { name: 'Chandrapur', claims: 234, granted: 145, area: 567.8 },
        { name: 'Gondia', claims: 189, granted: 112, area: 445.8 },
        { name: 'Bhandara', claims: 167, granted: 98, area: 389.2 },
        { name: 'Wardha', claims: 145, granted: 87, area: 334.5 },
        { name: 'Yavatmal', claims: 198, granted: 123, area: 456.2 },
        { name: 'Washim', claims: 134, granted: 78, area: 312.4 },
        { name: 'Amravati', claims: 178, granted: 104, area: 412.3 },
        { name: 'Akola', claims: 156, granted: 89, area: 345.6 },
        { name: 'Buldhana', claims: 199, granted: 100, area: 467.9 }
      ]
    };

    const stateDistricts = districts[stateName as keyof typeof districts] || districts['Madhya Pradesh'];
    
    return stateDistricts.map(district => {
      const pending = Math.floor(district.claims * 0.32);
      const approved = Math.floor(district.claims * 0.22);
      const rejected = Math.floor(district.claims * 0.14);
      
      return {
        level: 'district' as const,
        name: district.name,
        totalClaims: district.claims,
        pendingClaims: pending,
        approvedClaims: approved,
        grantedClaims: district.granted,
        rejectedClaims: rejected,
        totalArea: district.area,
        grantedArea: district.granted * 2.1,
        progressPercentage: Math.round((district.granted / district.claims) * 100),
        lastUpdated: new Date().toISOString()
      };
    });
  }

  private generateBlockProgress(districtName?: string): FRAProgress[] {
    const blocks = [
      { name: 'Block A', claims: 15, granted: 9 },
      { name: 'Block B', claims: 12, granted: 7 },
      { name: 'Block C', claims: 18, granted: 12 }
    ];

    return blocks.map(block => ({
      level: 'block' as const,
      name: block.name,
      totalClaims: block.claims,
      pendingClaims: Math.floor(block.claims * 0.35),
      approvedClaims: Math.floor(block.claims * 0.25),
      grantedClaims: block.granted,
      rejectedClaims: Math.floor(block.claims * 0.1),
      totalArea: block.claims * 2.1,
      grantedArea: block.granted * 1.9,
      progressPercentage: Math.round((block.granted / block.claims) * 100),
      lastUpdated: new Date().toISOString()
    }));
  }

  private generateVillageProgress(blockName?: string): FRAProgress[] {
    const villages = [
      { name: 'Village 1', claims: 5, granted: 3 },
      { name: 'Village 2', claims: 4, granted: 2 },
      { name: 'Village 3', claims: 6, granted: 4 }
    ];

    return villages.map(village => ({
      level: 'village' as const,
      name: village.name,
      totalClaims: village.claims,
      pendingClaims: Math.floor(village.claims * 0.4),
      approvedClaims: Math.floor(village.claims * 0.2),
      grantedClaims: village.granted,
      rejectedClaims: Math.floor(village.claims * 0.1),
      totalArea: village.claims * 2.0,
      grantedArea: village.granted * 1.8,
      progressPercentage: Math.round((village.granted / village.claims) * 100),
      lastUpdated: new Date().toISOString()
    }));
  }
}

export const fraProgressService = new FRAProgressService();
export type { FRAProgress };

// Real-time update service
export class RealTimeProgressUpdater {
  private updateInterval: NodeJS.Timeout | null = null;
  
  startRealTimeUpdates(callback: (data: FRAProgress[]) => void, level: string, name?: string) {
    // Initial load
    fraProgressService.getProgressData(level, name).then(callback);
    
    // Set up simulated real-time updates every 30 seconds
    this.updateInterval = setInterval(async () => {
      try {
        const updatedData = await fraProgressService.getProgressData(level, name);
        // Simulate small changes in the data
        const simulatedData = this.simulateDataChanges(updatedData);
        callback(simulatedData);
        console.log('🔄 Simulated real-time FRA progress data updated');
      } catch (error) {
        console.warn('Real-time update failed:', error);
      }
    }, 30000); // 30 seconds
  }
  
  private simulateDataChanges(data: FRAProgress[]): FRAProgress[] {
    return data.map(item => {
      // Simulate small random changes
      const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      const newGranted = Math.max(0, item.grantedClaims + change);
      const newPending = Math.max(0, item.pendingClaims - change);
      
      return {
        ...item,
        grantedClaims: newGranted,
        pendingClaims: newPending,
        progressPercentage: Math.round((newGranted / item.totalClaims) * 100),
        lastUpdated: new Date().toISOString()
      };
    });
  }
  
  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

export const realTimeProgressUpdater = new RealTimeProgressUpdater();
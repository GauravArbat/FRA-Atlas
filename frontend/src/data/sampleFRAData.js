// Sample FRA GeoJSON data for 4 states
export const fraGrantedAreas = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "FRA_G_001",
        "claimantName": "Ramsingh Gond",
        "area": 2.5,
        "status": "granted",
        "village": "Khairlanji",
        "district": "Bhopal",
        "state": "Madhya Pradesh",
        "dateGranted": "2024-01-15",
        "fraType": "IFR"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [80.1847, 21.8047], [80.1857, 21.8047], 
          [80.1857, 21.8057], [80.1847, 21.8057], 
          [80.1847, 21.8047]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "FRA_G_002",
        "claimantName": "Gram Sabha Utnoor",
        "area": 15.0,
        "status": "granted",
        "village": "Utnoor",
        "district": "Hyderabad",
        "state": "Telangana",
        "dateGranted": "2024-01-05",
        "fraType": "CFR"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [78.5311, 19.6677], [78.5321, 19.6677],
          [78.5321, 19.6687], [78.5311, 19.6687],
          [78.5311, 19.6677]
        ]]
      }
    }
  ]
};

export const fraPotentialAreas = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "FRA_P_001",
        "claimantName": "Kokborok Debbarma",
        "area": 1.8,
        "status": "potential",
        "village": "Gandacherra",
        "district": "West Tripura",
        "state": "Tripura",
        "dateSubmitted": "2024-01-20",
        "fraType": "IFR"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [91.8624, 23.8372], [91.8634, 23.8372],
          [91.8634, 23.8382], [91.8624, 23.8382],
          [91.8624, 23.8372]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "FRA_P_002",
        "claimantName": "Arjun Santal",
        "area": 3.2,
        "status": "potential",
        "village": "Baripada",
        "district": "Cuttack",
        "state": "Odisha",
        "dateSubmitted": "2024-01-10",
        "fraType": "IFR"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [86.7350, 21.9287], [86.7360, 21.9287],
          [86.7360, 21.9297], [86.7350, 21.9297],
          [86.7350, 21.9287]
        ]]
      }
    }
  ]
};

export const administrativeBoundaries = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Madhya Pradesh",
        "type": "state",
        "population": 72597565
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [74.0, 21.0], [82.0, 21.0], [82.0, 26.0], [74.0, 26.0], [74.0, 21.0]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Tripura",
        "type": "state",
        "population": 3671032
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [91.0, 23.0], [93.0, 23.0], [93.0, 25.0], [91.0, 25.0], [91.0, 23.0]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Odisha",
        "type": "state",
        "population": 41947358
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [81.0, 17.0], [87.0, 17.0], [87.0, 22.0], [81.0, 22.0], [81.0, 17.0]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Telangana",
        "type": "state",
        "population": 34993000
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [77.0, 16.0], [81.0, 16.0], [81.0, 20.0], [77.0, 20.0], [77.0, 16.0]
        ]]
      }
    }
  ]
};

export const forestAreas = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Kanha National Park",
        "type": "national_park",
        "area": 940,
        "state": "Madhya Pradesh"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [80.6, 22.2], [80.8, 22.2], [80.8, 22.4], [80.6, 22.4], [80.6, 22.2]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Simlipal Forest",
        "type": "reserve_forest",
        "area": 2750,
        "state": "Odisha"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [86.1, 21.8], [86.3, 21.8], [86.3, 22.0], [86.1, 22.0], [86.1, 21.8]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Kawal Wildlife Sanctuary",
        "type": "wildlife_sanctuary",
        "area": 893,
        "state": "Telangana"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [79.2, 19.0], [79.4, 19.0], [79.4, 19.2], [79.2, 19.2], [79.2, 19.0]
        ]]
      }
    }
  ]
};

export const pattaHoldersData = [
  {
    "id": "PH_001",
    "ownerName": "Ramesh Kumar Gond",
    "fatherName": "Suresh Kumar",
    "coordinates": [80.1852, 21.8052],
    "village": "Khairlanji",
    "district": "Bhopal",
    "state": "Madhya Pradesh",
    "area": 2.5,
    "status": "Approved",
    "fraType": "IFR",
    "dateApproved": "2024-01-15"
  },
  {
    "id": "PH_002",
    "ownerName": "Sunita Devi Santal",
    "fatherName": "Arjun Santal",
    "coordinates": [86.7355, 21.9292],
    "village": "Baripada",
    "district": "Cuttack",
    "state": "Odisha",
    "area": 1.8,
    "status": "Pending",
    "fraType": "IFR",
    "dateSubmitted": "2024-01-20"
  },
  {
    "id": "PH_003",
    "ownerName": "Kokborok Debbarma",
    "fatherName": "Ratan Debbarma",
    "coordinates": [91.8629, 23.8377],
    "village": "Gandacherra",
    "district": "West Tripura",
    "state": "Tripura",
    "area": 3.2,
    "status": "Rejected",
    "fraType": "CFR",
    "dateRejected": "2024-01-10"
  },
  {
    "id": "PH_004",
    "ownerName": "Gram Sabha Utnoor",
    "fatherName": "Community",
    "coordinates": [78.5316, 19.6682],
    "village": "Utnoor",
    "district": "Hyderabad",
    "state": "Telangana",
    "area": 15.0,
    "status": "Approved",
    "fraType": "CFR",
    "dateApproved": "2024-01-05"
  }
];

export const allLandPlots = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "LP_001",
        "ownerName": "Rajesh Verma",
        "khasraNumber": "45/2",
        "area": 1.2,
        "classification": "Agricultural",
        "village": "Greenpur",
        "district": "Bhopal",
        "state": "Madhya Pradesh"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [80.1840, 21.8040], [80.1845, 21.8040],
          [80.1845, 21.8045], [80.1840, 21.8045],
          [80.1840, 21.8040]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "LP_002",
        "ownerName": "Meera Tribal",
        "khasraNumber": "67/1",
        "area": 0.8,
        "classification": "Homestead",
        "village": "Ambassa",
        "district": "Dhalai",
        "state": "Tripura"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [92.0, 23.5], [92.005, 23.5],
          [92.005, 23.505], [92.0, 23.505],
          [92.0, 23.5]
        ]]
      }
    }
  ]
};
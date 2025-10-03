import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  fraGrantedAreas,
  fraPotentialAreas,
  administrativeBoundaries,
  forestAreas,
  pattaHoldersData,
  allLandPlots
} from '../data/sampleFRAData';

const FRALayerManager = ({ map, layerVisibility }) => {
  const layersRef = useRef({
    fraGranted: null,
    fraPotential: null,
    boundaries: null,
    forests: null,
    pattaHolders: null,
    allLandPlots: null
  });

  // Layer styles
  const layerStyles = {
    fraGranted: {
      color: '#1b5e20',
      fillColor: '#2e7d32',
      fillOpacity: 0.35,
      weight: 2
    },
    fraPotential: {
      color: '#ff6f00',
      fillColor: '#ff9800',
      fillOpacity: 0.25,
      weight: 2
    },
    boundaries: {
      color: '#1976d2',
      fillColor: '#2196f3',
      fillOpacity: 0.1,
      weight: 2,
      dashArray: '5,5'
    },
    forests: {
      color: '#2e7d32',
      fillColor: '#4caf50',
      fillOpacity: 0.3,
      weight: 2
    },
    allLandPlots: {
      color: '#9c27b0',
      fillColor: '#ba68c8',
      fillOpacity: 0.4,
      weight: 2
    }
  };

  // Patta holder marker styles
  const getPattaMarkerStyle = (status) => {
    const colors = {
      'Approved': '#4caf50',
      'Pending': '#ff9800',
      'Rejected': '#f44336'
    };
    return {
      radius: 8,
      fillColor: colors[status] || '#757575',
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    };
  };

  // Create popup content
  const createPopup = (feature, layerType) => {
    const props = feature.properties;
    
    switch (layerType) {
      case 'fraGranted':
      case 'fraPotential':
        return `
          <div class="popup-content">
            <h4>${props.claimantName}</h4>
            <p><strong>Village:</strong> ${props.village}</p>
            <p><strong>District:</strong> ${props.district}</p>
            <p><strong>State:</strong> ${props.state}</p>
            <p><strong>Area:</strong> ${props.area} hectares</p>
            <p><strong>FRA Type:</strong> ${props.fraType}</p>
            <p><strong>Status:</strong> <span class="status-${props.status}">${props.status}</span></p>
          </div>
        `;
      case 'boundaries':
        return `
          <div class="popup-content">
            <h4>${props.name}</h4>
            <p><strong>Type:</strong> ${props.type}</p>
            <p><strong>Population:</strong> ${props.population?.toLocaleString()}</p>
          </div>
        `;
      case 'forests':
        return `
          <div class="popup-content">
            <h4>${props.name}</h4>
            <p><strong>Type:</strong> ${props.type.replace('_', ' ')}</p>
            <p><strong>Area:</strong> ${props.area} sq km</p>
            <p><strong>State:</strong> ${props.state}</p>
          </div>
        `;
      case 'allLandPlots':
        return `
          <div class="popup-content">
            <h4>Khasra: ${props.khasraNumber}</h4>
            <p><strong>Owner:</strong> ${props.ownerName}</p>
            <p><strong>Village:</strong> ${props.village}</p>
            <p><strong>District:</strong> ${props.district}</p>
            <p><strong>Area:</strong> ${props.area} hectares</p>
            <p><strong>Classification:</strong> ${props.classification}</p>
          </div>
        `;
      default:
        return '<div>No information available</div>';
    }
  };

  // Initialize layers
  useEffect(() => {
    if (!map) return;

    // FRA Granted Areas
    layersRef.current.fraGranted = L.geoJSON(fraGrantedAreas, {
      style: layerStyles.fraGranted,
      onEachFeature: (feature, layer) => {
        layer.bindPopup(createPopup(feature, 'fraGranted'));
        layer.on('click', () => {
          map.fitBounds(layer.getBounds(), { padding: [20, 20] });
        });
      }
    });

    // FRA Potential Areas
    layersRef.current.fraPotential = L.geoJSON(fraPotentialAreas, {
      style: layerStyles.fraPotential,
      onEachFeature: (feature, layer) => {
        layer.bindPopup(createPopup(feature, 'fraPotential'));
        layer.on('click', () => {
          map.fitBounds(layer.getBounds(), { padding: [20, 20] });
        });
      }
    });

    // Administrative Boundaries
    layersRef.current.boundaries = L.geoJSON(administrativeBoundaries, {
      style: layerStyles.boundaries,
      onEachFeature: (feature, layer) => {
        layer.bindPopup(createPopup(feature, 'boundaries'));
      }
    });

    // Forest Areas
    layersRef.current.forests = L.geoJSON(forestAreas, {
      style: layerStyles.forests,
      onEachFeature: (feature, layer) => {
        layer.bindPopup(createPopup(feature, 'forests'));
        layer.on('click', () => {
          map.fitBounds(layer.getBounds(), { padding: [20, 20] });
        });
      }
    });

    // Patta Holders (Points)
    layersRef.current.pattaHolders = L.layerGroup();
    pattaHoldersData.forEach(holder => {
      const marker = L.circleMarker(
        [holder.coordinates[1], holder.coordinates[0]], // Note: Leaflet uses [lat, lng]
        getPattaMarkerStyle(holder.status)
      );
      
      marker.bindPopup(`
        <div class="popup-content">
          <h4>${holder.ownerName}</h4>
          <p><strong>Father:</strong> ${holder.fatherName}</p>
          <p><strong>Village:</strong> ${holder.village}</p>
          <p><strong>District:</strong> ${holder.district}</p>
          <p><strong>State:</strong> ${holder.state}</p>
          <p><strong>Area:</strong> ${holder.area} hectares</p>
          <p><strong>FRA Type:</strong> ${holder.fraType}</p>
          <p><strong>Status:</strong> <span class="status-${holder.status.toLowerCase()}">${holder.status}</span></p>
        </div>
      `);
      
      marker.addTo(layersRef.current.pattaHolders);
    });

    // All Land Plots
    layersRef.current.allLandPlots = L.geoJSON(allLandPlots, {
      style: layerStyles.allLandPlots,
      onEachFeature: (feature, layer) => {
        layer.bindPopup(createPopup(feature, 'allLandPlots'));
        layer.on('click', () => {
          map.fitBounds(layer.getBounds(), { padding: [20, 20] });
        });
      }
    });

    // Add default visible layers
    if (layerVisibility.fraGranted) layersRef.current.fraGranted.addTo(map);
    if (layerVisibility.fraPotential) layersRef.current.fraPotential.addTo(map);
    if (layerVisibility.forests) layersRef.current.forests.addTo(map);
    if (layerVisibility.pattaHolders) layersRef.current.pattaHolders.addTo(map);

    return () => {
      // Cleanup layers
      Object.values(layersRef.current).forEach(layer => {
        if (layer && map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
    };
  }, [map]);

  // Handle layer visibility changes
  useEffect(() => {
    if (!map) return;

    Object.entries(layerVisibility).forEach(([layerName, isVisible]) => {
      const layer = layersRef.current[layerName];
      if (!layer) return;

      if (isVisible && !map.hasLayer(layer)) {
        layer.addTo(map);
      } else if (!isVisible && map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
  }, [layerVisibility, map]);

  return null; // This component doesn't render anything
};

export default FRALayerManager;
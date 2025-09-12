// Simple in-memory layer store for demo/prototyping
// In production, replace with a database

const layerStore = [];

function listLayers() {
  return [...layerStore];
}

function addLayer(layer) {
  const existingIndex = layerStore.findIndex(l => l.id === layer.id);
  if (existingIndex >= 0) {
    layerStore[existingIndex] = { ...layerStore[existingIndex], ...layer, updatedAt: new Date().toISOString() };
    return layerStore[existingIndex];
  }
  const toSave = { ...layer, createdAt: layer.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
  layerStore.push(toSave);
  return toSave;
}

function updateLayerStyle(id, style) {
  const idx = layerStore.findIndex(l => l.id === id);
  if (idx >= 0) {
    layerStore[idx].style = { ...layerStore[idx].style, ...style };
    layerStore[idx].updatedAt = new Date().toISOString();
    return layerStore[idx];
  }
  return null;
}

function deleteLayer(id) {
  const idx = layerStore.findIndex(l => l.id === id);
  if (idx >= 0) {
    layerStore.splice(idx, 1);
    return true;
  }
  return false;
}

module.exports = { listLayers, addLayer, updateLayerStyle, deleteLayer };






// Local shim for mapbox-gl types to satisfy TS when the editor/compiler
// fails to resolve the official @types package in this environment.
declare module 'mapbox-gl' {
  // Runtime default export
  const mapboxgl: any;
  export default mapboxgl;

  // Minimal type shapes actually referenced in the app
  export type LngLatLike = [number, number] | { lng: number; lat: number };
  export interface Map {
    addSource(id: string, source: any): void;
    getSource(id: string): any | undefined;
    addLayer(layer: any): void;
    getLayer(id: string): any | undefined;
    removeLayer(id: string): void;
    removeSource(id: string): void;
    fitBounds(bounds: [LngLatLike, LngLatLike], options?: any): void;
    setLayoutProperty(id: string, name: string, value: any): void;
    resize(): void;
    isStyleLoaded(): boolean;
    on(type: string, listener: (...args: any[]) => void): void;
    addControl(control: any, position?: string): void;
    remove(): void;
  }

  export interface GeoJSONSource {
    setData(data: any): void;
  }

  export class NavigationControl {}
}



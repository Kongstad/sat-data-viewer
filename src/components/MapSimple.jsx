/**
 * MINIMAL Map Component - Testing Mapbox
 */

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function Map({ selectedImage, onBboxChange }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (map.current) return;

    console.log('Token:', MAPBOX_TOKEN ? 'found' : 'MISSING');
    
    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [12.5683, 55.6761],
      zoom: 10
    });

    map.current.on('load', () => {
      console.log('MAP LOADED!');
      setMapReady(true);
      if (onBboxChange) {
        const bounds = map.current.getBounds();
        onBboxChange([bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]);
      }
    });

    map.current.on('error', (e) => {
      console.error('Map error:', e);
    });

    // Force ready after 3 seconds
    setTimeout(() => {
      console.log('Forcing ready');
      setMapReady(true);
    }, 3000);

    return () => map.current?.remove();
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div 
        ref={mapContainer} 
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }} 
      />
      {!mapReady && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          zIndex: 1
        }}>
          Loading map...
        </div>
      )}
    </div>
  );
}

export default Map;

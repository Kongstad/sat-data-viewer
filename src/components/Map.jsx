/**
 * Map Component
 * 
 * Displays an interactive map using Mapbox GL JS
 * Shows satellite basemap and overlays STAC imagery when selected
 * 
 * Learning: This component demonstrates:
 * - useRef: Persisting values across renders without triggering re-renders
 * - useEffect: Running side effects (map initialization, layer updates)
 * - Dependency arrays: Controlling when effects run
 * - External library integration (Mapbox)
 */

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';

// Get Mapbox token from environment variable
// Learning: In Vite, env vars must start with VITE_ to be exposed to client
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

/**
 * Map Component
 * 
 * @param {Object} selectedImage - Currently selected STAC item to display
 * @param {Function} onBboxChange - Callback when map bounds change (for search)
 */
function Map({ selectedImage, onBboxChange }) {
  // useRef: Create persistent references that don't trigger re-renders
  const mapContainer = useRef(null);  // Reference to the div that holds the map
  const map = useRef(null);           // Reference to the Mapbox map instance

  // useState: Track map readiness and basemap style
  const [mapReady, setMapReady] = useState(false);
  const [isSatelliteView, setIsSatelliteView] = useState(false); // Start with streets

  /**
   * Effect 1: Initialize the map (runs once on component mount)
   * 
   * Learning: useEffect with empty dependency array [] runs only once
   * Similar to componentDidMount in class components
   */
  useEffect(() => {
    // Don't initialize if map already exists
    if (map.current) return;

    console.log('Starting map initialization...');

    // Check if Mapbox token is configured
    if (!MAPBOX_TOKEN) {
      console.error('Mapbox token not found. Please add VITE_MAPBOX_TOKEN to .env file');
      return;
    }

    console.log('Mapbox token found:', MAPBOX_TOKEN.substring(0, 20) + '...');

    // Set Mapbox access token
    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Default center (Copenhagen) - will be updated if geolocation succeeds
    let initialCenter = [12.5683, 55.6761];
    let initialZoom = 10;

    console.log('Initializing Mapbox map...');

    try {
      // Create a new Mapbox map instance
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: initialCenter,
        zoom: initialZoom,
        fadeDuration: 0,
        trackResize: true,
        optimizeForTerrain: true
      });

      console.log('Map instance created successfully!');
      
      setIsSatelliteView(false);

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Force resize after a short delay to ensure container dimensions are calculated
      setTimeout(() => {
        if (map.current) {
          console.log('Forcing map resize...');
          map.current.resize();
        }
      }, 100);
    } catch (error) {
      console.error('FATAL ERROR creating map:', error);
      alert('Failed to create map: ' + error.message);
      return;
    }

    // Try to get user's location (non-blocking)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Got user location:', position.coords.latitude, position.coords.longitude);
          if (map.current) {
            map.current.flyTo({
              center: [position.coords.longitude, position.coords.latitude],
              zoom: 12
            });
          }
        },
        (error) => {
          console.log('Geolocation error or denied:', error.message);
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    }

    // Timeout fallback - force map to show after 2 seconds even if load event doesn't fire
    const loadTimeout = setTimeout(() => {
      console.warn('Forcing map ready after timeout');
      setMapReady(true);
    }, 2000);

    // Wait for map to load before allowing interactions
    map.current.on('load', () => {
      clearTimeout(loadTimeout);
      setMapReady(true);
      console.log('Map loaded successfully');
      
      // Emit initial bounding box
      if (onBboxChange) {
        const bounds = map.current.getBounds();
        onBboxChange([
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth()
        ]);
      }
    });

    // Handle map errors
    map.current.on('error', (e) => {
      console.error('Mapbox error:', e.error);
    });

    // Update bounding box when user pans or zooms
    map.current.on('moveend', () => {
      if (onBboxChange) {
        const bounds = map.current.getBounds();
        const bbox = [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth()
        ];
        onBboxChange(bbox);
      }
    });

    // Cleanup function: Remove map when component unmounts
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []); // Empty array = run once on mount

  /**
   * Toggle between street and satellite basemap
   */
  const toggleBasemap = () => {
    if (!map.current || !mapReady) return;

    const newStyle = isSatelliteView 
      ? 'mapbox://styles/mapbox/streets-v12' 
      : 'mapbox://styles/mapbox/satellite-v9';

    // When changing style, Mapbox removes all layers and sources
    // We need to re-add our overlay after the style has finished loading
    map.current.once('style.load', () => {
      console.log('New style loaded, re-applying overlay if needed');
      // This will trigger the useEffect for selectedImage because mapReady is true
      // but we might need to manually trigger it or rely on the state update
    });

    map.current.setStyle(newStyle);
    setIsSatelliteView(!isSatelliteView);
  };

  /**
   * Effect 2: Add/update satellite imagery layer when selectedImage changes
   * 
   * Learning: useEffect with [selectedImage] in dependency array
   * runs every time selectedImage changes
   */
  useEffect(() => {
    // Don't run if map isn't ready or no image selected
    if (!map.current || !mapReady || !selectedImage) return;

    const layerId = 'satellite-overlay';

    // Remove existing overlay layer if present
    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
    }
    if (map.current.getSource(layerId)) {
      map.current.removeSource(layerId);
    }

    // Get the visual asset URL from STAC item
    // Try multiple asset types in order of preference
    let tileUrl = null;
    
    if (selectedImage.assets?.rendered_preview?.href) {
      tileUrl = selectedImage.assets.rendered_preview.href;
    } else if (selectedImage.assets?.visual?.href) {
      tileUrl = selectedImage.assets.visual.href;
    }

    if (!tileUrl) {
      console.warn('No renderable asset found in selected image');
      return;
    }

    try {
      // Add new raster source and layer
      // Learning: Mapbox uses sources (data) and layers (styling)
      map.current.addSource(layerId, {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256
      });

      map.current.addLayer({
        id: layerId,
        type: 'raster',
        source: layerId,
        paint: {
          'raster-opacity': 0.9  // Slightly transparent to see basemap
        }
      });

      // Zoom to the image's bounding box
      if (selectedImage.bbox && selectedImage.bbox.length === 4) {
        map.current.fitBounds([
          [selectedImage.bbox[0], selectedImage.bbox[1]], // southwest corner
          [selectedImage.bbox[2], selectedImage.bbox[3]]  // northeast corner
        ], {
          padding: 50,
          duration: 1000  // Animate over 1 second
        });
      }

      console.log('Added satellite overlay to map');
    } catch (error) {
      console.error('Error adding satellite layer:', error);
    }
  }, [selectedImage, mapReady]); // Run when either changes

  return (
    <div className="map-wrapper">
      {/* Mapbox container */}
      <div ref={mapContainer} className="map-container" />
      
      {/* Basemap toggle button */}
      {mapReady && (
        <button className="basemap-toggle" onClick={toggleBasemap}>
          {isSatelliteView ? 'Street View' : 'Satellite View'}
        </button>
      )}

      {/* Loading overlay */}
      {!mapReady && (
        <div className="map-loading">
          <div>Loading map...</div>
        </div>
      )}

      {/* Info overlay */}
      {mapReady && !selectedImage && (
        <div className="map-info">
          <p>Pan and zoom to select your area of interest</p>
        </div>
      )}
    </div>
  );
}

export default Map;

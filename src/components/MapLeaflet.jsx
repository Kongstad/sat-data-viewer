/**
 * Leaflet map component with STAC tile rendering
 * Handles multi-collection tile overlays, legends, and metadata display
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import area from '@turf/area';
import length from '@turf/length';
import './Map.css';
import { buildTileUrl, getLegendConfig, getCollection } from '../config/collections';

function Map({ selectedImages = [], searchResults = [], onBboxChange, onZoomToImage, currentCollection = 'sentinel-2-l2a', selectedBands = {}, elevationRange = { min: -10, max: 150 }, thermalRange = { min: 28000, max: 55000 }, selectedTileInfo = null, onCloseTileInfo }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const overlayLayers = useRef([]);
  const drawnRectangle = useRef(null);
  const measurementLayer = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [isSatelliteView, setIsSatelliteView] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [baseLayerType, setBaseLayerType] = useState('satellite');
  const [showBoundaries, setShowBoundaries] = useState(true);

  const getLegendInfo = () => {
    if (!currentCollection || !selectedImages || selectedImages.length === 0) return null;
    
    const collectionConfig = getCollection(currentCollection);
    const firstImageId = selectedImages[0];
    const band = selectedBands[firstImageId] || collectionConfig?.defaultBand || 'visual';
    
    return getLegendConfig(currentCollection, band, { elevationRange, thermalRange });
  };

  const legendInfo = getLegendInfo();

  // Tile layer URLs
  const streetTiles = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const satelliteTiles = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  const baseLayer = useRef(null);

  useEffect(() => {
    if (map.current) return;

    // Create map
    map.current = L.map(mapContainer.current, {
      center: [55.6761, 12.5683], // Copenhagen [lat, lng] - Leaflet uses lat,lng not lng,lat
      zoom: 10,
      zoomControl: true
    });

    // Add satellite tile layer (default)
    baseLayer.current = L.tileLayer(satelliteTiles, {
      attribution: 'Esri, Maxar, Earthstar Geographics, and the GIS User Community',
      maxZoom: 19
    }).addTo(map.current);

    // Initialize measurement layer
    measurementLayer.current = new L.FeatureGroup();
    map.current.addLayer(measurementLayer.current);

    // Handle drawing created
    map.current.on(L.Draw.Event.CREATED, (e) => {
      const layer = e.layer;
      measurementLayer.current.addLayer(layer);

      // Calculate and display measurement
      const geojson = layer.toGeoJSON();
      let measurement = '';

      if (e.layerType === 'polyline') {
        const distKm = length(geojson, { units: 'kilometers' });
        const distMiles = distKm * 0.621371;
        
        let metricStr, imperialStr;
        
        if (distKm < 1) {
          metricStr = `${(distKm * 1000).toFixed(1)} m`;
        } else {
          metricStr = `${distKm.toFixed(2)} km`;
        }
        
        if (distMiles < 1) {
          imperialStr = `${(distMiles * 5280).toFixed(1)} ft`;
        } else {
          imperialStr = `${distMiles.toFixed(2)} mi`;
        }
        
        measurement = `<strong>Distance</strong><br>${metricStr} / ${imperialStr}`;
        
      } else if (e.layerType === 'polygon') {
        const areaM2 = area(geojson);
        const areaKm2 = areaM2 / 1000000;
        const hectares = areaM2 / 10000;
        const areaFt2 = areaM2 * 10.7639;
        const acres = areaM2 / 4046.86;
        const areaMi2 = areaKm2 * 0.386102;
        
        let metricStr, imperialStr, hectaresStr;
        
        // Metric
        if (areaKm2 < 0.01) {
          metricStr = `${areaM2.toFixed(1)} m²`;
        } else {
          metricStr = `${areaKm2.toFixed(3)} km²`;
        }
        
        // Imperial
        if (areaMi2 < 0.01) {
          if (acres < 1) {
            imperialStr = `${areaFt2.toFixed(0)} ft²`;
          } else {
            imperialStr = `${acres.toFixed(2)} acres`;
          }
        } else {
          imperialStr = `${areaMi2.toFixed(3)} mi²`;
        }
        
        // Hectares
        hectaresStr = `${hectares.toFixed(2)} ha`;
        
        measurement = `<strong>Area</strong><br>${metricStr}<br>${imperialStr}<br>${hectaresStr}`;
      }

      if (measurement) {
        layer.bindPopup(measurement, {
          permanent: false,
          className: 'measurement-popup'
        }).openPopup();
      }
    });

    // Handle ESC key to cancel drawing
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        // Cancel any active drawing
        map.current.fire('draw:canceled');
      }
    };
    document.addEventListener('keydown', handleEscape);

    setMapReady(true);

    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (map.current) {
            map.current.setView([position.coords.latitude, position.coords.longitude], 12);
          }
        },
        () => {},
        { timeout: 5000, enableHighAccuracy: false }
      );
    }

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const startDrawing = () => {
    if (!map.current) return;
    
    setIsDrawing(true);
    map.current.getContainer().style.cursor = 'crosshair';
    
    const onClick = (e) => {
      const clickedPoint = e.latlng;
      
      // Remove old rectangle if exists
      if (drawnRectangle.current) {
        map.current.removeLayer(drawnRectangle.current);
      }
      
      // Create a search area around the clicked point (approximately 20km x 20km)
      const latOffset = 0.09; // ~10km
      const lngOffset = 0.15; // ~10km (adjusted for latitude)
      
      const bounds = L.latLngBounds(
        [clickedPoint.lat - latOffset, clickedPoint.lng - lngOffset],
        [clickedPoint.lat + latOffset, clickedPoint.lng + lngOffset]
      );
      
      // Draw the search area rectangle
      drawnRectangle.current = L.rectangle(bounds, {
        color: '#4FC3F7',
        weight: 3,
        fillColor: '#4FC3F7',
        fillOpacity: 0.15,
        pane: 'overlayPane',
        interactive: false
      }).addTo(map.current);
      
      // Bring to front to ensure visibility
      drawnRectangle.current.bringToFront();
      
      // Update search bbox
      if (onBboxChange) {
        onBboxChange([
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth()
        ]);
      }
      
      // Clean up
      map.current.off('click', onClick);
      map.current.getContainer().style.cursor = '';
      setIsDrawing(false);
    };
    
    map.current.on('click', onClick);
  };

  const startMeasureLine = () => {
    if (!map.current) return;
    new L.Draw.Polyline(map.current, {
      shapeOptions: {
        color: '#1976D2',
        weight: 3
      }
    }).enable();
  };

  const startMeasureArea = () => {
    if (!map.current) return;
    new L.Draw.Polygon(map.current, {
      shapeOptions: {
        color: '#388E3C',
        weight: 3
      }
    }).enable();
  };

  const clearMeasurements = () => {
    if (measurementLayer.current) {
      measurementLayer.current.clearLayers();
    }
  };

  const selectBasemap = (layerType) => {
    if (!map.current) return;

    // Remove existing base layer if present
    if (baseLayer.current) {
      map.current.removeLayer(baseLayer.current);
      baseLayer.current = null;
    }

    if (layerType === 'street') {
      // Switch to streets
      baseLayer.current = L.tileLayer(streetTiles, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map.current);
      setIsSatelliteView(false);
    } else if (layerType === 'satellite') {
      // Switch to satellite
      baseLayer.current = L.tileLayer(satelliteTiles, {
        attribution: '&copy; Esri',
        maxZoom: 19
      }).addTo(map.current);
      setIsSatelliteView(true);
    }
    // If 'none', baseLayer.current stays null (no base map)

    setBaseLayerType(layerType);
    setShowLayerMenu(false);
  };

  // Add/update satellite imagery overlays when selectedImages, collection, or bands change
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Remove all existing overlays
    overlayLayers.current.forEach(layer => {
      if (layer.image) map.current.removeLayer(layer.image);
      if (layer.border) map.current.removeLayer(layer.border);
    });
    overlayLayers.current = [];

    // If no selections, clear and return
    if (!selectedImages || selectedImages.length === 0) {
      return;
    }

    // Get selected image objects from search results
    const selectedImageObjects = searchResults.filter(item => 
      selectedImages.includes(item.id)
    );

    if (selectedImageObjects.length === 0) return;

    // Add each selected image
    selectedImageObjects.forEach(image => {
      if (!image.bbox || image.bbox.length !== 4) {
        console.warn('Invalid bbox for:', image.id);
        return;
      }

      try {
        // STAC bbox format: [west, south, east, north] = [minLon, minLat, maxLon, maxLat]
        // Leaflet bounds: [[south, west], [north, east]] = [[minLat, minLon], [maxLat, maxLon]]
        const [west, south, east, north] = image.bbox;
        
        // Validate coordinates are in correct order
        if (south > north || west > east) {
          console.warn('Invalid bbox coordinates for:', image.id, image.bbox);
          return;
        }
        
        const bounds = [
          [south, west], // southwest corner
          [north, east]  // northeast corner
        ];
        
        const collectionConfig = getCollection(currentCollection);
        const band = selectedBands[image.id] || collectionConfig?.defaultBand || 'visual';
        const tileUrl = buildTileUrl(currentCollection, image.id, band, { elevationRange, thermalRange });
        
        if (currentCollection === 'modis-13Q1-061') {
          map.current.setMaxBounds(null);
        }
        
        const imageLayer = L.tileLayer(tileUrl, {
          opacity: 1.0,
          bounds: bounds,
          maxZoom: 18,
          minZoom: 1,
          tileSize: 256
        }).addTo(map.current);

        // Add blue border rectangle if boundaries are enabled
        let borderLayer = null;
        if (showBoundaries) {
          borderLayer = L.rectangle(bounds, {
            color: '#0066ff',
            weight: 2,
            fillOpacity: 0,
            interactive: false
          }).addTo(map.current);
        }

        overlayLayers.current.push({
          image: imageLayer,
          border: borderLayer,
          id: image.id
        });
      } catch (error) {
        console.error('Error adding satellite overlay:', error);
      }
    });
  }, [selectedImages, searchResults, mapReady, currentCollection, selectedBands, elevationRange, thermalRange, showBoundaries]);

  // Function to zoom to a specific image
  const zoomToImage = useCallback((imageId) => {
    if (!map.current) return;
    
    const image = searchResults.find(item => item.id === imageId);
    if (!image || !image.bbox || image.bbox.length !== 4) return;
    
    const [west, south, east, north] = image.bbox;
    const bounds = [
      [south, west],
      [north, east]
    ];
    
    map.current.fitBounds(bounds, { padding: [50, 50] });
  }, [searchResults]);

  // Expose zoom function and map utilities to parent component
  useEffect(() => {
    if (mapReady && onZoomToImage) {
      // Expose both zoom function and map center getter
      zoomToImage.getCenter = () => map.current.getCenter();
      onZoomToImage(zoomToImage);
    }
  }, [mapReady, onZoomToImage, zoomToImage]);

  return (
    <div className="map-wrapper">
      <div ref={mapContainer} className="map-container" />
      
      {mapReady && (
        <>
          <div className="basemap-control">
            <button 
              className="basemap-toggle" 
              onClick={() => setShowLayerMenu(!showLayerMenu)}
            >
              Base Layer: {baseLayerType === 'satellite' ? 'Satellite' : baseLayerType === 'none' ? 'None' : 'Street'}
            </button>
            {showLayerMenu && (
              <div className="layer-menu">
                <button 
                  className={`layer-option ${baseLayerType === 'street' ? 'active' : ''}`}
                  onClick={() => selectBasemap('street')}
                >
                  Street View
                </button>
                <button 
                  className={`layer-option ${baseLayerType === 'satellite' ? 'active' : ''}`}
                  onClick={() => selectBasemap('satellite')}
                >
                  Satellite View
                </button>
                <button 
                  className={`layer-option ${baseLayerType === 'none' ? 'active' : ''}`}
                  onClick={() => selectBasemap('none')}
                >
                  None
                </button>
              </div>
            )}
          </div>
          <button 
            className="draw-button" 
            onClick={startDrawing}
            disabled={isDrawing}
          >
            {isDrawing ? 'Click on Map...' : 'Set Search Point'}
          </button>
          {drawnRectangle.current && (
            <button 
              className="clear-search-button" 
              onClick={() => {
                if (drawnRectangle.current) {
                  map.current.removeLayer(drawnRectangle.current);
                  drawnRectangle.current = null;
                  if (onBboxChange) {
                    onBboxChange(null);
                  }
                }
              }}
            >
              Clear Search Point
            </button>
          )}
          <button 
            className="toggle-boundaries-button" 
            onClick={() => setShowBoundaries(!showBoundaries)}
          >
            {showBoundaries ? 'Hide Boundaries' : 'Show Boundaries'}
          </button>
          <div className="measurement-controls">
            <button className="measure-line-button" onClick={startMeasureLine} title="Measure Distance (Line)">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 17L17 3M3 17L5 15M17 3L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="3" cy="17" r="1.5" fill="currentColor"/>
                <circle cx="17" cy="3" r="1.5" fill="currentColor"/>
              </svg>
            </button>
            <button className="measure-area-button" onClick={startMeasureArea} title="Measure Area (Polygon)">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3L17 3L17 17L3 17L3 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                <circle cx="3" cy="3" r="1.5" fill="currentColor"/>
                <circle cx="17" cy="3" r="1.5" fill="currentColor"/>
                <circle cx="17" cy="17" r="1.5" fill="currentColor"/>
                <circle cx="3" cy="17" r="1.5" fill="currentColor"/>
              </svg>
            </button>
            <button className="clear-measurements-button" onClick={clearMeasurements} title="Clear All Measurements">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </>
      )}

      {!mapReady && (
        <div className="map-loading">
          <div>Loading map...</div>
        </div>
      )}

      {mapReady && (!selectedImages || selectedImages.length === 0) && (
        <div className="map-info">
          <p>Click 'Set Search Point' and then click anywhere on the map to select your search area</p>
        </div>
      )}

      {/* Dynamic Legend - Show when any band visualization is displayed */}
      {mapReady && legendInfo && (
        <div className="elevation-legend">
          <div className="legend-title">{legendInfo.title}</div>
          <div className="legend-gradient" style={{ background: legendInfo.gradient }}></div>
          <div className="legend-labels">
            <span>{legendInfo.min}</span>
            <span>{legendInfo.max}</span>
          </div>
        </div>
      )}

      {/* STAC Metadata Info Box - Show when tile is clicked */}
      {mapReady && selectedTileInfo && (
        <div className="stac-info-box">
          <div className="stac-info-header">
            <span>Tile Metadata</span>
            <button className="close-btn" onClick={onCloseTileInfo}>×</button>
          </div>
          <div className="stac-info-content">
            <div className="stac-info-row">
              <span className="label">Tile ID:</span>
              <span className="value">{selectedTileInfo.id}</span>
            </div>
            <div className="stac-info-row">
              <span className="label">Date:</span>
              <span className="value">{selectedTileInfo.date}</span>
            </div>
            <div className="stac-info-row">
              <span className="label">Provider:</span>
              <span className="value">{selectedTileInfo.provider || 'Microsoft Planetary Computer'}</span>
            </div>
            <div className="stac-info-row">
              <span className="label">Collection:</span>
              <span className="value">{selectedTileInfo.collection}</span>
            </div>
            
            {/* Sentinel-1 specific metadata */}
            {selectedTileInfo.collection === 'sentinel-1-rtc' && selectedTileInfo.properties && (
              <>
                {selectedTileInfo.properties['sar:orbit_state'] && (
                  <div className="stac-info-row">
                    <span className="label">Orbit:</span>
                    <span className="value">{selectedTileInfo.properties['sar:orbit_state']}</span>
                  </div>
                )}
                {selectedTileInfo.properties['sat:orbit_state'] && (
                  <div className="stac-info-row">
                    <span className="label">Orbit Direction:</span>
                    <span className="value">{selectedTileInfo.properties['sat:orbit_state']}</span>
                  </div>
                )}
                {selectedTileInfo.properties['s1:processing_baseline'] && (
                  <div className="stac-info-row">
                    <span className="label">Baseline Version:</span>
                    <span className="value">{selectedTileInfo.properties['s1:processing_baseline']}</span>
                  </div>
                )}
              </>
            )}
            
            {/* Sentinel-2 specific metadata */}
            {selectedTileInfo.collection === 'sentinel-2-l2a' && selectedTileInfo.properties && (
              <>
                {selectedTileInfo.cloudCover !== 'N/A' && (
                  <div className="stac-info-row">
                    <span className="label">Cloud Cover:</span>
                    <span className="value">{selectedTileInfo.cloudCover}%</span>
                  </div>
                )}
                {selectedTileInfo.properties['s2:processing_baseline'] && (
                  <div className="stac-info-row">
                    <span className="label">Baseline Version:</span>
                    <span className="value">{selectedTileInfo.properties['s2:processing_baseline']}</span>
                  </div>
                )}
              </>
            )}
            
            {/* CRS/EPSG */}
            {selectedTileInfo.properties?.['proj:epsg'] && (
              <div className="stac-info-row">
                <span className="label">EPSG:</span>
                <span className="value">{selectedTileInfo.properties['proj:epsg']}</span>
              </div>
            )}
            
            {/* Platform */}
            {selectedTileInfo.properties?.platform && (
              <div className="stac-info-row">
                <span className="label">Platform:</span>
                <span className="value">{selectedTileInfo.properties.platform}</span>
              </div>
            )}
            
            {/* Instruments */}
            {selectedTileInfo.properties?.instruments && selectedTileInfo.properties.instruments.length > 0 && (
              <div className="stac-info-row">
                <span className="label">Instrument:</span>
                <span className="value">{selectedTileInfo.properties.instruments.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Map;

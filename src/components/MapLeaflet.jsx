/**
 * Map Component using Leaflet
 * 
 * Displays an interactive map using Leaflet (no API key required for base maps)
 * Shows OpenStreetMap basemap and overlays STAC imagery when selected
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';

function Map({ selectedImages = [], searchResults = [], onBboxChange, onZoomToImage, currentCollection = 'sentinel-2-l2a', selectedBands = {}, elevationRange = { min: -10, max: 150 }, thermalRange = { min: 28000, max: 55000 }, selectedTileInfo = null, onCloseTileInfo }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const overlayLayers = useRef([]); // Changed to array for multiple overlays
  const drawnRectangle = useRef(null); // Reference to user-drawn search area
  const [mapReady, setMapReady] = useState(false);
  const [isSatelliteView, setIsSatelliteView] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [baseLayerType, setBaseLayerType] = useState('satellite'); // 'street', 'satellite', or 'none'

  // Helper function to get legend configuration for current view
  const getLegendInfo = () => {
    if (!currentCollection || !selectedImages || selectedImages.length === 0) return null;
    
    if (currentCollection === 'cop-dem-glo-30') {
      return {
        title: 'Elevation',
        min: `${elevationRange.min}m`,
        max: `${elevationRange.max}m`,
        gradient: 'linear-gradient(to right, #0c1c5c, #1e4d8b, #2d7bb6, #3fa855, #7ac74f, #c4d968, #e8c167, #d89a5a, #c4734d, #ffffff)'
      };
    }
    
    // Get the band from the first selected image
    const firstImageId = selectedImages[0];
    const band = selectedBands[firstImageId];
    
    if (currentCollection === 'sentinel-2-l2a') {
      if (band === 'nir') {
        return {
          title: 'Near Infrared',
          min: '0',
          max: '4000',
          gradient: 'linear-gradient(to right, #000004, #420a68, #932667, #dd513a, #fca50a, #fcffa4)' // inferno
        };
      } else if (band === 'swir') {
        return {
          title: 'Short-Wave IR',
          min: '0',
          max: '3000',
          gradient: 'linear-gradient(to right, #f7fbff, #deebf7, #c6dbef, #9ecae1, #6baed6, #4292c6, #2171b5, #08519c, #08306b)' // blues
        };
      } else if (band === 'rededge') {
        return {
          title: 'Red Edge',
          min: '0',
          max: '3500',
          gradient: 'linear-gradient(to right, #a50026, #d73027, #f46d43, #fdae61, #fee08b, #ffffbf, #d9ef8b, #a6d96a, #66bd63, #1a9850, #006837)' // rdylgn
        };
      }
    } else if (currentCollection === 'sentinel-1-rtc') {
      return {
        title: 'SAR Backscatter',
        min: '0.0',
        max: '0.3',
        gradient: 'linear-gradient(to right, #440154, #482777, #3e4989, #31688e, #26828e, #1f9e89, #35b779, #6ece58, #b5de2b, #fde724)' // viridis
      };
    } else if (currentCollection === 'landsat-c2-l2') {
      if (band === 'nir') {
        return {
          title: 'Near Infrared',
          min: '0',
          max: '30000',
          gradient: 'linear-gradient(to right, #000004, #420a68, #932667, #dd513a, #fca50a, #fcffa4)' // inferno
        };
      } else if (band === 'swir') {
        return {
          title: 'Short-Wave IR',
          min: '0',
          max: '30000',
          gradient: 'linear-gradient(to right, #f7fbff, #deebf7, #c6dbef, #9ecae1, #6baed6, #4292c6, #2171b5, #08519c, #08306b)' // blues
        };
      } else if (band === 'thermal') {
        return {
          title: 'Thermal IR',
          min: `${thermalRange.min}`,
          max: `${thermalRange.max}`,
          gradient: 'linear-gradient(to right, #30123b, #4777ef, #1ac7ff, #28ed87, #a0fb00, #fca50a, #e62b00, #a50026)' // turbo
        };
      }
    } else if (currentCollection === 'modis-13Q1-061') {
      return {
        title: band === 'evi' ? 'EVI' : 'NDVI',
        min: '-0.2',
        max: '1.0',
        gradient: 'linear-gradient(to right, #a50026, #d73027, #f46d43, #fdae61, #fee08b, #ffffbf, #d9ef8b, #a6d96a, #66bd63, #1a9850, #006837)' // rdylgn
      };
    }
    
    return null;
  };

  const legendInfo = getLegendInfo();

  // Tile layer URLs
  const streetTiles = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const satelliteTiles = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  const baseLayer = useRef(null);

  useEffect(() => {
    if (map.current) return;

    console.log('Initializing Leaflet map...');

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

    console.log('Leaflet map created!');
    setMapReady(true);

    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Got user location:', position.coords.latitude, position.coords.longitude);
          if (map.current) {
            map.current.setView([position.coords.latitude, position.coords.longitude], 12);
          }
        },
        (error) => {
          console.log('Geolocation denied or error:', error.message);
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    }

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Place search point and create search area
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

  // Toggle between street and satellite basemap
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

    console.log(`Adding ${selectedImageObjects.length} satellite image overlays`);

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
        
        console.log(`Image ${image.id}: bbox [${west.toFixed(2)}, ${south.toFixed(2)}, ${east.toFixed(2)}, ${north.toFixed(2)}]`);
        
        // Determine tile URL based on collection and selected band
        let tileUrl;
        if (currentCollection === 'sentinel-1-rtc') {
          // Sentinel-1 RTC: Use selected band (VV or VH), default to VV
          const band = selectedBands[image.id] || 'vv';
          tileUrl = `https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?collection=sentinel-1-rtc&item=${image.id}&assets=${band}&asset_bidx=${band}|1&rescale=0,0.3&colormap_name=viridis`;
        } else if (currentCollection === 'cop-dem-glo-30') {
          // Copernicus DEM: Use gist_earth colormap (blue water → green → brown/white peaks)
          // Using dynamic elevation range from user controls
          tileUrl = `https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?collection=cop-dem-glo-30&item=${image.id}&assets=data&asset_bidx=data|1&rescale=${elevationRange.min},${elevationRange.max}&colormap_name=gist_earth`;
        } else if (currentCollection === 'landsat-c2-l2') {
          // Landsat C2 L2: Band selection for different visualizations
          const band = selectedBands[image.id] || 'tci';
          if (band === 'tci') {
            // True Color Image (RGB composite)
            tileUrl = `https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?collection=landsat-c2-l2&item=${image.id}&assets=red&assets=green&assets=blue&rescale=7000,14000&rescale=8000,13000&rescale=8000,12000`;
          } else if (band === 'nir') {
            // Near Infrared (useful for vegetation analysis)
            tileUrl = `https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?collection=landsat-c2-l2&item=${image.id}&assets=nir08&asset_bidx=nir08|1&rescale=0,30000&colormap_name=inferno`;
          } else if (band === 'swir') {
            // Short-Wave Infrared (useful for geology and moisture)
            tileUrl = `https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?collection=landsat-c2-l2&item=${image.id}&assets=swir16&asset_bidx=swir16|1&rescale=0,30000&colormap_name=blues`;
          } else if (band === 'thermal') {
            // Thermal Infrared (shows surface temperature) - user adjustable range
            tileUrl = `https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?collection=landsat-c2-l2&item=${image.id}&assets=lwir11&asset_bidx=lwir11|1&rescale=${thermalRange.min},${thermalRange.max}&colormap_name=turbo`;
          }
        } else if (currentCollection === 'modis-13Q1-061') {
          // MODIS Vegetation Indices: NDVI or EVI
          const band = selectedBands[image.id] || 'ndvi';
          if (band === 'ndvi') {
            // NDVI (Normalized Difference Vegetation Index)
            tileUrl = `https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?collection=modis-13Q1-061&item=${image.id}&assets=250m_16_days_NDVI&asset_bidx=250m_16_days_NDVI|1&rescale=-2000,10000&colormap_name=rdylgn`;
          } else {
            // EVI (Enhanced Vegetation Index)
            tileUrl = `https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?collection=modis-13Q1-061&item=${image.id}&assets=250m_16_days_EVI&asset_bidx=250m_16_days_EVI|1&rescale=-2000,10000&colormap_name=rdylgn`;
          }
        } else {
          // Sentinel-2: Band selection for different visualizations
          const band = selectedBands[image.id] || 'visual';
          if (band === 'visual') {
            // True Color Image (RGB composite)
            tileUrl = `https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?collection=sentinel-2-l2a&item=${image.id}&assets=visual&asset_bidx=visual|1,2,3&nodata=0`;
          } else if (band === 'nir') {
            // Near Infrared (B08 - vegetation analysis) - warm colors for vegetation
            tileUrl = `https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?collection=sentinel-2-l2a&item=${image.id}&assets=B08&asset_bidx=B08|1&rescale=0,4000&colormap_name=inferno`;
          } else if (band === 'swir') {
            // Short-Wave Infrared (B11 - moisture/geology) - cool colors for moisture
            tileUrl = `https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?collection=sentinel-2-l2a&item=${image.id}&assets=B11&asset_bidx=B11|1&rescale=0,3000&colormap_name=blues`;
          } else if (band === 'rededge') {
            // Red Edge (B05 - vegetation stress/health)
            tileUrl = `https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?collection=sentinel-2-l2a&item=${image.id}&assets=B05&asset_bidx=B05|1&rescale=0,3500&colormap_name=rdylgn`;
          }
        }
        
        const imageLayer = L.tileLayer(tileUrl, {
          opacity: 1.0,
          bounds: bounds,
          maxZoom: 18,
          minZoom: 1,
          tileSize: 256
        }).addTo(map.current);

        // Add blue border rectangle (no click handler needed)
        const borderLayer = L.rectangle(bounds, {
          color: '#0066ff',
          weight: 2,
          fillOpacity: 0,
          interactive: false
        }).addTo(map.current);

        overlayLayers.current.push({
          image: imageLayer,
          border: borderLayer,
          id: image.id
        });
      } catch (error) {
        console.error('Error adding satellite overlay:', error);
      }
    });

    console.log('Satellite overlays added successfully');
  }, [selectedImages, searchResults, mapReady, currentCollection, selectedBands, elevationRange, thermalRange]);

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

/**
 * App Component - Main Application
 * 
 * This is the root component that orchestrates the entire application
 * 
 * Learning: React Architecture Pattern
 * - App holds the main state (search results, selected image, etc.)
 * - Child components receive data via props (one-way data flow)
 * - Child components communicate up via callback functions
 * - This pattern is called "lifting state up"
 */

import { useState, useCallback } from 'react';
import Map from './components/MapLeaflet';  // Using Leaflet
import SearchBar from './components/SearchBar';
import ImageList from './components/ImageList';
import { searchSatelliteData, formatStacItem } from './utils/stacApi';
import './App.css';

function App() {
  // Application State
  // Learning: useState returns [value, setter function]
  const [searchResults, setSearchResults] = useState(null); // null = no search yet, [] = search with no results
  const [selectedImages, setSelectedImages] = useState([]); // Array of selected image IDs
  const [isLoading, setIsLoading] = useState(false);
  const [currentBbox, setCurrentBbox] = useState(null);
  const [error, setError] = useState(null);
  const [zoomToImageFn, setZoomToImageFn] = useState(null);
  const [currentCollection, setCurrentCollection] = useState('sentinel-2-l2a');
  const [selectedBands, setSelectedBands] = useState({}); // Maps imageId -> band name (e.g., 'vv' or 'vh')
  const [elevationRange, setElevationRange] = useState({ min: -10, max: 150 }); // Elevation range for DEM visualization
  const [thermalRange, setThermalRange] = useState({ min: 28000, max: 55000 }); // Thermal range for Landsat thermal band
  const [selectedTileInfo, setSelectedTileInfo] = useState(null); // STAC metadata for info display

  /**
   * Handle search submission from SearchBar component
   * This is a callback function passed to SearchBar
   */
  const handleSearch = async (searchParams) => {
    // If no bbox is drawn, use map center to create one
    let searchBbox = currentBbox;
    if (!searchBbox && zoomToImageFn) {
      // Get current map center and create a ~20km x 20km search area
      const center = zoomToImageFn.getCenter ? zoomToImageFn.getCenter() : null;
      if (center) {
        const latOffset = 0.09; // ~10km
        const lngOffset = 0.15; // ~10km
        searchBbox = [
          center.lng - lngOffset,
          center.lat - latOffset,
          center.lng + lngOffset,
          center.lat + latOffset
        ];
      }
    }

    if (!searchBbox) {
      setError('Unable to determine search area');
      return;
    }

    // Start loading
    setIsLoading(true);
    setError(null);

    try {
      // Call STAC API
      const results = await searchSatelliteData(
        searchBbox,
        searchParams.startDate,
        searchParams.endDate,
        searchParams.collection,
        searchParams.cloudCover
      );

      // Format results for display and filter out 04/12/2024 (problematic date)
      const formattedResults = results.features
        .map(item => formatStacItem(item, searchParams.collection))
        .filter(item => item.date !== '04/12/2024');
      
      setSearchResults(formattedResults);
      setSelectedImages([]); // Clear previous selections
      setCurrentCollection(searchParams.collection);
      setSelectedBands({}); // Clear band selections

      console.log(`Found ${formattedResults.length} images in the area`);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search for imagery. Please try again.');
      setSearchResults(null);
      setSelectedImages([]);
    } finally {
      // Stop loading regardless of success or failure
      setIsLoading(false);
    }
  };

  /**
   * Handle image toggle (checkbox) from ImageList component
   */
  const handleToggleImage = (image) => {
    setSelectedImages(prev => {
      if (prev.includes(image.id)) {
        // Remove from selection
        return prev.filter(id => id !== image.id);
      } else {
        // Add to selection
        return [...prev, image.id];
      }
    });
  };

  /**
   * Clear all selected images from map
   */
  const handleClearSelections = () => {
    setSelectedImages([]);
  };

  /**
   * Handle map bounding box changes
   * This is called whenever the user pans or zooms the map
   */
  const handleBboxChange = (bbox) => {
    setCurrentBbox(bbox);
  };

  /**
   * Handle zoom to image callback from Map
   */
  const handleZoomToImage = useCallback((zoomFn) => {
    setZoomToImageFn(() => zoomFn);
  }, []);

  /**
   * Handle band selection for Sentinel-1 images
   */
  const handleBandChange = (imageId, band) => {
    setSelectedBands(prev => ({
      ...prev,
      [imageId]: band
    }));
  };

  /**
   * Handle showing tile metadata info
   */
  const handleShowInfo = (tileData) => {
    setSelectedTileInfo(tileData);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <h1>Satellite Data Viewer</h1>
        <p>Explore Sentinel-2 satellite imagery from Microsoft Planetary Computer</p>
      </header>

      {/* Main Content */}
      <div className="app-content">
        {/* Left Sidebar */}
        <aside className="app-sidebar">
          <SearchBar 
            onSearch={handleSearch}
            isLoading={isLoading}
            elevationRange={elevationRange}
            onElevationRangeChange={setElevationRange}
            thermalRange={thermalRange}
            onThermalRangeChange={setThermalRange}
            selectedBands={selectedBands}
          />
          
          <div className="sidebar-spacer" />
          
          <ImageList
            items={searchResults}
            onToggleImage={handleToggleImage}
            onClearSelections={handleClearSelections}
            onZoomToImage={zoomToImageFn}
            selectedImages={selectedImages}
            isLoading={isLoading}            currentCollection={currentCollection}
            selectedBands={selectedBands}
            onBandChange={handleBandChange}            onShowInfo={handleShowInfo}          />
        </aside>

        {/* Map Area */}
        <main className="app-main">
          <Map 
            selectedImages={selectedImages}
            searchResults={searchResults}
            onBboxChange={handleBboxChange}
            onZoomToImage={handleZoomToImage}            currentCollection={currentCollection}
            selectedBands={selectedBands}            elevationRange={elevationRange}            thermalRange={thermalRange}
            selectedTileInfo={selectedTileInfo}
            onCloseTileInfo={() => setSelectedTileInfo(null)}          />
        </main>
      </div>

      {/* Error Display */}
      {error && (
        <div className="app-error">
          {error}
        </div>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <p>
          Data: <a href="https://planetarycomputer.microsoft.com/" target="_blank" rel="noopener noreferrer">
            Microsoft Planetary Computer
          </a> | 
          Maps: <a href="https://leafletjs.com/" target="_blank" rel="noopener noreferrer">
            Leaflet
          </a> | 
          Developed by: <a href="https://github.com/Kongstad" target="_blank" rel="noopener noreferrer">
            Peter Kongstad
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;

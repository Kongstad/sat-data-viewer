/**
 * Root application component
 * Manages global state and coordinates child components
 */

import { useState, useCallback, useRef } from 'react';
import Map from './components/MapLeaflet';
import SearchBar from './components/SearchBar';
import ImageList from './components/ImageList';
import { searchSatelliteData, formatStacItem } from './utils/stacApi';
import './App.css';

function App() {
  const [searchResults, setSearchResults] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentBbox, setCurrentBbox] = useState(null);
  const [error, setError] = useState(null);
  const zoomToImageRef = useRef(null);
  const [currentCollection, setCurrentCollection] = useState('sentinel-2-l2a');
  const [selectedBands, setSelectedBands] = useState({});
  const [elevationRange, setElevationRange] = useState({ min: -10, max: 150 });
  const [thermalRange, setThermalRange] = useState({ min: 28000, max: 55000 });
  const [selectedTileInfo, setSelectedTileInfo] = useState(null);

  const handleSearch = async (searchParams) => {
    let searchBbox = currentBbox;
    if (!searchBbox && zoomToImageRef.current) {
      const center = zoomToImageRef.current.getCenter ? zoomToImageRef.current.getCenter() : null;
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
      const results = await searchSatelliteData(
        searchBbox,
        searchParams.startDate,
        searchParams.endDate,
        searchParams.collection,
        searchParams.cloudCover
      );

      const formattedResults = results.features
        .map(item => formatStacItem(item, searchParams.collection));
      
      setSearchResults(formattedResults);
      setSelectedImages([]);
      setCurrentCollection(searchParams.collection);
      setSelectedBands({});
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

  const handleToggleImage = (image) => {
    setSelectedImages(prev => {
      if (prev.includes(image.id)) {
        return prev.filter(id => id !== image.id);
      } else {
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

  const handleZoomToImage = useCallback((zoomFn) => {
    zoomToImageRef.current = zoomFn;
  }, []);

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
            onZoomToImage={zoomToImageRef}
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

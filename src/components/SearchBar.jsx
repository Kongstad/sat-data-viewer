/**
 * Search form component for STAC queries
 */

import { useState } from 'react';
import './SearchBar.css';
import { getCollection, getAllCollectionIds } from '../config/collections';

function SearchBar({ onSearch, isLoading, elevationRange, onElevationRangeChange, thermalRange, onThermalRangeChange, selectedBands = {} }) {
  const [startDate, setStartDate] = useState('2024-06-01');
  const [endDate, setEndDate] = useState('2024-07-31');
  const [cloudCover, setCloudCover] = useState(20);
  const [satellite, setSatellite] = useState('sentinel-2-l2a');

  const collectionConfig = getCollection(satellite);

  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    
    const startDateObj = new Date(newStartDate);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(endDateObj.getDate() + 7);
    
    const formattedEndDate = endDateObj.toISOString().split('T')[0];
    setEndDate(formattedEndDate);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    onSearch({
      startDate,
      endDate,
      cloudCover,
      collection: satellite
    });
  };

  return (
    <div className="search-bar">
      <h2>Search Satellite Data</h2>
      <form onSubmit={handleSubmit}>
        {/* Satellite Collection Selector */}
        <div className="form-group">
          <label htmlFor="satellite">Satellite Collection:</label>
          <select
            id="satellite"
            value={satellite}
            onChange={(e) => setSatellite(e.target.value)}
            disabled={isLoading}
          >
            {getAllCollectionIds().map(collectionId => {
              const collection = getCollection(collectionId);
              return (
                <option key={collectionId} value={collectionId}>
                  {collection.displayName || collection.name}
                </option>
              );
            })}
          </select>
        </div>

        {/* Date Range Inputs */}
        {collectionConfig?.hasDateFilter && (
          <>
            <div className="form-group">
              <label htmlFor="start-date">Start Date:</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="end-date">End Date:</label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </>
        )}

        {/* Cloud Coverage Slider */}
        {collectionConfig?.hasCloudFilter && (
          <div className="form-group">
            <label htmlFor="cloud-cover">
              Max Cloud Cover: {cloudCover}%
            </label>
            <input
              id="cloud-cover"
              type="range"
              min="0"
              max="100"
              value={cloudCover}
              onChange={(e) => setCloudCover(Number(e.target.value))}
              disabled={isLoading}
            />
          </div>
        )}

        {/* Elevation Range Sliders - Only for DEM */}
        {satellite === 'cop-dem-glo-30' && elevationRange && onElevationRangeChange && (
          <>
            <div className="form-group">
              <label htmlFor="elev-min">
                Min Elevation: {elevationRange.min}m
              </label>
              <input
                id="elev-min"
                type="range"
                min="-100"
                max="500"
                step="10"
                value={elevationRange.min}
                onChange={(e) => {
                  const newMin = Number(e.target.value);
                  if (newMin > elevationRange.max) {
                    onElevationRangeChange({ min: newMin, max: newMin });
                  } else {
                    onElevationRangeChange({ ...elevationRange, min: newMin });
                  }
                }}
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="elev-max">
                Max Elevation: {elevationRange.max}m
              </label>
              <input
                id="elev-max"
                type="range"
                min="0"
                max="5000"
                step="50"
                value={elevationRange.max}
                onChange={(e) => {
                  const newMax = Number(e.target.value);
                  if (newMax < elevationRange.min) {
                    onElevationRangeChange({ min: newMax, max: newMax });
                  } else {
                    onElevationRangeChange({ ...elevationRange, max: newMax });
                  }
                }}
                disabled={isLoading}
              />
            </div>
          </>
        )}

        {/* Thermal Range Sliders - Only for Landsat when thermal band is selected */}
        {satellite === 'landsat-c2-l2' && thermalRange && onThermalRangeChange && Object.values(selectedBands).includes('thermal') && (
          <>
            <div className="form-group">
              <label htmlFor="thermal-min">
                Min Thermal: {thermalRange.min}
              </label>
              <input
                id="thermal-min"
                type="range"
                min="20000"
                max="60000"
                step="500"
                value={thermalRange.min}
                onChange={(e) => {
                  const newMin = Number(e.target.value);
                  if (newMin > thermalRange.max) {
                    onThermalRangeChange({ min: newMin, max: newMin });
                  } else {
                    onThermalRangeChange({ ...thermalRange, min: newMin });
                  }
                }}
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="thermal-max">
                Max Thermal: {thermalRange.max}
              </label>
              <input
                id="thermal-max"
                type="range"
                min="20000"
                max="60000"
                step="500"
                value={thermalRange.max}
                onChange={(e) => {
                  const newMax = Number(e.target.value);
                  if (newMax < thermalRange.min) {
                    onThermalRangeChange({ min: newMax, max: newMax });
                  } else {
                    onThermalRangeChange({ ...thermalRange, max: newMax });
                  }
                }}
                disabled={isLoading}
              />
            </div>
          </>
        )}

        {/* Submit Button */}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div className="search-info">
        <p>
          Click "Set Search Point" on the map to define your search area.
        </p>
      </div>
    </div>
  );
}

export default SearchBar;

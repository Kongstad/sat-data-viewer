/**
 * SearchBar Component
 * 
 * Learning: This is a React "functional component"
 * - It's a JavaScript function that returns JSX (HTML-like syntax)
 * - Props (properties) are parameters passed from parent components
 * - State is data that can change over time
 */

import { useState } from 'react';
import './SearchBar.css';

/**
 * SearchBar Component
 * Allows users to input search criteria for satellite imagery
 * 
 * @param {Function} onSearch - Callback function when user submits search
 * @param {boolean} isLoading - Whether a search is currently in progress
 * @param {Object} elevationRange - Min/max elevation for DEM visualization
 * @param {Function} onElevationRangeChange - Callback when elevation range changes
 */
function SearchBar({ onSearch, isLoading, elevationRange, onElevationRangeChange }) {
  // React Hook: useState manages component state
  // Similar to: self.start_date = '2024-01-01' in Python class
  // But useState causes re-render when value changes
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [cloudCover, setCloudCover] = useState(20);
  const [satellite, setSatellite] = useState('sentinel-2-l2a'); // Default to Sentinel-2

  /**
   * Handle start date change
   * Automatically sets end date to 7 days after start date
   */
  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    
    // Calculate 7 days after start date
    const startDateObj = new Date(newStartDate);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(endDateObj.getDate() + 7);
    
    // Format as YYYY-MM-DD for date input
    const formattedEndDate = endDateObj.toISOString().split('T')[0];
    setEndDate(formattedEndDate);
  };

  /**
   * Handle form submission
   * Learning: In React, we prevent default form behavior and handle it ourselves
   */
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent page reload (default form behavior)
    
    // Call the parent's onSearch function with current values
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
            <option value="sentinel-2-l2a">Sentinel-2 (Optical)</option>
            <option value="sentinel-1-rtc">Sentinel-1 RTC (SAR)</option>
            <option value="cop-dem-glo-30">Copernicus DEM (Elevation)</option>
          </select>
        </div>

        {/* Date Range Inputs - Only for time-series data (not DEM) */}
        {satellite !== 'cop-dem-glo-30' && (
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

        {/* Cloud Coverage Slider - Only for Sentinel-2 */}
        {satellite === 'sentinel-2-l2a' && (
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
                onChange={(e) => onElevationRangeChange({ ...elevationRange, min: Number(e.target.value) })}
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
                onChange={(e) => onElevationRangeChange({ ...elevationRange, max: Number(e.target.value) })}
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

      {/* Info Box */}
      <div className="search-info">
        <p>
          <strong>Tip:</strong> Pan and zoom the map to select your area of interest,
          then click Search to find satellite imagery.
        </p>
      </div>
    </div>
  );
}

export default SearchBar;

/**
 * ImageList Component
 * 
 * Displays search results from STAC API as a scrollable list
 * Each item shows a thumbnail, date, and cloud coverage
 * 
 * Learning: This component demonstrates:
 * - Rendering lists in React (map function)
 * - Conditional rendering (showing different UI based on state)
 * - Event handling (onClick)
 */

import './ImageList.css';
import { getSignedUrl } from '../utils/stacApi';

/**
 * ImageList Component
 * 
 * @param {Array} items - Array of formatted STAC items from search results
 * @param {Function} onToggleImage - Callback when user toggles checkbox
 * @param {Function} onClearSelections - Callback to clear all selections
 * @param {Function} onZoomToImage - Callback to zoom map to specific image
 * @param {Array} selectedImages - Array of currently selected image IDs
 * @param {boolean} isLoading - Whether search is in progress
 * @param {string} currentCollection - Current satellite collection
 * @param {Object} selectedBands - Map of imageId to selected band
 * @param {Function} onBandChange - Callback when user changes band
 */
function ImageList({ items, onToggleImage, onClearSelections, onZoomToImage, selectedImages = [], isLoading, currentCollection, selectedBands = {}, onBandChange }) {
  
  // Loading state
  if (isLoading) {
    return (
      <div className="image-list">
        <div className="loading">Searching for satellite imagery...</div>
      </div>
    );
  }

  // No search performed yet
  if (items === null) {
    return (
      <div className="image-list">
        <div className="empty-state">
          <p><strong>Ready to search!</strong></p>
          <p>Adjust the date range and cloud cover above, then click Search to find satellite imagery.</p>
        </div>
      </div>
    );
  }

  // Empty state - search returned no results
  if (items.length === 0) {
    return (
      <div className="image-list">
        <div className="empty-state">
          <p>No imagery found. Try adjusting your search criteria:</p>
          <ul>
            <li>Expand the date range</li>
            <li>Increase maximum cloud cover</li>
            <li>Pan to a different area</li>
          </ul>
        </div>
      </div>
    );
  }

  // Results state - display the list
  return (
    <div className="image-list">
      <div className="list-header">
        <h3>Found {items.length} images</h3>
        {selectedImages.length > 0 && (
          <button className="clear-button" onClick={onClearSelections}>
            Clear All ({selectedImages.length})
          </button>
        )}
      </div>
      <p className="list-note">Tip: Images with empty previews will be automatically hidden from the map if they contain no data.</p>
      <div className="image-list-scroll">
        {/* 
          React List Rendering:
          - map() transforms each item into JSX
          - key prop helps React track which items changed
          - Similar to: [render_item(item) for item in items] in Python
        */}
        {items.map((item) => {
          const isSelected = selectedImages.includes(item.id);
          return (
            <div
              key={item.id}
              className={`image-item ${isSelected ? 'selected' : ''}`}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                className="image-checkbox"
                checked={isSelected}
                onChange={() => onToggleImage(item)}
              />

              {/* Thumbnail */}
              {item.collection === 'cop-dem-glo-30' ? (
                <div className="elevation-thumbnail">
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="80" height="80" fill="#f5f5f5"/>
                    <path d="M10 60 L25 35 L40 45 L55 25 L70 40 L70 60 Z" fill="#8B7355" opacity="0.8"/>
                    <path d="M10 60 L25 35 L40 45 L55 25 L70 40" stroke="#6B5345" strokeWidth="2" fill="none"/>
                    <circle cx="55" cy="25" r="2" fill="#fff"/>
                  </svg>
                </div>
              ) : item.thumbnail ? (
                <img 
                  src={item.thumbnail} 
                  alt={`Satellite imagery from ${item.date}`}
                  loading="lazy"
                />
              ) : (
                <div className="no-thumbnail">No preview</div>
              )}

              {/* Metadata */}
              <div className="image-info">
                <div className="image-date">
                  {item.collection === 'cop-dem-glo-30' ? 'Elevation Data' : item.date}
                </div>
                {item.collection !== 'cop-dem-glo-30' && (
                  <>
                    <div className="image-cloud">
                      Cloud: {item.cloudCover}%
                    </div>
                    <div className="image-tile" title={item.id}>
                      Tile: {item.id.split('_').slice(-2, -1)[0] || item.id.substring(0, 10)}
                    </div>
                  </>
                )}
                
                {/* Band selector for Sentinel-1 */}
                {item.collection === 'sentinel-1-rtc' && (
                  <div className="band-selector">
                    <button
                      className={`band-button ${(!selectedBands[item.id] || selectedBands[item.id] === 'vv') ? 'active' : ''}`}
                      onClick={() => onBandChange(item.id, 'vv')}
                    >
                      Show VV
                    </button>
                    <button
                      className={`band-button ${selectedBands[item.id] === 'vh' ? 'active' : ''}`}
                      onClick={() => onBandChange(item.id, 'vh')}
                    >
                      Show VH
                    </button>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="image-actions">
                {/* Zoom to tile button */}
                {onZoomToImage && (
                  <button 
                    className="zoom-button"
                    onClick={() => onZoomToImage(item.id)}
                    title="Focus on this tile"
                    aria-label="Focus on tile"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4L8 8M16 4L12 8M4 16L8 12M16 16L12 12" stroke="#1976D2" strokeWidth="2" strokeLinecap="round"/>
                      <rect x="7" y="7" width="6" height="6" stroke="#1976D2" strokeWidth="2" rx="1"/>
                    </svg>
                  </button>
                )}
                {/* Download GeoTIFF button */}
                <button 
                  className="download-button"
                  disabled
                  onClick={() => {
                    alert('Download feature coming soon!\n\nWill be implemented with serverless backend (AWS Lambda) to handle authentication and file delivery.');
                  }}
                  title="Download feature planned - requires serverless backend"
                  aria-label="Download (coming soon)"
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 3V13M10 13L6 9M10 13L14 9" stroke="#1976D2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 17H17" stroke="#1976D2" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ImageList;

/**
 * Image results list component with band selectors and metadata
 */

import './ImageList.css';
import { getSignedUrl } from '../utils/stacApi';
import { getCollection, getBandConfig } from '../config/collections';

function ImageList({ items, onToggleImage, onClearSelections, onZoomToImage, selectedImages = [], isLoading, currentCollection, selectedBands = {}, onBandChange, onShowInfo }) {
  
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
      <div className="image-list-scroll">
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
                {(() => {
                  const config = getCollection(item.collection);
                  if (!config) return null;
                  
                  return (
                    <>
                      {config.metadata.showCloudCover && item.cloudCover !== undefined && (
                        <div className="image-cloud">
                          Cloud: {item.cloudCover}%
                        </div>
                      )}
                      {config.metadata.showTileId && (
                        <div className="image-tile" title={item.id}>
                          Tile: {item.id.split('_').slice(-2, -1)[0] || item.id.substring(0, 10)}
                        </div>
                      )}
                    </>
                  );
                })()}
                
                {/* Band selector */}
                {(() => {
                  const config = getCollection(item.collection);
                  if (!config || !config.bandLayout || config.bandLayout === 'none') return null;
                  
                  const bands = Object.keys(config.bands);
                  const defaultBand = config.defaultBand;
                  const layoutClass = config.bandLayout === 'grid' ? 'band-selector-grid' : 'band-selector';
                  
                  return (
                    <div className={layoutClass}>
                      {bands.map(bandId => {
                        const bandConfig = config.bands[bandId];
                        return (
                          <button
                            key={bandId}
                            className={`band-button ${(!selectedBands[item.id] || selectedBands[item.id] === defaultBand) && bandId === defaultBand ? 'active' : selectedBands[item.id] === bandId ? 'active' : ''}`}
                            onClick={() => onBandChange(item.id, bandId)}
                          >
                            {bandConfig.label}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <div className="image-actions">
                {onZoomToImage && onZoomToImage.current && (
                  <button 
                    className="zoom-button"
                    onClick={() => onZoomToImage.current(item.id)}
                    title="Focus on this tile"
                    aria-label="Focus on tile"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4L8 8M16 4L12 8M4 16L8 12M16 16L12 12" stroke="#1976D2" strokeWidth="2" strokeLinecap="round"/>
                      <rect x="7" y="7" width="6" height="6" stroke="#1976D2" strokeWidth="2" rx="1"/>
                    </svg>
                  </button>
                )}
                
                {/* Info button */}
                {onShowInfo && (
                  <button 
                    className="info-button"
                    onClick={() => onShowInfo(item)}
                    title="Show tile metadata"
                    aria-label="Show metadata"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="10" cy="10" r="7" stroke="#1976D2" strokeWidth="2"/>
                      <path d="M10 9V14" stroke="#1976D2" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="10" cy="6.5" r="0.5" fill="#1976D2" stroke="#1976D2" strokeWidth="1"/>
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

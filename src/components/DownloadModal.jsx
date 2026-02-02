/**
 * Download Modal Component
 * Displays in the center of the map with band/format selection options
 */

import { useState, useEffect } from 'react';
import { downloadTile, triggerDownload, checkBackendHealth } from '../utils/downloadApi';
import { getCollection } from '../config/collections';
import './DownloadModal.css';

function DownloadModal({ item, collection, onClose }) {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('geotiff');
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [backendAvailable, setBackendAvailable] = useState(null);
  const [abortController, setAbortController] = useState(null);

  // Get collection config for available bands
  const collectionConfig = getCollection(collection);
  const availableBands = collectionConfig ? Object.keys(collectionConfig.bands) : [];
  
  // Check if PNG format is supported for this collection (disable for SAR)
  const supportsPNG = collectionConfig?.type !== 'sar';
  
  // Check if downloads are disabled for this collection (SAR files too large)
  const downloadsDisabled = collectionConfig?.type === 'sar';

  // Check backend availability on mount
  useEffect(() => {
    checkBackendHealth().then(setBackendAvailable);
  }, []);

  // Set default selected asset
  useEffect(() => {
    if (availableBands.length > 0 && !selectedAsset) {
      setSelectedAsset(collectionConfig?.defaultBand || availableBands[0]);
    }
  }, [availableBands, selectedAsset, collectionConfig]);

  const handleDownload = async () => {
    if (!selectedAsset || isDownloading) {
      if (!selectedAsset) setError('Please select a band to download');
      return;
    }

    setIsDownloading(true);
    setError(null);

    // Create abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Get the actual asset key from band config
      const bandConfig = collectionConfig.bands[selectedAsset];
      const assetKey = bandConfig.assets[0]; // Use first asset for the band

      const filename = `${collection}_${item.id}_${assetKey}.${selectedFormat === 'geotiff' ? 'tif' : 'png'}`;

      // Direct download (sync endpoint)
      const { blob } = await downloadTile({
        collection: collection,
        itemId: item.id,
        assetKey: assetKey,
        bbox: null, // Full tile download
        format: selectedFormat,
        rescale: bandConfig.rescale || null,
        colormap: bandConfig.colormap || null,
      }, filename, controller.signal);

      // Trigger download and close
      triggerDownload(blob, filename);
      setIsDownloading(false);
      setAbortController(null);
      onClose();
    } catch (err) {
      // Don't show error if request was aborted
      if (err.name !== 'AbortError') {
        console.error('Download error:', err);
        setError(err.message || 'Download failed. Please try again.');
      }
      setIsDownloading(false);
      setAbortController(null);
    }
  };

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsDownloading(false);
    setError(null);
    onClose();
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (isDownloading) {
          handleCancel();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, isDownloading]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  return (
    <div className="download-modal-overlay" onClick={isDownloading ? undefined : onClose}>
      <div className="download-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="download-modal-header">
          <h2>Download Tile</h2>
          <button 
            className="close-button" 
            onClick={isDownloading ? handleCancel : onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="download-modal-content">
          {/* SAR download disabled warning */}
          {downloadsDisabled && (
            <div className="backend-warning">
              Downloads are disabled for Sentinel-1 SAR data. File sizes are too large (1.2 GB per band).
            </div>
          )}

          {/* Tile info */}
          <div className="download-info">
            <div className="info-row">
              <span className="info-label">Collection:</span>
              <span className="info-value">{collectionConfig?.displayName || collection}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Date:</span>
              <span className="info-value">{item.date || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Item ID:</span>
              <span className="info-value info-id" title={item.id}>
                {item.id}
              </span>
            </div>
          </div>

          {/* Backend status warning */}
          {backendAvailable === false && (
            <div className="backend-warning">
              Download backend is not available. Please try again later.
            </div>
          )}

          {/* Band selection */}
          <div className="download-section">
            <h3>Select Band</h3>
            <div className="band-options">
              {availableBands.map((bandId) => {
                const bandConfig = collectionConfig.bands[bandId];
                return (
                  <button
                    key={bandId}
                    className={`band-option ${selectedAsset === bandId ? 'selected' : ''}`}
                    onClick={() => setSelectedAsset(bandId)}
                    disabled={isDownloading}
                  >
                    {bandConfig.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Format selection */}
          <div className="download-section">
            <h3>Select Format</h3>
            {!supportsPNG && (
              <div className="format-note">
                PNG conversion is disabled for SAR data (slow processing)
              </div>
            )}
            <div className="format-options">
              <button
                className={`format-option ${selectedFormat === 'geotiff' ? 'selected' : ''}`}
                onClick={() => setSelectedFormat('geotiff')}
                disabled={isDownloading}
              >
                <span className="format-name">GeoTIFF</span>
                <span className="format-desc">With georeferencing</span>
              </button>
              {supportsPNG && (
                <button
                  className={`format-option ${selectedFormat === 'png' ? 'selected' : ''}`}
                  onClick={() => setSelectedFormat('png')}
                  disabled={isDownloading}
                >
                  <span className="format-name">PNG</span>
                  <span className="format-desc">Smaller, no geo data</span>
                </button>
              )}
            </div>
          </div>

          {/* Processing message */}
          {isDownloading && (
            <div className="download-processing">
              <div className="processing-message">
                Processing download... this can take up to 3 minutes.
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="download-error">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="download-modal-footer">
          <button 
            className="cancel-button" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="download-button-primary"
            onClick={handleDownload}
            disabled={isDownloading || backendAvailable === false || !selectedAsset || downloadsDisabled}
          >
            {isDownloading ? (
              <>
                <span className="spinner"></span>
                Processing...
              </>
            ) : (
              'Download'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DownloadModal;

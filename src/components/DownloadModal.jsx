/**
 * Download Modal Component
 * Displays in the center of the map with band/format selection options
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { downloadTile, downloadFromUrl, checkBackendHealth } from '../utils/downloadApi';
import { getCollection } from '../config/collections';
import './DownloadModal.css';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAACW5aVJzaeavtikq';

function DownloadModal({ item, collection, onClose }) {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [backendAvailable, setBackendAvailable] = useState(null);
  const [abortController, setAbortController] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState(null);
  const turnstileRef = useRef(null);
  const turnstileWidgetId = useRef(null);

  // Load Turnstile script and render widget
  useEffect(() => {
    // Load Turnstile script if not already loaded
    if (!window.turnstile) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => renderTurnstile();
      document.head.appendChild(script);
    } else {
      renderTurnstile();
    }

    return () => {
      // Cleanup widget on unmount
      if (turnstileWidgetId.current && window.turnstile) {
        window.turnstile.remove(turnstileWidgetId.current);
      }
    };
  }, []);

  const renderTurnstile = useCallback(() => {
    if (turnstileRef.current && window.turnstile && !turnstileWidgetId.current) {
      turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token) => setTurnstileToken(token),
        'expired-callback': () => setTurnstileToken(null),
        'error-callback': () => setTurnstileToken(null),
        theme: 'light',
        size: 'normal',
      });
    }
  }, []);

  // Get collection config for available bands
  const collectionConfig = getCollection(collection);
  const availableBands = collectionConfig ? Object.keys(collectionConfig.bands) : [];
  
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

    if (!turnstileToken) {
      setError('Please complete the security check');
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

      const filename = `${collection}_${item.id}_${assetKey}.tif`;

      // Get presigned URL from backend
      const response = await downloadTile({
        collection: collection,
        itemId: item.id,
        assetKey: assetKey,
        bbox: null, // Full tile download
        turnstileToken: turnstileToken,
      }, filename, controller.signal);

      // Redirect to presigned URL for download
      downloadFromUrl(response.download_url, response.filename);
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
      // Reset turnstile for retry
      setTurnstileToken(null);
      if (turnstileWidgetId.current && window.turnstile) {
        window.turnstile.reset(turnstileWidgetId.current);
      }
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
              Downloads are currently disabled for Sentinel-1 SAR data due to file size constraints in this demo environment.
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
              <strong>Download Service Unavailable</strong>
              <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
                The download backend is currently offline. You can still explore satellite imagery through the map viewer.
                This may be due to maintenance or budget limits.
              </p>
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

          {/* Format info */}
          <div className="download-section">
            <div className="format-note">
              Downloads are provided as GeoTIFF format with full georeferencing.
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

          {/* Turnstile widget */}
          <div className="download-section turnstile-section">
            <div ref={turnstileRef}></div>
            {!turnstileToken && !isDownloading && (
              <div className="turnstile-hint">Please complete the security check above</div>
            )}
          </div>

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
            disabled={isDownloading || backendAvailable === false || !selectedAsset || downloadsDisabled || !turnstileToken}
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

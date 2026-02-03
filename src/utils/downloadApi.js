/**
 * API utilities for communicating with the download backend
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/**
 * Get available assets for a collection from the backend
 * @param {string} collectionId - STAC collection ID
 * @returns {Promise<Object>} Collection assets info
 */
export async function getCollectionAssets(collectionId) {
  const response = await fetch(`${BACKEND_URL}/collections/${collectionId}/assets`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || 'Failed to get collection assets');
  }
  
  return response.json();
}

/**
 * Download a satellite tile
 * @param {Object} params - Download parameters
 * @param {string} params.collection - STAC collection ID
 * @param {string} params.itemId - STAC item ID
 * @param {string} params.assetKey - Asset/band to download
 * @param {Array<number>} [params.bbox] - Bounding box [minLon, minLat, maxLon, maxLat]
 * @param {string} params.turnstileToken - Cloudflare Turnstile token
 * @param {Function} [onProgress] - Progress callback
 * @param {AbortSignal} [signal] - AbortSignal for request cancellation
 * @returns {Promise<Object>} Object with download_url and filename
 */
export async function downloadTile({ collection, itemId, assetKey, bbox, turnstileToken }, onProgress, signal) {
  const response = await fetch(`${BACKEND_URL}/download`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      collection,
      item_id: itemId,
      asset_key: assetKey,
      bbox: bbox || null,
      turnstile_token: turnstileToken || null,
    }),
    signal: signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Download failed' }));
    throw new Error(error.detail || 'Download failed');
  }

  // Backend now returns JSON with presigned URL
  const data = await response.json();
  return data; // { download_url, filename, size_bytes, expires_in_seconds }
}

/**
 * Download file from presigned URL
 * @param {string} url - Presigned S3 URL
 * @param {string} filename - Filename for download
 */
export function downloadFromUrl(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
  }, 100);
}

/**
 * Trigger browser download of a blob
 * @param {Blob} blob - File blob
 * @param {string} filename - Filename for download
 */
export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  
  // Cleanup after a short delay
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Check if the backend is available
 * @returns {Promise<boolean>}
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

export { BACKEND_URL };

/**
 * STAC API Utility
 * 
 * This file handles all interactions with Microsoft Planetary Computer's STAC API
 * STAC = SpatioTemporal Asset Catalog (standard for geospatial data)
 * 
 * Learning: In React, we separate API logic from UI components for:
 * - Reusability (can use these functions in multiple components)
 * - Testability (easier to test)
 * - Maintainability (API changes stay in one place)
 */

import axios from 'axios';

// STAC API endpoints
const STAC_PROVIDERS = {
  microsoft: 'https://planetarycomputer.microsoft.com/api/stac/v1',
  element84: 'https://earth-search.aws.element84.com/v1'
};

// Current provider (can be switched)
const CURRENT_PROVIDER = 'microsoft';
const STAC_API_URL = STAC_PROVIDERS[CURRENT_PROVIDER];

/**
 * Search for satellite imagery from STAC API
 * 
 * @param {Array} bbox - Bounding box [minLon, minLat, maxLon, maxLat]
 * @param {string} startDate - Start date in 'YYYY-MM-DD' format
 * @param {string} endDate - End date in 'YYYY-MM-DD' format
 * @param {string} collection - Collection name (e.g., 'sentinel-2-l2a', 'sentinel-1-rtc')
 * @param {number} cloudCover - Maximum cloud coverage percentage (0-100) - only for optical
 * @param {number} limit - Maximum number of results to return
 * @returns {Promise} - Promise resolving to STAC search results
 */
export async function searchSatelliteData(bbox, startDate, endDate, collection = 'sentinel-2-l2a', cloudCover = 20, limit = 10) {
  try {
    const searchParams = {
      collections: [collection],
      bbox: bbox,
      limit: limit
    };

    // DEM data is timeless - don't include datetime for static datasets
    if (collection !== 'cop-dem-glo-30') {
      searchParams.datetime = `${startDate}/${endDate}`;
    }

    // Only add cloud cover filter for optical imagery (Sentinel-2)
    if (collection === 'sentinel-2-l2a') {
      searchParams.query = {
        'eo:cloud_cover': { lt: cloudCover }
      };
    }
    
    // POST request to STAC API
    const response = await axios.post(`${STAC_API_URL}/search`, searchParams);

    console.log(`Using ${CURRENT_PROVIDER} STAC API - Collection: ${collection} - Found ${response.data.features?.length || 0} results`);

    // Response is a GeoJSON FeatureCollection
    return response.data;
  } catch (error) {
    console.error('Error searching STAC API:', error);
    throw error;
  }
}

// Keep legacy function name for backwards compatibility
export async function searchSentinel2(bbox, startDate, endDate, cloudCover = 20, limit = 10) {
  return searchSatelliteData(bbox, startDate, endDate, 'sentinel-2-l2a', cloudCover, limit);
}

/**
 * Get a signed URL for accessing imagery
 * Microsoft requires signed URLs for actual data access
 * 
 * @param {string} assetUrl - The asset URL from a STAC item
 * @returns {Promise<string>} - Signed URL with SAS token
 */
export async function getSignedUrl(assetUrl) {
  try {
    // Microsoft provides an endpoint to sign URLs
    // URL needs to be passed as a query parameter
    const response = await axios.get(
      `https://planetarycomputer.microsoft.com/api/sas/v1/sign?url=${encodeURIComponent(assetUrl)}`
    );
    return response.data.href;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw error;
  }
}

/**
 * Extract thumbnail URL from a STAC item
 * Each STAC item contains multiple assets (bands, metadata, thumbnails)
 * 
 * Note: rendered_preview may return blank images for tiles without data coverage
 * in the search area. This is expected behavior from Microsoft Planetary Computer.
 * 
 * @param {Object} item - A STAC item from search results
 * @returns {string|null} - Thumbnail URL or null if not available
 */
export function getThumbnailUrl(item) {
  // STAC items have an 'assets' object containing different data products
  // Try rendered_preview which is the best option for full scene preview
  
  if (item.assets?.rendered_preview?.href) {
    return item.assets.rendered_preview.href;
  }
  
  if (item.assets?.thumbnail?.href) {
    return item.assets.thumbnail.href;
  }
  
  // Try visual band as fallback
  if (item.assets?.visual?.href) {
    return item.assets.visual.href;
  }
  
  // Log available assets for debugging
  if (item.assets) {
    console.log('No thumbnail found for item:', item.id, 'Available assets:', Object.keys(item.assets));
  }
  
  return null;
}

/**
 * Get file size from STAC asset
 * STAC spec supports multiple ways to specify file size
 * 
 * @param {Object} asset - A STAC asset object
 * @returns {number|null} - File size in bytes or null if not available
 */
export function getAssetSize(asset) {
  if (!asset) return null;
  
  // Try different possible property names for file size
  // STAC spec: 'file:size' or 'size' in bytes
  return asset['file:size'] || asset.size || null;
}

/**
 * Format a STAC item for display in the UI
 * Extracts the most relevant information for users
 * 
 * @param {Object} item - A STAC item from search results
 * @param {string} collection - Collection name (e.g., 'sentinel-2-l2a', 'sentinel-1-rtc')
 * @returns {Object} - Formatted object with key display properties
 */
export function formatStacItem(item, collection = 'sentinel-2-l2a') {
  // Format date in Danish format (DD/MM/YYYY)
  const date = new Date(item.properties.datetime);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const danishDate = `${day}/${month}/${year}`;
  
  return {
    id: item.id,
    date: danishDate,
    cloudCover: item.properties['eo:cloud_cover']?.toFixed(1) || 'N/A',
    thumbnail: getThumbnailUrl(item),
    geometry: item.geometry,
    assets: item.assets,
    bbox: item.bbox,
    collection: collection
  };
}

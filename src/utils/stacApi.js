/**
 * Microsoft Planetary Computer STAC API integration
 */

import axios from 'axios';
import { getCollection } from '../config/collections';

const STAC_API_URL = 'https://planetarycomputer.microsoft.com/api/stac/v1';

export function getProviderName() {
  return 'Microsoft Planetary Computer';
}

/**
 * Search for satellite data from STAC API
 * 
 * @param {Array} bbox - Bounding box [minLon, minLat, maxLon, maxLat]
 * @param {string} startDate - Start date YYYY-MM-DD
 * @param {string} endDate - End date YYYY-MM-DD
 * @param {string} collection - Collection ID (sentinel-2-l2a, landsat-c2-l2, etc.)
 * @param {number} cloudCover - Max cloud coverage % (optical collections only)
 * @param {number} limit - Max results
 * @returns {Promise} STAC FeatureCollection
 */
export async function searchSatelliteData(bbox, startDate, endDate, collection = 'sentinel-2-l2a', cloudCover = 20, limit = 10) {
  try {
    const config = getCollection(collection);
    
    const searchParams = {
      collections: [collection],
      bbox: bbox,
      limit: limit
    };

    if (config?.hasDateFilter) {
      searchParams.datetime = `${startDate}/${endDate}`;
    }

    if (config?.hasCloudFilter) {
      searchParams.query = {
        'eo:cloud_cover': { lt: cloudCover }
      };
    }
    
    const response = await axios.post(`${STAC_API_URL}/search`, searchParams);

    return response.data;
  } catch (error) {
    console.error('Error searching STAC API:', error);
    throw error;
  }
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
  // MODIS uses start_datetime, others use datetime
  const dateString = item.properties.datetime || item.properties.start_datetime;
  const date = new Date(dateString);
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
    collection: collection,
    properties: item.properties, // Store full properties for metadata display
    provider: getProviderName() // Add provider name
  };
}

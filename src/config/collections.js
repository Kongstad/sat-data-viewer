/**
 * Satellite collection configurations
 * Centralizes metadata, band definitions, and rendering parameters
 */

const COLLECTIONS = {
  'sentinel-2-l2a': {
    name: 'Sentinel-2 L2A',
    displayName: 'Sentinel-2 (Optical)',
    type: 'optical',
    hasCloudFilter: true,
    hasDateFilter: true,
    bands: {
      visual: {
        label: 'TCI',
        assets: ['visual'],
        rescale: null,
        colormap: null,
        legend: null
      },
      nir: {
        label: 'IR',
        assets: ['B08'],
        rescale: '0,4000',
        colormap: 'inferno',
        legend: {
          title: 'Near Infrared',
          min: '0',
          max: '4000',
          gradient: 'linear-gradient(to right, #000004, #420a68, #932667, #dd513a, #fca50a, #fcffa4)'
        }
      },
      swir: {
        label: 'SWIR',
        assets: ['B11'],
        rescale: '0,4000',
        colormap: 'blues',
        legend: {
          title: 'Short Wave Infrared',
          min: '0',
          max: '4000',
          gradient: 'linear-gradient(to right, #081d58, #253494, #225ea8, #1d91c0, #41b6c4, #7fcdbb, #c7e9b4, #edf8b1, #ffffd9)'
        }
      },
      rededge: {
        label: 'Red Edge',
        assets: ['B05'],
        rescale: '0,4000',
        colormap: 'rdylgn',
        legend: {
          title: 'Red Edge',
          min: '0',
          max: '4000',
          gradient: 'linear-gradient(to right, #a50026, #d73027, #f46d43, #fdae61, #fee08b, #ffffbf, #d9ef8b, #a6d96a, #66bd63, #1a9850, #006837)'
        }
      }
    },
    defaultBand: 'visual',
    bandLayout: 'grid',
    metadata: {
      showTileId: true,
      showCloudCover: true
    }
  },

  'landsat-c2-l2': {
    name: 'Landsat C2 L2',
    displayName: 'Landsat C2 L2 (Multispectral)',
    type: 'optical',
    hasCloudFilter: true,
    hasDateFilter: true,
    bands: {
      visual: {
        label: 'TCI',
        assets: ['red', 'green', 'blue'],
        rescale: ['7000,14000', '8000,13000', '8000,12000'],
        colormap: null,
        legend: null
      },
      nir: {
        label: 'NIR',
        assets: ['nir08'],
        rescale: '0,30000',
        colormap: 'inferno',
        legend: {
          title: 'Near Infrared',
          min: '0',
          max: '30000',
          gradient: 'linear-gradient(to right, #000004, #420a68, #932667, #dd513a, #fca50a, #fcffa4)'
        }
      },
      swir: {
        label: 'SWIR',
        assets: ['swir16'],
        rescale: '0,30000',
        colormap: 'blues',
        legend: {
          title: 'Short Wave Infrared',
          min: '0',
          max: '30000',
          gradient: 'linear-gradient(to right, #081d58, #253494, #225ea8, #1d91c0, #41b6c4, #7fcdbb, #c7e9b4, #edf8b1, #ffffd9)'
        }
      },
      thermal: {
        label: 'Thermal',
        assets: ['lwir11'],
        rescale: 'dynamic',
        colormap: 'turbo',
        legend: {
          title: 'Thermal',
          min: 'dynamic',
          max: 'dynamic',
          gradient: 'linear-gradient(to right, #23171b, #4e0d4e, #8c2981, #c84d6b, #f57e3e, #fbb43d, #e4e965)'
        }
      }
    },
    defaultBand: 'visual',
    bandLayout: 'grid',
    metadata: {
      showTileId: false,
      showCloudCover: true
    }
  },

  'sentinel-1-rtc': {
    name: 'Sentinel-1 RTC',
    displayName: 'Sentinel-1 RTC (SAR)',
    type: 'sar',
    hasCloudFilter: false,
    hasDateFilter: true,
    bands: {
      vv: {
        label: 'VV',
        assets: ['vv'],
        rescale: '0,0.3',
        colormap: 'viridis',
        legend: {
          title: 'SAR VV Polarization',
          min: '0',
          max: '0.3',
          gradient: 'linear-gradient(to right, #440154, #31688e, #35b779, #fde724)'
        }
      },
      vh: {
        label: 'VH',
        assets: ['vh'],
        rescale: '0,0.3',
        colormap: 'viridis',
        legend: {
          title: 'SAR VH Polarization',
          min: '0',
          max: '0.3',
          gradient: 'linear-gradient(to right, #440154, #31688e, #35b779, #fde724)'
        }
      }
    },
    defaultBand: 'vv',
    bandLayout: 'flex',
    metadata: {
      showTileId: false,
      showCloudCover: false
    }
  },

  'modis-13Q1-061': {
    name: 'MODIS 13Q1',    displayName: 'MODIS Vegetation Indices',    type: 'vegetation',
    hasCloudFilter: false,
    hasDateFilter: true,
    bands: {
      ndvi: {
        label: 'NDVI',
        assets: ['250m_16_days_NDVI'],
        rescale: '-2000,10000',
        colormap: 'rdylgn',
        legend: {
          title: 'NDVI',
          min: '-0.2',
          max: '1.0',
          gradient: 'linear-gradient(to right, #a50026, #d73027, #f46d43, #fdae61, #fee08b, #ffffbf, #d9ef8b, #a6d96a, #66bd63, #1a9850, #006837)'
        }
      },
      evi: {
        label: 'EVI',
        assets: ['250m_16_days_EVI'],
        rescale: '-2000,10000',
        colormap: 'rdylgn',
        legend: {
          title: 'EVI',
          min: '-0.2',
          max: '1.0',
          gradient: 'linear-gradient(to right, #a50026, #d73027, #f46d43, #fdae61, #fee08b, #ffffbf, #d9ef8b, #a6d96a, #66bd63, #1a9850, #006837)'
        }
      }
    },
    defaultBand: 'ndvi',
    bandLayout: 'flex',
    metadata: {
      showTileId: false,
      showCloudCover: false
    }
  },

  'cop-dem-glo-30': {
    name: 'Copernicus DEM',    displayName: 'Copernicus DEM (Elevation)',    type: 'elevation',
    hasCloudFilter: false,
    hasDateFilter: false,
    bands: {
      elevation: {
        label: 'Elevation',
        assets: ['data'],
        rescale: 'dynamic',
        colormap: 'gist_earth',
        legend: {
          title: 'Elevation',
          min: 'dynamic',
          max: 'dynamic',
          gradient: 'linear-gradient(to right, #0c1c5c, #1e4d8b, #2d7bb6, #3fa855, #7ac74f, #c4d968, #e8c167, #d89a5a, #c4734d, #ffffff)'
        }
      }
    },
    defaultBand: 'elevation',
    bandLayout: 'none',
    metadata: {
      showTileId: false,
      showCloudCover: false
    }
  }
};

/**
 * Build tile URL for a given collection, item, and band
 */
export function buildTileUrl(collection, itemId, band, options = {}) {
  const collectionConfig = COLLECTIONS[collection];
  if (!collectionConfig) return null;

  const bandConfig = collectionConfig.bands[band];
  if (!bandConfig) return null;

  const baseUrl = 'https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad/{z}/{x}/{y}@1x';
  const params = new URLSearchParams({
    collection,
    item: itemId
  });

  // Handle assets
  if (Array.isArray(bandConfig.assets)) {
    bandConfig.assets.forEach(asset => params.append('assets', asset));
  } else {
    params.append('assets', bandConfig.assets[0]);
  }

  // Handle rescale
  if (bandConfig.rescale === 'dynamic') {
    // Dynamic rescale (elevation or thermal)
    if (collection === 'cop-dem-glo-30' && options.elevationRange) {
      params.append('rescale', `${options.elevationRange.min},${options.elevationRange.max}`);
    } else if (collection === 'landsat-c2-l2' && band === 'thermal' && options.thermalRange) {
      params.append('rescale', `${options.thermalRange.min},${options.thermalRange.max}`);
    }
  } else if (Array.isArray(bandConfig.rescale)) {
    // Multiple rescale values (multi-asset like Landsat TCI)
    bandConfig.rescale.forEach(rescale => params.append('rescale', rescale));
  } else if (bandConfig.rescale) {
    // Single rescale value (skip if null)
    params.append('rescale', bandConfig.rescale);
  }

  // Handle colormap
  if (bandConfig.colormap) {
    params.append('colormap_name', bandConfig.colormap);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Get legend configuration for a collection and band
 */
export function getLegendConfig(collection, band, options = {}) {
  const collectionConfig = COLLECTIONS[collection];
  if (!collectionConfig) return null;

  const bandConfig = collectionConfig.bands[band];
  if (!bandConfig || !bandConfig.legend) return null;

  const legend = { ...bandConfig.legend };

  // Handle dynamic values
  if (legend.min === 'dynamic' && collection === 'cop-dem-glo-30' && options.elevationRange) {
    legend.min = `${options.elevationRange.min}m`;
    legend.max = `${options.elevationRange.max}m`;
  } else if (legend.min === 'dynamic' && collection === 'landsat-c2-l2' && band === 'thermal' && options.thermalRange) {
    legend.min = `${options.thermalRange.min}`;
    legend.max = `${options.thermalRange.max}`;
  }

  return legend;
}

/**
 * Get collection configuration
 */
export function getCollection(collectionId) {
  return COLLECTIONS[collectionId] || null;
}

/**
 * Get all collection IDs
 */
export function getAllCollectionIds() {
  return Object.keys(COLLECTIONS);
}

/**
 * Get band configuration for a specific collection and band
 */
export function getBandConfig(collectionId, bandId) {
  const collection = COLLECTIONS[collectionId];
  return collection?.bands[bandId] || null;
}

export default COLLECTIONS;

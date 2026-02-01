import { describe, it, expect } from 'vitest';
import {
  getCollection,
  getBandConfig,
  getAllCollectionIds,
} from '../config/collections';

describe('collections config', () => {
  it('has all expected collections', () => {
    const collections = getAllCollectionIds();
    expect(collections).toContain('sentinel-2-l2a');
    expect(collections).toContain('landsat-c2-l2');
    expect(collections).toContain('sentinel-1-rtc');
    expect(collections).toContain('cop-dem-glo-30');
    expect(collections).toContain('modis-13Q1-061');
  });

  it('getCollection returns valid config for Sentinel-2', () => {
    const config = getCollection('sentinel-2-l2a');
    expect(config).toBeDefined();
    expect(config.name).toBe('Sentinel-2 L2A');
    expect(config.type).toBe('optical');
    expect(config.hasCloudFilter).toBe(true);
    expect(config.hasDateFilter).toBe(true);
  });

  it('all collections have required properties', () => {
    const collections = getAllCollectionIds();
    collections.forEach((id) => {
      const config = getCollection(id);
      expect(config.name).toBeDefined();
      expect(config.displayName).toBeDefined();
      expect(config.type).toBeDefined();
      expect(config.defaultBand).toBeDefined();
      expect(config.bands).toBeDefined();
      expect(typeof config.hasCloudFilter).toBe('boolean');
      expect(typeof config.hasDateFilter).toBe('boolean');
    });
  });

  it('getBandConfig returns valid band config', () => {
    const band = getBandConfig('sentinel-2-l2a', 'visual');
    expect(band).toBeDefined();
    expect(band.label).toBe('TCI');
    expect(band.assets).toContain('visual');
  });

  it('sentinel-2 has all expected bands', () => {
    const config = getCollection('sentinel-2-l2a');
    expect(config.bands.visual).toBeDefined();
    expect(config.bands.nir).toBeDefined();
    expect(config.bands.swir).toBeDefined();
    expect(config.bands.rededge).toBeDefined();
  });

  it('optical collections have cloud filter enabled', () => {
    const sentinel2 = getCollection('sentinel-2-l2a');
    const landsat = getCollection('landsat-c2-l2');
    expect(sentinel2.hasCloudFilter).toBe(true);
    expect(landsat.hasCloudFilter).toBe(true);
  });

  it('elevation collection does not have cloud filter', () => {
    const dem = getCollection('cop-dem-glo-30');
    expect(dem.hasCloudFilter).toBe(false);
  });
});

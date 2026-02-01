# Satellite Data Viewer

Client-side web application for exploring satellite data collections from Microsoft Planetary Computer's STAC API. Supports optical imagery, SAR data, elevation models, and vegetation indices with interactive band selection and visualization controls.

**Live Demo:** [https://kongstad.github.io/sat-data-viewer](https://kongstad.github.io/sat-data-viewer)

## Features

### Multi-Collection Support
- **Sentinel-2 L2A** - Optical imagery with 4 band options (TCI, NIR, SWIR, Red Edge)
- **Landsat C2 L2** - Multispectral imagery with 4 bands (TCI, NIR, SWIR, Thermal)
- **Sentinel-1 RTC** - SAR radar imagery with VV/VH polarization selection
- **MODIS 13Q1** - Vegetation indices (NDVI/EVI) at 250m resolution
- **Copernicus DEM** - Global elevation data with adjustable range visualization

### Interactive Visualization
- **Band Selection** - Toggle between different spectral bands for each collection
- **Dynamic Legends** - Color ramps with actual data values for interpretation
- **Adjustable Ranges** - User-controlled sliders for elevation and thermal visualization
- **Measurement Tools** - Distance (km/miles) and area (km²/acres/hectares) measurements with geodesic accuracy
- **STAC Metadata** - View detailed tile information (platform, EPSG, dates, etc.)
- **Multiple Base Layers** - Switch between street, satellite, or no base map
- **Click-to-Search** - Place search area anywhere on the map
- **Boundary Toggle** - Show/hide image boundaries for cleaner viewing

### Data & Performance
- **Real-time Tile Rendering** - COG-based tiles streamed from Microsoft Planetary Computer
- **Cloud Filtering** - Filter optical imagery by cloud cover percentage
- **Multi-Select** - Display multiple tiles simultaneously for comparison
- **Client-Side Architecture** - No backend required
- **Config-Driven Design** - Centralized collection metadata for easy maintenance

## Tech Stack

- **Frontend:** React 19 with Hooks (useState, useEffect, useRef, useCallback)
- **Build Tool:** Vite 7.2.4
- **Mapping:** Leaflet with OpenStreetMap and Esri satellite base layers
- **Drawing:** Leaflet Draw for measurement tools
- **Geospatial:** Turf.js for geodesic distance and area calculations
- **Data Source:** Microsoft Planetary Computer STAC API v1
- **Tile Server:** Microsoft Planetary Computer TiTiler
- **HTTP Client:** Axios 1.13.4
- **Styling:** CSS3 with custom properties

## Installation

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
git clone https://github.com/kongstad/sat-data-viewer.git
cd sat-data-viewer
npm install
npm run dev
```

## Usage

1. **Select a collection** - Choose from Sentinel-2, Landsat, Sentinel-1 SAR, MODIS, or DEM
2. **Click "Set Search Point"** and click anywhere on the map to define your search area (20km × 20km)
3. **Set search parameters:**
   - Start and end dates (for temporal collections)
   - Maximum cloud coverage (for optical imagery)
   - Elevation range (for DEM visualization)
   - Thermal range (for Landsat thermal band)
4. **Click "Search"** to find satellite data
5. **Browse results** in the left sidebar with thumbnails and metadata
6. **Select images** using checkboxes to display on the map
7. **Toggle bands** using the band selector buttons (TCI, NIR, SWIR, etc.)
8. **View metadata** by clicking the info button (ⓘ) on any tile
9. **Zoom to tile** using the focus button for detailed viewing
10. **Adjust visualization** using range sliders for elevation/thermal data
11. **Measure distances and areas** using the tools at top-left (ESC to cancel)
12. **Toggle boundaries** to hide/show image borders for cleaner viewing

## Project Structure

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed project structure and component documentation.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed system design, data flow, and component interactions.

### Component Hierarchy

```
App (state management)
├── SearchBar (collection selector, date range, filters, sliders)
├── ImageList (results with band selectors, metadata, action buttons)
└── MapLeaflet (Leaflet map with COG tile overlays, legends, measurements)
```

### Data Flow

1. User clicks "Set Search Point" → Map places blue rectangle
2. User selects collection and parameters → SearchBar controls
3. User submits search → App queries STAC API with collection filter
4. Results returned → App formats items and updates ImageList
5. User selects images and bands → App passes to MapLeaflet
6. Map renders COG tiles → TiTiler serves tiles with band/colormap parameters
7. User adjusts ranges → Map re-renders with new rescale values
8. User clicks info button → Map displays STAC metadata overlay

### STAC API Integration

The app queries different collections based on user selection. Example for Sentinel-2:

```javascript
POST https://planetarycomputer.microsoft.com/api/stac/v1/search
{
  "collections": ["sentinel-2-l2a"],
  "bbox": [minLon, minLat, maxLon, maxLat],
  "datetime": "2024-01-01/2024-12-31",
  "query": { "eo:cloud_cover": { "lt": 20 } },
  "limit": 10
}
```

Collection values: `sentinel-2-l2a`, `landsat-c2-l2`, `sentinel-1-rtc`, `modis-13Q1-061`, `cop-dem-glo-30`

Response is a GeoJSON FeatureCollection with STAC items.

### Tile Rendering

```
https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/
  WebMercatorQuad/{z}/{x}/{y}@1x?
  collection={collection}&
  item={item_id}&
  assets={band}&
  rescale={min},{max}&
  colormap_name={colormap}
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE.md](LICENSE.md) for details.

## Acknowledgments

- Microsoft Planetary Computer for STAC API and TiTiler
- Leaflet and OpenStreetMap contributors
- Esri for satellite base layer

# Satellite Data Viewer

A free, client-side web application for exploring multiple satellite data collections from Microsoft Planetary Computer's STAC API. View optical imagery, SAR data, elevation models, and vegetation indices with interactive band selection and visualization controls. Built with React, Leaflet, and Vite.

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
- **STAC Metadata** - View detailed tile information (platform, EPSG, dates, etc.)
- **Multiple Base Layers** - Switch between street, satellite, or no base map
- **Click-to-Search** - Place search area anywhere on the map

### Data & Performance
- **Real-time Tile Rendering** - COG-based tiles streamed from Microsoft Planetary Computer
- **Cloud Filtering** - Filter optical imagery by cloud cover percentage
- **Multi-Select** - Display multiple tiles simultaneously for comparison
- **100% Client-Side** - No backend required, zero hosting costs

## Tech Stack

- **Frontend:** React 19 with Hooks (useState, useEffect, useRef, useCallback)
- **Build Tool:** Vite 7.2.4 (modern, fast development)
- **Mapping:** Leaflet with OpenStreetMap and Esri satellite base layers
- **Data Source:** Microsoft Planetary Computer STAC API v1 (free, public)
- **Tile Server:** Microsoft Planetary Computer TiTiler (COG rendering)
- **HTTP Client:** Axios 1.13.4
- **Hosting:** GitHub Pages
- **Styling:** Vanilla CSS with gradient backgrounds and Earth from Space theme

## Installation

### Prerequisites

- Node.js 18+ and npm
- No API keys required - uses free, open tile servers

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/kongstad/sat-data-viewer.git
   cd sat-data-viewer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:5173](http://localhost:5173) in your browser.

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

## Project Structure

```
sat-data-viewer/
├── src/
│   ├── components/
│   │   ├── MapLeaflet.jsx       # Leaflet map with tile overlays
│   │   ├── Map.css              # Map styling and legends
│   │   ├── SearchBar.jsx        # Search form with collection selector
│   │   ├── SearchBar.css        # Search bar styling
│   │   ├── ImageList.jsx        # Results list with band selectors
│   │   └── ImageList.css        # Image list and band button styling
│   ├── utils/
│   │   └── stacApi.js           # STAC API integration & formatting
│   ├── App.jsx                  # Main application & state management
│   ├── App.css                  # App layout with Earth background
│   ├── main.jsx                 # React entry point
│   └── index.css                # Global styles
├── public/
│   └── earth_clean.png          # Background image
├── vite.config.js               # Vite configuration
├── package.json                 # Dependencies
└── README.md
```

## Architecture

### Component Hierarchy

```
App (state management)
├── SearchBar (collection selector, date range, filters, sliders)
├── ImageList (results with band selectors, metadata, action buttons)
└── MapLeaflet (Leaflet map with COG tile overlays, legends, info box)
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
  "collections": ["sentinel-2-l2a"],  // Changes based on dropdown selection
  "bbox": [minLon, minLat, maxLon, maxLat],
  "datetime": "2024-01-01/2024-12-31",  // omitted for cop-dem-glo-30 (static)
  "query": { "eo:cloud_cover": { "lt": 20 } },  // only for optical collections
  "limit": 10
}
```

Other collection values: `landsat-c2-l2`, `sentinel-1-rtc`, `modis-13Q1-061`, `cop-dem-glo-30`

Response is a GeoJSON FeatureCollection with STAC items.

### Tile Rendering

Tiles are rendered on-the-fly by Microsoft Planetary Computer's TiTiler:

```
https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/
  WebMercatorQuad/{z}/{x}/{y}@1x?
  collection={collection}&
  item={item_id}&
  assets={band}&
  rescale={min},{max}&
  colormap_name={colormap}
```

Supports band selection, rescaling, and matplotlib colormaps (viridis, inferno, turbo, etc.).

## Learning Resources

This project demonstrates key React concepts:

- **Components & JSX** - Building reusable UI pieces with conditional rendering
- **Hooks** - useState, useEffect, useRef, useCallback for state management and memoization
- **Props & Callbacks** - Parent-child communication with lifting state up pattern
- **API Integration** - Async operations with axios and STAC protocol
- **External Libraries** - Integrating Leaflet mapping library
- **Dynamic Tile Loading** - COG (Cloud-Optimized GeoTIFF) rendering
- **Conditional UI** - Showing/hiding controls based on collection and band selection

## Deployment

Deploy to GitHub Pages:

```bash
npm run deploy
```

This builds the production bundle and publishes to the `gh-pages` branch.

### GitHub Pages Setup

1. Create a GitHub repository named `sat-data-viewer`
2. Push your code to GitHub
3. Run `npm run deploy`
4. Enable GitHub Pages in repository settings (source: gh-pages branch)
5. Visit `https://yourusername.github.io/sat-data-viewer`

## API Reference

### Microsoft Planetary Computer

- **STAC API Docs:** https://planetarycomputer.microsoft.com/docs/reference/stac/
- **TiTiler Docs:** https://planetarycomputer.microsoft.com/docs/reference/titiler/
- **Collections:**
  - Sentinel-2 L2A: https://planetarycomputer.microsoft.com/dataset/sentinel-2-l2a
  - Landsat C2 L2: https://planetarycomputer.microsoft.com/dataset/landsat-c2-l2
  - Sentinel-1 RTC: https://planetarycomputer.microsoft.com/dataset/sentinel-1-rtc
  - MODIS 13Q1: https://planetarycomputer.microsoft.com/dataset/modis-13Q1-061
  - Copernicus DEM: https://planetarycomputer.microsoft.com/dataset/cop-dem-glo-30
- **No authentication required** - All data and tile rendering is public

### Leaflet

- **Documentation:** https://leafletjs.com/
- **Free and open source** - No API keys required

## Contributing

This is a personal learning/portfolio project, but suggestions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Commit changes (`git commit -am 'Add feature'`)
4. Push to branch (`git push origin feature/improvement`)
5. Open a Pull Request

## License

MIT License - feel free to use this code for learning or your own projects.

## Author

**Your Name**
- GitHub: [@kongstad](https://github.com/kongstad)
- LinkedIn: [Your LinkedIn](https://www.linkedin.com/in/yourprofile)

## Acknowledgments

- **Microsoft** - Planetary Computer STAC API, TiTiler, and free satellite data access
- **Leaflet** - Open-source mapping library
- **OpenStreetMap** - Free and open map tiles
- **Esri** - World Imagery base layer
- **React Team** - Excellent documentation and developer experience
- **Vite Team** - Lightning-fast build tooling

## Future Enhancements

- [ ] Polygon drawing and cropping with download (requires AWS Lambda backend)
- [ ] Time series animation and temporal comparison
- [ ] Additional collections (NAIP aerial imagery, HLS)
- [ ] Computed indices (NDVI, NDWI, EVI) via TiTiler expressions for all optical collections
- [ ] Export functionality with custom projections
- [ ] Mosaic multiple tiles into single download
- [ ] Statistics endpoint for area of interest (mean, min, max values)

---

**Total Cost:** $0/month (all free tiers)

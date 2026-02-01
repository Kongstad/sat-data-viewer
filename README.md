# Satellite Data Viewer

A free, client-side web application for exploring Sentinel-2 satellite imagery from Microsoft Planetary Computer's STAC API. Built with React, Mapbox GL JS, and Vite.

**Live Demo:** [https://kongstad.github.io/sat-data-viewer](https://kongstad.github.io/sat-data-viewer)

## Features

- **Interactive Map** - Powered by Mapbox GL JS with satellite basemap
- **Satellite Data Search** - Query Sentinel-2 imagery by date range, location, and cloud coverage
- **Visual Preview** - Browse results with thumbnails and metadata
- **Real-time Display** - View selected satellite imagery directly on the map
- **Free & Fast** - 100% client-side, no backend required, zero hosting costs

## Tech Stack

- **Frontend:** React 19 with Hooks (useState, useEffect, useRef)
- **Build Tool:** Vite 7 (modern, fast development)
- **Mapping:** Mapbox GL JS
- **Data Source:** Microsoft Planetary Computer STAC API (free, public)
- **HTTP Client:** Axios
- **Hosting:** GitHub Pages
- **Styling:** Vanilla CSS with responsive design

## Installation

### Prerequisites

- Node.js 18+ and npm
- Mapbox account (free tier: 50,000 map loads/month)

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

3. **Configure Mapbox token**
   
   Get your free token at: https://account.mapbox.com/access-tokens/
   
   Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your token:
   ```env
   VITE_MAPBOX_TOKEN=your_actual_mapbox_token_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

1. **Pan and zoom** the map to your area of interest
2. **Set search parameters:**
   - Start and end dates
   - Maximum cloud coverage (0-100%)
3. **Click "Search"** to find satellite imagery
4. **Browse results** in the left sidebar
5. **Click an image** to display it on the map

## Project Structure

```
sat-data-viewer/
├── src/
│   ├── components/
│   │   ├── Map.jsx              # Mapbox map component
│   │   ├── Map.css
│   │   ├── SearchBar.jsx        # Search interface
│   │   ├── SearchBar.css
│   │   ├── ImageList.jsx        # Results display
│   │   └── ImageList.css
│   ├── utils/
│   │   └── stacApi.js           # STAC API integration
│   ├── App.jsx                  # Main application
│   ├── App.css
│   ├── main.jsx                 # React entry point
│   └── index.css                # Global styles
├── public/                      # Static assets
├── .env.example                 # Environment template
├── vite.config.js              # Vite configuration
├── package.json                # Dependencies
└── README.md
```

## Architecture

### Component Hierarchy

```
App
├── SearchBar (search form)
├── ImageList (results display)
└── Map (Mapbox visualization)
```

### Data Flow

1. User adjusts map → App stores bounding box
2. User submits search → App queries STAC API
3. Results returned → App updates ImageList
4. User selects image → App passes to Map component
5. Map displays imagery → Mapbox renders tiles

### STAC API Integration

The app uses Microsoft Planetary Computer's STAC API:

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

Response is a GeoJSON FeatureCollection with STAC items containing imagery URLs.

## Learning Resources

This project demonstrates key React concepts:

- **Components & JSX** - Building reusable UI pieces
- **Hooks** - useState, useEffect, useRef for state and side effects
- **Props & Callbacks** - Parent-child communication
- **API Integration** - Async operations with axios
- **External Libraries** - Integrating Mapbox GL JS
- **Environment Variables** - Secure configuration with Vite

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
- **Sentinel-2 Collection:** https://planetarycomputer.microsoft.com/dataset/sentinel-2-l2a
- **No authentication required** - All data is public

### Mapbox GL JS

- **Documentation:** https://docs.mapbox.com/mapbox-gl-js/
- **Free Tier:** 50,000 map loads/month
- **Account:** https://account.mapbox.com/

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

- **Microsoft** - Planetary Computer STAC API and free satellite data access
- **Mapbox** - Beautiful mapping library and generous free tier
- **React Team** - Excellent documentation and developer experience
- **Vite Team** - Lightning-fast build tooling

## Future Enhancements

- [ ] Multiple band combinations (true color, false color, NDVI)
- [ ] Time series analysis and comparison
- [ ] Download imagery for offline use
- [ ] Custom area drawing tools
- [ ] Advanced filtering (season, specific satellites)
- [ ] Backend integration with Python processing (FastAPI)

---

**Total Cost:** $0/month (all free tiers)

# Contributing to Satellite Data Viewer

Thank you for your interest in contributing! This project is built with React and uses Microsoft Planetary Computer's STAC API.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/sat-data-viewer.git`
3. Install dependencies: `npm install`
4. Start dev server: `npm run dev`
5. Create a feature branch: `git checkout -b feature/your-feature-name`

## Development Guidelines

### Code Style

- Use functional React components with Hooks
- Follow existing naming conventions
- Keep components focused and single-purpose
- Use CSS modules or component-scoped CSS
- Maintain the config-driven architecture

### Adding a New Collection

New satellite collections should be added to `src/config/collections.js`:

```javascript
'new-collection-id': {
  name: 'Collection Name',
  displayName: 'Dropdown Label',
  type: 'optical|sar|elevation|vegetation',
  hasCloudFilter: boolean,
  hasDateFilter: boolean,
  defaultBand: 'band-id',
  bands: {
    'band-id': {
      label: 'Button Label',
      assets: ['asset-name'],
      rescale: 'min,max' | null,
      colormap: 'colormap-name' | null,
      legend: { title, min, max, gradient } | null
    }
  },
  bandLayout: 'grid' | 'flex' | 'none',
  metadata: {
    showCloudCover: boolean,
    showTileId: boolean
  }
}
```

No component changes are needed - the UI will automatically adapt.

### Testing

Before submitting a PR, test:
- Search functionality for all collections
- Band switching and visualization
- Measurement tools (distance/area)
- Legend display
- Mobile responsiveness

### Commit Messages

Use clear, concise commit messages:
- `feat: Add NAIP collection support`
- `fix: Correct thermal band rescale values`
- `docs: Update architecture diagram`
- `refactor: Simplify tile URL builder`

## Pull Request Process

1. Update documentation if adding features
2. Test thoroughly on desktop and mobile
3. Keep PRs focused on a single feature/fix
4. Provide clear description of changes
5. Link any related issues

## Code of Conduct

- Be respectful and constructive
- Focus on the code, not the person
- Help others learn and grow
- Keep discussions professional

## Questions?

Open an issue for:
- Bug reports
- Feature requests
- Architecture questions
- Documentation improvements

Thank you for contributing!

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

#### Running Tests

```bash
npm test              # Run all tests once
npm run test:watch    # Run tests in watch mode
npm run test:ui       # Run tests with UI
```

#### Writing Tests

We use **Vitest** and **React Testing Library**:

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders without crashing', () => {
    render(<MyComponent />);
    expect(screen.getByText(/Hello/i)).toBeInTheDocument();
  });
});
```

#### Testing Guidelines

- Test user-facing behavior, not implementation details
- Use `data-testid` for elements without text/labels
- Mock external dependencies (axios, Leaflet)
- Keep tests simple and readable

#### Pre-Submit Checklist

Before submitting a PR, manually test:
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

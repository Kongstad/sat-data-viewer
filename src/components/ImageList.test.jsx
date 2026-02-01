import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ImageList from '../components/ImageList';

describe('ImageList', () => {
  const mockOnToggleImage = vi.fn();
  const mockOnBandChange = vi.fn();
  const mockOnZoomToTile = vi.fn();
  const mockOnShowTileInfo = vi.fn();

  const mockImages = [
    {
      id: 'test-tile-1',
      thumbnail: 'https://example.com/thumb1.jpg',
      collection: 'sentinel-2-l2a',
      metadata: {
        'eo:cloud_cover': 15,
        datetime: '2024-01-01T00:00:00Z',
      },
      properties: {
        'eo:cloud_cover': 15,
        datetime: '2024-01-01T00:00:00Z',
      },
    },
  ];

  const defaultProps = {
    items: [],
    selectedImages: [],
    onToggleImage: mockOnToggleImage,
    currentCollection: 'sentinel-2-l2a',
    selectedBands: {},
    onBandChange: mockOnBandChange,
    onZoomToTile: mockOnZoomToTile,
    onShowTileInfo: mockOnShowTileInfo,
  };

  it('renders without crashing when no images', () => {
    render(<ImageList {...defaultProps} />);
    expect(screen.getByText(/No imagery found/i)).toBeInTheDocument();
  });

  it('shows empty state message when no images', () => {
    render(<ImageList {...defaultProps} />);
    expect(screen.getByText(/No imagery found/i)).toBeInTheDocument();
  });

  it('displays images when provided', () => {
    render(<ImageList {...defaultProps} items={mockImages} />);
    expect(screen.getByText(/Found/i)).toBeInTheDocument();
    expect(screen.getByText(/1/i)).toBeInTheDocument();
    expect(screen.getByText(/images/i)).toBeInTheDocument();
  });

  it('renders thumbnail', () => {
    render(<ImageList {...defaultProps} items={mockImages} />);
    const img = screen.getByAltText(/Satellite imagery/i);
    expect(img).toBeInTheDocument();
  });

  it('shows image count', () => {
    render(<ImageList {...defaultProps} items={mockImages} />);
    expect(screen.getByText(/Found/i)).toBeInTheDocument();
    expect(screen.getByText(/1/i)).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from '../components/SearchBar';

describe('SearchBar', () => {
  const mockOnSearch = vi.fn();
  const mockOnSetSearchPoint = vi.fn();
  const mockOnClearSearch = vi.fn();

  const defaultProps = {
    onSearch: mockOnSearch,
    onSetSearchPoint: mockOnSetSearchPoint,
    onClearSearch: mockOnClearSearch,
    hasSearchPoint: false,
    elevationRange: [0, 4000],
    onElevationRangeChange: vi.fn(),
    thermalRange: [270, 330],
    onThermalRangeChange: vi.fn(),
  };

  it('renders search bar title', () => {
    render(<SearchBar {...defaultProps} />);
    expect(screen.getByText(/Search Satellite Data/i)).toBeInTheDocument();
  });

  it('displays all collection options', () => {
    render(<SearchBar {...defaultProps} />);
    const select = screen.getByLabelText(/Collection/i);
    expect(select).toBeInTheDocument();
    
    // Check that Sentinel-2 is an option
    const sentinel2Option = screen.getByRole('option', { name: /Sentinel-2/i });
    expect(sentinel2Option).toBeInTheDocument();
  });

  it('has set search point button', () => {
    render(<SearchBar {...defaultProps} />);
    const button = screen.getByText(/Set Search Point/i);
    expect(button).toBeInTheDocument();
  });

  it('has search button', () => {
    render(<SearchBar {...defaultProps} />);
    const searchButton = screen.getByRole('button', { name: /Search/i });
    expect(searchButton).toBeInTheDocument();
  });

  it('renders date inputs', () => {
    render(<SearchBar {...defaultProps} />);
    const startDate = screen.getByLabelText(/Start Date/i);
    const endDate = screen.getByLabelText(/End Date/i);
    expect(startDate).toBeInTheDocument();
    expect(endDate).toBeInTheDocument();
  });

  it('renders cloud cover slider', () => {
    render(<SearchBar {...defaultProps} />);
    const cloudSlider = screen.getByLabelText(/Max Cloud Cover/i);
    expect(cloudSlider).toBeInTheDocument();
  });

  it('search button is enabled with search point', () => {
    render(<SearchBar {...defaultProps} hasSearchPoint={true} />);
    const searchButton = screen.getByRole('button', { name: /Search/i });
    expect(searchButton).not.toBeDisabled();
  });
});

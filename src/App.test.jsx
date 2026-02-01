import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
  });

  it('displays the search bar', () => {
    render(<App />);
    expect(screen.getByText(/Search Satellite Data/i)).toBeInTheDocument();
  });

  it('displays the map container', () => {
    render(<App />);
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();
  });

  it('displays collection selector', () => {
    render(<App />);
    expect(screen.getByLabelText(/Collection/i)).toBeInTheDocument();
  });

  it('has submit button', () => {
    render(<App />);
    const buttons = screen.getAllByRole('button', { name: /search/i });
    expect(buttons.length).toBeGreaterThan(0);
  });
});

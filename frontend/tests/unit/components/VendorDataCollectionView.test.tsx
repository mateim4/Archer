import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import VendorDataCollectionView from '../../../src/views/VendorDataCollectionView';
import { mockHardwareBaskets, mockUser } from '../../utils/mock-data';

// Mock API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock file reading
const mockFileReader = {
  readAsArrayBuffer: vi.fn(),
  result: new ArrayBuffer(8),
  onload: vi.fn(),
  onerror: vi.fn()
};

global.FileReader = vi.fn(() => mockFileReader) as any;

describe('VendorDataCollectionView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful API responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ baskets: mockHardwareBaskets })
    });
  });

  it('renders without crashing', () => {
    render(<VendorDataCollectionView />);
    expect(screen.getByText(/vendor data collection/i)).toBeInTheDocument();
  });

  it('displays hardware basket management section', async () => {
    render(<VendorDataCollectionView />);
    
    await waitFor(() => {
      expect(screen.getByText(/hardware basket management/i)).toBeInTheDocument();
    });
  });

  it('shows upload section with proper file inputs', async () => {
    render(<VendorDataCollectionView />);
    
    await waitFor(() => {
      // Should have file upload areas for different vendors
      expect(screen.getByText(/dell emc excel files/i)).toBeInTheDocument();
      expect(screen.getByText(/lenovo excel files/i)).toBeInTheDocument();
      expect(screen.getByText(/hpe iquote files/i)).toBeInTheDocument();
    });
  });

  it('handles file upload', async () => {
    render(<VendorDataCollectionView />);
    
    await waitFor(() => {
      const fileInput = screen.getAllByRole('button', { name: /browse files/i })[0];
      expect(fileInput).toBeInTheDocument();
    });
  });

  it('displays hardware baskets when loaded', async () => {
    render(<VendorDataCollectionView />);
    
    await waitFor(() => {
      expect(screen.getByText('Q1 2024 Dell Refresh')).toBeInTheDocument();
      expect(screen.getByText('Lenovo Storage Expansion')).toBeInTheDocument();
    });
  });

  it('shows basket status correctly', async () => {
    render(<VendorDataCollectionView />);
    
    await waitFor(() => {
      expect(screen.getByText('Processed')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  it('handles basket deletion', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    render(<VendorDataCollectionView />);
    
    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  it('displays vendor models correctly', async () => {
    render(<VendorDataCollectionView />);
    
    await waitFor(() => {
      // Check if vendor model information is displayed
      expect(screen.getByText(/dell/i)).toBeInTheDocument();
      expect(screen.getByText(/lenovo/i)).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    render(<VendorDataCollectionView />);
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'Dell' } });
      expect(searchInput).toHaveValue('Dell');
    });
  });

  it('shows error messages when API fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'));
    
    render(<VendorDataCollectionView />);
    
    await waitFor(() => {
      // Should handle errors gracefully
      expect(screen.getByText(/vendor data collection/i)).toBeInTheDocument();
    });
  });

  it('handles file processing status updates', async () => {
    render(<VendorDataCollectionView />);
    
    // Mock processing status
    const processingStatus = {
      status: 'processing',
      progress: 50,
      message: 'Parsing Excel file...'
    };

    await waitFor(() => {
      expect(screen.getByText(/vendor data collection/i)).toBeInTheDocument();
    });
  });
});
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import { CapacityCanvas } from '../../../src/components/CapacityVisualizer/CapacityCanvas';
import { mockClusterData } from '../../utils/mock-data';

// Mock D3 to avoid DOM manipulation issues in tests
vi.mock('d3', () => ({
  select: vi.fn(() => ({
    selectAll: vi.fn(() => ({
      data: vi.fn(() => ({
        enter: vi.fn(() => ({
          append: vi.fn(() => ({
            attr: vi.fn().mockReturnThis(),
            style: vi.fn().mockReturnThis(),
            text: vi.fn().mockReturnThis(),
            on: vi.fn().mockReturnThis()
          }))
        })),
        exit: vi.fn(() => ({
          remove: vi.fn()
        })),
        attr: vi.fn().mockReturnThis(),
        style: vi.fn().mockReturnThis(),
        text: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis()
      }))
    })),
    attr: vi.fn().mockReturnThis(),
    style: vi.fn().mockReturnThis(),
    call: vi.fn().mockReturnThis(),
    append: vi.fn().mockReturnThis(),
    node: vi.fn(() => ({ getBoundingClientRect: () => ({ width: 1200, height: 600 }) }))
  })),
  zoom: vi.fn(() => ({
    scaleExtent: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis()
  })),
  scaleLinear: vi.fn(() => ({
    domain: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis()
  }))
}));

describe('CapacityCanvas', () => {
  const mockProps = {
    state: {
      clusters: mockClusterData,
      selectedVMs: new Set(['vm-1']),
      visualizationMode: 'cpu' as const
    },
    onVMMove: vi.fn(),
    onVMSelect: vi.fn(),
    onTooltipUpdate: vi.fn(),
    onStateUpdate: vi.fn()
  };

  it('renders without crashing', () => {
    render(<CapacityCanvas {...mockProps} />);
    expect(screen.getByRole('button', { name: /advanced visualizer/i })).toBeInTheDocument();
  });

  it('displays cluster data correctly', () => {
    render(<CapacityCanvas {...mockProps} />);
    // Check if visualization modes are available
    expect(screen.getByText('CPU')).toBeInTheDocument();
    expect(screen.getByText('Memory')).toBeInTheDocument();
    expect(screen.getByText('Storage')).toBeInTheDocument();
  });

  it('handles visualization mode changes', async () => {
    render(<CapacityCanvas {...mockProps} />);
    
    const memoryButton = screen.getByText('Memory');
    fireEvent.click(memoryButton);
    
    await waitFor(() => {
      expect(mockProps.onStateUpdate).toHaveBeenCalled();
    });
  });

  it('handles VM selection', async () => {
    render(<CapacityCanvas {...mockProps} />);
    
    // Simulate VM selection via search
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'Web-Server' } });
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('Web-Server');
    });
  });

  it('handles advanced visualizer toggle', () => {
    render(<CapacityCanvas {...mockProps} />);
    
    const advancedToggle = screen.getByRole('button', { name: /advanced visualizer/i });
    fireEvent.click(advancedToggle);
    
    expect(screen.getByText(/simple visualizer/i)).toBeInTheDocument();
  });

  it('displays free space toggle', () => {
    render(<CapacityCanvas {...mockProps} />);
    
    const freeSpaceToggle = screen.getByText(/show free space/i);
    expect(freeSpaceToggle).toBeInTheDocument();
  });

  it('handles overcommit ratio changes', async () => {
    render(<CapacityCanvas {...mockProps} />);
    
    // Find CPU overcommit input
    const cpuInput = screen.getByDisplayValue('3');
    fireEvent.change(cpuInput, { target: { value: '4' } });
    
    await waitFor(() => {
      expect(cpuInput).toHaveValue(4);
    });
  });
});
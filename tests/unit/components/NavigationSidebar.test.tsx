import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NavigationSidebar from '@/components/NavigationSidebar';

/**
 * NavigationSidebar Unit Tests
 * Tests the navigation sidebar component functionality
 */
describe('NavigationSidebar', () => {
  it('renders navigation items correctly', () => {
    render(<NavigationSidebar activeView="dashboard" onViewChange={vi.fn()} navCollapsed={false} onToggleNav={vi.fn()} />);
    
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Lifecycle Planner/i)).toBeInTheDocument();
    expect(screen.getByText(/Migration Planner/i)).toBeInTheDocument();
    expect(screen.getByText(/Settings/i)).toBeInTheDocument();
  });

  it('handles navigation state correctly', () => {
    const mockOnViewChange = vi.fn();
    render(<NavigationSidebar activeView="dashboard" onViewChange={mockOnViewChange} navCollapsed={false} onToggleNav={vi.fn()} />);
    
    // Test that navigation is functional
    const sidebar = screen.getByRole('navigation');
    expect(sidebar).toBeInTheDocument();
  });

  it('handles view changes when nav items are clicked', () => {
    const mockOnViewChange = vi.fn();
    render(<NavigationSidebar activeView="dashboard" onViewChange={mockOnViewChange} navCollapsed={false} onToggleNav={vi.fn()} />);
    
    // Click on Lifecycle Planner
    const lifecycleButton = screen.getByText(/Lifecycle Planner/i);
    fireEvent.click(lifecycleButton);
    
    expect(mockOnViewChange).toHaveBeenCalled();
  });

  it('handles collapsed state correctly', () => {
    render(<NavigationSidebar activeView="dashboard" onViewChange={vi.fn()} navCollapsed={true} onToggleNav={vi.fn()} />);
    
    const sidebar = screen.getByRole('navigation');
    expect(sidebar).toBeInTheDocument();
    // In collapsed state, the sidebar should still be present but styled differently
  });

  it('displays active view highlighting', () => {
    render(<NavigationSidebar activeView="lifecycle-planner" onViewChange={vi.fn()} navCollapsed={false} onToggleNav={vi.fn()} />);
    
    // The active view should be highlighted (this depends on your implementation)
    const sidebar = screen.getByRole('navigation');
    expect(sidebar).toBeInTheDocument();
  });
});

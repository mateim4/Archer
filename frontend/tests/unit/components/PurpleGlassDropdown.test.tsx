import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import userEvent from '@testing-library/user-event';
import { PurpleGlassDropdown, DropdownOption } from '../../../src/components/ui/PurpleGlassDropdown';

describe('PurpleGlassDropdown', () => {
  const mockOptions: DropdownOption[] = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' },
    { value: '4', label: 'Option 4', disabled: true },
  ];

  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // BASIC RENDERING
  // ========================================================================

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(
        <PurpleGlassDropdown
          options={mockOptions}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(
        <PurpleGlassDropdown
          label="Test Label"
          options={mockOptions}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('renders with required indicator', () => {
      render(
        <PurpleGlassDropdown
          label="Required Field"
          options={mockOptions}
          onChange={mockOnChange}
          required
        />
      );
      const label = screen.getByText(/Required Field/);
      expect(label.textContent).toContain('*');
    });

    it('renders with helper text', () => {
      render(
        <PurpleGlassDropdown
          label="Test"
          helperText="This is helper text"
          options={mockOptions}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByText('This is helper text')).toBeInTheDocument();
    });

    it('displays placeholder when no value is selected', () => {
      render(
        <PurpleGlassDropdown
          placeholder="Select an option..."
          options={mockOptions}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByText('Select an option...')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <PurpleGlassDropdown
          className="custom-class"
          options={mockOptions}
          onChange={mockOnChange}
          data-testid="dropdown-wrapper"
        />
      );
      
      // Find the dropdown wrapper which should have the custom class
      const dropdownWrapper = screen.getByRole('button').closest('.custom-class');
      expect(dropdownWrapper).toBeInTheDocument();
    });
  });

  // ========================================================================
  // SINGLE SELECT MODE
  // ========================================================================

  describe('Single Select Mode', () => {
    it('displays selected option', () => {
      render(
        <PurpleGlassDropdown
          options={mockOptions}
          value="2"
          onChange={mockOnChange}
        />
      );
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('opens menu on button click', async () => {
      const user = userEvent.setup();
      render(
        <PurpleGlassDropdown
          options={mockOptions}
          onChange={mockOnChange}
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      // Wait for menu to appear
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('selects option and closes menu', async () => {
      const user = userEvent.setup();
      render(
        <PurpleGlassDropdown
          options={mockOptions}
          onChange={mockOnChange}
        />
      );

      // Open dropdown
      const trigger = screen.getByRole('button');
      await user.click(trigger);

      // Wait for menu and click option
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const option1 = screen.getByRole('option', { name: 'Option 1' });
      await user.click(option1);

      // Verify onChange was called
      expect(mockOnChange).toHaveBeenCalledWith('1');

      // Menu should close
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('does not select disabled options', async () => {
      const user = userEvent.setup();
      render(
        <PurpleGlassDropdown
          options={mockOptions}
          onChange={mockOnChange}
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const disabledOption = screen.getByRole('option', { name: 'Option 4' });
      await user.click(disabledOption);

      // onChange should not be called for disabled option
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // MULTI-SELECT MODE
  // ========================================================================

  describe('Multi-Select Mode', () => {
    it('displays multiple selected options as tags', () => {
      render(
        <PurpleGlassDropdown
          options={mockOptions}
          value={['1', '2']}
          onChange={mockOnChange}
          multiSelect
        />
      );
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('adds option to selection in multi-select', async () => {
      const user = userEvent.setup();
      render(
        <PurpleGlassDropdown
          label="Test Dropdown"
          options={mockOptions}
          value={['1']}
          onChange={mockOnChange}
          multiSelect
        />
      );

      const trigger = screen.getByRole('button', { expanded: false });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const option2 = screen.getByRole('option', { name: 'Option 2' });
      await user.click(option2);

      expect(mockOnChange).toHaveBeenCalledWith(['1', '2']);
    });

    it('removes option from selection in multi-select', async () => {
      const user = userEvent.setup();
      render(
        <PurpleGlassDropdown
          label="Test Dropdown"
          options={mockOptions}
          value={['1', '2']}
          onChange={mockOnChange}
          multiSelect
        />
      );

      const trigger = screen.getByRole('button', { expanded: false });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const option1 = screen.getByRole('option', { name: 'Option 1' });
      await user.click(option1);

      expect(mockOnChange).toHaveBeenCalledWith(['2']);
    });

    it('removes tag via tag remove button', async () => {
      const user = userEvent.setup();
      render(
        <PurpleGlassDropdown
          label="Test Dropdown"
          options={mockOptions}
          value={['1', '2']}
          onChange={mockOnChange}
          multiSelect
        />
      );

      const removeButton = screen.getByRole('button', { name: 'Remove Option 1' });
      await user.click(removeButton);

      expect(mockOnChange).toHaveBeenCalledWith(['2']);
    });

    it('keeps menu open after selection in multi-select', async () => {
      const user = userEvent.setup();
      render(
        <PurpleGlassDropdown
          options={mockOptions}
          value={['1']}
          onChange={mockOnChange}
          multiSelect
        />
      );

      // Get the trigger button (not the remove tag button)
      const trigger = screen.getByRole('button', { expanded: false });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const option2 = screen.getByRole('option', { name: 'Option 2' });
      await user.click(option2);

      // Menu should remain open in multi-select
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // SEARCHABLE FUNCTIONALITY
  // ========================================================================

  describe('Searchable Functionality', () => {
    it('renders search input when searchable is true', async () => {
      const user = userEvent.setup();
      render(
        <PurpleGlassDropdown
          options={mockOptions}
          onChange={mockOnChange}
          searchable
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search...');
        expect(searchInput).toBeInTheDocument();
      });
    });

    it('filters options based on search query', async () => {
      const user = userEvent.setup();
      render(
        <PurpleGlassDropdown
          options={mockOptions}
          onChange={mockOnChange}
          searchable
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'Option 1');

      // Only "Option 1" should be visible
      expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: 'Option 2' })).not.toBeInTheDocument();
    });

    it('shows empty state when no options match search', async () => {
      const user = userEvent.setup();
      render(
        <PurpleGlassDropdown
          options={mockOptions}
          onChange={mockOnChange}
          searchable
          emptyText="No matches found"
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'xyz');

      expect(screen.getByText('No matches found')).toBeInTheDocument();
    });

    it('uses custom search placeholder', async () => {
      const user = userEvent.setup();
      render(
        <PurpleGlassDropdown
          options={mockOptions}
          onChange={mockOnChange}
          searchable
          searchPlaceholder="Type to search..."
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Type to search...');
        expect(searchInput).toBeInTheDocument();
      });
    });

    it('clears search when menu closes', async () => {
      const user = userEvent.setup();
      render(
        <PurpleGlassDropdown
          options={mockOptions}
          onChange={mockOnChange}
          searchable
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'Option 1');

      // Close dropdown
      fireEvent.keyDown(trigger, { key: 'Escape' });

      // Reopen
      await user.click(trigger);

      await waitFor(() => {
        const newSearchInput = screen.getByPlaceholderText('Search...');
        expect(newSearchInput).toHaveValue('');
      });
    });
  });

  // ========================================================================
  // KEYBOARD NAVIGATION
  // ========================================================================

  describe('Keyboard Navigation', () => {
    it('opens dropdown on Enter key', async () => {
      render(
        <PurpleGlassDropdown
          options={mockOptions}
          onChange={mockOnChange}
        />
      );

      const trigger = screen.getByRole('button');
      trigger.focus();
      fireEvent.keyDown(trigger, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('opens dropdown on Space key', async () => {
      render(
        <PurpleGlassDropdown
          options={mockOptions}
          onChange={mockOnChange}
        />
      );

      const trigger = screen.getByRole('button');
      trigger.focus();
      fireEvent.keyDown(trigger, { key: ' ' });

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('closes dropdown on Escape key', async () => {
      const user = userEvent.setup();
      render(
        <PurpleGlassDropdown
          options={mockOptions}
          onChange={mockOnChange}
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      fireEvent.keyDown(trigger, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  // ========================================================================
  // VALIDATION STATES
  // ========================================================================

  describe('Validation States', () => {
    it('renders error state', () => {
      render(
        <PurpleGlassDropdown
          label="Test"
          options={mockOptions}
          onChange={mockOnChange}
          validationState="error"
          helperText="This field is required"
        />
      );

      const helperText = screen.getByText('This field is required');
      expect(helperText).toBeInTheDocument();
      expect(helperText).toHaveAttribute('role', 'alert');
    });

    it('renders warning state', () => {
      render(
        <PurpleGlassDropdown
          options={mockOptions}
          onChange={mockOnChange}
          validationState="warning"
          helperText="Please review your selection"
        />
      );

      expect(screen.getByText('Please review your selection')).toBeInTheDocument();
    });

    it('renders success state', () => {
      render(
        <PurpleGlassDropdown
          options={mockOptions}
          onChange={mockOnChange}
          validationState="success"
          helperText="Selection saved successfully"
        />
      );

      expect(screen.getByText('Selection saved successfully')).toBeInTheDocument();
    });

    it('sets aria-invalid when in error state', () => {
      render(
        <PurpleGlassDropdown
          options={mockOptions}
          onChange={mockOnChange}
          validationState="error"
        />
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-invalid', 'true');
    });
  });

  // ========================================================================
  // DISABLED STATE
  // ========================================================================

  describe('Disabled State', () => {
    it('renders disabled dropdown', () => {
      render(
        <PurpleGlassDropdown
          options={mockOptions}
          onChange={mockOnChange}
          disabled
        />
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toBeDisabled();
    });

    it('does not open when disabled', async () => {
      const user = userEvent.setup();
      render(
        <PurpleGlassDropdown
          options={mockOptions}
          onChange={mockOnChange}
          disabled
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('renders disabled options correctly', async () => {
      const user = userEvent.setup();
      render(
        <PurpleGlassDropdown
          options={mockOptions}
          onChange={mockOnChange}
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const disabledOption = screen.getByRole('option', { name: 'Option 4' });
      expect(disabledOption).toBeDisabled();
    });
  });

  // ========================================================================
  // CUSTOM RENDERING
  // ========================================================================

  describe('Custom Rendering', () => {
    it('uses custom option renderer', async () => {
      const user = userEvent.setup();
      const renderOption = (option: DropdownOption) => (
        <div>Custom: {option.label}</div>
      );

      render(
        <PurpleGlassDropdown
          options={mockOptions}
          onChange={mockOnChange}
          renderOption={renderOption}
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Custom: Option 1')).toBeInTheDocument();
      });
    });

    it('uses custom value renderer', () => {
      const renderValue = (value: string | string[]) => (
        <span data-testid="custom-value">Selected: {value}</span>
      );

      render(
        <PurpleGlassDropdown
          options={mockOptions}
          value="2"
          onChange={mockOnChange}
          renderValue={renderValue}
        />
      );

      expect(screen.getByTestId('custom-value')).toHaveTextContent('Selected: 2');
    });
  });

  // ========================================================================
  // CLICK OUTSIDE BEHAVIOR
  // ========================================================================

  describe('Click Outside Behavior', () => {
    it('closes menu when clicking outside', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <div>
          <PurpleGlassDropdown
            options={mockOptions}
            onChange={mockOnChange}
            label="Test Dropdown"
          />
          <div data-testid="outside">Outside element</div>
        </div>
      );

      const trigger = screen.getByRole('button', { expanded: false });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const outside = screen.getByTestId('outside');
      await user.click(outside);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  // ========================================================================
  // ACCESSIBILITY
  // ========================================================================

  describe('Accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(
        <PurpleGlassDropdown
          label="Test"
          options={mockOptions}
          onChange={mockOnChange}
          required
        />
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('aria-required', 'true');
    });

    it('updates aria-expanded when opened', async () => {
      const user = userEvent.setup();
      render(
        <PurpleGlassDropdown
          options={mockOptions}
          onChange={mockOnChange}
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('sets aria-multiselectable on listbox in multi-select mode', async () => {
      const user = userEvent.setup();
      render(
        <PurpleGlassDropdown
          options={mockOptions}
          onChange={mockOnChange}
          multiSelect
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        const listbox = screen.getByRole('listbox');
        expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
      });
    });

    it('sets aria-selected on selected options', async () => {
      const user = userEvent.setup();
      render(
        <PurpleGlassDropdown
          options={mockOptions}
          value="2"
          onChange={mockOnChange}
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        const option2 = screen.getByRole('option', { name: 'Option 2' });
        expect(option2).toHaveAttribute('aria-selected', 'true');
      });
    });
  });

  // ========================================================================
  // GLASS VARIANTS
  // ========================================================================

  describe('Glass Variants', () => {
    it('renders with glass="none"', () => {
      const { container } = render(
        <PurpleGlassDropdown
          options={mockOptions}
          onChange={mockOnChange}
          glass="none"
        />
      );
      expect(container).toBeInTheDocument();
    });

    it('renders with glass="light"', () => {
      const { container } = render(
        <PurpleGlassDropdown
          options={mockOptions}
          onChange={mockOnChange}
          glass="light"
        />
      );
      expect(container).toBeInTheDocument();
    });

    it('renders with glass="medium"', () => {
      const { container } = render(
        <PurpleGlassDropdown
          options={mockOptions}
          onChange={mockOnChange}
          glass="medium"
        />
      );
      expect(container).toBeInTheDocument();
    });

    it('renders with glass="heavy"', () => {
      const { container } = render(
        <PurpleGlassDropdown
          options={mockOptions}
          onChange={mockOnChange}
          glass="heavy"
        />
      );
      expect(container).toBeInTheDocument();
    });
  });

  // ========================================================================
  // EDGE CASES
  // ========================================================================

  describe('Edge Cases', () => {
    it('handles empty options array', () => {
      render(
        <PurpleGlassDropdown
          options={[]}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles undefined value', () => {
      render(
        <PurpleGlassDropdown
          options={mockOptions}
          value={undefined}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByText('Select an option...')).toBeInTheDocument();
    });

    it('handles empty array value in multi-select', () => {
      render(
        <PurpleGlassDropdown
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          multiSelect
        />
      );
      expect(screen.getByText('Select an option...')).toBeInTheDocument();
    });
  });
});

/**
 * Button & Search Bar Demo View
 * 
 * Showcases all button variants and search bar features
 * for visual testing and documentation purposes.
 */

import React from 'react';
import { EnhancedPurpleGlassButton, EnhancedPurpleGlassSearchBar } from '../components/ui';
import {
  SaveRegular,
  DeleteRegular,
  ChevronRightRegular,
  AddRegular,
  EditRegular,
  ArrowDownloadRegular,
} from '@fluentui/react-icons';

export const ButtonSearchBarDemoView: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLoadingTest = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: 'var(--brand-primary)',
          marginBottom: '8px',
        }}>
          Button & Search Bar Components
        </h1>
        <p style={{
          fontSize: '16px',
          color: 'var(--text-secondary)',
        }}>
          Visual showcase of EnhancedPurpleGlassButton and EnhancedPurpleGlassSearchBar
        </p>
      </div>

      {/* Search Bar Section */}
      <section className="purple-glass-card static" style={{ padding: '32px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>
          Search Bar Examples
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
              Default Search Bar
            </h3>
            <EnhancedPurpleGlassSearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search tickets, assets, or people..."
            />
          </div>

          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
              Search with Submit Handler
            </h3>
            <EnhancedPurpleGlassSearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Press Enter to search..."
              onSubmit={() => alert(`Searching for: ${searchTerm}`)}
            />
          </div>

          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
              Custom Width Search
            </h3>
            <EnhancedPurpleGlassSearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Custom width search..."
              width="300px"
            />
          </div>
        </div>
      </section>

      {/* Button Variants Section */}
      <section className="purple-glass-card static" style={{ padding: '32px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>
          Button Variants
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Primary</p>
            <EnhancedPurpleGlassButton variant="primary">
              Primary Button
            </EnhancedPurpleGlassButton>
          </div>

          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Secondary</p>
            <EnhancedPurpleGlassButton variant="secondary">
              Secondary Button
            </EnhancedPurpleGlassButton>
          </div>

          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Danger</p>
            <EnhancedPurpleGlassButton variant="danger">
              Danger Button
            </EnhancedPurpleGlassButton>
          </div>

          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Ghost</p>
            <EnhancedPurpleGlassButton variant="ghost">
              Ghost Button
            </EnhancedPurpleGlassButton>
          </div>

          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Link</p>
            <EnhancedPurpleGlassButton variant="link">
              Link Button
            </EnhancedPurpleGlassButton>
          </div>
        </div>
      </section>

      {/* Button Sizes Section */}
      <section className="purple-glass-card static" style={{ padding: '32px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>
          Button Sizes
        </h2>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Small</p>
            <EnhancedPurpleGlassButton size="small">
              Small Button
            </EnhancedPurpleGlassButton>
          </div>

          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Medium (default)</p>
            <EnhancedPurpleGlassButton size="medium">
              Medium Button
            </EnhancedPurpleGlassButton>
          </div>

          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Large</p>
            <EnhancedPurpleGlassButton size="large">
              Large Button
            </EnhancedPurpleGlassButton>
          </div>
        </div>
      </section>

      {/* Buttons with Icons Section */}
      <section className="purple-glass-card static" style={{ padding: '32px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>
          Buttons with Icons
        </h2>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <EnhancedPurpleGlassButton icon={<SaveRegular />}>
            Save
          </EnhancedPurpleGlassButton>

          <EnhancedPurpleGlassButton icon={<AddRegular />} variant="primary">
            Create New
          </EnhancedPurpleGlassButton>

          <EnhancedPurpleGlassButton iconEnd={<ChevronRightRegular />} variant="secondary">
            Next
          </EnhancedPurpleGlassButton>

          <EnhancedPurpleGlassButton icon={<DeleteRegular />} variant="danger">
            Delete
          </EnhancedPurpleGlassButton>

          <EnhancedPurpleGlassButton icon={<EditRegular />} variant="ghost">
            Edit
          </EnhancedPurpleGlassButton>

          <EnhancedPurpleGlassButton icon={<ArrowDownloadRegular />} aria-label="Download" />
        </div>
      </section>

      {/* Button States Section */}
      <section className="purple-glass-card static" style={{ padding: '32px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>
          Button States
        </h2>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <EnhancedPurpleGlassButton loading={isLoading} onClick={handleLoadingTest}>
            {isLoading ? 'Loading...' : 'Test Loading'}
          </EnhancedPurpleGlassButton>

          <EnhancedPurpleGlassButton disabled>
            Disabled Button
          </EnhancedPurpleGlassButton>

          <EnhancedPurpleGlassButton animated={false}>
            No Animation
          </EnhancedPurpleGlassButton>

          <EnhancedPurpleGlassButton elevated>
            Elevated Shadow
          </EnhancedPurpleGlassButton>
        </div>
      </section>

      {/* Full Width Button Section */}
      <section className="purple-glass-card static" style={{ padding: '32px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>
          Full Width Button
        </h2>

        <EnhancedPurpleGlassButton fullWidth>
          Full Width Primary Button
        </EnhancedPurpleGlassButton>
      </section>

      {/* Common Patterns Section */}
      <section className="purple-glass-card static" style={{ padding: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>
          Common Action Patterns
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
              Form Actions
            </h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <EnhancedPurpleGlassButton variant="primary" icon={<SaveRegular />}>
                Save
              </EnhancedPurpleGlassButton>
              <EnhancedPurpleGlassButton variant="secondary">
                Cancel
              </EnhancedPurpleGlassButton>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
              Destructive Action with Confirmation
            </h3>
            <EnhancedPurpleGlassButton variant="danger" icon={<DeleteRegular />}>
              Delete Account
            </EnhancedPurpleGlassButton>
          </div>

          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
              Navigation Actions
            </h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <EnhancedPurpleGlassButton variant="ghost">
                Back
              </EnhancedPurpleGlassButton>
              <EnhancedPurpleGlassButton variant="primary" iconEnd={<ChevronRightRegular />}>
                Continue
              </EnhancedPurpleGlassButton>
            </div>
          </div>
        </div>
      </section>

      {/* Dark Mode Note */}
      <div style={{
        marginTop: '40px',
        padding: '24px',
        background: 'rgba(139, 92, 246, 0.1)',
        borderRadius: '12px',
        border: '1px solid rgba(139, 92, 246, 0.2)',
      }}>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          💡 <strong>Tip:</strong> Toggle dark mode in your system preferences to see how these components adapt to both themes!
        </p>
      </div>
    </div>
  );
};

export default ButtonSearchBarDemoView;

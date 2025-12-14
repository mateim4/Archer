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
          Button Variants - Frosted Glass Aesthetic
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          All buttons feature frosted glass transparency, subtle glow effects, and smooth hover animations.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px' }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Primary (Purple)</p>
            <EnhancedPurpleGlassButton variant="primary">
              Primary Button
            </EnhancedPurpleGlassButton>
          </div>

          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Secondary (Frosted White)</p>
            <EnhancedPurpleGlassButton variant="secondary">
              Secondary Button
            </EnhancedPurpleGlassButton>
          </div>

          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Danger (Red)</p>
            <EnhancedPurpleGlassButton variant="danger">
              Danger Button
            </EnhancedPurpleGlassButton>
          </div>

          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Success (Green)</p>
            <EnhancedPurpleGlassButton variant="success">
              Success Button
            </EnhancedPurpleGlassButton>
          </div>

          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Info (Blue)</p>
            <EnhancedPurpleGlassButton variant="info">
              Info Button
            </EnhancedPurpleGlassButton>
          </div>

          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Ghost (Subtle)</p>
            <EnhancedPurpleGlassButton variant="ghost">
              Ghost Button
            </EnhancedPurpleGlassButton>
          </div>

          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Link (Text Only)</p>
            <EnhancedPurpleGlassButton variant="link">
              Link Button
            </EnhancedPurpleGlassButton>
          </div>
        </div>
      </section>

      {/* Frosted Glass Showcase - Different Backgrounds */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>
          Frosted Glass on Different Backgrounds
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          The transparent frosted effect really shines when placed over colorful or patterned backgrounds.
        </p>

        {/* Gradient Background */}
        <div style={{
          padding: '40px',
          marginBottom: '16px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        }}>
          <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: 'white' }}>
            Purple/Pink Gradient Background
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <EnhancedPurpleGlassButton variant="primary">Primary</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="secondary">Secondary</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="danger">Danger</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="success">Success</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="info">Info</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="ghost">Ghost</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="link">Link</EnhancedPurpleGlassButton>
          </div>
        </div>

        {/* Dark Background */}
        <div style={{
          padding: '40px',
          marginBottom: '16px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        }}>
          <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: 'white' }}>
            Dark Blue Background
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <EnhancedPurpleGlassButton variant="primary">Primary</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="secondary">Secondary</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="danger">Danger</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="success">Success</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="info">Info</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="ghost">Ghost</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="link">Link</EnhancedPurpleGlassButton>
          </div>
        </div>

        {/* Image/Pattern Background */}
        <div style={{
          padding: '40px',
          marginBottom: '16px',
          borderRadius: '16px',
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 1%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.2) 1%, transparent 50%),
            linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)
          `,
        }}>
          <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: 'white' }}>
            Patterned Dark Background
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <EnhancedPurpleGlassButton variant="primary">Primary</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="secondary">Secondary</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="danger">Danger</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="success">Success</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="info">Info</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="ghost">Ghost</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="link">Link</EnhancedPurpleGlassButton>
          </div>
        </div>

        {/* Light/Warm Background */}
        <div style={{
          padding: '40px',
          marginBottom: '16px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)',
        }}>
          <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#78350f' }}>
            Light/Warm Background (Amber)
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <EnhancedPurpleGlassButton variant="primary">Primary</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="secondary">Secondary</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="danger">Danger</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="success">Success</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="info">Info</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="ghost">Ghost</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="link">Link</EnhancedPurpleGlassButton>
          </div>
        </div>

        {/* Neutral Gray Background */}
        <div style={{
          padding: '40px',
          marginBottom: '16px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 50%, #d1d5db 100%)',
        }}>
          <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
            Neutral Gray Background
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <EnhancedPurpleGlassButton variant="primary">Primary</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="secondary">Secondary</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="danger">Danger</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="success">Success</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="info">Info</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="ghost">Ghost</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="link">Link</EnhancedPurpleGlassButton>
          </div>
        </div>

        {/* Cool Teal/Cyan Background */}
        <div style={{
          padding: '40px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #2dd4bf 100%)',
        }}>
          <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: 'white' }}>
            Teal/Cyan Background
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <EnhancedPurpleGlassButton variant="primary">Primary</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="secondary">Secondary</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="danger">Danger</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="success">Success</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="info">Info</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="ghost">Ghost</EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton variant="link">Link</EnhancedPurpleGlassButton>
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

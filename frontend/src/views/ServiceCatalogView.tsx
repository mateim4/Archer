import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PurpleGlassCard, 
  PurpleGlassButton, 
  PageHeader,
  EnhancedPurpleGlassSearchBar
} from '../components/ui';
import { 
  SearchRegular,
  GridRegular,
  ListRegular,
  FilterRegular,
  AppsRegular,
  LaptopRegular,
  KeyRegular,
  CloudRegular,
  DatabaseRegular,
  PersonRegular,
  ShieldRegular,
  BookRegular,
  CalendarClockRegular,
  MoneyRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  ClockRegular,
  CartRegular
} from '@fluentui/react-icons';
import { apiClient, CatalogCategory, CatalogItem } from '../utils/apiClient';
import { useEnhancedUX } from '../hooks/useEnhancedUX';

// Icon mapping for categories
const ICON_MAP: Record<string, React.ReactElement> = {
  'Laptop': <LaptopRegular />,
  'Apps': <AppsRegular />,
  'LockClosed': <KeyRegular />,
  'Shield': <ShieldRegular />,
  'Cloud': <CloudRegular />,
  'Database': <DatabaseRegular />,
  'Book': <BookRegular />,
  'Person': <PersonRegular />,
};

const ServiceCatalogView: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useEnhancedUX();

  // Helper functions for toast notifications
  const showError = (message: string) => showToast(message, 'error');
  const showSuccess = (message: string) => showToast(message, 'success');

  // State
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load items when category changes
  useEffect(() => {
    if (selectedCategory !== null) {
      loadCatalogItems();
    } else {
      loadAllItems();
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCatalogCategories({ is_active: true });
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
      showError('Failed to load service categories');
    } finally {
      setLoading(false);
    }
  };

  const loadAllItems = async () => {
    try {
      setItemsLoading(true);
      const response = await apiClient.getCatalogItems({ 
        is_active: true,
        search: searchQuery || undefined 
      });
      setCatalogItems(response.data);
    } catch (error) {
      console.error('Failed to load catalog items:', error);
      showError('Failed to load catalog items');
    } finally {
      setItemsLoading(false);
    }
  };

  const loadCatalogItems = async () => {
    if (!selectedCategory) return;
    
    try {
      setItemsLoading(true);
      const response = await apiClient.getCatalogItems({ 
        category_id: selectedCategory,
        is_active: true,
        search: searchQuery || undefined 
      });
      setCatalogItems(response.data);
    } catch (error) {
      console.error('Failed to load catalog items:', error);
      showError('Failed to load catalog items');
    } finally {
      setItemsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategory) {
      loadCatalogItems();
    } else {
      loadAllItems();
    }
  };

  const handleRequestItem = (item: CatalogItem) => {
    // Navigate to request form
    navigate(`/app/service-catalog/request/${extractId(item.id!)}`);
  };

  const extractId = (fullId: string): string => {
    // Extract ID from "table:id" format
    return fullId.includes(':') ? fullId.split(':')[1] : fullId;
  };

  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getIcon = (iconName: string | undefined): React.ReactElement => {
    if (!iconName) return <AppsRegular />;
    return ICON_MAP[iconName] || <AppsRegular />;
  };

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '1400px', 
      margin: '0 auto',
    }}>
      {/* Header - Dashboard Style */}
      <PageHeader
        icon={<CartRegular style={{ fontSize: '32px' }} />}
        title="Service Catalog"
        subtitle="Browse and request IT services and resources"
        actions={
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <PurpleGlassButton
              variant="ghost"
              onClick={() => navigate('/app/my-requests')}
            >
              <ListRegular style={{ marginRight: '8px' }} />
              My Requests
            </PurpleGlassButton>
          </div>
        }
      >
        {/* Search and Category Filter Row */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: '300px' }}>
            <div style={{ flex: 1 }}>
              <EnhancedPurpleGlassSearchBar
                placeholder="Search services..."
                value={searchQuery}
                onChange={(value) => setSearchQuery(value)}
                showClearButton
              />
            </div>
            <PurpleGlassButton type="submit">
              <SearchRegular style={{ marginRight: '8px' }} />
              Search
            </PurpleGlassButton>
          </form>
          
          {/* Category Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                background: selectedCategory === null 
                  ? 'var(--brand-primary)' 
                  : 'var(--card-bg)',
                color: selectedCategory === null 
                  ? 'white' 
                  : 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.15s ease',
              }}
            >
              <GridRegular />
              All
            </button>
            {categories.slice(0, 5).map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(extractId(category.id!))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  background: selectedCategory === extractId(category.id!) 
                    ? 'var(--brand-primary)' 
                    : 'var(--card-bg)',
                  color: selectedCategory === extractId(category.id!) 
                    ? 'white' 
                    : 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.15s ease',
                }}
              >
                {getIcon(category.icon)}
                {category.name}
              </button>
            ))}
          </div>
          
          {/* View Toggle */}
          <div style={{ 
            display: 'flex', 
            gap: '4px',
            padding: '4px',
            background: 'var(--card-bg)',
            borderRadius: '8px'
          }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                padding: '8px',
                border: 'none',
                borderRadius: '6px',
                background: viewMode === 'grid' ? 'var(--brand-primary)' : 'transparent',
                color: viewMode === 'grid' ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <GridRegular />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                padding: '8px',
                border: 'none',
                borderRadius: '6px',
                background: viewMode === 'list' ? 'var(--brand-primary)' : 'transparent',
                color: viewMode === 'list' ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ListRegular />
            </button>
          </div>
        </div>
      </PageHeader>

      {/* Catalog Items */}
      {itemsLoading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div className="spinner" />
          <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>
            Loading services...
          </p>
        </div>
      ) : catalogItems.length === 0 ? (
        <PurpleGlassCard>
          <div style={{ padding: '80px', textAlign: 'center' }}>
            <ErrorCircleRegular style={{ fontSize: '48px', color: 'var(--text-secondary)' }} />
            <h3 style={{ 
              marginTop: '16px', 
              fontSize: '20px',
              color: 'var(--text-primary)'
            }}>
              No services found
            </h3>
            <p style={{ 
              marginTop: '8px', 
              color: 'var(--text-secondary)'
            }}>
              {searchQuery 
                ? `No services match your search "${searchQuery}"`
                : 'There are no services available in this category'}
            </p>
          </div>
        </PurpleGlassCard>
      ) : (
        <div style={{
          display: viewMode === 'grid' ? 'grid' : 'flex',
          gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(350px, 1fr))' : undefined,
          flexDirection: viewMode === 'list' ? 'column' : undefined,
          gap: '20px'
        }}>
          {catalogItems.map(item => (
            <PurpleGlassCard key={item.id}>
              <div style={{ 
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}>
                {/* Icon */}
                <div style={{ 
                  marginBottom: '16px',
                  fontSize: '40px',
                  color: 'var(--brand-primary)'
                }}>
                  {getIcon(item.icon)}
                </div>

                {/* Title */}
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: 'var(--text-primary)'
                }}>
                  {item.name}
                </h3>

                {/* Short Description */}
                <p style={{ 
                  fontSize: '14px', 
                  color: 'var(--text-secondary)',
                  marginBottom: '16px',
                  flex: 1
                }}>
                  {item.short_description}
                </p>

                {/* Metadata */}
                <div style={{ 
                  display: 'flex',
                  gap: '16px',
                  marginBottom: '16px',
                  flexWrap: 'wrap'
                }}>
                  {item.delivery_time_days && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontSize: '12px',
                      color: 'var(--text-secondary)'
                    }}>
                      <CalendarClockRegular />
                      <span>{item.delivery_time_days} days</span>
                    </div>
                  )}
                  {item.cost !== undefined && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontSize: '12px',
                      color: 'var(--text-secondary)'
                    }}>
                      <MoneyRegular />
                      <span>{formatCurrency(item.cost)}</span>
                    </div>
                  )}
                  {item.approval_required && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontSize: '12px',
                      color: 'var(--warning-text, #f59e0b)'
                    }}>
                      <ClockRegular />
                      <span>Approval required</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <PurpleGlassButton 
                  onClick={() => handleRequestItem(item)}
                  style={{ width: '100%' }}
                >
                  Request This Service
                </PurpleGlassButton>
              </div>
            </PurpleGlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceCatalogView;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PurpleGlassCard, 
  PurpleGlassButton, 
  PurpleGlassInput 
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
  ClockRegular
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
  const { showToast, showError, showSuccess } = useEnhancedUX();

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
      padding: 'var(--spacing-6)', 
      maxWidth: '1800px', 
      margin: '0 auto',
      display: 'flex',
      gap: 'var(--spacing-6)',
      minHeight: 'calc(100vh - 100px)'
    }}>
      {/* Left Sidebar - Categories */}
      <div style={{ 
        width: '280px', 
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-4)'
      }}>
        <PurpleGlassCard>
          <div style={{ padding: 'var(--spacing-5)' }}>
            <h2 style={{ 
              fontSize: 'var(--font-size-600)', 
              fontWeight: 600,
              marginBottom: 'var(--spacing-4)',
              color: 'var(--color-text-primary)'
            }}>
              Categories
            </h2>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-4)' }}>
                <div className="spinner" />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                {/* All Items */}
                <button
                  onClick={() => setSelectedCategory(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-3)',
                    padding: 'var(--spacing-3)',
                    border: 'none',
                    borderRadius: 'var(--border-radius-medium)',
                    background: selectedCategory === null 
                      ? 'var(--color-primary-alpha-10)' 
                      : 'transparent',
                    color: selectedCategory === null 
                      ? 'var(--color-primary)' 
                      : 'var(--color-text-primary)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-300)',
                    fontWeight: selectedCategory === null ? 600 : 400,
                    transition: 'all var(--duration-fast)',
                    textAlign: 'left'
                  }}
                >
                  <GridRegular style={{ fontSize: '20px' }} />
                  <span>All Services</span>
                </button>

                {/* Category List */}
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(extractId(category.id!))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-3)',
                      padding: 'var(--spacing-3)',
                      border: 'none',
                      borderRadius: 'var(--border-radius-medium)',
                      background: selectedCategory === extractId(category.id!) 
                        ? 'var(--color-primary-alpha-10)' 
                        : 'transparent',
                      color: selectedCategory === extractId(category.id!) 
                        ? 'var(--color-primary)' 
                        : 'var(--color-text-primary)',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-300)',
                      fontWeight: selectedCategory === extractId(category.id!) ? 600 : 400,
                      transition: 'all var(--duration-fast)',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>
                      {getIcon(category.icon)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div>{category.name}</div>
                      {category.description && (
                        <div style={{ 
                          fontSize: 'var(--font-size-200)', 
                          color: 'var(--color-text-secondary)',
                          marginTop: 'var(--spacing-1)'
                        }}>
                          {category.description}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </PurpleGlassCard>

        {/* Quick Actions */}
        <PurpleGlassCard>
          <div style={{ padding: 'var(--spacing-5)' }}>
            <h3 style={{ 
              fontSize: 'var(--font-size-400)', 
              fontWeight: 600,
              marginBottom: 'var(--spacing-3)',
              color: 'var(--color-text-primary)'
            }}>
              Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
              <PurpleGlassButton
                appearance="subtle"
                onClick={() => navigate('/app/my-requests')}
                style={{ justifyContent: 'flex-start' }}
              >
                <ListRegular style={{ marginRight: 'var(--spacing-2)' }} />
                My Requests
              </PurpleGlassButton>
            </div>
          </div>
        </PurpleGlassCard>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
        {/* Header */}
        <div>
          <h1 style={{ 
            fontSize: 'var(--font-size-900)', 
            fontWeight: 700,
            marginBottom: 'var(--spacing-2)',
            color: 'var(--color-text-primary)'
          }}>
            Service Catalog
          </h1>
          <p style={{ 
            fontSize: 'var(--font-size-400)', 
            color: 'var(--color-text-secondary)'
          }}>
            Browse and request IT services and resources
          </p>
        </div>

        {/* Search and View Controls */}
        <PurpleGlassCard>
          <div style={{ padding: 'var(--spacing-5)' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <PurpleGlassInput
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<SearchRegular />}
                />
              </div>
              <PurpleGlassButton type="submit">
                <SearchRegular style={{ marginRight: 'var(--spacing-2)' }} />
                Search
              </PurpleGlassButton>
              <div style={{ 
                display: 'flex', 
                gap: 'var(--spacing-2)',
                padding: 'var(--spacing-2)',
                background: 'var(--color-neutral-alpha-5)',
                borderRadius: 'var(--border-radius-medium)'
              }}>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: 'var(--spacing-2)',
                    border: 'none',
                    borderRadius: 'var(--border-radius-small)',
                    background: viewMode === 'grid' ? 'var(--color-primary-alpha-10)' : 'transparent',
                    color: viewMode === 'grid' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
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
                    padding: 'var(--spacing-2)',
                    border: 'none',
                    borderRadius: 'var(--border-radius-small)',
                    background: viewMode === 'list' ? 'var(--color-primary-alpha-10)' : 'transparent',
                    color: viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ListRegular />
                </button>
              </div>
            </form>
          </div>
        </PurpleGlassCard>

        {/* Catalog Items */}
        {itemsLoading ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-10)' }}>
            <div className="spinner" />
            <p style={{ marginTop: 'var(--spacing-4)', color: 'var(--color-text-secondary)' }}>
              Loading services...
            </p>
          </div>
        ) : catalogItems.length === 0 ? (
          <PurpleGlassCard>
            <div style={{ padding: 'var(--spacing-10)', textAlign: 'center' }}>
              <ErrorCircleRegular style={{ fontSize: '48px', color: 'var(--color-text-secondary)' }} />
              <h3 style={{ 
                marginTop: 'var(--spacing-4)', 
                fontSize: 'var(--font-size-600)',
                color: 'var(--color-text-primary)'
              }}>
                No services found
              </h3>
              <p style={{ 
                marginTop: 'var(--spacing-2)', 
                color: 'var(--color-text-secondary)'
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
            gap: 'var(--spacing-5)'
          }}>
            {catalogItems.map(item => (
              <PurpleGlassCard key={item.id}>
                <div style={{ 
                  padding: 'var(--spacing-5)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}>
                  {/* Icon */}
                  <div style={{ 
                    marginBottom: 'var(--spacing-4)',
                    fontSize: '40px',
                    color: 'var(--color-primary)'
                  }}>
                    {getIcon(item.icon)}
                  </div>

                  {/* Title */}
                  <h3 style={{ 
                    fontSize: 'var(--font-size-500)', 
                    fontWeight: 600,
                    marginBottom: 'var(--spacing-2)',
                    color: 'var(--color-text-primary)'
                  }}>
                    {item.name}
                  </h3>

                  {/* Short Description */}
                  <p style={{ 
                    fontSize: 'var(--font-size-300)', 
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--spacing-4)',
                    flex: 1
                  }}>
                    {item.short_description}
                  </p>

                  {/* Metadata */}
                  <div style={{ 
                    display: 'flex',
                    gap: 'var(--spacing-4)',
                    marginBottom: 'var(--spacing-4)',
                    flexWrap: 'wrap'
                  }}>
                    {item.delivery_time_days && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 'var(--spacing-2)',
                        fontSize: 'var(--font-size-200)',
                        color: 'var(--color-text-secondary)'
                      }}>
                        <CalendarClockRegular />
                        <span>{item.delivery_time_days} days</span>
                      </div>
                    )}
                    {item.cost !== undefined && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 'var(--spacing-2)',
                        fontSize: 'var(--font-size-200)',
                        color: 'var(--color-text-secondary)'
                      }}>
                        <MoneyRegular />
                        <span>{formatCurrency(item.cost)}</span>
                      </div>
                    )}
                    {item.approval_required && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 'var(--spacing-2)',
                        fontSize: 'var(--font-size-200)',
                        color: 'var(--color-warning)'
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
    </div>
  );
};

export default ServiceCatalogView;

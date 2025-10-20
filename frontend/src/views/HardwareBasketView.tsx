import React, { useEffect, useState, useMemo } from 'react';
import { apiClient } from '../utils/apiClient';
import GlassmorphicSearchBar from '../components/GlassmorphicSearchBar';
import { DESIGN_TOKENS } from '../components/DesignSystem';
import { DesignTokens } from '../styles/designSystem';
import {
  ErrorCircleRegular,
  SearchRegular,
  DataBarHorizontalRegular,
  ArrowUploadRegular,
  DocumentRegular,
  CheckmarkCircleRegular,
  DatabaseRegular
} from '@fluentui/react-icons';

interface HardwareBasket {
  id: string;
  name: string;
  vendor: string;
  quarter: string;
  year: number;
  filename: string;
  quotation_date: string;
  created_at: string;
  total_models: number;
  total_configurations: number;
}

interface HardwareModel {
  id: string;
  basket_id: string;
  lot_description: string;
  model_name: string;
  model_number: string;
  category: string;
  form_factor: string;
  vendor: string;
  processor_info: string;
  ram_info: string;
  network_info: string;
  quotation_date: string;
  created_at?: string;
  updated_at?: string;
  base_specifications?: any;
}

interface CreateHardwareBasketRequest {
  name: string;
  vendor: string;
  quarter: string;
  year: number;
}

interface UploadProgress { 
  stage: string; 
  progress: number; 
  message: string; 
}

const HardwareBasketView: React.FC = () => {
  const [hardwareBaskets, setHardwareBaskets] = useState<HardwareBasket[]>([]);
  const [selectedBasket, setSelectedBasket] = useState<HardwareBasket | null>(null);
  const [hardwareModels, setHardwareModels] = useState<HardwareModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState<string>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');
  
  // Form state
  const [newBasket, setNewBasket] = useState<CreateHardwareBasketRequest>({
    name: '',
    vendor: '',
    quarter: 'Q1',
    year: new Date().getFullYear()
  });

  useEffect(() => {
    fetchHardwareBaskets();
  }, []);

  const fetchHardwareBaskets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const baskets = await apiClient.getHardwareBaskets();
      setHardwareBaskets(baskets);
      
      if (apiClient.isUsingMockData()) {
        setSuccess('Using demo data - backend not connected');
      } else if (baskets.length === 0) {
        setSuccess('No hardware baskets found in database');
      }
    } catch (error) {
      console.error('Failed to fetch hardware baskets:', error);
      setError('Failed to load hardware baskets. Please check your connection and try again.');
      setHardwareBaskets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFile = (basketId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      setIsUploading(true);
      setUploadProgress({
        stage: 'Uploading',
        progress: 0,
        message: 'Preparing file upload...'
      });
      
      try {
        const response = await apiClient.uploadHardwareBasketFile(basketId, file);
        setSuccess(`File uploaded successfully: ${file.name}`);
        fetchHardwareBaskets();
      } catch (error) {
        setError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
      }
    };
    input.click();
  };

  const handleCreateBasket = async () => {
    if (!newBasket.name || !newBasket.vendor) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await apiClient.createHardwareBasket(newBasket);
      
      // Refresh the list
      await fetchHardwareBaskets();
      
      // Reset form and close dialog
      setShowCreateDialog(false);
      setNewBasket({ name: '', vendor: '', quarter: 'Q1', year: new Date().getFullYear() });
      setSuccess('Hardware basket created successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to create hardware basket:', error);
      setError('Failed to create hardware basket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (basketId: string, file: File) => {
    // Validate file type
    const allowedTypes = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(fileExtension)) {
      setError('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress({ stage: 'Uploading file...', progress: 10, message: 'Preparing upload' });
      
      setUploadProgress({ stage: 'Processing...', progress: 50, message: 'Uploading and parsing file' });
      
      await apiClient.uploadHardwareBasketFile(basketId, file);
      
      setUploadProgress({ stage: 'Complete', progress: 100, message: 'File uploaded successfully' });
      
      // Refresh the baskets list
      await fetchHardwareBaskets();
      
      setSuccess('File uploaded and processed successfully');
      setShowUploadDialog(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to upload file:', error);
      setError(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUploadProgress(null);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(null), 2000);
    }
  };

  // Filter and search logic
  const filteredBaskets = useMemo(() => {
    let filtered = hardwareBaskets;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(basket =>
        (basket.name && basket.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (basket.vendor && basket.vendor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (basket.filename && basket.filename.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Vendor filter
    if (vendorFilter !== 'All') {
      filtered = filtered.filter(basket => basket.vendor === vendorFilter);
    }

    // Year filter
    if (yearFilter !== 'All') {
      filtered = filtered.filter(basket => basket.year.toString() === yearFilter);
    }

    return filtered;
  }, [hardwareBaskets, searchTerm, vendorFilter, yearFilter]);

  // Get unique vendors and years for filters
  const uniqueVendors = useMemo(() => {
    const vendors = Array.from(new Set(hardwareBaskets.map(basket => basket.vendor)));
    return vendors.sort();
  }, [hardwareBaskets]);

  const uniqueYears = useMemo(() => {
    const years = Array.from(new Set(hardwareBaskets.map(basket => basket.year.toString())));
    return years.sort((a, b) => parseInt(b) - parseInt(a));
  }, [hardwareBaskets]);

  const getVendorColor = (vendor: string) => {
    switch (vendor.toLowerCase()) {
      case 'dell': return '#007db8';
      case 'hpe': return '#01a982';
      case 'lenovo': return '#e2231a';
      case 'cisco': return '#1ba0d7';
      default: return '#6366f1';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && hardwareBaskets.length === 0) {
    return (
      <div style={DesignTokens.components.pageContainer}>
        <div style={{ 
          fontSize: '18px',
          color: '#6366f1',
          fontFamily: 'Oxanium, sans-serif',
          textAlign: 'center'
        }}>
          🔄 Loading hardware baskets...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={DesignTokens.components.pageContainer}>
        <div style={{ 
          color: '#ef4444',
          fontSize: '16px',
          fontFamily: 'Oxanium, sans-serif'
        }}>
          <ErrorCircleRegular style={{ marginRight: '8px' }} />Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div style={DesignTokens.components.pageContainer}>
      {/* Header */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: DesignTokens.spacing.xl,
        borderBottom: `2px solid ${DesignTokens.colors.primary}20`,
        paddingBottom: DesignTokens.spacing.lg
      }}>
        <h1 style={{ 
          fontSize: DesignTokens.typography.xxxl,
          fontWeight: DesignTokens.typography.semibold,
          color: '#8b5cf6',
          margin: '0',
          fontFamily: DesignTokens.typography.fontFamily,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <DatabaseRegular style={{ fontSize: '32px', color: '#000000' }} />
          Hardware Basket Management
        </h1>
        
        <button
          onClick={() => setShowCreateDialog(true)}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontFamily: 'Oxanium, sans-serif'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.3)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={{ color: 'white' }}>+</span> Create Hardware Basket
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* Glassmorphic Search Input */}
        <div style={{ flex: '1', minWidth: '320px' }}>
          <GlassmorphicSearchBar
            value={searchTerm}
            onChange={(value) => setSearchTerm(value)}
            placeholder="Search baskets by name, vendor, or filename..."
            width="100%"
          />
        </div>

        {/* Vendor Filter */}
        <div style={{ minWidth: '140px' }}>
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            style={{
              ...DesignTokens.components.standardCard,
              padding: '14px 20px',
              fontSize: '14px',
              fontFamily: 'Oxanium, sans-serif',
              cursor: 'pointer',
              outline: 'none',
              color: '#1f2937',
              width: '100%'
            }}
          >
            <option value="All">All Vendors</option>
            {uniqueVendors.map(vendor => (
              <option key={vendor} value={vendor}>{vendor}</option>
            ))}
          </select>
        </div>

        {/* Year Filter */}
        <div style={{ minWidth: '120px' }}>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            style={{
              ...DesignTokens.components.standardCard,
              padding: '14px 20px',
              fontSize: '14px',
              fontFamily: 'Oxanium, sans-serif',
              cursor: 'pointer',
              outline: 'none',
              color: '#1f2937',
              width: '100%'
            }}
          >
            <option value="All">All Years</option>
            {uniqueYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {(searchTerm || vendorFilter !== 'All' || yearFilter !== 'All') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setVendorFilter('All');
              setYearFilter('All');
            }}
            style={{
              ...DesignTokens.components.standardCard,
              padding: '14px 20px',
              color: '#6366f1',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              fontFamily: 'Oxanium, sans-serif'
            }}
            onMouseEnter={(e) => {
              const target = e.currentTarget as HTMLElement;
              Object.assign(target.style, DesignTokens.components.standardCardHover);
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLElement;
              Object.assign(target.style, {
                ...DesignTokens.components.standardCard,
                padding: '14px 20px',
                color: '#6366f1',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                fontFamily: 'Oxanium, sans-serif'
              });
            }}
          >
            🧹 Clear Filters
          </button>
        )}
      </div>

      {/* Results Summary */}
      <div style={{
        ...DesignTokens.components.standardCard,
        marginBottom: '20px',
        cursor: 'default'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#6366f1',
            fontFamily: 'Oxanium, sans-serif'
          }}>
            <DataBarHorizontalRegular style={{ marginRight: '8px' }} />Showing {filteredBaskets.length} of {hardwareBaskets.length} baskets
            {(searchTerm || vendorFilter !== 'All' || yearFilter !== 'All') && (
              <span style={{ color: '#8b5cf6', marginLeft: '8px' }}>
                (filtered)
              </span>
            )}
          </div>
          
          <div style={{
            display: 'flex',
            gap: '16px',
            fontSize: '12px',
            fontFamily: 'Oxanium, sans-serif'
          }}>
            <span style={{ color: '#007db8' }}>
              🔷 Dell: {filteredBaskets.filter(b => b.vendor === 'Dell').length}
            </span>
            <span style={{ color: '#01a982' }}>
              🟢 HPE: {filteredBaskets.filter(b => b.vendor === 'HPE').length}
            </span>
            <span style={{ color: '#e2231a' }}>
              🔴 Lenovo: {filteredBaskets.filter(b => b.vendor === 'Lenovo').length}
            </span>
          </div>
        </div>
      </div>

      {/* Hardware Baskets Grid */}
      {hardwareBaskets.length === 0 ? (
        <div style={{
          ...DESIGN_TOKENS.components.standardContentCard,
          textAlign: 'center',
          padding: '60px 20px',
          border: '2px dashed rgba(255, 255, 255, 0.4)',
          cursor: 'default'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            📦
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: '500',
            color: '#6366f1',
            marginBottom: '8px',
            fontFamily: 'Oxanium, sans-serif'
          }}>
            No Hardware Baskets Found
          </div>
          <div style={{
            fontSize: '14px',
            color: '#64748b',
            marginBottom: '24px',
            fontFamily: 'Oxanium, sans-serif'
          }}>
            Create your first hardware basket to get started with vendor data management.
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: 'Oxanium, sans-serif'
            }}
          >
            <span style={{ color: 'white' }}>+</span> Create Your First Basket
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '20px'
        }}>
          {filteredBaskets.map((basket) => (
            <div
              key={basket.id}
              style={{
                ...DESIGN_TOKENS.components.standardCard,
                padding: '20px'
              }}
              onMouseOver={(e) => {
                Object.assign(e.currentTarget.style, DESIGN_TOKENS.components.standardCardHover);
              }}
              onMouseOut={(e) => {
                Object.assign(e.currentTarget.style, DESIGN_TOKENS.components.standardCard);
                e.currentTarget.style.padding = '20px';
              }}
              onClick={() => setSelectedBasket(basket)}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    background: getVendorColor(basket.vendor),
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {basket.vendor}
                  </span>
                  <span style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#6366f1',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: '500'
                  }}>
                    {basket.quarter} {basket.year}
                  </span>
                </div>
                <button
                  onClick={() => handleUploadFile(basket.id)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    color: '#6366f1',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <ArrowUploadRegular style={{ marginRight: '8px' }} />Upload
                </button>
              </div>

              {/* Basket Name */}
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '8px',
                fontFamily: 'Oxanium, sans-serif',
                lineHeight: '1.4'
              }}>
                {basket.name}
              </div>

              {/* File Info */}
              <div style={{
                fontSize: '13px',
                color: '#64748b',
                marginBottom: '12px',
                fontFamily: 'Oxanium, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <DocumentRegular style={{ marginRight: '8px' }} />{basket.filename}
              </div>

              {/* Stats */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <div style={{
                  textAlign: 'center',
                  flex: 1
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#6366f1'
                  }}>
                    {basket.total_models}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Models
                  </div>
                </div>
                <div style={{
                  textAlign: 'center',
                  flex: 1
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#8b5cf6'
                  }}>
                    {basket.total_configurations}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Configs
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{
                fontSize: '12px',
                color: '#64748b',
                fontFamily: 'Oxanium, sans-serif',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '12px',
                borderTop: '1px solid rgba(99, 102, 241, 0.1)'
              }}>
                <span>📅 {formatDate(basket.quotation_date)}</span>
                <span>⏰ {formatDate(basket.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Basket Dialog */}
      {showCreateDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            ...DESIGN_TOKENS.components.standardContentCard,
            width: '400px',
            cursor: 'default'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#6366f1',
              marginBottom: '20px',
              fontFamily: 'Oxanium, sans-serif'
            }}>
              📦 Create Hardware Basket
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Basket Name *
              </label>
              <input
                type="text"
                value={newBasket.name}
                onChange={(e) => setNewBasket({ ...newBasket, name: e.target.value })}
                placeholder="e.g., Dell PowerEdge R750 Q2 2024"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: 'rgba(255, 255, 255, 0.8)'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Vendor *
              </label>
              <select
                value={newBasket.vendor}
                onChange={(e) => setNewBasket({ ...newBasket, vendor: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: 'rgba(255, 255, 255, 0.8)'
                }}
              >
                <option value="">Select Vendor</option>
                <option value="Dell">Dell</option>
                <option value="HPE">HPE</option>
                <option value="Lenovo">Lenovo</option>
                <option value="Cisco">Cisco</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Quarter
                </label>
                <select
                  value={newBasket.quarter}
                  onChange={(e) => setNewBasket({ ...newBasket, quarter: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'rgba(255, 255, 255, 0.8)'
                  }}
                >
                  <option value="Q1">Q1</option>
                  <option value="Q2">Q2</option>
                  <option value="Q3">Q3</option>
                  <option value="Q4">Q4</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Year
                </label>
                <input
                  type="number"
                  value={newBasket.year}
                  onChange={(e) => setNewBasket({ ...newBasket, year: parseInt(e.target.value) })}
                  min="2020"
                  max="2030"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'rgba(255, 255, 255, 0.8)'
                  }}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowCreateDialog(false)}
                style={{
                  padding: '10px 20px',
                  border: '2px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '6px',
                  background: 'transparent',
                  color: '#6366f1',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBasket}
                disabled={loading || !newBasket.name || !newBasket.vendor}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: (loading || !newBasket.name || !newBasket.vendor) ? 0.6 : 1
                }}
              >
                {loading ? 'Creating...' : 'Create Basket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Dialog */}
      {showUploadDialog && selectedBasket && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            ...DESIGN_TOKENS.components.standardContentCard,
            width: '400px',
            cursor: 'default'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#6366f1',
              marginBottom: '20px',
              fontFamily: 'Oxanium, sans-serif'
            }}>
              <ArrowUploadRegular style={{ marginRight: '8px' }} />Upload File to {selectedBasket.name}
            </h2>

            <div style={{
              border: '2px dashed rgba(99, 102, 241, 0.3)',
              borderRadius: '8px',
              padding: '40px 20px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}><DocumentRegular /></div>
              <div style={{
                fontSize: '14px',
                color: '#64748b',
                marginBottom: '16px'
              }}>
                Drag and drop your Excel file here, or click to browse
              </div>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(selectedBasket.id, file);
                  }
                }}
                style={{ display: 'none' }}
                id="file-input"
              />
              <label
                htmlFor="file-input"
                style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Select File
              </label>
            </div>

            {uploadProgress && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '14px', color: '#374151' }}>
                    {uploadProgress.stage}
                  </span>
                  <span style={{ fontSize: '14px', color: '#6366f1' }}>
                    {uploadProgress.progress}%
                  </span>
                </div>
                <div style={{
                  height: '8px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div
                    style={{
                      height: '100%',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      width: `${uploadProgress.progress}%`,
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#64748b',
                  marginTop: '4px'
                }}>
                  {uploadProgress.message}
                </div>
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowUploadDialog(false);
                  setUploadProgress(null);
                }}
                disabled={isUploading}
                style={{
                  padding: '10px 20px',
                  border: '2px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '6px',
                  background: 'transparent',
                  color: '#6366f1',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isUploading ? 0.6 : 1
                }}
              >
                {isUploading ? 'Uploading...' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
          zIndex: 1001
        }}>
          <CheckmarkCircleRegular style={{ marginRight: '8px' }} />{success}
        </div>
      )}

      {/* Summary Stats */}
      <div style={{ 
        marginTop: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        <div style={{
          ...DESIGN_TOKENS.components.standardContentCard,
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))',
          textAlign: 'center',
          cursor: 'default'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#10b981' }}>
            {hardwareBaskets.reduce((sum, basket) => sum + basket.total_models, 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>
            Total Models
          </div>
        </div>

        <div style={{
          ...DESIGN_TOKENS.components.standardContentCard,
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(124, 58, 237, 0.1))',
          textAlign: 'center',
          cursor: 'default'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#8b5cf6' }}>
            {hardwareBaskets.reduce((sum, basket) => sum + basket.total_configurations, 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>
            Total Configurations
          </div>
        </div>

        <div style={{
          ...DESIGN_TOKENS.components.standardContentCard,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(79, 70, 229, 0.1))',
          textAlign: 'center',
          cursor: 'default'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#6366f1' }}>
            {hardwareBaskets.length}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>
            Total Baskets
          </div>
        </div>

        <div style={{
          ...DESIGN_TOKENS.components.standardContentCard,
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1))',
          textAlign: 'center',
          cursor: 'default'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#f59e0b' }}>
            {uniqueVendors.length}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>
            Unique Vendors
          </div>
        </div>
      </div>
    </div>
  );
};

export default HardwareBasketView;
import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  Button,
  Card,
  CardHeader,
  Title3,
  Text,
  Subtitle2,
  Input,
  Dropdown,
  Option,
  Badge,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  TableColumnDefinition,
  createTableColumn,
  Spinner,
  MessageBar,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  ProgressBar,
  Divider,
  Tooltip
} from '@fluentui/react-components';
import {
  CloudArrowUpRegular,
  FilterRegular,
  SearchRegular,
  DeleteRegular,
  EyeRegular,
  DocumentRegular,
  DataUsageRegular,
  ServerRegular,
  ChevronDownRegular,
  InfoRegular,
  StorageRegular
} from '@fluentui/react-icons';
import GlassmorphicLayout from '../components/GlassmorphicLayout';
import { parseHardwareBasket } from '../utils/hardwareBasketParser';
import type { 
  HardwareBasket, 
  HardwareModel, 
  HardwareConfiguration,
  HardwarePricing,
  ImportResult 
} from '../types/hardwareBasketTypes';

interface UploadProgress {
  stage: string;
  progress: number;
  message: string;
}

const HardwareBasketView: React.FC = () => {
  // State for hardware baskets
  const [hardwareBaskets, setHardwareBaskets] = useState<HardwareBasket[]>([]);
  const [selectedBasket, setSelectedBasket] = useState<HardwareBasket | null>(null);
  const [hardwareModels, setHardwareModels] = useState<HardwareModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // State for subtabs
  const [selectedTab, setSelectedTab] = useState<string>('servers');

  // State for file upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState<string>('All');
  const [quarterFilter, setQuarterFilter] = useState<string>('All');

  // Separate models into servers and extensions
  const serverModels = useMemo(() => {
    return hardwareModels.filter(model => 
      model.category === 'server' || model.lot_description.toLowerCase().includes('server')
    );
  }, [hardwareModels]);

  const extensionModels = useMemo(() => {
    return hardwareModels.filter(model => 
      model.category !== 'server' && !model.lot_description.toLowerCase().includes('server')
    );
  }, [hardwareModels]);

  // Handle tab selection
  const handleTabSelect = (tabValue: string) => {
    setSelectedTab(tabValue);
  };

  // Fetch hardware baskets on component mount
  useEffect(() => {
    fetchHardwareBaskets();
  }, []);

  const fetchHardwareBaskets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/hardware-baskets');
      if (!response.ok) {
        throw new Error('Failed to fetch hardware baskets');
      }
      const data = await response.json();
      setHardwareBaskets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchHardwareModels = async (basketId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/hardware-baskets/${basketId}/models`);
      if (!response.ok) {
        throw new Error('Failed to fetch hardware models');
      }
      const data = await response.json();
      setHardwareModels(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress({ stage: 'Reading file', progress: 10, message: 'Processing Excel file...' });
    setError(null);
    setSuccess(null);

    try {
      // Parse the file on the frontend first
      setUploadProgress({ stage: 'Parsing data', progress: 30, message: 'Analyzing hardware data...' });
      const parsedData = await parseHardwareBasket(file);

      // Step 1: Create a hardware basket first
      const createBasketResponse = await fetch('/api/hardware-baskets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${parsedData.vendor} Hardware Basket - ${parsedData.quarter} ${parsedData.year}`,
          vendor_name: parsedData.vendor,
          quarter: parsedData.quarter,
          year: parsedData.year,
          currency_from: 'USD',
          currency_to: 'USD',
          exchange_rate: 1.0,
        }),
      });

      if (!createBasketResponse.ok) {
        throw new Error(`Failed to create hardware basket: ${createBasketResponse.statusText}`);
      }

      const basket = await createBasketResponse.json();

      // Step 2: Upload the file to the created basket
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/hardware-baskets/${basket.id}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload hardware basket');
      }

      setUploadProgress({ stage: 'Processing', progress: 90, message: 'Saving to database...' });
      const result: ImportResult = await response.json();

      setUploadProgress({ stage: 'Complete', progress: 100, message: 'Upload completed successfully!' });
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(null);
        setShowUploadDialog(false);
        setSuccess(`Successfully imported ${result.total_models} models and ${result.total_configurations} configurations`);
        fetchHardwareBaskets(); // Refresh the list
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDeleteBasket = async (basketId: string) => {
    if (!confirm('Are you sure you want to delete this hardware basket?')) {
      return;
    }

    try {
      const response = await fetch(`/api/hardware-baskets/${basketId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete hardware basket');
      }

      setSuccess('Hardware basket deleted successfully');
      fetchHardwareBaskets();
      if (selectedBasket?.id === basketId) {
        setSelectedBasket(null);
        setHardwareModels([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete basket');
    }
  };

  const handleViewBasket = (basket: HardwareBasket) => {
    setSelectedBasket(basket);
    fetchHardwareModels(basket.id);
  };

  // Filter hardware baskets
  const filteredBaskets = useMemo(() => {
    let filtered = hardwareBaskets;

    if (searchTerm) {
      filtered = filtered.filter(basket =>
        basket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        basket.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        basket.quarter.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (vendorFilter !== 'All') {
      filtered = filtered.filter(basket => basket.vendor === vendorFilter);
    }

    if (quarterFilter !== 'All') {
      filtered = filtered.filter(basket => basket.quarter === quarterFilter);
    }

    return filtered;
  }, [hardwareBaskets, searchTerm, vendorFilter, quarterFilter]);

  // Get unique vendors and quarters for filters
  const vendors = useMemo(() => {
    const uniqueVendors = Array.from(new Set(hardwareBaskets.map(b => b.vendor)));
    return ['All', ...uniqueVendors];
  }, [hardwareBaskets]);

  const quarters = useMemo(() => {
    const uniqueQuarters = Array.from(new Set(hardwareBaskets.map(b => b.quarter)));
    return ['All', ...uniqueQuarters];
  }, [hardwareBaskets]);

  // Define table columns for hardware baskets
  const basketColumns: TableColumnDefinition<HardwareBasket>[] = [
    createTableColumn<HardwareBasket>({
      columnId: "name",
      renderHeaderCell: () => "Name",
      renderCell: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DocumentRegular style={{ color: 'var(--colorBrandBackground)' }} />
          <div>
            <Text weight="semibold">{item.name}</Text>
            <br />
            <Text size={200} style={{ color: 'var(--colorNeutralForeground2)' }}>
              {item.description}
            </Text>
          </div>
        </div>
      ),
    }),
    createTableColumn<HardwareBasket>({
      columnId: "vendor",
      renderHeaderCell: () => "Vendor",
      renderCell: (item) => (
        <Badge appearance="outline" color="brand">
          {item.vendor}
        </Badge>
      ),
    }),
    createTableColumn<HardwareBasket>({
      columnId: "quarter",
      renderHeaderCell: () => "Period",
      renderCell: (item) => (
        <div>
          <Text weight="semibold">{item.quarter}</Text>
          <br />
          <Text size={200}>{item.year}</Text>
        </div>
      ),
    }),
    createTableColumn<HardwareBasket>({
      columnId: "stats",
      renderHeaderCell: () => "Statistics",
      renderCell: (item) => (
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ textAlign: 'center' }}>
            <Text size={300} weight="semibold">{item.total_models || 0}</Text>
            <br />
            <Text size={200}>Models</Text>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Text size={300} weight="semibold">{item.total_configurations || 0}</Text>
            <br />
            <Text size={200}>Configs</Text>
          </div>
        </div>
      ),
    }),
    createTableColumn<HardwareBasket>({
      columnId: "actions",
      renderHeaderCell: () => "Actions",
      renderCell: (item) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            appearance="subtle"
            icon={<EyeRegular />}
            size="small"
            title="View details and models"
            onClick={() => handleViewBasket(item)}
          >
            View Details
          </Button>
          <Button
            appearance="subtle"
            icon={<DeleteRegular />}
            size="small"
            title="Delete this hardware basket"
            onClick={() => handleDeleteBasket(item.id)}
          >
            Delete
          </Button>
        </div>
      ),
    }),
  ];

  // Define table columns for server configurations (Subtab 1)
  const serverColumns: TableColumnDefinition<HardwareModel>[] = [
    createTableColumn<HardwareModel>({
      columnId: "server",
      renderHeaderCell: () => "Server Configuration",
      renderCell: (item) => (
        <div style={{ padding: '12px', border: '1px solid var(--colorNeutralStroke2)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <ServerRegular style={{ color: 'var(--colorBrandBackground)' }} />
            <div style={{ flex: 1 }}>
              <Text weight="semibold" style={{ display: 'block' }}>{item.lot_description}</Text>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                {item.server_model && (
                  <Badge appearance="outline" color="brand">
                    {item.server_model}
                  </Badge>
                )}
                {item.server_size && (
                  <Badge appearance="outline" color="informative">
                    {item.server_size}
                  </Badge>
                )}
                {item.socket_count > 0 && (
                  <Badge appearance="outline" color="success">
                    {item.socket_count}S
                  </Badge>
                )}
                {item.vsan_ready && (
                  <Badge appearance="outline" color="important">
                    VSAN Ready
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Expandable Details */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '16px', 
            paddingTop: '12px',
            borderTop: '1px solid var(--colorNeutralStroke3)'
          }}>
            <div>
              <Text size={200} weight="semibold" style={{ display: 'block', marginBottom: '8px' }}>CPU Details:</Text>
              {item.cpu_model && <Text size={200} style={{ display: 'block' }}>Model: {item.cpu_model}</Text>}
              {item.cpu_cores > 0 && <Text size={200} style={{ display: 'block' }}>Cores: {item.cpu_cores}</Text>}
              {item.cpu_threads > 0 && <Text size={200} style={{ display: 'block' }}>Threads: {item.cpu_threads}</Text>}
              {item.cpu_frequency && <Text size={200} style={{ display: 'block' }}>Frequency: {item.cpu_frequency}</Text>}
            </div>
            <div>
              <Text size={200} weight="semibold" style={{ display: 'block', marginBottom: '8px' }}>Additional Info:</Text>
              {item.processor_info && <Text size={200} style={{ display: 'block' }}>Processor: {item.processor_info}</Text>}
              {item.ram_info && <Text size={200} style={{ display: 'block' }}>RAM: {item.ram_info}</Text>}
              {item.network_info && <Text size={200} style={{ display: 'block' }}>Network: {item.network_info}</Text>}
            </div>
          </div>
        </div>
      ),
    }),
    createTableColumn<HardwareModel>({
      columnId: "pricing",
      renderHeaderCell: () => "Pricing",
      renderCell: (item) => (
        <div style={{ textAlign: 'center' }}>
          <Text weight="semibold" size={300}>Contact for Price</Text>
          <br />
          <Text size={200} style={{ color: 'var(--colorNeutralForeground2)' }}>
            {item.configuration_count || 0} configurations
          </Text>
        </div>
      ),
    }),
  ];

  // Define table columns for extension components (Subtab 2)
  const extensionColumns: TableColumnDefinition<HardwareModel>[] = [
    createTableColumn<HardwareModel>({
      columnId: "component",
      renderHeaderCell: () => "Component",
      renderCell: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <StorageRegular style={{ color: 'var(--colorBrandBackground)' }} />
          <div>
            <Text weight="semibold">{item.lot_description}</Text>
            <br />
            <Text size={200} style={{ color: 'var(--colorNeutralForeground2)' }}>
              SKU: {item.model_number || 'N/A'}
            </Text>
          </div>
        </div>
      ),
    }),
    createTableColumn<HardwareModel>({
      columnId: "details",
      renderHeaderCell: () => "Details",
      renderCell: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tooltip content={`Category: ${item.category}\nForm Factor: ${item.form_factor || 'N/A'}`} relationship="description">
            <Button appearance="subtle" icon={<InfoRegular />} size="small">
              Details
            </Button>
          </Tooltip>
        </div>
      ),
    }),
    createTableColumn<HardwareModel>({
      columnId: "ext_pricing",
      renderHeaderCell: () => "Pricing",
      renderCell: (item) => (
        <div style={{ textAlign: 'center' }}>
          <Text weight="semibold" size={300}>Contact for Price</Text>
          <br />
          <Text size={200} style={{ color: 'var(--colorNeutralForeground2)' }}>
            Extension Component
          </Text>
        </div>
      ),
    }),
  ];

  return (
    <GlassmorphicLayout>
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Title3 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <DataUsageRegular style={{ color: 'var(--colorBrandBackground)' }} />
            Hardware Baskets
          </Title3>
          <Text>
            Manage and analyze hardware configuration baskets from various vendors. 
            Upload Excel files to import pricing and specification data.
          </Text>
        </div>

        {/* Messages */}
        {error && (
          <MessageBar intent="error" style={{ marginBottom: '16px' }}>
            {error}
          </MessageBar>
        )}
        {success && (
          <MessageBar intent="success" style={{ marginBottom: '16px' }}>
            {success}
          </MessageBar>
        )}

        {/* Upload Section */}
        <Card style={{ marginBottom: '24px' }}>
          <CardHeader
            header={<Subtitle2>Upload Hardware Basket</Subtitle2>}
            description="Import hardware configuration data from Excel files (Dell, Lenovo, etc.)"
            action={
              <Dialog open={showUploadDialog} onOpenChange={(_, data) => setShowUploadDialog(data.open)}>
                <DialogTrigger disableButtonEnhancement>
                  <Button 
                    appearance="primary" 
                    icon={<CloudArrowUpRegular />}
                    disabled={isUploading}
                  >
                    Upload File
                  </Button>
                </DialogTrigger>
                <DialogSurface>
                  <DialogBody>
                    <DialogTitle>Upload Hardware Basket</DialogTitle>
                    <DialogContent>
                      {!isUploading ? (
                        <div>
                          <Text style={{ marginBottom: '16px', display: 'block' }}>
                            Select an Excel file containing hardware basket data. 
                            Supported formats: Dell and Lenovo price lists.
                          </Text>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileSelect}
                            style={{ width: '100%', padding: '8px' }}
                          />
                        </div>
                      ) : (
                        <div style={{ padding: '16px 0' }}>
                          <Text weight="semibold" style={{ marginBottom: '8px', display: 'block' }}>
                            {uploadProgress?.stage}
                          </Text>
                          <ProgressBar value={uploadProgress?.progress || 0} max={100} />
                          <Text size={200} style={{ marginTop: '8px', display: 'block' }}>
                            {uploadProgress?.message}
                          </Text>
                        </div>
                      )}
                    </DialogContent>
                    <DialogActions>
                      <Button 
                        appearance="secondary" 
                        onClick={() => setShowUploadDialog(false)}
                        disabled={isUploading}
                      >
                        Cancel
                      </Button>
                    </DialogActions>
                  </DialogBody>
                </DialogSurface>
              </Dialog>
            }
          />
        </Card>

        {/* Filters */}
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '200px' }}>
              <SearchRegular />
              <Input
                placeholder="Search baskets..."
                value={searchTerm}
                onChange={(_, data) => setSearchTerm(data.value)}
                style={{ flex: 1 }}
              />
            </div>
            
            <Dropdown
              placeholder="Vendor"
              value={vendorFilter}
              onOptionSelect={(_, data) => setVendorFilter(data.optionValue as string)}
              style={{ minWidth: '120px' }}
            >
              {vendors.map((vendor) => (
                <Option key={vendor} value={vendor}>
                  {vendor}
                </Option>
              ))}
            </Dropdown>
            
            <Dropdown
              placeholder="Quarter"
              value={quarterFilter}
              onOptionSelect={(_, data) => setQuarterFilter(data.optionValue as string)}
              style={{ minWidth: '120px' }}
            >
              {quarters.map((quarter) => (
                <Option key={quarter} value={quarter}>
                  {quarter}
                </Option>
              ))}
            </Dropdown>
          </div>
        </Card>

        {/* Hardware Baskets Table */}
        <Card style={{ marginBottom: selectedBasket ? '24px' : '0' }}>
          <CardHeader
            header={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Subtitle2>Hardware Baskets</Subtitle2>
                <Badge appearance="outline">{filteredBaskets.length}</Badge>
              </div>
            }
          />
          
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <Spinner size="large" />
              <Text style={{ display: 'block', marginTop: '16px' }}>Loading hardware baskets...</Text>
            </div>
          ) : filteredBaskets.length > 0 ? (
            <DataGrid
              items={filteredBaskets}
              columns={basketColumns}
              sortable
              getRowId={(item) => item.id}
            >
              <DataGridHeader>
                <DataGridRow>
                  {({ renderHeaderCell }) => (
                    <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                  )}
                </DataGridRow>
              </DataGridHeader>
              <DataGridBody<HardwareBasket>>
                {({ item, rowId }) => (
                  <DataGridRow<HardwareBasket> key={rowId}>
                    {({ renderCell }) => (
                      <DataGridCell>{renderCell(item)}</DataGridCell>
                    )}
                  </DataGridRow>
                )}
              </DataGridBody>
            </DataGrid>
          ) : (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <Text>No hardware baskets found. Upload an Excel file to get started.</Text>
            </div>
          )}
        </Card>

        {/* Hardware Models with Subtabs (shown when a basket is selected) */}
        {selectedBasket && (
          <Card>
            <CardHeader
              header={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Subtitle2>Hardware Analysis - {selectedBasket.name}</Subtitle2>
                  <Badge appearance="outline">{hardwareModels.length} total</Badge>
                </div>
              }
              description={`${selectedBasket.vendor} hardware models for ${selectedBasket.quarter} ${selectedBasket.year}`}
              action={
                <Button
                  appearance="subtle"
                  onClick={() => {
                    setSelectedBasket(null);
                    setHardwareModels([]);
                  }}
                >
                  Close
                </Button>
              }
            />
            
            {loading ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <Spinner size="large" />
                <Text style={{ display: 'block', marginTop: '16px' }}>Loading hardware models...</Text>
              </div>
            ) : hardwareModels.length > 0 ? (
              <div style={{ padding: '16px' }}>
                {/* Custom Tab Navigation */}
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  marginBottom: '16px',
                  borderBottom: '1px solid var(--colorNeutralStroke2)'
                }}>
                  <Button
                    appearance={selectedTab === 'servers' ? 'primary' : 'subtle'}
                    onClick={() => handleTabSelect('servers')}
                    style={{ 
                      borderRadius: '8px 8px 0 0',
                      border: 'none',
                      borderBottom: selectedTab === 'servers' ? '2px solid var(--colorBrandBackground)' : 'none'
                    }}
                  >
                    Server Configurations ({serverModels.length})
                  </Button>
                  <Button
                    appearance={selectedTab === 'extensions' ? 'primary' : 'subtle'}
                    onClick={() => handleTabSelect('extensions')}
                    style={{ 
                      borderRadius: '8px 8px 0 0',
                      border: 'none',
                      borderBottom: selectedTab === 'extensions' ? '2px solid var(--colorBrandBackground)' : 'none'
                    }}
                  >
                    Extension Components ({extensionModels.length})
                  </Button>
                </div>
                
                <Divider style={{ margin: '16px 0' }} />
                
                {selectedTab === 'servers' && (
                  <div>
                    <Text size={300} weight="semibold" style={{ marginBottom: '16px', display: 'block' }}>
                      Server Configurations
                    </Text>
                    <Text size={200} style={{ marginBottom: '24px', display: 'block', color: 'var(--colorNeutralForeground2)' }}>
                      Detailed server specifications with lot descriptions, server models, sizes, socket counts, and pricing
                    </Text>
                    
                    {serverModels.length > 0 ? (
                      <DataGrid
                        items={serverModels}
                        columns={serverColumns}
                        sortable
                        getRowId={(item) => item.id}
                      >
                        <DataGridHeader>
                          <DataGridRow>
                            {({ renderHeaderCell }) => (
                              <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                            )}
                          </DataGridRow>
                        </DataGridHeader>
                        <DataGridBody<HardwareModel>>
                          {({ item, rowId }) => (
                            <DataGridRow<HardwareModel> key={rowId}>
                              {({ renderCell }) => (
                                <DataGridCell>{renderCell(item)}</DataGridCell>
                              )}
                            </DataGridRow>
                          )}
                        </DataGridBody>
                      </DataGrid>
                    ) : (
                      <div style={{ padding: '48px', textAlign: 'center' }}>
                        <Text>No server configurations found in this basket.</Text>
                      </div>
                    )}
                  </div>
                )}
                
                {selectedTab === 'extensions' && (
                  <div>
                    <Text size={300} weight="semibold" style={{ marginBottom: '16px', display: 'block' }}>
                      Extension Components
                    </Text>
                    <Text size={200} style={{ marginBottom: '24px', display: 'block', color: 'var(--colorNeutralForeground2)' }}>
                      Additional hardware components and extensions with SKU descriptions, part numbers, and pricing
                    </Text>
                    
                    {extensionModels.length > 0 ? (
                      <DataGrid
                        items={extensionModels}
                        columns={extensionColumns}
                        sortable
                        getRowId={(item) => item.id}
                      >
                        <DataGridHeader>
                          <DataGridRow>
                            {({ renderHeaderCell }) => (
                              <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                            )}
                          </DataGridRow>
                        </DataGridHeader>
                        <DataGridBody<HardwareModel>>
                          {({ item, rowId }) => (
                            <DataGridRow<HardwareModel> key={rowId}>
                              {({ renderCell }) => (
                                <DataGridCell>{renderCell(item)}</DataGridCell>
                              )}
                            </DataGridRow>
                          )}
                        </DataGridBody>
                      </DataGrid>
                    ) : (
                      <div style={{ padding: '48px', textAlign: 'center' }}>
                        <Text>No extension components found in this basket.</Text>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <Text>No hardware models found in this basket.</Text>
              </div>
            )}
          </Card>
        )}
      </div>
    </GlassmorphicLayout>
  );
};

export default HardwareBasketView;

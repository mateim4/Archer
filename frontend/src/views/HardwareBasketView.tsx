import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
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
import type { 
  HardwareBasket, 
  HardwareModel, 
  HardwareConfiguration,
  HardwarePricing,
} from '../types/hardwareBasketTypes';

const API_URL = 'http://localhost:3001/api';

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

  const fetchHardwareBaskets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/hardware-baskets`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setHardwareBaskets(data);
    } catch (e: any) {
      setError(`Failed to fetch hardware baskets: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHardwareBaskets();
  }, [fetchHardwareBaskets]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setShowUploadDialog(true);
    setUploadProgress({ stage: 'Uploading', progress: 0, message: 'Starting upload...' });
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/hardware-baskets/upload`, {
        method: 'POST',
        body: formData,
      });

      setUploadProgress({ stage: 'Processing', progress: 50, message: 'Server is processing the file...' });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      setUploadProgress({ stage: 'Complete', progress: 100, message: 'Processing complete!' });
      setSuccess(`Successfully uploaded and processed ${file.name}. ${result.models_created} models created.`);
      
      // Refresh basket list
      fetchHardwareBaskets();

    } catch (e: any) {
      setError(`Upload failed: ${e.message}`);
      setUploadProgress(null);
    } finally {
      setIsUploading(false);
      // Keep dialog open to show success/error message
    }
  };

  // Separate models into servers and extensions
  const serverModels = useMemo(() => {
    return hardwareModels.filter(model => 
      model.category === 'server' || (model.lot_description && model.lot_description.toLowerCase().includes('server'))
    );
  }, [hardwareModels]);

  const extensionModels = useMemo(() => {
    return hardwareModels.filter(model => 
      model.category !== 'server' && (model.lot_description && !model.lot_description.toLowerCase().includes('server'))
    );
  }, [hardwareModels]);

  // Handle tab selection
  const handleTabSelect = (tabValue: string) => {
    setSelectedTab(tabValue);
  };

  const handleBasketSelection = async (basket: HardwareBasket) => {
    setSelectedBasket(basket);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/hardware-baskets/${basket.id}/models`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setHardwareModels(data);
    } catch (e: any) {
      setError(`Failed to fetch hardware models: ${e.message}`);
      setHardwareModels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBasket = async (basketId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/hardware-baskets/${basketId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setSuccess('Basket deleted successfully.');
      fetchHardwareBaskets(); // Refresh list
      if (selectedBasket?.id === basketId) {
        setSelectedBasket(null);
        setHardwareModels([]);
      }
    } catch (e: any) {
      setError(`Failed to delete basket: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredBaskets = useMemo(() => {
    return hardwareBaskets
      .filter(basket => 
        (vendorFilter === 'All' || basket.vendor === vendorFilter) &&
        (quarterFilter === 'All' || basket.quarter === quarterFilter)
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [hardwareBaskets, vendorFilter, quarterFilter]);

  const uniqueVendors = useMemo(() => ['All', ...new Set(hardwareBaskets.map(b => b.vendor))], [hardwareBaskets]);
  const uniqueQuarters = useMemo(() => ['All', ...new Set(hardwareBaskets.map(b => b.quarter))], [hardwareBaskets]);

  const columns: TableColumnDefinition<HardwareModel>[] = [
    createTableColumn<HardwareModel>({
      columnId: 'lotDescription',
      compare: (a, b) => a.lot_description.localeCompare(b.lot_description),
      renderHeaderCell: () => 'Lot Description',
      renderCell: (item) => (
        <Tooltip content={item.lot_description} relationship="description">
          <Text wrap={false}>{item.lot_description}</Text>
        </Tooltip>
      ),
    }),
    createTableColumn<HardwareModel>({
      columnId: 'partNumber',
      compare: (a, b) => a.part_number.localeCompare(b.part_number),
      renderHeaderCell: () => 'Part Number',
      renderCell: (item) => item.part_number,
    }),
    createTableColumn<HardwareModel>({
      columnId: 'price',
      compare: (a, b) => (a.price?.amount ?? 0) - (b.price?.amount ?? 0),
      renderHeaderCell: () => 'Price',
      renderCell: (item) => item.price ? `${item.price.amount.toFixed(2)} ${item.price.currency}` : 'N/A',
    }),
     createTableColumn<HardwareModel>({
      columnId: 'category',
      compare: (a, b) => a.category.localeCompare(b.category),
      renderHeaderCell: () => 'Category',
      renderCell: (item) => <Badge color="brand">{item.category}</Badge>,
    }),
    createTableColumn<HardwareModel>({
      columnId: 'actions',
      renderHeaderCell: () => 'Actions',
      renderCell: (item) => (
        <Button icon={<EyeRegular />} aria-label="View details" />
      ),
    }),
  ];

  return (
    <GlassmorphicLayout>
      <div className="p-4 sm:p-6 md:p-8 space-y-6">
        <Card className="bg-white/50 backdrop-blur-sm">
          <CardHeader
            header={<Title3>Hardware Basket Management</Title3>}
            action={
              <div className="flex items-center space-x-2">
                <Button 
                  icon={<CloudArrowUpRegular />} 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Upload New Basket'}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  accept=".xlsx, .xls"
                />
              </div>
            }
          />
        </Card>

        {error && <MessageBar intent="error">{error}</MessageBar>}
        {success && <MessageBar intent="success">{success}</MessageBar>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basket List */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-white/50 backdrop-blur-sm">
              <CardHeader header={<Subtitle2>Available Baskets</Subtitle2>} />
              <div className="p-4 space-y-4">
                <div className="flex space-x-2">
                  <Dropdown
                    value={vendorFilter}
                    onOptionSelect={(_, data) => setVendorFilter(data.optionValue || 'All')}
                  >
                    {uniqueVendors.map(v => <Option key={v} value={v}>{v}</Option>)}
                  </Dropdown>
                  <Dropdown
                     value={quarterFilter}
                     onOptionSelect={(_, data) => setQuarterFilter(data.optionValue || 'All')}
                  >
                    {uniqueQuarters.map(q => <Option key={q} value={q}>{q}</Option>)}
                  </Dropdown>
                </div>
                {loading && hardwareBaskets.length === 0 ? (
                  <Spinner label="Loading baskets..." />
                ) : (
                  <ul className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredBaskets.map(basket => (
                      <li key={basket.id}>
                        <Card 
                          className={`cursor-pointer hover:bg-blue-100/50 ${selectedBasket?.id === basket.id ? 'bg-blue-200/70' : ''}`}
                          onClick={() => handleBasketSelection(basket)}
                        >
                          <div className="p-2 flex justify-between items-center">
                            <div>
                              <Text block weight="semibold">{basket.vendor} - {basket.quarter}</Text>
                              <Text block size={200}>Models: {basket.model_count}</Text>
                              <Text block size={200}>Created: {new Date(basket.created_at).toLocaleDateString()}</Text>
                            </div>
                            <Button 
                              icon={<DeleteRegular />} 
                              aria-label="Delete basket" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBasket(basket.id);
                              }}
                            />
                          </div>
                        </Card>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </div>

          {/* Model Details */}
          <div className="lg:col-span-2">
            <Card className="bg-white/50 backdrop-blur-sm h-full">
              {selectedBasket ? (
                <>
                  <CardHeader 
                    header={<Subtitle2>Details for {selectedBasket.vendor} {selectedBasket.quarter}</Subtitle2>}
                    action={
                      <div className="flex space-x-2">
                        <Button 
                          appearance={selectedTab === 'servers' ? 'primary' : 'outline'}
                          onClick={() => handleTabSelect('servers')}
                        >
                          Servers ({serverModels.length})
                        </Button>
                        <Button 
                          appearance={selectedTab === 'extensions' ? 'primary' : 'outline'}
                          onClick={() => handleTabSelect('extensions')}
                        >
                          Extensions ({extensionModels.length})
                        </Button>
                      </div>
                    }
                  />
                  <div className="p-4">
                    {loading ? (
                      <Spinner label="Loading models..." />
                    ) : (
                      <DataGrid items={selectedTab === 'servers' ? serverModels : extensionModels} columns={columns} getRowId={item => item.id}>
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
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Text>Select a basket to view its contents</Text>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showUploadDialog} onOpenChange={(_, data) => setShowUploadDialog(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Upload Status</DialogTitle>
            <DialogContent>
              {isUploading && uploadProgress && (
                <div className="space-y-2">
                  <Text>{uploadProgress.stage}: {uploadProgress.message}</Text>
                  <ProgressBar value={uploadProgress.progress / 100} />
                </div>
              )}
              {error && <MessageBar intent="error">{error}</MessageBar>}
              {success && <MessageBar intent="success">{success}</MessageBar>}
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary" disabled={isUploading}>Close</Button>
              </DialogTrigger>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </GlassmorphicLayout>
  );
};

export default HardwareBasketView;

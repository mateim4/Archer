import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Dropdown,
  MessageBar,
  Option,
  ProgressBar,
  Spinner,
  Subtitle2,
  TableColumnDefinition,
  Text,
  Title3,
  Tooltip,
  createTableColumn,
} from '@fluentui/react-components';
import { CloudArrowUpRegular, DeleteRegular } from '@fluentui/react-icons';
import GlassmorphicLayout from '../components/GlassmorphicLayout';
import type { HardwareBasket, HardwareExtension, HardwareModel } from '../types/hardwareBasketTypes';

const API_URL = '/api';

interface UploadProgress { stage: string; progress: number; message: string }

const HardwareBasketView: React.FC = () => {
  const [hardwareBaskets, setHardwareBaskets] = useState<HardwareBasket[]>([]);
  const [selectedBasket, setSelectedBasket] = useState<HardwareBasket | null>(null);
  const [hardwareModels, setHardwareModels] = useState<HardwareModel[]>([]);
  const [extensions, setExtensions] = useState<HardwareExtension[]>([]);
  const [selectedTab, setSelectedTab] = useState<'servers' | 'extensions'>('servers');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [vendorFilter, setVendorFilter] = useState<string>('Display All');
  const [quarterFilter, setQuarterFilter] = useState<string>('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchHardwareBaskets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/hardware-baskets`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setHardwareBaskets(await res.json());
    } catch (e: any) {
      setError(`Failed to fetch hardware baskets: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHardwareBaskets(); }, [fetchHardwareBaskets]);

  const handleFileUpload = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setShowUploadDialog(true);
    setUploadProgress({ stage: 'Uploading', progress: 0, message: 'Starting upload...' });
    setError(null);
    setSuccess(null);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch(`${API_URL}/hardware-baskets/upload`, { method: 'POST', body: form });
      setUploadProgress({ stage: 'Processing', progress: 50, message: 'Processing file...' });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || `HTTP ${res.status}`); }
      const json = await res.json();
      setUploadProgress({ stage: 'Complete', progress: 100, message: 'Done' });
      setSuccess(`Uploaded ${file.name}. ${json.models_count ?? json.models_created ?? 0} models created.`);
      fetchHardwareBaskets();
    } catch (e: any) {
      setError(`Upload failed: ${e.message}`);
      setUploadProgress(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteBasket = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/hardware-baskets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSuccess('Basket deleted.');
      fetchHardwareBaskets();
      if (selectedBasket?.id === id) { setSelectedBasket(null); setHardwareModels([]); setExtensions([]); }
    } catch (e: any) {
      setError(`Failed to delete basket: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBasketSelection = async (basket: HardwareBasket) => {
    setSelectedBasket(basket);
    setSelectedTab('servers');
    setLoading(true);
    setError(null);
    try {
      const m = await fetch(`${API_URL}/hardware-baskets/${basket.id}/models`);
      if (!m.ok) throw new Error(`HTTP ${m.status}`);
      setHardwareModels(await m.json());
      const e = await fetch(`${API_URL}/hardware-baskets/${basket.id}/extensions`);
      setExtensions(e.ok ? await e.json() : []);
    } catch (e: any) {
      setError(`Failed to fetch basket details: ${e.message}`);
      setHardwareModels([]);
      setExtensions([]);
    } finally {
      setLoading(false);
    }
  };

  const displayedModels = useMemo(() => {
    if (!selectedBasket) return [] as HardwareModel[];
    return hardwareModels.filter(m => m.basket_id === selectedBasket.id);
  }, [hardwareModels, selectedBasket]);

  const isComponentLike = (text: string) => /riser|backplane|power\s*supply|heatsink|chassis|retimer|adapter|controller|fan|rail|cable/i.test(text);
  const isServerLike = (text: string) => /\bserver\b|\bnode\b|\bsr\d{3,}\b|thinksystem\s+sr\d+/i.test(text);
  const serverModels = useMemo(() => {
    return displayedModels.filter(m => {
      const name = `${(m as any).model_name || ''} ${(m as any).lot_description || ''}`;
      if (isComponentLike(name)) return false;
      if ((m as any).category && ((m as any).category as string).toLowerCase() === 'server') return true;
      return isServerLike(name);
    });
  }, [displayedModels]);

  const extensionRows = extensions;

  const getExtensionRowId = (item: HardwareExtension) => {
    const id: any = (item as any).id;
    if (typeof id === 'string') return id;
    if (id && typeof id === 'object' && 'tb' in id && 'id' in id) return `${(id as any).tb}:${(id as any).id}`;
    return item.part_number || item.name;
  };

  const filteredBaskets = useMemo(() => {
    const map = new Map<string, HardwareBasket>();
    for (const b of hardwareBaskets) {
      if ((vendorFilter !== 'Display All' && b.vendor !== vendorFilter) || (quarterFilter !== 'All' && b.quarter !== quarterFilter)) continue;
      const key = `${b.vendor}|${b.quarter}|${b.year}`;
      const existing = map.get(key);
      if (!existing) map.set(key, b);
      else if (new Date(b.created_at).getTime() > new Date(existing.created_at).getTime()) map.set(key, b);
    }
    return Array.from(map.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [hardwareBaskets, vendorFilter, quarterFilter]);

  const uniqueVendors = useMemo(() => ['Display All', ...new Set(hardwareBaskets.map(b => b.vendor))], [hardwareBaskets]);
  const uniqueQuarters = useMemo(() => ['All', ...new Set(hardwareBaskets.map(b => b.quarter))], [hardwareBaskets]);

  const serverColumns: TableColumnDefinition<HardwareModel>[] = [
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
      columnId: 'cpu',
      renderHeaderCell: () => 'CPU',
      renderCell: (item) => {
  const s: any = (item as any).base_specifications || (item as any).specifications || {};
  const p: any = s.processor || {};
  const parts: string[] = [];
  if (p.model) parts.push(p.model);
  if (p.core_count || p.cores) parts.push(`${p.core_count || p.cores}C`);
  if (p.thread_count || p.threads) parts.push(`${p.thread_count || p.threads}T`);
  if (p.frequency_ghz) parts.push(`${p.frequency_ghz}GHz`);
  if (parts.length) return parts.join(' / ');
  const text = `${(item as any).model_name || ''} ${(item as any).lot_description || ''}`;
  const m = text.match(/(\b\d{1,2})C.*?(\d+(?:\.\d+)?)\s*GHz/i);
  const modelMatch = text.match(/(Xeon|EPYC)[^,\n]*/i);
  const segs: string[] = [];
  if (modelMatch) segs.push(modelMatch[0].trim());
  if (m && m[1]) segs.push(`${m[1]}C`);
  if (m && m[2]) segs.push(`${m[2]}GHz`);
  return segs.length ? segs.join(' / ') : 'N/A';
      },
    }),
    createTableColumn<HardwareModel>({
      columnId: 'memory',
      renderHeaderCell: () => 'Memory',
      renderCell: (item) => {
        const s: any = (item as any).base_specifications || (item as any).specifications || {};
        const m: any = s.memory || {};
        return m.total_capacity || m.module_count ? `${m.total_capacity || ''} ${m.module_count ? `(${m.module_count} modules)` : ''}`.trim() : 'N/A';
      },
    }),
    createTableColumn<HardwareModel>({
      columnId: 'partNumber',
      compare: (a, b) => (a.part_number || '').localeCompare(b.part_number || ''),
      renderHeaderCell: () => 'Part Number',
      renderCell: (item) => item.part_number || '—',
    }),
    createTableColumn<HardwareModel>({
      columnId: 'price',
      compare: (a, b) => ((a as any).price?.amount ?? 0) - ((b as any).price?.amount ?? 0),
      renderHeaderCell: () => 'Price',
      renderCell: (item) => (item as any).price ? `${(item as any).price.amount.toFixed(2)} ${(item as any).price.currency}` : 'N/A',
    }),
    createTableColumn<HardwareModel>({
      columnId: 'category',
      compare: (a, b) => a.category.localeCompare(b.category),
      renderHeaderCell: () => 'Category',
      renderCell: (item) => <Badge color="brand">{item.category}</Badge>,
    }),
  ];

  const extensionColumns: TableColumnDefinition<HardwareExtension>[] = [
    createTableColumn<HardwareExtension>({
      columnId: 'name',
      compare: (a, b) => a.name.localeCompare(b.name),
      renderHeaderCell: () => 'Name',
      renderCell: (item) => (
        <Tooltip content={item.name} relationship="description">
          <Text wrap={false}>{item.name}</Text>
        </Tooltip>
      ),
    }),
    createTableColumn<HardwareExtension>({
      columnId: 'category',
      compare: (a, b) => a.category.localeCompare(b.category),
      renderHeaderCell: () => 'Category',
      renderCell: (item) => <Badge>{item.category}</Badge>,
    }),
    createTableColumn<HardwareExtension>({
      columnId: 'type',
      compare: (a, b) => a.type.localeCompare(b.type),
      renderHeaderCell: () => 'Type',
      renderCell: (item) => item.type,
    }),
    createTableColumn<HardwareExtension>({
      columnId: 'size',
      renderHeaderCell: () => 'Size',
      renderCell: (item) => item.size || '—',
    }),
    createTableColumn<HardwareExtension>({
      columnId: 'speed',
      renderHeaderCell: () => 'Speed',
      renderCell: (item) => item.speed || '—',
    }),
    createTableColumn<HardwareExtension>({
      columnId: 'partNumber',
      renderHeaderCell: () => 'Part Number',
      renderCell: (item) => item.part_number || '—',
    }),
    createTableColumn<HardwareExtension>({
      columnId: 'price',
      compare: (a, b) => ((a as any).price?.amount ?? 0) - ((b as any).price?.amount ?? 0),
      renderHeaderCell: () => 'Price',
      renderCell: (item) => (item as any).price ? `${(item as any).price.amount.toFixed(2)} ${(item as any).price.currency}` : '—',
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
                <Button icon={<CloudArrowUpRegular />} onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Upload New Basket'}
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".xlsx, .xls" />
              </div>
            }
          />
        </Card>

        {error && <MessageBar intent="error">{error}</MessageBar>}
        {success && <MessageBar intent="success">{success}</MessageBar>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-white/50 backdrop-blur-sm">
              <CardHeader header={<Subtitle2>Available Baskets</Subtitle2>} />
              <div className="p-4 space-y-4">
                <div className="flex space-x-2">
                  <Dropdown value={vendorFilter} onOptionSelect={(_, d) => setVendorFilter(d.optionValue || 'Display All')}>
                    {uniqueVendors.map(v => <Option key={v} value={v}>{v}</Option>)}
                  </Dropdown>
                  <Dropdown value={quarterFilter} onOptionSelect={(_, d) => setQuarterFilter(d.optionValue || 'All')}>
                    {uniqueQuarters.map(q => <Option key={q} value={q}>{q}</Option>)}
                  </Dropdown>
                </div>
                {loading && hardwareBaskets.length === 0 ? (
                  <Spinner label="Loading baskets..." />
                ) : (
                  <ul className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredBaskets.map(basket => (
                      <li key={basket.id}>
                        <Card className={`cursor-pointer hover:bg-blue-100/50 ${selectedBasket?.id === basket.id ? 'bg-blue-200/70' : ''}`} onClick={() => handleBasketSelection(basket)}>
                          <div className="p-2 flex justify-between items-center">
                            <div>
                              <Text block weight="semibold">{basket.vendor} - {basket.quarter}</Text>
                              <Text block size={200}>Models: {basket.total_models ?? 'N/A'}</Text>
                              <Text block size={200}>Created: {new Date(basket.created_at).toLocaleDateString()}</Text>
                            </div>
                            <Button icon={<DeleteRegular />} aria-label="Delete basket" onClick={(e) => { e.stopPropagation(); handleDeleteBasket(basket.id); }} />
                          </div>
                        </Card>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="bg-white/50 backdrop-blur-sm h-full">
              {selectedBasket ? (
                <>
                  <CardHeader
                    header={<Subtitle2>Details for {selectedBasket.vendor} {selectedBasket.quarter}</Subtitle2>}
                    action={
                      <div className="flex space-x-2">
                        <div className="inline-flex rounded-full overflow-hidden border border-gray-200 bg-white/70">
                          <Button appearance={selectedTab === 'servers' ? 'primary' : 'transparent'} onClick={() => setSelectedTab('servers')}>Servers ({serverModels.length})</Button>
                          <Button appearance={selectedTab === 'extensions' ? 'primary' : 'transparent'} onClick={() => setSelectedTab('extensions')}>Extensions ({extensionRows.length})</Button>
                        </div>
                      </div>
                    }
                  />
                  <div className="p-4">
                    {loading ? (
                      <Spinner label="Loading models..." />
                    ) : selectedTab === 'servers' ? (
                      <DataGrid items={serverModels} columns={serverColumns} getRowId={item => (item as any).id}>
                        <DataGridHeader>
                          <DataGridRow>
                            {({ renderHeaderCell }) => (<DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>)}
                          </DataGridRow>
                        </DataGridHeader>
                        <DataGridBody<HardwareModel>>
                          {({ item, rowId }) => (
                            <DataGridRow<HardwareModel> key={rowId}>
                              {({ renderCell }) => (<DataGridCell>{renderCell(item)}</DataGridCell>)}
                            </DataGridRow>
                          )}
                        </DataGridBody>
                      </DataGrid>
                    ) : (
                      <DataGrid items={extensionRows} columns={extensionColumns} getRowId={item => getExtensionRowId(item)}>
                        <DataGridHeader>
                          <DataGridRow>
                            {({ renderHeaderCell }) => (<DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>)}
                          </DataGridRow>
                        </DataGridHeader>
                        <DataGridBody<HardwareExtension>>
                          {({ item, rowId }) => (
                            <DataGridRow<HardwareExtension> key={rowId}>
                              {({ renderCell }) => (<DataGridCell>{renderCell(item)}</DataGridCell>)}
                            </DataGridRow>
                          )}
                        </DataGridBody>
                      </DataGrid>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full"><Text>Select a basket to view its contents</Text></div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showUploadDialog} onOpenChange={(_, d) => setShowUploadDialog(d.open)}>
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
              <Button appearance="secondary" disabled={isUploading} onClick={() => setShowUploadDialog(false)}>Close</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </GlassmorphicLayout>
  );
};

export default HardwareBasketView;

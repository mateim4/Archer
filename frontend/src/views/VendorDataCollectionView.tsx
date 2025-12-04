import React, { useState, useEffect } from 'react';
import { 
  CloudArrowUpRegular,
  DocumentDataRegular, 
  ServerRegular,
  SearchRegular,
  DatabaseRegular,
  SettingsRegular,
  CloudSyncRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  InfoRegular,
  EyeRegular,
  DeleteRegular,
  DataBarHorizontal24Regular
} from '@fluentui/react-icons';
import ConsistentCard from '../components/ConsistentCard';
import ConsistentButton from '../components/ConsistentButton';
import SimpleFileUpload from '../components/SimpleFileUpload';
import { UserPermissions } from '../types/hardwareBasketTypes';
import type { 
  HardwareBasket, 
  HardwareModel, 
  ImportResult,
  User,
  CreateHardwareBasketRequest,
  HardwareExtension
} from '../types/hardwareBasketTypes';

const API_URL = '/api';

// Types
interface VendorModel {
  model_id: string;
  vendor: string;
  model_name: string;
  family: string;
  generation: string;
  form_factor: string;
  cpu_sockets: number;
  max_memory_gb: number;
  drive_bays: number;
}

interface MessageState {
  type: 'success' | 'error' | 'info';
  title: string;
  body: string;
}

interface SearchRequirements {
  workload_type: string;
  cpu_cores_minimum?: number;
  memory_gb_minimum?: number;
}


const VendorDataCollectionView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'upload' | 'search' | 'basket'>('overview');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<MessageState | null>(null);
  const [serverModels, setServerModels] = useState<VendorModel[]>([]);
  const [searchRequirements, setSearchRequirements] = useState<SearchRequirements>({
    workload_type: 'General'
  });
  // Hardware basket state
  const [hardwareBaskets, setHardwareBaskets] = useState<HardwareBasket[]>([]);
  const [selectedBasket, setSelectedBasket] = useState<string>('');
  const [hardwareModels, setHardwareModels] = useState<HardwareModel[]>([]);
  const [extensions, setExtensions] = useState<HardwareExtension[]>([]);
  const [basketSubTab, setBasketSubTab] = useState<'servers' | 'extensions'>('servers');
  const [isUploading, setIsUploading] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDesc, setSortDesc] = useState<boolean>(false);
  const [priceModalModel, setPriceModalModel] = useState<any>(null);

  // Mock user context - in production, this would come from authentication
  const currentUser: User = {
    id: 'admin', // Will be sent as x-user-id header
    username: 'admin',
    email: 'admin@company.com',
    ad_guid: 'sample-guid-123',
    role: 'admin' // Change to 'editor' or 'viewer' to test different permissions
  };

  const vendors = [
    { value: '', label: 'All Vendors' },
    { value: 'Dell', label: 'Dell Technologies' },
    { value: 'HPE', label: 'Hewlett Packard Enterprise' },
    { value: 'Lenovo', label: 'Lenovo' }
  ];

  // Mock data for demonstration
  useEffect(() => {
    console.log('VendorDataCollectionView mounted, initializing mock data...');
    const mockModels: VendorModel[] = [
      {
        model_id: 'dell-r750xs',
        vendor: 'Dell',
        model_name: 'PowerEdge R750xs',
        family: 'PowerEdge',
        generation: '15th Gen',
        form_factor: 'OneU',
        cpu_sockets: 2,
        max_memory_gb: 768,
        drive_bays: 8
      },
      {
        model_id: 'hpe-dl380-gen10',
        vendor: 'HPE',
        model_name: 'ProLiant DL380 Gen10',
        family: 'ProLiant',
        generation: 'Gen10',
        form_factor: 'TwoU',
        cpu_sockets: 2,
        max_memory_gb: 1536,
        drive_bays: 12
      },
      {
        model_id: 'lenovo-sr650-v2',
        vendor: 'Lenovo',
        model_name: 'ThinkSystem SR650 V2',
        family: 'ThinkSystem',
        generation: 'V2',
        form_factor: 'OneU',
        cpu_sockets: 2,
        max_memory_gb: 1024,
        drive_bays: 10
      }
    ];
    setServerModels(mockModels);
  }, []);

  // Fetch models when a basket is selected
  useEffect(() => {
    if (selectedBasket) {
      if (selectedBasket === 'ALL') {
        // Fetch models for all baskets and combine
        (async () => {
          setLoading(true);
          try {
            // Ensure we have the latest basket list
            if (hardwareBaskets.length === 0) await fetchHardwareBaskets();

            // Fetch models for each basket in parallel
            const allResults = await Promise.all(hardwareBaskets.map(async (b) => {
              const actualId = (() => {
                if (typeof b.id === 'object' && b.id !== null) {
                  const idObj: any = b.id;
                  if (idObj.id) return typeof idObj.id === 'object' && idObj.id.String ? idObj.id.String : String(idObj.id);
                  return String(b.id);
                }
                return String(b.id);
              })();

              try {
                const resp = await fetch(`${API_URL}/hardware-baskets/${actualId}/models`);
                if (resp.ok) return await resp.json();
                // fallback to servers endpoint
                const resp2 = await fetch(`${API_URL}/hardware-baskets/${actualId}/servers`);
                if (resp2.ok) {
                  const servers = await resp2.json();
                  return servers.map((server: any, index: number) => ({
                    id: `server-${actualId}-${index}`,
                    vendor: server.vendor,
                    model_name: server.model || server.lot_description || 'Unknown Model',
                    lot_description: server.lot_description || server.model || 'Unknown Description',
                    category: 'Server',
                    form_factor: server.form_factor,
                    specifications: server.specifications || {},
                    unit_price_usd: server.unit_price_usd || 0,
                    basket_id: actualId,
                    created_at: server.created_at,
                    updated_at: server.updated_at
                  }));
                }
              } catch (err) {
                return [];
              }
              return [];
            }));

            const flattened = allResults.flat();
            setHardwareModels(flattened);

            // Fetch extensions for each basket in parallel
            const allExtResults = await Promise.all(hardwareBaskets.map(async (b) => {
              const actualId = (() => {
                if (typeof b.id === 'object' && b.id !== null) {
                  const idObj: any = b.id;
                  if (idObj.id) return typeof idObj.id === 'object' && idObj.id.String ? idObj.id.String : String(idObj.id);
                  return String(b.id);
                }
                return String(b.id);
              })();
              try {
                const resp = await fetch(`${API_URL}/hardware-baskets/${actualId}/extensions`);
                if (resp.ok) return await resp.json();
              } catch (err) {
                return [] as HardwareExtension[];
              }
              return [] as HardwareExtension[];
            }));
            setExtensions(allExtResults.flat());
          } catch (err) {
            console.error('Failed to fetch models for all baskets', err);
            setHardwareModels([]);
            setExtensions([]);
          } finally {
            setLoading(false);
          }
        })();
      } else {
        console.log('🔄 Fetching models for selected basket:', selectedBasket);
        fetchHardwareModels(selectedBasket);
      }
    } else {
      // Clear models when no basket is selected
      setHardwareModels([]);
      setExtensions([]);
    }
  }, [selectedBasket]);

  const toggleSort = (col: string) => {
    if (sortColumn === col) setSortDesc(!sortDesc);
    else {
      setSortColumn(col);
      setSortDesc(false);
    }
  };

  const getSortableValue = (model: any, col: string) => {
    const base = model.base_specifications || model.specifications || {};
    const derived = derivedSpecsByModelId.get(normalizeThingId(model.id));

    switch (col) {
      case 'model': return (model.model_name || '').toString();
      case 'category': return (model.category || '').toString();
      case 'form_factor': return (deriveFormFactor(model) || '').toString();
      case 'cpu': 
        return formatCpuSpec((derived && derived.processor) ? derived : base, model);
      case 'memory': 
  return formatMemorySpec((derived && derived.memory) ? derived : base, model);
      case 'storage': 
  return formatStorageSpec((derived && derived.storage) ? derived : base, model);
      case 'network': 
  return formatNetworkSpec((derived && derived.network) ? derived : base, model);
      default: return '';
    }
  };

  const formatFormFactor = (formFactor: string): string => {
    const mapping: { [key: string]: string } = {
      'OneU': '1U Rack',
      'TwoU': '2U Rack',
      'FourU': '4U Rack',
      'Tower': 'Tower',
      'Blade': 'Blade'
    };
    return mapping[formFactor] || formFactor;
  };

  const deriveFormFactor = (model: any): string | null => {
    const direct = model.form_factor || model.formFactor;
    if (direct) return formatFormFactor(direct);
    const text = `${model.model_name || ''} ${model.lot_description || ''}`.toLowerCase();
    if (/\b1u\b/.test(text)) return '1U Rack';
    if (/\b2u\b/.test(text)) return '2U Rack';
    if (/\b4u\b/.test(text)) return '4U Rack';
    if (/tower/.test(text)) return 'Tower';
    return null;
  };

  // Helper functions to format hardware specifications
  const formatCpuSpec = (specs: any, model?: any): string => {
    // Check for direct specifications first
    if (specs?.processor) {
      const proc = specs.processor;
      const parts = [];
      
      if (proc.count && proc.count > 1) {
        parts.push(`${proc.count}x`);
      }
      
      if (proc.model) {
        parts.push(proc.model);
      }
      
      if (proc.cores) {
        parts.push(`${proc.cores} cores`);
      } else if (proc.core_count) {
        parts.push(`${proc.core_count}C`);
      }
      
      if (proc.base_frequency) {
        parts.push(`${proc.base_frequency}`);
      } else if (proc.frequency_ghz) {
        parts.push(`${proc.frequency_ghz}GHz`);
      }
      
      if (parts.length > 0) return parts.join(' ');
    }

    // For Lenovo models, check derived specifications
    if (model) {
      const modelId = normalizeThingId(model.id);
      const derived = derivedSpecsByModelId.get(modelId);
      if (derived?.processor) {
        const proc = derived.processor;
        const parts = [];
        
        if (proc.count && proc.count > 1) {
          parts.push(`${proc.count}x`);
        }
        if (proc.model) {
          parts.push(proc.model);
        }
        if (proc.core_count) {
          parts.push(`${proc.core_count}C`);
        }
        if (proc.frequency_ghz) {
          parts.push(`${proc.frequency_ghz}GHz`);
        }
        
        if (parts.length > 0) return parts.join(' ');
      }
    }

    // Fallback: try to parse from text
    if (model) {
      const text = `${model?.model_name || ''} ${model?.lot_description || ''}`;
      const m = text.match(/(\b\d{1,2})C.*?(\d+(?:\.\d+)?)\s*GHz/i);
      const modelMatch = text.match(/(Xeon|EPYC)[^,\n]*/i);
      if (m || modelMatch) {
        const segs = [] as string[];
        if (modelMatch) segs.push(modelMatch[0].trim());
        if (m && m[1]) segs.push(`${m[1]}C`);
        if (m && m[2]) segs.push(`${m[2]}GHz`);
        if (segs.length) return segs.join(' ');
      }
    }
    return 'N/A';
  };

  const formatMemorySpec = (specs: any, model?: any): string => {
    // Check direct specifications first
    if (specs?.memory) {
      const mem = specs.memory;
      const parts = [];
      
      if (mem.total_capacity) {
        parts.push(mem.total_capacity);
      }
      
      if (mem.memory_type) {
        parts.push(mem.memory_type);
      }
      
      if (mem.speed) {
        parts.push(`@${mem.speed}`);
      }
      
      if (mem.ecc) {
        parts.push('ECC');
      }
      
      if (parts.length > 0) return parts.join(' ');
    }

    // For Lenovo models, check derived specifications
    if (model) {
      const modelId = normalizeThingId(model.id);
      const derived = derivedSpecsByModelId.get(modelId);
      if (derived?.memory) {
        const mem = derived.memory;
        const parts = [];
        
        if (mem.total_capacity) {
          parts.push(mem.total_capacity);
        }
        if (mem.memory_type) {
          parts.push(mem.memory_type);
        }
        if (mem.speed) {
          parts.push(`@${mem.speed}`);
        }
        if (mem.ecc) {
          parts.push('ECC');
        }
        
        if (parts.length > 0) return parts.join(' ');
      }
    }
    
    return 'N/A';
  };

  const formatStorageSpec = (specs: any, model?: any): string => {
    const build = (storage: any) => {
      const parts: string[] = [];
      if (storage?.slots && storage.slots.length > 0) {
        const slotSummary = storage.slots.map((slot: any) => 
          `${slot.count}x ${slot.size}" ${slot.interface}`
        ).join(', ');
        parts.push(slotSummary);
      }
      if (storage?.total_capacity) {
        parts.push(`Total: ${storage.total_capacity}`);
      }
      if (storage?.raid_controller) {
        parts.push(`RAID: ${storage.raid_controller}`);
      }
      return parts.length > 0 ? parts.join(' | ') : '';
    };

    // Prefer direct/base specs
    if (specs?.storage) {
      const s = build(specs.storage);
      if (s) return s;
    }

    // Try derived for Lenovo
    if (model) {
      const modelId = normalizeThingId(model.id);
      const derived = derivedSpecsByModelId.get(modelId);
      if (derived?.storage) {
        const s = build(derived.storage);
        if (s) return s;
      }
    }

    return 'N/A';
  };

  const formatNetworkSpec = (specs: any, model?: any): string => {
    const build = (network: any) => {
      const parts: string[] = [];
      if (network?.ports && network.ports.length > 0) {
        const portSummary = network.ports.map((port: any) => 
          `${port.count}x ${port.speed} ${port.port_type || ''}`
        ).join(', ');
        parts.push(portSummary);
      }
      if (network?.management_ports) {
        parts.push(`${network.management_ports}x Mgmt`);
      }
      return parts.length > 0 ? parts.join(' | ') : '';
    };

    if (specs?.network) {
      const s = build(specs.network);
      if (s) return s;
    }
    // Try derived
    if (model) {
      const modelId = normalizeThingId(model.id);
      const derived = derivedSpecsByModelId.get(modelId);
      if (derived?.network) {
        const s = build(derived.network);
        if (s) return s;
      }
    }
    return 'N/A';
  };

  // Classification helpers to keep components out of the Servers table
  const isComponentLike = (text: string) => {
    // Don't filter out VSAN Ready Servers or ESA servers - these are legitimate server models
    if (/vsan.*ready.*server|esa.*server|server.*vsan|server.*esa/i.test(text)) {
      return false;
    }
    
    return /\b(riser|backplane|power\s*supply|psu|heatsink|chassis|retimer|adapter|controller|raid|hba|fan|rail|bezel|cable|riser\s*cage|anybay|nvme|pcie|dimm|memory|processor|cpu|ssd|hdd|drive|ethernet|nic|network|enablement|kit|vmware|esxi|operating|mode|selection|data\s*center|environment|xclarity|year|warranty|none|broadcom|intel\s+xeon|amd\s+epyc|thinksystem\s+(?!sr\d)|flash|gb\s|tb\s|mhz|ghz|installed|factory|config|hybrid|options\s+and\s+upgrades|pro|max|intensive|mixed|use|hot\s+swap)\b/i.test(text);
  };
  
  const isServerLike = (text: string) => {
    return /\b(server|node|sr\d{3,}|vx\d{3,}|thinksystem\s+sr\d+|poweredge|proliant|thinkagile)\b/i.test(text);
  };
  
  const isActualServerModel = (m: any): boolean => {
    const text = `${m.model_name || ''} ${m.lot_description || ''}`;
    
    // Determine the actual vendor from context if not set
    const currentBasket = hardwareBaskets.find(b => 
      normalizeThingId(b.id) === selectedBasket
    );
    const actualVendor = m.vendor || currentBasket?.vendor || 'Unknown';
    
    // Dell: Check if it has proper server specifications
    const hasSpecs = m.base_specifications && (
      m.base_specifications.processor || 
      m.base_specifications.memory || 
      m.base_specifications.storage
    );
    
    // For Dell, must have specifications and not be component-like
    if (actualVendor === 'Dell' || (m.basket_id && String(m.basket_id).includes('qta7m2amxofkxmo73bp2'))) {
      return hasSpecs && !isComponentLike(text);
    }
    
    // For Lenovo, prioritize explicit server category first
    const hasServerCategory = m.category && String(m.category).toLowerCase() === 'server';
    
    // Lenovo server lot patterns (matches "SMI1 - ", "VEI2 - ", etc.)
    const isServerLot = /^[A-Z]{3,4}\d+\s*[-–]\s*/.test(text);
    
    // If it has server category, it's definitely a server (unless it's component-like)
    if (hasServerCategory) {
      return !isComponentLike(text);
    }
    
    // Otherwise, check if it's a server lot pattern and server-like
    return isServerLot && isServerLike(text) && !isComponentLike(text);
  };
  
  // Enhanced Lenovo specifications based on official documentation
  const enhanceLenovoSpecs = React.useCallback((model: any) => {
    const modelName = model.model_name || '';
    const enhanced = { ...model };
    
    // Enhance ThinkSystem SR630 V3 models
    if (modelName.includes('SR630 V3')) {
      const baseSpecs = enhanced.base_specifications || {};
      enhanced.base_specifications = {
        ...baseSpecs,
        processor: {
          ...baseSpecs.processor,
          socket_count: 2,
          max_cores_per_socket: 32,
          max_threads_per_socket: 64,
          socket_type: baseSpecs.processor?.model?.includes('Gold 6426Y') ? 'LGA4677' : 
                      baseSpecs.processor?.model?.includes('Gold 5420+') ? 'LGA4677' : 
                      baseSpecs.processor?.socket_type,
          tdp: baseSpecs.processor?.model?.includes('Gold 6426Y') ? '185W' : 
               baseSpecs.processor?.model?.includes('Gold 5420+') ? '205W' :
               baseSpecs.processor?.tdp
        },
        memory: {
          ...baseSpecs.memory,
          max_capacity: '4TB',
          slots: 32,
          type: 'DDR5 RDIMM/LRDIMM',
          ecc: true,
          speeds_supported: ['4400 MT/s', '4800 MT/s', '5600 MT/s']
        },
        storage: {
          ...baseSpecs.storage,
          front_bays: { count: 10, size: '2.5"', interfaces: ['SATA', 'SAS', 'NVMe'] },
          rear_bays: { count: 2, size: '2.5"', interfaces: ['SATA', 'SAS'] },
          internal_m2: 4,
          raid_support: ['SW RAID', 'HW RAID 0,1,5,6,10,50,60']
        },
        network: {
          ...baseSpecs.network,
          onboard_ports: '2x 1GbE RJ45',
          pcie_slots: 3,
          expansion_options: 'Multiple 25GbE/100GbE options'
        },
        physical: {
          form_factor: '1U',
          height: '43mm',
          depth: '760mm',
          weight: '16-20kg'
        },
        power: {
          psu_options: ['750W', '1100W', '1600W'],
          redundancy: '1+1 or N+1',
          efficiency: '80 PLUS Platinum'
        }
      };
    }
    
    // Enhance ThinkSystem SR650 V3 models
    if (modelName.includes('SR650 V3')) {
      const baseSpecs = enhanced.base_specifications || {};
      enhanced.base_specifications = {
        ...baseSpecs,
        processor: {
          ...baseSpecs.processor,
          socket_count: 2,
          max_cores_per_socket: 64,
          max_threads_per_socket: 128,
          socket_type: baseSpecs.processor?.model?.includes('EPYC 9554P') ? 'SP5' : 
                      baseSpecs.processor?.model?.includes('Gold') ? 'LGA4677' : 
                      baseSpecs.processor?.socket_type,
          tdp: baseSpecs.processor?.model?.includes('EPYC 9554P') ? '360W' : 
               baseSpecs.processor?.model?.includes('Gold 6426Y') ? '185W' :
               baseSpecs.processor?.model?.includes('Gold 5420+') ? '205W' :
               baseSpecs.processor?.tdp
        },
        memory: {
          ...baseSpecs.memory,
          max_capacity: '8TB',
          slots: 32,
          type: 'DDR5 RDIMM/LRDIMM',
          ecc: true,
          speeds_supported: ['4400 MT/s', '4800 MT/s', '5600 MT/s']
        },
        storage: {
          ...baseSpecs.storage,
          front_bays: { count: 24, size: '2.5"', interfaces: ['SATA', 'SAS', 'NVMe'] },
          rear_bays: { count: 2, size: '2.5"', interfaces: ['SATA', 'SAS'] },
          internal_m2: 8,
          raid_support: ['SW RAID', 'HW RAID 0,1,5,6,10,50,60']
        },
        network: {
          ...baseSpecs.network,
          onboard_ports: '4x 1GbE RJ45 + 2x 10GbE SFP+',
          pcie_slots: 7,
          expansion_options: 'Multiple 25GbE/100GbE/200GbE options'
        },
        physical: {
          form_factor: '2U',
          height: '87mm',
          depth: '760mm',
          weight: '25-35kg'
        },
        power: {
          psu_options: ['1100W', '1600W', '2000W'],
          redundancy: '1+1 or N+1',
          efficiency: '80 PLUS Platinum/Titanium'
        }
      };
    }
    
    // Enhance ThinkAgile models
    if (modelName.includes('ThinkAgile')) {
      const baseSpecs = enhanced.base_specifications || {};
      enhanced.base_specifications = {
        ...baseSpecs,
        processor: {
          ...baseSpecs.processor,
          socket_count: 2,
          max_cores_per_socket: 64,
          max_threads_per_socket: 128,
          socket_type: baseSpecs.processor?.model?.includes('EPYC 9554P') ? 'SP5' : 
                      baseSpecs.processor?.socket_type,
          tdp: baseSpecs.processor?.model?.includes('EPYC 9554P') ? '360W' : 
               baseSpecs.processor?.tdp
        },
        memory: {
          ...baseSpecs.memory,
          max_capacity: '4TB',
          slots: 24,
          type: 'DDR5 RDIMM',
          ecc: true,
          speeds_supported: ['4800 MT/s', '5600 MT/s']
        },
        storage: {
          ...baseSpecs.storage,
          front_bays: { count: 12, size: '2.5"', interfaces: ['NVMe', 'SATA'] },
          optimization: 'HCI workloads',
          raid_support: ['SW RAID for HCI', 'HW RAID available']
        },
        network: {
          ...baseSpecs.network,
          onboard_ports: '2x 25GbE SFP28',
          pcie_slots: 4,
          expansion_options: 'High-speed networking for virtualization'
        },
        physical: {
          form_factor: '2U',
          height: '87mm',
          depth: '760mm',
          optimized: 'Hyper-converged infrastructure'
        },
        power: {
          psu_options: ['1100W', '1600W'],
          redundancy: '1+1',
          efficiency: '80 PLUS Platinum'
        }
      };
    }
    
    // Enhance Lenovo server model codes (VOA2, VEI1, etc.)
    const serverCode = modelName.match(/^([A-Z]{3,4}\d+)/)?.[1];
    if (serverCode) {
      const baseSpecs = enhanced.base_specifications || {};
      const description = model.lot_description || '';
      
      // Determine specifications based on server code patterns and descriptions
      let specs = {};
      
      // VMware vSAN Ready nodes
      if (serverCode.startsWith('V')) {
        if (description.includes('ThinkAgile VX650') || description.includes('ThinkAgile VX655')) {
          specs = {
            processor: {
              socket_count: 2,
              max_cores_per_socket: description.includes('AMD') ? 64 : 32,
              max_threads_per_socket: description.includes('AMD') ? 128 : 64,
              socket_type: description.includes('AMD') ? 'SP5' : 'LGA4677',
              architecture: description.includes('AMD') ? 'AMD EPYC' : 'Intel Xeon'
            },
            memory: {
              max_capacity: description.includes('VX655') ? '4TB' : '2TB',
              slots: 24,
              type: 'DDR5 RDIMM',
              ecc: true,
              speeds_supported: ['4800 MT/s', '5600 MT/s']
            },
            storage: {
              front_bays: { count: 12, size: '2.5"', interfaces: ['NVMe', 'SATA'] },
              optimization: 'vSAN Ready Node',
              raid_support: ['vSAN Distributed RAID']
            },
            network: {
              onboard_ports: '2x 25GbE SFP28',
              pcie_slots: 4,
              expansion_options: 'Optimized for vSAN networking'
            },
            physical: {
              form_factor: '2U',
              depth: '760mm',
              optimized: 'vSAN Ready Node'
            },
            power: {
              psu_options: ['1100W', '1600W'],
              redundancy: '1+1',
              efficiency: '80 PLUS Platinum'
            }
          };
        }
      }
      
      // Medium servers (MEA1, MEI1)
      else if (serverCode.startsWith('ME')) {
        specs = {
          processor: {
            socket_count: 2,
            max_cores_per_socket: description.includes('AMD') ? 48 : 28,
            max_threads_per_socket: description.includes('AMD') ? 96 : 56,
            socket_type: description.includes('AMD') ? 'SP5' : 'LGA4677',
            architecture: description.includes('AMD') ? 'AMD EPYC' : 'Intel Xeon Gold'
          },
          memory: {
            max_capacity: '2TB',
            slots: 24,
            type: 'DDR5 RDIMM',
            ecc: true,
            speeds_supported: ['4800 MT/s']
          },
          storage: {
            front_bays: { count: 16, size: '2.5"', interfaces: ['SATA', 'SAS', 'NVMe'] },
            internal_m2: 4,
            raid_support: ['HW RAID 0,1,5,6,10']
          },
          network: {
            onboard_ports: '2x 1GbE + 2x 10GbE',
            pcie_slots: 5,
            expansion_options: 'Multiple networking options'
          },
          physical: {
            form_factor: '2U',
            depth: '760mm',
            category: 'Medium Performance'
          },
          power: {
            psu_options: ['1100W', '1600W'],
            redundancy: '1+1',
            efficiency: '80 PLUS Platinum'
          }
        };
      }
      
      // Heavy servers (HVA1, HVI1)
      else if (serverCode.startsWith('HV')) {
        specs = {
          processor: {
            socket_count: 2,
            max_cores_per_socket: description.includes('AMD') ? 64 : 32,
            max_threads_per_socket: description.includes('AMD') ? 128 : 64,
            socket_type: description.includes('AMD') ? 'SP5' : 'LGA4677',
            architecture: description.includes('AMD') ? 'AMD EPYC' : 'Intel Xeon Platinum'
          },
          memory: {
            max_capacity: '4TB',
            slots: 32,
            type: 'DDR5 RDIMM/LRDIMM',
            ecc: true,
            speeds_supported: ['4800 MT/s', '5600 MT/s']
          },
          storage: {
            front_bays: { count: 24, size: '2.5"', interfaces: ['SATA', 'SAS', 'NVMe'] },
            rear_bays: { count: 4, size: '3.5"', interfaces: ['SATA', 'SAS'] },
            internal_m2: 8,
            raid_support: ['HW RAID 0,1,5,6,10,50,60']
          },
          network: {
            onboard_ports: '4x 1GbE + 2x 25GbE',
            pcie_slots: 8,
            expansion_options: 'High-performance networking'
          },
          physical: {
            form_factor: '4U',
            depth: '760mm',
            category: 'High Performance'
          },
          power: {
            psu_options: ['1600W', '2000W', '2400W'],
            redundancy: '1+1 or N+1',
            efficiency: '80 PLUS Platinum/Titanium'
          }
        };
      }
      
      // Small servers (SMI1, SMA1)
      else if (serverCode.startsWith('SM')) {
        specs = {
          processor: {
            socket_count: 1,
            max_cores_per_socket: description.includes('AMD') ? 16 : 10,
            max_threads_per_socket: description.includes('AMD') ? 32 : 20,
            socket_type: description.includes('AMD') ? 'SP5' : 'LGA4677',
            architecture: description.includes('AMD') ? 'AMD EPYC' : 'Intel Xeon Silver'
          },
          memory: {
            max_capacity: '1TB',
            slots: 16,
            type: 'DDR5 RDIMM',
            ecc: true,
            speeds_supported: ['4800 MT/s']
          },
          storage: {
            front_bays: { count: 8, size: '2.5"', interfaces: ['SATA', 'SAS'] },
            internal_m2: 2,
            raid_support: ['SW RAID 0,1,10']
          },
          network: {
            onboard_ports: '2x 1GbE',
            pcie_slots: 2,
            expansion_options: 'Basic networking expansion'
          },
          physical: {
            form_factor: '1U',
            depth: '650mm',
            category: 'Entry Level'
          },
          power: {
            psu_options: ['450W', '550W'],
            redundancy: 'Single or 1+1',
            efficiency: '80 PLUS Gold'
          }
        };
      }
      
      // Apply the specifications if we found a match
      if (Object.keys(specs).length > 0) {
        enhanced.base_specifications = {
          ...baseSpecs,
          ...specs
        };
      }
    }
    
    return enhanced;
  }, []);

  // Helpers to normalize SurrealDB Thing IDs and parse sizes/speeds
  const normalizeThingId = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') {
      // handle forms like hardware_model-XYZ or hardware_model:XYZ or just XYZ
      const m = val.match(/^[^:-]+[:\-](.+)$/);
      return m ? m[1] : val;
    }
    if (typeof val === 'object') {
      // SurrealDB Thing: { tb: 'hardware_model', id: '...' } or id as { String: '...' }
      const rawId: any = (val as any).id;
      if (typeof rawId === 'object' && rawId && 'String' in rawId) return String((rawId as any).String);
      if (rawId !== undefined) return String(rawId);
      // sometimes frontend wraps again
      if ('tb' in (val as any) && 'id' in (val as any)) return String((val as any).id);
      // unknown shape
      return JSON.stringify(val);
    }
    return String(val);
  };

  const parseCapacityGB = (txt?: string): number => {
    if (!txt) return 0;
    const t = txt.toUpperCase();
    const m = t.match(/(\d+(?:\.\d+)?)\s*(TB|GB|MB)/i);
    if (!m) return 0;
    const num = parseFloat(m[1]);
    const unit = m[2].toUpperCase();
    if (unit === 'TB') return num * 1024;
    if (unit === 'GB') return num;
    if (unit === 'MB') return num / 1024;
    return 0;
  };

  const extractCores = (txt?: string): number | null => {
    if (!txt) return null;
    const m = txt.match(/\b(\d{1,3})\s*(?:C|CORES?)\b/i);
    return m ? parseInt(m[1], 10) : null;
  };
  
  const extractGHz = (txt?: string): number | null => {
    if (!txt) return null;
    const m = txt.match(/(\d+(?:\.\d+)?)\s*GHZ/i);
    return m ? parseFloat(m[1]) : null;
  };

  // Enhanced hardware models with Lenovo specifications
  const enhancedHardwareModels = React.useMemo(() => {
    return hardwareModels.map(model => {
      // Only enhance Lenovo models
      const currentBasket = hardwareBaskets.find(b => 
        normalizeThingId(b.id) === selectedBasket
      );
      
      if (currentBasket?.vendor === 'Lenovo') {
        return enhanceLenovoSpecs(model);
      }
      
      return model;
    });
  }, [hardwareModels, hardwareBaskets, selectedBasket, enhanceLenovoSpecs]);

  const serverRows = React.useMemo(() => {
    return enhancedHardwareModels.filter(isActualServerModel);
  }, [enhancedHardwareModels]);

  // Build derived specs per model by analyzing its extensions
  const derivedSpecsByModelId = React.useMemo(() => {
    const map = new Map<string, any>();
    if (!extensions || extensions.length === 0 || serverRows.length === 0) return map;
    // index extensions by normalized model id
    const grouped = new Map<string, HardwareExtension[]>();
    for (const ext of extensions as any) {
      const key = normalizeThingId((ext as any).model_id);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(ext as any);
    }
    for (const m of serverRows as any) {
      const key = normalizeThingId((m as any).id);
      const exts = grouped.get(key) || [];
      if (exts.length === 0) continue;
      // processor
      const cpuExts = exts.filter(e => /cpu|processor|xeon|epyc/i.test(`${e.category || ''} ${e.type || ''} ${e.name || ''}`));
      let cpuModel = '';
      let cpuCores: number | undefined;
      let cpuGHz: number | undefined;
      const cpuCount = cpuExts.length || undefined;
      if (cpuExts.length) {
        const pick = cpuExts[0];
        cpuModel = (pick.name || pick.type || '').toString();
        const c = extractCores(cpuModel) || extractCores(pick.size || '') || extractCores(pick.type || '');
        const f = extractGHz(cpuModel) || extractGHz(pick.speed || '') || extractGHz(pick.type || '');
        if (c) cpuCores = c;
        if (f) cpuGHz = f;
      }
      const processor: any = {};
      if (cpuCount) processor.count = cpuCount;
      if (cpuModel) processor.model = cpuModel;
      if (cpuCores) processor.cores = cpuCores;
      if (cpuGHz) processor.base_frequency = `${cpuGHz}GHz`;

      // memory
      const memExts = exts.filter(e => /memory|dimm|rdimm|udimm|ddr/i.test(`${e.category || ''} ${e.type || ''} ${e.name || ''}`));
      let moduleCount = memExts.length || 0;
      let totalGB = 0;
      let memSpeed: string | undefined;
      for (const me of memExts) {
        totalGB += parseCapacityGB(me.size || me.name);
        if (!memSpeed) {
          const sp = (me.speed || me.name || '').match(/\b(\d{3,4})\b/);
          if (sp) memSpeed = `${sp[1]}`; // e.g., 4800
        }
      }
      const memory: any = {};
      if (totalGB > 0) memory.total_capacity = `${Math.round(totalGB)}GB`;
      if (moduleCount > 0) memory.module_count = moduleCount;
      if (memSpeed) memory.speed = `${memSpeed} MT/s`;

      // storage (very coarse)
      const storExts = exts.filter(e => /ssd|hdd|sata|sas|nvme|drive|bay/i.test(`${e.category || ''} ${e.type || ''} ${e.name || ''}`));
      let driveCount = storExts.length || 0;
      let totalStorGB = 0;
      for (const se of storExts) totalStorGB += parseCapacityGB(se.size || se.name);
      const storage: any = {};
      if (driveCount > 0) storage.slots = [{ count: driveCount, size: '2.5"', interface: '' }];
      if (totalStorGB > 0) storage.total_capacity = totalStorGB >= 1024 ? `${(totalStorGB / 1024).toFixed(2)}TB` : `${Math.round(totalStorGB)}GB`;

      // network
      const nicExts = exts.filter(e => /nic|ethernet|lan|10gb|25gb|40gb|100gb|gbe|sfp|qsfp/i.test(`${e.category || ''} ${e.type || ''} ${e.name || ''}`));
      const ports: any[] = [];
      const speedCounts = new Map<string, number>();
      for (const ne of nicExts) {
        const speedMatch = (ne.speed || ne.name || '').match(/(100|40|25|10)\s*Gb/i);
        const speed = speedMatch ? `${speedMatch[1]}Gb` : 'Unknown';
        speedCounts.set(speed, (speedCounts.get(speed) || 0) + 1);
      }
      for (const [spd, cnt] of speedCounts) ports.push({ count: cnt, speed: spd });
      const network: any = {};
      if (ports.length) network.ports = ports;

      const spec: any = {};
      if (Object.keys(processor).length) spec.processor = processor;
      if (Object.keys(memory).length) spec.memory = memory;
      if (Object.keys(storage).length) spec.storage = storage;
      if (Object.keys(network).length) spec.network = network;
      if (Object.keys(spec).length) map.set(key, spec);
    }
    return map;
  }, [extensions, serverRows]);

  // Hardware basket functions
  const fetchHardwareBaskets = async () => {
    try {
      const response = await fetch(`${API_URL}/hardware-baskets`, {
        headers: {
          'x-user-id': currentUser.id, // Send user ID for authentication
        },
      });
      if (response.ok) {
        const data = await response.json();
        setHardwareBaskets(data);
      }
    } catch (error) {
      console.error('Failed to fetch hardware baskets:', error);
    }
  };

  const fetchHardwareModels = async (basketId: string) => {
    try {
      setLoading(true);
      console.log('Fetching models for basket ID:', basketId);
      
      // Extract the actual ID from the frontend format 
      // (hardware_basket-{id} -> {id} OR hardware_basket:{id} -> {id})
      let actualBasketId = basketId;
      if (basketId.startsWith('hardware_basket-')) {
        actualBasketId = basketId.replace('hardware_basket-', '');
      } else if (basketId.startsWith('hardware_basket:')) {
        actualBasketId = basketId.replace('hardware_basket:', '');
      }
      
      console.log('Converted basket ID for API:', actualBasketId);
      
      // Try the models endpoint first
      let response = await fetch(`${API_URL}/hardware-baskets/${actualBasketId}/models`);
      let data = [];
      
      if (response.ok) {
        data = await response.json();
        console.log('Models endpoint returned:', data.length, 'models');
      }
      
      // If no models from /models endpoint, try /servers endpoint
      if (data.length === 0) {
        console.log('🔄 Trying servers endpoint...');
        response = await fetch(`${API_URL}/hardware-baskets/${actualBasketId}/servers`);
        if (response.ok) {
          const serversData = await response.json();
          console.log('Servers endpoint returned:', serversData.length, 'servers');
          
          // Transform server data to match frontend model format
          data = serversData.map((server: any, index: number) => ({
            id: `server-${index}`,
            vendor: server.vendor,
            model_name: server.model || server.lot_description || 'Unknown Model',
            lot_description: server.lot_description || server.model || 'Unknown Description',
            category: 'Server',
            form_factor: server.form_factor,
            specifications: server.specifications || {},
            unit_price_usd: server.unit_price_usd || 0
          }));
        }
      }
      
  console.log('Final models to display:', data.length);
      setHardwareModels(data);

      // Also fetch extensions for the selected basket
      try {
        const extResp = await fetch(`${API_URL}/hardware-baskets/${actualBasketId}/extensions`);
        if (extResp.ok) {
          const extData = await extResp.json();
          setExtensions(extData);
        } else {
          setExtensions([]);
        }
      } catch (e) {
        setExtensions([]);
      }

      // For Dell baskets, create synthetic extensions from non-server models
      if (data.some((m: any) => m.vendor === 'Dell' || actualBasketId === 'ddjed7dq3lnr8ri66asu')) {
        const dellExtensions = data
          .filter((model: any) => {
            const name = model.model_name || '';
            // Identify management, compute, or specialized components
            return /\b(DHC\d+|MGMT|Compute|Management|Controller|Switch|Storage Array)\b/i.test(name);
          })
          .map((model: any, index: number) => ({
            id: `dell-ext-${index}`,
            model_id: model.id,
            name: model.model_name,
            category: model.model_name?.includes('MGMT') ? 'management' : 
                     model.model_name?.includes('Compute') ? 'compute' : 'component',
            type: model.category || 'hardware',
            part_number: `DELL-${model.id}`,
            size: null,
            speed: null,
            price: model.price || { amount: 0, currency: 'USD' }
          }));
        
        if (dellExtensions.length > 0) {
          setExtensions(dellExtensions);
          console.log(`Created ${dellExtensions.length} Dell extension components`);
        }
      }
    } catch (error) {
      console.error('Failed to fetch hardware models:', error);
      setHardwareModels([]);
      setExtensions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Check permissions first
    if (!UserPermissions.canCreateHardwareBaskets(currentUser)) {
      setMessage({
        type: 'error',
        title: 'Permission Denied',
        body: 'You do not have permission to upload hardware baskets. Contact your administrator.'
      });
      return;
    }

    setIsUploading(true);
    try {
      // Use the simple upload endpoint
      const formData = new FormData();
      formData.append('file', file);
      formData.append('vendor', selectedVendor || 'Unknown');

      const response = await fetch(`${API_URL}/hardware-baskets/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Upload result:', result);
        // Refresh basket list after upload
        fetchHardwareBaskets();
        // Process the servers and components from the simple upload response
        if (result.servers && result.components) {
          // Transform the response data to match our frontend expectations
          const transformedServers = result.servers.map((server: any, index: number) => ({
            id: `server-${index}`,
            vendor: server.vendor,
            model_name: server.model || server.lot_description || 'Unknown Model',
            lot_description: server.lot_description || server.model || 'Unknown Description', 
            category: 'Server',
            form_factor: server.form_factor,
            specifications: server.specifications || {},
            unit_price_usd: server.unit_price_usd || 0
          }));

          const transformedComponents = result.components.map((component: any, index: number) => ({
            id: `component-${index}`,
            vendor: component.vendor,
            model_name: component.description || 'Unknown Component',
            lot_description: component.description || 'Unknown Description',
            category: component.category || 'Component',
            specifications: component.specifications || {},
            unit_price_usd: component.unit_price_usd || 0
          }));

          // Update the hardware models with the combined data
          setHardwareModels([...transformedServers, ...transformedComponents]);
          setMessage({
            type: 'success',
            title: 'Hardware Basket Uploaded',
            body: `Successfully parsed ${result.servers.length} server configurations and ${result.components.length} components`
          });
        } else {
          setMessage({
            type: 'success', 
            title: 'Hardware Basket Uploaded',
            body: `Upload completed successfully`
          });
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        title: 'Upload Failed',
        body: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Fetch hardware baskets when basket tab is accessed
  useEffect(() => {
    if (activeTab === 'basket') {
      fetchHardwareBaskets();
    }
  }, [activeTab]);

  // Fetch models when basket is selected
  useEffect(() => {
    if (selectedBasket) {
  fetchHardwareModels(selectedBasket);
    } else {
      setHardwareModels([]);
  setExtensions([]);
    }
  }, [selectedBasket]);

  const getStatsOverview = () => [
    { 
      title: 'Server Models', 
      value: '1,247', 
      icon: <ServerRegular />, 
      change: '+23 this week',
      color: '#0066cc'
    },
    { 
      title: 'Vendors Active', 
      value: '3', 
      icon: <DatabaseRegular />, 
      change: 'Dell, HPE, Lenovo',
      color: 'var(--text-primary)'
    },
    { 
      title: 'Configs Processed', 
      value: '89', 
      icon: <DocumentDataRegular />, 
      change: '+12 today',
      color: '#dc2626'
    },
    { 
      title: 'Last Sync', 
      value: '2 hrs ago', 
      icon: <CloudSyncRegular />, 
      change: 'All vendors current',
      color: '#7c3aed'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {getStatsOverview().map((stat, index) => (
              <ConsistentCard
                key={index}
                title={stat.value}
                subtitle={stat.title}
                icon={<div style={{ color: stat.color, fontSize: '24px' }}>{stat.icon}</div>}
                style={{ textAlign: 'center' }}
              >
                <div style={{ 
                  marginTop: '12px', 
                  padding: '8px 12px', 
                  background: 'rgba(59, 130, 246, 0.1)', 
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: 'var(--text-primary)'
                }}>
                  {stat.change}
                </div>
              </ConsistentCard>
            ))}
          </div>
        );

      case 'upload':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <ConsistentCard 
              title="Hardware Configuration Upload"
              subtitle="Upload vendor-specific configuration files to populate server data"
              icon={<CloudArrowUpRegular />}
              allowOverflow={true}
            >
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', // Increased minmax to accommodate upload components
                gap: '24px',
                marginTop: '24px',
                alignItems: 'start' // Align items to start to prevent stretching
              }}>
                {/* Dell Upload */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    marginBottom: '16px' 
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #0066cc 0%, #004499 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      D
                    </div>
                    <div>
                      <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Dell SCP Files</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>System Configuration Profile (XML)</div>
                    </div>
                  </div>
                  {UserPermissions.canCreateHardwareBaskets(currentUser) ? (
                    <SimpleFileUpload
                      uploadType="hardware"
                      acceptedTypes={['.xml']}
                      label="Upload Dell SCP"
                      description="Select XML file"
                      onFileProcessed={(result) => {
                        setMessage({
                          type: 'success',
                          title: 'Dell SCP File Processed',
                          body: `${result.name || 'File'} has been analyzed and server data extracted.`
                        });
                      }}
                      onError={(error: string) => {
                        setMessage({
                          type: 'error',
                          title: 'Upload Failed',
                          body: error || 'Failed to process Dell SCP file'
                        });
                      }}
                    />
                  ) : (
                    <div style={{ 
                      padding: '1rem', 
                      backgroundColor: '#f3f4f6', 
                      borderRadius: '8px',
                      color: 'var(--text-secondary)',
                      textAlign: 'center'
                    }}>
                      <InfoRegular style={{ fontSize: '24px', marginBottom: '0.5rem' }} />
                      <div>Upload permission required</div>
                      <div style={{ fontSize: '12px' }}>Contact your administrator for upload access</div>
                    </div>
                  )}
                </div>

                {/* HPE Upload */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    marginBottom: '16px' 
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #00b388 0%, #008766 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      H
                    </div>
                    <div>
                      <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>HPE iQuote Files</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Quote files (CSV, TXT, XLS)</div>
                    </div>
                  </div>
                  <SimpleFileUpload
                    uploadType="hardware"
                    acceptedTypes={['.csv', '.txt', '.xls', '.xlsx']}
                    label="Upload HPE iQuote"
                    description="Select quote files"
                    onFileProcessed={(result: any) => {
                      setMessage({
                        type: 'success',
                        title: 'HPE iQuote File Processed',
                        body: `${result.name || 'File'} has been analyzed and server data extracted.`
                      });
                    }}
                    onError={(error: string) => {
                      setMessage({
                        type: 'error',
                        title: 'HPE iQuote Processing Failed',
                        body: error
                      });
                    }}
                  />
                </div>

                {/* Lenovo Upload */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    marginBottom: '16px' 
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #dc382d 0%, #b71c1c 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      L
                    </div>
                    <div>
                      <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Lenovo DCSC Files</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Data Center System Configuration (XML)</div>
                    </div>
                  </div>
                  <SimpleFileUpload
                    uploadType="hardware"
                    acceptedTypes={['.xml']}
                    label="Upload Lenovo DCSC"
                    description="Select XML file"
                    onFileProcessed={(result: any) => {
                      setMessage({
                        type: 'success',
                        title: 'Lenovo DCSC File Processed',
                        body: `${result.name || 'File'} has been analyzed and server data extracted.`
                      });
                    }}
                    onError={(error: string) => {
                      setMessage({
                        type: 'error',
                        title: 'Lenovo DCSC Processing Failed',
                        body: error
                      });
                    }}
                  />
                </div>
              </div>
            </ConsistentCard>

            {/* Vendor Configuration */}
            <ConsistentCard
              title="Vendor API Configuration"
              subtitle="Configure credentials and settings for real-time vendor data access"
              icon={<SettingsRegular />}
              actions={
                <div style={{ display: 'flex', gap: '8px' }}>
                  <ConsistentButton variant="outline" size="small">
                    Configure
                  </ConsistentButton>
                  <ConsistentButton variant="secondary" size="small" loading={loading}>
                    Test Connection
                  </ConsistentButton>
                </div>
              }
            >
              <div style={{ marginTop: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                Configure API credentials for Dell, HPE, and Lenovo to enable real-time pricing and specification retrieval.
              </div>
            </ConsistentCard>
          </div>
        );

      case 'search':
        return (
          <ConsistentCard
            title="Configuration Search"
            subtitle="Find server configurations based on your workload requirements"
            icon={<SearchRegular />}
          >
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px',
              marginTop: '24px',
              marginBottom: '24px'
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  fontWeight: '500',
                  color: 'var(--text-primary)'
                }}>
                  Workload Type
                </label>
                <select
                  value={searchRequirements.workload_type}
                  onChange={(e) => setSearchRequirements(prev => ({...prev, workload_type: e.target.value}))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="General">General Purpose</option>
                  <option value="WebServer">Web Server</option>
                  <option value="Database">Database</option>
                  <option value="Virtualization">Virtualization</option>
                  <option value="HighPerformanceComputing">HPC</option>
                  <option value="Storage">Storage</option>
                  <option value="AIMLTraining">AI/ML Training</option>
                  <option value="AIMLInference">AI/ML Inference</option>
                </select>
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  fontWeight: '500',
                  color: 'var(--text-primary)'
                }}>
                  Minimum CPU Cores
                </label>
                <input
                  type="number"
                  placeholder="e.g. 16"
                  value={searchRequirements.cpu_cores_minimum || ''}
                  onChange={(e) => setSearchRequirements(prev => ({
                    ...prev, 
                    cpu_cores_minimum: e.target.value ? parseInt(e.target.value) : undefined
                  }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  fontWeight: '500',
                  color: 'var(--text-primary)'
                }}>
                  Minimum Memory (GB)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 128"
                  value={searchRequirements.memory_gb_minimum || ''}
                  onChange={(e) => setSearchRequirements(prev => ({
                    ...prev, 
                    memory_gb_minimum: e.target.value ? parseInt(e.target.value) : undefined
                  }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <ConsistentButton 
                variant="primary"
                loading={loading}
                onClick={() => {
                  setMessage({
                    type: 'info',
                    title: 'Configuration Search',
                    body: `Searching for ${searchRequirements.workload_type} configurations...`
                  });
                }}
              >
                <SearchRegular style={{ marginRight: '8px' }} />
                Search Configurations
              </ConsistentButton>
            </div>

            {/* Mock search results */}
            {searchRequirements.workload_type !== 'General' && (
              <div style={{ 
                borderTop: '1px solid rgba(0, 0, 0, 0.1)', 
                paddingTop: '24px',
                marginTop: '24px'
              }}>
                <h4 style={{ marginBottom: '16px', color: 'var(--text-primary)', fontSize: '16px', fontWeight: '600' }}>
                  Recommended Configurations (3)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {serverModels.slice(0, 3).map((model, index) => (
                    <div 
                      key={model.model_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ServerRegular style={{ color: '#7c3aed', fontSize: '20px' }} />
                        <div>
                          <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                            {model.model_name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Optimized for {searchRequirements.workload_type} workloads
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          background: 'rgba(34, 197, 94, 0.1)',
                          color: '#059669',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {85 + index * 5}% Match
                        </span>
                        <ConsistentButton variant="outline" size="small">
                          View Details
                        </ConsistentButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ConsistentCard>
        );

      case 'basket':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Upload Section */}
            <ConsistentCard
              title="Upload Hardware Basket"
              subtitle="Import Excel hardware basket files from Dell, Lenovo, and other vendors"
              icon={<CloudArrowUpRegular />}
              allowOverflow={true}
            >
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', // Increased to 340px for better fit
                gap: '32px', // Increased gap for better spacing
                marginTop: '0', // Remove top margin to prevent header overlap
                alignItems: 'start',
                padding: '16px 0' // Add vertical padding for proper spacing
              }}>
                {/* Excel Upload */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '16px',
                  minHeight: '250px' // Ensure minimum height for content
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '14px',
                      flexShrink: 0
                    }}>
                      <DataBarHorizontal24Regular />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Hardware Basket Files</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Excel files with pricing and configurations</div>
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <SimpleFileUpload
                      uploadType="hardware-basket"
                      acceptedTypes={['.xlsx', '.xls']}
                      label="Upload Hardware Basket"
                      description="Select Excel files"
                      onFileProcessed={async (result: any) => {
                      if (result.file) {
                        await handleFileUpload(result.file);
                      }
                    }}
                    onError={(error: string) => {
                      setMessage({
                        type: 'error',
                        title: 'Hardware Basket Upload Failed',
                        body: error
                      });
                    }}
                  />
                  </div>
                </div>
              </div>
            </ConsistentCard>

            {/* Hardware Basket Browser */}
            <ConsistentCard
              title="Hardware Basket Browser"
              subtitle="Browse and search through uploaded hardware baskets and models"
              icon={<DatabaseRegular />}
              actions={
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={selectedBasket}
                    onChange={(e) => setSelectedBasket(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  >
                    <option value="">Select Hardware Basket</option>
                    <option value="ALL">Display All</option>
                    {hardwareBaskets.map((basket, index) => {
                      // Handle SurrealDB Thing object IDs properly
                      let basketId: string;
                      if (typeof basket.id === 'object' && basket.id !== null) {
                        const idObj = basket.id as { tb?: string; id?: any };
                        if (idObj.tb && idObj.id) {
                          // Handle nested ID objects
                          const actualId = typeof idObj.id === 'object' && idObj.id.String 
                            ? idObj.id.String 
                            : String(idObj.id);
                          basketId = `${idObj.tb}-${actualId}`;
                        } else {
                          basketId = `basket-${index}`;
                        }
                      } else {
                        basketId = String(basket.id || `basket-${index}`);
                      }
                      
                      console.log('🏀 Basket ID generated:', basketId, 'for basket:', basket.name);
                      
                      return (
                        <option key={basketId} value={basketId}>
                          {basket.name} - {basket.vendor} {basket.quarter} {basket.year}
                        </option>
                      );
                    })}
                  </select>
                  <ConsistentButton 
                    variant="outline" 
                    size="small" 
                    loading={loading}
                    onClick={() => fetchHardwareBaskets()}
                  >
                    <CloudSyncRegular style={{ marginRight: '4px' }} />
                    Refresh
                  </ConsistentButton>
                </div>
              }
            >
              {/* Search and Filter Bar */}
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                marginBottom: '24px',
                padding: '16px',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '12px'
              }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <SearchRegular style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-secondary)',
                    fontSize: '16px'
                  }} />
                  <input
                    type="text"
                    placeholder="Search hardware models..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="lcm-search"
                    style={{
                      paddingLeft: '40px'
                    }}
                  />
                </div>
              </div>

              {/* Servers / Extensions Tab Switcher */}
              {selectedBasket && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <button
                    onClick={() => setBasketSubTab('servers')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      background: basketSubTab === 'servers' ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(139, 92, 246, 0.15) 100%)' : 'transparent',
                      backdropFilter: basketSubTab === 'servers' ? 'blur(20px) saturate(130%)' : 'none',
                      color: basketSubTab === 'servers' ? '#111827' : '#6b7280',
                      cursor: 'pointer'
                    }}
                  >
                    Servers ({serverRows.length})
                  </button>
                  <button
                    onClick={() => setBasketSubTab('extensions')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      background: basketSubTab === 'extensions' ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(139, 92, 246, 0.15) 100%)' : 'transparent',
                      backdropFilter: basketSubTab === 'extensions' ? 'blur(20px) saturate(130%)' : 'none',
                      color: basketSubTab === 'extensions' ? '#111827' : '#6b7280',
                      cursor: 'pointer'
                    }}
                  >
                    Extensions ({extensions.length})
                  </button>
                </div>
              )}

              {/* Hardware Models / Extensions Tables */}
              {selectedBasket && basketSubTab === 'servers' ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    fontSize: '14px'
                  }}>
                    <thead>
                      <tr style={{ 
                        background: 'rgba(0, 0, 0, 0.02)',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
                      }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }} onClick={() => toggleSort('model')}>Model {sortColumn === 'model' ? (sortDesc ? '↓' : '↑') : ''}</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }} onClick={() => toggleSort('category')}>Category {sortColumn === 'category' ? (sortDesc ? '↓' : '↑') : ''}</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }} onClick={() => toggleSort('form_factor')}>Form Factor {sortColumn === 'form_factor' ? (sortDesc ? '↓' : '↑') : ''}</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }} onClick={() => toggleSort('cpu')}>CPU {sortColumn === 'cpu' ? (sortDesc ? '↓' : '↑') : ''}</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }} onClick={() => toggleSort('memory')}>Memory {sortColumn === 'memory' ? (sortDesc ? '↓' : '↑') : ''}</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }} onClick={() => toggleSort('storage')}>Storage {sortColumn === 'storage' ? (sortDesc ? '↓' : '↑') : ''}</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }} onClick={() => toggleSort('network')}>Network {sortColumn === 'network' ? (sortDesc ? '↓' : '↑') : ''}</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(sortColumn ? [...serverRows].sort((a: any, b: any) => {
                        const av = getSortableValue(a, sortColumn);
                        const bv = getSortableValue(b, sortColumn);
                        if (av < bv) return sortDesc ? 1 : -1;
                        if (av > bv) return sortDesc ? -1 : 1;
                        return 0;
                      }) : serverRows)
                        .filter(model => {
                          const matchesSearch = !searchQuery || model.model_name.toLowerCase().includes(searchQuery.toLowerCase()) || model.lot_description.toLowerCase().includes(searchQuery.toLowerCase());
                          return matchesSearch;
                        })
                        .map((model) => (
                          <tr 
                            key={normalizeThingId(model.id)}
                            style={{
                              borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <td style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ServerRegular style={{ color: 'var(--text-secondary)' }} />
                                <div>
                                  <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                                    {model.model_name}
                                  </div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    {model.lot_description}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500',
                                background: 'rgba(59, 130, 246, 0.1)',
                                color: '#2563eb'
                              }}>
                                {model.category}
                              </span>
                            </td>
                            <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                              {deriveFormFactor(model) || 'N/A'}
                            </td>
                            <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                              <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {(() => {
                                  const base = (model as any).base_specifications || (model as any).specifications || {};
                                  const derived = derivedSpecsByModelId.get(normalizeThingId((model as any).id));
                                  const specSource = (derived && derived.processor) ? derived : base;
                                  return formatCpuSpec(specSource, model);
                                })()}
                              </div>
                            </td>
                            <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                              <div style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {(() => {
                                  const base = (model as any).base_specifications || (model as any).specifications || {};
                                  const derived = derivedSpecsByModelId.get(normalizeThingId((model as any).id));
                                  const specSource = (derived && derived.memory) ? derived : base;
                                  return formatMemorySpec(specSource, model);
                                })()}
                              </div>
                            </td>
                            <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                              <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {(() => {
                                  const base = (model as any).base_specifications || (model as any).specifications || {};
                                  const derived = derivedSpecsByModelId.get(normalizeThingId((model as any).id));
                                  const specSource = (derived && derived.storage) ? derived : base;
                                  return formatStorageSpec(specSource, model);
                                })()}
                              </div>
                            </td>
                            <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                              <div style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {(() => {
                                  const base = (model as any).base_specifications || (model as any).specifications || {};
                                  const derived = derivedSpecsByModelId.get(normalizeThingId((model as any).id));
                                  const specSource = (derived && derived.network) ? derived : base;
                                  return formatNetworkSpec(specSource, model);
                                })()}
                              </div>
                            </td>
                            <td style={{ padding: '12px', color: 'var(--text-primary)' }}>
                              <button
                                onClick={() => setPriceModalModel(model)}
                                style={{
                                  padding: '4px 12px',
                                  backgroundColor: 'var(--brand-primary)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {hardwareModels.length === 0 && !loading && (
                    <div style={{ 
                      padding: '48px', 
                      textAlign: 'center',
                      color: 'var(--text-secondary)'
                    }}>
                      {selectedBasket ? 'No models found in this basket.' : 'Select a hardware basket to view models.'}
                    </div>
                  )}
                </div>
              ) : selectedBasket && basketSubTab === 'extensions' ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    fontSize: '14px'
                  }}>
                    <thead>
                      <tr style={{ 
                        background: 'rgba(0, 0, 0, 0.02)',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
                      }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>Name</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>Category</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>Type</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>Size</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>Speed</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>Part Number</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extensions
                        .filter(ext => !searchQuery || ext.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((ext, idx) => (
                          <tr key={(ext as any).id || `${ext.part_number}-${idx}`} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <td style={{ padding: '12px' }}>{ext.name}</td>
                            <td style={{ padding: '12px' }}>{ext.category}</td>
                            <td style={{ padding: '12px' }}>{ext.type}</td>
                            <td style={{ padding: '12px' }}>{ext.size || '—'}</td>
                            <td style={{ padding: '12px' }}>{ext.speed || '—'}</td>
                            <td style={{ padding: '12px' }}>{ext.part_number || '—'}</td>
                            <td style={{ padding: '12px' }}>
                              {(ext as any).price ? `${(ext as any).price.amount.toFixed(2)} ${(ext as any).price.currency}` : '—'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {extensions.length === 0 && !loading && (
                    <div style={{ 
                      padding: '48px', 
                      textAlign: 'center',
                      color: 'var(--text-secondary)'
                    }}>
                      {(() => {
                        const currentBasket = hardwareBaskets.find(b => 
                          normalizeThingId(b.id) === selectedBasket
                        );
                        return currentBasket?.vendor === 'Dell' 
                          ? 'Dell baskets do not have separate extension components. All hardware configurations are included in the server models above.' 
                          : 'No extensions found for this basket.';
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ 
                  padding: '48px', 
                  textAlign: 'center',
                  color: 'var(--text-secondary)'
                }}>
                  {hardwareBaskets.length === 0 
                    ? 'Upload an Excel hardware basket file to get started.' 
                    : 'Select a hardware basket from the dropdown above to view models.'
                  }
                </div>
              )}
            </ConsistentCard>
          </div>
        );

      default:
        return <div>Configuration options coming soon...</div>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '24px', color: '#7c3aed' }}>
            <CloudArrowUpRegular />
          </div>
          <div>
            <h1 style={{ margin: '0', fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Vendor Data Collection & Server Sizing
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Comprehensive vendor hardware management and server configuration tools
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ConsistentButton 
            variant="outline"
            onClick={() => {
              console.log('Test message button clicked');
              setMessage({
                type: 'info',
                title: 'Test Message',
                body: 'This is a test to verify that the message system is working correctly.'
              });
            }}
          >
            Test Message
          </ConsistentButton>
          <ConsistentButton variant="outline">
            <DocumentDataRegular style={{ marginRight: '8px' }} />
            Import Catalog
          </ConsistentButton>
          <ConsistentButton variant="secondary">
            <CloudArrowUpRegular style={{ marginRight: '8px' }} />
            Export Data
          </ConsistentButton>
        </div>
      </div>
      {/* Status Message */}
      {message && (
        <ConsistentCard
          style={{
            marginBottom: '24px',
            background: message.type === 'error' ? 'rgba(239, 68, 68, 0.05)' : 
                       message.type === 'success' ? 'rgba(34, 197, 94, 0.05)' : 
                       'rgba(59, 130, 246, 0.05)',
            border: message.type === 'error' ? '1px solid rgba(239, 68, 68, 0.2)' : 
                   message.type === 'success' ? '1px solid rgba(34, 197, 94, 0.2)' : 
                   '1px solid rgba(59, 130, 246, 0.2)'
          }}
          actions={
            <ConsistentButton
              variant="ghost"
              size="small"
              onClick={() => setMessage(null)}
            >
              ×
            </ConsistentButton>
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '20px' }}>
              {message.type === 'success' && <CheckmarkCircleRegular style={{ color: '#059669' }} />}
              {message.type === 'error' && <ErrorCircleRegular style={{ color: '#dc2626' }} />}
              {message.type === 'info' && <InfoRegular style={{ color: '#2563eb' }} />}
            </div>
            <div>
              <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '14px' }}>
                {message.title}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                {message.body}
              </div>
            </div>
          </div>
        </ConsistentCard>
      )}

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '4px', 
        marginBottom: '24px',
        padding: '4px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(139, 92, 246, 0.12) 100%)',
                    backdropFilter: 'blur(25px) saturate(140%)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '12px'
      }}>
        {[
          { id: 'overview', label: 'Overview', icon: <DatabaseRegular /> },
          { id: 'upload', label: 'Upload', icon: <CloudArrowUpRegular /> },
          { id: 'search', label: 'Search', icon: <SearchRegular /> },
          { id: 'basket', label: 'Hardware Basket', icon: <ServerRegular /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === tab.id ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(139, 92, 246, 0.15) 100%)' : 'transparent',
              backdropFilter: activeTab === tab.id ? 'blur(20px) saturate(130%)' : 'none',
              color: activeTab === tab.id ? '#111827' : '#6b7280',
              boxShadow: activeTab === tab.id ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            <div style={{ fontSize: '16px' }}>{tab.icon}</div>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Price Modal */}
      {priceModalModel && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setPriceModalModel(null);
          }
        }}
        >
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            minWidth: '400px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            position: 'relative',
            transform: 'translateZ(0)' // Force hardware acceleration
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600' }}>
                Pricing Details
              </h3>
              <button
                onClick={() => setPriceModalModel(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Model:</strong>
              <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                {priceModalModel.model_name}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Category:</strong>
              <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                {priceModalModel.category || 'N/A'}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Price:</strong>
              <div style={{ 
                color: 'var(--text-primary)', 
                marginTop: '4px',
                fontSize: '16px',
                fontWeight: '500'
              }}>
                {((priceModalModel as any).price && (priceModalModel as any).price.amount !== undefined)
                  ? `${(priceModalModel as any).price.amount.toFixed(2)} ${(priceModalModel as any).price.currency}`
                  : (priceModalModel as any).unit_price_usd
                    ? `$${Number((priceModalModel as any).unit_price_usd).toFixed(2)} USD`
                    : 'No pricing data available'}
              </div>
            </div>

            {priceModalModel.lot_description && (
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Description:</strong>
                <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {priceModalModel.lot_description}
                </div>
              </div>
            )}

            <div style={{ textAlign: 'right', marginTop: '24px' }}>
              <button
                onClick={() => setPriceModalModel(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--brand-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDataCollectionView;
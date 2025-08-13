/**
 * Hardware Basket Data Models
 * TypeScript interfaces for Dell and Lenovo hardware basket imports
 * Based on analysis of Q3 2025 Excel files
 */

// User roles and permissions
export type UserRole = 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  username: string;
  email: string;
  ad_guid: string;
  role: UserRole;
}

// Hardware basket creation request
export interface CreateHardwareBasketRequest {
  name: string;
  vendor: string;
  quarter: string;
  year: number;
}

// Base vendor information
export interface HardwareVendor {
  id: string;
  name: 'Dell' | 'Lenovo' | 'HP' | 'Cisco' | string;
  contact_info?: string;
  support_info?: string;
  created_at: Date;
  updated_at: Date;
}

// Hardware basket import metadata
export interface HardwareBasket {
  id: string;
  name: string;
  vendor: string;
  quarter: string;
  year: number;
  import_date: Date;
  file_path: string;
  exchange_rate?: number;
  currency_from: string;
  currency_to: string;
  validity_date?: Date;
  created_by: string; // User ID who created this basket
  is_global: boolean; // Whether this basket is globally visible
  created_at: Date;
  description?: string; // Optional description
  total_models?: number; // Total number of models in this basket
  total_configurations?: number; // Total number of configurations in this basket
}

// Base hardware model/lot
export interface HardwareModel {
  id: string;
  basket_id: string;
  vendor_id: string;
  lot_description: string;
  model_name: string;
  model_number?: string;
  form_factor?: string; // 1U, 2U, etc.
  category: 'server' | 'storage' | 'network' | 'component';
  base_specifications: HardwareSpecifications;
  created_at: Date;
  updated_at: Date;
  cpu_specs?: string; // CPU specifications as string
  memory_specs?: string; // Memory specifications as string  
  storage_specs?: string; // Storage specifications as string
  configuration_count?: number; // Number of configurations for this model
  
  // Enhanced server specification fields
  server_model: string; // R450, R760, etc.
  server_size: string; // 1U, 2U, 4U
  socket_count: number; // 1, 2, etc.
  cpu_model: string; // Processor model name
  cpu_cores: number; // Number of CPU cores
  cpu_threads: number; // Number of CPU threads
  cpu_frequency: string; // CPU frequency
  vsan_ready: boolean; // VSAN Ready flag
  processor_info: string; // Original processor info string
  ram_info: string; // RAM information
  network_info: string; // Network information
  
  // Source information for categorization
  source_sheet: string; // Sheet name from Excel file
  source_section: string; // Section within sheet (e.g., "Base Models", "Upgrade Options")
}

// Hardware specifications (nested JSON)
export interface HardwareSpecifications {
  processor?: ProcessorSpec;
  memory?: MemorySpec;
  storage?: StorageSpec;
  network?: NetworkSpec;
  expansion?: ExpansionSpec;
  power?: PowerSpec;
  physical?: PhysicalSpec;
  security?: SecuritySpec;
}

export interface ProcessorSpec {
  count: number;
  model: string;
  cores?: number;
  threads?: number;
  base_frequency?: string;
  max_frequency?: string;
  tdp?: number;
  socket_type?: string;
}

export interface MemorySpec {
  total_capacity: string;
  module_count: number;
  module_capacity: string;
  type: string; // DDR4, DDR5, etc.
  speed?: string;
  ecc?: boolean;
}

export interface StorageSpec {
  slots: StorageSlot[];
  raid_controller?: string;
  total_capacity?: string;
}

export interface StorageSlot {
  size: string; // 2.5", 3.5"
  count: number;
  interface: string; // SAS, SATA, NVMe
}

export interface NetworkSpec {
  ports: NetworkPort[];
  management_ports?: number;
}

export interface NetworkPort {
  count: number;
  speed: string; // 1Gb, 10Gb, etc.
  type: string; // RJ45, SFP+, etc.
}

export interface ExpansionSpec {
  pcie_slots?: PCIeSlot[];
  riser_cards?: string[];
}

export interface PCIeSlot {
  count: number;
  generation: string; // PCIe 4.0, 5.0
  lanes: number;
  form_factor: string; // full-height, low-profile
}

export interface PowerSpec {
  psu_count: number;
  psu_capacity: string;
  redundancy: boolean;
  efficiency_rating?: string;
}

export interface PhysicalSpec {
  height: string; // 1U, 2U
  depth: string;
  weight?: string;
  mounting: string; // rack, tower
}

export interface SecuritySpec {
  tpm?: string;
  secure_boot?: boolean;
  encryption?: string[];
}

// Hardware configurations (Dell: multiple rows per lot, Lenovo: parts list)
export interface HardwareConfiguration {
  id: string;
  model_id: string;
  part_number?: string;
  sku?: string;
  description: string;
  item_type: 'base_server' | 'processor' | 'memory' | 'storage' | 'network' | 'expansion' | 'service' | 'software';
  quantity: number;
  specifications?: any; // JSON field for component-specific specs
  compatibility_notes?: string;
  created_at: Date;
}

// Pricing information
export interface HardwarePricing {
  id: string;
  configuration_id?: string;
  model_id?: string; // For lot-level pricing
  list_price: number;
  net_price_usd: number;
  net_price_eur?: number;
  currency: string;
  valid_from: Date;
  valid_to?: Date;
  support_options: SupportOption[];
  created_at: Date;
}

export interface SupportOption {
  duration_years: number;
  type: 'pro_support' | 'pro_support_plus' | 'basic' | 'premium';
  price_usd: number;
  price_eur?: number;
  description?: string;
}

// Geographic/Country data
export interface CountrySupport {
  id: string;
  vendor_id: string;
  country: string;
  region?: string;
  fulfillment_capability: 'direct' | 'indirect' | 'both';
  web_ordering: boolean;
  delivery_terms: string;
  delivery_time_days?: number;
  import_duties?: string;
  vat_rates?: string;
  freight_costs?: string;
  affiliate_info?: string;
  created_at: Date;
}

// Exchange rates
export interface ExchangeRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  effective_date: Date;
  expiry_date?: Date;
  source: string; // vendor, manual, api
  created_at: Date;
}

// Import processing results
export interface ImportResult {
  id: string;
  basket_id: string;
  status: 'processing' | 'completed' | 'failed' | 'partial';
  total_models: number;
  processed_models: number;
  total_configurations: number;
  processed_configurations: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  started_at: Date;
  completed_at?: Date;
}

export interface ImportError {
  row_number: number;
  sheet_name: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ImportWarning {
  row_number: number;
  sheet_name: string;
  field: string;
  message: string;
  suggestion?: string;
}

// SurrealDB table definitions for schema creation
export const SURREALDB_SCHEMA = {
  hardware_vendors: `
    DEFINE TABLE hardware_vendors SCHEMAFULL;
    DEFINE FIELD name ON hardware_vendors TYPE string ASSERT $value != NONE;
    DEFINE FIELD contact_info ON hardware_vendors TYPE option<string>;
    DEFINE FIELD support_info ON hardware_vendors TYPE option<string>;
    DEFINE FIELD created_at ON hardware_vendors TYPE datetime DEFAULT time::now();
    DEFINE FIELD updated_at ON hardware_vendors TYPE datetime DEFAULT time::now();
    DEFINE INDEX vendor_name ON hardware_vendors COLUMNS name UNIQUE;
  `,
  
  hardware_baskets: `
    DEFINE TABLE hardware_baskets SCHEMAFULL;
    DEFINE FIELD name ON hardware_baskets TYPE string ASSERT $value != NONE;
    DEFINE FIELD vendor ON hardware_baskets TYPE record(hardware_vendors);
    DEFINE FIELD quarter ON hardware_baskets TYPE string;
    DEFINE FIELD year ON hardware_baskets TYPE int;
    DEFINE FIELD import_date ON hardware_baskets TYPE datetime DEFAULT time::now();
    DEFINE FIELD file_path ON hardware_baskets TYPE string;
    DEFINE FIELD exchange_rate ON hardware_baskets TYPE option<float>;
    DEFINE FIELD currency_from ON hardware_baskets TYPE string;
    DEFINE FIELD currency_to ON hardware_baskets TYPE string;
    DEFINE FIELD validity_date ON hardware_baskets TYPE option<datetime>;
    DEFINE FIELD created_at ON hardware_baskets TYPE datetime DEFAULT time::now();
  `,
  
  hardware_models: `
    DEFINE TABLE hardware_models SCHEMAFULL;
    DEFINE FIELD basket_id ON hardware_models TYPE record(hardware_baskets);
    DEFINE FIELD vendor_id ON hardware_models TYPE record(hardware_vendors);
    DEFINE FIELD lot_description ON hardware_models TYPE string;
    DEFINE FIELD model_name ON hardware_models TYPE string;
    DEFINE FIELD model_number ON hardware_models TYPE option<string>;
    DEFINE FIELD form_factor ON hardware_models TYPE option<string>;
    DEFINE FIELD category ON hardware_models TYPE string;
    DEFINE FIELD base_specifications ON hardware_models TYPE object;
    DEFINE FIELD created_at ON hardware_models TYPE datetime DEFAULT time::now();
    DEFINE FIELD updated_at ON hardware_models TYPE datetime DEFAULT time::now();
  `,
  
  hardware_configurations: `
    DEFINE TABLE hardware_configurations SCHEMAFULL;
    DEFINE FIELD model_id ON hardware_configurations TYPE record(hardware_models);
    DEFINE FIELD part_number ON hardware_configurations TYPE option<string>;
    DEFINE FIELD sku ON hardware_configurations TYPE option<string>;
    DEFINE FIELD description ON hardware_configurations TYPE string;
    DEFINE FIELD item_type ON hardware_configurations TYPE string;
    DEFINE FIELD quantity ON hardware_configurations TYPE int DEFAULT 1;
    DEFINE FIELD specifications ON hardware_configurations TYPE option<object>;
    DEFINE FIELD compatibility_notes ON hardware_configurations TYPE option<string>;
    DEFINE FIELD created_at ON hardware_configurations TYPE datetime DEFAULT time::now();
  `,
  
  hardware_pricing: `
    DEFINE TABLE hardware_pricing SCHEMAFULL;
    DEFINE FIELD configuration_id ON hardware_pricing TYPE option<record(hardware_configurations)>;
    DEFINE FIELD model_id ON hardware_pricing TYPE option<record(hardware_models)>;
    DEFINE FIELD list_price ON hardware_pricing TYPE float;
    DEFINE FIELD net_price_usd ON hardware_pricing TYPE float;
    DEFINE FIELD net_price_eur ON hardware_pricing TYPE option<float>;
    DEFINE FIELD currency ON hardware_pricing TYPE string;
    DEFINE FIELD valid_from ON hardware_pricing TYPE datetime;
    DEFINE FIELD valid_to ON hardware_pricing TYPE option<datetime>;
    DEFINE FIELD support_options ON hardware_pricing TYPE array<object>;
    DEFINE FIELD created_at ON hardware_pricing TYPE datetime DEFAULT time::now();
  `,
  
  country_support: `
    DEFINE TABLE country_support SCHEMAFULL;
    DEFINE FIELD vendor_id ON country_support TYPE record(hardware_vendors);
    DEFINE FIELD country ON country_support TYPE string;
    DEFINE FIELD region ON country_support TYPE option<string>;
    DEFINE FIELD fulfillment_capability ON country_support TYPE string;
    DEFINE FIELD web_ordering ON country_support TYPE bool;
    DEFINE FIELD delivery_terms ON country_support TYPE string;
    DEFINE FIELD delivery_time_days ON country_support TYPE option<int>;
    DEFINE FIELD import_duties ON country_support TYPE option<string>;
    DEFINE FIELD vat_rates ON country_support TYPE option<string>;
    DEFINE FIELD freight_costs ON country_support TYPE option<string>;
    DEFINE FIELD affiliate_info ON country_support TYPE option<string>;
    DEFINE FIELD created_at ON country_support TYPE datetime DEFAULT time::now();
  `,
  
  exchange_rates: `
    DEFINE TABLE exchange_rates SCHEMAFULL;
    DEFINE FIELD from_currency ON exchange_rates TYPE string;
    DEFINE FIELD to_currency ON exchange_rates TYPE string;
    DEFINE FIELD rate ON exchange_rates TYPE float;
    DEFINE FIELD effective_date ON exchange_rates TYPE datetime;
    DEFINE FIELD expiry_date ON exchange_rates TYPE option<datetime>;
    DEFINE FIELD source ON exchange_rates TYPE string;
    DEFINE FIELD created_at ON exchange_rates TYPE datetime DEFAULT time::now();
  `
};

// Data transformation helpers
export interface DellLotData {
  lot_description: string;
  item: string;
  specification: string;
  list_price: number;
  net_price_usd: number;
  net_price_eur?: number;
  pricing_3yr_ps: number;
  pricing_5yr_ps: number;
  pricing_3yr_psp: number;
  pricing_5yr_psp: number;
  support_3yr_ps_usd?: number;
  support_3yr_ps_eur?: number;
  support_5yr_ps_usd?: number;
  support_5yr_ps_eur?: number;
  support_3yr_psp_usd?: number;
  support_3yr_psp_eur?: number;
  support_5yr_psp_usd?: number;
  support_5yr_psp_eur?: number;
}

export interface LenovoServerData {
  part_number: string;
  description: string;
  quantity: number;
  total_price_usd: number;
  total_price_eur?: number;
}

// Parser configurations
export interface ParseConfig {
  vendor: 'dell' | 'lenovo';
  sheets: {
    [sheetName: string]: {
      header_row: number;
      data_start_row: number;
      columns: {
        [fieldName: string]: string | number; // Column name or index
      };
    };
  };
}

export const DELL_PARSE_CONFIG: ParseConfig = {
  vendor: 'dell',
  sheets: {
    'Dell Lot Pricing': {
      header_row: 4,
      data_start_row: 5,
      columns: {
        lot_description: 'Lot Description',
        item: 'Item',
        specification: 'Specification',
        list_price: 'Listprice',
        net_price_usd: 'Net Price US$',
        net_price_eur: 'Net Price Euro €',
        pricing_3yr_ps: 'Price with 3 yr PS',
        pricing_5yr_ps: 'Price with 5yr PS',
        pricing_3yr_psp: 'Price with 3 yr PSP',
        pricing_5yr_psp: 'Price with 5yr PSP'
      }
    },
    'Dell Options and Upgrades': {
      header_row: 1,
      data_start_row: 2,
      columns: {
        // To be determined based on actual structure
      }
    },
    'Dell - Country List': {
      header_row: 3,
      data_start_row: 4,
      columns: {
        region: 1,
        country: 3,
        fulfillment_capability: 4,
        web_ordering: 5,
        delivery_terms: 6
      }
    }
  }
};

export const LENOVO_PARSE_CONFIG: ParseConfig = {
  vendor: 'lenovo',
  sheets: {
    'Lenovo X86 Server Lots': {
      header_row: 4,
      data_start_row: 5,
      columns: {
        part_number: 'Part Number',
        description: 'Description',
        quantity: 'Quantity',
        total_price_usd: 'Total price in USD',
        total_price_eur: 'Total price in EUR'
      }
    },
    'Lenovo X86 Parts': {
      header_row: 4,
      data_start_row: 5,
      columns: {
        // To be determined
      }
    },
    'Lenovo X86 Services': {
      header_row: 4,
      data_start_row: 5,
      columns: {
        // To be determined
      }
    },
    'Lenovo Country Data': {
      header_row: 2,
      data_start_row: 3,
      columns: {
        country: 'Country',
        fulfillment_capability: 'Fufillment Capabilities',
        web_ordering: 'Web  ordering capabilities',
        delivery_terms: 'Delivery terms (DDP)',
        delivery_time: 'Delivery Time in total'
      }
    }
  }
};

// Permission checking utilities
export class UserPermissions {
  static isAdmin(user: User): boolean {
    return user.role === 'admin';
  }
  
  static canManageHardwareBaskets(user: User): boolean {
    return user.role === 'admin';
  }
  
  static canCreateHardwareBaskets(user: User): boolean {
    return user.role === 'admin' || user.role === 'editor';
  }
  
  static canViewHardwareBaskets(user: User): boolean {
    return true; // All users can view global hardware baskets
  }
  
  static canDeleteHardwareBasket(user: User, basket: HardwareBasket): boolean {
    return user.role === 'admin' || basket.created_by === user.id;
  }
  
  static canUploadToHardwareBasket(user: User): boolean {
    return user.role === 'admin' || user.role === 'editor';
  }
}

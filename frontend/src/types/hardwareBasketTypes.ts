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

export interface HardwareBasket {
  id: string;
  name: string;
  vendor: string;
  quarter: string;
  year: number;
  import_date: string;
  file_path: string;
  exchange_rate?: number;
  currency_from: string;
  currency_to: string;
  validity_date?: string;
  created_by: string;
  is_global: boolean;
  created_at: string;
  description?: string;
  total_models?: number;
  total_configurations?: number;
}

export interface HardwareModel {
  id: string;
  basket_id: string;
  lot_description: string;
  category: string;
  part_number?: string;
  price?: {
    amount: number;
    currency: string;
  };
  [key: string]: any; // Allow other properties
}

export interface HardwareConfiguration {
  id: string;
  model_id: string;
  description: string;
  part_number?: string;
  sku?: string;
  item_type?: string;
  quantity?: number;
  specifications?: any;
  created_at?: Date | string;
}

export interface HardwarePricing {
  id: string;
  configuration_id?: string;
  model_id?: string;
  list_price?: number;
  net_price_usd?: number;
  net_price_eur?: number | null;
  currency?: string;
  valid_from?: string | Date;
  support_options?: SupportOption[];
  created_at?: string | Date;
}

// Enriched extension/component row returned by backend GET /hardware-baskets/:id/extensions
export interface HardwareExtension {
  id: any; // SurrealDB Thing or string
  model_id?: any; // SurrealDB Thing or string
  part_number?: string;
  name: string;
  category: string;
  type: string;
  size?: string;
  speed?: string;
  price?: { amount: number; currency: string } | null;
}

// Consolidated specifications assembled from configurations
export interface HardwareSpecifications {
  processor?: any;
  memory?: any;
  storage?: any;
  network?: any;
  [key: string]: any;
}

// Vendor-specific helper types (minimal)
export interface DellLotData {
  lot_description: string;
  rows: any[];
}

export interface LenovoServerData {
  server_rows: any[];
}

export interface ParseConfig {
  header_row?: number;
  mappings?: Record<string, string>;
}

export interface ImportError {
  message: string;
  row?: number;
  severity?: 'error' | 'warning';
}

export interface SupportOption {
  duration_years: number;
  type: string;
  price_usd: number;
  price_eur?: number;
}

// Minimal parse config constants (frontend parser expects these to exist)
export const DELL_PARSE_CONFIG: ParseConfig = { header_row: 3 };
export const LENOVO_PARSE_CONFIG: ParseConfig = { header_row: 3 };

export interface ImportResult {
  success: boolean;
  message: string;
  models: HardwareModel[];
  vendor: string;
  quarter: string;
  year: number;
  total_models: number;
  total_configurations: number;
}

export interface CreateHardwareBasketRequest {
  name: string;
  vendor: string;
  quarter: string;
  year: number;
}

// User permissions utility
export class UserPermissions {
  static canCreateHardwareBaskets(user: User | null): boolean {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'editor';
  }

  static canDeleteHardwareBaskets(user: User | null): boolean {
    if (!user) return false;
    return user.role === 'admin';
  }

  static canViewHardwareBaskets(user: User | null): boolean {
    if (!user) return false;
    return true; // All authenticated users can view
  }
}

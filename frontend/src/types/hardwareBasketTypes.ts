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
  part_number: string;
  price: {
    amount: number;
    currency: string;
  };
  [key: string]: any; // Allow other properties
}

export interface HardwareConfiguration {
  id: string;
  model_id: string;
  description: string;
  part_number: string;
}

export interface HardwarePricing {
  id: string;
  configuration_id: string;
  price: {
    amount: number;
    currency: string;
  };
  date_valid: string;
}

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

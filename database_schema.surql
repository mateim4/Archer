// Hardware Basket Database Schema Design
// Based on comprehensive analysis of Dell and Lenovo Excel files

// =============================================================================
// 1. VENDOR CONFIGURATION TABLE
// =============================================================================
// Stores vendor-specific settings and metadata
DEFINE TABLE vendor_config SCHEMAFULL;
DEFINE FIELD vendor_name ON vendor_config TYPE string;
DEFINE FIELD file_version ON vendor_config TYPE string;
DEFINE FIELD last_updated ON vendor_config TYPE datetime;
DEFINE FIELD exchange_rates ON vendor_config TYPE object;
DEFINE FIELD currency_valid_until ON vendor_config TYPE datetime;
DEFINE FIELD contact_info ON vendor_config TYPE object;
DEFINE FIELD created_at ON vendor_config TYPE datetime DEFAULT time::now();

// =============================================================================
// 2. HARDWARE LOT/BUNDLE TABLE
// =============================================================================
// Main server configurations (Dell "Lots", Lenovo "Server Lots")
DEFINE TABLE hardware_lot SCHEMAFULL;
DEFINE FIELD vendor ON hardware_lot TYPE string;
DEFINE FIELD lot_id ON hardware_lot TYPE string;
DEFINE FIELD lot_code ON hardware_lot TYPE string; // SMI1, SMI2, SMA1, SMA2
DEFINE FIELD lot_description ON hardware_lot TYPE string;
DEFINE FIELD base_part_number ON hardware_lot TYPE string;
DEFINE FIELD server_type ON hardware_lot TYPE string; // Intel/AMD, 1/2 Proc, etc.
DEFINE FIELD form_factor ON hardware_lot TYPE string; // Small Rack, etc.

// Pricing information
DEFINE FIELD list_price_usd ON hardware_lot TYPE decimal;
DEFINE FIELD net_price_usd ON hardware_lot TYPE decimal;
DEFINE FIELD net_price_eur ON hardware_lot TYPE decimal;

// Warranty and support pricing
DEFINE FIELD price_1yr_warranty_usd ON hardware_lot TYPE decimal;
DEFINE FIELD price_1yr_warranty_eur ON hardware_lot TYPE decimal;
DEFINE FIELD price_3yr_warranty_usd ON hardware_lot TYPE decimal;
DEFINE FIELD price_3yr_warranty_eur ON hardware_lot TYPE decimal;
DEFINE FIELD price_5yr_warranty_usd ON hardware_lot TYPE decimal;
DEFINE FIELD price_5yr_warranty_eur ON hardware_lot TYPE decimal;

// Support service pricing (Dell specific)
DEFINE FIELD price_3yr_ps_usd ON hardware_lot TYPE decimal;
DEFINE FIELD price_5yr_ps_usd ON hardware_lot TYPE decimal;
DEFINE FIELD price_3yr_psp_usd ON hardware_lot TYPE decimal;
DEFINE FIELD price_5yr_psp_usd ON hardware_lot TYPE decimal;

// Metadata
DEFINE FIELD excel_source_file ON hardware_lot TYPE string;
DEFINE FIELD excel_sheet_name ON hardware_lot TYPE string;
DEFINE FIELD excel_row_number ON hardware_lot TYPE int;
DEFINE FIELD created_at ON hardware_lot TYPE datetime DEFAULT time::now();

// Unique constraint on vendor + lot_code
DEFINE INDEX idx_hardware_lot_unique ON hardware_lot COLUMNS vendor, lot_code UNIQUE;

// =============================================================================
// 3. HARDWARE COMPONENTS TABLE
// =============================================================================
// Individual components and specifications within each lot
DEFINE TABLE hardware_component SCHEMAFULL;
DEFINE FIELD lot_id ON hardware_component TYPE record<hardware_lot>;
DEFINE FIELD vendor ON hardware_component TYPE string;

// Component identification
DEFINE FIELD part_number ON hardware_component TYPE string;
DEFINE FIELD component_type ON hardware_component TYPE string; // Server, RAM, Boot Disk, etc.
DEFINE FIELD component_category ON hardware_component TYPE string; // Hardware, Service, Option
DEFINE FIELD description ON hardware_component TYPE string;
DEFINE FIELD specification ON hardware_component TYPE string;

// Quantity and pricing
DEFINE FIELD quantity ON hardware_component TYPE int DEFAULT 1;
DEFINE FIELD unit_price_usd ON hardware_component TYPE decimal;
DEFINE FIELD unit_price_eur ON hardware_component TYPE decimal;
DEFINE FIELD total_price_usd ON hardware_component TYPE decimal;
DEFINE FIELD total_price_eur ON hardware_component TYPE decimal;

// Technical specifications
DEFINE FIELD technical_specs ON hardware_component TYPE object; // JSON for detailed specs

// Source tracking
DEFINE FIELD excel_source_file ON hardware_component TYPE string;
DEFINE FIELD excel_sheet_name ON hardware_component TYPE string;
DEFINE FIELD excel_row_number ON hardware_component TYPE int;
DEFINE FIELD created_at ON hardware_component TYPE datetime DEFAULT time::now();

// Index for fast lookups
DEFINE INDEX idx_component_lot ON hardware_component COLUMNS lot_id;
DEFINE INDEX idx_component_part ON hardware_component COLUMNS vendor, part_number;

// =============================================================================
// 4. HARDWARE OPTIONS/UPGRADES TABLE
// =============================================================================
// Available options and upgrades (Dell "Options and Upgrades", Lenovo "Parts")
DEFINE TABLE hardware_option SCHEMAFULL;
DEFINE FIELD vendor ON hardware_option TYPE string;
DEFINE FIELD part_number ON hardware_option TYPE string;
DEFINE FIELD option_type ON hardware_option TYPE string; // Upgrade, Service, Part
DEFINE FIELD category ON hardware_option TYPE string; // Storage, Memory, Network, etc.
DEFINE FIELD description ON hardware_option TYPE string;
DEFINE FIELD compatibility ON hardware_option TYPE array<string>; // Which lots this works with

// Pricing
DEFINE FIELD unit_price_usd ON hardware_option TYPE decimal;
DEFINE FIELD unit_price_eur ON hardware_option TYPE decimal;
DEFINE FIELD currency ON hardware_option TYPE string;

// Technical details
DEFINE FIELD specifications ON hardware_option TYPE object;
DEFINE FIELD installation_notes ON hardware_option TYPE string;

// Source tracking
DEFINE FIELD excel_source_file ON hardware_option TYPE string;
DEFINE FIELD excel_sheet_name ON hardware_option TYPE string;
DEFINE FIELD excel_row_number ON hardware_option TYPE int;
DEFINE FIELD created_at ON hardware_option TYPE datetime DEFAULT time::now();

// Unique constraint
DEFINE INDEX idx_option_unique ON hardware_option COLUMNS vendor, part_number UNIQUE;

// =============================================================================
// 5. HARDWARE SERVICES TABLE
// =============================================================================
// Service offerings (Lenovo "Services", Dell support tiers)
DEFINE TABLE hardware_service SCHEMAFULL;
DEFINE FIELD vendor ON hardware_service TYPE string;
DEFINE FIELD service_code ON hardware_service TYPE string;
DEFINE FIELD service_type ON hardware_service TYPE string; // Warranty, Support, Installation
DEFINE FIELD service_tier ON hardware_service TYPE string; // Basic, Pro, Plus
DEFINE FIELD duration_years ON hardware_service TYPE int;
DEFINE FIELD description ON hardware_service TYPE string;

// Pricing
DEFINE FIELD price_usd ON hardware_service TYPE decimal;
DEFINE FIELD price_eur ON hardware_service TYPE decimal;

// Coverage details
DEFINE FIELD coverage_details ON hardware_service TYPE object;
DEFINE FIELD sla_details ON hardware_service TYPE object;

// Source tracking
DEFINE FIELD excel_source_file ON hardware_service TYPE string;
DEFINE FIELD excel_sheet_name ON hardware_service TYPE string;
DEFINE FIELD excel_row_number ON hardware_service TYPE int;
DEFINE FIELD created_at ON hardware_service TYPE datetime DEFAULT time::now();

// =============================================================================
// 6. COUNTRY/REGION DATA TABLE
// =============================================================================
// Country-specific pricing and availability
DEFINE TABLE country_data SCHEMAFULL;
DEFINE FIELD vendor ON country_data TYPE string;
DEFINE FIELD country_code ON country_data TYPE string;
DEFINE FIELD country_name ON country_data TYPE string;
DEFINE FIELD region ON country_data TYPE string;
DEFINE FIELD currency ON country_data TYPE string;
DEFINE FIELD price_adjustments ON country_data TYPE object; // Regional pricing modifiers
DEFINE FIELD availability_restrictions ON country_data TYPE array<string>;

// Source tracking
DEFINE FIELD excel_source_file ON country_data TYPE string;
DEFINE FIELD excel_sheet_name ON country_data TYPE string;
DEFINE FIELD created_at ON country_data TYPE datetime DEFAULT time::now();

// =============================================================================
// 7. IMPORT HISTORY TABLE
// =============================================================================
// Track all import operations
DEFINE TABLE import_history SCHEMAFULL;
DEFINE FIELD import_id ON import_history TYPE uuid DEFAULT rand::uuid::v4();
DEFINE FIELD file_name ON import_history TYPE string;
DEFINE FIELD file_path ON import_history TYPE string;
DEFINE FIELD file_size ON import_history TYPE int;
DEFINE FIELD file_hash ON import_history TYPE string; // SHA256 to detect duplicates
DEFINE FIELD vendor ON import_history TYPE string;
DEFINE FIELD import_status ON import_history TYPE string; // SUCCESS, FAILED, PARTIAL
DEFINE FIELD items_processed ON import_history TYPE int;
DEFINE FIELD items_failed ON import_history TYPE int;
DEFINE FIELD error_log ON import_history TYPE array<string>;
DEFINE FIELD processing_time_ms ON import_history TYPE int;
DEFINE FIELD imported_at ON import_history TYPE datetime DEFAULT time::now();

// Make import_id the primary key
DEFINE INDEX idx_import_id ON import_history COLUMNS import_id UNIQUE;

// =============================================================================
// 8. CLUSTER MIGRATION PLANS TABLE
// =============================================================================
// Cluster migration strategies for VMware to Hyper-V migrations
DEFINE TABLE cluster_migration_plans SCHEMAFULL;

// Identifiers
DEFINE FIELD project_id ON cluster_migration_plans TYPE record<projects>;
DEFINE FIELD source_cluster_name ON cluster_migration_plans TYPE string;
DEFINE FIELD target_cluster_name ON cluster_migration_plans TYPE string;

// Migration strategy
DEFINE FIELD strategy_type ON cluster_migration_plans TYPE string; // domino_hardware_swap, new_hardware_purchase, existing_free_hardware

// Domino hardware swap fields
DEFINE FIELD domino_source_cluster ON cluster_migration_plans TYPE option<string>;
DEFINE FIELD hardware_available_date ON cluster_migration_plans TYPE option<datetime>;
DEFINE FIELD domino_hardware_items ON cluster_migration_plans TYPE option<array<string>>;

// Procurement fields
DEFINE FIELD procurement_order_id ON cluster_migration_plans TYPE option<record<procurement_orders>>;
DEFINE FIELD hardware_basket_items ON cluster_migration_plans TYPE array<string>;

// Existing hardware fields
DEFINE FIELD hardware_pool_allocations ON cluster_migration_plans TYPE array<string>;

// Capacity requirements
DEFINE FIELD required_cpu_cores ON cluster_migration_plans TYPE int;
DEFINE FIELD required_memory_gb ON cluster_migration_plans TYPE int;
DEFINE FIELD required_storage_tb ON cluster_migration_plans TYPE decimal;
DEFINE FIELD overcommit_ratios ON cluster_migration_plans TYPE option<object>;

// VM migration mappings
DEFINE FIELD vm_mappings ON cluster_migration_plans TYPE array<object>;
DEFINE FIELD total_vms ON cluster_migration_plans TYPE int;
DEFINE FIELD mapped_vms ON cluster_migration_plans TYPE int;

// Status and dependencies
DEFINE FIELD status ON cluster_migration_plans TYPE string; // not_configured, configured, awaiting_hardware, ready_to_migrate, in_progress, completed, blocked, cancelled
DEFINE FIELD dependencies ON cluster_migration_plans TYPE array<string>;
DEFINE FIELD dependency_validation ON cluster_migration_plans TYPE option<object>;

// Timeline
DEFINE FIELD planned_start_date ON cluster_migration_plans TYPE option<datetime>;
DEFINE FIELD planned_completion_date ON cluster_migration_plans TYPE option<datetime>;
DEFINE FIELD actual_start_date ON cluster_migration_plans TYPE option<datetime>;
DEFINE FIELD actual_completion_date ON cluster_migration_plans TYPE option<datetime>;

// Metadata
DEFINE FIELD notes ON cluster_migration_plans TYPE option<string>;
DEFINE FIELD created_at ON cluster_migration_plans TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON cluster_migration_plans TYPE datetime DEFAULT time::now();
DEFINE FIELD created_by ON cluster_migration_plans TYPE string;

// Indexes
DEFINE INDEX idx_cluster_project ON cluster_migration_plans COLUMNS project_id;
DEFINE INDEX idx_cluster_source ON cluster_migration_plans COLUMNS source_cluster_name;
DEFINE INDEX idx_cluster_target ON cluster_migration_plans COLUMNS target_cluster_name;
DEFINE INDEX idx_cluster_status ON cluster_migration_plans COLUMNS status;

// =============================================================================
// 9. PROCUREMENT ORDERS TABLE
// =============================================================================
// Hardware procurement orders for migration projects
DEFINE TABLE procurement_orders SCHEMAFULL;

// Identifiers
DEFINE FIELD order_number ON procurement_orders TYPE string;
DEFINE FIELD project_id ON procurement_orders TYPE record<projects>;

// Hardware items
DEFINE FIELD hardware_items ON procurement_orders TYPE array<object>;
DEFINE FIELD total_cost ON procurement_orders TYPE decimal;
DEFINE FIELD currency ON procurement_orders TYPE string;

// Vendor information
DEFINE FIELD vendor_name ON procurement_orders TYPE string;
DEFINE FIELD vendor_contact ON procurement_orders TYPE option<string>;

// Timeline
DEFINE FIELD order_date ON procurement_orders TYPE datetime;
DEFINE FIELD expected_delivery_date ON procurement_orders TYPE option<datetime>;
DEFINE FIELD actual_delivery_date ON procurement_orders TYPE option<datetime>;

// Status
DEFINE FIELD status ON procurement_orders TYPE string; // draft, submitted, confirmed, processing, in_transit, delivered, received, cancelled, delayed
DEFINE FIELD allocated_to_clusters ON procurement_orders TYPE array<string>;

// Tracking
DEFINE FIELD tracking_number ON procurement_orders TYPE option<string>;
DEFINE FIELD notes ON procurement_orders TYPE option<string>;

// Metadata
DEFINE FIELD created_at ON procurement_orders TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON procurement_orders TYPE datetime DEFAULT time::now();
DEFINE FIELD created_by ON procurement_orders TYPE string;

// Indexes
DEFINE INDEX idx_procurement_project ON procurement_orders COLUMNS project_id;
DEFINE INDEX idx_procurement_order_number ON procurement_orders COLUMNS order_number UNIQUE;
DEFINE INDEX idx_procurement_status ON procurement_orders COLUMNS status;
DEFINE INDEX idx_procurement_delivery ON procurement_orders COLUMNS expected_delivery_date;

// =============================================================================
// 10. GLOBAL SETTINGS TABLE
// =============================================================================
// Application-wide settings and defaults
DEFINE TABLE settings SCHEMAFULL;

// Setting identification
DEFINE FIELD setting_key ON settings TYPE string;
DEFINE FIELD setting_category ON settings TYPE string; // capacity, timeline, notifications, etc.

// Capacity defaults
DEFINE FIELD overcommit_cpu_default ON settings TYPE option<decimal>;
DEFINE FIELD overcommit_memory_default ON settings TYPE option<decimal>;
DEFINE FIELD overcommit_storage_default ON settings TYPE option<decimal>;

// Timeline estimation defaults (hours per host)
DEFINE FIELD migration_hours_per_host ON settings TYPE option<decimal>;
DEFINE FIELD decommission_hours_per_host ON settings TYPE option<decimal>;
DEFINE FIELD expansion_hours_per_host ON settings TYPE option<decimal>;
DEFINE FIELD maintenance_hours_per_host ON settings TYPE option<decimal>;

// Value storage (flexible JSON for any setting)
DEFINE FIELD value ON settings TYPE option<object>;

// Metadata
DEFINE FIELD description ON settings TYPE option<string>;
DEFINE FIELD created_at ON settings TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON settings TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_by ON settings TYPE option<string>;

// Indexes
DEFINE INDEX idx_setting_key ON settings COLUMNS setting_key UNIQUE;
DEFINE INDEX idx_setting_category ON settings COLUMNS setting_category;


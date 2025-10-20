# RVTools Hardware Pool Integration - Implementation Plan

## Executive Summary

**Goal**: Integrate RVTools report processing with Hardware Pool to enable automated extraction of physical server data, providing capacity planning and migration simulation capabilities.

**Current State Analysis**:
- ✅ Backend RVTools processing engine exists (`rvtools_service.rs`)
- ✅ Database schema supports RVTools uploads and analysis
- ✅ Hardware Pool UI and basic CRUD operations functional
- ✅ Migration project workflow exists
- ❌ No UI integration for RVTools upload in Hardware Pool
- ❌ Database is in-memory (needs persistence)
- ❌ No server selection/preview UI after processing
- ❌ Limited relationship mapping between hardware, VMs, and networking

---

## Phase 1: Database Enhancement & Persistence (Priority: CRITICAL)

### 1.1 Switch to Persistent Database Mode

**Current Issue**: Database runs in-memory mode, data lost on restart

**Solution**:
```bash
# Update docker-compose.yml or startup script
surrealdb start --bind 0.0.0.0:8000 \
  --user root --pass root \
  file://./lcm_designer.db  # Persistent file storage
```

**Files to Modify**:
- `docker-compose.yml` - Update SurrealDB service configuration
- `start-lcmdesigner.sh` - Update startup script
- `backend/src/database.rs` - Verify connection parameters

**Verification**:
- Restart services, verify data persists
- Check `lcm_designer.db/` directory created
- Test CRUD operations across restarts

---

### 1.2 Enhanced Database Schema for RVTools Data

**New Tables Needed**:

```sql
-- Physical Hosts (ESXi servers)
DEFINE TABLE physical_host SCHEMAFULL;
DEFINE FIELD upload_id ON physical_host TYPE record(rvtools_upload);
DEFINE FIELD host_name ON physical_host TYPE string ASSERT $value != NONE;
DEFINE FIELD cluster_name ON physical_host TYPE string;
DEFINE FIELD datacenter ON physical_host TYPE string;
DEFINE FIELD manufacturer ON physical_host TYPE string; // Dell, HPE, Lenovo
DEFINE FIELD model ON physical_host TYPE string;
DEFINE FIELD cpu_model ON physical_host TYPE string;
DEFINE FIELD cpu_sockets ON physical_host TYPE int;
DEFINE FIELD cpu_cores_per_socket ON physical_host TYPE int;
DEFINE FIELD cpu_cores_total ON physical_host TYPE int;
DEFINE FIELD cpu_threads_total ON physical_host TYPE int;
DEFINE FIELD cpu_mhz ON physical_host TYPE int;
DEFINE FIELD memory_gb ON physical_host TYPE decimal;
DEFINE FIELD memory_slots_used ON physical_host TYPE int;
DEFINE FIELD memory_slots_total ON physical_host TYPE int;
DEFINE FIELD nic_count ON physical_host TYPE int;
DEFINE FIELD hba_count ON physical_host TYPE int;
DEFINE FIELD esxi_version ON physical_host TYPE string;
DEFINE FIELD esxi_build ON physical_host TYPE string;
DEFINE FIELD bios_version ON physical_host TYPE string;
DEFINE FIELD service_tag ON physical_host TYPE string;
DEFINE FIELD power_state ON physical_host TYPE string;
DEFINE FIELD connection_state ON physical_host TYPE string;
DEFINE FIELD in_maintenance_mode ON physical_host TYPE bool;
DEFINE FIELD metadata ON physical_host TYPE object;
DEFINE FIELD created_at ON physical_host TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_host_name ON physical_host COLUMNS upload_id, host_name UNIQUE;

-- Virtual Machines
DEFINE TABLE virtual_machine SCHEMAFULL;
DEFINE FIELD upload_id ON virtual_machine TYPE record(rvtools_upload);
DEFINE FIELD host_id ON virtual_machine TYPE record(physical_host);
DEFINE FIELD vm_name ON virtual_machine TYPE string ASSERT $value != NONE;
DEFINE FIELD power_state ON virtual_machine TYPE string;
DEFINE FIELD template ON virtual_machine TYPE bool DEFAULT false;
DEFINE FIELD config_status ON virtual_machine TYPE string;
DEFINE FIELD dns_name ON virtual_machine TYPE string;
DEFINE FIELD os ON virtual_machine TYPE string;
DEFINE FIELD os_family ON virtual_machine TYPE string; // Windows, Linux, Other
DEFINE FIELD num_cpu ON virtual_machine TYPE int;
DEFINE FIELD cpu_reservation ON virtual_machine TYPE int;
DEFINE FIELD cpu_limit ON virtual_machine TYPE int;
DEFINE FIELD memory_mb ON virtual_machine TYPE int;
DEFINE FIELD memory_reservation ON virtual_machine TYPE int;
DEFINE FIELD memory_limit ON virtual_machine TYPE int;
DEFINE FIELD nics ON virtual_machine TYPE int;
DEFINE FIELD disks ON virtual_machine TYPE int;
DEFINE FIELD provisioned_mb ON virtual_machine TYPE decimal;
DEFINE FIELD in_use_mb ON virtual_machine TYPE decimal;
DEFINE FIELD unshared_mb ON virtual_machine TYPE decimal;
DEFINE FIELD folder ON virtual_machine TYPE string;
DEFINE FIELD annotation ON virtual_machine TYPE string;
DEFINE FIELD metadata ON virtual_machine TYPE object;
DEFINE FIELD created_at ON virtual_machine TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_vm_name ON virtual_machine COLUMNS upload_id, vm_name UNIQUE;

-- vSwitches (Virtual Switches)
DEFINE TABLE vswitch SCHEMAFULL;
DEFINE FIELD upload_id ON vswitch TYPE record(rvtools_upload);
DEFINE FIELD host_id ON vswitch TYPE record(physical_host);
DEFINE FIELD vswitch_name ON vswitch TYPE string ASSERT $value != NONE;
DEFINE FIELD num_ports ON vswitch TYPE int;
DEFINE FIELD used_ports ON vswitch TYPE int;
DEFINE FIELD configured_ports ON vswitch TYPE int;
DEFINE FIELD mtu ON vswitch TYPE int;
DEFINE FIELD allow_promiscuous ON vswitch TYPE bool;
DEFINE FIELD mac_changes ON vswitch TYPE bool;
DEFINE FIELD forged_transmits ON vswitch TYPE bool;
DEFINE FIELD security_policy ON vswitch TYPE object;
DEFINE FIELD nics ON vswitch TYPE array<string>;
DEFINE FIELD metadata ON vswitch TYPE object;
DEFINE FIELD created_at ON vswitch TYPE datetime DEFAULT time::now();

-- Port Groups
DEFINE TABLE port_group SCHEMAFULL;
DEFINE FIELD upload_id ON port_group TYPE record(rvtools_upload);
DEFINE FIELD vswitch_id ON port_group TYPE record(vswitch);
DEFINE FIELD host_id ON port_group TYPE record(physical_host);
DEFINE FIELD port_group_name ON port_group TYPE string ASSERT $value != NONE;
DEFINE FIELD vlan_id ON port_group TYPE int;
DEFINE FIELD num_ports ON port_group TYPE int;
DEFINE FIELD active_nics ON port_group TYPE array<string>;
DEFINE FIELD standby_nics ON port_group TYPE array<string>;
DEFINE FIELD failover_policy ON port_group TYPE string;
DEFINE FIELD metadata ON port_group TYPE object;
DEFINE FIELD created_at ON port_group TYPE datetime DEFAULT time::now();

-- VM Network Adapters
DEFINE TABLE vm_network_adapter SCHEMAFULL;
DEFINE FIELD upload_id ON vm_network_adapter TYPE record(rvtools_upload);
DEFINE FIELD vm_id ON vm_network_adapter TYPE record(virtual_machine);
DEFINE FIELD port_group_id ON vm_network_adapter TYPE record(port_group);
DEFINE FIELD adapter_name ON vm_network_adapter TYPE string;
DEFINE FIELD adapter_type ON vm_network_adapter TYPE string; // E1000, VMXNET3, etc.
DEFINE FIELD mac_address ON vm_network_adapter TYPE string;
DEFINE FIELD connected ON vm_network_adapter TYPE bool;
DEFINE FIELD start_connected ON vm_network_adapter TYPE bool;
DEFINE FIELD ip_addresses ON vm_network_adapter TYPE array<string>;
DEFINE FIELD metadata ON vm_network_adapter TYPE object;
DEFINE FIELD created_at ON vm_network_adapter TYPE datetime DEFAULT time::now();

-- Datastores
DEFINE TABLE datastore SCHEMAFULL;
DEFINE FIELD upload_id ON datastore TYPE record(rvtools_upload);
DEFINE FIELD datastore_name ON datastore TYPE string ASSERT $value != NONE;
DEFINE FIELD type ON datastore TYPE string; // VMFS, NFS, vVols
DEFINE FIELD capacity_mb ON datastore TYPE decimal;
DEFINE FIELD free_space_mb ON datastore TYPE decimal;
DEFINE FIELD provisioned_mb ON datastore TYPE decimal;
DEFINE FIELD num_vms ON datastore TYPE int;
DEFINE FIELD hosts ON datastore TYPE array<record(physical_host)>;
DEFINE FIELD metadata ON datastore TYPE object;
DEFINE FIELD created_at ON datastore TYPE datetime DEFAULT time::now();
```

**Implementation Steps**:
1. Create `database_schema_rvtools_extended.surql`
2. Run schema migration script
3. Update backend models in `backend/src/models/`
4. Add relationship queries (e.g., get all VMs on a host)

---

## Phase 2: Backend RVTools Processing Enhancement

### 2.1 Enhanced CSV Parser

**Current State**: Basic CSV parsing exists but limited

**Enhancements Needed**:
```rust
// backend/src/services/rvtools_parser.rs

pub struct RvToolsParser {
    // Support multiple sheets from RVTools export
    tabvinfo: Vec<TabVInfo>,      // VM information
    tabvhost: Vec<TabVHost>,      // Host information  
    tabvcluster: Vec<TabVCluster>, // Cluster information
    tabvnetwork: Vec<TabVNetwork>, // VM network adapters
    tabvswitch: Vec<TabVSwitch>,   // vSwitches
    tabvport: Vec<TabVPort>,       // Port groups
    tabvdisk: Vec<TabVDisk>,       // VM disks
    tabvdatastore: Vec<TabVDatastore>, // Datastores
}

impl RvToolsParser {
    pub async fn parse_rvtools_xlsx(&self, file_path: &str) -> Result<RvToolsData> {
        // Use calamine crate to parse Excel
        // Extract all relevant sheets
        // Validate data integrity
        // Create relationships
    }
    
    pub async fn extract_physical_servers(&self) -> Vec<PhysicalServerSummary> {
        // Aggregate host data
        // Calculate total capacity
        // Identify clusters
    }
}
```

**Dependencies to Add**:
```toml
# Cargo.toml
calamine = "0.24"  # Excel parsing
csv = "1.3"         # CSV parsing
```

---

### 2.2 Server Detection & Pre-processing API

**New Endpoint**: `POST /api/rvtools/upload-and-detect`

**Request**:
```json
{
  "file": "<base64_encoded_excel_or_csv>",
  "filename": "vcenter_report.xlsx",
  "project_id": "project:uuid"
}
```

**Response**:
```json
{
  "upload_id": "rvtools_upload:uuid",
  "status": "processed",
  "detected_servers": [
    {
      "host_name": "esxi01.domain.com",
      "cluster_name": "Production-Cluster-01",
      "manufacturer": "Dell Inc.",
      "model": "PowerEdge R650",
      "cpu_sockets": 2,
      "cpu_cores_total": 48,
      "cpu_model": "Intel Xeon Gold 6348",
      "memory_gb": 512,
      "num_vms": 23,
      "total_vm_vcpu": 184,
      "total_vm_memory_gb": 896,
      "datastores": ["SAN-Prod-01", "SAN-Prod-02"],
      "network_adapters": 4,
      "esxi_version": "7.0 U3",
      "service_tag": "ABC1234"
    }
  ],
  "summary": {
    "total_hosts": 12,
    "total_clusters": 3,
    "total_vms": 287,
    "total_cpu_cores": 576,
    "total_memory_gb": 6144
  }
}
```

**Backend Implementation**:
```rust
// backend/src/api/rvtools.rs

#[post("/upload-and-detect")]
async fn upload_and_detect_servers(
    db: web::Data<Database>,
    payload: web::Json<RvToolsUploadRequest>
) -> Result<HttpResponse> {
    // 1. Decode and save file
    // 2. Parse Excel/CSV
    // 3. Extract physical hosts
    // 4. Extract VMs and relationships
    // 5. Store in database
    // 6. Return server summary for UI selection
    
    let service = RvToolsService::new(db.get_ref().clone());
    let result = service.process_and_detect(payload.into_inner()).await?;
    
    Ok(HttpResponse::Ok().json(result))
}
```

---

## Phase 3: Frontend UI Components

### 3.1 Hardware Pool - RVTools Upload Button

**Component**: `RvToolsUploadButton.tsx`

```tsx
import React, { useState } from 'react';
import { PurpleGlassButton } from '@/components/ui';
import { DocumentArrowUpRegular } from '@fluentui/react-icons';

export const RvToolsUploadButton: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    
    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      
      // Upload and detect
      const response = await fetch('/api/rvtools/upload-and-detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: base64.split(',')[1], // Remove data:... prefix
          filename: file.name,
          project_id: currentProjectId
        })
      });
      
      const result = await response.json();
      
      // Open selection modal
      openServerSelectionModal(result);
      setUploading(false);
    };
    
    reader.readAsDataURL(file);
  };
  
  return (
    <>
      <input
        type="file"
        id="rvtools-upload"
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <PurpleGlassButton
        variant="secondary"
        onClick={() => document.getElementById('rvtools-upload')?.click()}
        loading={uploading}
        icon={<DocumentArrowUpRegular />}
      >
        Import from RVTools
      </PurpleGlassButton>
    </>
  );
};
```

**Integration Point**:
```tsx
// HardwarePoolView.tsx - Update button section

<div style={{ display: 'flex', gap: '12px' }}>
  <RvToolsUploadButton />
  <PurpleGlassButton
    variant="primary"
    onClick={handleCreate}
    icon={<AddRegular />}
  >
    Add Hardware Asset
  </PurpleGlassButton>
</div>
```

---

### 3.2 Server Selection Modal

**Component**: `ServerSelectionModal.tsx`

```tsx
import React, { useState } from 'react';
import { 
  PurpleGlassCard,
  PurpleGlassButton,
  PurpleGlassCheckbox 
} from '@/components/ui';
import { Dialog, DialogSurface, DialogBody } from '@fluentui/react-components';

interface DetectedServer {
  host_name: string;
  cluster_name: string;
  model: string;
  cpu_cores_total: number;
  memory_gb: number;
  num_vms: number;
  service_tag?: string;
}

interface ServerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  servers: DetectedServer[];
  onImport: (selectedServers: DetectedServer[]) => Promise<void>;
}

export const ServerSelectionModal: React.FC<ServerSelectionModalProps> = ({
  isOpen,
  onClose,
  servers,
  onImport
}) => {
  const [selectedServers, setSelectedServers] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  
  const toggleServer = (hostName: string) => {
    const newSelection = new Set(selectedServers);
    if (newSelection.has(hostName)) {
      newSelection.delete(hostName);
    } else {
      newSelection.add(hostName);
    }
    setSelectedServers(newSelection);
  };
  
  const handleImport = async () => {
    setImporting(true);
    const serversToImport = servers.filter(s => selectedServers.has(s.host_name));
    await onImport(serversToImport);
    setImporting(false);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface style={{ maxWidth: '1200px', width: '90vw' }}>
        <DialogBody>
          <h2>Select Servers to Import</h2>
          <p>Choose which physical servers to add to the Hardware Pool</p>
          
          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <PurpleGlassCard glass="light">
              <strong>{servers.length}</strong> Servers Detected
            </PurpleGlassCard>
            <PurpleGlassCard glass="light">
              <strong>{selectedServers.size}</strong> Selected
            </PurpleGlassCard>
            <PurpleGlassCard glass="light">
              <strong>{servers.reduce((sum, s) => sum + s.cpu_cores_total, 0)}</strong> Total CPU Cores
            </PurpleGlassCard>
            <PurpleGlassCard glass="light">
              <strong>{servers.reduce((sum, s) => sum + s.memory_gb, 0)}</strong> GB Total Memory
            </PurpleGlassCard>
          </div>
          
          {/* Server Table */}
          <div style={{ maxHeight: '500px', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                <tr>
                  <th>
                    <PurpleGlassCheckbox
                      checked={selectedServers.size === servers.length}
                      onChange={() => {
                        if (selectedServers.size === servers.length) {
                          setSelectedServers(new Set());
                        } else {
                          setSelectedServers(new Set(servers.map(s => s.host_name)));
                        }
                      }}
                    />
                  </th>
                  <th>Server Name</th>
                  <th>Cluster</th>
                  <th>Model</th>
                  <th>CPU Cores</th>
                  <th>Memory (GB)</th>
                  <th>VMs</th>
                </tr>
              </thead>
              <tbody>
                {servers.map(server => (
                  <tr key={server.host_name}>
                    <td>
                      <PurpleGlassCheckbox
                        checked={selectedServers.has(server.host_name)}
                        onChange={() => toggleServer(server.host_name)}
                      />
                    </td>
                    <td>{server.host_name}</td>
                    <td>{server.cluster_name}</td>
                    <td>{server.model}</td>
                    <td>{server.cpu_cores_total}</td>
                    <td>{server.memory_gb}</td>
                    <td>{server.num_vms}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <PurpleGlassButton variant="ghost" onClick={onClose}>
              Cancel
            </PurpleGlassButton>
            <PurpleGlassButton
              variant="primary"
              onClick={handleImport}
              disabled={selectedServers.size === 0}
              loading={importing}
            >
              Import {selectedServers.size} Server{selectedServers.size !== 1 ? 's' : ''}
            </PurpleGlassButton>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
```

---

### 3.3 Import to Hardware Pool API

**Endpoint**: `POST /api/hardware-pool/import-from-rvtools`

**Request**:
```json
{
  "upload_id": "rvtools_upload:uuid",
  "selected_host_names": [
    "esxi01.domain.com",
    "esxi02.domain.com"
  ]
}
```

**Backend Implementation**:
```rust
pub async fn import_servers_to_pool(
    &self,
    upload_id: &Thing,
    host_names: Vec<String>
) -> Result<Vec<HardwarePoolEntry>> {
    let mut imported = Vec::new();
    
    for host_name in host_names {
        // Get full host data
        let host: Vec<PhysicalHost> = self.db
            .query("SELECT * FROM physical_host WHERE upload_id = $upload_id AND host_name = $host_name")
            .bind(("upload_id", upload_id))
            .bind(("host_name", &host_name))
            .await?
            .take(0)?;
            
        if let Some(host) = host.first() {
            // Create hardware pool entry
            let pool_entry = HardwarePool {
                id: None,
                asset_tag: format!("RVTOOLS-{}", host.service_tag.as_deref().unwrap_or(&host.host_name)),
                serial_number: host.service_tag.clone(),
                hardware_lot_id: None,
                vendor: host.manufacturer.clone(),
                model: host.model.clone(),
                form_factor: Some("Rack Server".to_string()),
                cpu_sockets: Some(host.cpu_sockets),
                cpu_cores_total: Some(host.cpu_cores_total),
                memory_gb: Some(host.memory_gb as i32),
                storage_type: None, // Would need datastore parsing
                storage_capacity_gb: None,
                network_ports: Some(host.nic_count),
                power_consumption_watts: None,
                rack_units: 2, // Assume 2U
                availability_status: AvailabilityStatus::Available,
                location: host.cluster_name.clone(),
                datacenter: host.datacenter.clone(),
                rack_position: None,
                available_from_date: Utc::now(),
                available_until_date: None,
                maintenance_schedule: vec![],
                acquisition_cost: None,
                monthly_cost: None,
                warranty_expires: None,
                support_level: None,
                metadata: {
                    let mut map = HashMap::new();
                    map.insert("source".to_string(), json!("rvtools"));
                    map.insert("upload_id".to_string(), json!(upload_id.to_string()));
                    map.insert("host_name".to_string(), json!(host.host_name));
                    map.insert("esxi_version".to_string(), json!(host.esxi_version));
                    map.insert("cpu_model".to_string(), json!(host.cpu_model));
                    map.insert("bios_version".to_string(), json!(host.bios_version));
                    map
                },
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };
            
            let created: Vec<HardwarePool> = self.db
                .create("hardware_pool")
                .content(pool_entry)
                .await?;
                
            imported.push(created.into_iter().next().unwrap());
        }
    }
    
    Ok(imported)
}
```

---

## Phase 4: Migration Project Integration

### 4.1 Capacity Planning View

**New Component**: `CapacityPlanningView.tsx`

**Features**:
1. Show all physical hosts in hardware pool (from RVTools or manual entry)
2. Show all VMs that need to be migrated (from RVTools source data)
3. Drag-and-drop VMs to destination clusters
4. Real-time capacity calculation
5. Network requirements validation
6. Conflict detection (e.g., overcommit warnings)

**Mock UI**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Capacity Planning - Project: Azure Migration 2025              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Source Environment (RVTools Upload: vcenter_prod_2025.xlsx)    │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Production-Cluster-01                                      │  │
│ │ • 12 Hosts | 576 vCPU | 6144 GB RAM | 287 VMs             │  │
│ │                                                            │  │
│ │ VMs (drag to assign):                                      │  │
│ │ □ web-server-01   [4 vCPU, 16 GB]                         │  │
│ │ □ db-server-01    [8 vCPU, 64 GB]                         │  │
│ │ □ app-server-01   [4 vCPU, 32 GB]                         │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│ Destination Clusters (Hardware Pool)                           │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Azure-Target-Cluster-01                                    │  │
│ │ • 6 Hosts | 288 vCPU | 3072 GB RAM                        │  │
│ │ • Assigned: 45 VMs (180 vCPU, 720 GB used)                │  │
│ │ • Available: 108 vCPU, 2352 GB                            │  │
│ │                                                            │  │
│ │ Capacity: ████████░░░░░░░░░░ 40%                          │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│ [Simulate Migration] [Save Configuration] [Export Report]     │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4.2 Networking Analysis

**Goal**: Validate that destination clusters can support source networking requirements

**Data Needed**:
- Source vSwitches and port groups (from RVTools)
- Destination network configuration
- VLAN mappings
- Network adapter types

**API**: `POST /api/migration/analyze-networking`

**Request**:
```json
{
  "source_upload_id": "rvtools_upload:source",
  "destination_cluster_ids": ["cluster:dest1", "cluster:dest2"],
  "vlan_mappings": {
    "100": "200",  // Source VLAN 100 -> Dest VLAN 200
    "101": "201"
  }
}
```

**Response**:
```json
{
  "compatible": true,
  "warnings": [
    {
      "type": "vlan_unmapped",
      "message": "Source VLAN 102 has no mapping defined",
      "affected_vms": ["vm1", "vm2"]
    }
  ],
  "port_group_mappings": [
    {
      "source_pg": "Production-VLAN100",
      "dest_pg": "Azure-VLAN200",
      "vm_count": 23
    }
  ]
}
```

---

## Phase 5: Implementation Timeline

### Week 1: Database & Backend Foundation
- ✅ **Day 1-2**: Switch database to persistent mode
- ✅ **Day 3-4**: Create extended RVTools schema
- ✅ **Day 4-5**: Enhance RVTools parser (Excel support)

### Week 2: Server Detection API
- ✅ **Day 1-2**: Implement upload-and-detect endpoint
- ✅ **Day 3**: Build server extraction logic
- ✅ **Day 4-5**: Testing with real RVTools files

### Week 3: Frontend Components
- ✅ **Day 1-2**: RVToolsUploadButton component
- ✅ **Day 3-4**: ServerSelectionModal component
- ✅ **Day 5**: Integration with Hardware Pool view

### Week 4: Import & Storage
- ✅ **Day 1-2**: Import API endpoint
- ✅ **Day 3-4**: Store VMs, networking, relationships
- ✅ **Day 5**: Testing & validation

### Week 5: Capacity Planning UI
- ✅ **Day 1-3**: CapacityPlanningView component
- ✅ **Day 4-5**: VM assignment & capacity calculations

### Week 6: Networking & Validation
- ✅ **Day 1-2**: Network analysis API
- ✅ **Day 3-4**: Conflict detection
- ✅ **Day 5**: Final testing

---

## Technology Stack Additions

### Backend Dependencies
```toml
# Cargo.toml additions
calamine = "0.24"          # Excel file parsing
csv = "1.3"                # CSV parsing
sha2 = "0.10"              # File hashing
tempfile = "3.8"           # Temporary file handling
tokio-stream = "0.1"       # Async streaming
```

### Frontend Dependencies
```json
// package.json additions
{
  "react-dropzone": "^14.2.3",     // File upload UI
  "react-beautiful-dnd": "^13.1.1", // Drag & drop for VM assignment
  "recharts": "^2.10.0"             // Capacity visualization charts
}
```

---

## Data Flow Diagram

```
┌──────────────┐
│  User        │
│  Uploads     │
│  RVTools.xlsx│
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  Frontend            │
│  RvToolsUploadButton │
└──────┬───────────────┘
       │ POST /api/rvtools/upload-and-detect
       ▼
┌──────────────────────────────┐
│  Backend                     │
│  RvToolsService              │
│  ┌────────────────────────┐  │
│  │ 1. Parse Excel/CSV     │  │
│  │ 2. Extract Hosts       │  │
│  │ 3. Extract VMs         │  │
│  │ 4. Extract Networking  │  │
│  │ 5. Create Relationships│  │
│  └────────────────────────┘  │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Database (SurrealDB)    │
│  • physical_host         │
│  • virtual_machine       │
│  • vswitch               │
│  • port_group            │
│  • vm_network_adapter    │
│  • datastore             │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Frontend                │
│  ServerSelectionModal    │
│  (Shows detected servers)│
└──────┬───────────────────┘
       │ User selects servers
       ▼
┌──────────────────────────────┐
│  Backend                     │
│  POST /import-from-rvtools   │
│  Create hardware_pool entries│
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Hardware Pool           │
│  (Servers available for  │
│   capacity planning)     │
└──────────────────────────┘
```

---

## Testing Strategy

### Unit Tests
- RVTools parser (various Excel formats)
- Server extraction logic
- Capacity calculation algorithms
- Network validation

### Integration Tests
- Full upload -> detect -> import flow
- Database persistence across restarts
- Relationship integrity

### E2E Tests
1. Upload RVTools file
2. Verify server detection
3. Select servers
4. Import to hardware pool
5. Assign to migration project
6. Validate capacity planning

---

## Risk Mitigation

### Risk 1: RVTools Format Changes
**Mitigation**: Version detection, backward compatibility layer

### Risk 2: Large File Performance
**Mitigation**: Streaming parser, chunked processing, background jobs

### Risk 3: Data Integrity
**Mitigation**: Transaction support, rollback on failure, validation checks

### Risk 4: Complex Networking
**Mitigation**: Phased approach, start with basic VLAN mapping, expand later

---

## Success Metrics

✅ **Functional**:
- Upload RVTools file successfully
- Detect 100% of physical hosts
- Import servers to hardware pool
- Assign VMs to clusters
- Generate capacity report

✅ **Performance**:
- Process 1000-VM RVTools file in < 30 seconds
- UI remains responsive during processing
- Database queries < 100ms

✅ **Usability**:
- 3-click workflow: Upload → Select → Import
- Clear capacity visualization
- Informative error messages

---

## Future Enhancements (Phase 2)

1. **Automated Optimization**: AI-driven VM placement recommendations
2. **Cost Analysis**: Calculate migration costs based on hardware pool allocation
3. **Timeline Simulation**: Gantt chart of migration waves
4. **Real-time Monitoring**: Track migration progress
5. **Rollback Planning**: Automated fallback configurations
6. **Multi-Hypervisor Support**: Hyper-V, KVM, Nutanix

---

## Questions for Clarification

1. **RVTools Format**: Do you primarily use Excel (.xlsx) or CSV exports?
2. **Authentication**: Should RVTools upload require special permissions?
3. **Projects**: One RVTools upload per project, or shared across projects?
4. **Historical Data**: Keep old uploads for comparison/auditing?
5. **Networking**: Should we auto-detect VLAN mappings or require manual input?
6. **Validation**: Block import if capacity insufficient, or just warn?

---

## Next Steps

1. **Review & Approve**: Review this plan, provide feedback
2. **UI Fix**: Commit Hardware Pool subtitle alignment fix (already done)
3. **Phase 1 Start**: Switch to persistent database
4. **Prototype**: Build minimal viable upload -> detect -> import flow
5. **Iterate**: Expand based on real-world RVTools files

**Estimated Total Effort**: 6 weeks (1 developer)
**Priority**: High (enables capacity planning and migration simulation)

---

*Document Version: 1.0*  
*Created: 2025-10-21*  
*Last Updated: 2025-10-21*

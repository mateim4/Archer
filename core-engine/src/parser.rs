use crate::models::*;
use crate::error::CoreEngineError;
use crate::Result;
use calamine::{Reader, Xlsx, open_workbook, Range, DataType};
use std::collections::HashMap;
use std::path::Path;
use chrono::Utc;
use uuid::Uuid;

/// RVTools Excel file parser
pub struct RvToolsParser {
    workbook: Xlsx<std::io::BufReader<std::fs::File>>,
    header_maps: HashMap<String, HashMap<String, usize>>,
}

impl RvToolsParser {
    /// Open and initialize the RVTools file
    pub fn new<P: AsRef<Path>>(file_path: P) -> Result<Self> {
        let workbook: Xlsx<_> = open_workbook(file_path)
            .map_err(|e| CoreEngineError::parsing(format!("Failed to ope        let total_pcores: u32 = clusters.iter().map(|c| c.metrics.total_pcpu_cores).sum::<u32>(); Excel file: {}", e)))?;

        Ok(Self {
            workbook,
            header_maps: HashMap::new(),
        })
    }

    /// Parse the entire RVTools file into a VsphereEnvironment
    pub fn parse(&mut self) -> Result<VsphereEnvironment> {
        // First, build header maps for all required sheets
        self.build_header_maps()?;

        // Parse each required sheet
        let vm_data = self.parse_vm_info()?;
        let host_data = self.parse_host_info()?;
        let disk_data = self.parse_disk_info()?;
        let partition_data = self.parse_partition_info()?;
        let network_data = self.parse_network_info()?;

        // Build the complete environment model
        let environment = self.build_environment_model(
            vm_data,
            host_data,
            disk_data,
            partition_data,
            network_data,
        )?;

        Ok(environment)
    }

    /// Build header maps for dynamic column lookup
    fn build_header_maps(&mut self) -> Result<()> {
        let required_sheets = vec![
            "vInfo", "vHost", "vDisk", "vPartition", "vNetwork",
            "vCPU", "vMemory", "vHealth" // Optional sheets
        ];

        for sheet_name in required_sheets {
            if let Some(Ok(range)) = self.workbook.worksheet_range(sheet_name) {
                let header_map = self.build_header_map_for_sheet(&range)?;
                self.header_maps.insert(sheet_name.to_string(), header_map);
            }
        }

        // Verify required sheets are present
        let required_core_sheets = vec!["vInfo", "vHost", "vDisk", "vPartition"];
        for sheet in required_core_sheets {
            if !self.header_maps.contains_key(sheet) {
                return Err(CoreEngineError::parsing(
                    format!("Required sheet '{}' not found in RVTools file", sheet)
                ));
            }
        }

        Ok(())
    }

    /// Build header map for a specific sheet
    fn build_header_map_for_sheet(&self, range: &Range<DataType>) -> Result<HashMap<String, usize>> {
        let mut header_map = HashMap::new();

        if let Some(header_row) = range.rows().next() {
            for (col_idx, cell) in header_row.iter().enumerate() {
                if let Some(header_name) = cell.get_string() {
                    header_map.insert(header_name.trim().to_string(), col_idx);
                }
            }
        }

        Ok(header_map)
    }

    /// Parse vInfo sheet for VM data
    fn parse_vm_info(&mut self) -> Result<Vec<RawVmData>> {
        let range = self.workbook.worksheet_range("vInfo")
            .ok_or_else(|| CoreEngineError::parsing("vInfo sheet not found".to_string()))?
            .map_err(|e| CoreEngineError::parsing(format!("Failed to read vInfo sheet: {}", e)))?;

        let header_map = self.header_maps.get("vInfo")
            .ok_or_else(|| CoreEngineError::parsing("vInfo header map not found"))?;

        let mut vms = Vec::new();

        // Skip header row
        for row in range.rows().skip(1) {
            if row.is_empty() || self.is_row_empty(row) {
                continue;
            }

            let vm = self.parse_vm_row(row, header_map)?;
            vms.push(vm);
        }

        Ok(vms)
    }

    /// Parse vHost sheet for host data
    fn parse_host_info(&mut self) -> Result<Vec<Host>> {
        let range = self.workbook.worksheet_range("vHost")
            .ok_or_else(|| CoreEngineError::parsing("vHost sheet not found".to_string()))?
            .map_err(|e| CoreEngineError::parsing(format!("Failed to read vHost sheet: {}", e)))?;

        let header_map = self.header_maps.get("vHost")
            .ok_or_else(|| CoreEngineError::parsing("vHost header map not found"))?;

        let mut hosts = Vec::new();

        for row in range.rows().skip(1) {
            if row.is_empty() || self.is_row_empty(row) {
                continue;
            }

            let host = self.parse_host_row(row, header_map)?;
            hosts.push(host);
        }

        Ok(hosts)
    }

    /// Parse vDisk sheet for disk data
    fn parse_disk_info(&mut self) -> Result<Vec<RawDiskData>> {
        let range = self.workbook.worksheet_range("vDisk")
            .ok_or_else(|| CoreEngineError::parsing("vDisk sheet not found".to_string()))?
            .map_err(|e| CoreEngineError::parsing(format!("Failed to read vDisk sheet: {}", e)))?;

        let header_map = self.header_maps.get("vDisk")
            .ok_or_else(|| CoreEngineError::parsing("vDisk header map not found"))?;

        let mut disks = Vec::new();

        for row in range.rows().skip(1) {
            if row.is_empty() || self.is_row_empty(row) {
                continue;
            }

            let disk = self.parse_disk_row(row, header_map)?;
            disks.push(disk);
        }

        Ok(disks)
    }

    /// Parse vPartition sheet for partition data
    fn parse_partition_info(&mut self) -> Result<Vec<RawPartitionData>> {
        let range = self.workbook.worksheet_range("vPartition")
            .ok_or_else(|| CoreEngineError::parsing("vPartition sheet not found".to_string()))?
            .map_err(|e| CoreEngineError::parsing(format!("Failed to read vPartition sheet: {}", e)))?;

        let header_map = self.header_maps.get("vPartition")
            .ok_or_else(|| CoreEngineError::parsing("vPartition header map not found"))?;

        let mut partitions = Vec::new();

        for row in range.rows().skip(1) {
            if row.is_empty() || self.is_row_empty(row) {
                continue;
            }

            let partition = self.parse_partition_row(row, header_map)?;
            partitions.push(partition);
        }

        Ok(partitions)
    }

    /// Parse vNetwork sheet for network data
    fn parse_network_info(&mut self) -> Result<Vec<RawNetworkData>> {
        if let Some(Ok(range)) = self.workbook.worksheet_range("vNetwork") {
            if let Some(header_map) = self.header_maps.get("vNetwork") {
                let mut networks = Vec::new();

                for row in range.rows().skip(1) {
                    if row.is_empty() || self.is_row_empty(row) {
                        continue;
                    }

                    let network = self.parse_network_row(row, header_map)?;
                    networks.push(network);
                }

                return Ok(networks);
            }
        }

        // Network data is optional, return empty vec if not available
        Ok(Vec::new())
    }

    /// Parse individual VM row
    fn parse_vm_row(&self, row: &[DataType], header_map: &HashMap<String, usize>) -> Result<RawVmData> {
        let get_string = |col_name: &str| -> Option<String> {
            header_map.get(col_name)
                .and_then(|&idx| row.get(idx))
                .and_then(|cell| cell.get_string())
                .map(|s| s.trim().to_string())
        };

        let get_float = |col_name: &str| -> Option<f64> {
            header_map.get(col_name)
                .and_then(|&idx| row.get(idx))
                .and_then(|cell| cell.get_float())
        };

        let get_int = |col_name: &str| -> Option<i64> {
            header_map.get(col_name)
                .and_then(|&idx| row.get(idx))
                .and_then(|cell| cell.get_int())
        };

        let get_bool = |col_name: &str| -> bool {
            header_map.get(col_name)
                .and_then(|&idx| row.get(idx))
                .and_then(|cell| cell.get_string())
                .map(|s| s.trim().to_lowercase() == "true")
                .unwrap_or(false)
        };

        let vm_name = get_string("VM")
            .ok_or_else(|| CoreEngineError::parsing("Missing VM name"))?;

        Ok(RawVmData {
            name: vm_name,
            cluster: get_string("Cluster"),
            host: get_string("Host"),
            powerstate: get_string("Powerstate"),
            cpus: get_int("CPUs").unwrap_or(0) as u32,
            memory: get_float("Memory").unwrap_or(0.0),
            _provisioned_mb: get_float("Provisioned MB").unwrap_or(0.0),
            _in_use_mb: get_float("In Use MB").unwrap_or(0.0),
            guest_os: get_string("OS"),
            vm_version: get_string("VM Version"),
            tools_status: get_string("Tools Status"),
            tools_version: get_string("Tools Version"),
            template: get_bool("Template"),
            annotation: get_string("Annotation"),
            notes: get_string("Notes"),
            folder: get_string("Folder"),
            resource_pool: get_string("Resource Pool"),
        })
    }

    /// Parse individual host row
    fn parse_host_row(&self, row: &[DataType], header_map: &HashMap<String, usize>) -> Result<Host> {
        let get_string = |col_name: &str| -> Option<String> {
            header_map.get(col_name)
                .and_then(|&idx| row.get(idx))
                .and_then(|cell| cell.get_string())
                .map(|s| s.trim().to_string())
        };

        let get_int = |col_name: &str| -> Option<i64> {
            header_map.get(col_name)
                .and_then(|&idx| row.get(idx))
                .and_then(|cell| cell.get_int())
        };

        let host_name = get_string("Host")
            .ok_or_else(|| CoreEngineError::parsing("Missing host name"))?;

        let cpu_model = get_string("CPU Model").unwrap_or_default();
        let num_cores = get_int("# Cores").unwrap_or(0) as u32;
        let memory_gb = get_int("Memory").map(|mb| (mb / 1024) as u32).unwrap_or(0);

        Ok(Host {
            name: host_name,
            cluster_name: get_string("Cluster"),
            cpu_model,
            num_cpu_sockets: get_int("# CPU").unwrap_or(0) as u32,
            cores_per_socket: if num_cores > 0 && get_int("# CPU").unwrap_or(0) > 0 {
                num_cores / (get_int("# CPU").unwrap_or(1) as u32)
            } else {
                0
            },
            num_cpu_cores: num_cores,
            total_memory_gb: memory_gb,
            esx_version: get_string("ESX Version"),
            vendor: get_string("Vendor"),
            model: get_string("Model"),
            connection_state: get_string("Connection State"),
            power_state: get_string("Power State"),
            vms: Vec::new(), // Will be populated later when parsing VMs
        })
    }

    /// Parse individual disk row
    fn parse_disk_row(&self, row: &[DataType], header_map: &HashMap<String, usize>) -> Result<RawDiskData> {
        let get_string = |col_name: &str| -> Option<String> {
            header_map.get(col_name)
                .and_then(|&idx| row.get(idx))
                .and_then(|cell| cell.get_string())
                .map(|s| s.trim().to_string())
        };

        let get_float = |col_name: &str| -> Option<f64> {
            header_map.get(col_name)
                .and_then(|&idx| row.get(idx))
                .and_then(|cell| cell.get_float())
        };

        let get_bool = |col_name: &str| -> bool {
            header_map.get(col_name)
                .and_then(|&idx| row.get(idx))
                .and_then(|cell| cell.get_string())
                .map(|s| s.trim().to_lowercase() == "true")
                .unwrap_or(false)
        };

        Ok(RawDiskData {
            vm_name: get_string("VM").unwrap_or_default(),
            disk: get_string("Disk").unwrap_or_default(),
            capacity_mb: get_float("Capacity MB").unwrap_or(0.0),
            _path: get_string("Path"),
            raw: get_bool("Raw"),
            thin: get_bool("Thin"),
            datastore: get_string("Datastore"),
        })
    }

    /// Parse individual partition row
    fn parse_partition_row(&self, row: &[DataType], header_map: &HashMap<String, usize>) -> Result<RawPartitionData> {
        let get_string = |col_name: &str| -> Option<String> {
            header_map.get(col_name)
                .and_then(|&idx| row.get(idx))
                .and_then(|cell| cell.get_string())
                .map(|s| s.trim().to_string())
        };

        let get_float = |col_name: &str| -> Option<f64> {
            header_map.get(col_name)
                .and_then(|&idx| row.get(idx))
                .and_then(|cell| cell.get_float())
        };

        Ok(RawPartitionData {
            vm_name: get_string("VM").unwrap_or_default(),
            disk: get_string("Disk").unwrap_or_default(),
            _capacity_mb: get_float("Capacity MB").unwrap_or(0.0),
            consumed_mb: get_float("Consumed MB").unwrap_or(0.0),
            _freespace_mb: get_float("Freespace MB").unwrap_or(0.0),
        })
    }

    /// Parse individual network row
    fn parse_network_row(&self, row: &[DataType], header_map: &HashMap<String, usize>) -> Result<RawNetworkData> {
        let get_string = |col_name: &str| -> Option<String> {
            header_map.get(col_name)
                .and_then(|&idx| row.get(idx))
                .and_then(|cell| cell.get_string())
                .map(|s| s.trim().to_string())
        };

        let get_bool = |col_name: &str| -> bool {
            header_map.get(col_name)
                .and_then(|&idx| row.get(idx))
                .and_then(|cell| cell.get_string())
                .map(|s| s.trim().to_lowercase() == "true")
                .unwrap_or(false)
        };

        Ok(RawNetworkData {
            vm_name: get_string("VM").unwrap_or_default(),
            network_label: get_string("Network Label").unwrap_or_default(),
            connected: get_bool("Connected"),
            adapter_type: get_string("Adapter Type"),
            mac_address: get_string("MAC Address"),
        })
    }

    /// Check if a row is empty
    fn is_row_empty(&self, row: &[DataType]) -> bool {
        row.iter().all(|cell| {
            match cell {
                DataType::Empty => true,
                DataType::String(s) => s.trim().is_empty(),
                _ => false,
            }
        })
    }

    /// Build the complete environment model from raw data
    fn build_environment_model(
        &self,
        vm_data: Vec<RawVmData>,
        host_data: Vec<Host>,
        disk_data: Vec<RawDiskData>,
        partition_data: Vec<RawPartitionData>,
        network_data: Vec<RawNetworkData>,
    ) -> Result<VsphereEnvironment> {
        // Group hosts by cluster
        let mut cluster_map: HashMap<String, Vec<Host>> = HashMap::new();
        let mut standalone_hosts = Vec::new();

        for host in host_data {
            if let Some(cluster_name) = &host.cluster_name {
                cluster_map.entry(cluster_name.clone()).or_insert_with(Vec::new).push(host);
            } else {
                standalone_hosts.push(host);
            }
        }

        // Process VMs and associate with disks and networks
        let processed_vms = self.process_vms(vm_data, disk_data, partition_data, network_data)?;

        // Group VMs by cluster
        let mut vm_cluster_map: HashMap<String, Vec<VirtualMachine>> = HashMap::new();
        for vm in processed_vms {
            vm_cluster_map.entry(vm.cluster_name.clone()).or_insert_with(Vec::new).push(vm);
        }

        // Build clusters
        let mut clusters = Vec::new();
        for (cluster_name, hosts) in cluster_map {
            let vms = vm_cluster_map.remove(&cluster_name).unwrap_or_default();
            let metrics = self.calculate_cluster_metrics(&hosts, &vms);
            let health_status = self.analyze_cluster_health(&vms);

            clusters.push(Cluster {
                name: cluster_name,
                hosts,
                vms,
                metrics,
                health_status,
            });
        }

        // Calculate environment summary
        let summary_metrics = self.calculate_environment_summary(&clusters, &standalone_hosts);

        Ok(VsphereEnvironment {
            id: Uuid::new_v4(),
            name: "RVTools Import".to_string(),
            parsed_at: Utc::now(),
            total_vms: summary_metrics.total_vcpus as usize / 4, // Rough estimate
            total_hosts: clusters.iter().map(|c| c.hosts.len()).sum::<usize>() + standalone_hosts.len(),
            clusters,
            standalone_hosts,
            summary_metrics,
        })
    }

    /// Process raw VM data into structured VirtualMachine objects
    fn process_vms(
        &self,
        vm_data: Vec<RawVmData>,
        disk_data: Vec<RawDiskData>,
        partition_data: Vec<RawPartitionData>,
        network_data: Vec<RawNetworkData>,
    ) -> Result<Vec<VirtualMachine>> {
        let mut vms = Vec::new();

        // Create maps for efficient lookup
        let disk_map = self.create_disk_map(disk_data, partition_data);
        let network_map = self.create_network_map(network_data);

        for raw_vm in vm_data {
            let vm = self.convert_raw_vm_to_vm(raw_vm, &disk_map, &network_map)?;
            vms.push(vm);
        }

        Ok(vms)
    }

    /// Create disk map for efficient lookup
    fn create_disk_map(
        &self,
        disk_data: Vec<RawDiskData>,
        partition_data: Vec<RawPartitionData>,
    ) -> HashMap<String, Vec<VirtualDisk>> {
        let mut disk_map: HashMap<String, Vec<VirtualDisk>> = HashMap::new();

        // Group partition data by VM
        let mut partition_map: HashMap<String, Vec<RawPartitionData>> = HashMap::new();
        for partition in partition_data {
            partition_map.entry(partition.vm_name.clone()).or_insert_with(Vec::new).push(partition);
        }

        // Process disks and merge with partition data
        for disk in disk_data {
            let consumed_in_guest_gb = if let Some(partitions) = partition_map.get(&disk.vm_name) {
                partitions.iter()
                    .filter(|p| p.disk == disk.disk)
                    .map(|p| p.consumed_mb / 1024.0)
                    .sum()
            } else {
                disk.capacity_mb / 1024.0 // Fallback to capacity if no partition data
            };

            let provisioning_type = if disk.thin {
                ProvisioningType::Thin
            } else {
                ProvisioningType::Thick
            };

            let virtual_disk = VirtualDisk {
                vm_name: disk.vm_name.clone(),
                disk_label: disk.disk,
                provisioned_gb: disk.capacity_mb / 1024.0,
                consumed_in_guest_gb,
                consumed_on_datastore_gb: disk.capacity_mb / 1024.0,
                is_rdm: disk.raw,
                disk_mode: None,
                provisioning_type,
                datastore_name: disk.datastore,
            };

            disk_map.entry(disk.vm_name).or_insert_with(Vec::new).push(virtual_disk);
        }

        disk_map
    }

    /// Create network map for efficient lookup
    fn create_network_map(&self, network_data: Vec<RawNetworkData>) -> HashMap<String, Vec<VirtualNic>> {
        let mut network_map: HashMap<String, Vec<VirtualNic>> = HashMap::new();

        for network in network_data {
            let virtual_nic = VirtualNic {
                vm_name: network.vm_name.clone(),
                port_group_name: network.network_label.clone(),
                vlan_id: None, // Would need additional parsing to extract VLAN
                network_label: Some(network.network_label),
                connected: network.connected,
                nic_type: network.adapter_type,
                mac_address: network.mac_address,
            };

            network_map.entry(network.vm_name).or_insert_with(Vec::new).push(virtual_nic);
        }

        network_map
    }

    /// Convert raw VM data to structured VirtualMachine
    fn convert_raw_vm_to_vm(
        &self,
        raw_vm: RawVmData,
        disk_map: &HashMap<String, Vec<VirtualDisk>>,
        network_map: &HashMap<String, Vec<VirtualNic>>,
    ) -> Result<VirtualMachine> {
        let power_state = PowerState::from_string(&raw_vm.powerstate.unwrap_or_default());
        let disks = disk_map.get(&raw_vm.name).cloned().unwrap_or_default();
        let nics = network_map.get(&raw_vm.name).cloned().unwrap_or_default();

        // Analyze special flags
        let has_rdm = disks.iter().any(|d| d.is_rdm);
        let is_zombie = power_state == PowerState::PoweredOff; // Simplified logic
        let is_critical = raw_vm.annotation.as_ref()
            .map(|a| a.to_lowercase().contains("critical") || a.to_lowercase().contains("sql"))
            .unwrap_or(false);

        Ok(VirtualMachine {
            name: raw_vm.name,
            cluster_name: raw_vm.cluster.unwrap_or_default(),
            host_name: raw_vm.host.unwrap_or_default(),
            power_state,
            num_vcpu: raw_vm.cpus,
            memory_gb: (raw_vm.memory / 1024.0) as u32,
            guest_os: raw_vm.guest_os,
            vm_version: raw_vm.vm_version,
            tools_status: raw_vm.tools_status,
            tools_version: raw_vm.tools_version,
            is_template: raw_vm.template,
            disks,
            nics,
            notes: raw_vm.notes,
            annotation: raw_vm.annotation,
            folder: raw_vm.folder,
            resource_pool: raw_vm.resource_pool,
            created_date: None,
            last_powered_on: None,
            special_flags: VmSpecialFlags {
                has_rdm,
                ft_enabled: false, // Would need additional data to determine
                is_zombie,
                needs_manual_attention: has_rdm,
                is_critical_workload: is_critical,
            },
        })
    }

    /// Calculate cluster metrics
    fn calculate_cluster_metrics(&self, hosts: &[Host], vms: &[VirtualMachine]) -> ClusterMetrics {
        let total_pcpu_cores: u32 = hosts.iter().map(|h| h.num_cpu_cores).sum();
        let total_vcpus: u32 = vms.iter()
            .filter(|vm| vm.power_state == PowerState::PoweredOn)
            .map(|vm| vm.num_vcpu)
            .sum();
        let total_memory_gb: u32 = hosts.iter().map(|h| h.total_memory_gb).sum();
        let provisioned_memory_gb: f64 = vms.iter()
            .filter(|vm| vm.power_state == PowerState::PoweredOn)
            .map(|vm| vm.memory_gb as f64)
            .sum();

        let consumed_storage_gb: f64 = vms.iter()
            .flat_map(|vm| &vm.disks)
            .map(|disk| disk.consumed_in_guest_gb)
            .sum();

        ClusterMetrics {
            total_hosts: hosts.len(),
            total_vms: vms.len(),
            total_pcpu_cores,
            total_vcpus,
            current_vcpu_pcpu_ratio: if total_pcpu_cores > 0 {
                total_vcpus as f32 / total_pcpu_cores as f32
            } else {
                0.0
            },
            total_memory_gb,
            provisioned_memory_gb,
            memory_overcommit_ratio: if total_memory_gb > 0 {
                provisioned_memory_gb / total_memory_gb as f64
            } else {
                0.0
            } as f32,
            total_storage_gb: vms.iter().flat_map(|vm| &vm.disks).map(|d| d.provisioned_gb).sum(),
            consumed_storage_gb,
        }
    }

    /// Analyze cluster health
    fn analyze_cluster_health(&self, vms: &[VirtualMachine]) -> ClusterHealth {
        let zombie_vms: Vec<String> = vms.iter()
            .filter(|vm| vm.special_flags.is_zombie)
            .map(|vm| vm.name.clone())
            .collect();

        let outdated_tools: Vec<String> = vms.iter()
            .filter(|vm| {
                vm.tools_status.as_ref()
                    .map(|status| status.contains("out of date") || status.contains("not installed"))
                    .unwrap_or(false)
            })
            .map(|vm| vm.name.clone())
            .collect();

        let rdm_vms: Vec<String> = vms.iter()
            .filter(|vm| vm.special_flags.has_rdm)
            .map(|vm| vm.name.clone())
            .collect();

        let ft_enabled_vms: Vec<String> = vms.iter()
            .filter(|vm| vm.special_flags.ft_enabled)
            .map(|vm| vm.name.clone())
            .collect();

        ClusterHealth {
            zombie_vms,
            outdated_tools,
            rdm_vms,
            ft_enabled_vms,
            warnings: Vec::new(),
        }
    }

    /// Calculate environment-wide summary metrics
    fn calculate_environment_summary(
        &self,
        clusters: &[Cluster],
        standalone_hosts: &[Host],
    ) -> EnvironmentSummary {
        let total_vcpus: u32 = clusters.iter().map(|c| c.metrics.total_vcpus).sum();
        let total_pcores: u32 = clusters.iter().map(|c| c.metrics.total_pcpu_cores).sum::<u32>()
            + standalone_hosts.iter().map(|h| h.num_cpu_cores).sum::<u32>();

        let total_provisioned_memory_gb: f64 = clusters.iter()
            .map(|c| c.metrics.provisioned_memory_gb)
            .sum();

        let total_consumed_storage_gb: f64 = clusters.iter()
            .map(|c| c.metrics.consumed_storage_gb)
            .sum();

        let health_issues = self.collect_health_issues(clusters);

        EnvironmentSummary {
            total_vcpus,
            total_pcores,
            total_provisioned_memory_gb,
            total_consumed_memory_gb: total_provisioned_memory_gb, // Simplified
            total_provisioned_storage_gb: clusters.iter().map(|c| c.metrics.total_storage_gb).sum(),
            total_consumed_storage_gb,
            overall_vcpu_pcpu_ratio: if total_pcores > 0 {
                total_vcpus as f32 / total_pcores as f32
            } else {
                0.0
            },
            health_issues,
        }
    }

    /// Collect health issues from all clusters
    fn collect_health_issues(&self, clusters: &[Cluster]) -> Vec<HealthIssue> {
        let mut issues = Vec::new();

        for cluster in clusters {
            // Add zombie VM issues
            for vm_name in &cluster.health_status.zombie_vms {
                issues.push(HealthIssue {
                    severity: Severity::Warning,
                    category: "Zombie VM".to_string(),
                    description: format!("VM '{}' has been powered off for an extended period", vm_name),
                    affected_vm: Some(vm_name.clone()),
                    affected_host: None,
                    recommendation: "Consider removing if no longer needed".to_string(),
                });
            }

            // Add outdated tools issues
            for vm_name in &cluster.health_status.outdated_tools {
                issues.push(HealthIssue {
                    severity: Severity::Warning,
                    category: "Outdated VMware Tools".to_string(),
                    description: format!("VM '{}' has outdated VMware Tools", vm_name),
                    affected_vm: Some(vm_name.clone()),
                    affected_host: None,
                    recommendation: "Update VMware Tools before migration".to_string(),
                });
            }

            // Add RDM issues
            for vm_name in &cluster.health_status.rdm_vms {
                issues.push(HealthIssue {
                    severity: Severity::Critical,
                    category: "Raw Device Mapping".to_string(),
                    description: format!("VM '{}' uses Raw Device Mappings", vm_name),
                    affected_vm: Some(vm_name.clone()),
                    affected_host: None,
                    recommendation: "Requires manual migration planning".to_string(),
                });
            }
        }

        issues
    }
}

// Raw data structures for parsing
#[derive(Debug)]
struct RawVmData {
    name: String,
    cluster: Option<String>,
    host: Option<String>,
    powerstate: Option<String>,
    cpus: u32,
    memory: f64,
    _provisioned_mb: f64,
    _in_use_mb: f64,
    guest_os: Option<String>,
    vm_version: Option<String>,
    tools_status: Option<String>,
    tools_version: Option<String>,
    template: bool,
    annotation: Option<String>,
    notes: Option<String>,
    folder: Option<String>,
    resource_pool: Option<String>,
}

#[derive(Debug)]
struct RawDiskData {
    vm_name: String,
    disk: String,
    capacity_mb: f64,
    _path: Option<String>,
    raw: bool,
    thin: bool,
    datastore: Option<String>,
}

#[derive(Debug)]
struct RawPartitionData {
    vm_name: String,
    disk: String,
    _capacity_mb: f64,
    consumed_mb: f64,
    _freespace_mb: f64,
}

#[derive(Debug)]
struct RawNetworkData {
    vm_name: String,
    network_label: String,
    connected: bool,
    adapter_type: Option<String>,
    mac_address: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_power_state_parsing() {
        assert_eq!(PowerState::from_string("poweredOn"), PowerState::PoweredOn);
        assert_eq!(PowerState::from_string("poweredOff"), PowerState::PoweredOff);
        assert_eq!(PowerState::from_string("suspended"), PowerState::Suspended);
        assert_eq!(PowerState::from_string("unknown"), PowerState::Unknown);
    }

    #[test]
    fn test_provisioning_type_parsing() {
        assert_eq!(ProvisioningType::from_string("thin provision"), ProvisioningType::Thin);
        assert_eq!(ProvisioningType::from_string("thick provision lazy zeroed"), ProvisioningType::Thick);
        assert_eq!(ProvisioningType::from_string("thick provision eager zeroed"), ProvisioningType::ThickEagerZeroed);
    }
}

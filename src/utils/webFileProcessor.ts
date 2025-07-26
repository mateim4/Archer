// Web-based file processing for hardware configuration files
// Replicates the core-engine hardware parser functionality for browser environment

import ServerFileProcessor from './serverFileProcessor';

export interface UniversalServer {
  id: string;
  name: string;
  model: string;
  vendor: string;
  cpu_model: string;
  cpu_cores: number;
  memory_gb: number;
  storage_type: string;
  storage_capacity_gb: number;
  network_ports: number;
  power_consumption_watts: number;
  form_factor: string;
  price_usd?: number;
  raw_data?: Record<string, any>;
}

export interface VMwareEnvironment {
  clusters: Array<{
    id: string;
    name: string;
    environment: string;
    hosts: number;
    vms: number;
    description: string;
    utilization: number;
    totalCores: number;
    totalMemoryGB: number;
    totalStorageTB: number;
    vmwareVersion: string;
    datacenter: string;
    networkSegments: number;
    snapshots: number;
    backupCompliance: number;
    uptimeHours: number;
    powerState: string;
    drsEnabled: boolean;
    haEnabled: boolean;
    vMotionCapable: boolean;
    vSAN: boolean;
    storagePolicy: string;
    hardware: string;
    vendor: string;
    oldestVMAge: string;
    largestVMCPUs: string;
    largestVMMem: string;
    osBreakdown: Record<string, number>;
  }>;
  summary: {
    totalClusters: number;
    totalHosts: number;
    totalVMs: number;
    totalCores: number;
    totalMemoryGB: number;
    totalStorageTB: number;
    averageUtilization: number;
  };
}

// Vendor detection based on file content
enum Vendor {
  Dell = 'Dell',
  Lenovo = 'Lenovo',
  HPE = 'HPE',
  VMware = 'VMware',
  Unknown = 'Unknown'
}

class WebFileProcessor {
  private serverProcessor: ServerFileProcessor;

  constructor() {
    this.serverProcessor = new ServerFileProcessor();
  }

  /**
   * Detect vendor based on file content and name
   */
  private detectVendor(content: string, fileName: string): Vendor {
    const lowerContent = content.toLowerCase();
    const lowerFileName = fileName.toLowerCase();

    // VMware files (vSphere exports, RVTools, etc.) - CHECK FIRST!
    if (lowerContent.includes('vsphere') ||
        lowerContent.includes('vcenter') ||
        lowerContent.includes('rvtools') ||
        lowerContent.includes('vm name') ||
        lowerContent.includes('host name') ||
        lowerContent.includes('cluster') ||
        lowerContent.includes('datacenter') ||
        lowerContent.includes('vmware') ||
        lowerFileName.includes('rvtools') ||
        lowerFileName.includes('vmware') ||
        (lowerContent.includes('name') && lowerContent.includes('powerstate')) ||
        (lowerContent.includes('vm') && lowerContent.includes('cpu')) ||
        content.includes('VM Name') ||
        content.includes('Host Name') ||
        content.includes('Power State')) {
      return Vendor.VMware;
    }

    // Dell SCP XML files - must be actual XML with specific structure
    if (content.includes('<SystemConfiguration Model=') && 
        content.includes('</SystemConfiguration>') &&
        lowerFileName.includes('.xml')) {
      return Vendor.Dell;
    }
    
    // Lenovo DCSC XML files - must be actual XML with specific structure
    if (content.includes('<Configuration cf_ver=') && 
        content.includes('</Configuration>') &&
        lowerFileName.includes('.xml')) {
      return Vendor.Lenovo;
    }
    
    // HPE iQuote files
    if (lowerContent.includes('iquote') || 
        (lowerContent.includes('hewlett') && lowerContent.includes('packard')) ||
        (lowerContent.includes('hpe') && lowerContent.includes('quote'))) {
      return Vendor.HPE;
    }

    return Vendor.Unknown;
  }

  /**
   * Parse Dell SCP XML files
   */
  private parseDellScp(content: string): UniversalServer {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, 'text/xml');
      
      // Check for parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('Invalid XML format');
      }

      const systemConfig = xmlDoc.querySelector('SystemConfiguration');
      if (!systemConfig) {
        throw new Error('Invalid Dell SCP format');
      }

      const model = systemConfig.getAttribute('Model') || 'Unknown Model';
      const serviceTag = systemConfig.getAttribute('ServiceTag') || 'Unknown';

      // Extract CPU information
      const cpuComponent = xmlDoc.querySelector('Component[FQDD*="CPU"]');
      const cpuModel = cpuComponent?.querySelector('Attribute[Name="Model"]')?.textContent || 'Unknown CPU';
      
      // Extract memory information
      const memoryComponents = xmlDoc.querySelectorAll('Component[FQDD*="DIMM"]');
      let totalMemoryGB = 0;
      memoryComponents.forEach(dimm => {
        const sizeAttr = dimm.querySelector('Attribute[Name="Size"]')?.textContent;
        if (sizeAttr && sizeAttr !== 'Not Installed') {
          const sizeGB = parseInt(sizeAttr) / 1024; // Convert MB to GB
          totalMemoryGB += sizeGB;
        }
      });

      // Extract storage information
      const storageComponents = xmlDoc.querySelectorAll('Component[FQDD*="Disk"]');
      let totalStorageGB = 0;
      let storageType = 'Unknown';
      storageComponents.forEach(disk => {
        const capacityAttr = disk.querySelector('Attribute[Name="SizeInBytes"]')?.textContent;
        const mediaType = disk.querySelector('Attribute[Name="MediaType"]')?.textContent;
        
        if (capacityAttr) {
          const sizeGB = parseInt(capacityAttr) / (1024 * 1024 * 1024); // Convert bytes to GB
          totalStorageGB += sizeGB;
        }
        
        if (mediaType && storageType === 'Unknown') {
          storageType = mediaType;
        }
      });

      // Extract network information
      const networkComponents = xmlDoc.querySelectorAll('Component[FQDD*="NIC"]');
      const networkPorts = networkComponents.length;

      // Estimate CPU cores (simplified)
      const coreCount = cpuModel.includes('64') ? 64 : 
                       cpuModel.includes('32') ? 32 : 
                       cpuModel.includes('16') ? 16 : 8;

      return {
        id: serviceTag,
        name: `${model} (${serviceTag})`,
        model,
        vendor: 'Dell Technologies',
        cpu_model: cpuModel,
        cpu_cores: coreCount,
        memory_gb: totalMemoryGB,
        storage_type: storageType,
        storage_capacity_gb: totalStorageGB,
        network_ports: networkPorts,
        power_consumption_watts: 500, // Default estimate
        form_factor: model.includes('R750') ? '2U' : '1U',
        raw_data: { serviceTag, xmlContent: content }
      };
    } catch (error) {
      throw new Error(`Failed to parse Dell SCP file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse Lenovo DCSC XML files
   */
  private parseLenovoDcsc(content: string): UniversalServer {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, 'text/xml');
      
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('Invalid XML format');
      }

      const config = xmlDoc.querySelector('Configuration');
      if (!config) {
        throw new Error('Invalid Lenovo DCSC format');
      }

      // Extract basic info
      const model = config.querySelector('System')?.getAttribute('model') || 'Unknown Model';
      const serialNumber = config.querySelector('System')?.getAttribute('serial') || 'Unknown';

      // Extract CPU info
      const cpuInfo = config.querySelector('Processor');
      const cpuModel = cpuInfo?.getAttribute('model') || 'Unknown CPU';
      const cpuCores = parseInt(cpuInfo?.getAttribute('cores') || '8');

      // Extract memory info
      const memoryInfo = config.querySelector('Memory');
      const totalMemoryGB = parseInt(memoryInfo?.getAttribute('total_gb') || '16');

      // Extract storage info
      const storageInfo = config.querySelector('Storage');
      const storageCapacityGB = parseInt(storageInfo?.getAttribute('capacity_gb') || '500');
      const storageType = storageInfo?.getAttribute('type') || 'SSD';

      return {
        id: serialNumber,
        name: `${model} (${serialNumber})`,
        model,
        vendor: 'Lenovo',
        cpu_model: cpuModel,
        cpu_cores: cpuCores,
        memory_gb: totalMemoryGB,
        storage_type: storageType,
        storage_capacity_gb: storageCapacityGB,
        network_ports: 4, // Default
        power_consumption_watts: 450,
        form_factor: '1U',
        raw_data: { serialNumber, xmlContent: content }
      };
    } catch (error) {
      throw new Error(`Failed to parse Lenovo DCSC file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse HPE iQuote files (simplified CSV/text parsing)
   */
  private parseHpeIquote(content: string): UniversalServer {
    try {
      const lines = content.split('\n').map(line => line.trim()).filter(line => line);
      
      let model = 'Unknown Model';
      let cpuModel = 'Unknown CPU';
      let cpuCores = 8;
      let memoryGB = 16;
      let storageGB = 500;

      // Simple text parsing for HPE quotes
      lines.forEach(line => {
        const lowerLine = line.toLowerCase();
        
        if (lowerLine.includes('proliant') || lowerLine.includes('dl380') || lowerLine.includes('dl360')) {
          model = line.split(',')[0] || model;
        }
        
        if (lowerLine.includes('processor') || lowerLine.includes('cpu')) {
          cpuModel = line;
          // Extract core count from description
          const coreMatch = line.match(/(\d+)[\s-]*core/i);
          if (coreMatch) {
            cpuCores = parseInt(coreMatch[1]);
          }
        }
        
        if (lowerLine.includes('memory') || lowerLine.includes('ram')) {
          const memoryMatch = line.match(/(\d+)[\s]*gb/i);
          if (memoryMatch) {
            memoryGB = parseInt(memoryMatch[1]);
          }
        }
        
        if (lowerLine.includes('storage') || lowerLine.includes('disk') || lowerLine.includes('ssd')) {
          const storageMatch = line.match(/(\d+)[\s]*gb/i);
          if (storageMatch) {
            storageGB = parseInt(storageMatch[1]);
          }
        }
      });

      return {
        id: `HPE-${Date.now()}`,
        name: `${model}`,
        model,
        vendor: 'HPE',
        cpu_model: cpuModel,
        cpu_cores: cpuCores,
        memory_gb: memoryGB,
        storage_type: 'SSD',
        storage_capacity_gb: storageGB,
        network_ports: 4,
        power_consumption_watts: 500,
        form_factor: '2U',
        raw_data: { textContent: content }
      };
    } catch (error) {
      throw new Error(`Failed to parse HPE iQuote file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse VMware/vSphere export files (CSV format)
   */
  private parseVMwareExport(content: string): VMwareEnvironment {
    try {
      const lines = content.split('\n').map(line => line.trim()).filter(line => line);
      
      if (lines.length < 2) {
        throw new Error('Invalid CSV format - insufficient data');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataLines = lines.slice(1);

      const clusters = new Map<string, any>();
      
      // Process each VM/host record
      dataLines.forEach((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const record: Record<string, string> = {};
        
        headers.forEach((header, i) => {
          record[header] = values[i] || '';
        });

        // Extract cluster information
        const clusterName = record['Cluster'] || record['cluster'] || `Cluster-${index + 1}`;
        const hostName = record['Host'] || record['host'] || 'Unknown Host';
        const vmName = record['VM'] || record['vm'] || record['Name'] || '';
        
        if (!clusters.has(clusterName)) {
          clusters.set(clusterName, {
            id: clusterName.replace(/\s+/g, '-').toLowerCase(),
            name: clusterName,
            environment: record['Environment'] || 'Production',
            hosts: new Set<string>(),
            vms: 0,
            description: `${clusterName} cluster`,
            utilization: 70,
            totalCores: 0,
            totalMemoryGB: 0,
            totalStorageTB: 0,
            vmwareVersion: record['vSphere Version'] || 'vSphere 8.0',
            datacenter: record['Datacenter'] || 'DC-01',
            networkSegments: 4,
            snapshots: 0,
            backupCompliance: 95,
            uptimeHours: 8760,
            powerState: 'on',
            drsEnabled: true,
            haEnabled: true,
            vMotionCapable: true,
            vSAN: false,
            storagePolicy: 'VM Storage Policy - Standard',
            hardware: 'Mixed Hardware',
            vendor: 'Multiple',
            oldestVMAge: '2.5 years',
            largestVMCPUs: '8 vCPUs',
            largestVMMem: '32 GB',
            osBreakdown: {} as Record<string, number>
          });
        }

        const cluster = clusters.get(clusterName);
        
        // Add host to cluster
        if (hostName && hostName !== 'Unknown Host') {
          cluster.hosts.add(hostName);
        }
        
        // Count VMs
        if (vmName) {
          cluster.vms += 1;
          
          // Extract OS information
          const os = record['OS'] || record['Guest OS'] || record['Operating System'] || 'Unknown OS';
          if (os && os !== 'Unknown OS') {
            cluster.osBreakdown[os] = (cluster.osBreakdown[os] || 0) + 1;
          }
          
          // Extract resource information
          const cpus = parseInt(record['CPUs'] || record['vCPUs'] || '2');
          const memoryMB = parseInt(record['Memory (MB)'] || record['Memory'] || '4096');
          const storageMB = parseInt(record['Storage (MB)'] || record['Provisioned Space (MB)'] || '20480');
          
          cluster.totalCores += cpus;
          cluster.totalMemoryGB += memoryMB / 1024;
          cluster.totalStorageTB += storageMB / (1024 * 1024);
        }
      });

      // Convert Map to Array and finalize host counts
      const clusterArray = Array.from(clusters.values()).map(cluster => ({
        ...cluster,
        hosts: cluster.hosts.size,
        totalStorageTB: Math.round(cluster.totalStorageTB * 100) / 100
      }));

      // Calculate summary
      const summary = {
        totalClusters: clusterArray.length,
        totalHosts: clusterArray.reduce((sum, c) => sum + c.hosts, 0),
        totalVMs: clusterArray.reduce((sum, c) => sum + c.vms, 0),
        totalCores: clusterArray.reduce((sum, c) => sum + c.totalCores, 0),
        totalMemoryGB: Math.round(clusterArray.reduce((sum, c) => sum + c.totalMemoryGB, 0)),
        totalStorageTB: Math.round(clusterArray.reduce((sum, c) => sum + c.totalStorageTB, 0) * 100) / 100,
        averageUtilization: Math.round(clusterArray.reduce((sum, c) => sum + c.utilization, 0) / clusterArray.length)
      };

      return {
        clusters: clusterArray,
        summary
      };
    } catch (error) {
      throw new Error(`Failed to parse VMware export file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse hardware configuration file directly (skip vendor detection)
   */
  public async parseHardwareFile(file: File): Promise<UniversalServer> {
    const content = await this.readFileContent(file);
    const vendor = this.detectVendor(content, file.name);
    
    switch (vendor) {
      case Vendor.Dell:
        return this.parseDellScp(content);
      
      case Vendor.Lenovo:
        return this.parseLenovoDcsc(content);
      
      case Vendor.HPE:
        return this.parseHpeIquote(content);
      
      default:
        throw new Error(`Unsupported hardware file format. This appears to be a ${vendor} file. Please use the appropriate upload section for this vendor.`);
    }
  }

  /**
   * Parse VMware/RVTools file directly (skip vendor detection)
   */
  public async parseVMwareFile(file: File): Promise<VMwareEnvironment> {
    // Check if file needs server processing (Excel files)
    if (this.serverProcessor.needsServerProcessing(file)) {
      const serverAvailable = await this.serverProcessor.isServerAvailable();
      
      if (serverAvailable) {
        console.log('Using server processing for Excel file...');
        const csvContent = await this.serverProcessor.processVMwareFile(file);
        return this.parseVMwareExport(csvContent);
      } else {
        throw new Error('Excel files require server processing. Please start the backend server or export your RVTools data as CSV format.');
      }
    }
    
    // Process CSV files directly in browser
    const content = await this.readFileContent(file);
    return this.parseVMwareExport(content);
  }

  /**
   * Main parsing function that detects vendor and routes to appropriate parser
   */
  public async parseFile(file: File): Promise<UniversalServer | VMwareEnvironment> {
    const content = await this.readFileContent(file);
    const vendor = this.detectVendor(content, file.name);

    switch (vendor) {
      case Vendor.Dell:
        return this.parseDellScp(content);
      
      case Vendor.Lenovo:
        return this.parseLenovoDcsc(content);
      
      case Vendor.HPE:
        return this.parseHpeIquote(content);
      
      case Vendor.VMware:
        return this.parseVMwareExport(content);
      
      default:
        throw new Error(`Unsupported file format. Supported formats: Dell SCP (XML), Lenovo DCSC (XML), HPE iQuote (text/CSV), VMware exports (CSV)`);
    }
  }

  /**
   * Read file content as text
   */
  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      // Handle Excel files specially
      if (extension === 'xlsx' || extension === 'xls') {
        reject(new Error('Excel files require server processing. Please start the backend server with "npm run server" or export your RVTools data as CSV format for client-side processing.'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === 'string') {
          resolve(content);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Validate file type
   */
  public static isFileSupported(file: File): boolean {
    const supportedExtensions = ['xml', 'csv', 'txt', 'xls', 'xlsx'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension ? supportedExtensions.includes(extension) : false;
  }

  /**
   * Get supported file types for file input
   */
  public static getSupportedFileTypes(): string[] {
    return ['.xml', '.csv', '.txt', '.xls', '.xlsx'];
  }
}

export default WebFileProcessor;

/**
 * Hardware Basket Parser Service
 * Processes Dell and Lenovo hardware basket Excel files
 * Transforms data for SurrealDB storage
 */

import type { 
  HardwareBasket, 
  HardwareModel, 
  HardwareConfiguration, 
  HardwarePricing,
  HardwareSpecifications,
  DellLotData,
  LenovoServerData,
  ParseConfig,
  ImportResult,
  ImportError,
  SupportOption
} from '../types/hardwareBasketTypes';

import { 
  DELL_PARSE_CONFIG,
  LENOVO_PARSE_CONFIG
} from '../types/hardwareBasketTypes';

export class HardwareBasketParser {
  private errors: ImportError[] = [];
  private warnings: ImportError[] = [];
  
  /**
   * Parse Dell hardware basket data
   */
  parseDellBasket(excelData: any[], basketInfo: HardwareBasket): {
    models: HardwareModel[];
    configurations: HardwareConfiguration[];
    pricing: HardwarePricing[];
  } {
    const models: HardwareModel[] = [];
    const configurations: HardwareConfiguration[] = [];
    const pricing: HardwarePricing[] = [];
    
    const config = DELL_PARSE_CONFIG;
    
    // Process Dell Lot Pricing sheet
    const pricingSheet = excelData.find(sheet => sheet.name === 'Dell Lot Pricing');
    if (pricingSheet) {
      const processed = this.processDellLotPricing(pricingSheet.data, basketInfo);
      models.push(...processed.models);
      configurations.push(...processed.configurations);
      pricing.push(...processed.pricing);
    }
    
    return { models, configurations, pricing };
  }
  
  /**
   * Parse Lenovo hardware basket data
   */
  parseLenovoBasket(excelData: any[], basketInfo: HardwareBasket): {
    models: HardwareModel[];
    configurations: HardwareConfiguration[];
    pricing: HardwarePricing[];
  } {
    const models: HardwareModel[] = [];
    const configurations: HardwareConfiguration[] = [];
    const pricing: HardwarePricing[] = [];
    
    // Process Lenovo X86 Server Lots sheet
    const serverSheet = excelData.find(sheet => sheet.name === 'Lenovo X86 Server Lots');
    if (serverSheet) {
      const processed = this.processLenovoServerLots(serverSheet.data, basketInfo);
      models.push(...processed.models);
      configurations.push(...processed.configurations);
      pricing.push(...processed.pricing);
    }
    
    return { models, configurations, pricing };
  }
  
  /**
   * Process Dell Lot Pricing sheet
   */
  private processDellLotPricing(sheetData: any[][], basketInfo: HardwareBasket) {
    const models: HardwareModel[] = [];
    const configurations: HardwareConfiguration[] = [];
    const pricing: HardwarePricing[] = [];
    
    let currentLot: string | null = null;
    let currentModel: HardwareModel | null = null;
    let lotConfigurations: HardwareConfiguration[] = [];
    let lotPricing: HardwarePricing | null = null;
    
    // Skip header rows, start from data
    for (let i = 4; i < sheetData.length; i++) {
      const row = sheetData[i];
      if (!row || row.length < 3) continue;
      
      const [lotDesc, item, specification, listPrice, netPriceUSD, netPriceEUR, ...supportPrices] = row;
      
      // Check if this is a new lot
      if (lotDesc && lotDesc !== currentLot) {
        // Save previous lot if exists
        if (currentModel && lotConfigurations.length > 0) {
          currentModel.base_specifications = this.extractDellSpecifications(lotConfigurations);
          models.push(currentModel);
          configurations.push(...lotConfigurations);
          if (lotPricing) pricing.push(lotPricing);
        }
        
        // Start new lot
        currentLot = lotDesc;
        currentModel = this.createDellModel(lotDesc, basketInfo);
        lotConfigurations = [];
        lotPricing = this.createDellPricing(currentModel.id, listPrice, netPriceUSD, netPriceEUR, supportPrices);
      }
      
      // Add configuration item to current lot
      if (currentModel && item && specification) {
        const config: HardwareConfiguration = {
          id: `config_${currentModel.id}_${lotConfigurations.length}`,
          model_id: currentModel.id,
          part_number: undefined,
          sku: undefined,
          description: `${item}: ${specification}`,
          item_type: this.classifyDellItemType(item),
          quantity: 1,
          specifications: this.parseDellItemSpecification(item, specification),
          created_at: new Date()
        };
        
        lotConfigurations.push(config);
      }
    }
    
    // Don't forget the last lot
    if (currentModel && lotConfigurations.length > 0) {
      currentModel.base_specifications = this.extractDellSpecifications(lotConfigurations);
      models.push(currentModel);
      configurations.push(...lotConfigurations);
      if (lotPricing) pricing.push(lotPricing);
    }
    
    return { models, configurations, pricing };
  }
  
  /**
   * Process Lenovo Server Lots sheet
   */
  private processLenovoServerLots(sheetData: any[][], basketInfo: HardwareBasket) {
    const models: HardwareModel[] = [];
    const configurations: HardwareConfiguration[] = [];
    const pricing: HardwarePricing[] = [];
    
    let currentModel: HardwareModel | null = null;
    let modelConfigurations: HardwareConfiguration[] = [];
    let modelPricing: HardwarePricing | null = null;
    
    for (let i = 4; i < sheetData.length; i++) {
      const row = sheetData[i];
      if (!row || row.length < 3) continue;
      
      const [, partNumber, description, quantity, priceUSD, priceEUR] = row;
      
      // Check if this is a new model (no part number, but has description with price)
      if (!partNumber && description && priceUSD && description.includes('SMI')) {
        // Save previous model if exists
        if (currentModel && modelConfigurations.length > 0) {
          currentModel.base_specifications = this.extractLenovoSpecifications(modelConfigurations);
          models.push(currentModel);
          configurations.push(...modelConfigurations);
          if (modelPricing) pricing.push(modelPricing);
        }
        
        // Start new model
        currentModel = this.createLenovoModel(description, basketInfo);
        modelConfigurations = [];
        modelPricing = this.createLenovoPricing(currentModel.id, priceUSD, priceEUR);
      }
      
      // Add part to current model
      if (currentModel && partNumber && description) {
        const config: HardwareConfiguration = {
          id: `config_${currentModel.id}_${modelConfigurations.length}`,
          model_id: currentModel.id,
          part_number: partNumber,
          sku: partNumber,
          description: description,
          item_type: this.classifyLenovoItemType(description),
          quantity: quantity || 1,
          specifications: this.parseLenovoPartSpecification(partNumber, description),
          created_at: new Date()
        };
        
        modelConfigurations.push(config);
      }
    }
    
    // Don't forget the last model
    if (currentModel && modelConfigurations.length > 0) {
      currentModel.base_specifications = this.extractLenovoSpecifications(modelConfigurations);
      models.push(currentModel);
      configurations.push(...modelConfigurations);
      if (modelPricing) pricing.push(modelPricing);
    }
    
    return { models, configurations, pricing };
  }
  
  /**
   * Create Dell hardware model
   */
  private createDellModel(lotDescription: string, basketInfo: HardwareBasket): HardwareModel {
    const modelInfo = this.parseDellLotDescription(lotDescription);
    
    return {
      id: `dell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      basket_id: basketInfo.id,
      vendor_id: 'vendor_dell',
      lot_description: lotDescription,
      model_name: modelInfo.name,
      model_number: modelInfo.model,
      form_factor: modelInfo.formFactor,
      category: 'server',
      base_specifications: {}, // Will be populated later
      created_at: new Date(),
      updated_at: new Date()
    };
  }
  
  /**
   * Create Lenovo hardware model
   */
  private createLenovoModel(description: string, basketInfo: HardwareBasket): HardwareModel {
    const modelInfo = this.parseLenovoDescription(description);
    
    return {
      id: `lenovo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      basket_id: basketInfo.id,
      vendor_id: 'vendor_lenovo',
      lot_description: description,
      model_name: modelInfo.name,
      model_number: modelInfo.model,
      form_factor: modelInfo.formFactor,
      category: 'server',
      base_specifications: {}, // Will be populated later
      created_at: new Date(),
      updated_at: new Date()
    };
  }
  
  /**
   * Parse Dell lot description to extract model info
   */
  private parseDellLotDescription(description: string) {
    // Examples: "SMI1 - Intel  - 1 Proc - Small Rack Server"
    const parts = description.split(' - ');
    
    return {
      name: parts[0] || 'Unknown',
      processor: parts[1] || '',
      sockets: parts[2] || '',
      type: parts[3] || '',
      model: '', // Will be extracted from configuration items
      formFactor: description.toLowerCase().includes('rack') ? '1U' : undefined
    };
  }
  
  /**
   * Parse Lenovo description to extract model info
   */
  private parseLenovoDescription(description: string) {
    // Examples: "SMI1  : ThinkSystem SR630 V3 - 1yr Warranty"
    const match = description.match(/(\w+)\s*:\s*(.+?)\s*-\s*(.+)/);
    
    if (match) {
      return {
        name: match[1],
        model: match[2].includes('ThinkSystem') ? match[2] : '',
        warranty: match[3],
        formFactor: match[2].includes('1U') ? '1U' : match[2].includes('2U') ? '2U' : undefined
      };
    }
    
    return {
      name: description.split(':')[0] || 'Unknown',
      model: '',
      warranty: '',
      formFactor: undefined
    };
  }
  
  /**
   * Classify Dell item types
   */
  private classifyDellItemType(item: string): 'base_server' | 'processor' | 'memory' | 'storage' | 'network' | 'expansion' | 'service' | 'software' {
    const itemLower = item.toLowerCase();
    
    if (itemLower.includes('server')) return 'base_server';
    if (itemLower.includes('processor') || itemLower.includes('cpu')) return 'processor';
    if (itemLower.includes('ram') || itemLower.includes('memory')) return 'memory';
    if (itemLower.includes('hdd') || itemLower.includes('storage') || itemLower.includes('disk')) return 'storage';
    if (itemLower.includes('network') || itemLower.includes('nic')) return 'network';
    if (itemLower.includes('format') || itemLower.includes('model')) return 'base_server';
    if (itemLower.includes('slot')) return 'expansion';
    if (itemLower.includes('tpm') || itemLower.includes('fips')) return 'software';
    if (itemLower.includes('service') || itemLower.includes('warranty')) return 'service';
    
    return 'software'; // Default fallback
  }
  
  /**
   * Classify Lenovo item types
   */
  private classifyLenovoItemType(description: string): 'base_server' | 'processor' | 'memory' | 'storage' | 'network' | 'expansion' | 'service' | 'software' {
    const descLower = description.toLowerCase();
    
    if (descLower.includes('thinksystem') && descLower.includes('chassis')) return 'base_server';
    if (descLower.includes('processor') || descLower.includes('xeon') || descLower.includes('cpu')) return 'processor';
    if (descLower.includes('memory') || descLower.includes('dimm') || descLower.includes('ram')) return 'memory';
    if (descLower.includes('storage') || descLower.includes('raid') || descLower.includes('backplane')) return 'storage';
    if (descLower.includes('network') || descLower.includes('ethernet')) return 'network';
    if (descLower.includes('power') || descLower.includes('psu')) return 'expansion';
    if (descLower.includes('service') || descLower.includes('warranty')) return 'service';
    if (descLower.includes('operating mode') || descLower.includes('environment')) return 'software';
    
    return 'software'; // Default fallback
  }
  
  /**
   * Parse Dell item specifications
   */
  private parseDellItemSpecification(item: string, specification: string): any {
    const itemType = this.classifyDellItemType(item);
    
    switch (itemType) {
      case 'processor':
        return this.parseDellProcessorSpec(specification);
      case 'memory':
        return this.parseDellMemorySpec(specification);
      case 'storage':
        return this.parseDellStorageSpec(specification);
      default:
        return { raw: specification };
    }
  }
  
  /**
   * Parse Lenovo part specifications
   */
  private parseLenovoPartSpecification(partNumber: string, description: string): any {
    const itemType = this.classifyLenovoItemType(description);
    
    switch (itemType) {
      case 'processor':
        return this.parseLenovoProcessorSpec(description);
      case 'memory':
        return this.parseLenovoMemorySpec(description);
      case 'storage':
        return this.parseLenovoStorageSpec(description);
      default:
        return { part_number: partNumber, raw: description };
    }
  }
  
  /**
   * Parse Dell processor specifications
   */
  private parseDellProcessorSpec(spec: string) {
    // Example: "1 x 4309Y"
    const match = spec.match(/(\d+)\s*x\s*(.+)/);
    if (match) {
      return {
        count: parseInt(match[1]),
        model: match[2],
        type: 'processor'
      };
    }
    return { raw: spec, type: 'processor' };
  }
  
  /**
   * Parse Dell memory specifications
   */
  private parseDellMemorySpec(spec: string) {
    // Example: "32GB (2x 16GB)"
    const match = spec.match(/(\d+)GB\s*\((\d+)x\s*(\d+)GB\)/);
    if (match) {
      return {
        total_capacity: `${match[1]}GB`,
        module_count: parseInt(match[2]),
        module_capacity: `${match[3]}GB`,
        type: 'memory'
      };
    }
    return { raw: spec, type: 'memory' };
  }
  
  /**
   * Parse Dell storage specifications
   */
  private parseDellStorageSpec(spec: string) {
    // Example: "8 x 2"1/2"
    const match = spec.match(/(\d+)\s*x\s*(.+)/);
    if (match) {
      return {
        slot_count: parseInt(match[1]),
        slot_size: match[2],
        type: 'storage'
      };
    }
    return { raw: spec, type: 'storage' };
  }
  
  /**
   * Parse Lenovo processor specifications
   */
  private parseLenovoProcessorSpec(description: string) {
    // Example: "Intel Xeon Silver 4410T 10C 150W 2.7GHz Processor"
    const match = description.match(/Intel Xeon (\w+) (\w+) (\d+)C (\d+)W ([\d.]+)GHz/);
    if (match) {
      return {
        brand: 'Intel',
        series: `Xeon ${match[1]}`,
        model: match[2],
        cores: parseInt(match[3]),
        tdp: parseInt(match[4]),
        base_frequency: `${match[5]}GHz`,
        type: 'processor'
      };
    }
    return { raw: description, type: 'processor' };
  }
  
  /**
   * Parse Lenovo memory specifications
   */
  private parseLenovoMemorySpec(description: string) {
    // Example: "ThinkSystem 16GB TruDDR5 4800MHz (1Rx8) RDIMM"
    const match = description.match(/(\d+)GB TruDDR(\d+) (\d+)MHz.*?(RDIMM|UDIMM)/);
    if (match) {
      return {
        capacity: `${match[1]}GB`,
        type: `DDR${match[2]}`,
        speed: `${match[3]}MHz`,
        form_factor: match[4],
        type_category: 'memory'
      };
    }
    return { raw: description, type: 'memory' };
  }
  
  /**
   * Parse Lenovo storage specifications
   */
  private parseLenovoStorageSpec(description: string) {
    if (description.toLowerCase().includes('raid')) {
      const match = description.match(/RAID (\w+)/);
      return {
        type: 'raid_controller',
        model: match ? match[1] : 'unknown',
        raw: description
      };
    }
    
    if (description.toLowerCase().includes('backplane')) {
      const match = description.match(/(\d+)x([\d.]+)"/);
      return {
        type: 'backplane',
        slot_count: match ? parseInt(match[1]) : undefined,
        slot_size: match ? `${match[2]}"` : undefined,
        raw: description
      };
    }
    
    return { raw: description, type: 'storage' };
  }
  
  /**
   * Extract consolidated specifications from configurations
   */
  private extractDellSpecifications(configurations: HardwareConfiguration[]): HardwareSpecifications {
    const specs: HardwareSpecifications = {};
    
    configurations.forEach(config => {
      const spec = config.specifications;
      if (!spec) return;
      
      switch (config.item_type) {
        case 'processor':
          specs.processor = spec;
          break;
        case 'memory':
          specs.memory = spec;
          break;
        case 'storage':
          if (!specs.storage) specs.storage = { slots: [] };
          if (spec.slot_count) {
            specs.storage.slots.push({
              count: spec.slot_count,
              size: spec.slot_size,
              interface: 'SATA/SAS'
            });
          }
          break;
      }
    });
    
    return specs;
  }
  
  /**
   * Extract consolidated specifications from Lenovo configurations
   */
  private extractLenovoSpecifications(configurations: HardwareConfiguration[]): HardwareSpecifications {
    const specs: HardwareSpecifications = {};
    
    configurations.forEach(config => {
      const spec = config.specifications;
      if (!spec) return;
      
      switch (config.item_type) {
        case 'processor':
          specs.processor = {
            count: 1,
            model: spec.model || '',
            cores: spec.cores,
            base_frequency: spec.base_frequency,
            tdp: spec.tdp
          };
          break;
        case 'memory':
          if (!specs.memory) {
            specs.memory = {
              total_capacity: '',
              module_count: 0,
              module_capacity: '',
              type: ''
            };
          }
          
          if (spec.capacity) {
            const capacity = parseInt(spec.capacity);
            specs.memory.module_count += config.quantity;
            specs.memory.total_capacity = `${capacity * config.quantity}GB`;
            specs.memory.module_capacity = spec.capacity;
            specs.memory.type = spec.type;
          }
          break;
        case 'storage':
          if (!specs.storage) specs.storage = { slots: [] };
          
          if (spec.type === 'raid_controller') {
            specs.storage.raid_controller = spec.model;
          } else if (spec.slot_count) {
            specs.storage.slots.push({
              count: spec.slot_count,
              size: spec.slot_size,
              interface: 'SATA/SAS'
            });
          }
          break;
      }
    });
    
    return specs;
  }
  
  /**
   * Create Dell pricing information
   */
  private createDellPricing(modelId: string, listPrice: any, netPriceUSD: any, netPriceEUR: any, supportPrices: any[]): HardwarePricing {
    const supportOptions: SupportOption[] = [];
    
    // Extract support pricing (indices based on analysis)
    if (supportPrices.length >= 8) {
      supportOptions.push(
        {
          duration_years: 3,
          type: 'pro_support',
          price_usd: this.parseNumeric(supportPrices[4]) || 0,
          price_eur: this.parseNumeric(supportPrices[5]) || 0
        },
        {
          duration_years: 5,
          type: 'pro_support',
          price_usd: this.parseNumeric(supportPrices[6]) || 0,
          price_eur: this.parseNumeric(supportPrices[7]) || 0
        }
      );
    }
    
    return {
      id: `pricing_${modelId}`,
      model_id: modelId,
      list_price: this.parseNumeric(listPrice) || 0,
      net_price_usd: this.parseNumeric(netPriceUSD) || 0,
      net_price_eur: this.parseNumeric(netPriceEUR),
      currency: 'USD',
      valid_from: new Date(),
      support_options: supportOptions,
      created_at: new Date()
    };
  }
  
  /**
   * Create Lenovo pricing information
   */
  private createLenovoPricing(modelId: string, priceUSD: any, priceEUR: any): HardwarePricing {
    return {
      id: `pricing_${modelId}`,
      model_id: modelId,
      list_price: this.parseNumeric(priceUSD) || 0,
      net_price_usd: this.parseNumeric(priceUSD) || 0,
      net_price_eur: this.parseNumeric(priceEUR),
      currency: 'USD',
      valid_from: new Date(),
      support_options: [], // Lenovo support options in separate sheet
      created_at: new Date()
    };
  }
  
  /**
   * Parse numeric values safely
   */
  private parseNumeric(value: any): number | undefined {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[,$]/g, ''));
      return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  }
  
  /**
   * Get parsing errors and warnings
   */
  getErrors(): ImportError[] {
    return this.errors;
  }
  
  getWarnings(): ImportError[] {
    return this.warnings;
  }
  
  /**
   * Reset error state
   */
  reset(): void {
    this.errors = [];
    this.warnings = [];
  }
}

/**
 * Main export function for parsing hardware basket files
 */
export async function parseHardwareBasket(file: File): Promise<{
  vendor: string;
  quarter: string;
  year: number;
  models: HardwareModel[];
  configurations: HardwareConfiguration[];
  pricing: HardwarePricing[];
}> {
  // This is a simplified version - in practice, you'd read the Excel file
  // For now, return a mock structure based on filename
  const fileName = file.name.toLowerCase();
  
  let vendor = 'Unknown';
  let quarter = 'Q3';
  let year = 2025;
  
  if (fileName.includes('dell')) {
    vendor = 'Dell';
  } else if (fileName.includes('lenovo')) {
    vendor = 'Lenovo';
  }
  
  if (fileName.includes('q1')) quarter = 'Q1';
  else if (fileName.includes('q2')) quarter = 'Q2';
  else if (fileName.includes('q4')) quarter = 'Q4';
  
  return {
    vendor,
    quarter,
    year,
    models: [],
    configurations: [],
    pricing: []
  };
}

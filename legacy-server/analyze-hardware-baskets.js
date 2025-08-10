const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

/**
 * Hardware Basket Analyzer
 * Analyzes Dell and Lenovo hardware basket Excel files to understand structure
 */
class HardwareBasketAnalyzer {
    constructor() {
        this.results = {
            files: {},
            summary: {},
            recommendations: []
        };
    }

    /**
     * Analyze an Excel file thoroughly
     */
    async analyzeFile(filePath) {
        console.log(`\n🔍 Analyzing: ${path.basename(filePath)}`);
        
        if (!fs.existsSync(filePath)) {
            console.error(`❌ File not found: ${filePath}`);
            return null;
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        
        const analysis = {
            fileName: path.basename(filePath),
            filePath: filePath,
            worksheets: [],
            totalRows: 0,
            totalCols: 0,
            dataStructure: {},
            sampleData: {},
            columnMappings: {},
            hardwareModels: [],
            configurations: [],
            pricing: [],
            specifications: []
        };

        // Analyze each worksheet
        workbook.eachSheet((worksheet, sheetId) => {
            console.log(`\n📋 Sheet ${sheetId}: "${worksheet.name}"`);
            
            const sheetAnalysis = this.analyzeWorksheet(worksheet);
            analysis.worksheets.push(sheetAnalysis);
            analysis.totalRows += sheetAnalysis.rowCount;
            analysis.totalCols = Math.max(analysis.totalCols, sheetAnalysis.colCount);
        });

        this.results.files[path.basename(filePath)] = analysis;
        return analysis;
    }

    /**
     * Analyze individual worksheet
     */
    analyzeWorksheet(worksheet) {
        const analysis = {
            name: worksheet.name,
            rowCount: worksheet.rowCount,
            colCount: worksheet.columnCount,
            headers: [],
            sampleRows: [],
            columnTypes: {},
            dataPatterns: {},
            potentialKeys: []
        };

        // Get headers (assuming first row contains headers)
        if (worksheet.rowCount > 0) {
            const headerRow = worksheet.getRow(1);
            headerRow.eachCell((cell, colNumber) => {
                if (cell.value) {
                    analysis.headers.push({
                        column: colNumber,
                        header: cell.value.toString().trim(),
                        type: typeof cell.value
                    });
                }
            });
        }

        // Analyze first 10 data rows to understand structure
        const maxSampleRows = Math.min(11, worksheet.rowCount); // Skip header, take up to 10 data rows
        for (let rowNumber = 2; rowNumber <= maxSampleRows; rowNumber++) {
            const row = worksheet.getRow(rowNumber);
            const rowData = {};
            
            row.eachCell((cell, colNumber) => {
                const header = analysis.headers.find(h => h.column === colNumber);
                const headerName = header ? header.header : `Column_${colNumber}`;
                
                rowData[headerName] = {
                    value: cell.value,
                    type: typeof cell.value,
                    formula: cell.formula || null
                };

                // Track column data types
                if (!analysis.columnTypes[headerName]) {
                    analysis.columnTypes[headerName] = new Set();
                }
                analysis.columnTypes[headerName].add(typeof cell.value);
            });
            
            analysis.sampleRows.push(rowData);
        }

        // Convert sets to arrays for JSON serialization
        Object.keys(analysis.columnTypes).forEach(col => {
            analysis.columnTypes[col] = Array.from(analysis.columnTypes[col]);
        });

        // Identify potential key columns (model numbers, part numbers, etc.)
        this.identifyKeyColumns(analysis);

        return analysis;
    }

    /**
     * Identify columns that might contain key information
     */
    identifyKeyColumns(sheetAnalysis) {
        const keyPatterns = [
            /model/i,
            /part.*number/i,
            /sku/i,
            /product/i,
            /server/i,
            /configuration/i,
            /spec/i,
            /price/i,
            /cost/i,
            /memory/i,
            /storage/i,
            /processor/i,
            /cpu/i,
            /ram/i,
            /disk/i,
            /network/i
        ];

        sheetAnalysis.headers.forEach(header => {
            const headerLower = header.header.toLowerCase();
            keyPatterns.forEach(pattern => {
                if (pattern.test(headerLower)) {
                    sheetAnalysis.potentialKeys.push({
                        column: header.column,
                        header: header.header,
                        pattern: pattern.source,
                        confidence: 'high'
                    });
                }
            });
        });
    }

    /**
     * Generate comprehensive analysis report
     */
    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('🔍 HARDWARE BASKET ANALYSIS REPORT');
        console.log('='.repeat(80));

        Object.entries(this.results.files).forEach(([fileName, analysis]) => {
            console.log(`\n📁 FILE: ${fileName}`);
            console.log(`   Path: ${analysis.filePath}`);
            console.log(`   Worksheets: ${analysis.worksheets.length}`);
            console.log(`   Total Rows: ${analysis.totalRows}`);
            console.log(`   Max Columns: ${analysis.totalCols}`);

            analysis.worksheets.forEach((sheet, index) => {
                console.log(`\n   📋 Sheet ${index + 1}: "${sheet.name}"`);
                console.log(`      Rows: ${sheet.rowCount}, Columns: ${sheet.colCount}`);
                
                if (sheet.headers.length > 0) {
                    console.log(`      Headers (${sheet.headers.length}):`);
                    sheet.headers.forEach(header => {
                        console.log(`        - ${header.header} (Column ${header.column})`);
                    });
                }

                if (sheet.potentialKeys.length > 0) {
                    console.log(`      🔑 Key Columns Identified:`);
                    sheet.potentialKeys.forEach(key => {
                        console.log(`        - ${key.header} (${key.pattern})`);
                    });
                }

                if (sheet.sampleRows.length > 0) {
                    console.log(`      📊 Sample Data (first 3 rows):`);
                    sheet.sampleRows.slice(0, 3).forEach((row, rowIndex) => {
                        console.log(`        Row ${rowIndex + 2}:`);
                        Object.entries(row).slice(0, 5).forEach(([col, data]) => {
                            const value = data.value ? data.value.toString().substring(0, 50) : 'null';
                            console.log(`          ${col}: ${value}`);
                        });
                        if (Object.keys(row).length > 5) {
                            console.log(`          ... and ${Object.keys(row).length - 5} more columns`);
                        }
                    });
                }
            });
        });

        // Generate database schema recommendations
        this.generateSchemaRecommendations();
    }

    /**
     * Generate SurrealDB schema recommendations
     */
    generateSchemaRecommendations() {
        console.log('\n' + '='.repeat(80));
        console.log('💾 SURREALDB SCHEMA RECOMMENDATIONS');
        console.log('='.repeat(80));

        const allHeaders = new Set();
        const vendors = new Set();
        
        Object.entries(this.results.files).forEach(([fileName, analysis]) => {
            // Extract vendor from filename
            if (fileName.toLowerCase().includes('dell')) vendors.add('Dell');
            if (fileName.toLowerCase().includes('lenovo')) vendors.add('Lenovo');
            
            analysis.worksheets.forEach(sheet => {
                sheet.headers.forEach(header => {
                    allHeaders.add(header.header);
                });
            });
        });

        console.log('\n🏢 Detected Vendors:', Array.from(vendors).join(', '));
        console.log('\n📋 All Column Headers Found:');
        Array.from(allHeaders).sort().forEach(header => {
            console.log(`  - ${header}`);
        });

        console.log('\n🗄️  Recommended SurrealDB Tables:');
        
        const schema = {
            hardware_vendors: {
                description: 'Vendor information (Dell, Lenovo, etc.)',
                fields: ['id', 'name', 'contact_info', 'support_info']
            },
            hardware_models: {
                description: 'Base server/hardware models',
                fields: ['id', 'vendor_id', 'model_name', 'model_number', 'category', 'base_specs']
            },
            hardware_configurations: {
                description: 'Specific configurations for each model',
                fields: ['id', 'model_id', 'config_name', 'part_number', 'sku', 'specifications']
            },
            hardware_components: {
                description: 'Individual components (CPU, RAM, Storage, etc.)',
                fields: ['id', 'type', 'manufacturer', 'model', 'specifications', 'compatibility']
            },
            hardware_pricing: {
                description: 'Pricing information for configurations',
                fields: ['id', 'config_id', 'list_price', 'discount_price', 'currency', 'valid_from', 'valid_to']
            },
            hardware_baskets: {
                description: 'Hardware basket imports',
                fields: ['id', 'name', 'vendor', 'quarter', 'year', 'import_date', 'file_path']
            }
        };

        Object.entries(schema).forEach(([tableName, tableInfo]) => {
            console.log(`\n  📋 ${tableName}:`);
            console.log(`     ${tableInfo.description}`);
            console.log(`     Fields: ${tableInfo.fields.join(', ')}`);
        });

        this.results.recommendations = schema;
    }

    /**
     * Save analysis to JSON file
     */
    async saveAnalysis(outputPath = './hardware-basket-analysis.json') {
        const output = {
            analysisDate: new Date().toISOString(),
            summary: {
                filesAnalyzed: Object.keys(this.results.files).length,
                totalWorksheets: Object.values(this.results.files).reduce((sum, file) => sum + file.worksheets.length, 0),
                vendors: this.extractVendors(),
                recommendedTables: Object.keys(this.results.recommendations)
            },
            files: this.results.files,
            schemaRecommendations: this.results.recommendations
        };

        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        console.log(`\n💾 Analysis saved to: ${outputPath}`);
        return outputPath;
    }

    extractVendors() {
        const vendors = [];
        Object.keys(this.results.files).forEach(fileName => {
            if (fileName.toLowerCase().includes('dell')) vendors.push('Dell');
            if (fileName.toLowerCase().includes('lenovo')) vendors.push('Lenovo');
        });
        return [...new Set(vendors)];
    }
}

/**
 * Main analysis function
 */
async function analyzeHardwareBaskets() {
    const analyzer = new HardwareBasketAnalyzer();
    
    const files = [
        '/Users/mateimarcu/Documents/Atos/X86 Basket Q3 2025 v2 Dell Only.xlsx',
        '/Users/mateimarcu/Documents/Atos/X86 Basket Q3 2025 v2 Lenovo Only.xlsx'
    ];

    console.log('🚀 Starting Hardware Basket Analysis...');
    console.log(`📁 Analyzing ${files.length} files:`);
    files.forEach(file => console.log(`   - ${path.basename(file)}`));

    try {
        // Analyze each file
        for (const file of files) {
            await analyzer.analyzeFile(file);
        }

        // Generate comprehensive report
        analyzer.generateReport();

        // Save analysis
        const outputPath = path.join(__dirname, 'hardware-basket-analysis.json');
        await analyzer.saveAnalysis(outputPath);

        console.log('\n✅ Analysis Complete!');
        console.log('\n📋 Next Steps:');
        console.log('   1. Review the analysis output above');
        console.log('   2. Check the saved JSON file for detailed structure');
        console.log('   3. Design TypeScript interfaces based on the schema');
        console.log('   4. Implement SurrealDB tables and import logic');

    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
        console.error(error.stack);
    }
}

// Run the analysis
if (require.main === module) {
    analyzeHardwareBaskets();
}

module.exports = { HardwareBasketAnalyzer };

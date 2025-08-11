const ExcelJS = require('exceljs');
const fs = require('fs');

async function analyzeLotPricing() {
    console.log('🔍 Analyzing Dell Lot Pricing sheet...');
    
    const filePath = '/Users/mateimarcu/Documents/Atos/X86 Basket Q3 2025 v2 Dell Only.xlsx';
    
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        
        // Find the Dell Lot Pricing sheet
        const dataWorksheet = workbook.getWorksheet('Dell Lot Pricing');
        if (!dataWorksheet) {
            console.error('❌ Dell Lot Pricing sheet not found');
            return;
        }
        
        console.log(`📊 Dell Lot Pricing sheet: ${dataWorksheet.rowCount} rows, ${dataWorksheet.columnCount} cols`);
        
        // Find headers row (usually row 1 or 2)
        let headerRowNumber = 1;
        let headers = [];
        
        for (let rowNum = 1; rowNum <= 5; rowNum++) {
            const row = dataWorksheet.getRow(rowNum);
            const potentialHeaders = [];
            
            row.eachCell((cell, colNumber) => {
                if (cell.value) {
                    potentialHeaders[colNumber] = cell.value.toString().trim();
                }
            });
            
            console.log(`Row ${rowNum} headers:`, potentialHeaders.filter(h => h).slice(0, 10));
            
            // Check if this looks like a header row
            const headerLikeWords = ['lot', 'item', 'specification', 'price', 'description'];
            const matchCount = potentialHeaders.filter(h => h && 
                headerLikeWords.some(word => h.toLowerCase().includes(word))
            ).length;
            
            if (matchCount >= 2) {
                headerRowNumber = rowNum;
                headers = potentialHeaders;
                console.log(`✅ Found header row at row ${rowNum} with ${matchCount} matching columns`);
                break;
            }
        }
        
        console.log(`\n📋 Final headers (row ${headerRowNumber}):`);
        headers.forEach((header, index) => {
            if (header) {
                console.log(`   ${index}: "${header}"`);
            }
        });
        
        // Analyze first few data rows
        console.log(`\n📄 Sample data rows:`);
        for (let rowNum = headerRowNumber + 1; rowNum <= Math.min(headerRowNumber + 5, dataWorksheet.rowCount); rowNum++) {
            const row = dataWorksheet.getRow(rowNum);
            const rowData = {};
            
            row.eachCell((cell, colNumber) => {
                if (headers[colNumber]) {
                    rowData[headers[colNumber]] = cell.value ? cell.value.toString().trim() : '';
                }
            });
            
            console.log(`\nRow ${rowNum}:`);
            Object.entries(rowData).forEach(([key, value]) => {
                if (value && value.length > 0) {
                    console.log(`   ${key}: "${value}"`);
                }
            });
        }
        
        // Look for key columns
        console.log(`\n🔍 Key column analysis:`);
        const keyColumns = {
            'Lot Description': headers.findIndex(h => h && h.toLowerCase().includes('lot')),
            'Item': headers.findIndex(h => h && h.toLowerCase().includes('item')),
            'Specification': headers.findIndex(h => h && h.toLowerCase().includes('spec')),
            'Price': headers.findIndex(h => h && h.toLowerCase().includes('price'))
        };
        
        Object.entries(keyColumns).forEach(([name, index]) => {
            if (index > 0) {
                console.log(`   ${name}: Column ${index} ("${headers[index]}")`);
            } else {
                console.log(`   ${name}: NOT FOUND`);
            }
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

analyzeLotPricing().then(() => {
    console.log('\n✅ Analysis completed');
}).catch(error => {
    console.error('❌ Analysis failed:', error);
});

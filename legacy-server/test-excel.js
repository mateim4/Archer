const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function testExcelAnalysis() {
    console.log('🚀 Testing Excel Analysis...');
    
    const filePath = '/Users/mateimarcu/Documents/Atos/X86 Basket Q3 2025 v2 Dell Only.xlsx';
    
    if (!fs.existsSync(filePath)) {
        console.error('❌ File not found:', filePath);
        return;
    }
    
    console.log('✅ File exists:', path.basename(filePath));
    
    try {
        const workbook = new ExcelJS.Workbook();
        console.log('📖 Reading Excel file...');
        
        await workbook.xlsx.readFile(filePath);
        console.log('✅ Excel file loaded successfully');
        
        console.log(`📋 Found ${workbook.worksheets.length} worksheets:`);
        
        workbook.eachSheet((worksheet, sheetId) => {
            console.log(`   Sheet ${sheetId}: "${worksheet.name}" (${worksheet.rowCount} rows, ${worksheet.columnCount} cols)`);
            
            // Show first row (headers)
            if (worksheet.rowCount > 0) {
                const headerRow = worksheet.getRow(1);
                const headers = [];
                headerRow.eachCell((cell, colNumber) => {
                    if (cell.value) {
                        headers.push(`${colNumber}: ${cell.value}`);
                    }
                });
                console.log(`     Headers: ${headers.slice(0, 5).join(', ')}${headers.length > 5 ? '...' : ''}`);
            }
        });
        
    } catch (error) {
        console.error('❌ Error reading Excel file:', error.message);
    }
}

testExcelAnalysis().then(() => {
    console.log('✅ Test completed');
}).catch(error => {
    console.error('❌ Test failed:', error);
});

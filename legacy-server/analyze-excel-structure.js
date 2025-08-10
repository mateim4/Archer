const ExcelJS = require('exceljs');
const path = require('path');

async function analyzeExcelFile() {
  const filePath = '/Users/mateimarcu/Documents/Atos/X86 Basket Q3 2025 v2 Dell Only.xlsx';
  
  try {
    console.log('Starting Excel file analysis...');
    console.log('File path:', filePath);
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    console.log('=== EXCEL FILE ANALYSIS ===');
    console.log(`Total worksheets: ${workbook.worksheets.length}`);
    
    workbook.worksheets.forEach((worksheet, index) => {
      console.log(`\n--- Worksheet ${index + 1}: "${worksheet.name}" ---`);
      console.log(`Row count: ${worksheet.rowCount}`);
      console.log(`Column count: ${worksheet.columnCount}`);
      
      // Show first 10 rows to understand structure
      console.log('\nFirst 10 rows:');
      for (let rowNumber = 1; rowNumber <= Math.min(10, worksheet.rowCount); rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const values = [];
        row.eachCell((cell, colNumber) => {
          if (colNumber <= 10) { // Show first 10 columns
            const value = cell.value ? cell.value.toString() : '';
            values.push(value.substring(0, 50)); // Truncate long values
          }
        });
        console.log(`Row ${rowNumber}: [${values.join(' | ')}]`);
      }
      
      // Check for potential header rows
      console.log('\nAnalyzing header patterns...');
      for (let rowNumber = 1; rowNumber <= Math.min(20, worksheet.rowCount); rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const values = [];
        row.eachCell((cell, colNumber) => {
          if (cell.value) {
            const value = cell.value.toString().toLowerCase();
            if (value.includes('model') || value.includes('part') || value.includes('sku') || 
                value.includes('price') || value.includes('description') || value.includes('cpu') ||
                value.includes('memory') || value.includes('storage') || value.includes('form factor')) {
              values.push(cell.value.toString());
            }
          }
        });
        if (values.length > 0) {
          console.log(`Potential header row ${rowNumber}: [${values.join(' | ')}]`);
        }
      }
    });
    
    console.log('\nAnalysis complete!');
    
  } catch (error) {
    console.error('Error analyzing Excel file:', error);
    console.error('Stack trace:', error.stack);
  }
}

analyzeExcelFile().catch(console.error);

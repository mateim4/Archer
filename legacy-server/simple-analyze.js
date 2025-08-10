#!/usr/bin/env node

const ExcelJS = require('exceljs');
const fs = require('fs');

async function analyzeFile(filePath) {
    console.log(`\n🔍 Analyzing: ${filePath}`);
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    workbook.eachSheet((worksheet, sheetId) => {
        console.log(`\n📋 Sheet ${sheetId}: "${worksheet.name}"`);
        console.log(`   Dimensions: ${worksheet.rowCount} rows × ${worksheet.columnCount} columns`);
        
        // Get headers from first row
        if (worksheet.rowCount > 0) {
            const firstRow = worksheet.getRow(1);
            console.log(`   Headers:`);
            firstRow.eachCell((cell, colNumber) => {
                if (cell.value) {
                    console.log(`     Col ${colNumber}: ${cell.value}`);
                }
            });
            
            // Show a few sample data rows
            if (worksheet.rowCount > 1) {
                console.log(`   Sample data (rows 2-4):`);
                for (let rowNum = 2; rowNum <= Math.min(4, worksheet.rowCount); rowNum++) {
                    const row = worksheet.getRow(rowNum);
                    const rowData = [];
                    row.eachCell((cell, colNumber) => {
                        if (cell.value && colNumber <= 5) { // Show first 5 columns
                            rowData.push(`${cell.value}`);
                        }
                    });
                    console.log(`     Row ${rowNum}: ${rowData.join(' | ')}`);
                }
            }
        }
    });
}

async function main() {
    console.log('🚀 Hardware Basket Analysis Starting...');
    
    const files = [
        '/Users/mateimarcu/Documents/Atos/X86 Basket Q3 2025 v2 Dell Only.xlsx',
        '/Users/mateimarcu/Documents/Atos/X86 Basket Q3 2025 v2 Lenovo Only.xlsx'
    ];
    
    for (const file of files) {
        try {
            await analyzeFile(file);
        } catch (error) {
            console.error(`❌ Error analyzing ${file}:`, error.message);
        }
    }
    
    console.log('\n✅ Analysis completed!');
}

main().catch(console.error);

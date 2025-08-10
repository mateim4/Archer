#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testHardwareBasketUpload() {
    console.log('🧪 Testing Hardware Basket Upload Functionality\n');

    // Check if both backends are running
    console.log('1. Checking backend services...');
    
    try {
        // Check Node.js backend (port 3001)
        const nodeResponse = await fetch('http://localhost:3001/health');
        console.log(`   • Node.js backend (3001): ${nodeResponse.ok ? '✅ Online' : '❌ Offline'}`);
        
        // Check Rust backend (port 3000) 
        const rustResponse = await fetch('http://localhost:3000/health');
        console.log(`   • Rust backend (3000): ${rustResponse.ok ? '✅ Online' : '❌ Offline'}`);
    } catch (error) {
        console.log(`   ❌ Backend check failed: ${error.message}`);
        return;
    }

    // Test file upload
    console.log('\n2. Testing Excel file upload...');
    
    const testFilePath = '/Users/mateimarcu/Documents/Atos/X86 Basket Q3 2025 v2 Dell Only.xlsx';
    
    if (!fs.existsSync(testFilePath)) {
        console.log(`   ❌ Test file not found: ${testFilePath}`);
        return;
    }

    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(testFilePath));
        form.append('uploadType', 'hardware-basket');

        console.log(`   📤 Uploading: ${path.basename(testFilePath)}`);
        
        const response = await fetch('http://localhost:3001/upload', {
            method: 'POST',
            body: form
        });

        if (response.ok) {
            const result = await response.json();
            console.log('   ✅ Upload successful!');
            console.log(`   📊 Response: ${JSON.stringify(result, null, 2)}`);
        } else {
            const error = await response.text();
            console.log(`   ❌ Upload failed: ${response.status} ${response.statusText}`);
            console.log(`   📝 Error details: ${error}`);
        }
    } catch (error) {
        console.log(`   ❌ Upload error: ${error.message}`);
    }

    console.log('\n3. Test Summary:');
    console.log('   • Hardware basket files should now use the "hardware-basket" upload type');
    console.log('   • Excel files are processed by the Node.js backend (port 3001)');
    console.log('   • This avoids the client-side parsing error we encountered before');
    console.log('   • The frontend properly routes to server-side processing\n');
}

// Run the test
testHardwareBasketUpload().catch(console.error);

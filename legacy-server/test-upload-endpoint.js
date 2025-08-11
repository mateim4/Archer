const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function testUpload() {
    console.log('🧪 Testing hardware basket upload...');
    
    const filePath = '/Users/mateimarcu/Documents/Atos/X86 Basket Q3 2025 v2 Dell Only.xlsx';
    
    if (!fs.existsSync(filePath)) {
        console.error('❌ Test file not found:', filePath);
        return;
    }
    
    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        
        console.log('📤 Uploading file to server...');
        
        const response = await axios.post('http://localhost:3001/api/hardware-baskets/upload', form, {
            headers: {
                ...form.getHeaders(),
            },
            timeout: 30000 // 30 seconds
        });
        
        console.log('✅ Upload successful!');
        console.log('📊 Response summary:');
        console.log(`   Status: ${response.status}`);
        console.log(`   Success: ${response.data.success}`);
        console.log(`   Basket ID: ${response.data.basket_id}`);
        console.log(`   Total Models: ${response.data.total_models || 0}`);
        console.log(`   Total Configurations: ${response.data.total_configurations || 0}`);
        console.log(`   Message: ${response.data.message}`);
        
        if (response.data.total_models > 0) {
            console.log('\n✅ Hardware basket upload completed successfully!');
            console.log(`   📦 ${response.data.total_models} hardware models processed`);
            console.log(`   ⚙️ ${response.data.total_configurations} total configurations extracted`);
        } else {
            console.log('\n❌ No models were processed from the upload');
        }
        
        if (response.data.models && response.data.models.length > 1) {
            console.log('\n📋 All models summary:');
            response.data.models.forEach((model, index) => {
                console.log(`   ${index + 1}. ${model.model_name || model.name} (${model.full_configurations?.length || 0} configs)`);
            });
        }
        
    } catch (error) {
        console.error('❌ Upload failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testUpload().catch(console.error);

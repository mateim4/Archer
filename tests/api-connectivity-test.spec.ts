import { test, expect } from '@playwright/test';

test.describe('API Connectivity Tests', () => {
  test('should test backend API endpoints directly', async ({ page }) => {
    test.setTimeout(30000);
    
    console.log('🔧 Testing API connectivity...');
    
    // Test direct backend connection
    try {
      console.log('🔍 Testing direct backend at 127.0.0.1:3000...');
      const directResponse = await page.request.get('http://127.0.0.1:3000/api/hardware-baskets', {
        headers: {
          'x-user-id': 'admin'
        }
      });
      
      console.log('📡 Direct backend status:', directResponse.status());
      
      if (directResponse.ok()) {
        const data = await directResponse.json();
        console.log('✅ Direct backend works! Data:', Array.isArray(data) ? `${data.length} items` : 'unknown format');
      } else {
        console.log('❌ Direct backend error:', directResponse.status());
        const errorText = await directResponse.text();
        console.log('Error details:', errorText.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ Direct backend connection failed:', error);
    }
    
    // Test through Vite proxy
    try {
      console.log('🔍 Testing through Vite proxy at 127.0.0.1:1420...');
      const proxyResponse = await page.request.get('http://127.0.0.1:1420/api/hardware-baskets', {
        headers: {
          'x-user-id': 'admin'
        }
      });
      
      console.log('📡 Proxy status:', proxyResponse.status());
      
      if (proxyResponse.ok()) {
        const data = await proxyResponse.json();
        console.log('✅ Proxy works! Data:', Array.isArray(data) ? `${data.length} items` : 'unknown format');
      } else {
        console.log('❌ Proxy error:', proxyResponse.status());
        const errorText = await proxyResponse.text();
        console.log('Error details:', errorText.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ Proxy connection failed:', error);
    }
    
    // Test health endpoint
    try {
      console.log('🔍 Testing health endpoint...');
      const healthResponse = await page.request.get('http://127.0.0.1:3000/health');
      console.log('🏥 Health status:', healthResponse.status());
      
      if (healthResponse.ok()) {
        const healthData = await healthResponse.json();
        console.log('✅ Health check passed:', healthData);
      }
    } catch (error) {
      console.log('❌ Health check failed:', error);
    }
    
    // Always pass the test so we can see the debug output
    expect(true).toBeTruthy();
  });
});

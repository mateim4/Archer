// Hardware Pool UX Analysis and Testing Script
// This script can be run in the browser console to test Hardware Pool functionality

(function hardwarePoolUXAnalysis() {
  console.log('🔍 Starting Hardware Pool UX Analysis...');
  
  // Test 1: Check if Hardware Pool navigation exists
  function checkHardwarePoolNavigation() {
    console.log('\n📋 Test 1: Hardware Pool Navigation');
    const navItems = document.querySelectorAll('button');
    const hardwarePoolNav = Array.from(navItems).find(btn => 
      btn.textContent?.includes('Hardware Pool')
    );
    
    if (hardwarePoolNav) {
      console.log('✅ Hardware Pool navigation item found');
      console.log('📍 Element:', hardwarePoolNav);
      return hardwarePoolNav;
    } else {
      console.log('❌ Hardware Pool navigation item NOT found');
      console.log('🔍 Available navigation items:');
      navItems.forEach(btn => {
        if (btn.textContent?.trim()) {
          console.log(`  - ${btn.textContent.trim()}`);
        }
      });
      return null;
    }
  }
  
  // Test 2: Navigate to Hardware Pool and check view
  function navigateToHardwarePool(navButton) {
    console.log('\n📋 Test 2: Hardware Pool Navigation');
    if (!navButton) {
      console.log('❌ Cannot navigate - no navigation button found');
      return false;
    }
    
    console.log('🔄 Clicking Hardware Pool navigation...');
    navButton.click();
    
    // Wait a bit for navigation
    setTimeout(() => {
      const hardwarePoolHeader = document.querySelector('h1');
      if (hardwarePoolHeader?.textContent?.includes('Hardware Pool')) {
        console.log('✅ Successfully navigated to Hardware Pool view');
        console.log('📍 Header:', hardwarePoolHeader.textContent);
        return true;
      } else {
        console.log('❌ Hardware Pool view not loaded');
        console.log('🔍 Current page header:', hardwarePoolHeader?.textContent || 'No header found');
        return false;
      }
    }, 1000);
  }
  
  // Test 3: Check for color scheme consistency
  function checkColorScheme() {
    console.log('\n📋 Test 3: Color Scheme Analysis');
    const elements = document.querySelectorAll('*');
    const pinkElements = [];
    
    elements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const bgColor = styles.backgroundColor;
      const color = styles.color;
      const borderColor = styles.borderColor;
      
      // Check for pink colors (#ec4899 or rgb(236, 72, 153))
      if (bgColor.includes('rgb(236, 72, 153)') || 
          color.includes('rgb(236, 72, 153)') || 
          borderColor.includes('rgb(236, 72, 153)') ||
          bgColor.includes('#ec4899') || 
          color.includes('#ec4899') || 
          borderColor.includes('#ec4899')) {
        pinkElements.push({
          element: element,
          tag: element.tagName,
          className: element.className,
          backgroundColor: bgColor,
          color: color,
          borderColor: borderColor
        });
      }
    });
    
    if (pinkElements.length === 0) {
      console.log('✅ No pink colors found - color scheme is consistent');
    } else {
      console.log(`❌ Found ${pinkElements.length} elements with pink colors:`);
      pinkElements.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.tag}.${item.className}`);
        console.log(`     Background: ${item.backgroundColor}`);
        console.log(`     Color: ${item.color}`);
        console.log(`     Border: ${item.borderColor}`);
        console.log('     Element:', item.element);
      });
    }
    
    return pinkElements.length === 0;
  }
  
  // Test 4: Check page responsiveness
  function checkResponsiveness() {
    console.log('\n📋 Test 4: Responsiveness Check');
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    console.log(`📐 Current viewport: ${viewport.width}x${viewport.height}`);
    
    // Check for mobile-friendly viewport
    if (viewport.width < 768) {
      console.log('📱 Mobile viewport detected');
    } else if (viewport.width < 1024) {
      console.log('📱 Tablet viewport detected');
    } else {
      console.log('🖥️ Desktop viewport detected');
    }
    
    // Check for responsive layout
    const mainContent = document.querySelector('.app-main-content');
    if (mainContent) {
      const styles = window.getComputedStyle(mainContent);
      console.log('📱 Main content responsive styles:');
      console.log(`   Width: ${styles.width}`);
      console.log(`   Max-width: ${styles.maxWidth}`);
      console.log(`   Padding: ${styles.padding}`);
    }
  }
  
  // Test 5: Performance measurement
  function measurePerformance() {
    console.log('\n📋 Test 5: Performance Analysis');
    
    // Check page load performance
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      console.log('⚡ Page Load Performance:');
      console.log(`   DOM Content Loaded: ${navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart}ms`);
      console.log(`   Load Complete: ${navigation.loadEventEnd - navigation.loadEventStart}ms`);
      console.log(`   Total Load Time: ${navigation.loadEventEnd - navigation.fetchStart}ms`);
    }
    
    // Check React render performance
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach(entry => {
      console.log(`   ${entry.name}: ${entry.startTime}ms`);
    });
  }
  
  // Run all tests
  const hardwarePoolNav = checkHardwarePoolNavigation();
  
  if (hardwarePoolNav) {
    navigateToHardwarePool(hardwarePoolNav);
    
    // Wait for navigation and then run other tests
    setTimeout(() => {
      checkColorScheme();
      checkResponsiveness();
      measurePerformance();
      
      console.log('\n🎯 Hardware Pool UX Analysis Complete!');
      console.log('💡 Check the console output above for detailed results.');
    }, 2000);
  } else {
    console.log('\n❌ Cannot proceed with full analysis - Hardware Pool navigation not found');
    checkColorScheme();
    checkResponsiveness();
    measurePerformance();
  }
})();

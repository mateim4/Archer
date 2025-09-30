// Direct browser analysis of current visualizer state
console.log('🔍 CAPACITY VISUALIZER ANALYSIS');
console.log('================================');

// Check if we're on the right page
const currentURL = window.location.href;
console.log('Current URL:', currentURL);

// Look for capacity visualizer elements
const visualizerTab = document.querySelector('[role="tab"]:has-text("Capacity Visualizer"), button:contains("Capacity Visualizer"), *[data-testid*="capacity"]');
console.log('Visualizer tab found:', !!visualizerTab);

// Look for SVG elements
const svgs = document.querySelectorAll('svg');
console.log('Total SVG elements:', svgs.length);

// Analyze each SVG
svgs.forEach((svg, index) => {
  const bbox = svg.getBoundingClientRect();
  if (bbox.width > 50 && bbox.height > 50) {
    console.log(`\nSVG ${index}:`, { 
      width: Math.round(bbox.width), 
      height: Math.round(bbox.height),
      x: Math.round(bbox.x),
      y: Math.round(bbox.y),
      visible: bbox.width > 0 && bbox.height > 0
    });
    
    // Check for specific elements
    const clusters = svg.querySelectorAll('rect[fill="#36404a"]');
    const hosts = svg.querySelectorAll('rect[fill*="rgba(139, 92, 246, 0.3)"]');
    const vms = svg.querySelectorAll('rect[fill*="rgba(99, 102, 241, 0.6)"]');
    const hostTexts = svg.querySelectorAll('text.host-name-text');
    const vmTexts = svg.querySelectorAll('text.vm-text');
    const percentTexts = svg.querySelectorAll('text.cluster-percentage-text');
    const icons = svg.querySelectorAll('foreignObject');
    
    console.log('  Elements:', {
      clusters: clusters.length,
      hosts: hosts.length, 
      vms: vms.length,
      hostTexts: hostTexts.length,
      vmTexts: vmTexts.length,
      percentTexts: percentTexts.length,
      icons: icons.length
    });
    
    // Analyze host rectangles specifically
    hosts.forEach((host, i) => {
      const hostBbox = host.getBoundingClientRect();
      const parentSVG = host.closest('svg');
      const svgBbox = parentSVG.getBoundingClientRect();
      const widthPercentage = Math.round((hostBbox.width / svgBbox.width) * 100);
      
      console.log(`    Host ${i}:`, {
        width: Math.round(hostBbox.width),
        svgWidth: Math.round(svgBbox.width),
        widthPercentage: widthPercentage + '%',
        spansFullWidth: widthPercentage > 95
      });
    });
    
    // Analyze text visibility
    hostTexts.forEach((text, i) => {
      const style = window.getComputedStyle(text);
      const textBbox = text.getBoundingClientRect();
      console.log(`    Host text ${i}:`, {
        opacity: style.opacity,
        display: style.display,
        visibility: style.visibility,
        content: text.textContent?.slice(0, 20),
        width: Math.round(textBbox.width),
        visible: style.opacity !== '0' && style.display !== 'none'
      });
    });
    
    vmTexts.forEach((text, i) => {
      const style = window.getComputedStyle(text);
      const textBbox = text.getBoundingClientRect();
      console.log(`    VM text ${i}:`, {
        opacity: style.opacity,
        content: text.textContent?.slice(0, 20),
        transform: text.getAttribute('transform'),
        visible: style.opacity !== '0' && style.display !== 'none'
      });
    });
  }
});

// Check for any console errors
console.log('\n🚨 PROBLEMS IDENTIFIED:');

// Problem 1: Host width
const hostProblems = [];
svgs.forEach((svg, svgIndex) => {
  const hosts = svg.querySelectorAll('rect[fill*="rgba(139, 92, 246, 0.3)"]');
  hosts.forEach((host, hostIndex) => {
    const hostBbox = host.getBoundingClientRect();
    const svgBbox = svg.getBoundingClientRect();
    const widthPercentage = (hostBbox.width / svgBbox.width) * 100;
    
    if (widthPercentage < 95) {
      hostProblems.push(`SVG ${svgIndex} Host ${hostIndex}: Only spans ${Math.round(widthPercentage)}% of cluster width`);
    }
  });
});

if (hostProblems.length > 0) {
  console.log('❌ HOST WIDTH PROBLEMS:');
  hostProblems.forEach(problem => console.log('  -', problem));
}

// Problem 2: Host text visibility  
const hostTextProblems = [];
svgs.forEach((svg, svgIndex) => {
  const hostTexts = svg.querySelectorAll('text.host-name-text');
  hostTexts.forEach((text, textIndex) => {
    const style = window.getComputedStyle(text);
    const isVisible = style.opacity !== '0' && style.display !== 'none' && style.visibility !== 'hidden';
    const hasContent = text.textContent && text.textContent.trim().length > 0;
    
    if (!isVisible) {
      hostTextProblems.push(`SVG ${svgIndex} Host text ${textIndex}: Hidden (opacity: ${style.opacity})`);
    } else if (!hasContent) {
      hostTextProblems.push(`SVG ${svgIndex} Host text ${textIndex}: No content`);
    }
  });
});

if (hostTextProblems.length > 0) {
  console.log('❌ HOST TEXT PROBLEMS:');
  hostTextProblems.forEach(problem => console.log('  -', problem));
}

// Problem 3: VM text visibility
const vmTextProblems = [];
svgs.forEach((svg, svgIndex) => {
  const vmTexts = svg.querySelectorAll('text.vm-text');
  vmTexts.forEach((text, textIndex) => {
    const style = window.getComputedStyle(text);
    const isVisible = style.opacity !== '0' && style.display !== 'none';
    const hasContent = text.textContent && text.textContent.trim().length > 0;
    
    if (!isVisible) {
      vmTextProblems.push(`SVG ${svgIndex} VM text ${textIndex}: Hidden (opacity: ${style.opacity})`);
    } else if (!hasContent) {
      vmTextProblems.push(`SVG ${svgIndex} VM text ${textIndex}: No content`);
    }
  });
});

if (vmTextProblems.length > 0) {
  console.log('❌ VM TEXT PROBLEMS:');
  vmTextProblems.forEach(problem => console.log('  -', problem));
}

// Summary
console.log(`\n📊 SUMMARY:`);
console.log(`Total SVGs: ${svgs.length}`);
console.log(`Host width problems: ${hostProblems.length}`);
console.log(`Host text problems: ${hostTextProblems.length}`);  
console.log(`VM text problems: ${vmTextProblems.length}`);

if (hostProblems.length === 0 && hostTextProblems.length === 0 && vmTextProblems.length === 0) {
  console.log('✅ All main issues appear to be resolved!');
} else {
  console.log('❌ Issues still persist and need fixing');
}
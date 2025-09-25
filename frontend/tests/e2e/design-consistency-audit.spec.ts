import { test, expect, Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the pages to audit
const pagesToAudit = [
  { name: 'Landing', url: '/', description: 'Landing page with glassmorphic hero and navigation cards' },
  { name: 'Projects', url: '/app/projects', description: 'Projects management page' },
  { name: 'Hardware Pool', url: '/app/hardware-pool', description: 'Hardware asset management' },
  { name: 'Hardware Basket', url: '/app/hardware-basket', description: 'Vendor quotations and catalogs' },
  { name: 'Document Templates', url: '/app/document-templates', description: 'Technical documentation templates' },
];

// Expected design tokens from the design system
const expectedDesignTokens = {
  standardCard: {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5))',
    backdropFilter: 'blur(60px) saturate(220%) brightness(145%) contrast(105%)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    borderRadius: '20px',
    padding: '24px',
  },
  standardContentCard: {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.16))',
    backdropFilter: 'blur(40px) saturate(35%) brightness(145%) contrast(85%)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '20px',
    padding: '32px',
  },
  colors: {
    primary: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    textPrimary: '#1f2937',
    textSecondary: '#6b7280',
  }
};

test.describe('Design Consistency Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for any potential JavaScript to load
    await page.goto('http://localhost:1420/');
    await page.waitForLoadState('networkidle');
  });

  test('Complete Design Consistency Audit - Take Screenshots and Analyze', async ({ page }) => {
    const auditResults: any = {
      pages: {},
      summary: {
        overallConsistency: 'unknown',
        criticalIssues: [],
        recommendations: [],
      }
    };

    // Create screenshots directory
    const screenshotDir = path.join(__dirname, '..', 'design-audit-screenshots');

    console.log('🔍 Starting comprehensive design consistency audit...');

    for (const pageInfo of pagesToAudit) {
      console.log(`\n📄 Auditing: ${pageInfo.name} (${pageInfo.url})`);
      
      // Navigate to page
      await page.goto(`http://localhost:1420${pageInfo.url}`);
      await page.waitForLoadState('networkidle');
      
      // Wait for any animations or transitions
      await page.waitForTimeout(1000);

      // Take full page screenshot
      const screenshotPath = path.join(screenshotDir, `${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}.png`);
      await page.screenshot({ 
        path: screenshotPath, 
        fullPage: true,
        animations: 'disabled'
      });
      console.log(`📸 Screenshot saved: ${screenshotPath}`);

      // Initialize page audit results
      auditResults.pages[pageInfo.name] = {
        url: pageInfo.url,
        screenshot: screenshotPath,
        cardAnalysis: {},
        searchBarAnalysis: {},
        glassmorphicConsistency: {},
        layoutIssues: [],
        recommendations: []
      };

      // Analyze cards on the page
      await analyzeCards(page, auditResults.pages[pageInfo.name], pageInfo.name);
      
      // Analyze search bars
      await analyzeSearchBars(page, auditResults.pages[pageInfo.name], pageInfo.name);
      
      // Check glassmorphic styling consistency
      await analyzeGlassmorphicStyling(page, auditResults.pages[pageInfo.name], pageInfo.name);
      
      // Check for loose elements not in cards
      await analyzeLooseElements(page, auditResults.pages[pageInfo.name], pageInfo.name);
    }

    // Generate overall analysis
    generateOverallAnalysis(auditResults);

    // Output detailed report
    console.log('\n' + '='.repeat(80));
    console.log('🔍 DESIGN CONSISTENCY AUDIT REPORT');
    console.log('='.repeat(80));
    
    for (const [pageName, pageData] of Object.entries(auditResults.pages)) {
      const data = pageData as any;
      console.log(`\n📄 ${pageName.toUpperCase()}`);
      console.log('-'.repeat(40));
      
      // Card Analysis
      console.log(`🎴 CARD ANALYSIS:`);
      console.log(`  - Cards found: ${data.cardAnalysis.cardCount || 0}`);
      console.log(`  - Consistent with landing page: ${data.cardAnalysis.consistentWithLanding ? '✅' : '❌'}`);
      if (data.cardAnalysis.issues?.length > 0) {
        console.log(`  - Issues: ${data.cardAnalysis.issues.join(', ')}`);
      }
      
      // Search Bar Analysis
      console.log(`🔍 SEARCH BAR ANALYSIS:`);
      console.log(`  - Search bars found: ${data.searchBarAnalysis.searchBarCount || 0}`);
      console.log(`  - Styling consistent: ${data.searchBarAnalysis.stylingConsistent ? '✅' : '❌'}`);
      if (data.searchBarAnalysis.issues?.length > 0) {
        console.log(`  - Issues: ${data.searchBarAnalysis.issues.join(', ')}`);
      }
      
      // Glassmorphic Consistency
      console.log(`✨ GLASSMORPHIC STYLING:`);
      console.log(`  - Consistent blur effects: ${data.glassmorphicConsistency.blurConsistent ? '✅' : '❌'}`);
      console.log(`  - Consistent backgrounds: ${data.glassmorphicConsistency.backgroundConsistent ? '✅' : '❌'}`);
      console.log(`  - Consistent borders: ${data.glassmorphicConsistency.borderConsistent ? '✅' : '❌'}`);
      
      // Layout Issues
      if (data.layoutIssues.length > 0) {
        console.log(`⚠️  LAYOUT ISSUES:`);
        data.layoutIssues.forEach((issue: string) => console.log(`  - ${issue}`));
      }
      
      // Recommendations
      if (data.recommendations.length > 0) {
        console.log(`💡 RECOMMENDATIONS:`);
        data.recommendations.forEach((rec: string) => console.log(`  - ${rec}`));
      }
    }

    // Overall Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 OVERALL SUMMARY');
    console.log('='.repeat(80));
    console.log(`Overall Consistency Rating: ${auditResults.summary.overallConsistency}`);
    
    if (auditResults.summary.criticalIssues.length > 0) {
      console.log(`\n🚨 CRITICAL ISSUES:`);
      auditResults.summary.criticalIssues.forEach((issue: string) => console.log(`  - ${issue}`));
    }
    
    if (auditResults.summary.recommendations.length > 0) {
      console.log(`\n💡 TOP RECOMMENDATIONS:`);
      auditResults.summary.recommendations.forEach((rec: string) => console.log(`  - ${rec}`));
    }

    // Save audit results to JSON file
    const auditResultsPath = path.join(screenshotDir, 'audit-results.json');
    await page.evaluate((results) => {
      // This will be logged to the browser console, but we mainly want the structured output above
      console.log('Audit completed. Results:', JSON.stringify(results, null, 2));
    }, auditResults);

    console.log(`\n💾 Full audit results would be saved to: ${auditResultsPath}`);
    console.log('🎯 Audit completed successfully!');
  });
});

// Helper function to analyze cards
async function analyzeCards(page: Page, pageResults: any, pageName: string) {
  // Look for various card-like elements
  const cardSelectors = [
    '[style*="backdrop-filter"]',
    '[style*="backdropFilter"]',
    '[class*="card"]',
    '[data-testid*="card"]',
    'div[style*="background"][style*="rgba"]',
    'div[style*="border-radius"]'
  ];

  let totalCards = 0;
  const cardIssues: string[] = [];
  
  for (const selector of cardSelectors) {
    const elements = await page.$$(selector);
    totalCards += elements.length;
    
    // Check each card element for consistency
    for (const element of elements) {
      const styles = await element.evaluate((el) => {
        const computedStyle = window.getComputedStyle(el);
        const inlineStyle = (el as HTMLElement).style;
        return {
          background: inlineStyle.background || computedStyle.background,
          backdropFilter: inlineStyle.backdropFilter || computedStyle.backdropFilter,
          borderRadius: inlineStyle.borderRadius || computedStyle.borderRadius,
          border: inlineStyle.border || computedStyle.border,
          padding: inlineStyle.padding || computedStyle.padding,
        };
      });
      
      // Check for glassmorphic properties
      const hasBackdropFilter = styles.backdropFilter && styles.backdropFilter !== 'none';
      const hasGlassBackground = styles.background?.includes('rgba') || styles.background?.includes('linear-gradient');
      const hasRoundedCorners = styles.borderRadius && styles.borderRadius !== '0px';
      
      if (!hasBackdropFilter) {
        cardIssues.push('Card missing backdrop-filter (glassmorphic effect)');
      }
      
      if (!hasGlassBackground) {
        cardIssues.push('Card missing glassmorphic background');
      }
      
      if (!hasRoundedCorners) {
        cardIssues.push('Card missing rounded corners (border-radius)');
      }
    }
  }

  // Special handling for landing page vs other pages
  const consistentWithLanding = pageName === 'Landing' || (totalCards > 0 && cardIssues.length === 0);

  pageResults.cardAnalysis = {
    cardCount: totalCards,
    consistentWithLanding,
    issues: [...new Set(cardIssues)] // Remove duplicates
  };

  // Add recommendations based on analysis
  if (!consistentWithLanding) {
    pageResults.recommendations.push('Apply standardCard or standardContentCard design tokens to all card elements');
  }
  
  if (cardIssues.includes('Card missing backdrop-filter (glassmorphic effect)')) {
    pageResults.recommendations.push('Add backdrop-filter: blur(60px) saturate(220%) brightness(145%) contrast(105%) to card elements');
  }
}

// Helper function to analyze search bars
async function analyzeSearchBars(page: Page, pageResults: any, pageName: string) {
  const searchSelectors = [
    'input[type="search"]',
    'input[placeholder*="search" i]',
    'input[placeholder*="filter" i]',
    '[class*="search"]',
    '[data-testid*="search"]'
  ];

  let totalSearchBars = 0;
  const searchIssues: string[] = [];
  
  for (const selector of searchSelectors) {
    const elements = await page.$$(selector);
    totalSearchBars += elements.length;
    
    for (const element of elements) {
      const styles = await element.evaluate((el) => {
        const computedStyle = window.getComputedStyle(el);
        const inlineStyle = (el as HTMLElement).style;
        return {
          background: inlineStyle.background || computedStyle.background,
          borderRadius: inlineStyle.borderRadius || computedStyle.borderRadius,
          border: inlineStyle.border || computedStyle.border,
          padding: inlineStyle.padding || computedStyle.padding,
          fontSize: inlineStyle.fontSize || computedStyle.fontSize,
          height: inlineStyle.height || computedStyle.height,
        };
      });
      
      // Check for consistent styling
      const hasGlassBackground = styles.background?.includes('rgba') || styles.background?.includes('255, 255, 255, 0.9');
      const hasRoundedCorners = styles.borderRadius && styles.borderRadius !== '0px';
      const hasBorder = styles.border && styles.border !== 'none';
      
      if (!hasGlassBackground) {
        searchIssues.push('Search bar missing glassmorphic background');
      }
      
      if (!hasRoundedCorners) {
        searchIssues.push('Search bar missing rounded corners');
      }
      
      if (!hasBorder) {
        searchIssues.push('Search bar missing consistent border styling');
      }
    }
  }

  const stylingConsistent = searchIssues.length === 0;

  pageResults.searchBarAnalysis = {
    searchBarCount: totalSearchBars,
    stylingConsistent,
    issues: [...new Set(searchIssues)]
  };

  if (!stylingConsistent) {
    pageResults.recommendations.push('Apply consistent input design tokens to all search bars');
  }
}

// Helper function to analyze glassmorphic styling consistency
async function analyzeGlassmorphicStyling(page: Page, pageResults: any, pageName: string) {
  // Check for elements with glassmorphic properties
  const glassmorphicElements = await page.$$('[style*="backdrop-filter"], [style*="backdropFilter"]');
  
  let blurConsistent = true;
  let backgroundConsistent = true;
  let borderConsistent = true;
  
  const blurValues: string[] = [];
  const backgroundValues: string[] = [];
  const borderValues: string[] = [];
  
  for (const element of glassmorphicElements) {
    const styles = await element.evaluate((el) => {
      const inlineStyle = (el as HTMLElement).style;
      return {
        backdropFilter: inlineStyle.backdropFilter,
        background: inlineStyle.background,
        border: inlineStyle.border,
      };
    });
    
    if (styles.backdropFilter) blurValues.push(styles.backdropFilter);
    if (styles.background) backgroundValues.push(styles.background);
    if (styles.border) borderValues.push(styles.border);
  }
  
  // Check for consistency (allowing for some variation)
  blurConsistent = new Set(blurValues).size <= 2; // Allow for 2 different blur styles (standardCard vs standardContentCard)
  backgroundConsistent = new Set(backgroundValues).size <= 3; // Allow for some variation
  borderConsistent = new Set(borderValues).size <= 2;
  
  pageResults.glassmorphicConsistency = {
    blurConsistent,
    backgroundConsistent,
    borderConsistent,
    elementCount: glassmorphicElements.length
  };
  
  if (!blurConsistent) {
    pageResults.recommendations.push('Standardize backdrop-filter values across glassmorphic elements');
  }
  
  if (!backgroundConsistent) {
    pageResults.recommendations.push('Use consistent background values from design tokens');
  }
  
  if (!borderConsistent) {
    pageResults.recommendations.push('Apply consistent border styling to glassmorphic elements');
  }
}

// Helper function to analyze loose elements
async function analyzeLooseElements(page: Page, pageResults: any, pageName: string) {
  // Look for elements that should be in cards but aren't
  const suspiciousElements = await page.$$('button, input, select, textarea, .metric, .stat, .info');
  
  const looseElements: string[] = [];
  
  for (const element of suspiciousElements) {
    const isInCard = await element.evaluate((el) => {
      let parent = el.parentElement;
      while (parent) {
        const style = window.getComputedStyle(parent);
        const inlineStyle = (parent as HTMLElement).style;
        
        // Check if parent has glassmorphic properties (indicating it's a card)
        const hasBackdropFilter = (inlineStyle.backdropFilter || style.backdropFilter) !== 'none';
        const hasGlassBackground = (inlineStyle.background || style.background)?.includes('rgba');
        
        if (hasBackdropFilter || hasGlassBackground) {
          return true;
        }
        
        parent = parent.parentElement;
      }
      return false;
    });
    
    if (!isInCard) {
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      const className = await element.evaluate(el => el.className);
      looseElements.push(`${tagName}${className ? '.' + className.split(' ')[0] : ''}`);
    }
  }
  
  if (looseElements.length > 0) {
    pageResults.layoutIssues.push(`Found ${looseElements.length} loose elements not contained in cards: ${looseElements.slice(0, 5).join(', ')}${looseElements.length > 5 ? '...' : ''}`);
    pageResults.recommendations.push('Wrap loose UI elements in appropriate card containers');
  }
}

// Helper function to generate overall analysis
function generateOverallAnalysis(auditResults: any) {
  const pages = Object.values(auditResults.pages) as any[];
  
  // Calculate overall scores
  let totalIssues = 0;
  let totalRecommendations = 0;
  const criticalIssues: string[] = [];
  const topRecommendations: Set<string> = new Set();
  
  for (const page of pages) {
    totalIssues += (page.cardAnalysis.issues?.length || 0) + 
                  (page.searchBarAnalysis.issues?.length || 0) + 
                  (page.layoutIssues?.length || 0);
    
    totalRecommendations += page.recommendations?.length || 0;
    
    // Collect critical issues
    if (!page.cardAnalysis.consistentWithLanding) {
      criticalIssues.push(`${page.url}: Card design inconsistent with landing page`);
    }
    
    if (!page.searchBarAnalysis.stylingConsistent) {
      criticalIssues.push(`${page.url}: Search bar styling inconsistent`);
    }
    
    // Collect top recommendations
    if (page.recommendations) {
      page.recommendations.forEach((rec: string) => topRecommendations.add(rec));
    }
  }
  
  // Determine overall consistency rating
  let overallConsistency = 'Excellent';
  if (totalIssues > 10) overallConsistency = 'Poor';
  else if (totalIssues > 5) overallConsistency = 'Needs Improvement';
  else if (totalIssues > 0) overallConsistency = 'Good';
  
  auditResults.summary = {
    overallConsistency,
    totalIssues,
    totalRecommendations,
    criticalIssues: criticalIssues.slice(0, 5), // Top 5 critical issues
    recommendations: Array.from(topRecommendations).slice(0, 5) // Top 5 recommendations
  };
}
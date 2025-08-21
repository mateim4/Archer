// Test script to verify the VSAN Ready Server fix
const isComponentLike = (text) => {
  // Don't filter out VSAN Ready Servers or ESA servers - these are legitimate server models
  if (/vsan.*ready.*server|esa.*server|server.*vsan|server.*esa/i.test(text)) {
    return false;
  }
  
  return /\b(riser|backplane|power\s*supply|psu|heatsink|chassis|retimer|adapter|controller|raid|hba|fan|rail|bezel|cable|riser\s*cage|anybay|nvme|pcie|dimm|memory|processor|cpu|ssd|hdd|drive|ethernet|nic|network|enablement|kit|vmware|esxi|operating|mode|selection|data\s*center|environment|xclarity|year|warranty|none|broadcom|intel\s+xeon|amd\s+epyc|thinksystem\s+(?!sr\d)|flash|gb\s|tb\s|mhz|ghz|installed|factory|config|hybrid|pro|max|intensive|mixed|use|hot\s+swap)\b/i.test(text);
};

// Test the VSAN Ready Server models that were previously being filtered out
const testModels = [
  "VEI1 - VSAN Ready Server (ESA), Intel (upto 15TB Per Node)",
  "VEI2 - VSAN Ready Server (ESA), Intel (15 - 60TB Per Node)",
  "VEA1 - VSAN Ready Server ESA, (AMD) - Upto 15TB Per Node", 
  "VEA2 - VSAN Ready Server ESA, (AMD) - (16  - 60TB)",
  "VOI1 - Intel - VSAN Ready Server (OSA) - All Flash",
  "VOA1 - AMD - VSAN Ready Server (OSA) - All Flash",
  "VOI2 - Intel - VSAN Ready Server (OSA) - Hybrid",
  "VOA2 - AMD - VSAN Ready Server (OSA) - Hybrid",
  "DHC1 - Compute", // Should not be filtered 
  "DHC2 - MGMT", // Should not be filtered
  "Dell Options and Upgrades" // Should be filtered as component
];

console.log("Testing VSAN Ready Server fix:");
console.log("=====================================");

testModels.forEach(model => {
  const isComponent = isComponentLike(model);
  console.log(`${model}: ${isComponent ? 'FILTERED (Component)' : 'KEPT (Server)'}`);
});

console.log("\nSUMMARY:");
console.log("========");
const vsanModels = testModels.filter(m => m.includes('VSAN') || m.includes('ESA'));
const keptVsanModels = vsanModels.filter(m => !isComponentLike(m));
console.log(`VSAN/ESA models found: ${vsanModels.length}`);
console.log(`VSAN/ESA models kept (should be ${vsanModels.length}): ${keptVsanModels.length}`);
console.log(`Fix is ${keptVsanModels.length === vsanModels.length ? 'WORKING ✅' : 'BROKEN ❌'}`);

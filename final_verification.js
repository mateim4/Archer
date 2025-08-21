const { execSync } = require('child_process');

// Test data - the actual models from our successful upload
const serverModels = [
  "SMI1 - Intel  - 1 Proc - Small Rack Server",
  "SMI2 - Intel  - 2 Proc - Small Rack", 
  "SMA1 - AMD - 1 Proc  - Small Rack",
  "SMA2 - AMD - 2 Proc  - Small Rack",
  "MEI1 - Medium Intel Rack Server",
  "MEA1 - Medium AMD Rack Server", 
  "HVI1 - Heavy Intel Rack Server",
  "HVA1 - Heavy AMD Rack Server",
  "VEI1 - VSAN Ready Server (ESA), Intel (upto 15TB Per Node)",
  "VEI2 - VSAN Ready Server (ESA), Intel (15 - 60TB Per Node)",
  "VEA1 - VSAN Ready Server ESA, (AMD) - Upto 15TB Per Node",
  "VEA2 - VSAN Ready Server ESA, (AMD) - (16  - 60TB)", 
  "VOI1 - Intel - VSAN Ready Server (OSA) - All Flash",
  "VOA1 - AMD - VSAN Ready Server (OSA) - All Flash",
  "VOI2 - Intel - VSAN Ready Server (OSA) - Hybrid", 
  "VOA2 - AMD - VSAN Ready Server (OSA) - Hybrid",
  "DHC1 - Compute",
  "DHC2 - MGMT",
  "Dell Options and Upgrades"
];

// Our fixed isComponentLike function
const isComponentLike = (text) => {
  // Don't filter out VSAN Ready Servers or ESA servers - these are legitimate server models
  if (/vsan.*ready.*server|esa.*server|server.*vsan|server.*esa/i.test(text)) {
    return false;
  }
  
  return /\b(riser|backplane|power\s*supply|psu|heatsink|chassis|retimer|adapter|controller|raid|hba|fan|rail|bezel|cable|riser\s*cage|anybay|nvme|pcie|dimm|memory|processor|cpu|ssd|hdd|drive|ethernet|nic|network|enablement|kit|vmware|esxi|operating|mode|selection|data\s*center|environment|xclarity|year|warranty|none|broadcom|intel\s+xeon|amd\s+epyc|thinksystem\s+(?!sr\d)|flash|gb\s|tb\s|mhz|ghz|installed|factory|config|hybrid|pro|max|intensive|mixed|use|hot\s+swap)\b/i.test(text);
};

console.log('🚀 DELL HARDWARE BASKET FIX VERIFICATION');
console.log('==========================================');

const vsanModels = serverModels.filter(m => m.includes('VSAN') || m.includes('ESA'));
const keptVsanModels = vsanModels.filter(m => !isComponentLike(m));
const serverCount = serverModels.filter(m => !isComponentLike(m));

console.log(`📊 ANALYSIS RESULTS:`);
console.log(`Total models uploaded: ${serverModels.length}`);
console.log(`VSAN/ESA servers found: ${vsanModels.length}`);
console.log(`VSAN/ESA servers preserved: ${keptVsanModels.length}`);
console.log(`Total server models that will display: ${serverCount.length}`);
console.log(`Components filtered out: ${serverModels.length - serverCount.length}`);

console.log('\n🔍 VSAN/ESA MODELS STATUS:');
vsanModels.forEach(model => {
  const kept = !isComponentLike(model);
  console.log(`${kept ? '✅' : '❌'} ${model}`);
});

console.log('\n📋 ALL MODEL FILTERING:');
serverModels.forEach(model => {
  const isComponent = isComponentLike(model);
  console.log(`${isComponent ? '🔧' : '🖥️ '} ${model} ${isComponent ? '(Component)' : '(Server)'}`);
});

console.log('\n🎯 FINAL RESULT:');
if (keptVsanModels.length === vsanModels.length) {
  console.log(`✅ SUCCESS: All ${vsanModels.length} VSAN/ESA servers are preserved!`);
  console.log(`✅ Fix working: ${serverCount.length} servers will show in UI (vs original issue of 5)`);
  console.log(`✅ Before fix: Only ~5-7 servers were showing`);
  console.log(`✅ After fix: All ${serverCount.length} legitimate servers now show`);
} else {
  console.log(`❌ ISSUE: ${vsanModels.length - keptVsanModels.length} VSAN servers still filtered`);
}

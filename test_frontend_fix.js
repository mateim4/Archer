#!/usr/bin/env node

// Test the actual frontend fix with the server models from the upload
const testServerModels = [
  { model: "SMI1 - Intel  - 1 Proc - Small Rack Server", vendor: "Dell" },
  { model: "SMI2 - Intel  - 2 Proc - Small Rack", vendor: "Dell" },
  { model: "SMA1 - AMD - 1 Proc  - Small Rack", vendor: "Dell" },
  { model: "SMA2 - AMD - 2 Proc  - Small Rack", vendor: "Dell" },
  { model: "MEI1 - Medium Intel Rack Server", vendor: "Dell" },
  { model: "MEA1 - Medium AMD Rack Server", vendor: "Dell" },
  { model: "HVI1 - Heavy Intel Rack Server", vendor: "Dell" },
  { model: "HVA1 - Heavy AMD Rack Server", vendor: "Dell" },
  { model: "VEI1 - VSAN Ready Server (ESA), Intel (upto 15TB Per Node)", vendor: "Dell" },
  { model: "VEI2 - VSAN Ready Server (ESA), Intel (15 - 60TB Per Node)", vendor: "Dell" },
  { model: "VEA1 - VSAN Ready Server ESA, (AMD) - Upto 15TB Per Node", vendor: "Dell" },
  { model: "VEA2 - VSAN Ready Server ESA, (AMD) - (16  - 60TB)", vendor: "Dell" },
  { model: "VOI1 - Intel - VSAN Ready Server (OSA) - All Flash", vendor: "Dell" },
  { model: "VOA1 - AMD - VSAN Ready Server (OSA) - All Flash", vendor: "Dell" },
  { model: "VOI2 - Intel - VSAN Ready Server (OSA) - Hybrid", vendor: "Dell" },
  { model: "VOA2 - AMD - VSAN Ready Server (OSA) - Hybrid", vendor: "Dell" },
  { model: "DHC1 - Compute", vendor: "Dell" },
  { model: "DHC2 - MGMT", vendor: "Dell" },
  { model: "Dell Options and Upgrades", vendor: "Dell" }
];

// This is our FIXED isComponentLike function from the frontend
const isComponentLike = (text) => {
  // Don't filter out VSAN Ready Servers or ESA servers - these are legitimate server models
  if (/vsan.*ready.*server|esa.*server|server.*vsan|server.*esa/i.test(text)) {
    return false;
  }
  
  return /\b(riser|backplane|power\s*supply|psu|heatsink|chassis|retimer|adapter|controller|raid|hba|fan|rail|bezel|cable|riser\s*cage|anybay|nvme|pcie|dimm|memory|processor|cpu|ssd|hdd|drive|ethernet|nic|network|enablement|kit|vmware|esxi|operating|mode|selection|data\s*center|environment|xclarity|year|warranty|none|broadcom|intel\s+xeon|amd\s+epyc|thinksystem\s+(?!sr\d)|flash|gb\s|tb\s|mhz|ghz|installed|factory|config|hybrid|options\s+and\s+upgrades|pro|max|intensive|mixed|use|hot\s+swap)\b/i.test(text);
};

// This is the isActualServerModel function from the frontend
const isActualServerModel = (m, currentBasket) => {
  const actualVendor = m.vendor || currentBasket?.vendor || 'Unknown';
  return m.category === 'server' || 
         (actualVendor.toLowerCase() === 'dell' && !isComponentLike(m.model)) ||
         (actualVendor.toLowerCase() === 'lenovo' && !isComponentLike(m.model));
};

console.log('🔍 Testing Frontend Hardware Basket Fix');
console.log('=====================================');
console.log(`Total models from upload: ${testServerModels.length}`);

const currentBasket = { vendor: 'Dell' };
const serverModels = testServerModels.filter(m => isActualServerModel(m, currentBasket));

console.log('\n📊 FILTERING RESULTS:');
console.log('===================');

testServerModels.forEach(model => {
  const isServer = isActualServerModel(model, currentBasket);
  const status = isServer ? '✅ KEPT (Server)' : '❌ FILTERED (Component)';
  console.log(`${model.model}: ${status}`);
});

console.log('\n📈 SUMMARY:');
console.log('==========');
console.log(`Original models: ${testServerModels.length}`);
console.log(`Models kept as servers: ${serverModels.length}`);
console.log(`Models filtered as components: ${testServerModels.length - serverModels.length}`);

const vsanModels = testServerModels.filter(m => m.model.includes('VSAN') || m.model.includes('ESA'));
const keptVsanModels = vsanModels.filter(m => isActualServerModel(m, currentBasket));

console.log(`\n🎯 VSAN/ESA MODELS:`)
console.log(`==================`);
console.log(`VSAN/ESA models found: ${vsanModels.length}`);
console.log(`VSAN/ESA models kept: ${keptVsanModels.length}`);

const shouldKeepOptionsAndUpgrades = testServerModels.some(m => m.model.includes('Options and Upgrades'));
const keptOptionsAndUpgrades = serverModels.some(m => m.model.includes('Options and Upgrades'));

console.log(`\n📦 COMPONENT FILTERING:`)
console.log(`=====================`);
console.log(`"Dell Options and Upgrades" should be filtered: ${shouldKeepOptionsAndUpgrades ? 'YES' : 'NO'}`);
console.log(`"Dell Options and Upgrades" was filtered: ${keptOptionsAndUpgrades ? 'NO ❌' : 'YES ✅'}`);

console.log(`\n🏆 OVERALL RESULT:`);
console.log(`=================`);
if (keptVsanModels.length === vsanModels.length && !keptOptionsAndUpgrades) {
  console.log(`✅ SUCCESS: Fix is working correctly!`);
  console.log(`   - All ${vsanModels.length} VSAN/ESA servers are preserved`);
  console.log(`   - Component models are properly filtered`);
  console.log(`   - ${serverModels.length} legitimate server models will display in the UI`);
} else {
  console.log(`❌ ISSUE: Fix needs more work`);
  if (keptVsanModels.length !== vsanModels.length) {
    console.log(`   - Missing VSAN/ESA servers: ${vsanModels.length - keptVsanModels.length}`);
  }
  if (keptOptionsAndUpgrades) {
    console.log(`   - "Options and Upgrades" should be filtered but wasn't`);
  }
}

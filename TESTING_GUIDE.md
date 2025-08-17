# Testing Guide - Vendor Data Collection Improvements

## Quick Test Checklist

### 1. **Price Modal Improvements** 🖱️
- [ ] Navigate to Vendor Data Collection view
- [ ] Select any hardware basket (Dell or Lenovo)
- [ ] Click "View" button in the Price column of any server
- [ ] **Verify**: Modal appears centered on screen (not at scroll position)
- [ ] **Verify**: Modal stays centered when scrolling page behind it
- [ ] **Verify**: Can click outside modal to close it
- [ ] **Verify**: Close button (×) works
- [ ] **Test on mobile/tablet**: Modal is responsive and fits screen

### 2. **Dell Extensions Display** 📊
- [ ] Select Dell hardware basket
- [ ] Click "Extensions" tab (should not show 0 anymore)
- [ ] **Verify**: Shows management/compute components like "DHC1 - Compute", "DHC2 - MGMT"
- [ ] **Verify**: Components are properly categorized (management, compute, component)
- [ ] **Verify**: Each has a part number starting with "DELL-"
- [ ] **Verify**: Extensions count in tab reflects actual components shown

### 3. **Enhanced Lenovo Specifications** ⚙️
- [ ] Select Lenovo hardware basket
- [ ] Look for ThinkSystem models (SR630 V3, SR650 V3, ThinkAgile)
- [ ] **Verify CPU Column**: Shows enhanced details like socket type, TDP
  - Example: "Intel Xeon Gold 5420+ (28C, 2.0GHz, 205W, LGA4677)"
- [ ] **Verify Memory Column**: Shows capacity, type, ECC support
  - Example: "64GB DDR5 RDIMM/LRDIMM (ECC, up to 4TB)"
- [ ] **Verify Storage Column**: Shows bay configuration and RAID support
  - Example: "10x 2.5" bays (SATA/SAS/NVMe) + 4x M.2"
- [ ] **Verify Network Column**: Shows onboard ports and expansion options
  - Example: "2x 1GbE RJ45 + 3x PCIe slots"

### 4. **Cross-Vendor Consistency** 🔄
- [ ] Switch between Dell and Lenovo baskets
- [ ] **Verify**: Table layout remains consistent
- [ ] **Verify**: Sorting works on all specification columns
- [ ] **Verify**: Search functionality works
- [ ] **Verify**: Server counts are accurate (no components in server table)

## Detailed Testing Scenarios

### Scenario A: Price Modal UX
```
1. Open Dell basket "Dell Q3 2025 Hardware Basket"
2. Scroll down to middle of server table
3. Click "View" on "MEA1 - Medium AMD Rack Server"
4. Modal should appear centered in viewport (not at scroll position)
5. Click outside modal gray area → should close
6. Repeat with different server → should show correct pricing info
```

### Scenario B: Dell Extensions Functionality
```
1. Select Dell basket
2. Note server count (should be 18)
3. Click Extensions tab
4. Should now show 2 components: DHC1 (Compute) and DHC2 (MGMT)
5. Verify part numbers: DELL-[id] format
6. Switch to Lenovo basket
7. Extensions should show actual extension components
```

### Scenario C: Lenovo Spec Enhancement
```
1. Select "Lenovo Q3 2025 Hardware Basket"
2. Find model "MEI1 : ThinkSystem SR630 V3"
3. CPU column should show: enhanced processor info with socket type
4. Memory column should show: "DDR5 RDIMM/LRDIMM" instead of just "DDR5"
5. Storage column should show: bay counts and interface options
6. Network column should show: onboard ports + expansion info
```

### Scenario D: Sorting and Search
```
1. In any basket, click CPU column header to sort
2. Verify sorting works with enhanced specifications
3. Type "SR630" in search box
4. Should filter to show only SR630 models
5. Clear search and verify all models return
```

## Expected Results Summary

### Before → After Comparison

| Component | Before | After |
|-----------|--------|-------|
| **Price Modal** | Alert popup, positioned poorly | Professional modal, viewport-centered |
| **Dell Extensions** | 0 extensions, confusing | Management/compute components shown |
| **Lenovo CPU Specs** | Basic info | Socket type, TDP, core details |
| **Lenovo Memory** | "64GB DDR5" | "64GB DDR5 RDIMM/LRDIMM (ECC, up to 4TB)" |
| **Lenovo Storage** | Basic capacity | "10x 2.5" bays (SATA/SAS/NVMe) + RAID support" |
| **Lenovo Network** | "1x 25Gb SFP+" | "2x 1GbE RJ45 + 3x PCIe (25GbE/100GbE options)" |

## Troubleshooting

### If Modal Appears at Wrong Position
- Check browser zoom level (should work at 100%)
- Verify no CSS conflicts from browser extensions
- Test in different browsers (Chrome, Firefox, Safari)

### If Dell Extensions Don't Show
- Check browser console for errors
- Verify Dell basket ID matches expected pattern
- Check network requests in DevTools

### If Lenovo Specs Not Enhanced
- Verify models have "SR630 V3", "SR650 V3", or "ThinkAgile" in names
- Check browser console for enhancement function errors
- Confirm Lenovo basket is properly selected

## Performance Verification
- [ ] Page loads within 2 seconds
- [ ] Modal opens instantly when clicked
- [ ] No noticeable lag when switching between baskets
- [ ] Specification enhancement doesn't slow down table rendering

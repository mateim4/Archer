# Stage 1-2 Visual Testing Guide

**Date**: October 17, 2025  
**Testing**: Design Token System + Modal Refactoring  
**Dev Server**: http://localhost:1420/

---

## 🎯 Testing Objectives

Verify that:
1. ✅ Design tokens are loading correctly
2. ✅ Modal backdrop has proper blur effect
3. ✅ Modal background is transparent (no blue tint)
4. ✅ Purple glass aesthetic is preserved
5. ✅ No `!important` CSS conflicts
6. ✅ Fluent UI 2 components work properly

---

## 📋 Test Checklist

### Test 1: Activity Wizard Modal Launch
**Steps**:
1. Navigate to: http://localhost:1420/
2. Log in (if needed)
3. Go to any project
4. Click "Add Activity" button
5. Wizard modal should open

**Expected Results**:
- ✅ Modal opens smoothly
- ✅ Backdrop has blur effect (you can see content behind, but blurred)
- ✅ Modal surface is semi-transparent white
- ✅ **NO solid blue/cyan background** ⚠️
- ✅ Purple accents visible (borders, shadows)
- ✅ Close button works

---

### Test 2: Modal Backdrop Verification
**Steps**:
1. With wizard modal open
2. Look at the area OUTSIDE the modal (the backdrop)

**Expected Results**:
- ✅ Backdrop is dark semi-transparent (rgba(0, 0, 0, 0.4))
- ✅ Content behind modal is blurred (12px blur)
- ✅ Backdrop has slight saturation boost (120%)
- ✅ Can still vaguely see content behind

**Visual Check**:
```
Before Stage 2: Solid blue background blocking view ❌
After Stage 2:  Blurred dark backdrop showing content behind ✅
```

---

### Test 3: Modal Content Background
**Steps**:
1. Look at the wizard content INSIDE the modal
2. Inspect the wizard header, steps, navigation

**Expected Results**:
- ✅ Wizard content has transparent backgrounds
- ✅ No gradient backgrounds on header
- ✅ Progress indicators visible
- ✅ Step content clearly visible
- ✅ Navigation buttons have proper styling

---

### Test 4: Purple Glass Elements
**Steps**:
1. Look for purple glass aesthetic elements:
   - Modal border (subtle purple)
   - Shadow (purple-tinted)
   - Infrastructure cards (Step 2)
   - Radio buttons

**Expected Results**:
- ✅ Purple border around modal (rgba(139, 92, 246, 0.1))
- ✅ Purple glow shadow visible
- ✅ Cards have glassmorphic effect
- ✅ Purple color scheme consistent

---

### Test 5: Typography & Spacing
**Steps**:
1. Inspect text in modal
2. Check spacing between elements

**Expected Results**:
- ✅ Poppins font family applied
- ✅ Font sizes match Fluent UI type ramp
- ✅ Consistent spacing (using tokens)
- ✅ No awkward gaps or overlaps

---

### Test 6: Close Confirmation Dialog
**Steps**:
1. Fill in some wizard fields (make changes)
2. Click the X button to close
3. Confirmation dialog should appear

**Expected Results**:
- ✅ Confirmation dialog appears
- ✅ Uses design tokens (spacing, colors)
- ✅ "Continue Editing" button works
- ✅ "Close Wizard" button closes modal
- ✅ Text is readable (proper contrast)

---

### Test 7: Responsive Design
**Steps**:
1. Resize browser window
2. Try mobile width (<768px)
3. Try tablet width (768-1024px)
4. Try desktop (>1024px)

**Expected Results**:
- ✅ Modal adapts to screen size
- ✅ On mobile: Full screen modal
- ✅ On desktop: Centered with max-width
- ✅ Content remains readable at all sizes

---

### Test 8: Accessibility (Keyboard)
**Steps**:
1. Open wizard modal
2. Press Tab key to navigate
3. Press ESC key to close

**Expected Results**:
- ✅ Tab navigation works through all interactive elements
- ✅ Focus indicators visible (purple outline)
- ✅ ESC key closes modal (with unsaved changes warning)
- ✅ Focus returns to trigger button after close

---

### Test 9: Performance Check
**Steps**:
1. Open browser DevTools (F12)
2. Go to Performance tab
3. Open wizard modal
4. Check rendering performance

**Expected Results**:
- ✅ Modal opens in <200ms
- ✅ No layout shifts (CLS = 0)
- ✅ Smooth animations (60fps)
- ✅ No CSS recalculation spikes

---

### Test 10: CSS Inspection (Technical)
**Steps**:
1. Open wizard modal
2. Right-click modal surface → Inspect
3. Check Computed styles in DevTools

**Expected Results**:
- ✅ NO `!important` declarations in modal styles
- ✅ backdrop-filter applied to backdrop
- ✅ Proper z-index stacking
- ✅ Tokens applied correctly (check CSS custom properties)

---

## 🐛 Known Issues to Watch For

### Issue 1: Blue Background (Should be FIXED)
**Before Stage 2**: Solid blue/cyan background
**After Stage 2**: Transparent with blur
**If you see blue**: Screenshot and report

### Issue 2: Backdrop Not Blurring
**Symptoms**: Content behind modal is sharp/clear
**Cause**: Browser doesn't support backdrop-filter
**Solution**: Use Chrome/Edge/Safari (not Firefox <103)

### Issue 3: Purple Color Missing
**Symptoms**: Gray instead of purple
**Cause**: Design tokens not loading
**Check**: Console for errors

---

## 📸 Visual Comparison

### Modal Backdrop (CRITICAL TEST)

**BEFORE (Stage 1):**
```
┌─────────────────────────────────────────┐
│                                         │
│     Solid Blue/Cyan Background          │
│     (Blocking view completely)          │
│                                         │
│         [Wizard Content]                │
│                                         │
└─────────────────────────────────────────┘
```

**AFTER (Stage 2):**
```
┌─────────────────────────────────────────┐
│    [Blurred content behind visible]     │
│     Semi-transparent dark backdrop      │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │   White Glass Modal Surface       │  │
│  │   [Wizard Content - Clear]        │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

---

## ✅ Success Criteria

**Pass if**:
- [ ] Modal backdrop is blurred (not solid)
- [ ] Wizard background is transparent
- [ ] Purple glass aesthetic preserved
- [ ] No `!important` in computed styles
- [ ] All 10 tests pass

**Fail if**:
- [ ] Solid blue background still visible
- [ ] Backdrop is sharp (not blurred)
- [ ] Colors don't match design system
- [ ] Layout is broken
- [ ] Console has errors

---

## 🎬 Testing Session

**Tester**: _____________  
**Date**: October 17, 2025  
**Browser**: Chrome/Edge/Safari/Firefox  
**Screen Size**: Desktop / Tablet / Mobile  

### Test Results:

| Test # | Test Name | Pass/Fail | Notes |
|--------|-----------|-----------|-------|
| 1 | Modal Launch | ⬜ | |
| 2 | Backdrop Blur | ⬜ | |
| 3 | Content Background | ⬜ | |
| 4 | Purple Glass | ⬜ | |
| 5 | Typography | ⬜ | |
| 6 | Close Dialog | ⬜ | |
| 7 | Responsive | ⬜ | |
| 8 | Accessibility | ⬜ | |
| 9 | Performance | ⬜ | |
| 10 | CSS Inspection | ⬜ | |

### Screenshots:

1. **Modal Opened**: _____________
2. **Backdrop Close-up**: _____________
3. **Purple Elements**: _____________
4. **DevTools Inspection**: _____________

### Issues Found:

1. ___________________________________
2. ___________________________________
3. ___________________________________

### Overall Result:

- [ ] ✅ All tests passed - Ready for Stage 3
- [ ] ⚠️ Minor issues found - Fix before proceeding
- [ ] ❌ Major issues found - Rollback needed

---

**Next Steps After Testing**:
- If PASS: Commit fixes, proceed to Stage 3
- If FAIL: Debug issues, re-test
- Take screenshots for documentation

---

**Testing Time**: ~15-20 minutes  
**Priority**: HIGH (Stage 2 verification)  
**Status**: Ready to test 🚀

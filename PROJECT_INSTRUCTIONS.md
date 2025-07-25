# LCMDesigner - Project Instructions & Documentation

## 🚀 **Quick Start Commands**

### Development Server
```bash
cd /mnt/Mew2/DevApps/LCMDesigner/LCMDesigner
npm run dev
# Server runs on http://localhost:1420
# If port conflict, use: npx vite --port 1421
```

### Git Operations
```bash
# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push origin main

# Create new branch
git checkout -b feature/branch-name

# Merge to main
git checkout main
git merge feature/branch-name
```

## 🎨 **Design System Standards**

### **Core Principles**
- **Rainbow Slider Standard**: `CustomSlider` component with frosted glass thumb
- **Unified Dropdowns**: `.lcm-dropdown` class for all select elements
- **Standard Cards**: `.lcm-card` class for all card components
- **Consistent Inputs**: `.lcm-input` class for all input fields
- **Standard Buttons**: `.lcm-button` class for all buttons

### **CSS Classes to Use**
```css
/* Standard Classes - Always Use These */
.lcm-card         /* For all cards */
.lcm-dropdown     /* For all select/dropdown elements */
.lcm-input        /* For all input fields */
.lcm-button       /* For all buttons */
.lcm-slider       /* For all sliders (use CustomSlider component) */

/* CSS Custom Properties Available */
--lcm-primary: #8b5cf6
--lcm-bg-card: rgba(255,255,255,0.85)
--lcm-bg-dropdown: rgba(255,255,255,0.85)
--lcm-primary-border: rgba(139,92,246,0.2)
--lcm-backdrop-filter: blur(18px) saturate(180%)
```

## 📁 **Project Structure**

```
LCMDesigner/
├── src/
│   ├── components/
│   │   ├── CustomSlider.tsx          # STANDARD slider component
│   │   ├── NavigationSidebar.tsx     # Main navigation
│   │   ├── Tooltip.tsx              # Info tooltips
│   │   └── DesignSystem.tsx         # Design system components
│   ├── views/
│   │   ├── DashboardView.tsx        # Main dashboard
│   │   ├── LifecyclePlannerView.tsx # Lifecycle planning
│   │   ├── MigrationPlannerView.tsx # Migration wizard
│   │   ├── VendorDataCollectionView.tsx # Vendor hardware
│   │   └── SettingsView.tsx         # App settings
│   ├── store/
│   │   └── appStore.ts              # Global state management
│   ├── utils/
│   │   └── autoSave.ts              # Auto-save functionality
│   ├── fluent-enhancements.css      # CORE design system CSS
│   ├── index.css                    # Base styles
│   └── App.tsx                      # Main app component
├── core-engine/                     # Rust backend (Tauri)
├── src-tauri/                       # Tauri configuration
└── public/                          # Static assets
    ├── frosted-glass-slider-thumb.svg
    └── rainbow-slider-track.svg
```

## 🛠️ **Common Tasks**

### **Adding a New Component**
1. Create component in `/src/components/`
2. Use standard design system classes:
   ```tsx
   // Example component
   const MyComponent = () => (
     <div className="lcm-card p-6">
       <select className="lcm-dropdown">
         <option>Option 1</option>
       </select>
       <input className="lcm-input" type="text" />
       <button className="lcm-button">Action</button>
     </div>
   );
   ```

### **Using the Standard Slider**
```tsx
import CustomSlider from '../components/CustomSlider';

// In your component
<CustomSlider
  value={sliderValue}
  onChange={setSliderValue}
  min={0}
  max={100}
  step={1}
  label="Your Label"
/>
```

### **Adding a New View**
1. Create view in `/src/views/`
2. Import and add to `App.tsx`
3. Add navigation item in `NavigationSidebar.tsx`
4. Use standard classes throughout

## 🔧 **Development Guidelines**

### **DO's**
- ✅ Always use `.lcm-*` classes for styling
- ✅ Use `CustomSlider` for all sliders
- ✅ Import design system components from `DesignSystem.tsx`
- ✅ Use `fluent-enhancements.css` variables
- ✅ Test on both ports 1420 and 1421
- ✅ Commit frequently with descriptive messages

### **DON'Ts**
- ❌ Don't use inline styles (use classes instead)
- ❌ Don't create custom slider components (use CustomSlider)
- ❌ Don't use `fluent-card` (use `lcm-card`)
- ❌ Don't hardcode colors (use CSS variables)
- ❌ Don't skip the design system standards

## 🎯 **Recent Accomplishments**

### **Design System Implementation** ✅
- Created comprehensive design system with `DesignSystem.tsx`
- Updated all views to use standard classes:
  - VendorDataCollectionView: Updated dropdowns, inputs, and cards
  - MigrationPlannerView: Updated all 3 dropdowns and 2 cards
  - LifecyclePlannerView: Updated all 3 dropdowns and 2 cards
  - DashboardView: Updated all 4 cards
  - SettingsView: Updated dropdown and card

### **Component Standardization** ✅
- `CustomSlider`: Rainbow track with frosted glass thumb (THE standard)
- All dropdowns use `.lcm-dropdown` with glassmorphic styling
- All cards use `.lcm-card` with unified styling
- All inputs use `.lcm-input` for consistency

### **CSS Architecture** ✅
- Enhanced `fluent-enhancements.css` with CSS custom properties
- Added `!important` rules for proper override behavior
- Consistent Montserrat typography throughout
- Purple accent color (`#8b5cf6`) as primary brand color

## 🐛 **Troubleshooting**

### **Port Issues**
```bash
# If port 1420 is in use
npx vite --port 1421
# Or kill existing process
lsof -ti:1420 | xargs kill -9
```

### **CSS Not Applying**
1. Check if class name is correct (`.lcm-dropdown`, not `.lcm-select`)
2. Ensure `fluent-enhancements.css` is imported in `index.css`
3. Clear browser cache (Ctrl+Shift+R)
4. Check for CSS specificity conflicts

### **VS Code Crashes**
1. Save this file to desktop as backup: `PROJECT_INSTRUCTIONS.md`
2. Use auto-save: File > Auto Save
3. Commit changes frequently
4. Keep terminal commands in this file for reference

## 📋 **Checklists**

### **Before Making Changes**
- [ ] Pull latest from GitHub: `git pull origin main`
- [ ] Start dev server: `npm run dev`
- [ ] Check current branch: `git branch`

### **After Making Changes**
- [ ] Test in browser (check both desktop and mobile views)
- [ ] Verify design system standards are followed
- [ ] Check for console errors
- [ ] Commit changes: `git add . && git commit -m "Description"`
- [ ] Push to GitHub: `git push origin main`

### **Design System Verification**
- [ ] All dropdowns use `.lcm-dropdown`
- [ ] All cards use `.lcm-card`
- [ ] All inputs use `.lcm-input`
- [ ] All sliders use `CustomSlider` component
- [ ] No inline styles (except for specific cases)
- [ ] Consistent purple branding throughout

## 🔗 **Important File Locations**

### **Key Files to Remember**
- `/src/fluent-enhancements.css` - Core design system CSS
- `/src/components/CustomSlider.tsx` - Standard slider component
- `/src/components/DesignSystem.tsx` - Design system components
- `/src/views/VendorDataCollectionView.tsx` - Current working file
- `/package.json` - Dependencies and scripts
- `/vite.config.ts` - Vite configuration

### **Auto-Generated Files (Don't Edit)**
- `/target/` - Rust build artifacts
- `/node_modules/` - NPM dependencies
- `/dist/` - Build output

## 🚨 **Emergency Commands**

### **If Everything Breaks**
```bash
# Reset to last working state
git status
git stash  # Save current work
git reset --hard HEAD~1  # Go back one commit
git stash pop  # Restore your work

# Clean reinstall
rm -rf node_modules
rm package-lock.json
npm install
npm run dev
```

### **If Git Issues**
```bash
# Force push (use carefully)
git push --force-with-lease origin main

# Reset to remote
git fetch origin
git reset --hard origin/main
```

---

## 📝 **Notes Section** (Edit as needed)

### **Current Session Goals**
- [ ] 
- [ ] 
- [ ] 

### **Issues to Fix**
- [ ] 
- [ ] 
- [ ] 

### **Ideas for Future**
- [ ] 
- [ ] 
- [ ] 

---

**Last Updated**: July 25, 2025
**Author**: GitHub Copilot + User Collaboration
**Version**: 1.0

*Keep this file open in a separate tab or save to desktop for quick reference!*

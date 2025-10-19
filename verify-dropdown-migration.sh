#!/bin/bash
# Activity Wizard Dropdown Migration Verification Script
# Verifies all dropdowns have been migrated to PurpleGlassDropdown

set -e

echo "==============================================="
echo "Activity Wizard Dropdown Migration Verification"
echo "==============================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED=0

# Check 1: Verify PurpleGlassDropdown imports exist
echo "Check 1: Verifying PurpleGlassDropdown imports..."
FILES=(
  "frontend/src/components/ActivityCreationWizard.tsx"
  "frontend/src/components/CreateActivityFormFixed.tsx"
  "frontend/src/components/Activity/ActivityWizard/Steps/Step2_SourceDestination.tsx"
  "frontend/src/components/Activity/ActivityWizard/Steps/Step3_Infrastructure.tsx"
  "frontend/src/components/Activity/ActivityWizard/Steps/Step6_Assignment.tsx"
)

for file in "${FILES[@]}"; do
  if grep -q "import.*PurpleGlassDropdown" "$file"; then
    echo -e "${GREEN}✓${NC} $file has PurpleGlassDropdown import"
  else
    echo -e "${RED}✗${NC} $file missing PurpleGlassDropdown import"
    FAILED=1
  fi
done
echo ""

# Check 2: Verify no Fluent Dropdown/Combobox imports remain
echo "Check 2: Verifying no Fluent Dropdown/Combobox imports remain..."
FLUENT_IMPORTS=$(grep -l "import.*\(Dropdown\|Combobox\|Option\).*from '@fluentui" "${FILES[@]}" 2>/dev/null || true)

if [ -z "$FLUENT_IMPORTS" ]; then
  echo -e "${GREEN}✓${NC} No Fluent Dropdown/Combobox imports found"
else
  echo -e "${RED}✗${NC} Fluent imports still exist in:"
  echo "$FLUENT_IMPORTS"
  FAILED=1
fi
echo ""

# Check 3: Count migrated dropdowns
echo "Check 3: Counting migrated dropdown instances..."
DROPDOWN_COUNT=$(grep -o "PurpleGlassDropdown" "${FILES[@]}" | wc -l)
echo -e "${GREEN}✓${NC} Found $DROPDOWN_COUNT PurpleGlassDropdown instances"
echo "  Expected: 9 instances (2+2+3+1+1)"
if [ "$DROPDOWN_COUNT" -lt 9 ]; then
  echo -e "${YELLOW}⚠${NC} Warning: Expected at least 9 instances"
fi
echo ""

# Check 4: TypeScript compilation
echo "Check 4: Running TypeScript type check..."
cd frontend
if npm run type-check > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} TypeScript compilation successful"
else
  echo -e "${RED}✗${NC} TypeScript compilation failed"
  FAILED=1
fi
cd ..
echo ""

# Check 5: Verify glass prop usage
echo "Check 5: Verifying glass prop usage..."
GLASS_PROP_COUNT=$(grep -o 'glass="light"' "${FILES[@]}" | wc -l)
echo -e "${GREEN}✓${NC} Found $GLASS_PROP_COUNT dropdowns with glass prop"
if [ "$GLASS_PROP_COUNT" -ne "$DROPDOWN_COUNT" ]; then
  echo -e "${YELLOW}⚠${NC} Note: Not all dropdowns use glass prop"
fi
echo ""

# Check 6: Verify no obsolete CSS classes
echo "Check 6: Checking for obsolete CSS classes..."
OBSOLETE_CLASSES=$(grep -o "\.lcm-dropdown" "${FILES[@]}" 2>/dev/null || true)
if [ -z "$OBSOLETE_CLASSES" ]; then
  echo -e "${GREEN}✓${NC} No obsolete .lcm-dropdown classes found"
else
  echo -e "${YELLOW}⚠${NC} Found obsolete .lcm-dropdown classes"
fi
echo ""

# Final summary
echo "==============================================="
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed!${NC}"
  echo "Migration verified successfully."
  exit 0
else
  echo -e "${RED}✗ Some checks failed.${NC}"
  echo "Please review the errors above."
  exit 1
fi

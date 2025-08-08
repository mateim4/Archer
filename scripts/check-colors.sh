#!/bin/bash

# LCM Designer - Color Consistency Checker
# This script helps identify remaining instances of old pink colors

echo "🔍 Checking for remaining pink colors in LCM Designer..."
echo "=================================================="

echo ""
echo "1. Searching for hex color #ec4899 (old pink):"
grep -rn "#ec4899" frontend/src/ --include="*.tsx" --include="*.ts" --include="*.css" | head -10

echo ""
echo "2. Searching for RGB values 236, 72, 153 (old pink):"
grep -rn "236.*72.*153" frontend/src/ --include="*.tsx" --include="*.ts" --include="*.css" | head -10

echo ""
echo "3. Searching for 'pink' in color names:"
grep -rn -i "pink" frontend/src/ --include="*.tsx" --include="*.ts" --include="*.css" | head -5

echo ""
echo "4. Files that still need updating:"
FILES_WITH_PINK=$(grep -l "#ec4899\|236.*72.*153" frontend/src/**/*.{tsx,ts,css} 2>/dev/null | wc -l)
echo "Total files with old pink colors: $FILES_WITH_PINK"

if [ "$FILES_WITH_PINK" -gt 0 ]; then
    echo ""
    echo "📝 Files to update:"
    grep -l "#ec4899\|236.*72.*153" frontend/src/**/*.{tsx,ts,css} 2>/dev/null | head -10
    echo ""
    echo "💡 Recommended replacements:"
    echo "   #ec4899 → #6366f1 (indigo)"
    echo "   rgba(236, 72, 153, X) → rgba(99, 102, 241, X)"
    echo "   236, 72, 153 → 99, 102, 241"
else
    echo "✅ No old pink colors found!"
fi

echo ""
echo "5. Checking for consistent brand colors:"
NEW_COLORS=$(grep -rn "#8b5cf6\|#6366f1\|139.*92.*246\|99.*102.*241" frontend/src/ --include="*.tsx" --include="*.ts" --include="*.css" | wc -l)
echo "Files using new brand colors: $NEW_COLORS"

echo ""
echo "🎨 Color consistency check complete!"

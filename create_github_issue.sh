#!/bin/bash

# GitHub Issue Creation Script
# This script helps create the GitHub issue for Gemini Research Integration

echo "🚀 GitHub Issue Creation Helper"
echo "================================="
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "   Install with: sudo apt install gh"
    echo "   Or visit: https://cli.github.com/"
    echo ""
    echo "📋 Manual Issue Creation:"
    echo "   1. Go to: https://github.com/mateim4/LCMDesigner/issues/new"
    echo "   2. Copy content from: github_issue_gemini_research.md"
    echo "   3. Set title: 🔬 Implement Gemini AI Research Integration for Comprehensive Server Hardware Specifications"
    echo "   4. Add labels: enhancement, research, ai-integration, database, specifications, high-priority"
    exit 1
fi

# Check if logged into GitHub
if ! gh auth status &> /dev/null; then
    echo "🔐 Please login to GitHub CLI:"
    echo "   gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is ready"
echo ""

# Get issue content
ISSUE_FILE="github_issue_gemini_research.md"

if [[ ! -f "$ISSUE_FILE" ]]; then
    echo "❌ Issue file not found: $ISSUE_FILE"
    exit 1
fi

echo "📄 Issue content loaded from: $ISSUE_FILE"
echo ""

# Extract title and content
TITLE="🔬 Implement Gemini AI Research Integration for Comprehensive Server Hardware Specifications"
LABELS="enhancement,research,ai-integration,database,specifications,high-priority"

echo "🏷️  Title: $TITLE"
echo "📋 Labels: $LABELS"
echo ""

# Confirm creation
read -p "🔸 Create GitHub issue? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Creating GitHub issue..."
    
    # Create the issue
    if gh issue create \
        --title "$TITLE" \
        --body-file "$ISSUE_FILE" \
        --label "$LABELS"; then
        
        echo ""
        echo "✅ GitHub issue created successfully!"
        echo ""
        echo "🔗 You can view it at:"
        gh issue list --limit 1 --json url --jq '.[0].url'
        
    else
        echo ""
        echo "❌ Failed to create GitHub issue"
        echo "   You can create it manually using the content from: $ISSUE_FILE"
    fi
else
    echo "🔸 Issue creation cancelled"
    echo ""
    echo "📋 To create manually:"
    echo "   1. Go to: https://github.com/mateim4/LCMDesigner/issues/new"
    echo "   2. Copy content from: $ISSUE_FILE" 
    echo "   3. Set title: $TITLE"
    echo "   4. Add labels: $LABELS"
fi

echo ""
echo "📊 Current Project Status:"
echo "   ✅ Modal fixes implemented"
echo "   ✅ Dell extensions synthesis working"  
echo "   ✅ Lenovo client-side enhancement active"
echo "   ✅ Gemini research framework complete"
echo "   ⏳ Awaiting Gemini research execution"
echo "   ⏳ Database persistence pending"

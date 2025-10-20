---
name: "DS-07: Migrate Data Visualization Components (Gantt, Capacity)"
about: Refactor EnhancedGanttChart and CapacityVisualizer to use design tokens
title: "[DS-07] Migrate Data Visualization Components (Gantt, Capacity)"
labels: ["design-system", "refactor", "priority-medium", "ai-agent-ready"]
assignees: ""
---

## 🎯 Objective
Migrate data visualization components (Gantt chart, Capacity visualizers) to use centralized design tokens for consistency.

## 📋 Problem Statement
**Current State:**
- EnhancedGanttChart: 6+ hardcoded fontFamily declarations
- CapacityCanvas: Multiple hardcoded font references
- SimpleVisualizer: Inconsistent font usage
- Hardcoded Gantt status colors

## 📖 Coding Guidelines
Follow `.github/instructions/LCMDesigner_Code_Instructions_Generic.instructions.md`

## 🔧 Requirements
1. Replace all fontFamily with tokens.typography.fontFamilyBody
2. Replace Gantt status colors with tokens.semanticColors
3. Standardize visualization text styling

## 📁 Files to Modify
- frontend/src/components/EnhancedGanttChart.tsx
- frontend/src/components/CapacityVisualizer/CapacityCanvas.tsx
- frontend/src/components/CapacityVisualizer/SimpleVisualizer.tsx

## ✅ Acceptance Criteria
- [ ] All hardcoded fonts replaced
- [ ] Gantt status colors use semantic tokens
- [ ] Charts render correctly
- [ ] No visual regressions

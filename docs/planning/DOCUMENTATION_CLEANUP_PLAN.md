# Archer Documentation Cleanup Plan

**Created:** December 8, 2025  
**Purpose:** Consolidate and organize 200+ markdown files into a maintainable structure

---

## Executive Summary

The Archer repository has accumulated **~150 markdown files** in the root directory alone, plus additional files in subdirectories. Many are:
- Session summaries that served their purpose
- Completion reports for finished tasks
- Duplicate content across multiple files
- Outdated plans that have been superseded

This document outlines a cleanup strategy to consolidate documentation while **preserving valuable research and architectural decisions**.

---

## Current State Analysis

### Documentation Categories Found

| Category | Count | Action |
|----------|-------|--------|
| **Session/Progress Reports** | ~40 | Archive |
| **Completion Summaries** | ~25 | Archive |
| **Testing Guides** | ~15 | Consolidate |
| **Migration/Refactoring Plans** | ~20 | Archive (completed) |
| **Design System Docs** | ~10 | Keep (consolidate) |
| **Architecture Docs** | ~15 | Keep (canonical) |
| **API/Specs** | ~10 | Keep |
| **UX/UI Analysis** | ~15 | Keep (consolidate) |

### Root Directory Clutter

Files that should NOT be in root:
- `*_COMPLETION_SUMMARY.md` → Archive
- `*_PROGRESS_REPORT.md` → Archive
- `*_FIX_SUMMARY.md` → Archive
- `PHASE_*_*.md` → Archive
- `STAGE*_*.md` → Archive
- `TASK_*_*.md` → Archive
- `ISSUE_*_*.md` → Archive
- `WEEK_*_*.md` → Archive

---

## Proposed Documentation Structure

```
docs/
├── README.md                    # Documentation index
├── architecture/                # Canonical architecture docs
│   ├── 00_Strategy_and_Planning/
│   ├── 01_Architecture/
│   ├── 02_Implementation/
│   ├── 03_UX_and_Design/
│   ├── 04_Competitive_Analysis/
│   ├── specs/
│   └── Archive/
├── design/                      # Design system docs
│   ├── DESIGN_SYSTEM.md
│   ├── COMPONENT_LIBRARY.md
│   └── TOKENS.md
├── development/                 # Dev guides
│   ├── onboarding.md
│   ├── architecture.md
│   └── troubleshooting.md
├── planning/                    # Strategic planning
│   ├── CMO_FMO_GAP_ANALYSIS.md
│   ├── E2E_DEVELOPMENT_PLAN.md
│   └── ROADMAP.md
├── research/                    # Research prompts & outputs
│   └── PERPLEXITY_CORE_ITSM_ARCHITECTURE_PROMPT.md
├── testing/                     # Testing documentation
│   └── TESTING_GUIDE.md
└── archive/                     # Historical docs (reference only)
    ├── session_summaries/
    ├── completion_reports/
    └── legacy_plans/

# Root directory (minimal)
├── README.md                    # Project overview
├── CLAUDE.md                    # AI agent context
├── STARTUP.md                   # Quick start
└── CONTRIBUTING.md              # Contribution guidelines
```

---

## Files to Keep in Root

| File | Reason |
|------|--------|
| `README.md` | Project landing page |
| `CLAUDE.md` | AI agent context (critical) |
| `STARTUP.md` | Quick start guide |
| `Cargo.toml` | Rust workspace |
| `.gitignore` | Git config |

---

## Files to Move to `docs/archive/`

### Session Summaries (40+ files)
```
AUTONOMOUS_WORK_SESSION_SUMMARY.md
DEVELOPMENT_CONTINUATION_SUMMARY.md
DEVELOPMENT_SESSION_SUMMARY_2025-11-11.md
COPILOT_PROGRESS_REPORT.md
GITHUB_ISSUES_PROGRESS_REPORT.md
IMPLEMENTATION_PROGRESS_REPORT.md
REFACTORING_PROGRESS_REPORT.md
TASK_1_PROGRESS_REPORT.md
ISSUE_7_PROGRESS.md
ISSUE_87_COMPLETION_SUMMARY.md
ISSUE_88_PROGRESS_REPORT.md
```

### Completion Reports (25+ files)
```
ACTIVITY_DRIVEN_MIGRATION_COMPLETE.md
ACTIVITY_WIZARD_COMPLETE.md
API_ENDPOINTS_IMPLEMENTATION_COMPLETE.md
COMPILATION_FIX_COMPLETE_SUMMARY.md
DS01_IMPLEMENTATION_COMPLETE.md
DS02_IMPLEMENTATION_COMPLETE.md
DS03_IMPLEMENTATION_COMPLETE.md
FLUENT2_IMPLEMENTATION_SUMMARY.md
FRONTEND_API_INTEGRATION_COMPLETE.md
MIGRATION_PLATFORM_SUCCESS.md
OPTIONS_123_COMPLETION_SUMMARY.md
PHASE_1_COMPLETION_SUMMARY.md
PHASE_2_FRONTEND_COMPLETION_SUMMARY.md
PRIORITY_IMPLEMENTATIONS_COMPLETE.md
SECOND_ITERATION_IMPLEMENTATION_COMPLETE.md
TESTING_INFRASTRUCTURE_COMPLETE.md
WIZARD_TESTING_COMPLETE.md
```

### Outdated Plans (20+ files)
```
ACTIVITY_DRIVEN_MIGRATION_PLAN.md
ACTIVITY_WIZARD_INTEGRATION_PLAN.md
ACTIVITY_WIZARD_MODAL_CONVERSION_PLAN.md
CARD_HEADER_STANDARDIZATION_PLAN.md
GLOBAL_REFACTORING_PLAN.md
HLD_GENERATION_5_WEEK_PLAN.md
INFRA_VISUALIZER_INTEGRATION_PLAN.md
MIGRATION_DEVELOPMENT_PLAN.md
REFACTORING_IMPLEMENTATION_PLAN.md
STAGE_3_WIZARD_REFACTORING_PLAN.md
STAGE5_LAYOUT_NORMALIZATION_PLAN.md
STEP_4_UI_IMPLEMENTATION_PLAN.md
UI_OVERHAUL_PLAN.md
```

### Fix/Debug Summaries
```
COMPILATION_FIX_SUMMARY.md
COMPILATION_STATUS_REPORT.md
DESIGN_SYSTEM_ALIGNMENT_FIXES.md
DESIGN_SYSTEM_REFACTOR_ISSUES.md
FIXES_SUMMARY.md
HARDWARE_BASKET_FIX_SUMMARY.md
HARDWARE_POOL_FIX_SUMMARY.md
NUCLEAR_FIX.md
UPLOAD_LAYOUT_FIX_SUMMARY.md
```

---

## Files to Consolidate

### Testing Documentation → `docs/testing/TESTING_GUIDE.md`
Merge:
- `COMPREHENSIVE_TESTING_FRAMEWORK.md`
- `COMPREHENSIVE_TESTING_PLAN_V2.md`
- `EXTENSIVE_TESTING_PLAN.md`
- `FRONTEND_TESTING_GUIDE.md`
- `MANUAL_INTEGRATION_TESTING.md`
- `QUICK_START_UI_TESTING.md`
- `TESTING_GUIDE.md`
- `WIZARD_E2E_TESTING_GUIDE.md`

### Design System → `docs/design/DESIGN_SYSTEM.md`
Merge:
- `DESIGN_TOKEN_DOCUMENTATION.md`
- `COMPONENT_LIBRARY_GUIDE.md`
- `docs/FLUENT2_DESIGN_SYSTEM.md`
- `docs/design/DESIGN_SYSTEM.md`
- `BUTTON_STYLING_GUIDE.md`
- `GLASSMORPHIC_FILTER_STANDARD.md`
- `SELECTION_CARD_DESIGN_STANDARD.md`

### UX Documentation → `docs/architecture/03_UX_and_Design/`
Keep:
- `00_UX_and_IA_Recommendations.md` (4700 lines - comprehensive)
Archive:
- `UI_UX_COMPREHENSIVE_REVIEW.md`
- `UI_UX_REVIEW_REPORT.md`
- `UX_ANALYSIS_COMPLETE_SUMMARY.md`
- `UX_ARCHITECTURE_COMPREHENSIVE_ANALYSIS.md`
- `UX_AUDIT_*.md` (multiple files)
- `UX_IMPROVEMENTS_*.md` (multiple files)

### Migration/Wizard Docs → Archive
These document completed features:
- `MIGRATION_HUB_*.md` (7 files)
- `MIGRATION_WIZARD_*.md` (3 files)
- `WIZARD_*.md` (6 files)

---

## Files to Keep (Canonical)

### Architecture (docs/architecture/)
- `00_Strategy_and_Planning/*` ✅
- `01_Architecture/*` ✅
- `02_Implementation/*` ✅
- `03_UX_and_Design/*` ✅
- `04_Competitive_Analysis/*` ✅
- `AI_INTEGRATION_SPEC.md` ✅
- `specs/PYTHON_AI_SIDECAR_SPEC.md` ✅
- `specs/SURREALDB_AI_SCHEMA_SPEC.md` ✅

### Planning (docs/planning/)
- `CMO_FMO_GAP_ANALYSIS.md` ✅
- `E2E_DEVELOPMENT_PLAN.md` ✅

### Specifications
- `docs/ITSM_PLATFORM_SPECIFICATION.md` ✅
- `docs/PORT_CONFIGURATION.md` ✅

### Product Documentation (product_docs/)
- `01_DATA_MODEL_AND_APP_DESIGN.md` ✅
- `04_PRODUCT_ROADMAP.md` ✅
- `05_FEATURES_AND_BUSINESS_DRIVERS.md` ✅

---

## Execution Plan

### Phase 1: Create Archive Structure
```bash
mkdir -p docs/archive/session_summaries
mkdir -p docs/archive/completion_reports
mkdir -p docs/archive/legacy_plans
mkdir -p docs/archive/ux_audits
mkdir -p docs/archive/migration_docs
```

### Phase 2: Move Files to Archive
Move all `*_SUMMARY.md`, `*_COMPLETE.md`, `*_PROGRESS.md` files

### Phase 3: Consolidate Testing Docs
Merge 8+ testing files into single `docs/testing/TESTING_GUIDE.md`

### Phase 4: Consolidate Design Docs
Merge design system files into `docs/design/`

### Phase 5: Update References
- Update `CLAUDE.md` to point to new locations
- Update `README.md` with documentation map
- Create `docs/README.md` as documentation index

### Phase 6: Delete Redundant Files
After confirming archive is complete, remove duplicates

---

## Documentation Index (To Create)

Create `docs/README.md` with:

```markdown
# Archer Documentation

## Quick Links
- [Project README](../README.md)
- [Quick Start](../STARTUP.md)
- [AI Agent Context](../CLAUDE.md)

## Architecture
- [Executive Summary](architecture/00_Strategy_and_Planning/00_Executive_Summary.md)
- [System Architecture](architecture/01_Architecture/01_Comprehensive_Architecture.md)
- [ITSM Platform Spec](ITSM_PLATFORM_SPECIFICATION.md)
- [Gap Analysis](planning/CMO_FMO_GAP_ANALYSIS.md)
- [Development Plan](planning/E2E_DEVELOPMENT_PLAN.md)

## Design System
- [Design System Guide](design/DESIGN_SYSTEM.md)
- [Component Library](design/COMPONENT_LIBRARY.md)

## Development
- [Onboarding](development/onboarding.md)
- [Testing Guide](testing/TESTING_GUIDE.md)

## Research
- [Perplexity Research Prompt](research/PERPLEXITY_CORE_ITSM_ARCHITECTURE_PROMPT.md)

## Archive
Historical documentation preserved for reference in `archive/`
```

---

## Estimated Impact

| Metric | Before | After |
|--------|--------|-------|
| Root .md files | ~150 | ~5 |
| Total .md files | ~200 | ~50 active + archive |
| Duplicate content | High | Eliminated |
| Findability | Poor | Indexed |

---

## Next Steps

1. **Review this plan** with stakeholder
2. **Execute Phase 1-2** (create structure, move files)
3. **Execute Phase 3-4** (consolidation)
4. **Execute Phase 5** (update references)
5. **Commit** with descriptive message

**Do you want me to execute this cleanup now?**

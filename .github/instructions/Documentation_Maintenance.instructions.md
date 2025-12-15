---
applyTo: '**'
---
# Archer Documentation Maintenance Protocol

**Last Updated:** December 15, 2025

## Overview
This document defines how AI agents and developers must maintain Archer's documentation ecosystem. The goal is to ensure **continuity across AI sessions**, **sync between Obsidian and GitHub**, and **accurate representation of project state**.

---

## 🏛️ Architectural Principle: Core ITSM vs AI Module

**CRITICAL:** Archer has a clear architectural separation:

| Domain | Scope | Documentation Location |
|--------|-------|------------------------|
| **Core ITSM** | Service Desk, CMDB, Monitoring, Workflows, RBAC, KB, Catalog, Reports | `docs/specs/FULLSTACK_DEVELOPMENT_PLAN.md` |
| **AI Module** | LLM Gateway, Agents, RAG, Suggestions, Autonomous Ops | `docs/architecture/01_Architecture/` |

**Rule:** Core ITSM must work standalone. AI is an optional enhancement. Keep documentation for each domain clearly separated.

---

## 📁 Documentation Structure (December 2025)

```
Archer/
├── README.md                        # Project landing page
├── CLAUDE.md                        # AI agent context (critical)
├── STARTUP.md                       # Quick start guide
├── COMPONENT_LIBRARY_GUIDE.md       # UI component API
├── DESIGN_TOKEN_DOCUMENTATION.md    # Design tokens
├── TESTING_GUIDE.md                 # Testing documentation
├── DEPENDENCIES.md                  # Project dependencies
├── DEPLOYMENT_INSTRUCTIONS.md       # Deployment guide
│
└── docs/
    ├── README.md                    # Documentation index
    ├── planning/                    # Strategic planning
    │   ├── CMO_FMO_GAP_ANALYSIS.md     # Current vs Future state
    │   ├── DELTA_TRACKING.md           # Cross-session change log
    │   ├── E2E_DEVELOPMENT_PLAN.md     # Implementation roadmap
    │   └── PRODUCT_ROADMAP.pdf         # Visual roadmap
    ├── specs/                       # Technical specifications
    │   ├── CORE_ITSM_ARCHITECTURE.md   # Core ITSM (non-AI)
    │   ├── FULLSTACK_DEVELOPMENT_PLAN.md
    │   ├── PYTHON_AI_SIDECAR_SPEC.md   # AI sidecar design
    │   └── SURREALDB_AI_SCHEMA_SPEC.md # AI schema extensions
    ├── architecture/                # Strategic & AI architecture
    │   ├── 00_Strategy_and_Planning/   # Business case, vision
    │   ├── 01_Architecture/            # AI engine specs
    │   ├── 02_Implementation/          # Coding guides
    │   ├── 03_UX_and_Design/           # UX specifications
    │   ├── 04_Competitive_Analysis/    # Market positioning
    │   └── Archive/                    # Historical reference
    ├── development/                 # Developer guides
    │   ├── architecture.md             # System design patterns
    │   ├── components.md               # React components
    │   ├── onboarding.md               # Developer setup
    │   └── troubleshooting.md          # Common issues
    ├── design/                      # UI/UX documentation
    │   ├── DESIGN_SYSTEM.md            # Design system guide
    │   ├── NETWORK_DIAGRAM_COLOR_SYSTEM.md
    │   └── QUICK_START.md              # Fast setup
    ├── api/                         # API documentation
    │   ├── authentication.md           # Auth implementation
    │   └── openapi.yml                 # API specification
    ├── research/                    # Research prompts & outputs
    ├── testing/                     # Testing documentation
    │   └── PRE_MERGE_CHECKLIST.md      # QA checklist
    └── archive/                     # Historical docs (reference only)
        ├── session_summaries/
        ├── completion_reports/
        ├── legacy_plans/
        ├── testing_guides/
        └── migration_docs/
```

---

## 📋 Primary Documents (MUST MAINTAIN)

These documents are the source of truth and must be kept current:

| Document | Location | Purpose | Update Frequency |
|----------|----------|---------|------------------|
| **DELTA_TRACKING.md** | `docs/planning/` | Cross-session change log | **EVERY SESSION** |
| **CMO_FMO_GAP_ANALYSIS.md** | `docs/planning/` | Current vs target state | Feature completions |
| **E2E_DEVELOPMENT_PLAN.md** | `docs/planning/` | Sprint-level implementation | Sprint completions |
| **FULLSTACK_DEVELOPMENT_PLAN.md** | `docs/specs/` | Technical architecture, schemas, APIs | Architecture changes |
| **docs/README.md** | `docs/` | Documentation index | Structure changes |

---

## ⚠️ MANDATORY: Delta Tracking Protocol

**ALL AI agents MUST follow this protocol for cross-session continuity:**

### At Session Start
1. **Read `docs/planning/DELTA_TRACKING.md` FIRST**
2. Review "Current Session Changes" section
3. Check "Critical Technical Notes" for known issues
4. Understand recent changes from "Completed Changes Log"

### During Session
- Log significant changes in "Current Session Changes" section
- Include: timestamp, files affected, description, rationale

### At Session End
1. Move entries to "Completed Changes Log" with full details
2. Update "Project Status Summary" if milestones changed
3. Clear "Current Session Changes" section

### Change Entry Format
```markdown
### [YYYY-MM-DD HH:MM] - Brief Title
**Type:** Feature | Bugfix | Documentation | Refactor | Architecture
**Files Changed:**
- path/to/file1.ext
**Description:** What was changed and why
**Impact:** What this affects
```

**Failure to maintain delta tracking breaks cross-session continuity and will cause work to be lost or duplicated.**

---

## 📍 Documentation Sources (Single Source of Truth)

### Primary Source: Obsidian Vault
**Location:** `C:\Users\matei\Documents\Obsidian Vault\Projects\🏹 Archer\`

This is the **canonical source** for strategic, architectural, and research documentation. The Obsidian structure mirrors `docs/architecture/`:

```
🏹 Archer/
├── 00_Strategy_and_Planning/     # Business case, roadmap, prioritization
├── 01_Architecture/              # Technical architecture specs (AI-focused)
├── 02_Implementation/            # Coding guides and dev roadmaps
├── 03_UX_and_Design/             # UI/UX specifications
├── 04_Competitive_Analysis/      # Market research
├── Archive/                      # Deprecated/superseded docs
└── Research Report - Archer AI Engine (2025).md
```

### Repository Documentation
**Location:** `c:\Users\matei\DevApps\Archer\docs\`

| Folder | Purpose | Contents |
|--------|---------|----------|
| `planning/` | Strategic planning | Gap analysis, dev plans, delta tracking |
| `specs/` | Technical specs | Core ITSM architecture, AI sidecar specs |
| `architecture/` | Synced from Obsidian | AI architecture, strategy docs |
| `development/` | Developer guides | Onboarding, architecture, troubleshooting |
| `design/` | UI/UX docs | Design system, color schemes |
| `api/` | API docs | Auth guide, OpenAPI spec |
| `research/` | Research prompts | Architecture research prompts |
| `testing/` | QA docs | Pre-merge checklist |
| `archive/` | Historical reference | Old session docs, legacy plans |

### Root Directory Files (Keep Minimal)

| File | Purpose |
|------|---------|
| `README.md` | Project landing page |
| `CLAUDE.md` | AI agent context (critical) |
| `STARTUP.md` | Quick start guide |
| `COMPONENT_LIBRARY_GUIDE.md` | UI component API |
| `DESIGN_TOKEN_DOCUMENTATION.md` | Design tokens |
| `TESTING_GUIDE.md` | Testing documentation |
| `DEPENDENCIES.md` | Project dependencies |
| `DEPLOYMENT_INSTRUCTIONS.md` | Deployment guide |

---

## 🔄 Sync Strategy

### Obsidian → Repository
Strategic/architectural docs from Obsidian are synced to `docs/architecture/`:

1. **README.md** summarizes the vision from `00_Executive_Summary.md`
2. **Architecture diagrams** are exported and placed in `docs/architecture/`
3. **AI agents** should read Obsidian docs via `docs/architecture/` folder

### Manual Sync Process
```powershell
# Copy latest Obsidian docs to repo for AI agent access
$obsidianPath = "C:\Users\matei\Documents\Obsidian Vault\Projects\🏹 Archer"
xcopy "$obsidianPath\*" "C:\Users\matei\DevApps\Archer\docs\architecture\" /E /I /Y
```

---

## 📝 Documentation Update Rules

### When to Update Documentation

| Event | Documents to Update |
|-------|---------------------|
| New feature implemented | `docs/README.md`, relevant guide |
| Architecture decision | `docs/architecture/` or Obsidian |
| UI component added | `COMPONENT_LIBRARY_GUIDE.md` |
| API endpoint added | `docs/api/` |
| Major milestone reached | `README.md` roadmap section |
| AI capability added | `docs/architecture/01_Architecture/` |

### Forbidden Documentation Practices

❌ **DO NOT create these in root directory:**
- `*_COMPLETION_SUMMARY.md`
- `*_PROGRESS_REPORT.md`
- `*_SESSION_SUMMARY.md`
- `*_FIX_SUMMARY.md`
- Temporary Python analysis scripts
- Test result JSON files

✅ **Instead:**
- Update existing canonical docs
- Use `docs/planning/DELTA_TRACKING.md` for session notes
- Move completed work notes to `docs/archive/` if valuable

---

## 🤖 AI Agent Context Protocol

### At Session Start
AI agents should:
1. Read `CLAUDE.md` for project context
2. Read `.github/instructions/*.instructions.md` for behavior rules
3. Check `docs/README.md` for documentation index
4. If architecture questions arise, access `docs/architecture/`

### Before Making Changes
1. **Check current state** - Don't assume from old context
2. **Verify file locations** - Use `list_dir` and `file_search`
3. **Read relevant docs** - Understand existing patterns

### After Making Changes
1. **Update DELTA_TRACKING.md** with session changes
2. **Update README.md** if user-facing features changed
3. **Commit with descriptive messages** following pattern:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation only
   - `refactor:` - Code restructure
   - `chore:` - Maintenance

### Session Handoff
When ending a session or before a long task:
1. **Summarize progress** in conversation
2. **Update DELTA_TRACKING.md** so next agent can continue
3. **List pending items** clearly

---

## 📊 Current State Summary (December 2025)

### What's Built
- **Frontend:** React + TypeScript + Vite (port 1420)
  - Purple Glass design system
  - Project management views
  - Hardware basket management
  - Dark/light mode with CSS variables
  
- **Backend:** Rust + Axum (port 3001)
  - SurrealDB integration
  - Ticket CRUD API
  - Project/Activity management
  - Hardware parsing (Dell, Lenovo)

- **Design System:** Fluent UI 2 + Purple Glass
  - Glassmorphic aesthetic
  - 100% design token based
  - Responsive breakpoints

### What's Planned (AI Engine)
- **Phase 1:** RAG system, Librarian Agent, basic knowledge Q&A
- **Phase 2:** Ticket Assistant, Monitoring Analyst, LLM gateway
- **Phase 3:** Operations Agent, autonomous actions with human-in-the-loop

---

## 🔗 Key Document Links

### Repository (Implementation)
- Quick Start: `README.md`
- Components: `COMPONENT_LIBRARY_GUIDE.md`
- Design Tokens: `DESIGN_TOKEN_DOCUMENTATION.md`
- API Docs: `docs/api/`
- Dev Guides: `docs/development/`

### Architecture (Strategic)
- Vision: `docs/architecture/00_Strategy_and_Planning/00_Executive_Summary.md`
- AI Spec: `docs/architecture/01_Architecture/00_AI_Engine_Specification.md`
- Implementation: `docs/architecture/02_Implementation/00_Coding_Implementation_Guide.md`
- Competitors: `docs/architecture/04_Competitive_Analysis/00_Competitive_Analysis_Matrix.md`

---

## ⚠️ Common Pitfalls

1. **Don't create summary files in root** - Update existing docs or use DELTA_TRACKING
2. **Don't let README get stale** - Update after each feature
3. **Don't skip DELTA_TRACKING updates** - It's the cross-session memory
4. **Don't create temp Python scripts in root** - Use `scripts/` folder
5. **Don't duplicate content** - Cross-reference instead

---

## 📋 Maintenance Checklist

Weekly:
- [ ] Sync Obsidian → `docs/architecture/` if changes were made
- [ ] Verify docs/README.md is current
- [ ] Clean up any temp files that crept into root

After Major Features:
- [ ] Update README.md current features section
- [ ] Update COMPONENT_LIBRARY_GUIDE.md if UI components added
- [ ] Update architecture docs if patterns changed
- [ ] Commit and push all doc changes

Before AI Session:
- [ ] Pull latest from main
- [ ] Read DELTA_TRACKING.md for recent changes
- [ ] Check for any WIP markers or TODOs in code

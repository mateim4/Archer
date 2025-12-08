---
applyTo: '**'
---
# Archer Documentation Maintenance Protocol

## Overview
This document defines how AI agents and developers must maintain Archer's documentation ecosystem. The goal is to ensure **continuity across AI sessions**, **sync between Obsidian and GitHub**, and **accurate representation of project state**.

---

## 📍 Documentation Sources (Single Source of Truth)

### Primary Source: Obsidian Vault
**Location:** `C:\Users\matei\Documents\Obsidian Vault\Projects\🏹 Archer\`

This is the **canonical source** for all strategic, architectural, and research documentation. Structure:

```
🏹 Archer/
├── 00_Strategy_and_Planning/     # Business case, roadmap, prioritization
│   ├── 00_Executive_Summary.md
│   ├── 01_AI_Roadmap_and_Business_Case.md
│   └── 02_Feature_Prioritization_MoSCoW.md
├── 01_Architecture/              # Technical architecture specs
│   ├── 00_AI_Engine_Specification.md
│   ├── 01_Comprehensive_Architecture.md
│   ├── 02_RAG_Architecture.md
│   ├── 03_Data_Model_SurrealDB.md
│   └── 04_AI_Agent_Specifications.md
├── 02_Implementation/            # Coding guides and dev roadmaps
│   └── 00_Coding_Implementation_Guide.md
├── 03_UX_and_Design/             # UI/UX specifications
│   └── 00_UX_and_IA_Recommendations.md
├── 04_Competitive_Analysis/      # Market research
│   ├── 00_Competitive_Analysis_Matrix.md
│   └── 01_Appendix_Sentiment_and_Research.md
├── Archive/                      # Deprecated/superseded docs
└── Research Report - Archer AI Engine (2025).md
```

### Secondary Source: Repository Docs
**Location:** `c:\Users\matei\DevApps\Archer\`

These are **implementation-focused** docs that live in the repo:

| Location | Purpose | Sync Direction |
|----------|---------|----------------|
| `README.md` | GitHub landing page, quick start | ← Derived from Obsidian |
| `CLAUDE.md` | AI agent context file | ← Auto-generated |
| `product_docs/` | Legacy product docs (being migrated) | → Moving to Obsidian |
| `docs/` | Technical guides, API docs | Stays in repo |
| `.github/instructions/` | AI agent behavior rules | Stays in repo |
| `COMPONENT_LIBRARY_GUIDE.md` | UI component API | Stays in repo |

---

## 🔄 Sync Strategy

### Obsidian → Repository
Strategic/architectural docs from Obsidian should be **referenced** in the repo, not duplicated:

1. **README.md** summarizes the vision from `00_Executive_Summary.md`
2. **Architecture diagrams** can be exported and placed in `docs/architecture/`
3. **AI agents** should read Obsidian docs via the sync folder when available

### Manual Sync Process (Until Automated)
```powershell
# Copy latest Obsidian docs to repo for AI agent access
$obsidianPath = "C:\Users\matei\Documents\Obsidian Vault\Projects"
$archerFolder = (Get-ChildItem $obsidianPath -Directory)[0].FullName
xcopy "$archerFolder\*" "C:\Users\matei\DevApps\Archer\docs\architecture\" /E /I /Y
```

### Future: Symlink/Junction (Recommended)
Create a junction so `docs/architecture/` points directly to Obsidian:
```powershell
# Run as Administrator
New-Item -ItemType Junction -Path "C:\Users\matei\DevApps\Archer\docs\architecture" -Target "C:\Users\matei\Documents\Obsidian Vault\Projects\🏹 Archer"
```

---

## 📝 Documentation Update Rules

### When to Update Documentation

| Event | Documents to Update |
|-------|---------------------|
| New feature implemented | `README.md`, relevant `product_docs/` |
| Architecture decision | Obsidian `01_Architecture/` folder |
| UI component added | `COMPONENT_LIBRARY_GUIDE.md` |
| API endpoint added | `docs/api/` |
| Major milestone reached | `README.md` roadmap section |
| AI capability added | Obsidian `01_Architecture/00_AI_Engine_Specification.md` |

### README.md Update Protocol

The README must always reflect:
1. **Current state** - What's working today
2. **Architecture overview** - Tech stack summary
3. **Quick start** - How to run the app
4. **Roadmap** - Near-term priorities (sync with Obsidian)

Template sections:
```markdown
# Archer ITSM
[Vision summary from Obsidian Executive Summary]

## 🚀 Quick Start
[Dev setup commands]

## ✨ Current Features
[List of working features - update after each sprint]

## 🏗️ Architecture
[Summary - link to full docs in Obsidian/docs/]

## 🗺️ Roadmap
[Next 3 priorities - sync with Obsidian 00_Strategy_and_Planning]

## 📖 Documentation
[Links to key docs]
```

---

## 🤖 AI Agent Context Protocol

### At Session Start
AI agents should:
1. Read `CLAUDE.md` for project context
2. Read `.github/instructions/*.instructions.md` for behavior rules
3. Check `README.md` for current state
4. If architecture questions arise, access Obsidian docs via `docs/architecture/` or terminal

### Before Making Changes
1. **Check current state** - Don't assume from old context
2. **Verify file locations** - Use `list_dir` and `file_search`
3. **Read relevant docs** - Understand existing patterns

### After Making Changes
1. **Update CLAUDE.md** if significant progress was made
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
2. **Update relevant docs** so next agent can continue
3. **List pending items** clearly

---

## 📊 Current State Summary (December 2025)

### What's Built
- **Frontend:** React + TypeScript + Vite (port 1420)
  - Purple Glass design system (8 components)
  - Project management views (workspace, timeline, activities)
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

### Architecture Gap
| Current | Target |
|---------|--------|
| Rust backend (Axum) | + Python AI sidecar |
| SurrealDB (data) | + SurrealDB vectors |
| Manual workflows | + AI-assisted workflows |
| No LLM integration | + Pluggable LLM backend |
| Static knowledge | + RAG with doc ingestion |

---

## 🔗 Key Document Links

### Obsidian (Strategic)
- Vision: `00_Strategy_and_Planning/00_Executive_Summary.md`
- AI Spec: `01_Architecture/00_AI_Engine_Specification.md`
- Implementation: `02_Implementation/00_Coding_Implementation_Guide.md`
- Competitors: `04_Competitive_Analysis/00_Competitive_Analysis_Matrix.md`

### Repository (Implementation)
- Quick Start: `README.md`
- Components: `COMPONENT_LIBRARY_GUIDE.md`
- Design Tokens: `DESIGN_TOKEN_DOCUMENTATION.md`
- API Docs: `docs/api/`

---

## ⚠️ Common Pitfalls

1. **Don't duplicate strategic docs in repo** - Reference Obsidian instead
2. **Don't let README get stale** - Update after each feature
3. **Don't skip CLAUDE.md updates** - It's the AI agent's memory
4. **Don't hardcode paths** - Use environment variables or config
5. **Don't create summary docs for each change** - Update existing docs instead

---

## 📋 Maintenance Checklist

Weekly:
- [ ] Sync Obsidian → `docs/architecture/` if changes were made
- [ ] Verify README.md roadmap matches current priorities
- [ ] Clean up any temp files or deprecated docs

After Major Features:
- [ ] Update README.md current features section
- [ ] Update COMPONENT_LIBRARY_GUIDE.md if UI components added
- [ ] Update architecture docs if patterns changed
- [ ] Commit and push all doc changes

Before AI Session:
- [ ] Pull latest from main
- [ ] Verify docs/architecture/ has latest Obsidian sync
- [ ] Check for any WIP markers or TODOs in code

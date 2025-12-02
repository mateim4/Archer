# Deep Research Prompt: Next-Generation ITSM Platform Design

## Mission Statement

You are a senior product research analyst tasked with conducting comprehensive research to inform the design of **Archer**, a next-generation IT Service Management platform. The goal is to build a modern, AI-enhanced alternative to legacy platforms like ServiceNow, Jira Service Management, and BMC Helix.

Your research will directly inform product specifications, UI/UX design, feature prioritization, and technical architecture decisions.

---

## Research Objectives

### Objective 1: Competitive Landscape Analysis (ITSM/CMDB/Monitoring/IAM)

Research the **top 10-15 platforms** in each category as of 2024-2025:

#### 1.1 IT Service Management (ITSM)
- ServiceNow ITSM
- Jira Service Management (Atlassian)
- Freshservice
- Zendesk for IT
- ManageEngine ServiceDesk Plus
- BMC Helix ITSM
- Ivanti Neurons
- SysAid
- TOPdesk
- HaloITSM

**For each platform, document:**
- Core feature set (ticketing, SLAs, workflows, automation)
- Unique differentiators
- Pricing model and target market (SMB vs Enterprise)
- User reviews: most praised features, most complained-about pain points
- Mobile experience
- AI/ML capabilities (if any)
- Integration ecosystem

#### 1.2 Configuration Management Database (CMDB)
- ServiceNow CMDB
- Device42
- Freshservice Asset Management
- Lansweeper
- Snipe-IT
- Nlyte
- BMC Helix Discovery
- Snow Software

**For each, document:**
- Discovery mechanisms (agent-based, agentless, API)
- Relationship mapping capabilities
- Visualization features
- Integration with ITSM/Monitoring
- Data quality and normalization approaches
- Federation support (multiple sources of truth)

#### 1.3 Infrastructure Monitoring
- Datadog
- Dynatrace
- New Relic
- Splunk (Observability)
- Prometheus + Grafana
- Zabbix
- PRTG
- LogicMonitor
- Elastic Observability
- Honeycomb

**For each, document:**
- Metrics, Logs, Traces support (pillars of observability)
- Alert management and noise reduction
- Dashboard building experience
- AI/ML for anomaly detection
- Root cause analysis features
- Integration with ITSM for incident creation

#### 1.4 Identity & Access Management (IAM)
- Microsoft Entra ID (Azure AD)
- Okta
- Ping Identity
- OneLogin
- JumpCloud
- CyberArk
- SailPoint

**For each, document:**
- SSO/MFA capabilities
- Role-based access control (RBAC)
- Privileged access management
- Integration with IT systems
- Self-service portals
- Audit and compliance features

---

### Objective 2: Feature Analysis - What Users Love (and Hate)

Conduct sentiment analysis across:
- G2 reviews
- Gartner Peer Insights
- Reddit threads (r/sysadmin, r/ITManagers, r/msp)
- Hacker News discussions
- IT Twitter/X community
- YouTube reviews and comparisons

**Identify patterns:**

#### 2.1 Most Praised Features
- Which features get consistently positive feedback?
- What makes users say "I couldn't live without this"?
- What features drive switching from competitors?
- What creates "delight" moments?

#### 2.2 Most Common Pain Points
- What frustrates users the most?
- What causes "shelfware" (bought but not used)?
- What leads to negative NPS scores?
- Common complaints about:
  - Complexity / learning curve
  - Performance / speed
  - Customization limitations
  - Pricing / value perception
  - Integration difficulties
  - Mobile experience

#### 2.3 Feature Gaps in the Market
- What are users asking for that no platform delivers well?
- What workflows are still manual despite available tools?
- Where is the biggest opportunity for innovation?

---

### Objective 3: AI/ML Integration Research

#### 3.1 Current AI Capabilities in ITSM

Research how leading platforms use AI:
- **ServiceNow**: Now Assist, Virtual Agent, Predictive Intelligence
- **Freshservice**: Freddy AI
- **Jira**: Atlassian Intelligence
- **Zendesk**: AI agents
- **BMC**: BMC HelixGPT

**Document for each:**
- Use cases (ticket classification, auto-routing, suggestions)
- User reception (helpful vs gimmick)
- Accuracy and reliability
- Training requirements

#### 3.2 AI Agent Opportunities

Research emerging AI agent patterns for IT operations:

1. **Conversational Ticket Creation**
   - Natural language to structured ticket
   - Context gathering through dialogue
   - Similar ticket detection

2. **Intelligent Triage & Routing**
   - Auto-classification by category, priority, team
   - Skill-based assignment
   - Workload balancing

3. **Resolution Assistance**
   - Knowledge base search and suggestion
   - Similar resolved ticket matching
   - Runbook automation suggestions

4. **Proactive Alerting**
   - Anomaly detection before user reports
   - Predictive failure warnings
   - Capacity planning insights

5. **Natural Language Querying**
   - "Show me all P1 incidents this week"
   - "What servers have the most alerts?"
   - "Compare uptime between clusters"

6. **Auto-Remediation**
   - Self-healing workflows
   - Approved automated responses
   - Human-in-the-loop escalation

**For each opportunity, assess:**
- Technical feasibility (2025 state of the art)
- User trust considerations
- Risk and governance requirements
- Implementation complexity
- Business value potential

#### 3.3 AI UX Best Practices

Research how to design AI features that users trust and adopt:
- Transparency (explain why AI made a suggestion)
- Controllability (easy to override)
- Progressive disclosure (don't overwhelm)
- Confidence indicators (show certainty levels)
- Feedback loops (learn from corrections)
- Graceful degradation (works without AI too)

#### 3.4 Business Case for AI in ITSM

Find research/reports supporting AI investment:
- McKinsey, Gartner, Forrester reports on AI in IT operations
- ROI studies and case studies
- Time savings metrics (MTTR, resolution rates)
- User satisfaction improvements
- Cost reduction evidence

---

### Objective 4: Cohesive Ecosystem Design

#### 4.1 Cross-Module Integration Patterns

Research how best-in-class platforms create seamless experiences:

1. **Data Flow**
   - How does incident data flow to problem management?
   - How do CMDB changes trigger impact assessments?
   - How do monitoring alerts become tickets?

2. **Contextual Navigation**
   - Can users jump from a ticket to the affected asset?
   - Is the full context visible without switching tabs?
   - How is "related information" surfaced?

3. **Unified Search**
   - Can users search across all modules?
   - How are results ranked and grouped?
   - What quick actions are available from search?

4. **Consistent Object Model**
   - Is there a unified concept of "Configuration Item"?
   - How are relationships modeled?
   - Is the data model extensible?

5. **Workflow Orchestration**
   - Can workflows span multiple modules?
   - How are approvals and escalations handled?
   - What automation triggers are available?

#### 4.2 UI/UX Simplicity Strategies

Research approaches to managing complexity:

1. **Progressive Disclosure**
   - Show simple by default, reveal complexity on demand
   - Role-based UI customization
   - Contextual toolbars

2. **Opinionated Defaults**
   - Best-practice workflows out of the box
   - Templates for common scenarios
   - Guided setup wizards

3. **Unified Navigation**
   - Consistent sidebar/menu structure
   - Breadcrumbs for context
   - Recent items for quick access

4. **Dashboard Personalization**
   - Role-based default dashboards
   - Drag-and-drop customization
   - Widget library

5. **Keyboard-First Experience**
   - Command palette (Ctrl+K pattern)
   - Keyboard shortcuts
   - Vim-style power users

6. **Mobile-First Considerations**
   - Responsive design patterns
   - Touch-friendly interactions
   - Offline capabilities

#### 4.3 Information Architecture

Research best practices for organizing ITSM features:

- How many clicks to common actions?
- How is navigation structured (flat vs hierarchical)?
- How are settings and configuration organized?
- How is onboarding designed?

---

### Objective 5: Technical Architecture Considerations

#### 5.1 Modern Tech Stack Patterns

Research what successful SaaS platforms use:
- Frontend frameworks (React, Vue, Svelte)
- Backend architectures (microservices, serverless)
- Database choices (relational, graph, time-series)
- Real-time capabilities (WebSockets, SSE)
- API design (REST, GraphQL, gRPC)

#### 5.2 Integration Architecture

Research integration patterns:
- Webhook-based event streaming
- Bi-directional sync strategies
- OAuth/SAML for auth
- Rate limiting and resilience
- Marketplace/app ecosystem models

#### 5.3 Multi-Tenancy and Scalability

Research approaches for:
- Tenant isolation
- Data residency compliance
- Performance at scale
- White-labeling options

---

## Deliverables

Please provide a structured report with the following sections:

### 1. Executive Summary (1-2 pages)
- Key findings
- Market opportunities
- Recommended focus areas

### 2. Competitive Analysis Matrix
- Feature comparison table across top 5 platforms per category
- Strengths/weaknesses summary
- Positioning opportunities for Archer

### 3. Feature Prioritization Framework
- MoSCoW (Must/Should/Could/Won't) based on research
- Quick wins vs long-term investments
- Differentiation opportunities

### 4. AI Integration Roadmap
- Recommended AI features by phase
- Technical requirements
- Risk mitigation strategies
- Expected ROI

### 5. UX Recommendations
- Information architecture proposal
- Navigation structure
- Key user flows (with wireframe descriptions)
- Design system considerations

### 6. Integration Architecture
- Module interaction diagram
- Data flow patterns
- API design principles

### 7. Appendix
- Full competitive research notes
- User review excerpts
- Reference links and sources

---

## Research Guidelines

### Sources to Prioritize
- Official product documentation
- G2 and Gartner Peer Insights reviews (2023-2025)
- Industry analyst reports (Gartner Magic Quadrant, Forrester Wave)
- Reddit/HN/Twitter discussions from IT professionals
- YouTube product demos and comparisons
- Case studies and customer testimonials
- Academic research on AI in ITSM
- Conference talks (PagerDuty Summit, ServiceNow Knowledge, etc.)

### Quality Criteria
- Cite sources for all claims
- Distinguish between facts and opinions
- Note when information may be outdated
- Highlight conflicting viewpoints
- Quantify when possible (percentages, metrics)

### Bias Awareness
- Note vendor-produced content vs independent reviews
- Consider reviewer demographics (SMB vs Enterprise)
- Account for recency of reviews
- Balance positive and negative feedback

---

## Context: About Archer

Archer is being built with:
- **Frontend**: React + TypeScript + Vite + Fluent UI 2
- **Backend**: Rust (Axum) + SurrealDB
- **Design System**: Purple Glass (glassmorphism aesthetic)
- **Current Modules**:
  - Service Desk (tickets, Kanban/List views)
  - Inventory (CMDB with asset discovery)
  - Monitoring (real-time metrics, alerts)
  - Integration Hub (Nutanix, RVTools)

Target market: Mid-market to Enterprise IT teams seeking a modern, integrated alternative to ServiceNow/Jira.

---

## Output Format

Provide your findings in well-structured Markdown with:
- Clear headings and subheadings
- Tables for comparisons
- Bullet points for lists
- Code blocks for technical examples
- Mermaid diagrams for flows (if appropriate)
- Executive summary at the top of each section

---

**End of Research Prompt**

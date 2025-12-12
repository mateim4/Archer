# Archer ITSM - Hot/Cold Data Tiering Specification

**Document Version:** 1.0  
**Created:** December 12, 2025  
**Status:** Architectural Specification  
**Classification:** Technical Design Document

---

## Executive Summary

This document specifies the **Hot/Cold Data Tiering** architecture for Archer's ticketing system. The goal is to achieve high-performance ticket operations by keeping actively-worked tickets in SurrealDB's in-memory tier while archiving resolved/stale tickets to persistent storage.

### Business Value
- **10-100x faster** query response for active tickets
- **Reduced memory footprint** - only hot data in RAM
- **Unlimited historical storage** - cold tier scales to petabytes
- **Better SLA compliance** - agents never wait for slow queries
- **Cost optimization** - tiered storage costs less than all-in-memory

---

## 1. Industry Context: Hot/Cold Tiering Patterns

### 1.1 Common Names for This Pattern
| Name | Origin | Focus |
|------|--------|-------|
| Hot/Warm/Cold Tiering | Data warehousing | Storage cost optimization |
| Active Archive | Document management | Compliance + performance |
| Data Temperature | Cloud providers | Access frequency-based |
| Working Set Optimization | Databases | Memory management |
| Time-Series Partitioning | Observability | Chronological data |

### 1.2 Where This Pattern is Used

| System | Hot Tier | Cold Tier | Transition Logic |
|--------|----------|-----------|------------------|
| **ServiceNow** | Active incidents | Closed tickets > 90 days | Status + Age |
| **Jira** | Last 6 months | Archive after 2 years | Age only |
| **Elasticsearch** | Hot nodes (SSD) | Cold nodes (HDD) | Index age |
| **Prometheus** | Local 15 days | Remote long-term storage | Fixed time window |
| **Snowflake** | Active warehouse | Automatic suspend | Query activity |

### 1.3 Key Insight: ITSM-Specific Patterns

In ITSM, ticket "temperature" is **NOT purely time-based**. A 2-year-old ticket can become "hot" if:
- Reopened for follow-up
- Referenced by a new ticket
- Subject to audit/compliance review
- Part of a problem investigation

**Our design must support "reheating" cold tickets on access.**

---

## 2. SurrealDB Storage Modes

### 2.1 Available Storage Engines

SurrealDB supports multiple storage backends:

```bash
# In-memory (fastest, lost on restart)
surreal start --log trace memory

# File-based (RocksDB default, persistent)
surreal start --log trace file:data/surreal.db

# TiKV cluster (distributed, persistent)
surreal start --log trace tikv://tikv1:2379,tikv2:2379

# FoundationDB cluster (distributed, persistent)
surreal start --log trace fdb://cluster@fdb.cluster
```

### 2.2 SurrealDB's Internal Architecture

SurrealDB uses **key-value storage** internally:
- **In-memory mode**: All data in RAM, zero disk I/O
- **RocksDB mode**: LSM-tree with configurable block cache
- **Block cache**: Recently accessed data cached in memory

**Critical Insight:** SurrealDB doesn't have built-in "tiering" - we must implement it at the **application level** using separate tables or databases.

---

## 3. Architectural Options

### Option A: Separate Tables (Recommended for Archer)

```
┌─────────────────────────────────────────────────────────────┐
│                    SurrealDB Instance                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Hot Tables                           │ │
│  │   ticket_hot        (in-memory optimized)               │ │
│  │   ticket_comments   (linked to hot tickets)             │ │
│  │   ticket_history    (recent history only)               │ │
│  │   sla_timers        (always hot - active monitoring)    │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ▲                                  │
│                           │ reheat                           │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Cold Tables                          │ │
│  │   ticket_cold       (archived tickets)                  │ │
│  │   ticket_comments_cold   (historical comments)          │ │
│  │   ticket_history_cold    (full audit trail)             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Pros:**
- Single database instance
- Simple queries with table routing
- Works with SurrealDB's existing features
- Can use same indexes on both tables

**Cons:**
- Manual tier management
- Both tiers share memory budget

### Option B: Separate Databases

```
┌─────────────────────────┐     ┌─────────────────────────┐
│  SurrealDB HOT Instance │     │  SurrealDB COLD Instance │
│  (memory mode)          │     │  (file/tikv mode)        │
│  Port: 8001             │     │  Port: 8002              │
│                         │     │                          │
│  ticket                 │◄───►│  ticket_archive          │
│  ticket_comments        │     │  ticket_comments_archive │
│  sla_timers             │     │  (full history)          │
└─────────────────────────┘     └─────────────────────────┘
         ▲                                   ▲
         │                                   │
         └────────────── API Router ─────────┘
```

**Pros:**
- True memory isolation
- Independent scaling
- Cold tier can be on cheaper storage
- Hot instance restart = instant (rebuilds from cold)

**Cons:**
- More complex deployment
- Cross-database queries harder
- Requires careful sync logic

### Option C: Hybrid (Recommended for Production)

```
┌────────────────────────────────────────────────────────────────┐
│                         Production Setup                        │
├─────────────────────────┬──────────────────────────────────────┤
│  SurrealDB (RocksDB)    │  Configuration:                       │
│  Single Instance        │  - block_cache_size: 2GB             │
│  Port: 8001             │  - write_buffer_size: 256MB          │
│                         │  - max_open_files: 10000             │
├─────────────────────────┴──────────────────────────────────────┤
│  Table: ticket           (all tickets, partitioned by tier)    │
│  Field: tier = 'hot' | 'cold'                                  │
│  Field: last_accessed_at = datetime                            │
│                                                                │
│  Index: idx_hot_tickets ON ticket WHERE tier = 'hot'           │
│  Index: idx_cold_tickets ON ticket WHERE tier = 'cold'         │
├────────────────────────────────────────────────────────────────┤
│  RocksDB Block Cache Strategy:                                  │
│  - Hot tier rows: pinned in cache via frequent access          │
│  - Cold tier rows: evicted naturally via LRU                   │
│  - Partial indexes: only hot tier indexed in memory            │
└────────────────────────────────────────────────────────────────┘
```

**Pros:**
- Single table, single schema
- RocksDB's LRU cache naturally "warms" accessed data
- Simplest application code
- Built-in block compression for cold data

**Cons:**
- No true memory isolation
- Cold queries still hit disk

---

## 4. Recommended Architecture for Archer

### 4.1 Decision: Option A with Materialized Views

We'll use **separate tables** within a single SurrealDB instance, with:
- Explicit tier field on tickets
- Background archival job
- "Reheat" on access pattern
- Unified query layer in Rust backend

### 4.2 Complete Schema Definition

```sql
-- ============================================================================
-- TIER CONFIGURATION
-- ============================================================================

DEFINE TABLE tier_config SCHEMAFULL;
DEFINE FIELD name ON tier_config TYPE string;
DEFINE FIELD hot_retention_days ON tier_config TYPE int DEFAULT 90;
DEFINE FIELD warm_retention_days ON tier_config TYPE int DEFAULT 365;
DEFINE FIELD archive_after_days ON tier_config TYPE int DEFAULT 730;
DEFINE FIELD auto_reheat_on_access ON tier_config TYPE bool DEFAULT true;
DEFINE FIELD reheat_cooldown_hours ON tier_config TYPE int DEFAULT 24;
DEFINE FIELD created_at ON tier_config TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON tier_config TYPE datetime DEFAULT time::now();

-- ============================================================================
-- HOT TIER: ACTIVE TICKETS
-- ============================================================================
-- These are tickets being actively worked on or recently touched.
-- Query priority: FAST. Memory priority: HIGH.

DEFINE TABLE ticket SCHEMAFULL;

-- Core Identity
DEFINE FIELD id ON ticket TYPE string;
DEFINE FIELD namespace ON ticket TYPE string;
DEFINE FIELD number ON ticket TYPE int;

-- Content
DEFINE FIELD title ON ticket TYPE string;
DEFINE FIELD description ON ticket TYPE option<string>;
DEFINE FIELD type ON ticket TYPE string;  -- incident, request, problem, change
DEFINE FIELD status ON ticket TYPE string DEFAULT 'NEW';
DEFINE FIELD priority ON ticket TYPE string;
DEFINE FIELD urgency ON ticket TYPE option<string>;
DEFINE FIELD impact ON ticket TYPE option<string>;

-- Assignment
DEFINE FIELD assignee ON ticket TYPE option<string>;
DEFINE FIELD assigned_group ON ticket TYPE option<string>;
DEFINE FIELD created_by ON ticket TYPE string;
DEFINE FIELD updated_by ON ticket TYPE option<string>;

-- Relationships
DEFINE FIELD related_asset ON ticket TYPE option<record>;
DEFINE FIELD related_project ON ticket TYPE option<record>;
DEFINE FIELD parent_ticket ON ticket TYPE option<record<ticket>>;
DEFINE FIELD watchers ON ticket TYPE array DEFAULT [];
DEFINE FIELD tags ON ticket TYPE array DEFAULT [];
DEFINE FIELD custom_fields ON ticket TYPE option<object>;

-- Categorization
DEFINE FIELD category ON ticket TYPE option<string>;
DEFINE FIELD subcategory ON ticket TYPE option<string>;
DEFINE FIELD source ON ticket TYPE option<string>;  -- email, portal, phone, api, monitoring

-- SLA Tracking
DEFINE FIELD sla_policy_id ON ticket TYPE option<record<sla_policies>>;
DEFINE FIELD response_due ON ticket TYPE option<datetime>;
DEFINE FIELD resolution_due ON ticket TYPE option<datetime>;
DEFINE FIELD response_sla_met ON ticket TYPE option<bool>;
DEFINE FIELD resolution_sla_met ON ticket TYPE option<bool>;
DEFINE FIELD first_response_at ON ticket TYPE option<datetime>;
DEFINE FIELD sla_breach_at ON ticket TYPE option<datetime>;

-- Timestamps
DEFINE FIELD created_at ON ticket TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON ticket TYPE datetime DEFAULT time::now();
DEFINE FIELD resolved_at ON ticket TYPE option<datetime>;
DEFINE FIELD closed_at ON ticket TYPE option<datetime>;

-- ==========================================
-- TIERING FIELDS (New)
-- ==========================================
DEFINE FIELD tier ON ticket TYPE string DEFAULT 'hot';  -- 'hot', 'warm', 'cold'
DEFINE FIELD last_accessed_at ON ticket TYPE datetime DEFAULT time::now();
DEFINE FIELD access_count ON ticket TYPE int DEFAULT 0;
DEFINE FIELD archived_at ON ticket TYPE option<datetime>;
DEFINE FIELD archive_reason ON ticket TYPE option<string>;  -- 'age', 'status', 'manual'
DEFINE FIELD reheated_count ON ticket TYPE int DEFAULT 0;
DEFINE FIELD last_reheated_at ON ticket TYPE option<datetime>;

-- Multi-tenancy
DEFINE FIELD tenant_id ON ticket TYPE option<record<tenants>>;

-- ============================================================================
-- INDEXES: Optimized for Tiered Access
-- ============================================================================

-- Primary access patterns (hot tier only)
DEFINE INDEX idx_ticket_number ON ticket COLUMNS namespace, number UNIQUE;
DEFINE INDEX idx_ticket_status ON ticket COLUMNS status;
DEFINE INDEX idx_ticket_priority ON ticket COLUMNS priority;
DEFINE INDEX idx_ticket_assignee ON ticket COLUMNS assignee;
DEFINE INDEX idx_ticket_type ON ticket COLUMNS type;

-- Tiering indexes (critical for performance)
DEFINE INDEX idx_ticket_tier ON ticket COLUMNS tier;
DEFINE INDEX idx_ticket_tier_status ON ticket COLUMNS tier, status;
DEFINE INDEX idx_ticket_last_accessed ON ticket COLUMNS tier, last_accessed_at;

-- Compound index for archival queries
DEFINE INDEX idx_ticket_archival_candidates ON ticket COLUMNS tier, status, updated_at;

-- SLA breach monitoring (always on hot)
DEFINE INDEX idx_ticket_sla_breach ON ticket COLUMNS tier, response_due, resolution_due;

-- ============================================================================
-- COLD TIER: ARCHIVED TICKETS (Separate Table)
-- ============================================================================
-- Tickets that are closed/resolved and haven't been accessed in X days.
-- Query priority: ACCEPTABLE LATENCY. Memory priority: LOW.

DEFINE TABLE ticket_archive SCHEMAFULL;

-- Full copy of ticket fields (denormalized for self-contained queries)
DEFINE FIELD original_id ON ticket_archive TYPE string;
DEFINE FIELD namespace ON ticket_archive TYPE string;
DEFINE FIELD number ON ticket_archive TYPE int;
DEFINE FIELD title ON ticket_archive TYPE string;
DEFINE FIELD description ON ticket_archive TYPE option<string>;
DEFINE FIELD type ON ticket_archive TYPE string;
DEFINE FIELD status ON ticket_archive TYPE string;
DEFINE FIELD priority ON ticket_archive TYPE string;
DEFINE FIELD urgency ON ticket_archive TYPE option<string>;
DEFINE FIELD impact ON ticket_archive TYPE option<string>;
DEFINE FIELD assignee ON ticket_archive TYPE option<string>;
DEFINE FIELD assigned_group ON ticket_archive TYPE option<string>;
DEFINE FIELD created_by ON ticket_archive TYPE string;
DEFINE FIELD category ON ticket_archive TYPE option<string>;
DEFINE FIELD subcategory ON ticket_archive TYPE option<string>;
DEFINE FIELD source ON ticket_archive TYPE option<string>;
DEFINE FIELD tags ON ticket_archive TYPE array DEFAULT [];
DEFINE FIELD custom_fields ON ticket_archive TYPE option<object>;

-- Timestamps (preserved from original)
DEFINE FIELD created_at ON ticket_archive TYPE datetime;
DEFINE FIELD updated_at ON ticket_archive TYPE datetime;
DEFINE FIELD resolved_at ON ticket_archive TYPE option<datetime>;
DEFINE FIELD closed_at ON ticket_archive TYPE option<datetime>;

-- Archive metadata
DEFINE FIELD archived_at ON ticket_archive TYPE datetime DEFAULT time::now();
DEFINE FIELD archive_reason ON ticket_archive TYPE string;  -- 'age_policy', 'manual', 'status_based'
DEFINE FIELD original_tier ON ticket_archive TYPE string DEFAULT 'hot';
DEFINE FIELD total_access_count ON ticket_archive TYPE int DEFAULT 0;
DEFINE FIELD last_accessed_before_archive ON ticket_archive TYPE datetime;

-- Denormalized summary (avoid joins)
DEFINE FIELD comment_count ON ticket_archive TYPE int DEFAULT 0;
DEFINE FIELD attachment_count ON ticket_archive TYPE int DEFAULT 0;
DEFINE FIELD history_snapshot ON ticket_archive TYPE array DEFAULT [];  -- Last 10 history entries

-- Archive indexes (optimized for infrequent access)
DEFINE INDEX idx_archive_number ON ticket_archive COLUMNS namespace, number;
DEFINE INDEX idx_archive_original ON ticket_archive COLUMNS original_id;
DEFINE INDEX idx_archive_date ON ticket_archive COLUMNS archived_at;
DEFINE INDEX idx_archive_status ON ticket_archive COLUMNS status;

-- ============================================================================
-- TICKET COMMENTS (Tiered with Parent)
-- ============================================================================

DEFINE TABLE ticket_comments SCHEMAFULL;
DEFINE FIELD ticket_id ON ticket_comments TYPE record<ticket>;
DEFINE FIELD content ON ticket_comments TYPE string;
DEFINE FIELD author_id ON ticket_comments TYPE string;
DEFINE FIELD author_name ON ticket_comments TYPE string;
DEFINE FIELD is_internal ON ticket_comments TYPE bool DEFAULT false;
DEFINE FIELD comment_type ON ticket_comments TYPE string DEFAULT 'NOTE';
DEFINE FIELD attachments ON ticket_comments TYPE array DEFAULT [];
DEFINE FIELD created_at ON ticket_comments TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON ticket_comments TYPE datetime DEFAULT time::now();

-- Tier follows parent ticket
DEFINE FIELD tier ON ticket_comments TYPE string DEFAULT 'hot';

DEFINE INDEX idx_comments_ticket ON ticket_comments COLUMNS ticket_id, created_at;
DEFINE INDEX idx_comments_tier ON ticket_comments COLUMNS tier;

-- Archive table for comments
DEFINE TABLE ticket_comments_archive SCHEMAFULL;
DEFINE FIELD original_ticket_id ON ticket_comments_archive TYPE string;
DEFINE FIELD content ON ticket_comments_archive TYPE string;
DEFINE FIELD author_id ON ticket_comments_archive TYPE string;
DEFINE FIELD author_name ON ticket_comments_archive TYPE string;
DEFINE FIELD is_internal ON ticket_comments_archive TYPE bool;
DEFINE FIELD comment_type ON ticket_comments_archive TYPE string;
DEFINE FIELD created_at ON ticket_comments_archive TYPE datetime;
DEFINE FIELD archived_at ON ticket_comments_archive TYPE datetime DEFAULT time::now();

-- ============================================================================
-- TICKET HISTORY (Tiered - Cold retains summary only)
-- ============================================================================

DEFINE TABLE ticket_history SCHEMAFULL;
DEFINE FIELD ticket_id ON ticket_history TYPE record<ticket>;
DEFINE FIELD field_name ON ticket_history TYPE string;
DEFINE FIELD old_value ON ticket_history TYPE option<string>;
DEFINE FIELD new_value ON ticket_history TYPE option<string>;
DEFINE FIELD changed_by ON ticket_history TYPE string;
DEFINE FIELD changed_by_name ON ticket_history TYPE string;
DEFINE FIELD change_type ON ticket_history TYPE string;
DEFINE FIELD created_at ON ticket_history TYPE datetime DEFAULT time::now();
DEFINE FIELD tier ON ticket_history TYPE string DEFAULT 'hot';

DEFINE INDEX idx_history_ticket ON ticket_history COLUMNS ticket_id, created_at;
DEFINE INDEX idx_history_tier ON ticket_history COLUMNS tier;

-- ============================================================================
-- TIERING OPERATIONS LOG (Audit Trail)
-- ============================================================================

DEFINE TABLE tiering_operations SCHEMAFULL;
DEFINE FIELD operation_type ON tiering_operations TYPE string;  -- 'archive', 'reheat', 'purge'
DEFINE FIELD ticket_id ON tiering_operations TYPE string;
DEFINE FIELD ticket_number ON tiering_operations TYPE int;
DEFINE FIELD from_tier ON tiering_operations TYPE string;
DEFINE FIELD to_tier ON tiering_operations TYPE string;
DEFINE FIELD reason ON tiering_operations TYPE string;
DEFINE FIELD triggered_by ON tiering_operations TYPE string;  -- 'scheduler', 'user:xxx', 'access_pattern'
DEFINE FIELD metadata ON tiering_operations TYPE option<object>;
DEFINE FIELD created_at ON tiering_operations TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_tiering_ops_date ON tiering_operations COLUMNS created_at;
DEFINE INDEX idx_tiering_ops_ticket ON tiering_operations COLUMNS ticket_id;
```

---

## 5. Tier Transition Rules

### 5.1 Tier Definitions

| Tier | Description | Retention | Access Expectation |
|------|-------------|-----------|-------------------|
| **HOT** | Active work items | Indefinite while active | < 50ms queries |
| **WARM** | Recently closed | 90 days after close | < 200ms queries |
| **COLD** | Archived | 2 years | < 2s acceptable |
| **ARCHIVE** | Long-term storage | 7+ years | Minutes acceptable |

### 5.2 Transition Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                    TICKET LIFECYCLE                              │
│                                                                  │
│  [NEW] ──► [OPEN] ──► [IN_PROGRESS] ──► [RESOLVED] ──► [CLOSED] │
│    │                        │                              │     │
│    │                        │                              │     │
│    ▼                        ▼                              ▼     │
│  ╔════════════════════════════════════════════════════════════╗ │
│  ║                    HOT TIER                                 ║ │
│  ║  Criteria:                                                  ║ │
│  ║  - Status NOT IN ('CLOSED', 'CANCELED')                     ║ │
│  ║  - OR last_accessed_at > NOW() - 7 days                     ║ │
│  ║  - OR has active SLA timer                                  ║ │
│  ╚════════════════════════════════════════════════════════════╝ │
│                              │                                   │
│                              │ 7 days no access + closed status  │
│                              ▼                                   │
│  ╔════════════════════════════════════════════════════════════╗ │
│  ║                    WARM TIER                                ║ │
│  ║  Criteria:                                                  ║ │
│  ║  - Status IN ('CLOSED', 'CANCELED', 'RESOLVED')             ║ │
│  ║  - AND 7 days < last_accessed_at < 90 days                  ║ │
│  ╚════════════════════════════════════════════════════════════╝ │
│                              │                                   │
│                              │ 90 days no access                 │
│                              ▼                                   │
│  ╔════════════════════════════════════════════════════════════╗ │
│  ║                    COLD TIER (Archive Table)                ║ │
│  ║  Criteria:                                                  ║ │
│  ║  - Status IN ('CLOSED', 'CANCELED')                         ║ │
│  ║  - AND last_accessed_at > 90 days ago                       ║ │
│  ║  - Data moved to ticket_archive table                       ║ │
│  ╚════════════════════════════════════════════════════════════╝ │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Reheat Rules (Cold → Hot)

A ticket is "reheated" back to hot tier when:

| Trigger | Action | Cooldown |
|---------|--------|----------|
| Direct access (view ticket) | Immediate reheat | 24 hours |
| Ticket reopened | Immediate reheat | None |
| Linked by new ticket | Reheat if accessed | 72 hours |
| Search result click | Increment counter, reheat at 3 | Per-ticket |
| API query in results | No reheat (bulk access) | N/A |
| Compliance audit tag | Immediate reheat | None |

### 5.4 Configuration Defaults

```rust
pub struct TierConfig {
    // When to transition HOT → WARM
    pub hot_to_warm_days: u32,           // Default: 7
    pub hot_statuses: Vec<String>,        // ["NEW", "OPEN", "IN_PROGRESS", "PENDING", "ON_HOLD"]
    
    // When to transition WARM → COLD
    pub warm_to_cold_days: u32,          // Default: 90
    
    // When to purge from COLD
    pub cold_retention_years: u32,        // Default: 7 (compliance)
    
    // Reheat behavior
    pub auto_reheat_enabled: bool,        // Default: true
    pub reheat_on_view: bool,             // Default: true
    pub reheat_on_search: bool,           // Default: false (prevents bulk reheat)
    pub reheat_cooldown_hours: u32,       // Default: 24
    
    // Performance tuning
    pub batch_size: u32,                  // Default: 500
    pub archive_window_start_hour: u32,   // Default: 2 (2 AM)
    pub archive_window_end_hour: u32,     // Default: 5 (5 AM)
}
```

---

## 6. Implementation: Rust Backend

### 6.1 Tiering Service

```rust
// src/services/tiering_service.rs

use chrono::{Duration, Utc};
use surrealdb::Surreal;
use crate::models::Ticket;
use crate::config::TierConfig;

pub struct TieringService {
    db: Surreal<Client>,
    config: TierConfig,
}

impl TieringService {
    /// Archive tickets that meet cold tier criteria
    pub async fn run_archival_job(&self) -> Result<ArchivalReport, TieringError> {
        let cutoff_date = Utc::now() - Duration::days(self.config.warm_to_cold_days as i64);
        
        // Find archival candidates
        let candidates: Vec<Ticket> = self.db.query(r#"
            SELECT * FROM ticket 
            WHERE tier = 'warm'
              AND status IN ['CLOSED', 'CANCELED', 'RESOLVED']
              AND last_accessed_at < $cutoff
            LIMIT $batch_size
        "#)
        .bind(("cutoff", cutoff_date))
        .bind(("batch_size", self.config.batch_size))
        .await?
        .take(0)?;
        
        let mut archived_count = 0;
        let mut errors = vec![];
        
        for ticket in candidates {
            match self.archive_ticket(&ticket).await {
                Ok(_) => archived_count += 1,
                Err(e) => errors.push((ticket.id.clone(), e)),
            }
        }
        
        Ok(ArchivalReport {
            processed: candidates.len(),
            archived: archived_count,
            errors,
            timestamp: Utc::now(),
        })
    }
    
    /// Archive a single ticket to cold storage
    async fn archive_ticket(&self, ticket: &Ticket) -> Result<(), TieringError> {
        // Start transaction
        self.db.query("BEGIN TRANSACTION").await?;
        
        // 1. Get comment count and last 10 history entries
        let comment_count: i32 = self.db.query(
            "SELECT count() FROM ticket_comments WHERE ticket_id = $id GROUP ALL"
        )
        .bind(("id", &ticket.id))
        .await?
        .take::<Option<i32>>(0)?
        .unwrap_or(0);
        
        let history_snapshot: Vec<HistoryEntry> = self.db.query(r#"
            SELECT * FROM ticket_history 
            WHERE ticket_id = $id 
            ORDER BY created_at DESC 
            LIMIT 10
        "#)
        .bind(("id", &ticket.id))
        .await?
        .take(0)?;
        
        // 2. Insert into archive table
        let archive_record = TicketArchive {
            original_id: ticket.id.clone(),
            namespace: ticket.namespace.clone(),
            number: ticket.number,
            title: ticket.title.clone(),
            description: ticket.description.clone(),
            type_: ticket.type_.clone(),
            status: ticket.status.clone(),
            priority: ticket.priority.clone(),
            // ... copy all fields ...
            archived_at: Utc::now(),
            archive_reason: "age_policy".to_string(),
            comment_count,
            history_snapshot,
        };
        
        self.db.create::<Vec<TicketArchive>>("ticket_archive")
            .content(archive_record)
            .await?;
        
        // 3. Archive comments
        self.db.query(r#"
            INSERT INTO ticket_comments_archive 
            SELECT *, $archived_at AS archived_at, id AS original_id 
            FROM ticket_comments 
            WHERE ticket_id = $id
        "#)
        .bind(("id", &ticket.id))
        .bind(("archived_at", Utc::now()))
        .await?;
        
        // 4. Delete from hot tables
        self.db.query("DELETE FROM ticket_comments WHERE ticket_id = $id")
            .bind(("id", &ticket.id))
            .await?;
        
        self.db.query("DELETE FROM ticket_history WHERE ticket_id = $id")
            .bind(("id", &ticket.id))
            .await?;
        
        self.db.query("DELETE FROM ticket WHERE id = $id")
            .bind(("id", &ticket.id))
            .await?;
        
        // 5. Log the operation
        self.db.create::<Vec<TieringOperation>>("tiering_operations")
            .content(TieringOperation {
                operation_type: "archive".to_string(),
                ticket_id: ticket.id.clone(),
                ticket_number: ticket.number,
                from_tier: "warm".to_string(),
                to_tier: "cold".to_string(),
                reason: "age_policy".to_string(),
                triggered_by: "scheduler".to_string(),
                created_at: Utc::now(),
            })
            .await?;
        
        // Commit transaction
        self.db.query("COMMIT TRANSACTION").await?;
        
        Ok(())
    }
    
    /// Reheat a ticket from cold to hot tier
    pub async fn reheat_ticket(&self, ticket_number: i32, namespace: &str) -> Result<Ticket, TieringError> {
        // Check if in archive
        let archived: Option<TicketArchive> = self.db.query(r#"
            SELECT * FROM ticket_archive 
            WHERE number = $number AND namespace = $namespace
        "#)
        .bind(("number", ticket_number))
        .bind(("namespace", namespace))
        .await?
        .take(0)?;
        
        let archived = archived.ok_or(TieringError::NotFound)?;
        
        // Check reheat cooldown
        if let Some(last_reheated) = archived.last_reheated_at {
            let cooldown = Duration::hours(self.config.reheat_cooldown_hours as i64);
            if Utc::now() - last_reheated < cooldown {
                // Return from archive without reheat (serve cold)
                return Ok(archived.into_ticket());
            }
        }
        
        // Start transaction
        self.db.query("BEGIN TRANSACTION").await?;
        
        // 1. Restore to hot table
        let ticket = Ticket {
            id: archived.original_id.clone(),
            namespace: archived.namespace.clone(),
            number: archived.number,
            // ... restore all fields ...
            tier: "hot".to_string(),
            last_accessed_at: Utc::now(),
            reheated_count: archived.reheated_count.unwrap_or(0) + 1,
            last_reheated_at: Some(Utc::now()),
        };
        
        self.db.create::<Vec<Ticket>>("ticket")
            .content(&ticket)
            .await?;
        
        // 2. Restore comments
        self.db.query(r#"
            INSERT INTO ticket_comments 
            SELECT *, 'hot' AS tier 
            FROM ticket_comments_archive 
            WHERE original_ticket_id = $id
        "#)
        .bind(("id", &archived.original_id))
        .await?;
        
        // 3. Delete from archive
        self.db.query("DELETE FROM ticket_archive WHERE original_id = $id")
            .bind(("id", &archived.original_id))
            .await?;
        
        self.db.query("DELETE FROM ticket_comments_archive WHERE original_ticket_id = $id")
            .bind(("id", &archived.original_id))
            .await?;
        
        // 4. Log reheat operation
        self.db.create::<Vec<TieringOperation>>("tiering_operations")
            .content(TieringOperation {
                operation_type: "reheat".to_string(),
                ticket_id: archived.original_id.clone(),
                ticket_number: archived.number,
                from_tier: "cold".to_string(),
                to_tier: "hot".to_string(),
                reason: "user_access".to_string(),
                triggered_by: "access_pattern".to_string(),
                created_at: Utc::now(),
            })
            .await?;
        
        self.db.query("COMMIT TRANSACTION").await?;
        
        Ok(ticket)
    }
    
    /// Update tier based on status change
    pub async fn on_ticket_status_change(&self, ticket_id: &str, new_status: &str) -> Result<(), TieringError> {
        let is_hot_status = self.config.hot_statuses.contains(&new_status.to_string());
        
        let new_tier = if is_hot_status { "hot" } else { "warm" };
        
        self.db.query(r#"
            UPDATE ticket SET 
                tier = $tier,
                last_accessed_at = time::now()
            WHERE id = $id
        "#)
        .bind(("id", ticket_id))
        .bind(("tier", new_tier))
        .await?;
        
        Ok(())
    }
    
    /// Record access for tiering decisions
    pub async fn record_access(&self, ticket_id: &str) -> Result<(), TieringError> {
        self.db.query(r#"
            UPDATE ticket SET 
                last_accessed_at = time::now(),
                access_count = access_count + 1
            WHERE id = $id
        "#)
        .bind(("id", ticket_id))
        .await?;
        
        Ok(())
    }
}
```

### 6.2 Unified Ticket Query Layer

```rust
// src/repositories/ticket_repository.rs

impl TicketRepository {
    /// Get ticket by number - checks hot tier first, then cold
    pub async fn get_by_number(
        &self, 
        number: i32, 
        namespace: &str,
        include_archived: bool,
    ) -> Result<Option<TicketResponse>, DbError> {
        // First, check hot/warm tier
        let ticket: Option<Ticket> = self.db.query(r#"
            SELECT * FROM ticket 
            WHERE number = $number AND namespace = $namespace
        "#)
        .bind(("number", number))
        .bind(("namespace", namespace))
        .await?
        .take(0)?;
        
        if let Some(mut ticket) = ticket {
            // Record access for tiering
            self.tiering_service.record_access(&ticket.id).await?;
            return Ok(Some(ticket.into()));
        }
        
        // If not found and include_archived, check cold tier
        if include_archived {
            let archived: Option<TicketArchive> = self.db.query(r#"
                SELECT * FROM ticket_archive 
                WHERE number = $number AND namespace = $namespace
            "#)
            .bind(("number", number))
            .bind(("namespace", namespace))
            .await?
            .take(0)?;
            
            if let Some(archived) = archived {
                // Auto-reheat if configured
                if self.tiering_config.auto_reheat_on_access {
                    let ticket = self.tiering_service
                        .reheat_ticket(number, namespace)
                        .await?;
                    return Ok(Some(ticket.into()));
                } else {
                    // Return cold data without reheat
                    return Ok(Some(archived.into()));
                }
            }
        }
        
        Ok(None)
    }
    
    /// List tickets with tier-aware pagination
    pub async fn list(
        &self,
        filters: TicketFilters,
        pagination: Pagination,
    ) -> Result<PaginatedResponse<TicketResponse>, DbError> {
        // For list operations, default to hot/warm only
        let tier_filter = filters.include_archived
            .then(|| "")
            .unwrap_or("AND tier IN ['hot', 'warm']");
        
        let query = format!(r#"
            SELECT * FROM ticket 
            WHERE namespace = $namespace 
              {tier_filter}
              {status_filter}
              {priority_filter}
              {assignee_filter}
            ORDER BY {sort_field} {sort_dir}
            LIMIT $limit
            START $offset
        "#,
            tier_filter = tier_filter,
            status_filter = filters.status.as_ref()
                .map(|s| format!("AND status = '{}'", s))
                .unwrap_or_default(),
            priority_filter = filters.priority.as_ref()
                .map(|p| format!("AND priority = '{}'", p))
                .unwrap_or_default(),
            assignee_filter = filters.assignee.as_ref()
                .map(|a| format!("AND assignee = '{}'", a))
                .unwrap_or_default(),
            sort_field = pagination.sort_by.unwrap_or("created_at".to_string()),
            sort_dir = if pagination.sort_desc { "DESC" } else { "ASC" },
        );
        
        let tickets: Vec<Ticket> = self.db.query(&query)
            .bind(("namespace", &filters.namespace))
            .bind(("limit", pagination.limit))
            .bind(("offset", pagination.offset))
            .await?
            .take(0)?;
        
        // Get total count
        let total: i64 = self.db.query(&format!(r#"
            SELECT count() FROM ticket 
            WHERE namespace = $namespace {tier_filter}
            GROUP ALL
        "#, tier_filter = tier_filter))
        .bind(("namespace", &filters.namespace))
        .await?
        .take::<Option<i64>>(0)?
        .unwrap_or(0);
        
        Ok(PaginatedResponse {
            data: tickets.into_iter().map(Into::into).collect(),
            total,
            page: pagination.page,
            limit: pagination.limit,
            total_pages: (total as f64 / pagination.limit as f64).ceil() as i64,
        })
    }
    
    /// Search across all tiers
    pub async fn search(
        &self,
        query: &str,
        namespace: &str,
        search_archived: bool,
    ) -> Result<Vec<TicketSearchResult>, DbError> {
        let mut results = vec![];
        
        // Search hot/warm tier
        let hot_results: Vec<Ticket> = self.db.query(r#"
            SELECT * FROM ticket 
            WHERE namespace = $namespace
              AND (title CONTAINS $query OR description CONTAINS $query)
            LIMIT 50
        "#)
        .bind(("namespace", namespace))
        .bind(("query", query))
        .await?
        .take(0)?;
        
        results.extend(hot_results.into_iter().map(|t| TicketSearchResult {
            ticket: t.into(),
            tier: "hot".to_string(),
            score: 1.0,
        }));
        
        // Search cold tier if requested
        if search_archived {
            let cold_results: Vec<TicketArchive> = self.db.query(r#"
                SELECT * FROM ticket_archive 
                WHERE namespace = $namespace
                  AND (title CONTAINS $query OR description CONTAINS $query)
                LIMIT 50
            "#)
            .bind(("namespace", namespace))
            .bind(("query", query))
            .await?
            .take(0)?;
            
            results.extend(cold_results.into_iter().map(|t| TicketSearchResult {
                ticket: t.into(),
                tier: "cold".to_string(),
                score: 0.8, // Lower score for archived
            }));
        }
        
        // Sort by score
        results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
        
        Ok(results)
    }
}
```

### 6.3 Background Job Scheduler

```rust
// src/jobs/archival_scheduler.rs

use tokio_cron_scheduler::{Job, JobScheduler};

pub async fn start_tiering_scheduler(tiering_service: Arc<TieringService>) -> Result<(), SchedulerError> {
    let scheduler = JobScheduler::new().await?;
    
    // Run archival job daily at 3 AM
    let archival_job = Job::new_async("0 0 3 * * *", move |_uuid, _l| {
        let service = tiering_service.clone();
        Box::pin(async move {
            tracing::info!("Starting nightly archival job");
            
            match service.run_archival_job().await {
                Ok(report) => {
                    tracing::info!(
                        "Archival complete: {} processed, {} archived, {} errors",
                        report.processed,
                        report.archived,
                        report.errors.len()
                    );
                }
                Err(e) => {
                    tracing::error!("Archival job failed: {:?}", e);
                }
            }
        })
    })?;
    
    scheduler.add(archival_job).await?;
    
    // Run tier transition check every hour
    let transition_job = Job::new_async("0 0 * * * *", move |_uuid, _l| {
        let service = tiering_service.clone();
        Box::pin(async move {
            tracing::info!("Running hourly tier transition check");
            
            // Transition hot → warm for closed tickets
            let _ = service.transition_hot_to_warm().await;
        })
    })?;
    
    scheduler.add(transition_job).await?;
    scheduler.start().await?;
    
    Ok(())
}
```

---

## 7. API Layer Integration

### 7.1 Tier-Aware Endpoints

```rust
// src/handlers/tickets.rs

/// GET /api/v1/tickets/{id}
pub async fn get_ticket(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Query(params): Query<GetTicketParams>,
) -> Result<Json<TicketResponse>, AppError> {
    let ticket = state.ticket_repo
        .get_by_id(&id, params.include_archived.unwrap_or(true))
        .await?
        .ok_or(AppError::NotFound)?;
    
    Ok(Json(ticket))
}

/// GET /api/v1/tickets
pub async fn list_tickets(
    State(state): State<AppState>,
    Query(params): Query<ListTicketsParams>,
    claims: JwtClaims,
) -> Result<Json<PaginatedResponse<TicketResponse>>, AppError> {
    let filters = TicketFilters {
        namespace: claims.namespace.clone(),
        status: params.status,
        priority: params.priority,
        assignee: params.assignee,
        include_archived: params.include_archived.unwrap_or(false),
    };
    
    let pagination = Pagination {
        page: params.page.unwrap_or(1),
        limit: params.limit.unwrap_or(25).min(100),
        sort_by: params.sort_by,
        sort_desc: params.sort_desc.unwrap_or(true),
    };
    
    let result = state.ticket_repo.list(filters, pagination).await?;
    
    Ok(Json(result))
}

/// POST /api/v1/tickets/{id}/reheat
pub async fn reheat_ticket(
    State(state): State<AppState>,
    Path(id): Path<String>,
    claims: JwtClaims,
) -> Result<Json<TicketResponse>, AppError> {
    let ticket = state.tiering_service
        .reheat_ticket_by_id(&id, &claims.namespace)
        .await?;
    
    Ok(Json(ticket.into()))
}

/// GET /api/v1/tiering/stats
pub async fn get_tiering_stats(
    State(state): State<AppState>,
    claims: JwtClaims,
) -> Result<Json<TieringStats>, AppError> {
    let stats = state.tiering_service.get_stats(&claims.namespace).await?;
    
    Ok(Json(stats))
}
```

### 7.2 Response Format

```json
// GET /api/v1/tickets/TICK-1234
{
  "status": "success",
  "data": {
    "id": "ticket:abc123",
    "number": 1234,
    "title": "Database connection timeout",
    "status": "CLOSED",
    "priority": "P2",
    // ... other fields ...
    
    // Tiering metadata
    "tier": "hot",
    "last_accessed_at": "2025-12-12T10:30:00Z",
    "access_count": 47,
    "reheated_count": 0,
    
    // Only present if reheated from archive
    "archived_at": null,
    "archive_reason": null
  },
  "meta": {
    "served_from_tier": "hot",
    "query_time_ms": 12
  }
}

// GET /api/v1/tiering/stats
{
  "status": "success",
  "data": {
    "hot_count": 1523,
    "warm_count": 4891,
    "cold_count": 48291,
    "total_count": 54705,
    
    "hot_size_mb": 45.2,
    "warm_size_mb": 128.7,
    "cold_size_mb": 892.1,
    
    "avg_hot_access_time_ms": 12,
    "avg_warm_access_time_ms": 45,
    "avg_cold_access_time_ms": 320,
    
    "archival_rate_daily": 127,
    "reheat_rate_daily": 8,
    
    "last_archival_run": "2025-12-12T03:00:00Z",
    "next_archival_run": "2025-12-13T03:00:00Z"
  }
}
```

---

## 8. Operational Considerations

### 8.1 Monitoring & Alerting

| Metric | Warning Threshold | Critical Threshold |
|--------|-------------------|-------------------|
| Hot tier count | > 10,000 | > 25,000 |
| Hot tier query latency P99 | > 100ms | > 500ms |
| Cold tier query latency P99 | > 2s | > 10s |
| Archival job duration | > 30 min | > 2 hours |
| Archival job failures | 1 in 7 days | 2 consecutive |
| Reheat rate | > 50/hour | > 200/hour |

### 8.2 Prometheus Metrics

```rust
// src/metrics/tiering.rs

lazy_static! {
    pub static ref TIER_TICKET_COUNT: IntGaugeVec = register_int_gauge_vec!(
        "archer_tickets_by_tier_total",
        "Number of tickets in each tier",
        &["tier", "namespace"]
    ).unwrap();
    
    pub static ref TIER_QUERY_DURATION: HistogramVec = register_histogram_vec!(
        "archer_tier_query_duration_seconds",
        "Query duration by tier",
        &["tier", "operation"],
        vec![0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
    ).unwrap();
    
    pub static ref ARCHIVAL_OPERATIONS: CounterVec = register_counter_vec!(
        "archer_archival_operations_total",
        "Number of archival operations",
        &["operation", "status"]  // operation: archive, reheat, transition
    ).unwrap();
}
```

### 8.3 Grafana Dashboard Panels

1. **Tier Distribution Over Time** - Stacked area chart
2. **Query Latency by Tier** - Heatmap
3. **Archival Job Health** - Status indicator
4. **Reheat Rate** - Line chart with anomaly detection
5. **Hot Tier Growth Rate** - Prediction line
6. **Cold Tier Storage Size** - Gauge with capacity planning

### 8.4 Backup Strategy

| Tier | Backup Frequency | Retention | Method |
|------|-----------------|-----------|--------|
| Hot | Continuous (WAL) | 7 days | Streaming replication |
| Warm | Daily snapshot | 30 days | Incremental backup |
| Cold | Weekly snapshot | 1 year | Full backup to S3 |
| Archive | Monthly | 7 years | Glacier Deep Archive |

### 8.5 Disaster Recovery

```
RTO (Recovery Time Objective):
- Hot Tier: < 5 minutes (failover to replica)
- Warm Tier: < 30 minutes (restore from snapshot)
- Cold Tier: < 4 hours (restore from backup)

RPO (Recovery Point Objective):
- Hot Tier: < 1 second (synchronous replication)
- Warm Tier: < 24 hours (daily backup)
- Cold Tier: < 7 days (weekly backup)
```

---

## 9. Migration Path from Current Schema

### 9.1 Phase 1: Add Tiering Fields (Non-Breaking)

```sql
-- Add tiering fields to existing ticket table
DEFINE FIELD tier ON ticket TYPE string DEFAULT 'hot';
DEFINE FIELD last_accessed_at ON ticket TYPE datetime DEFAULT time::now();
DEFINE FIELD access_count ON ticket TYPE int DEFAULT 0;
DEFINE FIELD archived_at ON ticket TYPE option<datetime>;
DEFINE FIELD archive_reason ON ticket TYPE option<string>;
DEFINE FIELD reheated_count ON ticket TYPE int DEFAULT 0;
DEFINE FIELD last_reheated_at ON ticket TYPE option<datetime>;

-- Create tiering indexes
DEFINE INDEX idx_ticket_tier ON ticket COLUMNS tier;
DEFINE INDEX idx_ticket_tier_status ON ticket COLUMNS tier, status;
DEFINE INDEX idx_ticket_last_accessed ON ticket COLUMNS tier, last_accessed_at;

-- Backfill existing tickets
UPDATE ticket SET 
    tier = IF(status IN ['CLOSED', 'CANCELED', 'RESOLVED'], 'warm', 'hot'),
    last_accessed_at = updated_at,
    access_count = 0
WHERE tier IS NONE;
```

### 9.2 Phase 2: Create Archive Tables

```sql
-- Create archive table
DEFINE TABLE ticket_archive SCHEMAFULL;
-- (full schema from section 4.2)

-- Create archive indexes
DEFINE INDEX idx_archive_number ON ticket_archive COLUMNS namespace, number;
DEFINE INDEX idx_archive_original ON ticket_archive COLUMNS original_id;
```

### 9.3 Phase 3: Deploy Tiering Service

1. Deploy background archival job (disabled)
2. Monitor tier distribution for 1 week
3. Enable archival with low batch size (50)
4. Gradually increase to target batch size

### 9.4 Phase 4: UI Integration

1. Add tier badge to ticket list
2. Add "Include Archived" toggle to search
3. Add tiering stats to admin dashboard
4. Add manual archive/reheat actions for admins

---

## 10. Configuration Reference

### 10.1 Environment Variables

```bash
# Tiering Configuration
ARCHER_TIERING_ENABLED=true
ARCHER_TIERING_HOT_TO_WARM_DAYS=7
ARCHER_TIERING_WARM_TO_COLD_DAYS=90
ARCHER_TIERING_COLD_RETENTION_YEARS=7
ARCHER_TIERING_AUTO_REHEAT=true
ARCHER_TIERING_REHEAT_COOLDOWN_HOURS=24
ARCHER_TIERING_BATCH_SIZE=500
ARCHER_TIERING_ARCHIVE_HOUR=3

# SurrealDB Tuning
SURREAL_BLOCK_CACHE_SIZE_MB=2048
SURREAL_WRITE_BUFFER_SIZE_MB=256
SURREAL_MAX_OPEN_FILES=10000
```

### 10.2 SurrealDB Performance Tuning

```toml
# surreal.toml (future config file support)
[storage]
engine = "rocksdb"

[storage.rocksdb]
# Block cache for hot data
block_cache_size = "2GB"

# Write buffer
write_buffer_size = "256MB"
max_write_buffer_number = 4

# Compaction
level0_file_num_compaction_trigger = 4
max_bytes_for_level_base = "256MB"
target_file_size_base = "64MB"

# Compression (for cold data)
compression = "lz4"
bottommost_compression = "zstd"
```

---

## 11. Summary

### Key Design Decisions

1. **Separate Tables Approach**: Hot data in `ticket`, cold data in `ticket_archive`
2. **Three Tiers**: Hot (active), Warm (closed < 90 days), Cold (archived)
3. **Auto-Reheat**: Access to archived ticket restores it to hot tier
4. **Denormalized Archives**: Cold tier is self-contained, no joins required
5. **Background Processing**: Nightly archival with configurable batch sizes

### Performance Expectations

| Operation | Hot Tier | Warm Tier | Cold Tier |
|-----------|----------|-----------|-----------|
| Single ticket fetch | < 20ms | < 50ms | < 500ms |
| List (25 items) | < 50ms | < 100ms | < 2s |
| Full-text search | < 200ms | < 500ms | < 5s |
| Archival (500 items) | N/A | N/A | < 30s |
| Reheat (single) | N/A | N/A | < 200ms |

### Implementation Priority

1. ✅ Add tiering fields to existing schema
2. ✅ Create archive tables
3. ⬜ Implement TieringService
4. ⬜ Add background scheduler
5. ⬜ Integrate with existing ticket handlers
6. ⬜ Add monitoring/metrics
7. ⬜ Frontend integration
8. ⬜ Admin controls

---

## Appendix A: SurrealDB-Specific Considerations

### A.1 Why Not Use SurrealDB's Built-in Features?

SurrealDB doesn't have native tiering, but it has features we leverage:

- **CHANGEFEED**: Track changes for audit/sync
- **Transactions**: Atomic tier transitions
- **Indexes**: Partial indexes for tier-specific queries
- **Permissions**: Tier-aware access control

### A.2 Alternative: Multiple Databases

```bash
# Production setup with separate DBs
surreal start file:data/hot.db --addr 0.0.0.0:8001 &
surreal start file:data/cold.db --addr 0.0.0.0:8002 &
```

This provides true isolation but requires cross-database coordination in application code.

### A.3 Future: SurrealDB Tiering Support

SurrealDB roadmap includes:
- Table partitioning (planned)
- Time-based retention policies (discussed)
- Native archiving (requested)

When available, we can migrate to native features with minimal application changes.

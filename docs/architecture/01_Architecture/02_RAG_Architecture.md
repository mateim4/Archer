# Archer AI - RAG Architecture & The "Librarian"

**Status:** Draft
**Component:** AI Engine / Knowledge Base
**Owner:** Archer Architecture Team

## 1. Executive Summary
The RAG (Retrieval-Augmented Generation) system in Archer is not merely a database query tool; it is governed by an active entity known as the **Librarian Agent**. This agent is responsible for the lifecycle of knowledge: ingestion, classification, permission management, freshness tracking, and retirement.

The system prioritizes **Data Sovereignty**, **Granular Permissions (RBAC)**, and **Compute Efficiency** via delta-updates.

---

## 2. The "Librarian" Agent
The Librarian is a specialized background worker (Rust-based logic + AI decision making) dedicated to maintaining the Knowledge Graph.

### 2.1 Responsibilities
1.  **Gatekeeper:** authenticates to external sources (SharePoint, Confluence, File Servers).
2.  **Assessor:** Scans file headers/metadata to determine if a file is relevant before processing.
3.  **Transcriber:** Routes images/diagrams to OCR/Vision models; routes text to splitters.
4.  **Indexer:** Calculates content hashes to prevent redundant processing (Delta Updates).
5.  **Access Controller:** Enforces "Need-to-Know" permissions, mapping Archer Agent Roles to specific Documents.

---

## 3. Ingestion Pipeline Architecture

### 3.1 Source Connectors (The "Tentacles")
We support two types of ingestion:
1.  **Push-based (Webhooks):** For modern SaaS (GitHub, Confluence Cloud). Source sends payload on change.
2.  **Pull-based (Crawlers):** For legacy/local (SMB Shares, Local Files). Runs on schedule.

**Tech Stack:**
- **Core Logic:** Rust (`tokio` async runtime).
- **Document Parsing:** `pdf-extract`, `docx-rs`.
- **Legacy Connectors:** Wrapped Python scripts (using Unstructured.io or LlamaIndex readers) running in the AI Container, communicating via gRPC to the Rust backend.

### 3.2 The "Delta-Update" Mechanism (Compute Saver)
To avoid re-embedding 10,000 pages when 1 paragraph changes:

1.  **File Level Check:** Compare file modification time (`mtime`) and file size.
2.  **Section Level Hashing:**
    - Document is split into logical sections (Headers, Divs).
    - A `SHA-256` hash is calculated for the *text content* of each section.
    - **Logic:**
        ```
        if new_section_hash != stored_section_hash {
            delete_old_chunks(section_id);
            embed_and_store_new_chunks(section_content);
        } else {
            update_last_seen_timestamp(section_id); // Mark as fresh without re-compute
        }
        ```

### 3.3 OCR & Visual Data
- **Trigger:** Configurable threshold (e.g., "If PDF contains < 5% text, assume scan").
- **Engine:**
    - **Default:** Tesseract (Self-hosted, CPU heavy).
    - **Advanced:** User can plug in a Vision LLM (e.g., Llava or GPT-4o-mini) to "Describe this network diagram" rather than just extracting text.
    - **Result:** The description is embedded as text, allowing semantic search to find diagrams based on their content.

---

## 4. Permission & Multi-Tenancy

### 4.1 Tenancy Isolation
SurrealDB Namespaces are used to strictly isolate Tenants.
- `Namespace: Tenant_A`
- `Namespace: Tenant_B`
*Cross-tenant sharing is physically impossible unless the connection string is altered by a Super-Admin configuration.*

### 4.2 Agent "Need-to-Know"
We do not rely solely on Source permissions. Archer implements an internal overlay:
- **Graph Edge:** `(Agent:Operations) -[:ALLOWED_ACCESS]-> (Doc:NetworkTopology)`
- **Graph Edge:** `(Agent:HR_Bot) -[:BLOCKED_ACCESS]-> (Doc:NetworkTopology)`

When the Librarian ingests a file, it tags it with a `sensitivity_score`.
- **Public/General:** Accessible by all Agents.
- **Confidential (IPs,creds):** Accessible only by Operations Agent.
- **Restricted:** Accessible only by specific named users or Admin Agent.

---

## 5. Storage Strategy (SurrealDB)

We utilize SurrealDB's hybrid nature (Graph + Document + Vector).

1.  **`doc_metadata` (Graph Node):** High-level info (Title, Source, URL, Version).
2.  **`doc_chunk` (Vector Node):** The actual text + Vector Embedding (Float32 Array).
3.  **`relations` (Edges):**
    - `doc_metadata` -> `HAS_PART` -> `doc_chunk`
    - `doc_chunk` -> `NEXT_CHUNK` -> `doc_chunk` (Linked list for context window expansion).

---

## 6. Feedback & Correction Loop
When a user flags a RAG response as "Outdated" or "Wrong":
1.  **Flagging:** The Chunk ID is recorded in a `feedback_queue`.
2.  **Librarian Action:**
    - Checks source for a newer version immediately.
    - If no newer version, flags the document as `review_needed` in the Admin Panel.
3.  **Resolution:** Admin can "Deprecate" the document or upload a "Correction Patch" (a text file linked to the original document that overrides specific facts).

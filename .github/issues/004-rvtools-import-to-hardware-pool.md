Title: RVTools Import → Persist Hosts to Hardware Pool (Reuse Existing Parser)

Summary
- Wire the current RVTools parsing pipeline to persist discovered hosts into `hardware_pool` with dedupe.
- Keep virtual objects (VMs, networks, datastores) as a roadmap.

Scope
- Use legacy-server + Rust CLI outputs.
- Normalize hosts to hardware_pool fields and upsert by serial_number (fallback asset_tag).
- Provide import status and summary API.

Acceptance Criteria
- Uploading a valid RVTools file results in new or updated hosts in hardware_pool.
- Dedupe prevents duplicates; summary shows counts (inserted/updated/skipped).
- No schema changes to parser required.

Tasks
- [ ] Add persistence layer that maps parser output → hardware_pool records.
- [ ] Add summary endpoint for last import.
- [ ] Update UI to show import results and link to hosts.

Dependencies
- Issue 001 endpoints for hardware hosts.

Labels: backend, integration, rvtools, hardware

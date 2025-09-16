Title: Roadmap: RVTools Virtual Objects (VMs, Networks, Datastores) Ingestion

Summary
- Extend RVTools ingestion to parse and persist virtual objects (VMs, networks, datastores) and link to hosts.
- Expose per-VM timelines and planned migration scheduling.

Scope
- New tables for VMs, networks, datastores with relationships to hardware_pool.
- Parser mapping from existing outputs to new tables (no immediate parser changes if already present).
- UI: future visx views to show VM scheduling.

Acceptance Criteria
- Data model and endpoints drafted; initial ingest POC for VMs stored and linked.

Labels: roadmap, rvtools, virtualization, data-model

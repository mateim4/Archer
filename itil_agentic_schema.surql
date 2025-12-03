/* 
   ARCHER ITIL & AGENTIC SCHEMA EXTENSION
   Supports: Integration Hub, ITSM, Agentic Ops, Nutanix Specifics
*/

/* --- 1. INTEGRATION HUB --- */

DEFINE TABLE integration_connector SCHEMAFULL;
DEFINE FIELD name ON integration_connector TYPE string;
DEFINE FIELD type ON integration_connector TYPE string ASSERT $value INSIDE ['NUTANIX_PC', 'CISCO_ACI', 'SPLUNK', 'BMC_IPMI', 'GENERIC_REST'];
DEFINE FIELD base_url ON integration_connector TYPE string;
DEFINE FIELD auth_config ON integration_connector TYPE object; -- Encrypted refs or vault paths
DEFINE FIELD status ON integration_connector TYPE string DEFAULT 'ACTIVE';
DEFINE FIELD last_sync ON integration_connector TYPE datetime;

/* --- 2. ITSM (TICKETING) --- */

DEFINE TABLE ticket SCHEMAFULL;
DEFINE FIELD title ON ticket TYPE string;
DEFINE FIELD description ON ticket TYPE string;
DEFINE FIELD type ON ticket TYPE string ASSERT $value INSIDE ['INCIDENT', 'PROBLEM', 'CHANGE', 'SERVICE_REQUEST'];
DEFINE FIELD priority ON ticket TYPE string ASSERT $value INSIDE ['P1', 'P2', 'P3', 'P4'];
DEFINE FIELD status ON ticket TYPE string DEFAULT 'NEW';
DEFINE FIELD related_asset ON ticket TYPE record(hardware_lot); -- Link to CMDB
DEFINE FIELD related_project ON ticket TYPE record(project); -- Link to PPM
DEFINE FIELD assignee ON ticket TYPE string;
DEFINE FIELD created_by ON ticket TYPE string;
DEFINE FIELD created_at ON ticket TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON ticket TYPE datetime DEFAULT time::now();

/* --- 3. AGENTIC OPS (AI MEMORY & TOOLS) --- */

DEFINE TABLE agent_job SCHEMAFULL;
DEFINE FIELD intent ON agent_job TYPE string; -- "Investigate high CPU on Cluster A"
DEFINE FIELD status ON agent_job TYPE string ASSERT $value INSIDE ['THINKING', 'WAITING_APPROVAL', 'EXECUTING', 'COMPLETED', 'FAILED'];
DEFINE FIELD context ON agent_job TYPE object; -- Snapshot of relevant system state
DEFINE FIELD steps_taken ON agent_job TYPE array;
DEFINE FIELD created_at ON agent_job TYPE datetime DEFAULT time::now();

DEFINE TABLE agent_audit_log SCHEMAFULL;
DEFINE FIELD job_id ON agent_audit_log TYPE record(agent_job);
DEFINE FIELD tool_used ON agent_audit_log TYPE string; -- e.g., "nutanix_api.get_vm_stats"
DEFINE FIELD input_params ON agent_audit_log TYPE object;
DEFINE FIELD output_result ON agent_audit_log TYPE string;
DEFINE FIELD timestamp ON agent_audit_log TYPE datetime DEFAULT time::now();

/* --- 4. NUTANIX SPECIFICS (CMDB EXTENSION) --- */

DEFINE TABLE nutanix_cluster SCHEMAFULL;
DEFINE FIELD name ON nutanix_cluster TYPE string;
DEFINE FIELD prism_central_id ON nutanix_cluster TYPE record(integration_connector);
DEFINE FIELD aos_version ON nutanix_cluster TYPE string;
DEFINE FIELD hypervisor_type ON nutanix_cluster TYPE string;
DEFINE FIELD capacity_cpu_ghz ON nutanix_cluster TYPE float;
DEFINE FIELD capacity_ram_gb ON nutanix_cluster TYPE float;
DEFINE FIELD capacity_storage_tb ON nutanix_cluster TYPE float;
DEFINE FIELD hardware_lots ON nutanix_cluster TYPE array; -- Links to physical hardware

/* --- RELATIONS --- */

DEFINE TABLE monitors SCHEMAFULL; -- Graph edge: integration -> monitors -> asset
DEFINE FIELD last_check ON monitors TYPE datetime;
DEFINE FIELD health_score ON monitors TYPE int;

DEFINE TABLE affects SCHEMAFULL; -- Graph edge: ticket -> affects -> asset
DEFINE FIELD impact_level ON affects TYPE string;

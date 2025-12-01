# 6. Security Considerations and Evaluations

## Security Architecture

### 1. Authentication & Authorization
*   **Current:** Local Auth / Mock.
*   **Target:** OIDC/SAML integration (Azure AD).
*   **RBAC:** Role-Based Access Control implemented in SurrealDB (Scope-based).
    *   *Roles:* Admin, Project Manager, Ops Engineer, Viewer.

### 2. Data Protection
*   **At Rest:** SurrealDB encryption. Sensitive fields (API Keys) stored in Vault (HashiCorp) or encrypted columns.
*   **In Transit:** TLS 1.3 for all API communication.

### 3. Agent Safety (AI Security)
*   **Human-in-the-Loop:** Agents cannot execute "Write" or "Delete" actions without explicit human approval via the UI.
*   **Tool Sandboxing:** Agent tools are Rust functions with strict type checking and scope limits. No arbitrary code execution.
*   **Audit Logging:** Every Agent thought and action is logged to `agent_audit_log` (Immutable).

### 4. Integration Security
*   **Credential Management:** Integration Hub uses a secure credential store. Credentials are never exposed to the Frontend.
*   **Least Privilege:** Connectors use read-only service accounts on target systems (Nutanix, Cisco) where possible.

## Risk Assessment
*   **Risk:** AI Hallucination executing wrong command.
    *   *Mitigation:* "Read-only" by default. "Write" requires approval.
*   **Risk:** Data leakage via LLM.
    *   *Mitigation:* PII/Sensitive data sanitization before sending context to LLM. Local LLM support (Llama 3) for air-gapped environments.

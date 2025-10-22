# HLD Generation System - 5-Week Implementation Plan

**Date**: October 23, 2025  
**Status**: 🚧 Planning Phase  
**Target Completion**: Week of November 27, 2025

---

## 🎯 Executive Summary

**Goal**: Build a modular, variable-driven HLD generation system for Hyper-V clusters that integrates with the cluster configurator wizard and RVTools auto-population.

**Architecture**:
- **Variable Separation**: Store HLD variables separately from template in SurrealDB
- **Modular Sections**: Users can enable/disable HLD sections (9 major sections + Global)
- **Variable Mapping**: Cluster wizard outputs auto-populate HLD variables
- **RVTools Integration**: Parse uploaded RVTools data → map to variables → user confirmation
- **Word Export**: Use Word template with bookmarks (Option A) for reliable formatting preservation
- **Template Versioning**: Support multiple template versions with migration paths

**Timeline**: 5 weeks (15 tasks)  
**Estimated Lines of Code**: ~8,000 lines (backend: 4,500, frontend: 3,500)

---

## 📅 Week-by-Week Breakdown

### **Week 1: Data Layer Foundation** (Days 1-7)
**Goal**: Build database schema, API endpoints, and variable validation engine

#### Task 1: Database Schema & API Foundation
**Effort**: 3 days

**Database Tables**:
```sql
-- HLD Template definition
DEFINE TABLE hld_templates SCHEMAFULL;
DEFINE FIELD name ON hld_templates TYPE string;
DEFINE FIELD description ON hld_templates TYPE string;
DEFINE FIELD version ON hld_templates TYPE string;
DEFINE FIELD sections ON hld_templates TYPE array;
DEFINE FIELD created_at ON hld_templates TYPE datetime;
DEFINE FIELD updated_at ON hld_templates TYPE datetime;

-- HLD Sections (reusable)
DEFINE TABLE hld_sections SCHEMAFULL;
DEFINE FIELD template_id ON hld_sections TYPE record<hld_templates>;
DEFINE FIELD name ON hld_sections TYPE string;
DEFINE FIELD order ON hld_sections TYPE int;
DEFINE FIELD content_template ON hld_sections TYPE string; -- Markdown with {{variables}}
DEFINE FIELD required ON hld_sections TYPE bool;
DEFINE FIELD depends_on ON hld_sections TYPE array; -- Array of section IDs

-- HLD Project (links project to template + variable values)
DEFINE TABLE hld_projects SCHEMAFULL;
DEFINE FIELD project_id ON hld_projects TYPE record<projects>;
DEFINE FIELD template_id ON hld_projects TYPE record<hld_templates>;
DEFINE FIELD template_version ON hld_projects TYPE string;
DEFINE FIELD enabled_sections ON hld_projects TYPE array; -- Array of section IDs
DEFINE FIELD created_at ON hld_projects TYPE datetime;
DEFINE FIELD updated_at ON hld_projects TYPE datetime;

-- HLD Variables (actual values for a project)
DEFINE TABLE hld_variables SCHEMAFULL;
DEFINE FIELD hld_project_id ON hld_variables TYPE record<hld_projects>;
DEFINE FIELD variable_name ON hld_variables TYPE string;
DEFINE FIELD variable_value ON hld_variables TYPE option<string | int | float | bool | datetime | array | object>;
DEFINE FIELD variable_type ON hld_variables TYPE string; -- "string", "integer", "float", "boolean", "date", "array", "object"
DEFINE FIELD section ON hld_variables TYPE string; -- Which section this variable belongs to
DEFINE FIELD source ON hld_variables TYPE string; -- "manual", "rvtools", "wizard"
DEFINE FIELD updated_at ON hld_variables TYPE datetime;
DEFINE INDEX unique_variable ON hld_variables FIELDS hld_project_id, variable_name UNIQUE;
```

**API Endpoints (Rust - Axum)**:
```rust
// backend/src/api/hld_api.rs
POST   /api/v1/hld/templates                          // Create template
GET    /api/v1/hld/templates                          // List templates
GET    /api/v1/hld/templates/:id                      // Get template details
PUT    /api/v1/hld/templates/:id                      // Update template
DELETE /api/v1/hld/templates/:id                      // Delete template

POST   /api/v1/projects/:project_id/hld               // Create HLD project for project
GET    /api/v1/projects/:project_id/hld               // Get HLD project
PUT    /api/v1/projects/:project_id/hld/sections      // Update enabled sections

GET    /api/v1/projects/:project_id/hld/variables     // Get all variables
PUT    /api/v1/projects/:project_id/hld/variables     // Bulk update variables
GET    /api/v1/projects/:project_id/hld/variables/:name // Get single variable
PUT    /api/v1/projects/:project_id/hld/variables/:name // Update single variable
```

**Files**:
- `backend/src/models/hld.rs` (data structures)
- `backend/database_schema_hld.surql` (database schema)
- `backend/src/api/hld_api.rs` (REST endpoints)

---

#### Task 2: Variable Type System & Validation
**Effort**: 2 days

**Variable Type System**:
```rust
// backend/src/services/variable_validator.rs
pub enum VariableType {
    String,
    Integer,
    Float,
    Boolean,
    Date,
    Array,
    Object,
}

pub struct ValidationRule {
    pub required: bool,
    pub min_value: Option<f64>,      // For integer/float
    pub max_value: Option<f64>,
    pub min_length: Option<usize>,   // For string/array
    pub max_length: Option<usize>,
    pub pattern: Option<String>,     // Regex for string
    pub enum_values: Option<Vec<String>>, // Allowed values
    pub depends_on: Vec<String>,     // Other variables that must exist first
}

pub struct VariableDefinition {
    pub name: String,
    pub var_type: VariableType,
    pub section: String,
    pub description: String,
    pub example_value: String,
    pub validation: ValidationRule,
}

pub fn validate_variable(
    definition: &VariableDefinition,
    value: &VariableValue,
    all_variables: &HashMap<String, VariableValue>
) -> Result<(), ValidationError> {
    // Validate type
    // Validate constraints (min/max, pattern, enum)
    // Validate dependencies
}
```

**Validation Rules Examples**:
```rust
// node_count: integer, required, min=1, max=16
VariableDefinition {
    name: "node_count".to_string(),
    var_type: VariableType::Integer,
    section: "Infrastructure".to_string(),
    description: "Number of physical Hyper-V hosts".to_string(),
    example_value: "4".to_string(),
    validation: ValidationRule {
        required: true,
        min_value: Some(1.0),
        max_value: Some(16.0),
        depends_on: vec![],
        ..Default::default()
    },
}

// cluster_ip_address: string, required, regex pattern for IP
VariableDefinition {
    name: "cluster_ip_address".to_string(),
    var_type: VariableType::String,
    section: "Cluster".to_string(),
    validation: ValidationRule {
        required: true,
        pattern: Some(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$".to_string()),
        ..Default::default()
    },
}

// management_framework: enum, required, specific values
VariableDefinition {
    name: "management_framework".to_string(),
    var_type: VariableType::String,
    section: "Core Decisions".to_string(),
    validation: ValidationRule {
        required: true,
        enum_values: Some(vec![
            "Windows Admin Center".to_string(),
            "System Center Virtual Machine Manager".to_string(),
        ]),
        ..Default::default()
    },
}
```

**Files**:
- `backend/src/services/variable_validator.rs`
- `backend/src/services/variable_definitions.rs` (hardcoded variable definitions from Gemini template)

---

### **Week 2: UI & RVTools Integration** (Days 8-14)
**Goal**: Build variable editor UI and RVTools auto-population

#### Task 3: RVTools Parser & Variable Mapping Engine
**Effort**: 3 days

**RVTools Data Extraction**:
```typescript
// frontend/src/utils/hldVariableMapping.ts
interface RVToolsHLDMapping {
  // From vHost tab
  node_count: () => vHostData.length,
  cpu_model: () => vHostData[0].CPUModel,
  cpu_socket_count: () => vHostData[0].NumCPU,
  cpu_cores: () => vHostData[0].CoresPerSocket,
  ram_gb: () => vHostData[0].MemoryGB,
  
  // From vCluster tab
  cluster_name: () => vClusterData[0].Name,
  
  // From vNetwork tab
  mgmt_vlan_id: () => extractVLANByName(vNetworkData, "Management"),
  cluster_vlan_id: () => extractVLANByName(vNetworkData, "Cluster"),
  
  // From vInfo tab (VMs)
  primary_workload_type: () => inferWorkloadType(vInfoData),
  
  // Calculated/derived
  total_storage_tb_usable: () => calculateUsableStorage(vHostData),
}

function mapRVToolsToHLDVariables(
  rvtoolsData: RVToolsData
): Record<string, HLDVariable> {
  const mapping = new RVToolsHLDMapping(rvtoolsData);
  const variables: Record<string, HLDVariable> = {};
  
  // Extract each variable using mapping
  for (const [varName, extractor] of Object.entries(mapping)) {
    try {
      variables[varName] = {
        name: varName,
        value: extractor(),
        source: 'rvtools',
        confidence: 'high', // or 'medium', 'low' based on data quality
      };
    } catch (error) {
      // Handle missing data gracefully
      variables[varName] = {
        name: varName,
        value: null,
        source: 'rvtools',
        confidence: 'none',
        error: `Could not extract: ${error.message}`,
      };
    }
  }
  
  return variables;
}
```

**Backend Mapping Service**:
```rust
// backend/src/services/rvtools_hld_mapper.rs
pub struct RVToolsHLDMapper {
    rvtools_data: RVToolsData,
}

impl RVToolsHLDMapper {
    pub fn map_to_hld_variables(&self) -> Result<HashMap<String, VariableValue>> {
        let mut variables = HashMap::new();
        
        // Extract from vHost
        if let Some(first_host) = self.rvtools_data.vhost.first() {
            variables.insert("cpu_model".to_string(), first_host.cpu_model.clone().into());
            variables.insert("ram_gb".to_string(), first_host.memory_gb.into());
        }
        
        // Extract from vCluster
        if let Some(cluster) = self.rvtools_data.vcluster.first() {
            variables.insert("cluster_name".to_string(), cluster.name.clone().into());
        }
        
        // Calculated values
        variables.insert("node_count".to_string(), self.rvtools_data.vhost.len().into());
        
        Ok(variables)
    }
}
```

**Files**:
- `backend/src/services/rvtools_hld_mapper.rs`
- `frontend/src/utils/hldVariableMapping.ts`

---

#### Task 4: HLD Settings Panel UI - Variable Editor
**Effort**: 3 days

**Component Structure**:
```typescript
// frontend/src/views/HLDConfiguration.tsx
export function HLDConfiguration() {
  const { projectId } = useParams();
  const { variables, updateVariable, updateVariables } = useHLDVariables(projectId);
  const { sections, toggleSection } = useHLDSections(projectId);
  
  return (
    <div className="hld-configuration">
      <PurpleGlassCard header="HLD Configuration" glass="medium">
        <Tabs>
          <Tab label="Variables">
            <VariableEditor variables={variables} onUpdate={updateVariable} />
          </Tab>
          <Tab label="Sections">
            <SectionManager sections={sections} onToggle={toggleSection} />
          </Tab>
          <Tab label="RVTools Auto-Fill">
            <RVToolsAutoFill projectId={projectId} />
          </Tab>
          <Tab label="Preview">
            <HLDPreview projectId={projectId} />
          </Tab>
        </Tabs>
      </PurpleGlassCard>
    </div>
  );
}

// frontend/src/components/hld/VariableEditor.tsx
export function VariableEditor({ variables, onUpdate }) {
  // Group variables by section
  const grouped = groupBy(variables, 'section');
  
  return (
    <div className="variable-editor">
      {Object.entries(grouped).map(([section, vars]) => (
        <PurpleGlassCard key={section} header={section} variant="subtle" glass="light">
          {vars.map((variable) => (
            <VariableField
              key={variable.name}
              variable={variable}
              onChange={(value) => onUpdate(variable.name, value)}
            />
          ))}
        </PurpleGlassCard>
      ))}
    </div>
  );
}

function VariableField({ variable, onChange }) {
  switch (variable.type) {
    case 'string':
      return (
        <PurpleGlassInput
          label={variable.description}
          value={variable.value || ''}
          onChange={(e) => onChange(e.target.value)}
          helperText={`Example: ${variable.example_value}`}
          required={variable.validation.required}
          validationState={variable.error ? 'error' : 'default'}
          glass="light"
        />
      );
    
    case 'integer':
    case 'float':
      return (
        <PurpleGlassInput
          type="number"
          label={variable.description}
          value={variable.value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          helperText={`Min: ${variable.validation.min_value}, Max: ${variable.validation.max_value}`}
          required={variable.validation.required}
          glass="light"
        />
      );
    
    case 'boolean':
      return (
        <PurpleGlassSwitch
          label={variable.description}
          checked={variable.value || false}
          onChange={(e) => onChange(e.target.checked)}
          glass="light"
        />
      );
    
    case 'enum':
      return (
        <PurpleGlassDropdown
          label={variable.description}
          options={variable.validation.enum_values.map(v => ({ key: v, text: v }))}
          value={variable.value}
          onChange={(value) => onChange(value)}
          required={variable.validation.required}
          glass="light"
        />
      );
  }
}
```

**Files**:
- `frontend/src/views/HLDConfiguration.tsx`
- `frontend/src/components/hld/VariableEditor.tsx`
- `frontend/src/components/hld/VariableField.tsx`
- `frontend/src/hooks/useHLDVariables.ts`

---

#### Task 5: Section Management UI
**Effort**: 1 day

**Component**:
```typescript
// frontend/src/components/hld/SectionManager.tsx
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export function SectionManager({ sections, onToggle, onReorder }) {
  return (
    <DragDropContext onDragEnd={onReorder}>
      <Droppable droppableId="sections">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {sections.map((section, index) => (
              <Draggable key={section.id} draggableId={section.id} index={index}>
                {(provided) => (
                  <PurpleGlassCard
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    variant="interactive"
                    glass="light"
                  >
                    <div className="section-row">
                      <PurpleGlassCheckbox
                        label={section.name}
                        checked={section.enabled}
                        onChange={(e) => onToggle(section.id, e.target.checked)}
                      />
                      {section.required && <Badge>Required</Badge>}
                      {section.depends_on.length > 0 && (
                        <Tooltip content={`Depends on: ${section.depends_on.join(', ')}`}>
                          <Icon iconName="Info" />
                        </Tooltip>
                      )}
                    </div>
                  </PurpleGlassCard>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
```

**Files**:
- `frontend/src/components/hld/SectionManager.tsx`

---

### **Week 3: Word Export & Auto-Fill Workflow** (Days 15-21)
**Goal**: Implement Word template system and RVTools auto-fill confirmation

#### Task 6: Word Template System (Option A)
**Effort**: 4 days

**Step 1: Convert Gemini HLD to Word Template**:
1. Take Gemini's HLD document
2. Save as `.dotx` (Word template)
3. Replace all `{{variable_name}}` with Word bookmarks
4. Test: Can we inject values into bookmarks programmatically?

**Step 2: Rust Word Generation**:
```rust
// backend/src/services/word_generator.rs
use docx_rs::*;

pub struct WordGenerator {
    template_path: PathBuf,
}

impl WordGenerator {
    pub fn generate_hld(
        &self,
        variables: &HashMap<String, VariableValue>,
        enabled_sections: &[String],
    ) -> Result<Vec<u8>> {
        // Load Word template
        let template = Docx::from_file(&self.template_path)?;
        
        // Replace bookmarks with variable values
        let mut doc = template;
        for (name, value) in variables {
            doc = doc.replace_bookmark(name, &value.to_string())?;
        }
        
        // Remove disabled sections (if template supports it)
        for section in ALL_SECTIONS {
            if !enabled_sections.contains(&section.to_string()) {
                doc = doc.remove_section(section)?;
            }
        }
        
        // Render to bytes
        doc.build()?.write(&mut vec![])
    }
}
```

**Alternative (simpler): Use `docx-templates` via WASM**:
```typescript
// If Rust library is too complex, use Node.js/WASM approach
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

export async function generateHLD(
  templateBuffer: ArrayBuffer,
  variables: Record<string, any>
): Promise<Blob> {
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });
  
  doc.render(variables);
  
  const blob = doc.getZip().generate({ type: 'blob' });
  return blob;
}
```

**Files**:
- `backend/src/services/word_generator.rs`
- `templates/hld_template.dotx` (Word template with bookmarks)
- OR `frontend/src/utils/wordGenerator.ts` (if using docx-templates client-side)

---

#### Task 7: RVTools Auto-Fill Workflow
**Effort**: 2 days

**Component**:
```typescript
// frontend/src/components/hld/RVToolsAutoFillDialog.tsx
export function RVToolsAutoFillDialog({ projectId, onComplete }) {
  const [changes, setChanges] = useState<VariableChange[]>([]);
  const [loading, setLoading] = useState(false);
  
  async function fetchRVToolsSuggestions() {
    setLoading(true);
    const response = await api.post(`/projects/${projectId}/hld/autofill-preview`);
    setChanges(response.data.changes);
    setLoading(false);
  }
  
  function handleApplyAll() {
    api.put(`/projects/${projectId}/hld/variables`, {
      variables: changes.map(c => ({ name: c.name, value: c.newValue }))
    });
    onComplete();
  }
  
  function handleApplySelected() {
    const selected = changes.filter(c => c.selected);
    api.put(`/projects/${projectId}/hld/variables`, {
      variables: selected.map(c => ({ name: c.name, value: c.newValue }))
    });
    onComplete();
  }
  
  return (
    <Dialog open onClose={onComplete}>
      <DialogHeader>Auto-Fill from RVTools</DialogHeader>
      <DialogBody>
        <table>
          <thead>
            <tr>
              <th><Checkbox onChange={toggleAll} /></th>
              <th>Variable</th>
              <th>Current Value</th>
              <th>RVTools Value</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {changes.map((change) => (
              <tr key={change.name}>
                <td>
                  <PurpleGlassCheckbox
                    checked={change.selected}
                    onChange={(e) => toggleChange(change.name, e.target.checked)}
                  />
                </td>
                <td>{change.displayName}</td>
                <td>{change.currentValue || <em>Not set</em>}</td>
                <td>
                  {change.newValue !== null ? (
                    <PurpleGlassInput
                      value={change.newValue}
                      onChange={(e) => updateProposedValue(change.name, e.target.value)}
                      glass="light"
                    />
                  ) : (
                    <Badge color="warning">Not found in RVTools</Badge>
                  )}
                </td>
                <td>
                  <Badge color={getConfidenceColor(change.confidence)}>
                    {change.confidence}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DialogBody>
      <DialogFooter>
        <PurpleGlassButton variant="ghost" onClick={onComplete}>Cancel</PurpleGlassButton>
        <PurpleGlassButton variant="secondary" onClick={handleApplySelected}>
          Apply Selected
        </PurpleGlassButton>
        <PurpleGlassButton variant="primary" onClick={handleApplyAll}>
          Apply All
        </PurpleGlassButton>
      </DialogFooter>
    </Dialog>
  );
}
```

**Backend API**:
```rust
// POST /api/v1/projects/:id/hld/autofill-preview
pub async fn preview_autofill(
    project_id: String,
) -> Result<Json<AutoFillPreview>> {
    // 1. Get RVTools data for project
    let rvtools_data = get_rvtools_data(&project_id)?;
    
    // 2. Map RVTools to HLD variables
    let mapper = RVToolsHLDMapper::new(rvtools_data);
    let proposed_values = mapper.map_to_hld_variables()?;
    
    // 3. Get current HLD variable values
    let current_values = get_hld_variables(&project_id)?;
    
    // 4. Generate diff (what will change)
    let changes = proposed_values.iter().map(|(name, new_value)| {
        let current = current_values.get(name);
        VariableChange {
            name: name.clone(),
            current_value: current.map(|v| v.value.clone()),
            proposed_value: new_value.clone(),
            confidence: calculate_confidence(&rvtools_data, name),
        }
    }).collect();
    
    Ok(Json(AutoFillPreview { changes }))
}
```

**Files**:
- `frontend/src/components/hld/RVToolsAutoFillDialog.tsx`
- `backend/src/api/hld_autofill.rs`

---

#### Task 8: Export & Preview System
**Effort**: 1 day

**Export API**:
```rust
// POST /api/v1/projects/:id/hld/export
pub async fn export_hld(
    project_id: String,
) -> Result<impl IntoResponse> {
    // 1. Get HLD variables
    let variables = get_hld_variables(&project_id)?;
    
    // 2. Get enabled sections
    let hld_project = get_hld_project(&project_id)?;
    
    // 3. Generate Word document
    let word_gen = WordGenerator::new("templates/hld_template.dotx");
    let docx_bytes = word_gen.generate_hld(&variables, &hld_project.enabled_sections)?;
    
    // 4. Save to export history
    save_export_history(&project_id, &docx_bytes)?;
    
    // 5. Stream file to client
    Ok((
        StatusCode::OK,
        [(header::CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")],
        docx_bytes,
    ))
}
```

**Preview Component**:
```typescript
// frontend/src/components/hld/HLDPreview.tsx
export function HLDPreview({ projectId }) {
  const { variables } = useHLDVariables(projectId);
  const { sections } = useHLDSections(projectId);
  
  // Render template with variables (HTML preview)
  const renderedHtml = useMemo(() => {
    return renderTemplateToHtml(sections, variables);
  }, [sections, variables]);
  
  return (
    <div>
      <div className="preview-actions">
        <PurpleGlassButton
          variant="primary"
          icon={<DocumentRegular />}
          onClick={() => downloadWord(projectId)}
        >
          Export to Word
        </PurpleGlassButton>
      </div>
      
      <div className="preview-content" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
    </div>
  );
}
```

**Files**:
- `backend/src/api/hld_export.rs`
- `frontend/src/components/hld/HLDPreview.tsx`

---

### **Week 4: Wizard Integration & Advanced Features** (Days 22-28)
**Goal**: Connect wizard to HLD variables, add versioning, multi-cluster support

#### Task 9: Wizard Integration & Variable Mapping
**Effort**: 2 days

**Mapping Hook**:
```typescript
// frontend/src/hooks/useHLDSync.ts
export function useHLDSync(projectId: string) {
  const { wizardState } = useWizardState(projectId);
  const { updateVariables } = useHLDVariables(projectId);
  
  // Auto-sync wizard outputs to HLD variables
  useEffect(() => {
    if (!wizardState || !wizardState.completed) return;
    
    const hldVariables = mapWizardToHLD(wizardState);
    updateVariables(hldVariables);
  }, [wizardState]);
  
  return {
    syncNow: () => {
      const hldVariables = mapWizardToHLD(wizardState);
      updateVariables(hldVariables);
    }
  };
}

function mapWizardToHLD(wizardState: WizardState): Record<string, any> {
  return {
    // From Step 2: Capacity Analysis
    node_count: wizardState.capacity.clusters[0].nodeCount,
    cpu_model: wizardState.capacity.clusters[0].cpuModel,
    ram_gb: wizardState.capacity.clusters[0].totalMemoryGB,
    
    // From Step 3: Network Mapping
    mgmt_vlan_id: wizardState.network.managementVLAN,
    cluster_vlan_id: wizardState.network.clusterVLAN,
    lm_vlan_id: wizardState.network.liveMigrationVLAN,
    
    // From Step 4: Storage Configuration
    storage_type: wizardState.storage.type, // "S2D" or "SAN"
    cache_disk_count: wizardState.storage.cacheDiskCount,
    capacity_disk_count: wizardState.storage.capacityDiskCount,
    
    // From Step 5: Migration Strategy
    management_framework: wizardState.strategy.managementFramework,
    backup_software: wizardState.strategy.backupSoftware,
  };
}
```

**Wizard Review Step Addition**:
```typescript
// frontend/src/views/wizard/ReviewStep.tsx
export function ReviewStep() {
  const { syncNow } = useHLDSync(projectId);
  
  return (
    <div>
      {/* Existing review content */}
      
      <PurpleGlassCard header="Generate HLD" glass="medium">
        <p>Your wizard configuration is complete. Generate a High-Level Design document?</p>
        <PurpleGlassButton
          variant="primary"
          icon={<DocumentRegular />}
          onClick={() => {
            syncNow();
            navigate(`/projects/${projectId}/hld`);
          }}
        >
          Generate HLD Document
        </PurpleGlassButton>
      </PurpleGlassCard>
    </div>
  );
}
```

**Files**:
- `frontend/src/hooks/useHLDSync.ts`
- `frontend/src/views/wizard/ReviewStep.tsx`

---

#### Task 10: Template Versioning & Migration
**Effort**: 2 days

**Version Checking**:
```rust
// backend/src/services/template_migrator.rs
pub struct TemplateMigrator {
    migrations: Vec<Migration>,
}

pub struct Migration {
    from_version: String,
    to_version: String,
    variable_renames: HashMap<String, String>,
    new_variables: Vec<VariableDefinition>,
    removed_variables: Vec<String>,
}

impl TemplateMigrator {
    pub fn migrate_project(
        &self,
        project: &HLDProject,
        target_version: &str,
    ) -> Result<HLDProject> {
        let mut current_version = project.template_version.clone();
        let mut migrated_variables = project.variables.clone();
        
        while current_version != target_version {
            let migration = self.find_migration(&current_version, target_version)?;
            
            // Apply variable renames
            for (old_name, new_name) in &migration.variable_renames {
                if let Some(value) = migrated_variables.remove(old_name) {
                    migrated_variables.insert(new_name.clone(), value);
                }
            }
            
            // Add new variables with default values
            for new_var in &migration.new_variables {
                if !migrated_variables.contains_key(&new_var.name) {
                    migrated_variables.insert(new_var.name.clone(), new_var.default_value.clone());
                }
            }
            
            current_version = migration.to_version.clone();
        }
        
        Ok(HLDProject {
            template_version: target_version.to_string(),
            variables: migrated_variables,
            ..project.clone()
        })
    }
}
```

**UI Warning**:
```typescript
// Show warning if project uses old template version
{templateVersion !== latestVersion && (
  <MessageBar type="warning">
    This project uses template version {templateVersion}. 
    Latest version is {latestVersion}.
    <PurpleGlassButton variant="link" onClick={handleMigrate}>
      Migrate to Latest
    </PurpleGlassButton>
  </MessageBar>
)}
```

**Files**:
- `backend/src/services/template_migrator.rs`
- `frontend/src/components/hld/VersionWarning.tsx`

---

#### Task 11: Multi-Cluster & Dynamic Sections
**Effort**: 3 days

**Dynamic Section Rendering**:
```typescript
// Support multiple clusters in HLD
interface ClusterConfig {
  id: string;
  name: string;
  variables: Record<string, any>; // cluster-specific variables
}

// frontend/src/components/hld/MultiClusterEditor.tsx
export function MultiClusterEditor({ projectId }) {
  const [clusters, setClusters] = useState<ClusterConfig[]>([]);
  
  function addCluster() {
    setClusters([...clusters, {
      id: uuid(),
      name: `Cluster ${clusters.length + 1}`,
      variables: getDefaultClusterVariables(),
    }]);
  }
  
  return (
    <div>
      {clusters.map((cluster, index) => (
        <PurpleGlassCard key={cluster.id} header={cluster.name} glass="light">
          <VariableEditor
            variables={cluster.variables}
            onUpdate={(name, value) => updateClusterVariable(index, name, value)}
          />
        </PurpleGlassCard>
      ))}
      
      <PurpleGlassButton variant="secondary" onClick={addCluster}>
        Add Cluster
      </PurpleGlassButton>
    </div>
  );
}
```

**Template Rendering**:
```rust
// backend/src/services/template_renderer.rs
// Render template with loops for multiple clusters
pub fn render_section(
    section: &HLDSection,
    variables: &HashMap<String, VariableValue>,
    clusters: &[ClusterConfig],
) -> Result<String> {
    let mut output = String::new();
    
    if section.repeatable {
        // Render section once per cluster
        for (i, cluster) in clusters.iter().enumerate() {
            let cluster_vars = merge_variables(variables, &cluster.variables);
            let rendered = render_template(&section.content_template, &cluster_vars)?;
            output.push_str(&rendered);
        }
    } else {
        // Render section once
        output = render_template(&section.content_template, variables)?;
    }
    
    Ok(output)
}
```

**Files**:
- `frontend/src/components/hld/MultiClusterEditor.tsx`
- `backend/src/services/template_renderer.rs`

---

### **Week 5: Polish, Testing & Documentation** (Days 29-35)
**Goal**: Optimize performance, comprehensive testing, documentation

#### Task 12: Validation & Error Handling
**Effort**: 2 days

**Validation Summary**:
```typescript
// frontend/src/utils/hldValidation.ts
export function validateHLDVariables(
  variables: Record<string, HLDVariable>,
  definitions: Record<string, VariableDefinition>
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  for (const [name, definition] of Object.entries(definitions)) {
    const value = variables[name]?.value;
    
    // Required field check
    if (definition.validation.required && !value) {
      errors.push({
        variable: name,
        message: `${definition.description} is required`,
        severity: 'error',
      });
    }
    
    // Type validation
    if (value && !isValidType(value, definition.var_type)) {
      errors.push({
        variable: name,
        message: `Expected ${definition.var_type}, got ${typeof value}`,
        severity: 'error',
      });
    }
    
    // Range validation
    if (typeof value === 'number') {
      if (definition.validation.min_value && value < definition.validation.min_value) {
        errors.push({
          variable: name,
          message: `Value ${value} is below minimum ${definition.validation.min_value}`,
          severity: 'error',
        });
      }
    }
    
    // Pattern validation (IP addresses, FQDNs)
    if (typeof value === 'string' && definition.validation.pattern) {
      const regex = new RegExp(definition.validation.pattern);
      if (!regex.test(value)) {
        errors.push({
          variable: name,
          message: `Value does not match required format`,
          severity: 'error',
        });
      }
    }
    
    // Dependency validation
    for (const dep of definition.validation.depends_on) {
      if (!variables[dep]?.value) {
        warnings.push({
          variable: name,
          message: `Depends on ${dep} which is not set`,
          severity: 'warning',
        });
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
```

**Validation Summary UI**:
```typescript
// Show validation summary before export
export function ValidationSummary({ errors, warnings }) {
  if (errors.length === 0 && warnings.length === 0) {
    return <MessageBar type="success">All variables are valid!</MessageBar>;
  }
  
  return (
    <div>
      {errors.length > 0 && (
        <MessageBar type="error">
          <strong>{errors.length} error(s) found:</strong>
          <ul>
            {errors.map((err, i) => (
              <li key={i}>
                <strong>{err.variable}:</strong> {err.message}
              </li>
            ))}
          </ul>
        </MessageBar>
      )}
      
      {warnings.length > 0 && (
        <MessageBar type="warning">
          <strong>{warnings.length} warning(s):</strong>
          <ul>
            {warnings.map((warn, i) => (
              <li key={i}>
                <strong>{warn.variable}:</strong> {warn.message}
              </li>
            ))}
          </ul>
        </MessageBar>
      )}
    </div>
  );
}
```

**Files**:
- `frontend/src/utils/hldValidation.ts`
- `frontend/src/components/hld/ValidationSummary.tsx`
- `backend/src/services/hld_validator.rs`

---

#### Task 13: Performance & UX Optimization
**Effort**: 2 days

**Optimized Variable Editor** (for 100+ variables):
```typescript
// frontend/src/components/hld/VariableEditorOptimized.tsx
import { FixedSizeList as List } from 'react-window';

export function VariableEditorOptimized({ variables }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  
  // Filter variables
  const filtered = useMemo(() => {
    return variables.filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           v.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSection = !selectedSection || v.section === selectedSection;
      return matchesSearch && matchesSection;
    });
  }, [variables, searchQuery, selectedSection]);
  
  return (
    <div>
      <div className="filters">
        <PurpleGlassInput
          placeholder="Search variables..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          prefixIcon={<SearchRegular />}
          glass="light"
        />
        
        <PurpleGlassDropdown
          placeholder="Filter by section"
          options={sections}
          value={selectedSection}
          onChange={setSelectedSection}
          glass="light"
        />
      </div>
      
      {/* Virtualized list for performance */}
      <List
        height={600}
        itemCount={filtered.length}
        itemSize={80}
        width="100%"
      >
        {({ index, style }) => (
          <div style={style}>
            <VariableField variable={filtered[index]} onChange={handleUpdate} />
          </div>
        )}
      </List>
    </div>
  );
}
```

**Undo/Redo**:
```typescript
// frontend/src/hooks/useUndoableState.ts
export function useUndoableState<T>(initialValue: T) {
  const [history, setHistory] = useState<T[]>([initialValue]);
  const [index, setIndex] = useState(0);
  
  const current = history[index];
  
  const set = (newValue: T) => {
    const newHistory = history.slice(0, index + 1);
    newHistory.push(newValue);
    setHistory(newHistory);
    setIndex(newHistory.length - 1);
  };
  
  const undo = () => {
    if (index > 0) setIndex(index - 1);
  };
  
  const redo = () => {
    if (index < history.length - 1) setIndex(index + 1);
  };
  
  return { value: current, set, undo, redo, canUndo: index > 0, canRedo: index < history.length - 1 };
}
```

**Files**:
- `frontend/src/components/hld/VariableEditorOptimized.tsx`
- `frontend/src/hooks/useUndoableState.ts`

---

#### Task 14: Testing & Documentation
**Effort**: 3 days

**Unit Tests**:
```rust
// backend/src/services/__tests__/variable_validator_test.rs
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_required_field_validation() {
        let definition = VariableDefinition {
            name: "node_count".to_string(),
            var_type: VariableType::Integer,
            validation: ValidationRule {
                required: true,
                min_value: Some(1.0),
                max_value: Some(16.0),
                ..Default::default()
            },
            ..Default::default()
        };
        
        // Missing value should fail
        let result = validate_variable(&definition, &None, &HashMap::new());
        assert!(result.is_err());
        
        // Valid value should pass
        let result = validate_variable(&definition, &Some(VariableValue::Integer(4)), &HashMap::new());
        assert!(result.is_ok());
        
        // Out of range should fail
        let result = validate_variable(&definition, &Some(VariableValue::Integer(20)), &HashMap::new());
        assert!(result.is_err());
    }
    
    #[test]
    fn test_enum_validation() {
        let definition = VariableDefinition {
            name: "management_framework".to_string(),
            var_type: VariableType::String,
            validation: ValidationRule {
                required: true,
                enum_values: Some(vec!["Windows Admin Center".to_string(), "SCVMM".to_string()]),
                ..Default::default()
            },
            ..Default::default()
        };
        
        // Valid enum value
        let result = validate_variable(&definition, &Some(VariableValue::String("Windows Admin Center".to_string())), &HashMap::new());
        assert!(result.is_ok());
        
        // Invalid enum value
        let result = validate_variable(&definition, &Some(VariableValue::String("Invalid".to_string())), &HashMap::new());
        assert!(result.is_err());
    }
    
    #[test]
    fn test_ip_address_pattern_validation() {
        let definition = VariableDefinition {
            name: "cluster_ip_address".to_string(),
            var_type: VariableType::String,
            validation: ValidationRule {
                required: true,
                pattern: Some(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$".to_string()),
                ..Default::default()
            },
            ..Default::default()
        };
        
        // Valid IP
        let result = validate_variable(&definition, &Some(VariableValue::String("192.168.1.100".to_string())), &HashMap::new());
        assert!(result.is_ok());
        
        // Invalid IP
        let result = validate_variable(&definition, &Some(VariableValue::String("999.999.999.999".to_string())), &HashMap::new());
        assert!(result.is_err());
    }
}
```

**Integration Tests**:
```typescript
// frontend/src/utils/__tests__/hldVariableMapping.test.ts
import { describe, it, expect } from 'vitest';
import { mapRVToolsToHLDVariables } from '../hldVariableMapping';
import { mockRVToolsData } from '../../../__mocks__/rvtools';

describe('HLD Variable Mapping', () => {
  it('should extract node_count from vHost data', () => {
    const rvtools = mockRVToolsData({ vhost: [{ name: 'host1' }, { name: 'host2' }] });
    const variables = mapRVToolsToHLDVariables(rvtools);
    expect(variables.node_count.value).toBe(2);
  });
  
  it('should extract CPU model from first host', () => {
    const rvtools = mockRVToolsData({ vhost: [{ CPUModel: 'Intel Xeon Gold 6248R' }] });
    const variables = mapRVToolsToHLDVariables(rvtools);
    expect(variables.cpu_model.value).toBe('Intel Xeon Gold 6248R');
  });
  
  it('should handle missing vHost data gracefully', () => {
    const rvtools = mockRVToolsData({ vhost: [] });
    const variables = mapRVToolsToHLDVariables(rvtools);
    expect(variables.node_count.value).toBe(null);
    expect(variables.node_count.error).toContain('No vHost data');
  });
  
  it('should extract VLAN IDs from vNetwork tab', () => {
    const rvtools = mockRVToolsData({
      vnetwork: [
        { Name: 'Management', VLANID: 10 },
        { Name: 'Cluster', VLANID: 20 },
      ]
    });
    const variables = mapRVToolsToHLDVariables(rvtools);
    expect(variables.mgmt_vlan_id.value).toBe(10);
    expect(variables.cluster_vlan_id.value).toBe(20);
  });
});
```

**E2E Test**:
```typescript
// frontend/tests/e2e/hldGeneration.spec.ts
import { test, expect } from '@playwright/test';

test('Complete HLD generation workflow', async ({ page }) => {
  // 1. Navigate to project
  await page.goto('http://localhost:1420/projects/test-project-123');
  
  // 2. Upload RVTools
  await page.click('[data-testid="upload-rvtools"]');
  await page.setInputFiles('input[type="file"]', 'tests/fixtures/rvtools-sample.xlsx');
  await page.waitForSelector('text=RVTools uploaded successfully');
  
  // 3. Navigate to HLD Configuration
  await page.click('text=HLD Configuration');
  await expect(page).toHaveURL(/.*hld/);
  
  // 4. Auto-fill from RVTools
  await page.click('[data-testid="autofill-from-rvtools"]');
  await page.waitForSelector('text=Auto-Fill from RVTools');
  
  // 5. Review proposed changes (should show 20+ variables)
  const changeRows = await page.locator('table tbody tr').count();
  expect(changeRows).toBeGreaterThan(20);
  
  // 6. Apply all changes
  await page.click('button:has-text("Apply All")');
  await page.waitForSelector('text=Variables updated successfully');
  
  // 7. Verify variables are populated
  await expect(page.locator('[data-variable="node_count"]')).toHaveValue('4');
  await expect(page.locator('[data-variable="cpu_model"]')).toContainText('Intel Xeon');
  
  // 8. Manual edit: Change cluster name
  await page.fill('[data-variable="cluster_name"]', 'HVCL-PROD-NYC01');
  
  // 9. Validate (should pass)
  await page.click('[data-testid="validate-hld"]');
  await expect(page.locator('text=All variables are valid')).toBeVisible();
  
  // 10. Export to Word
  const downloadPromise = page.waitForEvent('download');
  await page.click('[data-testid="export-word"]');
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/HLD.*\.docx$/);
});

test('Validation prevents export with missing required fields', async ({ page }) => {
  await page.goto('http://localhost:1420/projects/test-project-123/hld');
  
  // Clear required field
  await page.fill('[data-variable="cluster_name"]', '');
  
  // Try to export (should show validation error)
  await page.click('[data-testid="export-word"]');
  
  await expect(page.locator('text=1 error(s) found')).toBeVisible();
  await expect(page.locator('text=cluster_name is required')).toBeVisible();
  
  // Export button should be disabled
  await expect(page.locator('[data-testid="export-word"]')).toBeDisabled();
});
```

**Files**:
- `backend/src/services/__tests__/variable_validator_test.rs`
- `frontend/src/utils/__tests__/hldVariableMapping.test.ts`
- `frontend/tests/e2e/hldGeneration.spec.ts`

---

#### Task 15: Run Existing Test Suite (Parallel)
**Effort**: Ongoing throughout weeks

**Test Execution Script**:
```bash
#!/bin/bash
# run_all_tests.sh

echo "🧪 Running LCMDesigner Test Suite"
echo "=================================="

# 1. Unit Tests (Vitest)
echo "\n📦 Running Unit Tests..."
cd frontend
npm test
UNIT_EXIT=$?

# 2. Integration Tests (Vitest)
echo "\n🔗 Running Integration Tests..."
npm test -- --grep "integration"
INTEGRATION_EXIT=$?

# 3. E2E Tests (Playwright) - requires running app
echo "\n🎭 Running E2E Tests..."
if lsof -i:1420 > /dev/null; then
  npx playwright test
  E2E_EXIT=$?
else
  echo "⚠️  Skipping E2E tests (app not running on port 1420)"
  E2E_EXIT=0
fi

# 4. Performance Tests (K6)
echo "\n⚡ Running K6 Performance Tests..."
if command -v k6 &> /dev/null; then
  k6 run performance/autoSave.k6.js --quiet
  k6 run performance/networkDiscovery.k6.js --quiet
  K6_EXIT=$?
else
  echo "⚠️  K6 not installed, skipping performance tests"
  K6_EXIT=0
fi

# 5. Benchmarks (Vitest)
echo "\n📊 Running Capacity Calculation Benchmarks..."
vitest bench --run
BENCH_EXIT=$?

# Summary
echo "\n📋 Test Summary"
echo "=================================="
echo "Unit Tests: $([ $UNIT_EXIT -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "Integration Tests: $([ $INTEGRATION_EXIT -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "E2E Tests: $([ $E2E_EXIT -eq 0 ] && echo '✅ PASS' || echo '⚠️  SKIP')"
echo "K6 Performance: $([ $K6_EXIT -eq 0 ] && echo '✅ PASS' || echo '⚠️  SKIP')"
echo "Benchmarks: $([ $BENCH_EXIT -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')"

# Exit with failure if any test failed
if [ $UNIT_EXIT -ne 0 ] || [ $INTEGRATION_EXIT -ne 0 ] || [ $E2E_EXIT -ne 0 ] || [ $BENCH_EXIT -ne 0 ]; then
  exit 1
fi
```

**Files**:
- `run_all_tests.sh` (executable script)

---

## 📊 Implementation Statistics

### Lines of Code Estimate
| Component | Lines | Language |
|-----------|-------|----------|
| **Backend** |
| Database schema | 200 | SQL |
| Data models | 500 | Rust |
| API endpoints | 800 | Rust |
| Variable validator | 600 | Rust |
| RVTools mapper | 700 | Rust |
| Word generator | 800 | Rust |
| Template renderer | 400 | Rust |
| Tests | 600 | Rust |
| **Frontend** |
| Variable editor | 600 | TypeScript |
| Section manager | 300 | TypeScript |
| RVTools auto-fill | 400 | TypeScript |
| HLD preview | 200 | TypeScript |
| Wizard integration | 300 | TypeScript |
| Multi-cluster editor | 400 | TypeScript |
| Validation | 300 | TypeScript |
| Tests | 500 | TypeScript |
| **Templates** |
| Word template | 50 | XML (Word) |
| **Total** | **~7,650 lines** | |

### Database Objects
- **Tables**: 4 (hld_templates, hld_sections, hld_projects, hld_variables)
- **Indexes**: 3 (unique constraints)
- **Relationships**: 5 (foreign keys)

### API Endpoints
- **HLD Templates**: 5 endpoints
- **HLD Projects**: 3 endpoints
- **HLD Variables**: 4 endpoints
- **HLD Export**: 2 endpoints
- **Total**: 14 new endpoints

### UI Components
- **Views**: 1 (HLDConfiguration)
- **Components**: 8 (VariableEditor, VariableField, SectionManager, RVToolsAutoFillDialog, HLDPreview, MultiClusterEditor, ValidationSummary, VersionWarning)
- **Hooks**: 3 (useHLDVariables, useHLDSections, useHLDSync)

---

## 🎯 Success Criteria

**Week 1 Complete**:
- ✅ Database schema created and tested
- ✅ 14 API endpoints implemented and documented
- ✅ Variable validation engine with 15+ test cases passing

**Week 2 Complete**:
- ✅ Variable editor UI with 100+ variables rendered efficiently
- ✅ Section management with drag-and-drop reordering
- ✅ RVTools mapper extracting 30+ HLD variables from sample file

**Week 3 Complete**:
- ✅ Word template created with all bookmarks
- ✅ Word export generating properly formatted .docx files
- ✅ RVTools auto-fill workflow with confirmation UI
- ✅ HTML preview rendering correctly

**Week 4 Complete**:
- ✅ Wizard outputs auto-populate HLD variables
- ✅ Template versioning with migration script
- ✅ Multi-cluster support (3+ clusters tested)

**Week 5 Complete**:
- ✅ All validation rules enforced (required, ranges, patterns, dependencies)
- ✅ Performance optimized (100+ variables load <1s)
- ✅ 15+ unit tests passing
- ✅ 10+ integration tests passing
- ✅ E2E test for complete workflow passing
- ✅ Documentation updated (README, COMPONENT_LIBRARY_GUIDE)

---

## 🚀 Next Steps

1. **Create initial database schema** (`database_schema_hld.surql`)
2. **Define Rust data models** (`backend/src/models/hld.rs`)
3. **Implement first API endpoint** (POST /api/v1/hld/templates)
4. **Set up testing infrastructure** (unit test template)
5. **Update todo list** with Week 1 Day 1 tasks

**Ready to start Week 1, Day 1?** 🚀

---

**Last Updated**: October 23, 2025  
**Status**: 🚧 Planning Complete - Ready for Implementation

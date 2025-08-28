# 📄 Document Template Analysis & Implementation Plan

## 🎯 Template Structure Analysis

### HLD Template ("HLD for Hyper V 2025.docx")
- **Size**: 778 paragraphs, 23 tables
- **Corporate Style**: Atos professional template with specific formatting
- **Key Sections**:
  - Title page with metadata (author, version, status, date)
  - Table of contents (automated)
  - Executive summary and background
  - Technical architecture sections
  - Hardware specifications tables
  - Implementation details
  
### Styling Elements to Preserve
```
- Title: Document title styling
- sys Doc Statistics: Metadata formatting
- Heading 1-4: Section hierarchy
- toc 1-2: Table of contents formatting
- Body Text: Standard paragraph text
- List Bullet/List Paragraph: Bulleted lists
- Normal: Default paragraph style
- sys Class/sys Copyright: Corporate branding
```

### Key Tables Structure
1. **Version History Table** (4 rows, 4 cols)
2. **Target Audience Table** (4 rows, 2 cols)  
3. **Review Summary Table** (45 rows, 2 cols)
4. **Hardware Components Table** (various sizes)
5. **Technical Specifications Tables**

---

## 🔧 Technical Implementation Strategy

### Phase 1: Template Analysis Engine (Rust)
```rust
// Template analysis and extraction
pub struct DocumentTemplateAnalyzer {
    template_path: PathBuf,
    style_registry: HashMap<String, DocumentStyle>,
    table_structures: Vec<TableTemplate>,
    placeholder_map: HashMap<String, PlaceholderType>,
}

impl DocumentTemplateAnalyzer {
    pub fn analyze_template(&self, template_path: &str) -> Result<DocumentTemplate> {
        // 1. Parse DOCX structure
        // 2. Extract all styles and formatting
        // 3. Identify placeholder locations
        // 4. Map table structures
        // 5. Create reusable template definition
    }
}
```

### Phase 2: Dynamic Document Generation
```rust
pub struct TemplateDocumentGenerator {
    pub fn generate_hld(
        &self,
        template: &DocumentTemplate,
        project_data: &ProjectData,
        rvtools_data: &RVToolsEnvironment,
        hardware_config: &HardwareConfiguration,
    ) -> Result<Vec<u8>> {
        // 1. Load template structure
        // 2. Replace metadata placeholders
        // 3. Generate hardware BoM tables
        // 4. Insert capacity analysis data
        // 5. Generate network diagrams
        // 6. Preserve all original styling
    }
}
```

### Phase 3: LLD Template Derivation
```rust
pub fn derive_lld_template(hld_template: &DocumentTemplate) -> DocumentTemplate {
    // 1. Copy HLD structure and styling
    // 2. Modify content focus (high-level → low-level)
    // 3. Add detailed configuration tables
    // 4. Include step-by-step implementation sections
    // 5. Add validation checklists
}
```

---

## 📊 RVTools Integration Plan

### Data Extraction Strategy
```rust
pub struct RVToolsAnalyzer {
    pub fn analyze_full_report(&self, file_path: &str) -> Result<RVToolsEnvironment> {
        // Process all 28 sheets:
        let vms = self.process_vm_info_sheets()?;          // vInfo, vCPU, vMemory, vDisk
        let hosts = self.process_host_sheets()?;           // vHost, vHBA, vNIC
        let network = self.process_network_sheets()?;      // vSwitch, vPort, dvSwitch
        let storage = self.process_storage_sheets()?;      // vDatastore, vMultiPath
        let cluster = self.process_cluster_sheets()?;      // vCluster, vRP
        
        // Generate capacity recommendations
        let recommendations = self.generate_hardware_recommendations(&vms, &hosts, &cluster)?;
        
        Ok(RVToolsEnvironment {
            vms, hosts, network, storage, cluster, recommendations
        })
    }
}
```

### Hardware Recommendation Engine
```rust
pub fn generate_hardware_recommendations(
    rvtools_data: &RVToolsEnvironment,
    hardware_basket: &[HardwareModel],
    overcommit_ratios: &OvercommitConfig,
) -> Result<Vec<HardwareRecommendation>> {
    // 1. Calculate total resource requirements from RVTools
    // 2. Apply overcommit ratios (CPU: 3:1, Memory: 1.5:1)
    // 3. Add HA requirements (N+1, N+2)
    // 4. Match against available hardware in basket
    // 5. Generate 3 configuration options (Basic, Standard, Premium)
    // 6. Calculate BoM with pricing
}
```

---

## 🗄️ Enhanced SurrealDB Schema

### Project Management Tables
```sql
-- Projects table
DEFINE TABLE project SCHEMAFULL;
DEFINE FIELD name ON project TYPE string;
DEFINE FIELD description ON project TYPE string;
DEFINE FIELD project_type ON project TYPE string; -- "Migration", "Lifecycle", "New Solution"
DEFINE FIELD status ON project TYPE string; -- "Planning", "Active", "Completed"
DEFINE FIELD start_date ON project TYPE datetime;
DEFINE FIELD end_date ON project TYPE datetime;
DEFINE FIELD created_at ON project TYPE datetime DEFAULT time::now();

-- Workflows/Activities table
DEFINE TABLE workflow SCHEMAFULL;
DEFINE FIELD project_id ON workflow TYPE record<project>;
DEFINE FIELD name ON workflow TYPE string;
DEFINE FIELD workflow_type ON workflow TYPE string; -- "Migration", "Lifecycle", "Procurement"
DEFINE FIELD duration_days ON workflow TYPE int;
DEFINE FIELD start_date ON workflow TYPE datetime;
DEFINE FIELD dependencies ON workflow TYPE array<record<workflow>>;
DEFINE FIELD wizard_state ON workflow TYPE object; -- Saved wizard configuration
DEFINE FIELD status ON workflow TYPE string;

-- Project Documents table
DEFINE TABLE project_document SCHEMAFULL;
DEFINE FIELD project_id ON project_document TYPE record<project>;
DEFINE FIELD workflow_id ON project_document TYPE record<workflow>;
DEFINE FIELD document_type ON project_document TYPE string; -- "HLD", "LLD", "BoM", "Migration Plan"
DEFINE FIELD document_name ON project_document TYPE string;
DEFINE FIELD file_path ON project_document TYPE string;
DEFINE FIELD version ON project_document TYPE string;
DEFINE FIELD generated_at ON project_document TYPE datetime;

-- Hardware Pool table
DEFINE TABLE server_inventory SCHEMAFULL;
DEFINE FIELD server_name ON server_inventory TYPE string;
DEFINE FIELD hardware_model_id ON server_inventory TYPE record<hardware_lot>;
DEFINE FIELD status ON server_inventory TYPE string; -- "Available", "Allocated", "Maintenance"
DEFINE FIELD allocated_to_project ON server_inventory TYPE record<project>;
DEFINE FIELD allocation_start ON server_inventory TYPE datetime;
DEFINE FIELD allocation_end ON server_inventory TYPE datetime;
DEFINE FIELD procurement_date ON server_inventory TYPE datetime;
DEFINE FIELD warranty_end ON server_inventory TYPE datetime;

-- RVTools Data Storage
DEFINE TABLE rvtools_import SCHEMAFULL;
DEFINE FIELD project_id ON rvtools_import TYPE record<project>;
DEFINE FIELD filename ON rvtools_import TYPE string;
DEFINE FIELD import_date ON rvtools_import TYPE datetime;
DEFINE FIELD parsed_data ON rvtools_import TYPE object; -- Full parsed RVTools data
DEFINE FIELD selected_clusters ON rvtools_import TYPE array<string>;
```

---

## 🎨 Frontend Integration Points

### Document Library Component (TypeScript)
```typescript
interface ProjectDocumentLibrary {
  projectId: string;
  documents: ProjectDocument[];
  onGenerateDocument: (type: DocumentType, config: DocumentConfig) => void;
  onDownloadDocument: (documentId: string) => void;
}

interface DocumentConfig {
  template: "HLD" | "LLD";
  includeBoM: boolean;
  includeNetworkDiagrams: boolean;
  customSections?: string[];
}
```

### Hardware Recommendation Interface
```typescript
interface HardwareRecommendationWizard {
  rvtoolsData: RVToolsEnvironment;
  hardwareBasket: HardwareModel[];
  recommendations: HardwareRecommendation[];
  selectedConfiguration?: HardwareConfiguration;
  onSelectConfiguration: (config: HardwareConfiguration) => void;
  onCustomizeConfiguration: (config: HardwareConfiguration) => void;
}
```

---

## ⚡ Implementation Priority

### Week 1-2: Foundation
1. ✅ **Template Analysis Engine**: Parse HLD template, extract styles
2. ✅ **SurrealDB Schema**: Extend with project/workflow tables  
3. ✅ **RVTools Parser Enhancement**: Support all 28 sheets

### Week 3-4: Core Generation
1. ✅ **Document Generator**: Template-based HLD generation
2. ✅ **Hardware Recommendations**: RVTools → Hardware Basket integration
3. ✅ **BoM Generation**: Automated hardware BoM creation

### Week 5-6: Frontend Integration  
1. ✅ **Project Document Library**: UI for document management
2. ✅ **Wizard Integration**: Embed wizards in project workflows
3. ✅ **Hardware Selection**: Three-option recommendation interface

This approach ensures we maintain the professional quality and styling of your existing HLD template while automating the content generation based on actual project data.

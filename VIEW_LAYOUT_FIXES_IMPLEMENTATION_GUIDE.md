# View Layout Fixes - Implementation Guide
**Date:** December 13, 2025  
**Status:** DRAFT - Ready for Implementation  
**Related:** VIEW_LAYOUT_AUDIT_REPORT.md

---

## ⚠️ IMPORTANT: Implementation Notes

**Before Starting:**
1. Create a git branch: `git checkout -b fix/view-layouts`
2. Test each view after fixing in both light and dark modes
3. Verify responsive behavior on mobile
4. Commit after each phase

**After Completion:**
5. Run full UI test suite
6. Create PR with before/after screenshots
7. Update DELTA_TRACKING.md with changes

---

## Phase 1: Critical Detail Views (Priority P1)

### 1.1 TicketDetailView.tsx

**Current Issues:**
- Floating `<h3>` at line 1005 for "Attachments"
- Could benefit from Page Header wrapper for consistency

**Changes Required:**

**Step 1:** Replace floating header section with PageHeader

```tsx
// FIND (lines 686-745):
  return (
    <div data-testid="ticket-detail-view" style={containerStyle}>
      {/* Header with back button and actions */}
      <div style={headerStyle}>
        <PurpleGlassButton 
          variant="ghost" 
          onClick={() => navigate('/app/service-desk')}
          style={{ padding: '8px' }}
        >
          <ArrowLeftRegular style={{ fontSize: '20px' }} />
        </PurpleGlassButton>

        <div style={{ flex: 1 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '4px',
          }}>
            <span style={{
              padding: '4px 10px',
              background: `${getPriorityColor(ticket.priority)}20`,
              color: getPriorityColor(ticket.priority),
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
            }}>
              {ticket.priority}
            </span>
            <span style={{
              padding: '4px 10px',
              background: `${getStatusColor(ticket.status)}20`,
              color: getStatusColor(ticket.status),
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
            }}>
              {ticket.status.replace('_', ' ')}
            </span>
            <span style={{
              color: 'var(--text-muted)',
              fontSize: '14px',
            }}>
              {ticket.id}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <PurpleGlassButton variant="ghost" title="Bookmark">
            <BookmarkRegular />
          </PurpleGlassButton>
          <PurpleGlassButton variant="ghost" title="Share">
            <ShareRegular />
          </PurpleGlassButton>
          <PurpleGlassButton variant="ghost" title="More actions">
            <MoreHorizontalRegular />
          </PurpleGlassButton>
        </div>
      </div>

// REPLACE WITH:
  return (
    <div data-testid="ticket-detail-view" style={containerStyle}>
      <PageHeader
        icon={<TicketDiagonalRegular />}
        title={ticket.title}
        subtitle={`${ticket.id} • Created ${new Date(ticket.created_at).toLocaleDateString()}`}
        badge={ticket.status.replace('_', ' ')}
        badgeVariant={ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'success' : ticket.status === 'IN_PROGRESS' ? 'warning' : 'info'}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <PurpleGlassButton variant="secondary" onClick={() => navigate('/app/service-desk')}>
              <ArrowLeftRegular style={{ marginRight: '8px' }} />
              Back
            </PurpleGlassButton>
            <PurpleGlassButton variant="ghost" title="Bookmark">
              <BookmarkRegular />
            </PurpleGlassButton>
            <PurpleGlassButton variant="ghost" title="Share">
              <ShareRegular />
            </PurpleGlassButton>
            <PurpleGlassButton variant="ghost" title="More actions">
              <MoreHorizontalRegular />
            </PurpleGlassButton>
          </div>
        }
      >
        {/* Priority and status badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
          <span style={{
            padding: '4px 10px',
            background: `${getPriorityColor(ticket.priority)}20`,
            color: getPriorityColor(ticket.priority),
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
          }}>
            {ticket.priority}
          </span>
          <span style={{
            color: 'var(--text-muted)',
            fontSize: '14px',
          }}>
            Type: {ticket.ticket_type}
          </span>
        </div>
      </PageHeader>
```

**Step 2:** Add PageHeader import

```tsx
// FIND:
import {
  PurpleGlassCard,
  PurpleGlassButton,
  PurpleGlassInput,
  PurpleGlassTextarea,
  PurpleGlassDropdown,
  SLAIndicator,
  LinkedAssetBadge,
} from '../components/ui';

// REPLACE WITH:
import {
  PurpleGlassCard,
  PurpleGlassButton,
  PurpleGlassInput,
  PurpleGlassTextarea,
  PurpleGlassDropdown,
  SLAIndicator,
  LinkedAssetBadge,
  PageHeader,
} from '../components/ui';
```

**Step 3:** Fix floating "Attachments" header (line 1005)

```tsx
// FIND:
                <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ 
                    margin: 0, 
                    color: 'var(--text-primary)', 
                    fontSize: '18px',
                    fontWeight: 600,
                  }}>
                    Attachments ({attachments.length})
                  </h3>

// REPLACE WITH:
                <PurpleGlassCard header={`Attachments (${attachments.length})`} icon={<AttachRegular />} style={{ marginTop: '24px' }}>
```

And close the card properly at the end of the attachments section.

---

### 1.2 AssetDetailView.tsx

**Status:** PARTIALLY FIXED (PageHeader added, needs cleanup)

**Remaining Issues:**
- Duplicate content from partial edit
- Need to clean up old header structure

**Fix:** Revert file to original, then apply clean PageHeader wrapper

```bash
git checkout frontend/src/views/AssetDetailView.tsx
```

Then apply this complete replacement for the header section (lines ~409-503):

```tsx
  return (
    <div data-testid="asset-detail-view" style={containerStyle}>
      <PageHeader
        icon={getAssetIcon(asset.type)}
        title={asset.name}
        subtitle={`${asset.type} • ${asset.external_id || 'No External ID'} • Created ${new Date(asset.created_at).toLocaleDateString()}`}
        badge={asset.status}
        badgeVariant={asset.status === 'ACTIVE' ? 'success' : asset.status === 'MAINTENANCE' ? 'warning' : 'critical'}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <PurpleGlassButton variant="secondary" onClick={() => navigate('/app/inventory')}>
              <ArrowLeftRegular style={{ marginRight: '8px' }} />
              Back
            </PurpleGlassButton>
            <PurpleGlassButton variant="ghost">
              <EditRegular />
            </PurpleGlassButton>
            <PurpleGlassButton variant="ghost">
              <DeleteRegular />
            </PurpleGlassButton>
            <PurpleGlassButton variant="ghost" title="More actions">
              <MoreHorizontalRegular />
            </PurpleGlassButton>
          </div>
        }
      >
        {/* Asset metadata badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
          {asset.environment && (
            <span style={{
              padding: '4px 12px',
              background: `${getEnvironmentColor(asset.environment)}20`,
              color: getEnvironmentColor(asset.environment),
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 600,
            }}>
              {asset.environment.toUpperCase()}
            </span>
          )}
          {asset.criticality && (
            <span style={{
              padding: '4px 12px',
              background: `${getCriticalityColor(asset.criticality)}20`,
              color: getCriticalityColor(asset.criticality),
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 600,
            }}>
              {asset.criticality.toUpperCase()} CRITICALITY
            </span>
          )}
        </div>
      </PageHeader>

      {/* Rest of the content stays the same... */}
```

---

### 1.3 CIDetailView.tsx

**Current Issues:**
- Multiple floating headers (lines 122, 267, 303, 333, 384, 504, 585)
- No PageHeader wrapper

**Implementation:**

```tsx
// Add import
import { PageHeader, PurpleGlassCard } from '../components/ui';

// Replace header section (around line 120-130)
return (
  <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
    <PageHeader
      icon={<DatabaseRegular />}
      title={ci.name}
      subtitle={`CI ID: ${ci.ci_id} • Class: ${ci.ci_class} • Created ${new Date(ci.created_at).toLocaleDateString()}`}
      badge={ci.status}
      badgeVariant={ci.status === 'ACTIVE' ? 'success' : ci.status === 'INACTIVE' ? 'warning' : 'critical'}
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          <PurpleGlassButton variant="secondary" onClick={() => navigate('/app/cmdb')}>
            <ArrowLeftRegular style={{ marginRight: '8px' }} />
            Back
          </PurpleGlassButton>
          <PurpleGlassButton variant="ghost">
            <EditRegular />
          </PurpleGlassButton>
          <PurpleGlassButton variant="ghost">
            <DeleteRegular />
          </PurpleGlassButton>
        </div>
      }
    >
      {/* CI metadata */}
      <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
        <span style={{
          padding: '4px 12px',
          background: 'var(--btn-secondary-bg)',
          color: 'var(--brand-primary)',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 600,
        }}>
          {ci.ci_class}
        </span>
        {ci.environment && (
          <span style={{
            padding: '4px 12px',
            background: 'rgba(59, 130, 246, 0.1)',
            color: '#3b82f6',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 600,
          }}>
            {ci.environment}
          </span>
        )}
      </div>
    </PageHeader>

    {/* Section cards with proper headers */}
    <PurpleGlassCard header="Configuration Details" icon={<InfoRegular />} glass>
      {/* Configuration content */}
    </PurpleGlassCard>

    <PurpleGlassCard header="Relationships" icon={<LinkRegular />} glass>
      {/* Relationships content */}
    </PurpleGlassCard>

    <PurpleGlassCard header="Change History" icon={<HistoryRegular />} glass>
      {/* History content */}
    </PurpleGlassCard>
  </div>
);
```

---

### 1.4 ProjectDetailView.tsx

**Current Issues:**
- Floating `<h1>` for project name (line 264)
- "Project Not Found" as floating `<h2>` (line 221)

**Implementation:**

```tsx
// Fix "Not Found" state
if (!project) {
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <PurpleGlassCard glass>
        <PurpleGlassEmptyState
          icon={<ErrorCircleRegular />}
          title="Project Not Found"
          description="The project you're looking for doesn't exist or has been removed."
          action={
            <PurpleGlassButton onClick={() => navigate('/app/projects')}>
              <ArrowLeftRegular style={{ marginRight: '8px' }} />
              Back to Projects
            </PurpleGlassButton>
          }
        />
      </PurpleGlassCard>
    </div>
  );
}

// Add PageHeader
return (
  <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
    <PageHeader
      icon={<CubeRegular />}
      title={project.name}
      subtitle={project.description}
      badge={project.status}
      badgeVariant={project.status === 'ACTIVE' ? 'success' : project.status === 'PLANNED' ? 'info' : 'warning'}
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          <PurpleGlassButton variant="secondary" onClick={() => navigate('/app/projects')}>
            <ArrowLeftRegular style={{ marginRight: '8px' }} />
            Back
          </PurpleGlassButton>
          <PurpleGlassButton variant="ghost">
            <EditRegular />
          </PurpleGlassButton>
          <PurpleGlassButton variant="primary">
            <AddRegular style={{ marginRight: '8px' }} />
            Add Activity
          </PurpleGlassButton>
        </div>
      }
    >
      {/* Project metadata */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          color: 'var(--text-muted)',
        }}>
          <CalendarRegular /> Start: {new Date(project.start_date).toLocaleDateString()}
        </span>
        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          color: 'var(--text-muted)',
        }}>
          <CalendarRegular /> End: {new Date(project.end_date).toLocaleDateString()}
        </span>
        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          color: 'var(--text-muted)',
        }}>
          <PersonRegular /> {project.team_members?.length || 0} members
        </span>
      </div>
    </PageHeader>

    {/* Rest of project content in cards... */}
  </div>
);
```

---

### 1.5 KBArticleDetailView.tsx & KBArticleEditorView.tsx

**Both files have similar issues:**
- Floating `<h1>` titles
- Section headers not using card headers

**KBArticleDetailView.tsx Fix:**

```tsx
return (
  <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
    <PageHeader
      icon={<BookRegular />}
      title={article.title}
      subtitle={`${article.category} • ${article.views} views • Last updated ${new Date(article.updated_at).toLocaleDateString()}`}
      badge={article.status}
      badgeVariant={article.status === 'PUBLISHED' ? 'success' : article.status === 'DRAFT' ? 'warning' : 'info'}
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          <PurpleGlassButton variant="secondary" onClick={() => navigate('/app/knowledge')}>
            <ArrowLeftRegular style={{ marginRight: '8px' }} />
            Back
          </PurpleGlassButton>
          <PurpleGlassButton variant="ghost" onClick={() => navigate(`/app/knowledge/edit/${article.id}`)}>
            <EditRegular />
          </PurpleGlassButton>
          <PurpleGlassButton variant="ghost">
            <ShareRegular />
          </PurpleGlassButton>
        </div>
      }
    >
      {/* Article metadata */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
        <span style={{
          padding: '4px 12px',
          background: 'var(--btn-secondary-bg)',
          color: 'var(--brand-primary)',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 600,
        }}>
          {article.category}
        </span>
        {article.tags?.map(tag => (
          <span key={tag} style={{
            padding: '4px 12px',
            background: 'rgba(139, 92, 246, 0.1)',
            color: '#8b5cf6',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 500,
          }}>
            {tag}
          </span>
        ))}
      </div>
    </PageHeader>

    <PurpleGlassCard header="Article Content" glass>
      <div dangerouslySetInnerHTML={{ __html: article.content }} />
    </PurpleGlassCard>

    <PurpleGlassCard header="Related Articles" icon={<LinkRegular />} glass>
      {/* Related articles */}
    </PurpleGlassCard>
  </div>
);
```

**KBArticleEditorView.tsx Fix:**

```tsx
return (
  <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
    <PageHeader
      icon={<EditRegular />}
      title={isCreating ? 'Create Knowledge Base Article' : `Edit: ${article.title}`}
      subtitle={isCreating ? 'Draft a new article for the knowledge base' : `Editing article • Last saved ${new Date().toLocaleTimeString()}`}
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          <PurpleGlassButton variant="secondary" onClick={() => navigate('/app/knowledge')}>
            Cancel
          </PurpleGlassButton>
          <PurpleGlassButton variant="ghost" onClick={handleSaveDraft} disabled={isSaving}>
            Save Draft
          </PurpleGlassButton>
          <PurpleGlassButton variant="primary" onClick={handlePublish} disabled={isSaving}>
            {isSaving ? 'Publishing...' : 'Publish'}
          </PurpleGlassButton>
        </div>
      }
    />

    <PurpleGlassCard header="Article Settings" icon={<SettingsRegular />} glass>
      {/* Title, category, tags inputs */}
    </PurpleGlassCard>

    <PurpleGlassCard header="Content Editor" glass>
      {/* Rich text editor */}
    </PurpleGlassCard>

    <PurpleGlassCard header="Preview" icon={<EyeRegular />} glass>
      {/* Preview pane */}
    </PurpleGlassCard>
  </div>
);
```

---

## Phase 2: List Views with Legacy Layout (Priority P1)

### 2.1 ApprovalInbox.tsx

**Current Issues:**
- Uses old `<h1 className="lcm-page-title">`
- Modal has floating `<h2>`

**Fix:**

```tsx
// Replace
<h1 className="lcm-page-title">Approval Inbox</h1>

// With
<PageHeader
  icon={<CheckmarkCircleRegular />}
  title="Approval Inbox"
  subtitle="Review and approve pending requests"
  actions={
    <PurpleGlassButton variant="primary">
      <FilterRegular style={{ marginRight: '8px' }} />
      Filter
    </PurpleGlassButton>
  }
>
  {/* Stats cards */}
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '20px' }}>
    <PurpleGlassCard glass variant="subtle">
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--brand-primary)' }}>
          {pendingApprovals.length}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Pending
        </div>
      </div>
    </PurpleGlassCard>
    {/* More stat cards */}
  </div>
</PageHeader>
```

---

### 2.2 MyRequestsView.tsx

**Current Issues:**
- Floating `<h1>` at line 137
- Multiple floating section headers

**Fix:**

```tsx
return (
  <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
    <PageHeader
      icon={<TicketDiagonalRegular />}
      title="My Service Requests"
      subtitle="Track your submitted requests and their status"
      actions={
        <PurpleGlassButton variant="primary" onClick={() => navigate('/app/service-catalog')}>
          <AddRegular style={{ marginRight: '8px' }} />
          New Request
        </PurpleGlassButton>
      }
    >
      {/* Request stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '20px' }}>
        <StatCard title="All Requests" value={requests.length} color="var(--brand-primary)" />
        <StatCard title="In Progress" value={requests.filter(r => r.status === 'IN_PROGRESS').length} color="var(--status-warning)" />
        <StatCard title="Completed" value={requests.filter(r => r.status === 'COMPLETED').length} color="var(--status-success)" />
        <StatCard title="Cancelled" value={requests.filter(r => r.status === 'CANCELLED').length} color="var(--status-critical)" />
      </div>
    </PageHeader>

    <PurpleGlassCard header="Recent Requests" icon={<ClockRegular />} glass>
      {/* Requests list */}
    </PurpleGlassCard>
  </div>
);
```

---

### 2.3 WorkflowInstanceView.tsx & WorkflowListView.tsx

**Both use old `.lcm-page-title`**

**WorkflowListView.tsx Fix:**

```tsx
return (
  <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
    <PageHeader
      icon={<ArrowRepeatAllRegular />}
      title="Workflow Automation"
      subtitle="Create and manage automated workflows"
      actions={
        <PurpleGlassButton variant="primary" onClick={() => setIsCreateModalOpen(true)}>
          <AddRegular style={{ marginRight: '8px' }} />
          Create Workflow
        </PurpleGlassButton>
      }
    >
      {/* Workflow stats */}
    </PageHeader>

    <PurpleGlassCard header="Active Workflows" glass>
      {/* Workflow list */}
    </PurpleGlassCard>
  </div>
);
```

**WorkflowInstanceView.tsx Fix:**

Similar pattern - replace `<h1 className="lcm-page-title">` with PageHeader.

---

## Phase 3: Management Views (Priority P2)

### 3.1 ClusterStrategyManagerView.tsx

**Replace floating `<h1>` and `<h3>` headers:**

```tsx
return (
  <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
    <PageHeader
      icon={<CubeRegular />}
      title="Cluster Strategy Manager"
      subtitle="Define and manage cluster sizing strategies"
      actions={
        <PurpleGlassButton variant="primary">
          <AddRegular style={{ marginRight: '8px' }} />
          Add Strategy
        </PurpleGlassButton>
      }
    />

    <PurpleGlassCard header="Available Strategies" icon={<ListRegular />} glass>
      {/* Strategies list */}
    </PurpleGlassCard>

    <PurpleGlassCard header="Strategy Configuration" icon={<SettingsRegular />} glass>
      {/* Configuration form */}
    </PurpleGlassCard>
  </div>
);
```

---

### 3.2 Hardware Views (HardwareBasketView, HardwarePoolView, VendorDataCollectionView)

**All three need similar fixes:**

**Example for HardwareBasketView.tsx:**

```tsx
return (
  <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
    <PageHeader
      icon={<BoxRegular />}
      title="Hardware Baskets"
      subtitle="Manage hardware configuration baskets and BOMs"
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          <PurpleGlassButton variant="secondary">
            <ArrowUploadRegular style={{ marginRight: '8px' }} />
            Import
          </PurpleGlassButton>
          <PurpleGlassButton variant="primary">
            <AddRegular style={{ marginRight: '8px' }} />
            New Basket
          </PurpleGlassButton>
        </div>
      }
    >
      {/* Basket stats */}
    </PageHeader>

    <PurpleGlassCard header="Baskets" icon={<ListRegular />} glass>
      {/* Baskets grid */}
    </PurpleGlassCard>
  </div>
);
```

---

### 3.3 Document & Guide Views

**DocumentTemplatesView.tsx, GuidesView.tsx, EnhancedRVToolsReportView.tsx**

All follow the same pattern - wrap in PageHeader, convert section headers to card headers.

---

## Phase 4: Utility Views (Priority P2)

### 4.1 HLDConfiguration.tsx

**Fix "No Project Selected" state:**

```tsx
if (!selectedProject) {
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <PurpleGlassCard glass>
        <PurpleGlassEmptyState
          icon={<DocumentRegular />}
          title="No Project Selected"
          description="Select a project from the projects page to configure HLD settings"
          action={
            <PurpleGlassButton onClick={() => navigate('/app/projects')}>
              <ArrowLeftRegular style={{ marginRight: '8px' }} />
              Go to Projects
            </PurpleGlassButton>
          }
        />
      </PurpleGlassCard>
    </div>
  );
}

// Main view with PageHeader
return (
  <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
    <PageHeader
      icon={<DocumentRegular />}
      title={`HLD Configuration - ${selectedProject.name}`}
      subtitle="Configure high-level design document settings"
      actions={
        <PurpleGlassButton variant="primary" onClick={handleGenerate}>
          <DocumentRegular style={{ marginRight: '8px' }} />
          Generate HLD
        </PurpleGlassButton>
      }
    />

    <PurpleGlassCard header="Document Settings" icon={<SettingsRegular />} glass>
      {/* Settings form */}
    </PurpleGlassCard>
  </div>
);
```

---

### 4.2 NetworkVisualizerView.tsx

Replace floating section headers with card headers.

---

### 4.3 ProjectTimelineView.tsx & ProjectWorkspaceView.tsx

**Both need:**
1. PageHeader wrapper
2. "Project Not Found" → PurpleGlassEmptyState
3. Section headers → card headers

---

### 4.4 MigrationProjects.tsx & EnhancedProjectsView.tsx

**Replace floating titles and empty states:**

```tsx
return (
  <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
    <PageHeader
      icon={<ArrowSyncRegular />}
      title="Migration Projects"
      subtitle="Plan and track infrastructure migration projects"
      actions={
        <PurpleGlassButton variant="primary" onClick={() => navigate('/app/migrations/new')}>
          <AddRegular style={{ marginRight: '8px' }} />
          New Migration
        </PurpleGlassButton>
      }
    />

    {projects.length === 0 ? (
      <PurpleGlassCard glass>
        <PurpleGlassEmptyState
          icon={<ArrowSyncRegular />}
          title="No migration projects found"
          description="Create your first migration project to get started"
          action={
            <PurpleGlassButton variant="primary" onClick={() => navigate('/app/migrations/new')}>
              <AddRegular style={{ marginRight: '8px' }} />
              Create Migration
            </PurpleGlassButton>
          }
        />
      </PurpleGlassCard>
    ) : (
      <PurpleGlassCard header="Migration Projects" glass>
        {/* Projects grid */}
      </PurpleGlassCard>
    )}
  </div>
);
```

---

## Phase 5: Card Header Standardization (Priority P3)

### Views that need card header prop instead of inline titles:

1. **LifecyclePlannerView.tsx**
2. **MigrationPlannerView.tsx**
3. **DataUploadView.tsx**
4. **DesignDocsView.tsx**
5. **KnowledgeBaseView.tsx**
6. **ReportingDashboardView.tsx**

**Pattern:**

```tsx
// BEFORE:
<PurpleGlassCard>
  <h3 style={{fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)'}}>
    Section Title
  </h3>
  {/* content */}
</PurpleGlassCard>

// AFTER:
<PurpleGlassCard header="Section Title" icon={<IconRegular />} glass>
  {/* content */}
</PurpleGlassCard>
```

---

## Testing Checklist

After each view fix:

- [ ] View renders without errors
- [ ] PageHeader displays correctly with icon, title, subtitle
- [ ] Badges show appropriate colors
- [ ] Action buttons are functional
- [ ] Light mode: proper contrast and visibility
- [ ] Dark mode: proper contrast and visibility
- [ ] Mobile responsive: header stacks properly
- [ ] Tablet responsive: layouts adjust correctly
- [ ] Empty states use PurpleGlassEmptyState
- [ ] All section headers use card header prop
- [ ] No console errors or warnings

---

## Completion Criteria

- ✅ All 40+ views use PageHeader wrapper
- ✅ No floating `<h1>`, `<h2>`, `<h3>` elements
- ✅ All "Not Found" states use PurpleGlassEmptyState
- ✅ All section headers use card header prop
- ✅ Consistent spacing and layout across all views
- ✅ All views tested in light and dark modes
- ✅ Responsive behavior verified on mobile/tablet
- ✅ No TypeScript errors
- ✅ No console warnings

---

## Implementation Timeline

- **Phase 1 (Detail Views):** 1-2 days - 5 files
- **Phase 2 (List Views):** 1 day - 4 files
- **Phase 3 (Management Views):** 2 days - 10 files
- **Phase 4 (Utility Views):** 1-2 days - 8 files
- **Phase 5 (Card Headers):** 1 day - 15 files
- **Testing & QA:** 1 day - All files

**Total Estimated Time:** 6-8 days for complete standardization

---

## Git Workflow

```bash
# Create branch
git checkout -b fix/view-layouts

# After each phase
git add frontend/src/views/*.tsx
git commit -m "fix: Phase X - Standardize [view group] layouts with PageHeader"

# After all phases complete
git push origin fix/view-layouts
# Create PR with screenshots
```

---

## Notes

- This guide assumes PurpleGlassEmptyState component exists (create if needed)
- All color values should use CSS variables
- PageHeader component should handle responsive behavior
- Test with real data when possible
- Verify accessibility (keyboard navigation, screen readers)

---

**END OF IMPLEMENTATION GUIDE**

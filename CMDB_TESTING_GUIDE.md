# CMDB Frontend Testing Guide

## Overview
This guide helps you test the newly implemented CMDB frontend components against the backend API.

## Prerequisites

### Backend Setup
1. Start the Rust backend server:
```bash
cd backend
cargo run
# Server runs on http://localhost:3001
```

2. Ensure SurrealDB is running:
```bash
surreal start --bind 127.0.0.1:8001 --user root --pass root
```

3. Initialize the database (if needed):
The backend will automatically run migrations on startup.

### Frontend Setup
1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the dev server:
```bash
npm run dev
# Server runs on http://localhost:1420
```

## Testing Flows

### 1. Browse Configuration Items
- Navigate to http://localhost:1420/app/cmdb
- Test the search bar (search by name, CI ID, IP, serial)
- Test filters:
  - CI Class (Hardware, Software, Service, etc.)
  - Status (Active, Planned, Deployed, etc.)
  - Criticality (Critical, High, Medium, Low)
  - Environment (Production, Staging, etc.)
- Test pagination (if you have >20 CIs)
- Test bulk selection checkboxes

### 2. View CI Details
- Click on any CI from the list
- Navigate to http://localhost:1420/app/cmdb/:id
- Test tabs:
  - **Overview**: View all CI attributes
  - **Relationships**: See upstream/downstream dependencies
  - **History**: View change history
  - **Impact**: Analyze impact with depth controls
- Test the simple relationship graph visualization

### 3. Create New CI
- From CMDB Explorer, click "Create CI"
- Navigate to http://localhost:1420/app/cmdb/new
- Fill in required fields:
  - Name (required)
  - CI Type (required)
  - CI Class (defaults to Hardware)
- Optional fields:
  - Description
  - Status, Criticality, Environment
  - Hardware details (vendor, model, serial, IP, FQDN)
  - Tags
- Click "Create CI"
- Should navigate to the new CI detail page

### 4. Edit Existing CI
- From CI detail page, click "Edit"
- Navigate to http://localhost:1420/app/cmdb/:id/edit
- Modify any fields
- Add/remove tags
- Click "Save Changes"
- Should navigate back to CI detail page with updated data

### 5. Delete CI
- From CI detail page, click "Delete"
- Confirm the deletion
- Should navigate back to CMDB Explorer

### 6. Impact Analysis
- Create multiple CIs with relationships (via backend API if needed)
- View a CI with relationships
- Go to "Impact" tab
- Test depth levels (1, 2, 3, 4)
- Verify upstream/downstream dependency display
- Check path visualization (expand individual items)

## Backend API Testing

If the frontend isn't connecting properly, test the backend directly:

### Create a CI
```bash
curl -X POST http://localhost:3001/api/v1/cmdb/cis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Test Server 01",
    "ci_class": "HARDWARE",
    "ci_type": "Physical Server",
    "status": "ACTIVE",
    "criticality": "HIGH",
    "environment": "Production",
    "vendor": "Dell",
    "model": "PowerEdge R740"
  }'
```

### List CIs
```bash
curl http://localhost:3001/api/v1/cmdb/cis
```

### Get CI by ID
```bash
curl http://localhost:3001/api/v1/cmdb/cis/:id
```

## Known Limitations

1. **Authentication**: The frontend currently doesn't include JWT tokens in API requests. You may need to temporarily disable auth middleware in the backend for testing.

2. **Relationship Graph**: The current implementation uses a simple tree layout. For production, consider integrating:
   - **react-flow**: Modern, React-native, interactive diagrams
   - **vis.js**: Mature, handles large graphs well
   - **D3.js**: Maximum flexibility

3. **CI Types**: CI Type management (admin feature) is not yet implemented. Types are free-text input for now.

## Troubleshooting

### CORS Issues
If you see CORS errors in the browser console, ensure the backend has CORS enabled for `http://localhost:1420`.

### 404 Errors
- Verify the backend is running on port 3001
- Check the API_BASE_URL in `frontend/src/api/cmdbClient.ts`
- Ensure routes are registered in `backend/src/main.rs`

### TypeScript Errors
Run type checking:
```bash
cd frontend
npx tsc --noEmit
```

### Build Errors
Some pre-existing TypeScript errors in other files (like ClusterSizingView.tsx) are unrelated to CMDB. Focus on:
- `src/api/cmdbClient.ts`
- `src/views/CMDBExplorerView.tsx`
- `src/views/CIDetailView.tsx`
- `src/components/CIEditorForm.tsx`

## Next Steps

After basic testing is complete, consider:

1. **Integration Testing**: Write Playwright tests for CMDB flows
2. **Graph Enhancement**: Replace simple tree with react-flow
3. **Admin Features**: Add CI Type management
4. **Sidebar Navigation**: Add CMDB link to NavigationSidebar
5. **Performance**: Test with large datasets (1000+ CIs)
6. **Relationships**: Add UI for creating/deleting relationships
7. **Search**: Enhance search with fuzzy matching and highlighting

## Screenshots

Take screenshots of:
- [ ] CMDB Explorer with filters
- [ ] CI Detail Overview tab
- [ ] Relationship graph visualization
- [ ] Impact analysis panel
- [ ] Create CI form
- [ ] Edit CI form

## Test Data

Use these example CIs for testing:

```json
{
  "name": "Production DB Server",
  "ci_class": "HARDWARE",
  "ci_type": "Database Server",
  "status": "ACTIVE",
  "criticality": "CRITICAL",
  "environment": "Production",
  "vendor": "Dell",
  "model": "PowerEdge R640",
  "ip_address": "10.0.1.50",
  "tags": ["database", "mysql", "production"]
}

{
  "name": "Web Application Frontend",
  "ci_class": "SOFTWARE",
  "ci_type": "Web Application",
  "status": "ACTIVE",
  "criticality": "HIGH",
  "environment": "Production",
  "version": "2.5.0",
  "tags": ["react", "frontend", "customer-facing"]
}

{
  "name": "Production Network Switch",
  "ci_class": "NETWORK",
  "ci_type": "Network Switch",
  "status": "ACTIVE",
  "criticality": "HIGH",
  "environment": "Production",
  "vendor": "Cisco",
  "model": "Catalyst 9300",
  "ip_address": "10.0.1.1",
  "tags": ["network", "core", "production"]
}
```

## Feedback

Document any bugs or enhancement requests and add them to the GitHub issue #33.

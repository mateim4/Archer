const express = require('express');
const cors = require('cors');
const { Surreal } = require('surrealdb');

const app = express();
const PORT = process.env.LEGACY_PROJECT_PORT || process.env.PORT || 3003;

// SurrealDB connection handle and state flags
let db;
let dbConnected = false;

async function initDatabase() {
  try {
    db = new Surreal();
    await db.connect('ws://localhost:8000/rpc');
    await db.signin({ username: 'root', password: 'root' });
    await db.use({ namespace: 'lcmdesigner', database: 'projects' });
    console.log('✅ Connected to SurrealDB successfully');
    dbConnected = true;
    await initializeSchema();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('⚠️  Continuing without database connection...');
    dbConnected = false;
  }
}

async function initializeSchema() {
  if (!dbConnected) return;
  // Minimal schema guards to support Stage 1 resources; ignore if already defined
  try {
    await db.query(`
      DEFINE TABLE project SCHEMAFULL;
      DEFINE FIELD name ON project TYPE string ASSERT $value != NONE AND string::len($value) >= 3;
      DEFINE FIELD description ON project TYPE string;
      DEFINE FIELD project_type ON project TYPE string DEFAULT 'infrastructure';
      DEFINE FIELD status ON project TYPE string DEFAULT 'planning';
      DEFINE FIELD priority ON project TYPE string DEFAULT 'medium';
      DEFINE FIELD owner_id ON project TYPE string ASSERT $value != NONE;
      DEFINE FIELD assigned_team ON project TYPE array<string>;
      DEFINE FIELD start_date ON project TYPE datetime DEFAULT time::now();
      DEFINE FIELD target_end_date ON project TYPE datetime;
      DEFINE FIELD progress_percentage ON project TYPE int DEFAULT 0 ASSERT $value >= 0 AND $value <= 100;
      DEFINE FIELD budget_allocated ON project TYPE decimal;
      DEFINE FIELD budget_spent ON project TYPE decimal DEFAULT 0.0;
      DEFINE FIELD tags ON project TYPE array<string>;
      DEFINE FIELD metadata ON project TYPE object DEFAULT {};
      DEFINE FIELD created_at ON project TYPE datetime DEFAULT time::now();
      DEFINE FIELD updated_at ON project TYPE datetime DEFAULT time::now() VALUE time::now();
    `);
  } catch (_) {}

  try {
    await db.query(`
      DEFINE TABLE project_activity SCHEMAFULL;
      DEFINE FIELD project_id ON project_activity TYPE record(project) ASSERT $value != NONE;
      DEFINE FIELD name ON project_activity TYPE string ASSERT $value != NONE;
      DEFINE FIELD description ON project_activity TYPE string;
      DEFINE FIELD activity_type ON project_activity TYPE string;
      DEFINE FIELD status ON project_activity TYPE string DEFAULT 'pending';
      DEFINE FIELD start_date ON project_activity TYPE datetime;
      DEFINE FIELD end_date ON project_activity TYPE datetime;
      DEFINE FIELD due_date ON project_activity TYPE datetime;
      DEFINE FIELD assignee_id ON project_activity TYPE string;
      DEFINE FIELD dependencies ON project_activity TYPE array<string>;
      DEFINE FIELD progress_percentage ON project_activity TYPE int DEFAULT 0 ASSERT $value >= 0 AND $value <= 100;
      DEFINE FIELD created_at ON project_activity TYPE datetime DEFAULT time::now();
      DEFINE FIELD updated_at ON project_activity TYPE datetime DEFAULT time::now() VALUE time::now();
    `);
  } catch (_) {}

  try {
    await db.query(`
      DEFINE TABLE hardware_allocation SCHEMAFULL;
      DEFINE FIELD project_id ON hardware_allocation TYPE record(project) ASSERT $value != NONE;
      DEFINE FIELD activity_id ON hardware_allocation TYPE record(project_activity);
      DEFINE FIELD server_id ON hardware_allocation TYPE string ASSERT $value != NONE;
      DEFINE FIELD allocation_type ON hardware_allocation TYPE string;
      DEFINE FIELD allocation_start ON hardware_allocation TYPE datetime ASSERT $value != NONE;
      DEFINE FIELD allocation_end ON hardware_allocation TYPE datetime;
      DEFINE FIELD purpose ON hardware_allocation TYPE string;
      DEFINE FIELD configuration_notes ON hardware_allocation TYPE string;
      DEFINE FIELD created_at ON hardware_allocation TYPE datetime DEFAULT time::now();
    `);
  } catch (_) {}

  try {
    await db.query(`
      DEFINE TABLE local_user SCHEMAFULL;
      DEFINE FIELD email ON local_user TYPE string ASSERT $value != NONE AND string::contains($value, '@');
      DEFINE FIELD roles ON local_user TYPE array<string> DEFAULT [];
      DEFINE FIELD active ON local_user TYPE bool DEFAULT true;
      DEFINE FIELD created_at ON local_user TYPE datetime DEFAULT time::now();
    `);
  } catch (_) {}

  try {
    await db.query(`
      DEFINE TABLE rvtools_upload SCHEMAFULL;
      DEFINE FIELD project_id ON rvtools_upload TYPE option<record(project)>;
      DEFINE FIELD filename ON rvtools_upload TYPE string ASSERT $value != NONE;
      DEFINE FIELD file_type ON rvtools_upload TYPE string DEFAULT 'xlsx';
      DEFINE FIELD uploaded_at ON rvtools_upload TYPE datetime DEFAULT time::now();
      DEFINE FIELD processed ON rvtools_upload TYPE bool DEFAULT false;
      DEFINE FIELD vm_count ON rvtools_upload TYPE int DEFAULT 0;
      DEFINE FIELD host_count ON rvtools_upload TYPE int DEFAULT 0;
      DEFINE FIELD cluster_count ON rvtools_upload TYPE int DEFAULT 0;
    `);
  } catch (_) {}
}

// Middleware
app.use(cors());
app.use(express.json());

// Health endpoints
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    message: 'LCM Designer Server is running',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/status', (_req, res) => {
  res.json({
    status: 'running',
    timestamp: new Date().toISOString(),
    service: 'LCM Designer Backend',
    database: dbConnected ? 'connected' : 'disconnected',
  });
});

// In-memory mock stores (used when DB is disconnected)
let mockProjects = [
  {
    id: 'project:demo_infrastructure',
    name: 'Demo Infrastructure Project',
    description: 'Sample infrastructure deployment for demonstration',
    project_type: 'infrastructure',
    status: 'planning',
    priority: 'medium',
    owner_id: 'user:demo',
    assigned_team: ['user:admin01', 'user:dev01'],
    start_date: new Date().toISOString(),
    progress_percentage: 15,
    budget_allocated: 50000,
    budget_spent: 2500,
    tags: ['demo', 'infrastructure'],
    metadata: { demo: true },
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockActivities = [
  {
    id: 'project_activity:act_demo_1',
    project_id: 'project:demo_infrastructure',
    name: 'Infrastructure Assessment',
    description: 'Assess current environment',
    activity_type: 'assessment',
    status: 'completed',
    start_date: new Date(Date.now() - 21 * 86400000).toISOString(),
    end_date: new Date(Date.now() - 14 * 86400000).toISOString(),
    assignee_id: 'user:architect01',
    dependencies: [],
    progress_percentage: 100,
    created_at: new Date(Date.now() - 21 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
];

let mockAllocations = [
  {
    id: 'hardware_allocation:alloc_demo_1',
    project_id: 'project:demo_infrastructure',
    activity_id: 'project_activity:act_demo_1',
    server_id: 'hardware_pool:server_demo_1',
    allocation_type: 'allocated',
    allocation_start: new Date(Date.now() - 10 * 86400000).toISOString(),
    allocation_end: new Date(Date.now() + 10 * 86400000).toISOString(),
    purpose: 'assessment',
    configuration_notes: 'Temporary lab usage',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

let mockUsers = [
  { id: 'local_user:admin01', email: 'admin@example.com', roles: ['admin'], active: true, created_at: new Date().toISOString() },
  { id: 'local_user:dev01', email: 'dev@example.com', roles: ['engineer'], active: true, created_at: new Date().toISOString() },
];

// Helpers
function computeStatusWithDelay(activity) {
  const terminal = new Set(['completed', 'cancelled']);
  const now = Date.now();
  const end = activity?.end_date ? Date.parse(activity.end_date) : undefined;
  const due = activity?.due_date ? Date.parse(activity.due_date) : undefined;
  const cutoff = end ?? due;
  const base = (activity?.status || 'pending').toLowerCase();
  if (!terminal.has(base) && cutoff && cutoff < now) return 'delayed';
  return base;
}

function timeRangesOverlap(aStart, aEnd, bStart, bEnd) {
  const s1 = Date.parse(aStart);
  const e1 = aEnd ? Date.parse(aEnd) : Number.POSITIVE_INFINITY;
  const s2 = Date.parse(bStart);
  const e2 = bEnd ? Date.parse(bEnd) : Number.POSITIVE_INFINITY;
  return s1 <= e2 && s2 <= e1;
}

// Projects
app.get('/api/projects', async (_req, res) => {
  try {
    if (!dbConnected) return res.json(mockProjects);
    const result = await db.query(`SELECT * FROM project ORDER BY updated_at DESC`);
    return res.json(result?.[0]?.result || []);
  } catch (err) {
    console.log('📋 Fallback to mock data due to error:', err.message);
    return res.json(mockProjects);
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!dbConnected) {
      const p = mockProjects.find(p => p.id === `project:${id}` || p.id === id);
      if (!p) return res.status(404).json({ error: 'Project not found' });
      return res.json(p);
    }
    const result = await db.query(`SELECT * FROM $id`, { id: `project:${id}` });
    const project = result?.[0]?.result?.[0];
    if (!project) return res.status(404).json({ error: 'Project not found' });
    return res.json(project);
  } catch (err) {
    const { id } = req.params;
    const p = mockProjects.find(p => p.id === `project:${id}` || p.id === id);
    if (!p) return res.status(404).json({ error: 'Project not found' });
    return res.json(p);
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, description, owner_id } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: 'Validation error', message: 'Project name is required' });
    if (!owner_id) return res.status(400).json({ error: 'Validation error', message: 'Owner ID is required' });
    const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const newProject = {
      id: `project:${projectId}`,
      name: name.trim(),
      description: description || '',
      project_type: 'infrastructure',
      status: 'planning',
      priority: 'medium',
      owner_id,
      assigned_team: [],
      start_date: now,
      progress_percentage: 0,
      budget_allocated: 0,
      budget_spent: 0,
      tags: [],
      metadata: {},
      created_at: now,
      updated_at: now,
    };
    if (!dbConnected) {
      mockProjects.unshift(newProject);
      return res.status(201).json(newProject);
    }
    const result = await db.query(`CREATE $id CONTENT $data`, { id: `project:${projectId}`, data: newProject });
    const created = result?.[0]?.result?.[0] || newProject;
    return res.status(201).json(created);
  } catch (err) {
    console.error('Error creating project:', err);
    return res.status(500).json({ error: 'Failed to create project', message: err.message });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    if (!dbConnected) return res.status(500).json({ error: 'Database not connected', message: 'Please ensure SurrealDB is running' });
    const { id } = req.params;
    const updates = { ...(req.body || {}), updated_at: new Date().toISOString() };
    const result = await db.query(`UPDATE $id MERGE $updates`, { id: `project:${id}`, updates });
    const updated = result?.[0]?.result?.[0];
    if (!updated) return res.status(404).json({ error: 'Project not found' });
    return res.json(updated);
  } catch (err) {
    console.error('Error updating project:', err);
    return res.status(500).json({ error: 'Failed to update project', message: err.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    if (!dbConnected) return res.status(500).json({ error: 'Database not connected', message: 'Please ensure SurrealDB is running' });
    const { id } = req.params;
    const result = await db.query(`DELETE $id`, { id: `project:${id}` });
    if (result?.[0]?.result?.length === 0) return res.status(404).json({ error: 'Project not found' });
    return res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Error deleting project:', err);
    return res.status(500).json({ error: 'Failed to delete project', message: err.message });
  }
});

// Workflows (read-only for now)
app.get('/api/projects/:projectId/workflows', async (req, res) => {
  try {
    if (!dbConnected) return res.status(500).json({ error: 'Database not connected', message: 'Please ensure SurrealDB is running' });
    const { projectId } = req.params;
    const result = await db.query(`
      SELECT * FROM project_workflow 
      WHERE project_id = $pid
      ORDER BY priority DESC, created_at ASC
    `, { pid: `project:${projectId}` });
    return res.json(result?.[0]?.result || []);
  } catch (err) {
    console.error('Error fetching workflows:', err);
    return res.status(500).json({ error: 'Failed to fetch workflows', message: err.message });
  }
});

// Activities
app.get('/api/projects/:projectId/activities', async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!dbConnected) {
      const data = mockActivities.filter(a => a.project_id === `project:${projectId}` || a.project_id === projectId)
        .map(a => ({ ...a, status: computeStatusWithDelay(a) }));
      return res.json(data);
    }
    const result = await db.query(`
      SELECT * FROM project_activity WHERE project_id = $pid
      ORDER BY start_date ASC, created_at ASC
    `, { pid: `project:${projectId}` });
    const items = (result?.[0]?.result || []).map(a => ({ ...a, status: computeStatusWithDelay(a) }));
    return res.json(items);
  } catch (err) {
    console.error('Error fetching activities:', err);
    return res.status(500).json({ error: 'Failed to fetch activities', message: err.message });
  }
});

app.post('/api/projects/:projectId/activities', async (req, res) => {
  try {
    const { projectId } = req.params;
    const b = req.body || {};
    const now = new Date().toISOString();
    const id = `project_activity:${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const payload = {
      project_id: `project:${projectId}`,
      name: b.name || 'New Activity',
      description: b.description || '',
      activity_type: b.activity_type || b.type || 'custom',
      status: b.status || 'pending',
      start_date: b.start_date || now,
      end_date: b.end_date || b.due_date || null,
      due_date: b.due_date || b.end_date || null,
      assignee_id: b.assignee_id || null,
      dependencies: Array.isArray(b.dependencies) ? b.dependencies : [],
      progress_percentage: typeof b.progress_percentage === 'number' ? b.progress_percentage : (typeof b.progress === 'number' ? b.progress : 0),
      created_at: now,
      updated_at: now,
    };
    if (!dbConnected) {
      const created = { id, ...payload };
      mockActivities.push(created);
      created.status = computeStatusWithDelay(created);
      return res.status(201).json(created);
    }
    const result = await db.query(`CREATE $id CONTENT $data`, { id, data: payload });
    const created = result?.[0]?.result?.[0] || { id, ...payload };
    created.status = computeStatusWithDelay(created);
    return res.status(201).json(created);
  } catch (err) {
    console.error('Error creating activity:', err);
    return res.status(500).json({ error: 'Failed to create activity', message: err.message });
  }
});

app.put('/api/activities/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params;
    const updates = { ...(req.body || {}), updated_at: new Date().toISOString() };
    if (!dbConnected) {
      const idx = mockActivities.findIndex(a => a.id === `project_activity:${activityId}` || a.id === activityId);
      if (idx === -1) return res.status(404).json({ error: 'Activity not found' });
      const merged = { ...mockActivities[idx], ...updates };
      merged.status = computeStatusWithDelay(merged);
      mockActivities[idx] = merged;
      return res.json(merged);
    }
    const result = await db.query(`UPDATE $id MERGE $updates`, { id: activityId.includes('project_activity:') ? activityId : `project_activity:${activityId}`, updates });
    const updated = result?.[0]?.result?.[0];
    if (!updated) return res.status(404).json({ error: 'Activity not found' });
    updated.status = computeStatusWithDelay(updated);
    return res.json(updated);
  } catch (err) {
    console.error('Error updating activity:', err);
    return res.status(500).json({ error: 'Failed to update activity', message: err.message });
  }
});

app.delete('/api/activities/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params;
    if (!dbConnected) {
      const before = mockActivities.length;
      mockActivities = mockActivities.filter(a => a.id !== `project_activity:${activityId}` && a.id !== activityId);
      if (mockActivities.length === before) return res.status(404).json({ error: 'Activity not found' });
      return res.json({ message: 'Activity deleted' });
    }
    const result = await db.query(`DELETE $id`, { id: activityId.includes('project_activity:') ? activityId : `project_activity:${activityId}` });
    if (!result?.[0] || (Array.isArray(result[0].result) && result[0].result.length === 0)) return res.status(404).json({ error: 'Activity not found' });
    return res.json({ message: 'Activity deleted' });
  } catch (err) {
    console.error('Error deleting activity:', err);
    return res.status(500).json({ error: 'Failed to delete activity', message: err.message });
  }
});

// Allocations
app.get('/api/projects/:projectId/allocations', async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!dbConnected) {
      const items = mockAllocations.filter(a => a.project_id === `project:${projectId}` || a.project_id === projectId);
      return res.json(items);
    }
    const result = await db.query(`SELECT * FROM hardware_allocation WHERE project_id = $pid ORDER BY allocation_start DESC`, { pid: `project:${projectId}` });
    return res.json(result?.[0]?.result || []);
  } catch (err) {
    console.error('Error fetching allocations:', err);
    return res.status(500).json({ error: 'Failed to fetch allocations', message: err.message });
  }
});

app.get('/api/activities/:activityId/allocations', async (req, res) => {
  try {
    const { activityId } = req.params;
    if (!dbConnected) {
      const items = mockAllocations.filter(a => a.activity_id === `project_activity:${activityId}` || a.activity_id === activityId);
      return res.json(items);
    }
    const result = await db.query(`SELECT * FROM hardware_allocation WHERE activity_id = $aid ORDER BY allocation_start DESC`, { aid: activityId.includes('project_activity:') ? activityId : `project_activity:${activityId}` });
    return res.json(result?.[0]?.result || []);
  } catch (err) {
    console.error('Error fetching allocations by activity:', err);
    return res.status(500).json({ error: 'Failed to fetch allocations', message: err.message });
  }
});

app.post('/api/projects/:projectId/allocations', async (req, res) => {
  try {
    const { projectId } = req.params;
    const b = req.body || {};
    const id = `hardware_allocation:${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const payload = {
      project_id: `project:${projectId}`,
      activity_id: b.activity_id || null,
      server_id: b.server_id,
      allocation_type: b.allocation_type || 'allocated',
      allocation_start: b.allocation_start || now,
      allocation_end: b.allocation_end || null,
      purpose: b.purpose || null,
      configuration_notes: b.configuration_notes || null,
      created_at: now,
    };
    if (!payload.server_id) return res.status(400).json({ error: 'Validation error', message: 'server_id is required' });

    // Overlap validation for the same server
    if (!dbConnected) {
      const overlaps = mockAllocations.some(a => a.server_id === payload.server_id && timeRangesOverlap(a.allocation_start, a.allocation_end, payload.allocation_start, payload.allocation_end));
      if (overlaps) return res.status(409).json({ error: 'Overlap', message: 'Server already allocated during this time window' });
    } else {
      try {
        const q = await db.query(`
          SELECT * FROM hardware_allocation WHERE server_id = $sid
          AND (
            ($end = NONE AND allocation_end = NONE) OR
            ($end = NONE AND allocation_end >= $start) OR
            (allocation_end = NONE AND $end >= allocation_start) OR
            ($start <= allocation_end AND $end >= allocation_start)
          )
          LIMIT 1
        `, { sid: payload.server_id, start: payload.allocation_start, end: payload.allocation_end });
        const existing = q?.[0]?.result || [];
        if (existing.length > 0) return res.status(409).json({ error: 'Overlap', message: 'Server already allocated during this time window' });
      } catch (e) {
        console.warn('Overlap query failed, proceeding without DB validation:', e.message);
      }
    }

    if (!dbConnected) {
      const created = { id, ...payload };
      mockAllocations.push(created);
      return res.status(201).json(created);
    }
    const result = await db.query(`CREATE $id CONTENT $data`, { id, data: payload });
    const created = result?.[0]?.result?.[0] || { id, ...payload };
    return res.status(201).json(created);
  } catch (err) {
    console.error('Error creating allocation:', err);
    return res.status(500).json({ error: 'Failed to create allocation', message: err.message });
  }
});

app.get('/api/hardware/:serverId/allocations', async (req, res) => {
  try {
    const { serverId } = req.params;
    if (!dbConnected) {
      const items = mockAllocations.filter(a => a.server_id === serverId || a.server_id === `hardware_pool:${serverId}`);
      return res.json(items);
    }
    const result = await db.query(`SELECT * FROM hardware_allocation WHERE server_id = $sid ORDER BY allocation_start DESC`, { sid: serverId.includes('hardware_pool:') ? serverId : `hardware_pool:${serverId}` });
    return res.json(result?.[0]?.result || []);
  } catch (err) {
    console.error('Error fetching server allocations:', err);
    return res.status(500).json({ error: 'Failed to fetch server allocations', message: err.message });
  }
});

app.put('/api/allocations/:allocationId', async (req, res) => {
  try {
    const { allocationId } = req.params;
    const updates = { ...(req.body || {}) };
    if (!dbConnected) {
      const idx = mockAllocations.findIndex(a => a.id === `hardware_allocation:${allocationId}` || a.id === allocationId);
      if (idx === -1) return res.status(404).json({ error: 'Allocation not found' });
      mockAllocations[idx] = { ...mockAllocations[idx], ...updates };
      return res.json(mockAllocations[idx]);
    }
    const result = await db.query(`UPDATE $id MERGE $updates`, { id: allocationId.includes('hardware_allocation:') ? allocationId : `hardware_allocation:${allocationId}`, updates });
    const updated = result?.[0]?.result?.[0];
    if (!updated) return res.status(404).json({ error: 'Allocation not found' });
    return res.json(updated);
  } catch (err) {
    console.error('Error updating allocation:', err);
    return res.status(500).json({ error: 'Failed to update allocation', message: err.message });
  }
});

app.delete('/api/allocations/:allocationId', async (req, res) => {
  try {
    const { allocationId } = req.params;
    if (!dbConnected) {
      const before = mockAllocations.length;
      mockAllocations = mockAllocations.filter(a => a.id !== `hardware_allocation:${allocationId}` && a.id !== allocationId);
      if (mockAllocations.length === before) return res.status(404).json({ error: 'Allocation not found' });
      return res.json({ message: 'Allocation deleted' });
    }
    const result = await db.query(`DELETE $id`, { id: allocationId.includes('hardware_allocation:') ? allocationId : `hardware_allocation:${allocationId}` });
    if (!result?.[0] || (Array.isArray(result[0].result) && result[0].result.length === 0)) return res.status(404).json({ error: 'Allocation not found' });
    return res.json({ message: 'Allocation deleted' });
  } catch (err) {
    console.error('Error deleting allocation:', err);
    return res.status(500).json({ error: 'Failed to delete allocation', message: err.message });
  }
});

// Users
app.get('/api/users', async (_req, res) => {
  try {
    if (!dbConnected) return res.json(mockUsers);
    const result = await db.query(`SELECT * FROM local_user ORDER BY created_at DESC`);
    return res.json(result?.[0]?.result || []);
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ error: 'Failed to fetch users', message: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { email, roles = [], active = true } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Validation error', message: 'email is required' });
    const id = `local_user:${email.toLowerCase()}`;
    const payload = { id, email, roles, active, created_at: new Date().toISOString() };
    if (!dbConnected) { mockUsers.push(payload); return res.status(201).json(payload); }
    const result = await db.query(`CREATE $id CONTENT $data`, { id, data: payload });
    return res.status(201).json(result?.[0]?.result?.[0] || payload);
  } catch (err) {
    console.error('Error creating user:', err);
    return res.status(500).json({ error: 'Failed to create user', message: err.message });
  }
});

app.put('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body || {};
    if (!dbConnected) {
      const idx = mockUsers.findIndex(u => u.id === `local_user:${userId}` || u.id === userId);
      if (idx === -1) return res.status(404).json({ error: 'User not found' });
      mockUsers[idx] = { ...mockUsers[idx], ...updates };
      return res.json(mockUsers[idx]);
    }
    const result = await db.query(`UPDATE $id MERGE $updates`, { id: userId.includes('local_user:') ? userId : `local_user:${userId}`, updates });
    const updated = result?.[0]?.result?.[0];
    if (!updated) return res.status(404).json({ error: 'User not found' });
    return res.json(updated);
  } catch (err) {
    console.error('Error updating user:', err);
    return res.status(500).json({ error: 'Failed to update user', message: err.message });
  }
});

app.delete('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!dbConnected) {
      const before = mockUsers.length;
      mockUsers = mockUsers.filter(u => u.id !== `local_user:${userId}` && u.id !== userId);
      if (mockUsers.length === before) return res.status(404).json({ error: 'User not found' });
      return res.json({ message: 'User deleted' });
    }
    const result = await db.query(`DELETE $id`, { id: userId.includes('local_user:') ? userId : `local_user:${userId}` });
    if (!result?.[0] || (Array.isArray(result[0].result) && result[0].result.length === 0)) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ error: 'Failed to delete user', message: err.message });
  }
});

// ============================================================================
// RVTOOLS ENDPOINTS
// ============================================================================

// GET /api/rvtools/uploads - List all RVTools uploads with optional filters
app.get('/api/rvtools/uploads', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Database not available' });
  }

  try {
    const { project_id, processed, limit } = req.query;
    
    // Build query based on filters
    let query = 'SELECT * FROM rvtools_upload';
    const conditions = [];
    
    if (project_id) {
      conditions.push(`project_id = "${project_id}"`);
    }
    if (processed !== undefined) {
      conditions.push(`processed = ${processed === 'true'}`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY uploaded_at DESC';
    
    if (limit) {
      query += ` LIMIT ${parseInt(limit)}`;
    }

    const result = await db.query(query);
    const uploads = result[0] || [];
    
    return res.json({ uploads });
  } catch (err) {
    console.error('Failed to fetch RVTools uploads:', err);
    return res.status(500).json({ error: 'Failed to fetch uploads', message: err.message });
  }
});

// POST /api/rvtools/upload - Upload and process RVTools data
app.post('/api/rvtools/upload', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Database not available' });
  }

  try {
    const { project_id, filename, file_data, file_type } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'Missing required field: filename' });
    }

    // Create the upload record
    const uploadRecord = await db.create('rvtools_upload', {
      project_id: project_id || null,
      filename,
      file_type: file_type || 'xlsx',
      uploaded_at: new Date().toISOString(),
      processed: false,
      vm_count: 0,
      host_count: 0,
      cluster_count: 0,
    });

    return res.status(201).json({
      upload_id: uploadRecord[0].id,
      message: 'RVTools data uploaded successfully',
      upload: uploadRecord[0],
    });
  } catch (err) {
    console.error('Failed to upload RVTools data:', err);
    return res.status(500).json({ error: 'Failed to upload', message: err.message });
  }
});

// GET /api/rvtools/uploads/:id - Get a specific upload by ID
app.get('/api/rvtools/uploads/:id', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Database not available' });
  }

  try {
    const { id } = req.params;
    const result = await db.select(id);
    
    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    return res.json({ upload: result[0] });
  } catch (err) {
    console.error('Failed to fetch RVTools upload:', err);
    return res.status(500).json({ error: 'Failed to fetch upload', message: err.message });
  }
});

// DELETE /api/rvtools/uploads/:id - Delete an upload
app.delete('/api/rvtools/uploads/:id', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Database not available' });
  }

  try {
    const { id } = req.params;
    await db.delete(id);
    return res.json({ message: 'Upload deleted successfully' });
  } catch (err) {
    console.error('Failed to delete RVTools upload:', err);
    return res.status(500).json({ error: 'Failed to delete upload', message: err.message });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log('🚀 LCM Designer Server starting...');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 API Status: http://localhost:${PORT}/api/status`);
  await initDatabase();
  console.log('🎯 Server initialization complete!');
  console.log('');
  console.log('📋 Available endpoints:');
  console.log('  GET    /health');
  console.log('  GET    /api/status');
  console.log('  GET    /api/projects');
  console.log('  POST   /api/projects');
  console.log('  GET    /api/projects/:id');
  console.log('  PUT    /api/projects/:id');
  console.log('  DELETE /api/projects/:id');
  console.log('  GET    /api/projects/:id/workflows');
  console.log('  GET    /api/projects/:id/activities');
  console.log('  POST   /api/projects/:id/activities');
  console.log('  PUT    /api/activities/:activityId');
  console.log('  DELETE /api/activities/:activityId');
  console.log('  GET    /api/projects/:id/allocations');
  console.log('  POST   /api/projects/:id/allocations');
  console.log('  GET    /api/activities/:id/allocations');
  console.log('  GET    /api/hardware/:serverId/allocations');
  console.log('  PUT    /api/allocations/:allocationId');
  console.log('  DELETE /api/allocations/:allocationId');
  console.log('  GET    /api/users');
  console.log('  POST   /api/users');
  console.log('  PUT    /api/users/:userId');
  console.log('  DELETE /api/users/:userId');
  console.log('  GET    /api/rvtools/uploads');
  console.log('  POST   /api/rvtools/upload');
  console.log('  GET    /api/rvtools/uploads/:id');
  console.log('  DELETE /api/rvtools/uploads/:id');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  try {
    if (db) await db.close();
  } catch (_) {}
  console.log('✅ Shutdown complete');
  process.exit(0);
});
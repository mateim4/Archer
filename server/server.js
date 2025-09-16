const express = require('express');
const cors = require('cors');
const { Surreal } = require('surrealdb');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize SurrealDB connection
let db;
let dbReady = false;

async function initDatabase() {
  try {
    db = new Surreal();
    
    // Connect to SurrealDB (adjust connection details as needed)
    await db.connect('ws://localhost:8000/rpc');
    
    // Use namespace and database
    await db.use({ 
      namespace: 'lcmdesigner', 
      database: 'projects' 
    });
    
    console.log('✅ Connected to SurrealDB successfully');
  dbReady = true;
    
    // Initialize schema if needed
    await initializeSchema();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('⚠️  Continuing without database connection...');
    console.log('📝 Make sure SurrealDB is running: surreal start --log trace --user root --pass root');
  dbReady = false;
  }
}

async function initializeSchema() {
  try {
    // Check if we have any projects, if not, run initial schema
    const projects = await db.query('SELECT * FROM project LIMIT 1');
    
    if (!projects || projects.length === 0 || !projects[0].result || projects[0].result.length === 0) {
      console.log('🔄 Initializing database schema...');
      
      // Basic schema setup - the full schema should be run via surreal CLI
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
      
      console.log('✅ Database schema initialized');
    }
  } catch (error) {
    console.log('⚠️  Schema initialization skipped:', error.message);
  }

  // Try to ensure minimal Stage 1 tables exist; ignore errors if they already exist
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
  } catch (e) {
    console.log('ℹ️  project_activity schema define skipped:', e.message);
  }

  try {
    await db.query(`
      DEFINE TABLE local_user SCHEMAFULL;
      DEFINE FIELD email ON local_user TYPE string ASSERT $value != NONE AND string::contains($value, '@');
      DEFINE FIELD roles ON local_user TYPE array<string> DEFAULT [];
      DEFINE FIELD active ON local_user TYPE bool DEFAULT true;
      DEFINE FIELD created_at ON local_user TYPE datetime DEFAULT time::now();
    `);
  } catch (e) {
    console.log('ℹ️  local_user schema define skipped:', e.message);
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'LCM Designer Server is running',
  database: dbReady ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Basic API status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'running',
    timestamp: new Date().toISOString(),
    service: 'LCM Designer Backend',
  database: dbReady ? 'connected' : 'disconnected'
  });
});

// =============================================================================
// PROJECT ENDPOINTS
// =============================================================================

// Mock data store (in-memory for now)
let mockProjects = [
  {
    id: "project:demo_infrastructure",
    name: "Demo Infrastructure Project",
    description: "Sample infrastructure deployment for demonstration",
    project_type: "infrastructure",
    status: "planning",
    priority: "medium",
    owner_id: "user:demo",
    assigned_team: ["user:admin01", "user:dev01"],
    start_date: new Date().toISOString(),
    progress_percentage: 15,
    budget_allocated: 50000,
    budget_spent: 2500,
    tags: ["demo", "infrastructure"],
    metadata: { demo: true },
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updated_at: new Date().toISOString()
  }
];

// In-memory mocks for Stage 1 resources when DB is unavailable
let mockActivities = [
  // Example activity
  {
    id: 'project_activity:act_demo_1',
    project_id: 'project:demo_infrastructure',
    name: 'Infrastructure Assessment',
    description: 'Assess current environment',
    activity_type: 'assessment',
    status: 'completed',
    start_date: new Date(Date.now() - 21 * 24 * 3600 * 1000).toISOString(),
    end_date: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
    assignee_id: 'user:architect01',
    dependencies: [],
    progress_percentage: 100,
    created_at: new Date(Date.now() - 21 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
  },
];

let mockAllocations = [
  // Example allocation
  {
    id: 'hardware_allocation:alloc_demo_1',
    project_id: 'project:demo_infrastructure',
    activity_id: 'project_activity:act_demo_1',
    server_id: 'hardware_pool:server_demo_1',
    allocation_type: 'allocated',
    allocation_start: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    allocation_end: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
    purpose: 'assessment',
    configuration_notes: 'Temporary lab usage',
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
  },
];

let mockUsers = [
  { id: 'local_user:admin01', email: 'admin@example.com', roles: ['admin'], active: true, created_at: new Date().toISOString() },
  { id: 'local_user:dev01', email: 'dev@example.com', roles: ['engineer'], active: true, created_at: new Date().toISOString() },
];

// Utility: compute auto-delayed status
function computeStatusWithDelay(activity) {
  const terminal = new Set(['completed', 'cancelled']);
  const now = Date.now();
  const end = activity?.end_date ? Date.parse(activity.end_date) : undefined;
  const due = activity?.due_date ? Date.parse(activity.due_date) : undefined;
  const cutoff = end ?? due;
  const base = (activity?.status || 'pending').toLowerCase();
  if (!terminal.has(base) && cutoff && cutoff < now) {
    return 'delayed';
  }
  return base;
}

// Get all projects
app.get('/api/projects', async (req, res) => {
  try {
  if (!dbReady) {
      // Use mock data when database is not available
      console.log('📋 Using mock data - serving', mockProjects.length, 'projects');
      return res.json(mockProjects);
    }
    
    const result = await db.query(`
      SELECT * FROM project 
      ORDER BY updated_at DESC
    `);
    
    const projects = result[0]?.result || [];
    
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    
    // Fallback to mock data
    console.log('📋 Fallback to mock data due to error:', error.message);
    res.json(mockProjects);
  }
});

// Get single project by ID
app.get('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
  if (!dbReady) {
      // Use mock data when database is not available
      const project = mockProjects.find(p => p.id === `project:${id}` || p.id === id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      return res.json(project);
    }
    
    const result = await db.query(`SELECT * FROM $id`, { id: `project:${id}` });
    
    const project = result[0]?.result?.[0];
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    
    // Fallback to mock data
    const { id } = req.params;
    const project = mockProjects.find(p => p.id === `project:${id}` || p.id === id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  }
});

// Create new project
app.post('/api/projects', async (req, res) => {
  try {
    const { name, description, owner_id } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        error: 'Validation error', 
        message: 'Project name is required' 
      });
    }
    
    if (!owner_id) {
      return res.status(400).json({ 
        error: 'Validation error', 
        message: 'Owner ID is required' 
      });
    }
    
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
      updated_at: now
    };
    
    if (!db) {
      // Use mock data when database is not available
      mockProjects.unshift(newProject); // Add to beginning of array
      console.log('✅ Project created in mock store:', newProject.id);
      return res.status(201).json(newProject);
    }
    
    const result = await db.query(`
      CREATE $id CONTENT {
        name: $name,
        description: $description,
        project_type: 'infrastructure',
        status: 'planning',
        priority: 'medium',
        owner_id: $owner_id,
        assigned_team: [],
        start_date: time::now(),
        progress_percentage: 0,
        budget_allocated: 0,
        budget_spent: 0,
        tags: [],
        metadata: {},
        created_at: time::now(),
        updated_at: time::now()
      }
    `, { 
      id: `project:${projectId}`,
      name: name.trim(),
      description: description || '',
      owner_id 
    });
    
    const createdProject = result[0]?.result?.[0];
    
    if (!createdProject) {
      throw new Error('Failed to create project');
    }
    
    console.log('✅ Project created in database:', createdProject.id);
    
    res.status(201).json(createdProject);
  } catch (error) {
    console.error('Error creating project:', error);
    
    // Try fallback to mock store
    try {
      const { name, description, owner_id } = req.body;
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
        updated_at: now
      };
      
      mockProjects.unshift(newProject);
      console.log('✅ Project created in mock fallback:', newProject.id);
      return res.status(201).json(newProject);
      
    } catch (fallbackError) {
      console.error('Fallback creation also failed:', fallbackError);
      res.status(500).json({ 
        error: 'Failed to create project', 
        message: error.message 
      });
    }
  }
});

// Update project
app.put('/api/projects/:id', async (req, res) => {
  try {
  if (!dbReady) {
      return res.status(500).json({ 
        error: 'Database not connected',
        message: 'Please ensure SurrealDB is running'
      });
    }
    
    const { id } = req.params;
    const updates = req.body;
    
    // Always update the timestamp
    updates.updated_at = new Date().toISOString();
    
    const result = await db.query(`
      UPDATE $id MERGE $updates
    `, { 
      id: `project:${id}`,
      updates 
    });
    
    const updatedProject = result[0]?.result?.[0];
    
    if (!updatedProject) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ 
      error: 'Failed to update project', 
      message: error.message 
    });
  }
});

// Delete project
app.delete('/api/projects/:id', async (req, res) => {
  try {
  if (!dbReady) {
      return res.status(500).json({ 
        error: 'Database not connected',
        message: 'Please ensure SurrealDB is running'
      });
    }
    
    const { id } = req.params;
    
    const result = await db.query(`DELETE $id`, { id: `project:${id}` });
    
    if (result[0]?.result?.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ 
      error: 'Failed to delete project', 
      message: error.message 
    });
  }
});

// =============================================================================
// PROJECT WORKFLOWS ENDPOINTS
// =============================================================================

// Get workflows for a project
app.get('/api/projects/:projectId/workflows', async (req, res) => {
  try {
  if (!dbReady) {
      return res.status(500).json({ 
        error: 'Database not connected',
        message: 'Please ensure SurrealDB is running'
      });
    }
    
    const { projectId } = req.params;
    
    const result = await db.query(`
      SELECT * FROM project_workflow 
      WHERE project_id = $projectId 
      ORDER BY priority DESC, created_at ASC
    `, { projectId: `project:${projectId}` });
    
    const workflows = result[0]?.result || [];
    
    res.json(workflows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ 
      error: 'Failed to fetch workflows', 
      message: error.message 
    });
  }
});

// =============================================================================
// ACTIVITIES ENDPOINTS (Stage 1)
// =============================================================================

// List activities for a project
app.get('/api/projects/:projectId/activities', async (req, res) => {
  try {
    const { projectId } = req.params;
  if (!dbReady) {
      const data = mockActivities
        .filter(a => a.project_id === `project:${projectId}` || a.project_id === projectId)
        .map(a => ({ ...a, status: computeStatusWithDelay(a) }));
      return res.json(data);
    }

    const result = await db.query(`
      SELECT * FROM project_activity
      WHERE project_id = $pid
      ORDER BY start_date ASC, created_at ASC
    `, { pid: `project:${projectId}` });

    const activities = (result?.[0]?.result || []).map(a => ({
      ...a,
      status: computeStatusWithDelay(a),
    }));
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    // Fallback to mock data
    try {
      const { projectId } = req.params;
      const data = mockActivities
        .filter(a => a.project_id === `project:${projectId}` || a.project_id === projectId)
        .map(a => ({ ...a, status: computeStatusWithDelay(a) }));
      return res.json(data);
    } catch (e2) {
      res.status(500).json({ error: 'Failed to fetch activities', message: error.message });
    }
  }
});

// Create activity for a project
app.post('/api/projects/:projectId/activities', async (req, res) => {
  try {
    const { projectId } = req.params;
    const body = req.body || {};
    const now = new Date().toISOString();
    const id = `project_activity:${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const payload = {
      project_id: `project:${projectId}`,
      name: body.name || 'New Activity',
      description: body.description || '',
      activity_type: body.activity_type || body.type || 'custom',
      status: body.status || 'pending',
      start_date: body.start_date || now,
      end_date: body.end_date || body.due_date || null,
      due_date: body.due_date || body.end_date || null,
      assignee_id: body.assignee_id || null,
      dependencies: Array.isArray(body.dependencies) ? body.dependencies : [],
      progress_percentage: typeof body.progress_percentage === 'number' ? body.progress_percentage : (typeof body.progress === 'number' ? body.progress : 0),
      created_at: now,
      updated_at: now,
    };

  if (!dbReady) {
      const created = { id, ...payload };
      mockActivities.push(created);
      created.status = computeStatusWithDelay(created);
      return res.status(201).json(created);
    }

    const result = await db.query(`
      CREATE $id CONTENT $data
    `, { id, data: payload });

    const created = result?.[0]?.result?.[0] || { id, ...payload };
    created.status = computeStatusWithDelay(created);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Failed to create activity', message: error.message });
  }
});

// Update activity
app.put('/api/activities/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params;
    const updates = { ...(req.body || {}) };
    updates.updated_at = new Date().toISOString();

  if (!dbReady) {
      const idx = mockActivities.findIndex(a => a.id === `project_activity:${activityId}` || a.id === activityId);
      if (idx === -1) return res.status(404).json({ error: 'Activity not found' });
      const merged = { ...mockActivities[idx], ...updates };
      merged.status = computeStatusWithDelay(merged);
      mockActivities[idx] = merged;
      return res.json(merged);
    }

    const result = await db.query(`UPDATE $id MERGE $updates`, { id: activityId.includes('project_activity:') ? activityId : `project_activity:${activityId}` , updates });
    const updated = result?.[0]?.result?.[0];
    if (!updated) return res.status(404).json({ error: 'Activity not found' });
    updated.status = computeStatusWithDelay(updated);
    res.json(updated);
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ error: 'Failed to update activity', message: error.message });
  }
});

// Delete activity
app.delete('/api/activities/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params;
  if (!dbReady) {
      const before = mockActivities.length;
      mockActivities = mockActivities.filter(a => a.id !== `project_activity:${activityId}` && a.id !== activityId);
      if (mockActivities.length === before) return res.status(404).json({ error: 'Activity not found' });
      return res.json({ message: 'Activity deleted' });
    }
    const result = await db.query(`DELETE $id`, { id: activityId.includes('project_activity:') ? activityId : `project_activity:${activityId}` });
    if (!result?.[0] || (Array.isArray(result[0].result) && result[0].result.length === 0)) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    res.json({ message: 'Activity deleted' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ error: 'Failed to delete activity', message: error.message });
  }
});

// =============================================================================
// HARDWARE ALLOCATIONS ENDPOINTS (Stage 1)
// =============================================================================

// List allocations for a project
app.get('/api/projects/:projectId/allocations', async (req, res) => {
  try {
    const { projectId } = req.params;
  if (!dbReady) {
      const items = mockAllocations.filter(a => a.project_id === `project:${projectId}` || a.project_id === projectId);
      return res.json(items);
    }
    const result = await db.query(`
      SELECT * FROM hardware_allocation
      WHERE project_id = $pid
      ORDER BY allocation_start DESC
    `, { pid: `project:${projectId}` });
    res.json(result?.[0]?.result || []);
  } catch (error) {
    console.error('Error fetching allocations:', error);
    res.status(500).json({ error: 'Failed to fetch allocations', message: error.message });
  }
});

// List allocations for an activity
app.get('/api/activities/:activityId/allocations', async (req, res) => {
  try {
    const { activityId } = req.params;
  if (!dbReady) {
      const items = mockAllocations.filter(a => a.activity_id === `project_activity:${activityId}` || a.activity_id === activityId);
      return res.json(items);
    }
    const result = await db.query(`
      SELECT * FROM hardware_allocation
      WHERE activity_id = $aid
      ORDER BY allocation_start DESC
    `, { aid: activityId.includes('project_activity:') ? activityId : `project_activity:${activityId}` });
    res.json(result?.[0]?.result || []);
  } catch (error) {
    console.error('Error fetching activity allocations:', error);
    res.status(500).json({ error: 'Failed to fetch allocations', message: error.message });
  }
});

// Create allocation for a project (optionally linked to activity)
app.post('/api/projects/:projectId/allocations', async (req, res) => {
  try {
    const { projectId } = req.params;
    const body = req.body || {};
    const id = `hardware_allocation:${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const payload = {
      project_id: `project:${projectId}`,
      activity_id: body.activity_id || null,
      server_id: body.server_id,
      allocation_type: body.allocation_type || 'allocated',
      allocation_start: body.allocation_start || now,
      allocation_end: body.allocation_end || null,
      purpose: body.purpose || null,
      configuration_notes: body.configuration_notes || null,
      created_at: now,
    };

    if (!payload.server_id) {
      return res.status(400).json({ error: 'Validation error', message: 'server_id is required' });
    }

  if (!dbReady) {
      const created = { id, ...payload };
      mockAllocations.push(created);
      return res.status(201).json(created);
    }

    const result = await db.query(`CREATE $id CONTENT $data`, { id, data: payload });
    const created = result?.[0]?.result?.[0] || { id, ...payload };
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating allocation:', error);
    res.status(500).json({ error: 'Failed to create allocation', message: error.message });
  }
});

// Update allocation
app.put('/api/allocations/:allocationId', async (req, res) => {
  try {
    const { allocationId } = req.params;
    const updates = { ...(req.body || {}) };
  if (!dbReady) {
      const idx = mockAllocations.findIndex(a => a.id === `hardware_allocation:${allocationId}` || a.id === allocationId);
      if (idx === -1) return res.status(404).json({ error: 'Allocation not found' });
      mockAllocations[idx] = { ...mockAllocations[idx], ...updates };
      return res.json(mockAllocations[idx]);
    }
    const result = await db.query(`UPDATE $id MERGE $updates`, { id: allocationId.includes('hardware_allocation:') ? allocationId : `hardware_allocation:${allocationId}`, updates });
    const updated = result?.[0]?.result?.[0];
    if (!updated) return res.status(404).json({ error: 'Allocation not found' });
    res.json(updated);
  } catch (error) {
    console.error('Error updating allocation:', error);
    res.status(500).json({ error: 'Failed to update allocation', message: error.message });
  }
});

// Delete allocation
app.delete('/api/allocations/:allocationId', async (req, res) => {
  try {
    const { allocationId } = req.params;
  if (!dbReady) {
      const before = mockAllocations.length;
      mockAllocations = mockAllocations.filter(a => a.id !== `hardware_allocation:${allocationId}` && a.id !== allocationId);
      if (mockAllocations.length === before) return res.status(404).json({ error: 'Allocation not found' });
      return res.json({ message: 'Allocation deleted' });
    }
    const result = await db.query(`DELETE $id`, { id: allocationId.includes('hardware_allocation:') ? allocationId : `hardware_allocation:${allocationId}` });
    if (!result?.[0] || (Array.isArray(result[0].result) && result[0].result.length === 0)) {
      return res.status(404).json({ error: 'Allocation not found' });
    }
    res.json({ message: 'Allocation deleted' });
  } catch (error) {
    console.error('Error deleting allocation:', error);
    res.status(500).json({ error: 'Failed to delete allocation', message: error.message });
  }
});

// =============================================================================
// LOCAL USERS ENDPOINTS (Stage 1)
// =============================================================================

// List users
app.get('/api/users', async (_req, res) => {
  try {
  if (!dbReady) return res.json(mockUsers);
    const result = await db.query(`SELECT * FROM local_user ORDER BY created_at DESC`);
    res.json(result?.[0]?.result || []);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users', message: error.message });
  }
});

// Create user
app.post('/api/users', async (req, res) => {
  try {
    const { email, roles = [], active = true } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Validation error', message: 'email is required' });
    const id = `local_user:${email.toLowerCase()}`;
    const payload = { id, email, roles, active, created_at: new Date().toISOString() };
  if (!dbReady) { mockUsers.push(payload); return res.status(201).json(payload); }
    const result = await db.query(`CREATE $id CONTENT $data`, { id, data: payload });
    res.status(201).json(result?.[0]?.result?.[0] || payload);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user', message: error.message });
  }
});

// Update user
app.put('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body || {};
  if (!dbReady) {
      const idx = mockUsers.findIndex(u => u.id === `local_user:${userId}` || u.id === userId);
      if (idx === -1) return res.status(404).json({ error: 'User not found' });
      mockUsers[idx] = { ...mockUsers[idx], ...updates };
      return res.json(mockUsers[idx]);
    }
    const result = await db.query(`UPDATE $id MERGE $updates`, { id: userId.includes('local_user:') ? userId : `local_user:${userId}`, updates });
    const updated = result?.[0]?.result?.[0];
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user', message: error.message });
  }
});

// Delete user
app.delete('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
  if (!dbReady) {
      const before = mockUsers.length;
      mockUsers = mockUsers.filter(u => u.id !== `local_user:${userId}` && u.id !== userId);
      if (mockUsers.length === before) return res.status(404).json({ error: 'User not found' });
      return res.json({ message: 'User deleted' });
    }
    const result = await db.query(`DELETE $id`, { id: userId.includes('local_user:') ? userId : `local_user:${userId}` });
    if (!result?.[0] || (Array.isArray(result[0].result) && result[0].result.length === 0)) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user', message: error.message });
  }
});

// Start the server
app.listen(PORT, async () => {
  console.log('🚀 LCM Designer Server starting...');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`� Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Status: http://localhost:${PORT}/api/status`);
  
  // Initialize database connection
  await initDatabase();
  
  console.log('🎯 Server initialization complete!');
  console.log('');
  console.log('📋 Available endpoints:');
  console.log('  GET    /health                     - Health check');
  console.log('  GET    /api/status                 - API status');
  console.log('  GET    /api/projects               - List all projects');
  console.log('  POST   /api/projects               - Create new project');
  console.log('  GET    /api/projects/:id           - Get project by ID');
  console.log('  PUT    /api/projects/:id           - Update project');
  console.log('  DELETE /api/projects/:id           - Delete project');
  console.log('  GET    /api/projects/:id/workflows - Get project workflows');
  console.log('  GET    /api/projects/:id/activities    - List activities');
  console.log('  POST   /api/projects/:id/activities    - Create activity');
  console.log('  PUT    /api/activities/:activityId     - Update activity');
  console.log('  DELETE /api/activities/:activityId     - Delete activity');
  console.log('  GET    /api/projects/:id/allocations   - List allocations');
  console.log('  POST   /api/projects/:id/allocations   - Create allocation');
  console.log('  GET    /api/activities/:id/allocations - List allocations by activity');
  console.log('  PUT    /api/allocations/:allocationId  - Update allocation');
  console.log('  DELETE /api/allocations/:allocationId  - Delete allocation');
  console.log('  GET    /api/users                      - List users');
  console.log('  POST   /api/users                      - Create user');
  console.log('  PUT    /api/users/:userId              - Update user');
  console.log('  DELETE /api/users/:userId              - Delete user');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  if (db) {
    await db.close();
    console.log('✅ Database connection closed');
  }
  process.exit(0);
});
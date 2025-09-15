const express = require('express');
const cors = require('cors');
const { Surreal } = require('surrealdb');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize SurrealDB connection
let db;

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
    
    // Initialize schema if needed
    await initializeSchema();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('⚠️  Continuing without database connection...');
    console.log('📝 Make sure SurrealDB is running: surreal start --log trace --user root --pass root');
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
}

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'LCM Designer Server is running',
    database: db ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Basic API status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'running',
    timestamp: new Date().toISOString(),
    service: 'LCM Designer Backend',
    database: db ? 'connected' : 'disconnected'
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

// Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    if (!db) {
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
    
    if (!db) {
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
    if (!db) {
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
    if (!db) {
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
    if (!db) {
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
import React, { useState } from 'react';
import { Plus, Calendar, User, FolderOpen, Search, Grid, List } from 'lucide-react';

const ProjectsViewTest: React.FC = () => {
  const [projects] = useState([
    { id: '1', name: 'Test Project 1', description: 'A test project', owner_id: 'user:admin' },
    { id: '2', name: 'Test Project 2', description: 'Another test project', owner_id: 'user:admin' }
  ]);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div style={{ padding: '20px', color: 'black', backgroundColor: 'white', minHeight: '100vh' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Projects</h1>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              padding: '10px', 
              border: '1px solid #ccc', 
              borderRadius: '4px',
              flex: 1
            }}
          />
          <button style={{ padding: '10px 20px', backgroundColor: '#0066CC', color: 'white', border: 'none', borderRadius: '4px' }}>
            <Plus size={16} style={{ marginRight: '5px' }} />
            New Project
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            onClick={() => setViewMode('grid')}
            style={{ 
              padding: '8px 12px', 
              backgroundColor: viewMode === 'grid' ? '#0066CC' : '#f0f0f0',
              color: viewMode === 'grid' ? 'white' : 'black',
              border: 'none', 
              borderRadius: '4px' 
            }}
          >
            <Grid size={16} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            style={{ 
              padding: '8px 12px', 
              backgroundColor: viewMode === 'list' ? '#0066CC' : '#f0f0f0',
              color: viewMode === 'list' ? 'white' : 'black',
              border: 'none', 
              borderRadius: '4px' 
            }}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {loading && <div>Loading projects...</div>}
      {error && <div style={{ color: 'red', padding: '10px', backgroundColor: '#ffe6e6', border: '1px solid #ff0000', borderRadius: '4px' }}>{error}</div>}

      <div style={{ 
        display: viewMode === 'grid' ? 'grid' : 'flex',
        flexDirection: viewMode === 'list' ? 'column' : undefined,
        gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : undefined,
        gap: '20px' 
      }}>
        {projects.map((project) => (
          <div 
            key={project.id} 
            style={{ 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '20px',
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <FolderOpen size={20} style={{ marginRight: '10px', color: '#0066CC' }} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{project.name}</h3>
            </div>
            <p style={{ color: '#666', marginBottom: '10px' }}>{project.description}</p>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#888' }}>
              <User size={14} style={{ marginRight: '5px' }} />
              <span style={{ marginRight: '15px' }}>{project.owner_id}</span>
              <Calendar size={14} style={{ marginRight: '5px' }} />
              <span>Created recently</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectsViewTest;

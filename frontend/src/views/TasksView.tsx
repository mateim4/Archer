import React, { useState, useEffect } from 'react';
import GlassmorphicLayout from '../components/GlassmorphicLayout';
import { 
  PurpleGlassCard, 
  PurpleGlassButton, 
  PurpleGlassInput, 
  PurpleGlassDropdown
} from '../components/ui';
import { 
  AddRegular, 
  FilterRegular, 
  SearchRegular,
  CheckmarkCircleRegular,
  WarningRegular,
  ErrorCircleRegular,
  ClockRegular
} from '@fluentui/react-icons';
import { apiClient, Ticket } from '../utils/apiClient';

const TasksView: React.FC = () => {
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [tasks, setTasks] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getTickets();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'P1': return <ErrorCircleRegular style={{ color: '#ef4444' }} />;
      case 'P2': return <WarningRegular style={{ color: '#f59e0b' }} />;
      case 'P3': return <ClockRegular style={{ color: '#3b82f6' }} />;
      default: return <CheckmarkCircleRegular style={{ color: '#10b981' }} />;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(filter.toLowerCase()) || 
                          task.id.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter === 'All' || 
                          (statusFilter === 'Resolved' ? ['RESOLVED', 'CLOSED'].includes(task.status) : task.status === statusFilter.toUpperCase().replace(' ', '_'));
    return matchesSearch && matchesStatus;
  });

  return (
    <GlassmorphicLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Tasks</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Manage Incidents, Changes, and Problems</p>
          </div>
          <PurpleGlassButton 
            variant="primary" 
            icon={<AddRegular />}
            glass
            onClick={() => {/* TODO: Open Create Modal */}}
          >
            New Ticket
          </PurpleGlassButton>
        </div>

        {/* Filters */}
        <PurpleGlassCard glass className="p-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <PurpleGlassInput 
                label="Search" 
                placeholder="Search tasks..." 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                prefixIcon={<SearchRegular />}
                glass="medium"
              />
            </div>
            <div className="w-48">
              <PurpleGlassDropdown
                label="Status"
                options={[
                  { value: 'All', label: 'All Statuses' },
                  { value: 'New', label: 'New' },
                  { value: 'In Progress', label: 'In Progress' },
                  { value: 'Resolved', label: 'Resolved' }
                ]}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as string)}
                glass="medium"
              />
            </div>
            <PurpleGlassButton variant="secondary" icon={<FilterRegular />}>
              More Filters
            </PurpleGlassButton>
          </div>
        </PurpleGlassCard>

        {/* Kanban / List Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Column: New */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              New / Open
            </h3>
            {filteredTasks.filter(t => t.status === 'NEW').map(task => (
              <TaskCard key={task.id} task={task} getPriorityIcon={getPriorityIcon} />
            ))}
          </div>

          {/* Column: In Progress */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              In Progress
            </h3>
            {filteredTasks.filter(t => t.status === 'IN_PROGRESS').map(task => (
              <TaskCard key={task.id} task={task} getPriorityIcon={getPriorityIcon} />
            ))}
          </div>

          {/* Column: Done */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              Resolved / Closed
            </h3>
            {filteredTasks.filter(t => ['RESOLVED', 'CLOSED'].includes(t.status)).map(task => (
              <TaskCard key={task.id} task={task} getPriorityIcon={getPriorityIcon} />
            ))}
          </div>
        </div>
      </div>
    </GlassmorphicLayout>
  );
};

const TaskCard = ({ task, getPriorityIcon }: { task: Ticket, getPriorityIcon: (p: string) => React.ReactNode }) => (
  <PurpleGlassCard 
    variant="interactive" 
    glass
    className="cursor-pointer hover:translate-y-[-2px] transition-transform"
  >
    <div className="flex justify-between items-start mb-2">
      <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.1)' }}>
        {task.id}
      </span>
      <span className={`text-xs px-2 py-0.5 rounded-full border ${
        task.type === 'INCIDENT' ? 'border-red-500/50 text-red-200' :
        task.type === 'CHANGE' ? 'border-purple-500/50 text-purple-200' :
        'border-blue-500/50 text-blue-200'
      }`}>
        {task.type}
      </span>
    </div>
    <h4 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>{task.title}</h4>
    <div className="flex justify-between items-center text-xs" style={{ color: 'var(--text-secondary)' }}>
      <div className="flex items-center gap-1">
        {getPriorityIcon(task.priority)}
        <span>{task.priority}</span>
      </div>
      <span>{task.assignee || 'Unassigned'}</span>
    </div>
  </PurpleGlassCard>
);

export default TasksView;

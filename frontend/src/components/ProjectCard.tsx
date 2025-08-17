import React from 'react';
import { 
  CalendarRegular,
  PersonRegular,
  CheckmarkCircleRegular,
  ClockRegular,
  PauseRegular,
  PlayRegular,
  MoreHorizontalRegular
} from '@fluentui/react-icons';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  activities_count: number;
  completed_activities: number;
  assignees: string[];
  start_date: Date;
  end_date: Date;
  created_at: Date;
  budget?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

interface ProjectCardProps {
  project: Project;
  onClick: (projectId: string) => void;
  onEdit: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onDuplicate?: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  onClick, 
  onEdit, 
  onDelete, 
  onDuplicate 
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': 
        return <CheckmarkCircleRegular style={{ color: '#10b981', fontSize: '18px' }} />;
      case 'in_progress': 
        return <PlayRegular style={{ color: '#3b82f6', fontSize: '18px' }} />;
      case 'on_hold': 
        return <PauseRegular style={{ color: '#f59e0b', fontSize: '18px' }} />;
      case 'planning':
      default: 
        return <ClockRegular style={{ color: '#6b7280', fontSize: '18px' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#3b82f6';
      case 'on_hold': return '#f59e0b';
      case 'planning':
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getProgressPercentage = () => {
    if (project.activities_count === 0) return 0;
    return Math.round((project.completed_activities / project.activities_count) * 100);
  };

  const getDaysRemaining = () => {
    const today = new Date();
    const endDate = new Date(project.end_date);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isOverdue = () => {
    const today = new Date();
    const endDate = new Date(project.end_date);
    return today > endDate && project.status !== 'completed';
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent card click when clicking action buttons
    if ((e.target as HTMLElement).closest('.action-button')) {
      return;
    }
    onClick(project.id);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Show context menu or dropdown
  };

  return (
    <div 
      className="lcm-card project-card" 
      style={{ 
        padding: '24px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(18px) saturate(180%)',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '240px',
        display: 'flex',
        flexDirection: 'column'
      }}
      onClick={handleCardClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 48px rgba(139, 92, 246, 0.25)';
        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
      }}
    >
      {/* Priority Indicator */}
      {project.priority && project.priority !== 'low' && (
        <div style={{
          position: 'absolute',
          top: '0',
          right: '0',
          width: '0',
          height: '0',
          borderLeft: '20px solid transparent',
          borderTop: `20px solid ${getPriorityColor(project.priority)}`,
          zIndex: 1
        }} />
      )}

      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: '16px' 
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#111827',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {project.name}
          </h3>
          <p style={{ 
            margin: '0', 
            fontSize: '14px', 
            color: '#6b7280', 
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {project.description}
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
          {/* Status Badge */}
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            borderRadius: '8px',
            background: `${getStatusColor(project.status)}15`,
            border: `1px solid ${getStatusColor(project.status)}30`
          }}>
            {getStatusIcon(project.status)}
            <span style={{ 
              fontSize: '12px', 
              fontWeight: '600',
              color: getStatusColor(project.status),
              textTransform: 'capitalize'
            }}>
              {project.status.replace('_', ' ')}
            </span>
          </div>

          {/* Menu Button */}
          <button
            className="action-button"
            onClick={handleMenuClick}
            style={{
              background: 'rgba(107, 114, 128, 0.1)',
              border: '1px solid rgba(107, 114, 128, 0.2)',
              borderRadius: '6px',
              padding: '6px',
              cursor: 'pointer',
              color: '#6b7280',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(107, 114, 128, 0.2)';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(107, 114, 128, 0.1)';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <MoreHorizontalRegular style={{ fontSize: '16px' }} />
          </button>
        </div>
      </div>

      {/* Progress Section */}
      <div style={{ marginBottom: '20px', flex: 1 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '8px' 
        }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
            Progress
          </span>
          <span style={{ 
            fontSize: '14px', 
            fontWeight: '700', 
            color: '#111827',
            background: 'rgba(139, 92, 246, 0.1)',
            padding: '2px 8px',
            borderRadius: '12px'
          }}>
            {getProgressPercentage()}%
          </span>
        </div>
        
        {/* Progress Bar */}
        <div style={{ 
          width: '100%', 
          height: '8px', 
          background: 'rgba(139, 92, 246, 0.1)', 
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '8px'
        }}>
          <div style={{
            width: `${getProgressPercentage()}%`,
            height: '100%',
            background: project.status === 'completed' 
              ? 'linear-gradient(90deg, #10b981, #059669)'
              : 'linear-gradient(90deg, #8b5cf6, #a855f7)',
            borderRadius: '4px',
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }} />
        </div>

        {/* Activity Stats */}
        <div style={{ 
          fontSize: '13px', 
          color: '#6b7280',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>
            {project.completed_activities} of {project.activities_count} activities completed
          </span>
          {project.activities_count > 0 && (
            <span style={{ 
              color: getProgressPercentage() === 100 ? '#10b981' : '#8b5cf6',
              fontWeight: '600'
            }}>
              {project.activities_count - project.completed_activities} remaining
            </span>
          )}
        </div>
      </div>

      {/* Timeline & Team Info */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '16px',
        marginBottom: '16px'
      }}>
        <div>
          <div style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            color: '#6b7280', 
            textTransform: 'uppercase',
            marginBottom: '4px'
          }}>
            Timeline
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <CalendarRegular style={{ fontSize: '12px', color: '#6b7280' }} />
            {new Date(project.end_date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
          {isOverdue() && (
            <div style={{ 
              fontSize: '11px', 
              color: '#ef4444', 
              fontWeight: '600',
              marginTop: '2px'
            }}>
              Overdue by {Math.abs(getDaysRemaining())} days
            </div>
          )}
          {!isOverdue() && getDaysRemaining() > 0 && (
            <div style={{ 
              fontSize: '11px', 
              color: getDaysRemaining() <= 7 ? '#f59e0b' : '#6b7280',
              marginTop: '2px'
            }}>
              {getDaysRemaining()} days remaining
            </div>
          )}
        </div>

        <div>
          <div style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            color: '#6b7280', 
            textTransform: 'uppercase',
            marginBottom: '4px'
          }}>
            Team
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <PersonRegular style={{ fontSize: '12px', color: '#6b7280' }} />
            {project.assignees.length > 0 ? (
              <>
                {project.assignees.slice(0, 2).join(', ')}
                {project.assignees.length > 2 && (
                  <span style={{ 
                    color: '#8b5cf6', 
                    fontWeight: '600',
                    fontSize: '11px'
                  }}>
                    +{project.assignees.length - 2} more
                  </span>
                )}
              </>
            ) : (
              <span style={{ color: '#6b7280', fontStyle: 'italic' }}>
                Unassigned
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Budget Info (if available) */}
      {project.budget && (
        <div style={{ 
          padding: '12px',
          background: 'rgba(139, 92, 246, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(139, 92, 246, 0.1)',
          marginBottom: '12px'
        }}>
          <div style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            color: '#6b7280', 
            textTransform: 'uppercase',
            marginBottom: '4px'
          }}>
            Budget
          </div>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: '700', 
            color: '#8b5cf6'
          }}>
            ${project.budget.toLocaleString()}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        fontSize: '12px', 
        color: '#9ca3af',
        paddingTop: '12px',
        borderTop: '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        <span>
          Created {new Date(project.created_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })}
        </span>
        {project.priority && (
          <span style={{ 
            color: getPriorityColor(project.priority),
            fontWeight: '600',
            textTransform: 'capitalize'
          }}>
            {project.priority} Priority
          </span>
        )}
      </div>

      {/* Hover Actions */}
      <div 
        className="card-actions"
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          display: 'flex',
          gap: '8px',
          opacity: 0,
          transform: 'translateY(10px)',
          transition: 'all 0.2s ease',
          pointerEvents: 'none'
        }}
        onMouseEnter={() => {
          const actions = document.querySelector('.card-actions') as HTMLElement;
          if (actions) {
            actions.style.opacity = '1';
            actions.style.transform = 'translateY(0)';
            actions.style.pointerEvents = 'auto';
          }
        }}
      >
        <button
          className="action-button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(project.id);
          }}
          style={{
            padding: '6px',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '6px',
            color: '#8b5cf6',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.2s ease'
          }}
        >
          Edit
        </button>
        
        {onDuplicate && (
          <button
            className="action-button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(project.id);
            }}
            style={{
              padding: '6px',
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '6px',
              color: '#3b82f6',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s ease'
            }}
          >
            Duplicate
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
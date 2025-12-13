/**
 * TicketDetailView Component
 * 
 * Full-page ticket detail view with split layout design.
 * Left panel: Main content (title, description, comments)
 * Right panel: Metadata (status, priority, assignee, SLA, linked assets)
 * 
 * Part of Phase 3: Page Redesigns - Ticket Detail View
 * Spec Reference: UI UX Specification Sheet - Section 6.3 Ticket Detail
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftRegular,
  EditRegular,
  MoreHorizontalRegular,
  SendRegular,
  AttachRegular,
  PersonRegular,
  CalendarRegular,
  TagRegular,
  LinkRegular,
  ClockRegular,
  HistoryRegular,
  CommentRegular,
  CheckmarkCircleRegular,
  WarningRegular,
  ErrorCircleRegular,
  AlertRegular,
  CubeRegular,
  DesktopRegular,
  ServerRegular,
  DeleteRegular,
  ShareRegular,
  BookmarkRegular,
  LockClosedRegular,
  TicketDiagonalRegular,
} from '@fluentui/react-icons';
import {
  PurpleGlassCard,
  PurpleGlassButton,
  PurpleGlassInput,
  PurpleGlassTextarea,
  PurpleGlassDropdown,
  SLAIndicator,
  LinkedAssetBadge,
  PageHeader,
  PurpleGlassEmptyState,
} from '../components/ui';
import { RelationshipBadge } from '../components/RelationshipBadge';
import { RelationshipManager } from '../components/RelationshipManager';
import { TicketHierarchyView } from '../components/TicketHierarchyView';
import type { AssetType, AssetStatus, SLAStatus } from '../components/ui';
import { DesignTokens } from '../styles/designSystem';
import { apiClient, type TicketComment, type CommentType, type TicketAttachment, type TicketRelationship, type TicketHierarchyNode } from '../utils/apiClient';

// Extended ticket interface with all detail fields (standalone, not extending base Ticket)
interface TicketDetail {
  id: string;
  title: string;
  ticket_type: 'INCIDENT' | 'PROBLEM' | 'CHANGE' | 'SERVICE_REQUEST';
  description: string;
  status: 'NEW' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  reporter: string;
  reporter_email?: string;
  assignee?: string;
  assignee_avatar?: string;
  team?: string;
  category?: string;
  subcategory?: string;
  impact?: 'low' | 'medium' | 'high' | 'critical';
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  slaStatus?: SLAStatus;
  slaTimeRemaining?: string;
  slaDueDate?: string;
  created_at: string;
  updated_at: string;
  linkedAssets?: Array<{
    id: string;
    name: string;
    type: AssetType;
    status: AssetStatus;
  }>;
  relatedTickets?: Array<{
    id: string;
    title: string;
    status: string;
    type: 'related' | 'parent' | 'child' | 'duplicate';
  }>;
  labels?: string[];
  watchers?: string[];
  attachments?: Array<{
    id: string;
    name: string;
    size: string;
    uploadedAt: string;
    uploadedBy: string;
  }>;
  comments?: Array<{
    id: string;
    author: string;
    authorAvatar?: string;
    content: string;
    createdAt: string;
    isInternal?: boolean;
  }>;
  activityLog?: Array<{
    id: string;
    type: 'status_change' | 'assignment' | 'comment' | 'field_update' | 'attachment';
    user: string;
    description: string;
    timestamp: string;
    oldValue?: string;
    newValue?: string;
  }>;
}

// Mock data for demonstration
const mockTicketDetail: TicketDetail = {
  id: 'INC-2024-001',
  title: 'Production Database Connection Pool Exhaustion',
  description: `## Issue Summary
The production PostgreSQL database is experiencing connection pool exhaustion during peak hours, causing application timeouts and user-facing errors.

## Impact
- ~500 users affected
- Revenue impact estimated at $5,000/hour
- Customer complaints escalating

## Steps to Reproduce
1. Monitor connection pool during 9 AM - 11 AM EST
2. Observe pool saturation at 100 connections
3. New requests queue and eventually timeout

## Technical Details
- Database: PostgreSQL 14.2
- Connection Pool: PgBouncer
- Current max connections: 100
- Peak concurrent connections: 150+

## Attempted Remediation
- Increased max_connections temporarily
- Identified potential connection leak in reporting service`,
  ticket_type: 'INCIDENT',
  status: 'IN_PROGRESS',
  priority: 'P1',
  reporter: 'Alice Chen',
  reporter_email: 'alice.chen@company.com',
  assignee: 'Bob Martinez',
  assignee_avatar: undefined,
  team: 'Database Operations',
  category: 'Database',
  subcategory: 'Performance',
  impact: 'high',
  urgency: 'critical',
  slaStatus: 'at_risk',
  slaTimeRemaining: '1h 23m',
  slaDueDate: '2024-12-04T15:00:00Z',
  created_at: '2024-12-04T08:30:00Z',
  updated_at: '2024-12-04T12:15:00Z',
  linkedAssets: [
    { id: 'db-prod-01', name: 'db-prod-primary', type: 'HOST', status: 'critical' },
    { id: 'db-prod-02', name: 'db-prod-replica', type: 'HOST', status: 'warning' },
    { id: 'svc-api', name: 'api-gateway-service', type: 'NETWORK', status: 'warning' },
  ],
  relatedTickets: [
    { id: 'INC-2024-002', title: 'API Gateway Latency Spike', status: 'OPEN', type: 'related' },
    { id: 'CHG-2024-015', title: 'Increase DB Connection Pool', status: 'PENDING', type: 'related' },
  ],
  labels: ['database', 'production', 'performance', 'critical-path'],
  watchers: ['carol.davis@company.com', 'dave.wilson@company.com'],
  attachments: [
    { id: 'att-1', name: 'connection_pool_metrics.png', size: '245 KB', uploadedAt: '2024-12-04T09:00:00Z', uploadedBy: 'Alice Chen' },
    { id: 'att-2', name: 'pgbouncer_config.txt', size: '2 KB', uploadedAt: '2024-12-04T09:15:00Z', uploadedBy: 'Alice Chen' },
  ],
  comments: [
    {
      id: 'cmt-1',
      author: 'Alice Chen',
      content: 'Initial investigation complete. Connection leak identified in the reporting service. Working with the dev team to deploy a fix.',
      createdAt: '2024-12-04T09:30:00Z',
      isInternal: false,
    },
    {
      id: 'cmt-2',
      author: 'Bob Martinez',
      content: 'Escalating to P1 due to revenue impact. Implementing temporary workaround by increasing max_connections to 200.',
      createdAt: '2024-12-04T10:00:00Z',
      isInternal: true,
    },
    {
      id: 'cmt-3',
      author: 'Carol Davis',
      content: 'Dev team has identified the leak in the reporting batch job. Fix deployed to staging, testing now.',
      createdAt: '2024-12-04T11:30:00Z',
      isInternal: false,
    },
  ],
  activityLog: [
    { id: 'act-1', type: 'status_change', user: 'Alice Chen', description: 'Created ticket', timestamp: '2024-12-04T08:30:00Z' },
    { id: 'act-2', type: 'assignment', user: 'System', description: 'Auto-assigned to Database Operations team', timestamp: '2024-12-04T08:31:00Z' },
    { id: 'act-3', type: 'status_change', user: 'Bob Martinez', description: 'Changed status', timestamp: '2024-12-04T09:00:00Z', oldValue: 'NEW', newValue: 'IN_PROGRESS' },
    { id: 'act-4', type: 'field_update', user: 'Bob Martinez', description: 'Updated priority', timestamp: '2024-12-04T10:00:00Z', oldValue: 'P2', newValue: 'P1' },
    { id: 'act-5', type: 'comment', user: 'Carol Davis', description: 'Added comment', timestamp: '2024-12-04T11:30:00Z' },
  ],
};

const TicketDetailView: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [relationships, setRelationships] = useState<TicketRelationship[]>([]);
  const [hierarchyTree, setHierarchyTree] = useState<TicketHierarchyNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [isLoadingRelationships, setIsLoadingRelationships] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'activity' | 'related' | 'hierarchy'>('comments');
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [commentType, setCommentType] = useState<CommentType>('NOTE');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showRelationshipManager, setShowRelationshipManager] = useState(false);

  // Relationship handlers
  const handleDeleteRelationship = async (relationshipId: string) => {
    if (!ticketId) return;
    try {
      await apiClient.deleteTicketRelationship(ticketId, relationshipId);
      setRelationships(prev => prev.filter(r => r.id !== relationshipId));
    } catch (error) {
      console.error('Failed to delete relationship:', error);
    }
  };

  const handleRelationshipCreated = () => {
    // Reload relationships after creation
    if (ticketId) {
      loadRelationships(ticketId);
    }
  };

  const loadRelationships = async (id: string) => {
    setIsLoadingRelationships(true);
    try {
      const data = await apiClient.getTicketRelationships(id);
      setRelationships(data || []);
    } catch (error) {
      console.error('Failed to load relationships:', error);
      setRelationships([]);
    } finally {
      setIsLoadingRelationships(false);
    }
  };

  // Load ticket data and comments
  useEffect(() => {
    const loadTicket = async () => {
      if (!ticketId) return;
      
      setIsLoading(true);
      try {
        // Try to fetch from API first, fall back to mock data
        try {
          const ticketData = await apiClient.getTicket(ticketId);
          // Map API response to TicketDetail format
          setTicket({
            id: ticketData.id,
            title: ticketData.title,
            ticket_type: ticketData.ticket_type,
            description: ticketData.description || '',
            status: ticketData.status,
            priority: ticketData.priority,
            reporter: ticketData.created_by,
            assignee: ticketData.assignee,
            created_at: ticketData.created_at,
            updated_at: ticketData.updated_at,
          });
          setEditedTitle(ticketData.title);
        } catch {
          // Fall back to mock data for development
          await new Promise(resolve => setTimeout(resolve, 500));
          setTicket(mockTicketDetail);
          setEditedTitle(mockTicketDetail.title);
        }
      } catch (error) {
        console.error('Failed to load ticket:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTicket();
  }, [ticketId]);

  // Load comments separately
  useEffect(() => {
    const loadComments = async () => {
      if (!ticketId) return;
      
      setIsLoadingComments(true);
      try {
        const response = await apiClient.getTicketComments(ticketId);
        setComments(response.data || []);
      } catch (error) {
        console.error('Failed to load comments:', error);
        // Fall back to mock comments
        setComments([]);
      } finally {
        setIsLoadingComments(false);
      }
    };
    loadComments();
  }, [ticketId]);

  // Load attachments separately
  useEffect(() => {
    const loadAttachments = async () => {
      if (!ticketId) return;
      
      setIsLoadingAttachments(true);
      try {
        const response = await apiClient.getTicketAttachments(ticketId);
        setAttachments(response.data || []);
      } catch (error) {
        console.error('Failed to load attachments:', error);
        setAttachments([]);
      } finally {
        setIsLoadingAttachments(false);
      }
    };
    loadAttachments();
  }, [ticketId]);

  const handleAddComment = useCallback(async () => {
    if (!newComment.trim() || !ticket || !ticketId) return;
    
    setIsSubmittingComment(true);
    try {
      const newCommentData = await apiClient.addTicketComment(ticketId, {
        content: newComment,
        is_internal: isInternalComment,
        comment_type: commentType,
      });
      
      // Add to local state
      setComments(prev => [...prev, newCommentData]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
      // Optimistic update for development
      const localComment: TicketComment = {
        id: `cmt-${Date.now()}`,
        ticket_id: ticketId,
        author_id: 'current_user',
        author_name: 'Current User',
        content: newComment,
        is_internal: isInternalComment,
        comment_type: commentType,
        attachments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setComments(prev => [...prev, localComment]);
      setNewComment('');
    } finally {
      setIsSubmittingComment(false);
    }
  }, [newComment, isInternalComment, commentType, ticket, ticketId]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (!ticketId) return;
    
    try {
      await apiClient.deleteTicketComment(ticketId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  }, [ticketId]);

  const handleSaveTitle = useCallback(() => {
    if (!ticket || !editedTitle.trim()) return;
    setTicket(prev => prev ? { ...prev, title: editedTitle } : null);
    setIsEditingTitle(false);
  }, [editedTitle, ticket]);

  // Attachment handlers
  const handleFileUpload = useCallback(async (file: File) => {
    if (!ticketId) return;

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size exceeds 10MB limit');
      return;
    }

    setIsUploadingFile(true);
    try {
      const newAttachment = await apiClient.uploadTicketAttachment(ticketId, file);
      setAttachments(prev => [...prev, newAttachment]);
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploadingFile(false);
    }
  }, [ticketId]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleDownloadAttachment = useCallback(async (attachmentId: string) => {
    if (!ticketId) return;

    try {
      const { blob, filename } = await apiClient.downloadTicketAttachment(ticketId, attachmentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download attachment:', error);
      alert('Failed to download file');
    }
  }, [ticketId]);

  const handleDeleteAttachment = useCallback(async (attachmentId: string) => {
    if (!ticketId) return;

    if (!confirm('Are you sure you want to delete this attachment?')) return;

    try {
      await apiClient.deleteTicketAttachment(ticketId, attachmentId);
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      alert('Failed to delete attachment');
    }
  }, [ticketId]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return '📦';
    return '📎';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1': return '#ef4444';
      case 'P2': return '#f59e0b';
      case 'P3': return '#3b82f6';
      default: return '#10b981';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return '#3b82f6';
      case 'IN_PROGRESS': return '#8b5cf6';
      case 'WAITING': return '#f59e0b';
      case 'RESOLVED': return '#10b981';
      case 'CLOSED': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'CLUSTER': return <CubeRegular />;
      case 'HOST': return <ServerRegular />;
      case 'VM': return <DesktopRegular />;
      case 'SERVICE': return <AlertRegular />;
      default: return <ServerRegular />;
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <PurpleGlassCard glass>
          <PurpleGlassEmptyState
            icon={<ErrorCircleRegular />}
            title="Ticket Not Found"
            description="The ticket you're looking for doesn't exist or has been deleted."
            action={{
              label: 'Back to Service Desk',
              onClick: () => navigate('/app/service-desk'),
              icon: <ArrowLeftRegular />,
            }}
          />
        </PurpleGlassCard>
      </div>
    );
  }

  // Styles
  const containerStyle: React.CSSProperties = {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  };

  const splitLayoutStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 360px',
    gap: '24px',
    alignItems: 'start',
  };

  const mainPanelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  };

  const sidePanelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    position: 'sticky',
    top: '84px', // Account for top nav + some padding
  };

  const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    color: 'var(--text-muted)',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const metadataRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid var(--divider-color)',
  };

  const metadataLabelStyle: React.CSSProperties = {
    color: 'var(--text-muted)',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const metadataValueStyle: React.CSSProperties = {
    color: 'var(--text-primary)',
    fontSize: '14px',
    fontWeight: 500,
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '12px 16px',
    background: isActive ? 'var(--btn-secondary-bg)' : 'transparent',
    border: 'none',
    borderBottom: isActive ? '2px solid var(--brand-primary)' : '2px solid transparent',
    color: isActive ? 'var(--brand-primary)' : 'var(--text-muted)',
    fontSize: '14px',
    fontWeight: isActive ? 600 : 500,
    cursor: 'pointer',
    transition: 'all 150ms ease',
  });

  const commentStyle = (isInternal: boolean): React.CSSProperties => ({
    padding: '16px',
    background: isInternal 
      ? 'rgba(251, 191, 36, 0.1)'
      : 'var(--card-bg)',
    borderRadius: '12px',
    borderLeft: isInternal ? '3px solid var(--status-warning)' : 'none',
  });

  const activityItemStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    padding: '12px 0',
    borderBottom: '1px solid var(--divider-color-subtle)',
  };

  return (
    <div data-testid="ticket-detail-view" style={containerStyle}>
      <PageHeader
        icon={<TicketDiagonalRegular />}
        title={ticket.title}
        subtitle={`${ticket.id} • Created ${new Date(ticket.created_at).toLocaleDateString()} • ${ticket.ticket_type}`}
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
        {/* Priority badge */}
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
          {ticket.assignee && (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              color: 'var(--text-muted)',
            }}>
              <PersonRegular /> {ticket.assignee}
            </span>
          )}
        </div>
      </PageHeader>

      {/* Split Layout */}
      <div style={splitLayoutStyle}>
        {/* Main Content Panel */}
        <div style={mainPanelStyle}>
          {/* Title Section */}
          <PurpleGlassCard style={{ padding: '24px' }}>
            {isEditingTitle ? (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <PurpleGlassInput
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  style={{ flex: 1, fontSize: '20px', fontWeight: 600 }}
                  autoFocus
                />
                <PurpleGlassButton onClick={handleSaveTitle} size="small">Save</PurpleGlassButton>
                <PurpleGlassButton variant="ghost" onClick={() => setIsEditingTitle(false)} size="small">Cancel</PurpleGlassButton>
              </div>
            ) : (
              <h1 
                style={{ 
                  fontSize: '24px', 
                  fontWeight: 600, 
                  color: 'var(--text-primary)',
                  margin: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
                onClick={() => setIsEditingTitle(true)}
              >
                {ticket.title}
                <EditRegular style={{ fontSize: '16px', opacity: 0.5 }} />
              </h1>
            )}

            {/* Description */}
            <div style={{ 
              marginTop: '20px',
              color: 'var(--text-secondary)',
              fontSize: '15px',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}>
              {ticket.description}
            </div>

            {/* Labels */}
            {ticket.labels && ticket.labels.length > 0 && (
              <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {ticket.labels.map(label => (
                  <span
                    key={label}
                    style={{
                      padding: '4px 12px',
                      background: 'var(--btn-secondary-bg)',
                      color: 'var(--brand-primary)',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </PurpleGlassCard>

          {/* Tabs Section */}
          <PurpleGlassCard style={{ padding: 0, overflow: 'hidden' }}>
            {/* Tab Headers */}
            <div style={{ 
              display: 'flex', 
              borderBottom: '1px solid var(--divider-color)',
            }}>
              <button 
                style={tabStyle(activeTab === 'comments')}
                onClick={() => setActiveTab('comments')}
              >
                <CommentRegular style={{ marginRight: '8px' }} />
                Comments ({comments.length})
              </button>
              <button 
                style={tabStyle(activeTab === 'activity')}
                onClick={() => setActiveTab('activity')}
              >
                <HistoryRegular style={{ marginRight: '8px' }} />
                Activity
              </button>
              <button 
                style={tabStyle(activeTab === 'related')}
                onClick={() => setActiveTab('related')}
              >
                <LinkRegular style={{ marginRight: '8px' }} />
                Related ({relationships.length})
              </button>
              <button 
                style={tabStyle(activeTab === 'hierarchy')}
                onClick={() => setActiveTab('hierarchy')}
              >
                <CubeRegular style={{ marginRight: '8px' }} />
                Hierarchy
              </button>
            </div>

            {/* Tab Content */}
            <div style={{ padding: '20px' }}>
              {/* Comments Tab */}
              {activeTab === 'comments' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Comment Input */}
                  <div className="purple-glass-card static" style={{ 
                    padding: '16px',
                  }}>
                    <PurpleGlassTextarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
                      rows={3}
                      style={{ marginBottom: '12px' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        color: 'var(--text-muted)',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}>
                        <input 
                          type="checkbox" 
                          checked={isInternalComment}
                          onChange={(e) => setIsInternalComment(e.target.checked)}
                        />
                        Internal note (not visible to requester)
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <PurpleGlassButton variant="ghost" size="small">
                          <AttachRegular />
                        </PurpleGlassButton>
                        <PurpleGlassButton 
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || isSubmittingComment}
                        >
                          <SendRegular style={{ marginRight: '8px' }} />
                          {isSubmittingComment ? 'Sending...' : 'Send'}
                        </PurpleGlassButton>
                      </div>
                    </div>
                  </div>

                  {/* Comment List */}
                  {isLoadingComments ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                      Loading comments...
                    </div>
                  ) : comments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                      No comments yet. Be the first to comment!
                    </div>
                  ) : (
                    comments.map(comment => (
                    <div key={comment.id} style={commentStyle(comment.is_internal || false)}>
                      {comment.is_internal && (
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#fbbf24', 
                          fontWeight: 600,
                          marginBottom: '8px',
                          textTransform: 'uppercase',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}>
                          <LockClosedRegular style={{ fontSize: '12px' }} /> Internal Note
                        </div>
                      )}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                        }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6B4CE6 0%, #8B6FF0 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 600,
                          }}>
                            {comment.author_name.charAt(0)}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ 
                              fontWeight: 600, 
                              color: 'var(--text-primary)',
                            }}>
                              {comment.author_name}
                            </span>
                            {comment.comment_type !== 'NOTE' && (
                              <span style={{ 
                                fontSize: '11px', 
                                color: comment.comment_type === 'SOLUTION' ? '#10b981' : 
                                       comment.comment_type === 'WORKAROUND' ? '#f59e0b' : 
                                       'var(--text-muted)',
                                textTransform: 'uppercase',
                              }}>
                                {comment.comment_type.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ 
                            fontSize: '12px', 
                            color: 'var(--text-muted)',
                          }}>
                            {formatRelativeTime(comment.created_at)}
                          </span>
                          <PurpleGlassButton
                            variant="ghost"
                            size="small"
                            onClick={() => handleDeleteComment(comment.id)}
                            style={{ opacity: 0.6 }}
                          >
                            <DeleteRegular style={{ fontSize: '14px' }} />
                          </PurpleGlassButton>
                        </div>
                      </div>
                      <p style={{ 
                        margin: 0,
                        color: 'var(--text-secondary)',
                        fontSize: '14px',
                        lineHeight: 1.6,
                      }}>
                        {comment.content}
                      </p>
                    </div>
                  ))
                  )}
                </div>
              )}

              {/* Attachments Section - Always visible below comments */}
              {activeTab === 'comments' && (
                <PurpleGlassCard
                  header={(
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AttachRegular />
                      Attachments ({attachments.length})
                    </span>
                  )}
                  style={{ marginTop: '24px' }}
                  glass
                >
                  {/* File Upload Zone */}
                  <div
                    className="purple-glass-card static"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{ 
                      padding: '24px',
                      textAlign: 'center',
                      border: isDragging ? '2px dashed var(--brand-primary)' : '2px dashed var(--border-light)',
                      background: isDragging ? 'var(--surface-card-light)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <AttachRegular style={{ fontSize: '32px', color: 'var(--brand-primary)', marginBottom: '8px' }} />
                    <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '14px' }}>
                      {isUploadingFile ? 'Uploading...' : 'Drop files here or click to browse'}
                    </p>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                      Maximum file size: 10MB
                    </p>
                    <input 
                      id="file-input"
                      type="file" 
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                      disabled={isUploadingFile}
                    />
                  </div>

                  {/* Attachments List */}
                  {isLoadingAttachments ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                      Loading attachments...
                    </div>
                  ) : attachments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                      No attachments yet
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {attachments.map(attachment => (
                        <div 
                          key={attachment.id}
                          className="purple-glass-card"
                          style={{ 
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                          }}
                        >
                          <span style={{ fontSize: '24px' }}>
                            {getFileIcon(attachment.mime_type)}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              color: 'var(--text-primary)',
                              fontSize: '14px',
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {attachment.original_filename}
                            </div>
                            <div style={{ 
                              color: 'var(--text-muted)',
                              fontSize: '12px',
                              marginTop: '2px',
                            }}>
                              {formatFileSize(attachment.size_bytes)} • {formatDate(attachment.uploaded_at)}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <PurpleGlassButton
                              variant="ghost"
                              size="small"
                              onClick={() => handleDownloadAttachment(attachment.id)}
                              title="Download"
                            >
                              📥
                            </PurpleGlassButton>
                            <PurpleGlassButton
                              variant="ghost"
                              size="small"
                              onClick={() => handleDeleteAttachment(attachment.id)}
                              title="Delete"
                              style={{ opacity: 0.6 }}
                            >
                              <DeleteRegular style={{ fontSize: '14px' }} />
                            </PurpleGlassButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </PurpleGlassCard>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div>
                  {ticket.activityLog?.map(activity => (
                    <div key={activity.id} style={activityItemStyle}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#6B4CE6',
                        marginTop: '6px',
                        flexShrink: 0,
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                        }}>
                          <strong>{activity.user}</strong> {activity.description}
                          {activity.oldValue && activity.newValue && (
                            <span style={{ color: 'var(--text-muted)' }}>
                              {' '}from <strong>{activity.oldValue}</strong> to <strong>{activity.newValue}</strong>
                            </span>
                          )}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: 'var(--text-muted)',
                          marginTop: '4px',
                        }}>
                          {formatDate(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Related Tab */}
              {activeTab === 'related' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {isLoadingRelationships ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                      Loading relationships...
                    </div>
                  ) : relationships.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                      <LinkRegular style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
                      <p>No relationships yet</p>
                    </div>
                  ) : (
                    relationships.map(rel => (
                      <div 
                        key={rel.id}
                        className="purple-glass-card"
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                        }}
                        onClick={() => navigate(`/app/service-desk/ticket/${rel.target_ticket_id}`)}
                      >
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <RelationshipBadge type={rel.relationship_type} size="small" />
                              {rel.target_ticket && (
                                <>
                                  <span style={{ 
                                    fontSize: '12px', 
                                    color: 'var(--text-muted)',
                                  }}>
                                    {rel.target_ticket.id}
                                  </span>
                                  <span style={{
                                    padding: '2px 6px',
                                    background: `${getPriorityColor(rel.target_ticket.priority)}20`,
                                    color: getPriorityColor(rel.target_ticket.priority),
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                  }}>
                                    {rel.target_ticket.priority}
                                  </span>
                                  <span style={{
                                    padding: '2px 6px',
                                    background: `${getStatusColor(rel.target_ticket.status)}20`,
                                    color: getStatusColor(rel.target_ticket.status),
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                  }}>
                                    {rel.target_ticket.status}
                                  </span>
                                </>
                              )}
                            </div>
                            {rel.target_ticket && (
                              <div style={{ 
                                color: 'var(--text-primary)',
                                fontSize: '14px',
                                fontWeight: 500,
                              }}>
                                {rel.target_ticket.title}
                              </div>
                            )}
                            {rel.notes && (
                              <div style={{ 
                                marginTop: '8px',
                                fontSize: '12px',
                                color: 'var(--text-muted)',
                                fontStyle: 'italic',
                              }}>
                                {rel.notes}
                              </div>
                            )}
                          </div>
                          <PurpleGlassButton
                            variant="ghost"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRelationship(rel.id);
                            }}
                            style={{ marginLeft: '12px' }}
                          >
                            <DeleteRegular style={{ fontSize: '14px' }} />
                          </PurpleGlassButton>
                        </div>
                      </div>
                    ))
                  )}
                  <PurpleGlassButton 
                    variant="ghost" 
                    style={{ alignSelf: 'flex-start' }}
                    onClick={() => setShowRelationshipManager(true)}
                  >
                    <LinkRegular style={{ marginRight: '8px' }} />
                    Add Relationship
                  </PurpleGlassButton>
                </div>
              )}

              {/* Hierarchy Tab */}
              {activeTab === 'hierarchy' && (
                <div>
                  {isLoadingRelationships ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                      Loading hierarchy...
                    </div>
                  ) : hierarchyTree ? (
                    <TicketHierarchyView 
                      tree={hierarchyTree}
                      onTicketClick={(ticketId) => navigate(`/app/service-desk/ticket/${ticketId}`)}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                      <CubeRegular style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
                      <p>No hierarchy structure</p>
                      <p style={{ fontSize: '12px', marginTop: '8px' }}>
                        This ticket has no parent or child tickets
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </PurpleGlassCard>
        </div>

        {/* Side Panel - Metadata */}
        <div style={sidePanelStyle}>
          {/* SLA Card */}
          {ticket.slaStatus && (
            <PurpleGlassCard style={{ padding: '20px' }}>
              <div style={sectionHeaderStyle}>
                <ClockRegular />
                SLA STATUS
              </div>
              <SLAIndicator 
                status={ticket.slaStatus}
                timeDisplay={ticket.slaTimeRemaining}
              />
              {ticket.slaDueDate && (
                <div style={{ 
                  marginTop: '12px',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}>
                  Due: {formatDate(ticket.slaDueDate)}
                </div>
              )}
            </PurpleGlassCard>
          )}

          {/* Details Card */}
          <PurpleGlassCard style={{ padding: '20px' }}>
            <div style={sectionHeaderStyle}>
              <TagRegular />
              DETAILS
            </div>

            <div style={metadataRowStyle}>
              <span style={metadataLabelStyle}>
                <PersonRegular /> Assignee
              </span>
              <span style={metadataValueStyle}>
                {ticket.assignee || 'Unassigned'}
              </span>
            </div>

            <div style={metadataRowStyle}>
              <span style={metadataLabelStyle}>
                <PersonRegular /> Reporter
              </span>
              <span style={metadataValueStyle}>
                {ticket.reporter}
              </span>
            </div>

            <div style={metadataRowStyle}>
              <span style={metadataLabelStyle}>
                Team
              </span>
              <span style={metadataValueStyle}>
                {ticket.team || 'Unassigned'}
              </span>
            </div>

            <div style={metadataRowStyle}>
              <span style={metadataLabelStyle}>
                Category
              </span>
              <span style={metadataValueStyle}>
                {ticket.category} / {ticket.subcategory}
              </span>
            </div>

            <div style={metadataRowStyle}>
              <span style={metadataLabelStyle}>
                <CalendarRegular /> Created
              </span>
              <span style={metadataValueStyle}>
                {formatDate(ticket.created_at)}
              </span>
            </div>

            <div style={{ ...metadataRowStyle, borderBottom: 'none' }}>
              <span style={metadataLabelStyle}>
                <CalendarRegular /> Updated
              </span>
              <span style={metadataValueStyle}>
                {formatDate(ticket.updated_at)}
              </span>
            </div>
          </PurpleGlassCard>

          {/* Linked Assets Card */}
          {ticket.linkedAssets && ticket.linkedAssets.length > 0 && (
            <PurpleGlassCard style={{ padding: '20px' }}>
              <div style={sectionHeaderStyle}>
                <ServerRegular />
                LINKED ASSETS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ticket.linkedAssets.map(asset => (
                  <LinkedAssetBadge
                    key={asset.id}
                    assetId={asset.id}
                    assetName={asset.name}
                    assetType={asset.type}
                    status={asset.status}
                  />
                ))}
              </div>
              <PurpleGlassButton 
                variant="ghost" 
                size="small"
                style={{ marginTop: '12px' }}
              >
                <LinkRegular style={{ marginRight: '8px' }} />
                Link Asset
              </PurpleGlassButton>
            </PurpleGlassCard>
          )}

          {/* Attachments Card */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <PurpleGlassCard style={{ padding: '20px' }}>
              <div style={sectionHeaderStyle}>
                <AttachRegular />
                ATTACHMENTS ({ticket.attachments.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ticket.attachments.map(attachment => (
                  <div 
                    key={attachment.id}
                    className="purple-glass-card"
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ 
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      fontWeight: 500,
                    }}>
                      {attachment.name}
                    </div>
                    <div style={{ 
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      marginTop: '2px',
                    }}>
                      {attachment.size} • {attachment.uploadedBy}
                    </div>
                  </div>
                ))}
              </div>
            </PurpleGlassCard>
          )}

          {/* Watchers Card */}
          {ticket.watchers && ticket.watchers.length > 0 && (
            <PurpleGlassCard style={{ padding: '20px' }}>
              <div style={sectionHeaderStyle}>
                <PersonRegular />
                WATCHERS ({ticket.watchers.length})
              </div>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px',
              }}>
                {ticket.watchers.map(watcher => (
                  <div 
                    key={watcher}
                    style={{
                      padding: '4px 10px',
                      background: 'var(--card-bg)',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {watcher.split('@')[0]}
                  </div>
                ))}
              </div>
            </PurpleGlassCard>
          )}
        </div>
      </div>

      {/* Relationship Manager Modal */}
      {showRelationshipManager && ticket && (
        <RelationshipManager
          ticketId={ticketId || ''}
          ticketTitle={ticket.title}
          onClose={() => setShowRelationshipManager(false)}
          onRelationshipCreated={handleRelationshipCreated}
        />
      )}
    </div>
  );
};

export default TicketDetailView;

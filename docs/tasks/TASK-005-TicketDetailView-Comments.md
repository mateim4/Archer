# TASK-005: TicketDetailView Comments Integration

**Task ID:** TASK-005  
**Priority:** P1 - High  
**Estimate:** 4 hours  
**Dependencies:** TASK-001 (ServiceDeskView must use real tickets)  
**Phase:** 1 - Core ITSM

---

## Objective

Connect the TicketDetailView comments section to the real backend API, enabling users to view, add, and delete comments on tickets.

---

## Context

The TicketDetailView currently uses a `mockTicketDetail` object with hardcoded comments. The backend already has full comment CRUD operations. This task connects the frontend to those APIs.

### Files to Modify
- `frontend/src/views/TicketDetailView.tsx`

### Files to Create (Optional)
- `frontend/src/hooks/queries/useTicketComments.ts` (if not using inline queries)

### Reference Files (Read-Only)
- `backend/src/api/tickets.rs` - Comment endpoints (lines 40-63)
- `backend/src/models/ticket.rs` - TicketComment model
- `frontend/src/utils/apiClient.ts` - May need to add comment methods

---

## Backend API Reference

From `backend/src/api/tickets.rs`:

```rust
// Comment routes (already exist)
.route("/:id/comments", get(list_comments))     // GET /tickets/:id/comments
.route("/:id/comments", post(add_comment))      // POST /tickets/:id/comments
.route("/:id/comments/:comment_id", delete(delete_comment))  // DELETE
```

### Comment Model (from ticket.rs)

```rust
pub struct TicketComment {
    pub id: Option<Thing>,
    pub ticket_id: Thing,
    pub content: String,
    pub author_id: String,
    pub author_name: String,
    pub is_internal: bool,       // Internal note vs public comment
    pub comment_type: CommentType,
    pub attachments: Vec<CommentAttachment>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub enum CommentType {
    Note,
    Workaround,
    Solution,
    CustomerResponse,
    StatusUpdate,
}
```

---

## Current Implementation

```tsx
// frontend/src/views/TicketDetailView.tsx

// Line ~110 - Mock ticket with comments
const mockTicketDetail: TicketDetail = {
  // ...
  comments: [
    {
      id: 'c1',
      author: 'John Smith',
      content: 'I've identified the issue...',
      createdAt: '2024-01-15T10:30:00Z',
      isInternal: false,
    },
    // ... more mock comments
  ],
};
```

---

## Required Implementation

### Step 1: Add API Client Methods

Update `frontend/src/utils/apiClient.ts`:

```typescript
// Types
export interface TicketComment {
  id: string;
  ticket_id: string;
  content: string;
  author_id: string;
  author_name: string;
  is_internal: boolean;
  comment_type: 'NOTE' | 'WORKAROUND' | 'SOLUTION' | 'CUSTOMER_RESPONSE' | 'STATUS_UPDATE';
  attachments: CommentAttachment[];
  created_at: string;
  updated_at: string;
}

export interface CommentAttachment {
  filename: string;
  file_path: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
}

export interface CreateCommentRequest {
  content: string;
  is_internal: boolean;
  comment_type?: string;
}

// API methods
export const apiClient = {
  // ... existing methods
  
  // Comments
  getTicketComments: async (ticketId: string): Promise<TicketComment[]> => {
    const response = await axiosInstance.get(`/tickets/${ticketId}/comments`);
    return response.data;
  },
  
  addTicketComment: async (ticketId: string, comment: CreateCommentRequest): Promise<TicketComment> => {
    const response = await axiosInstance.post(`/tickets/${ticketId}/comments`, comment);
    return response.data;
  },
  
  deleteTicketComment: async (ticketId: string, commentId: string): Promise<void> => {
    await axiosInstance.delete(`/tickets/${ticketId}/comments/${commentId}`);
  },
};
```

### Step 2: Create Query Hooks (Optional but Recommended)

Create `frontend/src/hooks/queries/useTicketComments.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, TicketComment, CreateCommentRequest } from '../../utils/apiClient';
import { queryKeys } from './queryKeys';

export function useTicketComments(ticketId: string) {
  return useQuery({
    queryKey: queryKeys.tickets.comments(ticketId),
    queryFn: () => apiClient.getTicketComments(ticketId),
    enabled: !!ticketId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useAddComment(ticketId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (comment: CreateCommentRequest) => 
      apiClient.addTicketComment(ticketId, comment),
    onSuccess: () => {
      // Invalidate and refetch comments
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.comments(ticketId) });
    },
  });
}

export function useDeleteComment(ticketId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (commentId: string) => 
      apiClient.deleteTicketComment(ticketId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.comments(ticketId) });
    },
  });
}
```

Add to queryKeys.ts:
```typescript
tickets: {
  all: ['tickets'] as const,
  // ... existing
  comments: (ticketId: string) => [...queryKeys.tickets.all, ticketId, 'comments'] as const,
},
```

### Step 3: Update TicketDetailView

Replace the mock comments with real data:

```tsx
import { useTicketComments, useAddComment, useDeleteComment } from '../hooks/queries/useTicketComments';

// In component
const { id } = useParams<{ id: string }>();
const ticketId = id || '';

const { data: comments, isLoading: commentsLoading } = useTicketComments(ticketId);
const addComment = useAddComment(ticketId);
const deleteComment = useDeleteComment(ticketId);

// State for new comment
const [newComment, setNewComment] = useState('');
const [isInternal, setIsInternal] = useState(false);

const handleAddComment = async () => {
  if (!newComment.trim()) return;
  
  try {
    await addComment.mutateAsync({
      content: newComment,
      is_internal: isInternal,
      comment_type: 'NOTE',
    });
    setNewComment('');
  } catch (error) {
    console.error('Failed to add comment:', error);
  }
};

const handleDeleteComment = async (commentId: string) => {
  if (!confirm('Delete this comment?')) return;
  
  try {
    await deleteComment.mutateAsync(commentId);
  } catch (error) {
    console.error('Failed to delete comment:', error);
  }
};
```

### Step 4: Update Comments UI Section

```tsx
{/* Comments Section */}
<PurpleGlassCard title="Comments">
  {commentsLoading ? (
    <PurpleGlassSkeleton lines={3} />
  ) : comments && comments.length > 0 ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {comments.map(comment => (
        <div 
          key={comment.id}
          style={{
            padding: '12px',
            background: comment.is_internal ? 'rgba(255, 200, 0, 0.1)' : 'var(--surface-secondary)',
            borderRadius: '8px',
            border: comment.is_internal ? '1px solid rgba(255, 200, 0, 0.3)' : 'none',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PersonRegular />
              <span style={{ fontWeight: 500 }}>{comment.author_name}</span>
              {comment.is_internal && (
                <span style={{ 
                  fontSize: '12px', 
                  padding: '2px 8px', 
                  background: 'rgba(255, 200, 0, 0.2)',
                  borderRadius: '4px',
                }}>
                  <LockClosedRegular /> Internal
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {new Date(comment.created_at).toLocaleString()}
              </span>
              <EnhancedPurpleGlassButton
                variant="ghost"
                icon={<DeleteRegular />}
                size="small"
                onClick={() => handleDeleteComment(comment.id)}
                aria-label="Delete comment"
              />
            </div>
          </div>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{comment.content}</p>
        </div>
      ))}
    </div>
  ) : (
    <p style={{ color: 'var(--text-secondary)' }}>No comments yet</p>
  )}

  {/* Add Comment Form */}
  <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
    <PurpleGlassTextarea
      value={newComment}
      onChange={(e) => setNewComment(e.target.value)}
      placeholder="Add a comment..."
      rows={3}
    />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
      <PurpleGlassCheckbox
        label="Internal note (not visible to customer)"
        checked={isInternal}
        onChange={(e) => setIsInternal(e.target.checked)}
      />
      <EnhancedPurpleGlassButton
        variant="primary"
        icon={<SendRegular />}
        onClick={handleAddComment}
        loading={addComment.isPending}
        disabled={!newComment.trim()}
      >
        Add Comment
      </EnhancedPurpleGlassButton>
    </div>
  </div>
</PurpleGlassCard>
```

---

## Acceptance Criteria

- [ ] Comments loaded from API when viewing ticket
- [ ] Loading state shown while fetching comments
- [ ] Empty state shown when no comments exist
- [ ] Can add new comment via textarea
- [ ] Internal/public toggle works correctly
- [ ] Internal comments visually distinguished (yellow background)
- [ ] Can delete comments (own comments or admin)
- [ ] Comment list updates after adding/deleting
- [ ] Author name and timestamp displayed
- [ ] No TypeScript errors
- [ ] No console errors

---

## Testing Instructions

1. Navigate to an existing ticket (e.g., `/app/tickets/ticket:abc123`)
2. Verify:
   - Comments section loads (may be empty initially)
   - Add a public comment → appears immediately
   - Add an internal comment → appears with "Internal" badge
   - Delete a comment → disappears from list
   - Refresh page → comments persist

---

## Notes for Agent

- The ticket ID format from SurrealDB is `ticket:xxxxx` - ensure API calls use correct format
- The backend may return comments in the ticket response or require separate call
- Consider optimistic updates for better UX (show comment immediately, rollback on error)
- Internal comments should only be visible to agents, not customers (if customer portal exists)
- The `author_name` should come from the backend - don't hardcode current user name

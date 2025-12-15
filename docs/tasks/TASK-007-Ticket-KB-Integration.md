# TASK-007: Ticket-KB Integration

**Task ID:** TASK-007  
**Priority:** P2 - Medium  
**Estimate:** 4 hours  
**Dependencies:** TASK-001 (ServiceDeskView API), TASK-005 (TicketDetailView Comments)  
**Phase:** 1 - Core ITSM (Enhancement)

---

## Objective

Enable linking KB articles to tickets. When viewing a ticket, users should be able to search and attach relevant KB articles. The articles appear as "Related Knowledge" in the ticket detail.

---

## Context

### What Exists
- Backend: `KbArticle` model with `related_tickets: Vec<String>` field
- Backend: Knowledge Base API at `/api/v1/kb/articles`
- Frontend: `KnowledgeBaseView.tsx` already connected to API
- Frontend: `TicketDetailView.tsx` has placeholder for related content
- Relationship: `TicketRelationship` model supports arbitrary relationships

### What's Missing
- UI to search/attach KB articles from ticket view
- API endpoint to link ticket ↔ KB article
- Display of linked articles in ticket detail

---

## Backend Preparation

### Check Existing Relationship Model

```rust
// File: backend/src/models/ticket.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TicketRelationship {
    pub related_ticket_id: String,
    pub relationship_type: RelationshipType,
    pub created_at: DateTime<Utc>,
}
```

### Add KB Link Endpoint (if not exists)

```rust
// File: backend/src/api/tickets.rs

/// Link a KB article to a ticket
#[axum::debug_handler]
pub async fn link_kb_article(
    State(state): State<AppState>,
    Path(ticket_id): Path<String>,
    Json(payload): Json<LinkKBRequest>,
) -> impl IntoResponse {
    // payload.article_id - the KB article to link
    // Update both ticket.related_kb_articles and article.related_tickets
}

#[derive(Debug, Deserialize)]
pub struct LinkKBRequest {
    pub article_id: String,
}

// Route registration
.route("/:id/kb-links", post(link_kb_article))
.route("/:id/kb-links", get(get_linked_articles))
.route("/:id/kb-links/:article_id", delete(unlink_kb_article))
```

---

## Frontend Implementation

### Step 1: Add API Client Methods

```typescript
// File: frontend/src/api/ticketApi.ts

export const linkKBArticle = async (ticketId: string, articleId: string): Promise<void> => {
  await apiClient.post(`/api/v1/tickets/${ticketId}/kb-links`, {
    article_id: articleId
  });
};

export const getLinkedKBArticles = async (ticketId: string): Promise<KBArticle[]> => {
  const response = await apiClient.get<KBArticle[]>(`/api/v1/tickets/${ticketId}/kb-links`);
  return response.data;
};

export const unlinkKBArticle = async (ticketId: string, articleId: string): Promise<void> => {
  await apiClient.delete(`/api/v1/tickets/${ticketId}/kb-links/${articleId}`);
};
```

### Step 2: Create TanStack Query Hooks

```typescript
// File: frontend/src/hooks/useTicketKBLinks.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLinkedKBArticles, linkKBArticle, unlinkKBArticle } from '../api/ticketApi';

export function useTicketKBLinks(ticketId: string) {
  return useQuery({
    queryKey: ['ticket-kb-links', ticketId],
    queryFn: () => getLinkedKBArticles(ticketId),
    enabled: !!ticketId,
  });
}

export function useLinkKBArticle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ticketId, articleId }: { ticketId: string; articleId: string }) =>
      linkKBArticle(ticketId, articleId),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-kb-links', ticketId] });
    },
  });
}

export function useUnlinkKBArticle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ticketId, articleId }: { ticketId: string; articleId: string }) =>
      unlinkKBArticle(ticketId, articleId),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-kb-links', ticketId] });
    },
  });
}
```

### Step 3: Create KB Search Component

```typescript
// File: frontend/src/components/ticket/KBArticleSearch.tsx

import React, { useState } from 'react';
import { EnhancedPurpleGlassSearchBar, EnhancedPurpleGlassButton } from '../ui';
import { useKBArticles } from '../../hooks/useKnowledgeBase';
import { BookRegular, LinkRegular } from '@fluentui/react-icons';

interface KBArticleSearchProps {
  ticketId: string;
  existingLinks: string[];
  onLink: (articleId: string) => void;
}

export const KBArticleSearch: React.FC<KBArticleSearchProps> = ({
  ticketId,
  existingLinks,
  onLink,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: articles, isLoading } = useKBArticles(searchTerm);

  const filteredArticles = articles?.filter(
    (article) => !existingLinks.includes(article.id)
  );

  return (
    <div className="kb-article-search">
      <EnhancedPurpleGlassSearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search knowledge base..."
        showClearButton
      />
      
      {isLoading && <p>Searching...</p>}
      
      {filteredArticles?.map((article) => (
        <div key={article.id} className="kb-search-result">
          <BookRegular />
          <div className="article-info">
            <h4>{article.title}</h4>
            <p>{article.category}</p>
          </div>
          <EnhancedPurpleGlassButton
            variant="ghost"
            size="small"
            icon={<LinkRegular />}
            onClick={() => onLink(article.id)}
          >
            Link
          </EnhancedPurpleGlassButton>
        </div>
      ))}
    </div>
  );
};
```

### Step 4: Add to TicketDetailView

```typescript
// File: frontend/src/views/TicketDetailView.tsx

// Add imports
import { useTicketKBLinks, useLinkKBArticle, useUnlinkKBArticle } from '../hooks/useTicketKBLinks';
import { KBArticleSearch } from '../components/ticket/KBArticleSearch';

// In the component
const { data: linkedArticles, isLoading: loadingKB } = useTicketKBLinks(ticketId);
const linkMutation = useLinkKBArticle();
const unlinkMutation = useUnlinkKBArticle();

const handleLinkArticle = (articleId: string) => {
  linkMutation.mutate({ ticketId, articleId });
};

const handleUnlinkArticle = (articleId: string) => {
  unlinkMutation.mutate({ ticketId, articleId });
};

// In the JSX, add a "Related Knowledge" section
<PurpleGlassCard>
  <h3>Related Knowledge</h3>
  
  {linkedArticles?.map((article) => (
    <div key={article.id} className="linked-article">
      <BookRegular />
      <span>{article.title}</span>
      <EnhancedPurpleGlassButton
        variant="ghost"
        size="small"
        onClick={() => handleUnlinkArticle(article.id)}
        aria-label={`Unlink ${article.title}`}
      >
        <DismissRegular />
      </EnhancedPurpleGlassButton>
    </div>
  ))}
  
  <KBArticleSearch
    ticketId={ticketId}
    existingLinks={linkedArticles?.map(a => a.id) || []}
    onLink={handleLinkArticle}
  />
</PurpleGlassCard>
```

---

## API Response Format

### GET /api/v1/tickets/:id/kb-links

```json
[
  {
    "id": "kb:article123",
    "title": "Password Reset Procedure",
    "category": "How-To",
    "summary": "Steps to reset your corporate password...",
    "created_at": "2025-01-15T10:30:00Z"
  }
]
```

---

## Acceptance Criteria

- [ ] Backend endpoint exists to link/unlink KB articles
- [ ] TicketDetailView shows "Related Knowledge" section
- [ ] Users can search KB articles within ticket view
- [ ] Users can link articles with single click
- [ ] Users can unlink articles
- [ ] Linked articles show title and category
- [ ] Empty state shows "No related articles" message
- [ ] Loading states display correctly
- [ ] TypeScript compiles without errors

---

## Testing

1. Open a ticket in TicketDetailView
2. Scroll to "Related Knowledge" section
3. Search for an existing KB article
4. Click "Link" - article should appear in linked list
5. Click unlink button - article should be removed
6. Refresh page - links should persist

---

## Notes for Agent

1. **Verify backend endpoints first** - If `/kb-links` routes don't exist, add them
2. **Use existing hooks pattern** - Follow `useTicketComments` pattern
3. **Reuse KB types** - Types should already exist from KnowledgeBaseView
4. **Test with real KB articles** - Make sure there are articles in the database
5. **Consider UX** - Show "Suggested Articles" based on ticket keywords (future enhancement)

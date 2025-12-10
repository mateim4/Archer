# KB-Ticket Integration - Feature Documentation

## Overview
The Knowledge Base (KB) Ticket Integration feature provides intelligent article suggestions during ticket creation, enabling self-service resolution and reducing ticket volume. When users describe their issue, the system automatically suggests relevant KB articles that might solve their problem.

## User Experience

### For End Users (Creating Tickets)
1. User opens ticket creation modal
2. As they type the title and description, the system automatically searches for relevant KB articles
3. Suggestions appear below the description field in real-time (debounced by 300ms)
4. Each suggestion shows:
   - Article title and summary
   - Relevance score (color-coded: green 70%+, yellow 40-70%, gray <40%)
   - Statistics: resolution count, helpful votes, views
   - Expandable excerpt with matching keywords
5. User actions:
   - **View Full Article**: Opens article in new tab for detailed reading
   - **This Solved My Problem**: Closes ticket creation (self-service resolution)
   - User can still create ticket if articles don't help

### For Agents (Resolving Tickets)
*Coming in Phase 7*
- View suggested articles when opening a ticket
- Send articles to customers with one click
- Link articles to ticket resolution
- Track which articles were helpful

## Technical Implementation

### Backend

#### API Endpoints
```
GET /api/v1/kb/suggest?title=&description=&category=&limit=
Response: ArticleSuggestion[]

GET /api/v1/kb/related-to-ticket/:ticket_id
Response: ArticleSuggestion[]

GET /api/v1/kb/top-resolution-articles?limit=
Response: ArticleSuggestion[]

POST /api/v1/tickets/:ticket_id/kb-resolution
Body: { article_id: string, was_helpful: bool }
Response: TicketKBLink
```

#### Suggestion Algorithm
1. **Keyword Extraction**:
   - Removes stop words (the, and, for, etc.)
   - Filters words shorter than 3 characters
   - Takes top 10 keywords from title + description

2. **Article Search**:
   - Searches published articles only
   - Matches keywords in title and content
   - Filters by category if provided
   - Orders by view count and resolution count

3. **Relevance Scoring** (0-1 scale):
   - 50% - Keyword match ratio (matched keywords / total keywords)
   - 20% - Title match bonus (if query title appears in article title)
   - 15% - Resolution count (normalized to max 10)
   - 15% - Helpfulness score (percentage of helpful votes)

4. **Excerpt Generation**:
   - Finds sentence containing matching keywords
   - Falls back to first 200 characters if no match
   - Truncates to 200 characters max

#### Data Model
```rust
pub struct TicketKBLink {
    pub id: Option<Thing>,
    pub ticket_id: Thing,
    pub article_id: Thing,
    pub link_type: KBLinkType, // SUGGESTED_TO_USER | USED_FOR_RESOLUTION | ATTACHED_BY_AGENT
    pub was_helpful: Option<bool>,
    pub created_by: String,
    pub created_at: DateTime<Utc>,
}

// Added to KBArticle model
pub resolution_count: i32,      // Times used for resolution
pub helpfulness_score: f32,     // Percentage helpful (0-100)
```

### Frontend

#### Components
**KBSuggestionPanel** (`frontend/src/components/kb/KBSuggestionPanel.tsx`)
- Displays list of suggested articles
- Expandable cards with article details
- Purple Glass design system compliant
- Loading state with spinner
- Empty state (no suggestions)

**CreateIncidentModal** (updated)
- Integrated KBSuggestionPanel below description field
- Debounced search (300ms) to reduce API calls
- Minimum 10 characters before triggering search
- Handles "This Solved My Problem" action

#### Hooks
**useDebounce** (`frontend/src/hooks/useDebounce.ts`)
- Generic debounce hook for any value
- Configurable delay (default 300ms)
- Used for title and description inputs

#### API Client Methods
```typescript
async suggestKBArticles(params: KBSuggestionRequest): Promise<ArticleSuggestion[]>
async getRelatedKBArticles(ticketId: string): Promise<ArticleSuggestion[]>
async getTopResolutionArticles(limit?: number): Promise<ArticleSuggestion[]>
async linkArticleToTicket(ticketId: string, data: LinkArticleToTicketRequest): Promise<TicketKBLink>
```

## Configuration

### Suggestion Behavior
- **Minimum query length**: 10 characters combined (title + description)
- **Debounce delay**: 300ms
- **Max suggestions**: 5 articles
- **Article filter**: Published status only
- **Search scope**: Title and content fields

### Relevance Score Thresholds
- **High relevance** (Green): 70%+ match
- **Medium relevance** (Yellow): 40-70% match
- **Low relevance** (Gray): <40% match

## Usage Examples

### Creating a Ticket with Suggestions
```typescript
// User types in ticket creation modal
Title: "Server cluster experiencing high CPU"
Description: "The production cluster NX-01 is showing CPU above 90%..."

// System automatically fetches suggestions
const suggestions = await apiClient.suggestKBArticles({
  title: "Server cluster experiencing high CPU",
  description: "The production cluster NX-01 is showing CPU above 90%...",
  limit: 5
});

// Suggestions appear with relevance scores
// User clicks "This Solved My Problem" on an article
// Modal closes without creating ticket
```

### Agent Linking Article to Resolution (Phase 7)
```typescript
// When agent resolves ticket using KB article
await apiClient.linkArticleToTicket('ticket:123', {
  article_id: 'kb_articles:456',
  was_helpful: true
});

// Updates article.resolution_count
// Updates article.helpfulness_score
// Creates TicketKBLink record
```

## Performance Considerations

### Backend
- Keyword extraction: O(n) where n = text length
- Search query: Indexed on title, content, status, category
- Relevance scoring: O(m) where m = number of matches
- Typical response time: 50-200ms for 5 suggestions

### Frontend
- Debounced search prevents excessive API calls
- Only searches when meaningful content exists (10+ chars)
- Component renders are optimized with React.memo where appropriate
- Suggestions cached per search term (browser memory only)

## Future Enhancements

### Phase 2: Semantic Search (AI Module)
- Replace keyword matching with vector embeddings
- Use OpenAI/Anthropic embeddings for better relevance
- Implement similarity search with FAISS or similar

### Phase 3: Machine Learning
- Track which suggestions users click vs ignore
- Learn from successful resolutions
- Personalize suggestions based on user role

### Phase 4: Analytics
- Dashboard showing:
  - Self-service resolution rate
  - Most helpful articles
  - Ticket deflection metrics
  - Category-specific effectiveness

## Troubleshooting

### Suggestions Not Appearing
1. Check minimum character requirement (10+ chars)
2. Verify debounce delay hasn't been changed
3. Check network tab for API errors
4. Verify KB articles exist with published status

### Irrelevant Suggestions
1. Improve article keywords and tags
2. Add category to articles for better filtering
3. Review article content for clarity
4. Consider updating relevance scoring weights

### Performance Issues
1. Increase debounce delay (300ms → 500ms)
2. Reduce suggestion limit (5 → 3)
3. Add caching layer for common queries
4. Check database indexes on kb_articles table

## Related Documentation
- [KB Module Documentation](./KB_MODULE_DOCS.md)
- [Ticket System Documentation](./TICKET_SYSTEM_DOCS.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Purple Glass Design System](./DESIGN_SYSTEM.md)

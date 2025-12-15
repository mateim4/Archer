# Phase 1 Ticket Enhancements - Testing Guide

## Overview
This guide covers testing for the three completed tasks:
- TASK-005: TicketDetailView Comments UI
- TASK-006: Dashboard Real Stats
- TASK-007: Ticket-KB Integration

## Prerequisites

### Backend Setup
Ensure the Rust backend is running:
```bash
cd backend
cargo run
# Backend should be running on http://localhost:3001
```

### Frontend Setup
```bash
cd frontend
npm run dev
# Frontend should be running on http://localhost:1420
```

### Test Data
You'll need:
- At least 3-5 test tickets in the database
- A few Knowledge Base articles
- Monitoring alerts (optional for full dashboard testing)

---

## TASK-005: TicketDetailView Comments UI

### Test Scenarios

#### 1. View Existing Comments
**Steps:**
1. Navigate to `/app/service-desk`
2. Click on any ticket to open detail view
3. Check the Comments tab (should be active by default)

**Expected Results:**
- [ ] Comments load from API without errors
- [ ] Each comment shows: author name, avatar/initials, timestamp, content
- [ ] Timestamps show relative time (e.g., "2 hours ago", "1 day ago")
- [ ] Internal notes have yellow background and lock icon
- [ ] Public comments have normal background

#### 2. Add a Public Comment
**Steps:**
1. In the Comments tab, type text in the comment textarea
2. Leave "Internal note" checkbox unchecked
3. Click "Send" button

**Expected Results:**
- [ ] Button shows "Sending..." during submission
- [ ] New comment appears in the list immediately (optimistic update)
- [ ] Comment has your name and "Just now" timestamp
- [ ] Textarea clears after successful submission
- [ ] No yellow background (it's public)

#### 3. Add an Internal Note
**Steps:**
1. Type text in comment textarea
2. Check "Internal note (not visible to requester)" checkbox
3. Click "Send"

**Expected Results:**
- [ ] New comment has yellow background
- [ ] Shows lock icon and "INTERNAL NOTE" label
- [ ] Marked as not visible to requester

#### 4. Delete a Comment
**Steps:**
1. Hover over any comment you created
2. Click the delete (trash) icon

**Expected Results:**
- [ ] Comment is removed from the list
- [ ] API DELETE request succeeds
- [ ] No error messages

#### 5. Empty State
**Steps:**
1. Create a new ticket without comments
2. View the ticket detail

**Expected Results:**
- [ ] Shows "No comments yet. Be the first to comment!"

---

## TASK-006: Dashboard Real Stats

### Test Scenarios

#### 1. Dashboard Loads with Real Data
**Steps:**
1. Navigate to `/app/dashboard`
2. Wait for data to load

**Expected Results:**
- [ ] Stats cards show immediately (placeholder data)
- [ ] Stats update with real data from API within 1-2 seconds
- [ ] Four stat cards visible:
  - Open Tickets
  - In Progress
  - Resolved Today
  - Avg Resolution Time

#### 2. Trend Indicators
**Steps:**
1. Check each stat card for trend indicators

**Expected Results:**
- [ ] Each card shows percentage change vs previous period
- [ ] Green up arrow for positive trends (except Avg Resolution)
- [ ] Red down arrow for negative trends
- [ ] Avg Resolution Time: Green down arrow = improved (lower is better)
- [ ] Trend label shows context (e.g., "vs last period", "improved")

#### 3. Click-through Navigation
**Steps:**
1. Click on "Open Tickets" stat card
2. Verify navigation to Service Desk filtered view

**Expected Results:**
- [ ] Navigates to `/app/service-desk?status=open`
- [ ] Shows only open tickets

#### 4. Refresh Functionality
**Steps:**
1. Click the "Refresh" button in page header

**Expected Results:**
- [ ] Button shows loading spinner
- [ ] Stats refresh from API
- [ ] Takes ~1-2 seconds
- [ ] All widgets update

#### 5. Fallback Behavior
**Steps:**
1. Stop the backend server
2. Refresh the dashboard

**Expected Results:**
- [ ] Dashboard still renders (shows placeholder data)
- [ ] Demo mode banner appears: "Dashboard is showing sample data"
- [ ] No crashes or white screen

#### 6. Analytics API Integration
**Steps:**
1. Open browser DevTools Network tab
2. Refresh dashboard
3. Filter for "analytics"

**Expected Results:**
- [ ] Request to `GET /api/v1/analytics/dashboard` is made
- [ ] Response contains: `total_open_tickets`, `total_in_progress`, `total_resolved_today`, `avg_resolution_time_hours`
- [ ] Response includes optional trend fields: `open_tickets_prev_period`, etc.

---

## TASK-007: Ticket-KB Integration

### Test Scenarios

#### 1. View KB Suggestions
**Steps:**
1. Navigate to any ticket detail view
2. Look at the right sidebar
3. Locate "Related Articles" card (above SLA Status)

**Expected Results:**
- [ ] KB suggestions panel loads
- [ ] Shows loading spinner initially
- [ ] Displays up to 5 suggested articles
- [ ] Each article shows:
  - Title
  - Category
  - Relevance score (percentage bar)
  - View count
  - "This solved my problem" button

#### 2. Relevance Scoring
**Steps:**
1. Check the confidence bars on suggestions

**Expected Results:**
- [ ] Bars are colored based on confidence:
  - Green: 80%+
  - Purple: 60-79%
  - Yellow: <60%
- [ ] Higher relevance articles appear first

#### 3. Open Article in New Tab
**Steps:**
1. Click on any article title in the suggestions

**Expected Results:**
- [ ] Article opens in new browser tab
- [ ] URL is `/app/knowledge/article/{id}` or `/app/knowledge/{slug}`
- [ ] Original ticket tab remains open

#### 4. Link Article to Ticket
**Steps:**
1. Click "This solved my problem" button on an article

**Expected Results:**
- [ ] Button shows "Linking..." briefly
- [ ] Button changes to show checkmark and "Linked" (green)
- [ ] Article is linked to the ticket in backend
- [ ] Cannot link the same article twice

#### 5. Empty State
**Steps:**
1. Create a ticket with a very vague or random title
2. View ticket detail

**Expected Results:**
- [ ] Shows "No related articles found" message
- [ ] Suggests updating ticket title/description for better matches
- [ ] No errors or crashes

#### 6. API Integration
**Steps:**
1. Open browser DevTools Network tab
2. Navigate to ticket detail
3. Filter for "knowledge"

**Expected Results:**
- [ ] Request to `GET /api/v1/knowledge/suggest?title=...&description=...` is made
- [ ] Response contains array of ArticleSuggestion objects
- [ ] Each suggestion has: `article_id`, `article_title`, `confidence_score`, `match_reason`

#### 7. Cross-Category Suggestions
**Steps:**
1. View tickets from different categories
2. Verify suggestions change

**Expected Results:**
- [ ] Different tickets get different suggestions
- [ ] Suggestions are contextual to ticket content
- [ ] Category filter improves relevance

---

## Integration Testing

### End-to-End Workflow
**Scenario:** Agent receives a ticket, finds solution in KB, resolves ticket

**Steps:**
1. Navigate to Dashboard
2. View "Open Tickets" count (should be > 0)
3. Click to go to Service Desk
4. Open a ticket
5. Check KB suggestions in sidebar
6. Click an article to read it
7. Click "This solved my problem"
8. Add a comment: "Resolved using KB article {title}"
9. Update ticket status to "Resolved"

**Expected Results:**
- [ ] All steps complete without errors
- [ ] Dashboard stats update after resolution
- [ ] Comment appears in ticket
- [ ] Article is linked to ticket
- [ ] Stats reflect one fewer open ticket

---

## Performance Testing

### Dashboard Load Time
**Steps:**
1. Open DevTools Performance tab
2. Navigate to `/app/dashboard`
3. Measure time to interactive

**Expected Results:**
- [ ] Initial render: < 100ms (placeholder data)
- [ ] API response: < 500ms
- [ ] Total interactive: < 1 second

### KB Suggestions Load Time
**Steps:**
1. Open ticket detail with DevTools Network tab
2. Measure KB suggestions API call

**Expected Results:**
- [ ] API call completes in < 500ms
- [ ] UI renders suggestions in < 100ms after data arrives
- [ ] Total time from page load to suggestions: < 1 second

---

## Error Handling Testing

### Network Errors
**Steps:**
1. Open DevTools
2. Throttle network to "Offline"
3. Try to add a comment

**Expected Results:**
- [ ] Shows error message
- [ ] Does not crash
- [ ] User can retry after reconnecting

### Invalid Data
**Steps:**
1. Try to submit empty comment
2. Try to link article to non-existent ticket

**Expected Results:**
- [ ] Validation prevents submission
- [ ] Clear error messages
- [ ] UI remains functional

---

## Accessibility Testing

### Keyboard Navigation
**Steps:**
1. Use only Tab, Enter, and Arrow keys
2. Navigate through dashboard stats
3. Navigate through comments section
4. Navigate through KB suggestions

**Expected Results:**
- [ ] All interactive elements are focusable
- [ ] Focus indicators are visible
- [ ] Can activate buttons with Enter/Space
- [ ] Logical tab order

### Screen Reader
**Steps:**
1. Enable screen reader (NVDA/JAWS/VoiceOver)
2. Navigate through all three features

**Expected Results:**
- [ ] Stat cards announce value and trend
- [ ] Comments announce author and timestamp
- [ ] KB suggestions announce article title and relevance
- [ ] Buttons have clear labels

---

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on macOS)

All features should work identically across browsers.

---

## Regression Testing

Verify that existing features still work:
- [ ] Service Desk ticket list
- [ ] Ticket creation
- [ ] Ticket filtering
- [ ] Knowledge Base article list
- [ ] Navigation between views
- [ ] Authentication and logout

---

## Known Limitations

1. **Analytics Trends**: Require previous period data in database. May show 0% trend if no historical data.
2. **KB Suggestions**: Quality depends on article content and ticket description detail.
3. **Comments**: Cannot edit comments after posting (by design).

---

## Troubleshooting

### Dashboard shows mock data
- Check if backend is running on port 3001
- Check browser console for API errors
- Verify analytics endpoint is enabled in backend

### No KB suggestions appear
- Verify Knowledge Base has articles
- Check that articles are PUBLISHED status
- Verify ticket has title and description
- Check backend logs for suggestion algorithm errors

### Comments don't save
- Verify ticket exists in database
- Check authentication token is valid
- Check backend ticket comments endpoint is working

---

## Success Criteria

All three tasks are considered successful when:
- [x] All test scenarios pass
- [x] No console errors
- [x] Performance meets targets
- [x] Accessibility standards met
- [x] Works across browsers
- [x] Graceful error handling

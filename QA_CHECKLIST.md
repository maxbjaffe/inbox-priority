# Mail Muncher QA Checklist

## Core Functionality (Baseline)
- [ ] App loads and authenticates via Google OAuth
- [ ] Emails fetch and display with AI analysis
- [ ] Date range filter works (today, yesterday, 7d, 30d, 60d, 90d)
- [ ] Refresh button fetches new emails
- [ ] Mark as read works (email removed from list)
- [ ] Archive works (email removed from list)
- [ ] Task button opens due date modal
- [ ] Due date options work (Today, Tomorrow, Custom, No date)
- [ ] Todoist task created successfully
- [ ] Open in Gmail button works
- [ ] Toast notifications appear for success/error
- [ ] Loading state displays correctly
- [ ] Empty state displays when no emails
- [ ] Error state with retry button works

## Multi-Select Mode (Baseline)
- [ ] Long-press enters select mode
- [ ] Checkboxes appear in select mode
- [ ] Tapping card toggles selection
- [ ] Selected cards have blue ring
- [ ] Cancel exits select mode
- [ ] Select All / Deselect All works
- [ ] Bulk Mark Read works
- [ ] Bulk Archive works
- [ ] Bulk Task opens due date modal
- [ ] Bulk task creates multiple tasks

## Phase 1 Features

### Pull-to-Refresh
- [ ] Pull down gesture triggers refresh
- [ ] Loading indicator appears during pull
- [ ] Emails reload after pull
- [ ] Works alongside existing refresh button

### Undo Action
- [ ] Undo button appears in toast after mark read
- [ ] Undo button appears in toast after archive
- [ ] Clicking undo restores email to list
- [ ] Toast auto-dismisses after 5 seconds
- [ ] Undo disabled after timeout

### Swipe Gestures
- [ ] Swipe left reveals archive action
- [ ] Swipe right reveals mark read action
- [ ] Full swipe triggers action
- [ ] Partial swipe snaps back
- [ ] Disabled in select mode
- [ ] Works with touch and mouse

### Email Expansion
- [ ] Tap card expands to show full body
- [ ] Expanded view shows formatted content
- [ ] Tap again or X closes expansion
- [ ] Actions still work in expanded view
- [ ] Disabled in select mode

## Build Verification
- [ ] TypeScript compiles without errors
- [ ] Production build succeeds
- [ ] No console errors in browser

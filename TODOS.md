# TODOS

## Sending to friends

### New link for a friend

**What:** A "New link" action on a friend that replaces their link token, so the old `/f/<token>` link stops working.

**Why:** Each friend's link works forever. If one gets forwarded, whoever has it can see that friend's picks and answer as them, and today there's no way to shut it off.

**Context:** Deferred from v1 of send-to-a-friend (Approach C; Approach B's revoke was left out on purpose). Tokens live in `friends.token` (32 hex characters). Start with one update that sets a new random token, then a button on the film page's "Sent to" row or a small friends list. The friend page already shows "This link doesn't work anymore" when `get_friend_page` returns null, so the old link is handled. Test: the old token returns null and the new one loads the same picks.

**Effort:** S
**Priority:** P3
**Depends on:** send-to-a-friend v1 shipped

### Rich link preview for friend links

**What:** When a friend link is pasted into WhatsApp, show "<Film>, picked for <Friend>" and the poster instead of the app's generic title.

**Why:** This is a client-rendered app, and link readers like WhatsApp's don't run JavaScript, so every friend link previews as the same plain page.

**Context:** `vercel.json` rewrites every path to `index.html`, which only has charset and viewport meta tags. Start with a Vercel function routed for `/f/*` that calls `get_friend_page(token)` and returns HTML with Open Graph `og:title` and `og:image` (newest pick's poster), then serves or redirects to the app. Keep the token out of logs. It would be the app's first server code.

**Effort:** M
**Priority:** P4
**Depends on:** send-to-a-friend v1 shipped

## Completed

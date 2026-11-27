# Account submission notifications — 27/11/2026

Removed the static community/update promotional notification panel and demo label. The replacement reads authenticated `GET /api/v1/me/submissions?page=1&size=20`, filters to the current account and terminal judging states, and shows the actual problem, verdict, tests, language and server timestamp. No synthetic results are generated. Under local mocks, the same API naturally returns fixture results rather than production records.

Unread identity includes submission ID and verdict. IDs are stored per user in localStorage, bounded at 300. This is a browser-local reading preference, not a synchronized server inbox. Clicking a result opens its problem without changing its draft. Notifications are derived from the latest 20 submissions, not a permanent event archive.

Refresh runs each minute while visible, on focus/visibility return, or manually. Requests are abortable with a 15-second timeout and do not overlap. Role/account changes unmount the prior instance. Network errors remain visible and do not create fake empty/success messages.

Backend snapshot has no user-facing notification listing, read-state persistence, push subscription or social notification handlers. Internal worker enqueue notifications are not a user inbox API. Comment/reply/mention events and cross-device unread synchronization still require backend tables and endpoints.

No production account mutation or browser notification permission request is made by this implementation.

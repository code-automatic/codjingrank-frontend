# Community UI review — 26/11/2026

## Implemented

- Compact discovery banners, clearer selected category tabs and a plus icon on the write action.
- Separate bordered article cards with gentle pointer lift, stronger hover shadow and accent edge; keyboard focus stays stationary. All movement respects reduced-motion.
- Two-line plain-text preview from the optional list excerpt; no background detail fetches that would increase view counts.
- Language, topic and difficulty chips from catalog metadata, with a real problem slug link where the problem is found.
- Question badge in amber, solution badge in green, deterministic readable avatar colors and relative time with full timestamp tooltip.
- Like/unlike on the feed through the existing API, disabled/loading/error handling, 15-second deadline and synchronized notable-post counts. A subtle heart response follows the liked state. Comments link directly to the detail comments section.
- Custom filter menus with native details disclosure, listbox choices, Arrow/Home/End/Escape support, outside-pointer dismissal and focus return.
- Current-page unanswered filter explicitly labeled as such, with matching count. Existing server search/type/sort/pagination remain intact.
- Distinct global problem search placeholder versus the local post search label.
- Skeleton list, empty illustration/message and clear reset action.
- Notable-post medal badges and a sticky, viewport-bounded rail; authors are labeled as contributors on this page, not a fabricated global ranking. Mobile moves the rail below the feed.
- Sidebar initials now match the displayed full name (Trung Hieu → TH).
- Light shell clips instead of becoming a hidden scroll container, preventing focus/scroll-into-view from pulling the toolbar above the viewport.

## API limits and deployment

The current post summary only contains identifiers and counters. The mock now includes an optional `excerpt` string derived from the published post's original Markdown (first 1000 characters); the frontend strips Markdown/code and clamps the visible preview. The adapter remains compatible with older responses: if excerpt is absent, show a read-content link. The real backend must return this optional field for previews in deployment. Reading a detail endpoint increments viewCount, so it is deliberately not used for feed previews. An HTTP regression test verifies listing excerpts does not increment view counts.

Resolved/accepted-answer fields and mutation endpoints do not exist in the current API. No resolved label or author action was fabricated. Backend must define this contract before a persistent “Đã giải quyết” flow can ship.

Catalog tags/languages use existing authenticated endpoints. Problem metadata currently comes from the first 100 catalog items; unavailable or inaccessible metadata is omitted, never guessed from titles. A scalable backend summary should embed the related problem slug/tags/difficulty for complete coverage in large catalogs. The unanswered chip filters only the current server page and does not pretend to be a global query.

The mock was restarted to serve the excerpt addition. Its data remains illustrative, not real account activity. No API permissions were widened. No GitHub push/merge.

## Changed files in this iteration

- features/forum/ForumPage.tsx
- features/forum/ForumSelect.tsx (new)
- features/forum/presentation.ts (new)
- features/forum/forum.module.css
- features/forum/ForumPostPage.tsx (comments anchor)
- features/platform/AppChrome.tsx (initials/search label)
- app/product-system.css (clip the outer light shell)
- lib/api/types.ts (optional excerpt)
- lib/api/adapters/community.ts (backward-compatible excerpt adaptation)
- scripts/forum-demo.mjs (derived preview field)
- tests/forum-presentation.test.ts (new)
- tests/forum-http.test.mjs (view-count regression)
- DESIGN.md and this report

## Verification

Lint and production build passed. Forum/model/resource, actual mock HTTP and presentation suites passed: 29 tests across 3 files. Manual Chromium checks: light/dark, current-page unanswered filter, server sort with keyboard dropdown, like/unlike and rail update, empty search and reset, full-name initials and a 375px viewport. Mobile fits horizontally and the right rail is static below the feed. Browser checks used the mock and resized viewport, not a deployed backend, physical touch device or Safari/Firefox. No complete WCAG/performance audit was performed.

Evidence directory: C:/Users/Administrator/.codex/visualizations/2026/11/18/01a1ed46-5cba-7161-87fa-304a4b7c015e/community-refresh/ (light.png, dark.png, mobile.png). Localhost:3000/forum remains available for review.

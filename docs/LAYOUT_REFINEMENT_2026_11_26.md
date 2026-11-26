# Layout refinement — 26/11/2026

## Delivered

- Problems and package catalog use one centered column capped at 1100px. Removed secondary catalog navigation and calendar/challenge rails. Removed redundant problems banners.
- Problem table has one outer border, horizontal separators, a narrow status column and approximately 50/25/25 content proportions. Easy is a rounded success badge. Selected topic uses teal/white.
- Shared FilterSelect extracted from the community implementation; catalog filters support Arrow keys, Home/End, Escape and pointer-outside closing. Reset action remains visible and disables when no filters are active. Existing query routing, Enter search and pagination remain.
- Dashboard metrics have equal 144px minimum height, inline day units and bottom-aligned captions. Two introduction cards have matching top-right icons and descriptions; their stacked group matches calendar height. Calendar legend is 12px. Feed padding is reduced and resting rows share one background.
- Package cards show solved/total progress from the existing authenticated package-level endpoint. A 15-second deadline bounds loading; failure directs users to the package instead of showing invented progress. Badge/action remain aligned on desktop and mobile.
- Community banners are compact, title/action aligned on desktop and the notable rail starts at the heading edge. Existing two-line excerpts and article metadata remain.
- Ranking trophy/practice links are compact; filters have three balanced columns. Podium has visible bases, first place tallest, equal ranks at equal heights without changing server ranking. Removed duplicate compact list. Personal metrics use three equal cells; numeric table headers align right.
- Sidebar menu rows are 44px with matching radii; footer controls are 44px with 10px gaps. Existing active navigation connection remains.
- Both palettes and existing interaction/reduced-motion behavior remain; landing, authentication, intro and code editor are outside this refinement.

## Validation

- ESLint passed.
- 300 tests passed across 26 files. An initial run alongside the production build exceeded mock-startup timeouts; rerun passed. The initial presentational catalog render failure was corrected by passing the API client from its authenticated parent.
- Production build passed after the final CSS changes.
- Impeccable detector returned no findings for the changed targets.
- Browser checks used localhost:3000 and the actual production server on localhost:3001, desktop 1280px and mobile 375px. Verified light/dark materials, catalog filter keyboard/pointer selection and clearing, package progress, community title/rail/banner composition, tied ranking podium and right-aligned numeric columns. Mobile catalog/community document width remained 375px without outer horizontal overflow; table retains its own horizontal scroller.
- Confirmed dashboard metric heights 144px and introduction-group/calendar matching heights 466px at the checked desktop size. Calendar legend computed size is 12px.
- No new backend endpoint required. Validation uses local mock data; live backend, Safari/Firefox, physical devices and full accessibility certification were not checked.

## Changed files

- app/product-system.css
- features/platform/AppChrome.tsx
- features/platform/DashboardPage.tsx
- features/platform/PracticeAside.tsx
- features/platform/ProblemTable.tsx
- features/catalog/ProblemsDirectoryPage.tsx
- features/catalog/PackagesCatalogPage.tsx
- features/catalog/CatalogSections.tsx
- lib/ui/FilterSelect.tsx
- features/forum/ForumSelect.tsx
- features/forum/forum.module.css
- features/leaderboard/LeaderboardPage.tsx
- features/leaderboard/leaderboard.module.css
- DESIGN.md
- docs/LAYOUT_REFINEMENT_2026_11_26.md

Evidence is stored in the workspace visualization directory under layout-refinement. No push or merge performed for this revision. Existing generated files and unrelated untracked assets remain untouched.

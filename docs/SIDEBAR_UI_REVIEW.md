# Vertical navigation and meteor background

## Latest V10 correction

The following supersedes the original always-wide sidebar description below. Reference: https://www.tiktok.com/@paulcodes4/video/7711257600326716693, actually viewed in browser. Default is now a compact 76px glass capsule rail with circular icons, an expand/collapse control, native title tooltips and accessible labels. Expanded mode is 228px with logo and labels. Search expands and focuses the input.

Removed duplicate footer profile/name, the inline notifications/streak/theme cluster, duplicate mobile meteor pause and account shortcuts repeating main navigation. Three footer destinations remain: Appearance, Pro, Account. All functions remain reachable: appearance popup contains the existing theme switch, system mode and meteor toggle; account popup contains profile, solved problems, notifications, streak and sign-out.

Changed AppChrome.tsx and sidebar-ui.css; added next.config.ts to request development-indicator placement away from the rail. Bottom rail clearance prevents the Next.js overlay from intercepting account clicks during localhost review. Existing dev-tool user preferences can affect indicator position.

Checked light/dark collapsed/expanded visually, native account popup by pointer, search auto-focus, theme by Space, popup Escape and mobile 375px with no horizontal overflow. Meteor pause sets the background layer to display:none and resumes correctly. Final production build and lint checked. No physical-device/Safari testing or fresh video recording. Evidence: sidebar-v10-collapsed.png, sidebar-v10-expanded.png and sidebar-v10-mobile-settings.png in the artifact directory below. Earlier test counts belong to the earlier iteration, not a fresh automated run for this revision.

25/11/2026. Local review; no push/merge.

## Changes

- AppChrome: vertical navigation with shared icons, existing search, notifications, streak, theme, profile and Pro demo. Profile shortcut and ambient-motion pause added. No API or authorization changes.
- app/sidebar-ui.css: inset sidebar, content area, mobile adaptation, popover placement and higher-opacity card surfaces. Catalog no longer repeats a second library sidebar; its solved/package/topic filters remain in the existing filter controls.
- Three sparse CSS meteor trails run behind content and cannot intercept input. Their phases differ. Pause is available in the sidebar footer and mobile menu; reduced-motion/high contrast hide the decoration. Motion does not move code or data.
- app/layout.tsx loads the scoped stylesheet; DESIGN.md records the direction.

## Reference

Actually opened and visually inspected Paulcodes Admin Dashboard V2 at https://www.tiktok.com/@paulcodes4/video/7704385121754926357. Applied vertical navigation and layered panel organization to the existing Codjingrank content. No source copied or new analytics invented.

## Scope and checks

Sidebar applies to Overview, catalog, packages, forum, ranking, profile and Pro demo through AppChrome. The coding workspace and AI retain their specialized toolbars; landing and auth are unchanged.

Production build passed, lint passed before final spacing edits and rerun afterward. Relevant catalog/forum/ranking tests run. Browser checks on localhost: successful mock login; desktop light/dark inspected; all four main navigation destinations verified after URL transition with no page overflow. Mobile 375px inspected on Ranking, no horizontal overflow, native navigation popover works and includes pause. Pause toggles the meteor layer to display:none; restoring it resumes the effect. Sidebar spacing adjusted to keep bottom controls visible at the inspected desktop height.

Artifacts in C:/Users/Administrator/.codex/visualizations/2026/11/18/01a1ed46-5cba-7161-87fa-304a4b7c015e/: sidebar-desktop-dark.png, sidebar-desktop-light.png, sidebar-mobile-menu.png.

Limits: mock backend, Chromium desktop/mobile emulation only. No physical-device, Safari, full WCAG or low-end FPS benchmark. Reduced-motion behavior implemented by media query, not re-emulated in this iteration. No video recorded for this iteration. Sidebar can scroll vertically on unusually short windows so controls remain reachable.

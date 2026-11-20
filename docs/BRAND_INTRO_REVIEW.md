# Brand intro — 2026-11-20

Implemented the requested first-visit logo reveal using the existing BrandLogo masks and teal token. CSS reveals the original mark, fades/translates the wordmark by 6px, then fades the fixed overlay out by 1400ms. No asset redesign, dependencies, redirects, content suspension or layout changes.

Root layout emits a trusted static initialization script after theme initialization. sessionStorage key codjingrank-brand-intro-v1 records the visit before hydration. Repeat loads and SPA navigation skip the intro. Reduced motion skips it; denied storage fails open. A 1600ms script deadline removes the activation attribute independently of React and a CSS exit also hides the layer. Pointer events pass through. Slow responses can skip the intro when the deadline has already elapsed.

The theme-switch transition reset excludes only the decorative intro subtree so ThemeSync cannot cancel its timeline during startup. Theme palettes and other transitions remain unchanged.

Validation: production build, lint and all 291 tests passed. Chrome production capture verified first visit, completion, reload skip, dark background rgb(30,30,46), direct /login route, mobile 390x844 fit, reduced-motion skip and no runtime exceptions. Recording and report: visualization directory brand-intro. Domain deployment has not been performed; assets use the existing root-relative brand paths, consistent with this application's root deployment.

Files: app/layout.tsx, app/motion.css, lib/ui/BrandIntro.tsx, lib/ui/BrandIntro.module.css, lib/ui/brand-intro-init.ts, tests/brand-intro.test.ts, docs/BRAND_INTRO_REVIEW.md.

## Updated direction — white cinematic reveal

Supersedes the theme-matched background and separate wordmark entrance above, following the user's latest explicit request. The intro now uses pure white in both themes, a dark readable wordmark and the unchanged teal mark. The complete logo is 560px wide on desktop, capped at viewport minus 48px on mobile, centered in the overlay. A single 900ms linear clip reveal runs left to right over the full logo while opacity increases; no independent vertical text motion. Total exit remains 1400ms. Production build passed again. Chrome verified white rgb(255,255,255) even with dark preference, desktop width 560px and vertical center 450px in a 900px viewport, mobile fit, repeat-visit skip and reduced-motion skip. No runtime exceptions. Updated recording: codjingrank-intro-white.mp4.

Latest timing adjustment: 2000ms total, 1200ms left-to-right reveal, 2200ms independent cleanup deadline, per user request.

Slow-load fix: the 2200ms cleanup deadline and session seen marker now begin on the overlay animationstart event, rather than head-script execution. Window load provides a fail-open fallback when animation never starts. Production build and lint passed; five lifecycle tests passed. Chrome with stylesheet requests delayed 4500ms confirmed no seen marker or animation at 3000ms, actual animation start at 4659ms with seen recorded then, normal cleanup afterwards and no runtime errors. Local dev on port 3000 was verified to serve the updated script and overlay.

Replay support: user video showed landing entry without intro in an existing tab. Added explicit ?intro=1 replay, bypassing the seen marker while retaining reduced-motion behavior and the normal once-per-tab policy. Six lifecycle tests and production build passed. Chrome on localhost:3000 verified replay with preexisting seen marker, white background, cleanup, normal URL skipping afterwards and no runtime errors. This is an explicit test URL and remains in the address bar; remove intro=1 to restore normal once-per-session navigation.

Final behavior supersedes session and replay rules: following the latest moi.mp4 reference and explicit user direction, every full document load now shows a white pending overlay, waits for window load, then runs the 2000ms reveal/exit. SPA navigation does not rerun the head script. Session flags and query handling were removed; direct URLs remain intact. Both original logo mask assets are preloaded so the document load includes their requests. Reduced motion skips the overlay; a 30-second fail-open deadline prevents indefinite cover for stalled resources. Five revised lifecycle tests, lint and production build passed. Chrome stylesheet delay 4500ms showed no early animation, start at 4961ms with readyState complete, cleanup, replay on plain reload, no replay on SPA navigation, no runtime exceptions. Local dev port 3000 verified updated script with pending state and no session guard.

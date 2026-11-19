# Brand intro — 2026-11-20

Implemented the requested first-visit logo reveal using the existing BrandLogo masks and teal token. CSS reveals the original mark, fades/translates the wordmark by 6px, then fades the fixed overlay out by 1400ms. No asset redesign, dependencies, redirects, content suspension or layout changes.

Root layout emits a trusted static initialization script after theme initialization. sessionStorage key codjingrank-brand-intro-v1 records the visit before hydration. Repeat loads and SPA navigation skip the intro. Reduced motion skips it; denied storage fails open. A 1600ms script deadline removes the activation attribute independently of React and a CSS exit also hides the layer. Pointer events pass through. Slow responses can skip the intro when the deadline has already elapsed.

The theme-switch transition reset excludes only the decorative intro subtree so ThemeSync cannot cancel its timeline during startup. Theme palettes and other transitions remain unchanged.

Validation: production build, lint and all 291 tests passed. Chrome production capture verified first visit, completion, reload skip, dark background rgb(30,30,46), direct /login route, mobile 390x844 fit, reduced-motion skip and no runtime exceptions. Recording and report: visualization directory brand-intro. Domain deployment has not been performed; assets use the existing root-relative brand paths, consistent with this application's root deployment.

Files: app/layout.tsx, app/motion.css, lib/ui/BrandIntro.tsx, lib/ui/BrandIntro.module.css, lib/ui/brand-intro-init.ts, tests/brand-intro.test.ts, docs/BRAND_INTRO_REVIEW.md.

## Updated direction — white cinematic reveal

Supersedes the theme-matched background and separate wordmark entrance above, following the user's latest explicit request. The intro now uses pure white in both themes, a dark readable wordmark and the unchanged teal mark. The complete logo is 560px wide on desktop, capped at viewport minus 48px on mobile, centered in the overlay. A single 900ms linear clip reveal runs left to right over the full logo while opacity increases; no independent vertical text motion. Total exit remains 1400ms. Production build passed again. Chrome verified white rgb(255,255,255) even with dark preference, desktop width 560px and vertical center 450px in a 900px viewport, mobile fit, repeat-visit skip and reduced-motion skip. No runtime exceptions. Updated recording: codjingrank-intro-white.mp4.

Latest timing adjustment: 2000ms total, 1200ms left-to-right reveal, 2200ms independent cleanup deadline, per user request.

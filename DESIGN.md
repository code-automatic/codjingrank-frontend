# Codjingrank UI — HackerRank auth / LeetCode workspace

## Sidebar seam and opening motion — 26/11/2026

Active navigation extends 1px into the shell to eliminate fractional gaps. Two 18px radial inverse corners replace cropped half-shadow joins; reset the legacy after-pseudo left/transform/display rules. A neutral white/Mocha left-edge gradient matches the active connection while retaining the existing glass material farther inside the shell. Remove the vertical inset rim at that seam and prevent pressed active links from moving. Pointer expansion reveals labels by 6px/opacity and connector corners by opacity over 180ms with the existing motion-feedback curve; keyboard and reduced-motion remain immediate. Logo, data and content are not scaled. Verified light/dark, collapse/expand and keyboard activation in the local browser. No push or merge.

## Layout refinement — 26/11/2026

Owner-requested refinement preserves the current glass materials and both theme palettes. Catalog routes now use one centered reading column capped at 1100px, without secondary navigation/calendar rails or redundant problem banners. Shared keyboard-accessible FilterSelect replaces catalog native filters, with a visible reset action. Problem tables retain one outer border, fixed column proportions and difficulty badges. Package cards show actual server progress from getPackageLevels, with a deadline and a neutral fallback on failure. Dashboard metrics share a 144px minimum height with inline units and bottom-aligned captions; two stacked introduction cards match the calendar height. Community banners are compact, heading/action/rail aligned, existing excerpts retained. Ranking uses compact practice links, balanced filters, equal personal metrics and a real-height podium; equal server ranks keep equal pedestal heights. Duplicate compact ranking rows are removed. Sidebar controls share 44px height and 10px spacing. Mobile pagination stays on one row. Validation and changed files: docs/LAYOUT_REFINEMENT_2026_11_26.md. No push or merge in this revision.

## CRM V10 application system — 25/11/2026

Toolbar blending correction: shared topbar now has transparent background, no full-width inset shadow and no backdrop blur, so its background continues the content shell in both themes. Search/bell/streak retain their own translucent control surfaces. Expanded active navigation bridge is reduced from 36px to 32px after browser geometry found a 3.2px intrusion into the content shell. Verified no positive overlap, toolbar/content edges meet at y=88, and outer shell/window stay stationary while scrolling.

Dark/light layout parity 26/11: both modes now use the same viewport-bounded .platform-shell, rounded clipping, independent content scrolling, stationary toolbar, connected active navigation and meteor containment. Dark uses Mocha shell/sidebar surfaces with a muted reflective control rim; its existing text/accent palette remains. Shared mobile rules keep the compact header and scroller inside the viewport in both modes. This supersedes the earlier dark display:contents exception. Sidebar collapse/expand, dark bottom scrolling and 375px geometry verified (window and shell scroll remain zero; only content scrolls).

Community refresh 26/11: compact banners, independent article cards with two-line excerpts, real problem/language/difficulty chips, timestamp tooltips and relative time, name-based avatar tones, distinct question/solution badges and clear selected tabs. Like/unlike uses the existing API with loading, deadline and error states and synchronizes the rail counts. Custom details/listbox filters support arrows/Home/End/Escape. Unanswered chip explicitly filters the current page. Existing server pagination remains. Skeleton/empty states, ranked rail badges and current-page authors complete the layout. Global avatar initials derive from the displayed full name. Light shell uses overflow:clip so focus cannot scroll the shell and hide the toolbar. Optional list excerpt is derived from original content in the mock; real backend must add excerpt and resolved metadata (see docs/COMMUNITY_UI_REVIEW.md). No guessed resolved state.

Ranking light-only correction 26/11: replace saturated orange/purple practice artwork backgrounds with cream/peach and pale lavender/blue gradients. Light cube faces keep clear white edges, softer core shadows and restrained orbit highlights; trophy gold is softened locally. Caption foregrounds and interactions remain intact. Dark gradients verified unchanged in-browser. Source: features/leaderboard/leaderboard.module.css. Evidence: crm-v10/ranking-light-soft.png.

Owner update 26/11: eight staggered meteor trails replace three; transform/opacity-only CSS and existing pause/reduced-motion controls remain. Light toolbar/search/activity controls use neutral translucent silver rather than mint glass. New visitors without a stored preference start in light, including under a dark OS. Saved dark/light choices remain honored. Explicit system preference is now stored as "system" so it survives reload instead of being confused with the new light default. Auth keeps its fixed-dark palette. Theme initialization tests updated: eight pass.

Toolbar material 26/11: owner-supplied V24 image informs gloss, not its coral palette. Light shell white opacity is reduced modestly; toolbar/search/bell/streak receive translucent neutral gradients, inset reflective edges and soft offset shadows. Search focus retains teal border/outline. Dark untouched. No moving reflection across text. Browser search Enter and layout fit verified; evidence crm-v10/light-gloss-toolbar.png. Source: app/product-system.css.

Light material refinement 26/11: soften the white shell with a translucent white/mint gradient, static highlight at the upper edge and inset reflective rim. Move the existing three-trail meteor layer into the shell, positioned behind content and clipped to its rounded bounds in light. Dark retains fixed meteor positioning and its palette. No density increase, dynamic blur or code/data motion. Pause/resume verified; reduced-motion/high-contrast hiding retained, reduced-transparency uses an opaque shell. Evidence: crm-v10/light-gloss-meteors.png.

Containment correction: light now uses a real .platform-shell flex container with viewport-bounded height, rounded clipping and an independent scrollable content area below the fixed toolbar. The previous fixed white pseudo-background no longer pretends to contain document scrolling. Catalog scrolls as one library region; other application routes scroll inside #platform-content. Path changes reset the internal scroller. Dark retains display:contents shell and its existing scroll behavior. Expanded active navigation reaches the shell with two 16px concave corners instead of a shifted white box shadow. Verified bottom of catalog, route reset, sidebar collapse/expand and 375px viewport.

Latest owner correction supersedes the mint-canvas refinement: light uses an emerald glass navigation/background framing one inset white rounded reading surface. Active expanded navigation visually connects to the reading surface. Navigation starts expanded and retains the collapse control. Mobile uses the compact green header and white content, with labels hidden on toolbar icon controls. Both themes have a short opacity-only initial application reveal (220ms, reduced-motion disabled); dark palette is unchanged. The five-second TikTok reference was reopened and its dashboard frame viewed during this correction. Source changes: AppChrome.tsx and product-system.css.

Owner refinement: light canvas now blends neutral Latte and white into a soft mint field on the right, with a lightly tinted frosted navigation rail. Dark palette remains unchanged. Both themes share compact card lift, icon response, press and focus feedback, with reduced-motion overrides; data and code remain stationary. Implemented in app/product-system.css. Mock/dev restarted on localhost:3000 and localhost:4010.

This revision supersedes the green application palette and translucent reading panels below. The Paulcodes CRM Dashboard V10 video (7711621907019238676) was opened and viewed: compact navigation, a horizontal metrics strip and a neutral workspace with white cards inform the organization, using Codjingrank learning data instead of CRM content. Light uses Latte canvas #eff1f5, white panels and teal #087f78 actions. Dark restores the palette verified in f63a967: crust #11111b, mantle #181825, base #1e1e2e, text #cdd6f4 and mauve #cba6f7. Product surfaces are scoped to the application, workspace and AI review; landing, auth, media and transitions retain their current design.

Dashboard adds four factual metrics through the existing stats API, then compact learning/community cards beside the practice calendar. Sidebar, search, filters, tables, dialogs and reading panels share the new semantic tokens. Frosting is restrained to navigation/overlays; reading panels use opaque surfaces and a static rim. No width animation on sidebar or blur animation. Existing reduced-motion, meteor pause and native popover behavior remain. Validation and screenshots: docs/CRM_V10_REVIEW.md.

Latest toolbar finish: remove the top utility bar's bottom divider and solid surface; transparent background with retained backdrop blur blends into the application canvas. Search and activity controls keep their positions and borders. Scoped change in app/sidebar-ui.css; no behavior change.

## Top utility bar — latest placement request

Search, notifications and practice streak now live in one sticky toolbar above the application content, in that order, matching the supplied reference layout. Search expands to 680px on desktop and flexes on mobile. Removed sidebar search and account-menu notification/streak duplicates. Existing Enter submission, real stats and native popovers retained. Notifications/streak open below the upper-right controls; on mobile the popup is inset from both viewport edges. Sidebar V10 and fixed-dark auth unchanged. Changed AppChrome.tsx and sidebar-ui.css. Local checks: Enter routes to /problems?q=sum, each control appears once, both popovers open/Escape, mobile 375px fits. Lint/production build pass; last mobile popup inset is a CSS-only correction.

## Glassy Sidebar V10 revision — latest

Reference actually viewed: https://www.tiktok.com/@paulcodes4/video/7711257600326716693. Default desktop sidebar is now a 76px capsule rail, expandable to 228px. Circular icon controls and a solid active state replace the previous always-wide menu. Navigation links keep accessible labels and titles. Search expands the rail and focuses its real input. Footer is reduced to Appearance, Pro and one account trigger; removed the duplicate standalone username/profile link, inline theme/streak/notifications cluster and redundant account shortcuts for routes already in primary navigation. Appearance owns the existing #447 theme switch, system preference action and meteor pause; account owns profile, solved problems, notifications, streak and sign-out. Mobile keeps a compact header with navigation, appearance and account. Native popovers and keyboard behavior retained. No paid source copied and no pixel-identical/source-equivalent claim.

Files: features/platform/AppChrome.tsx, app/sidebar-ui.css, next.config.ts (development indicator placement), this document and docs/SIDEBAR_UI_REVIEW.md. Localhost checks cover collapsed/expanded, light/dark, search focus, Space/Escape, account popover, mobile 375px and pause/resume. Sidebar includes bottom clearance for development overlays. Landing/auth/workspace content unchanged.

## Vertical application navigation and ambient meteors — latest

After-login AppChrome uses a fixed 228px inset glass sidebar, icon/label navigation, search and a compact tool/account area. Mobile <=800px retains a sticky compact header and native popover navigation. Workspace and AI retain their task-specific toolbars; landing and fixed-dark auth are unchanged. Content panels are more opaque with defined edges, inset light and offset shadows to improve legibility. A sparse three-trail CSS meteor layer runs behind the content, with staggered 11-second cycles and no pointer interaction. Desktop/footer and mobile-menu pause controls stop the decoration; reduced-motion/high-contrast disable it. No moving data or code. Reference actually viewed: Paulcodes Admin Dashboard V2, https://www.tiktok.com/@paulcodes4/video/7704385121754926357. Own CSS implementation, no paid source copied. Files: features/platform/AppChrome.tsx, app/sidebar-ui.css, app/layout.tsx. Visual checks: desktop light/dark, mobile 375px/menu, route navigation and pause. Details: docs/SIDEBAR_UI_REVIEW.md.

## Auth fixed-dark / compact switch — latest owner revision

Auth forms now have their own fixed dark semantic palette and color-scheme without mutating the saved application theme. Removed ThemeToggle from AuthForm and PasswordRecovery. After login #447 is softened to teal/mint with a muted sun, visually reduced to ~70×30 inside a native 72×44 switch hit target. The native button now wraps the scaled decorative canvas so keyboard semantics and full touch area are retained. Cloud/star and rolling motion remain. The owner explicitly requested this palette/size adaptation, superseding original-color preservation. Verified auth dark with the application preference light (zero auth switches), login and desktop app appearance; lint/build pass.

## Lucian #447 day/night switch — latest

Replaces the earlier crescent pill with the exact #447 sky/cloud/star/crater shapes and original transition curves/durations fetched from Lucian. Intrinsic control remains 176×74; a 0.6 scale fits the existing compact toolbar slot (106×48), preserving proportions and a roughly 44px rendered hit target. Gallery 340×300 wrapper is not included. Sky illustration colors intentionally do not depend on the page palette, per the supplied element; focus uses the project semantic token. Native role=switch/aria-checked is wired to the existing theme preference store rather than the sample DOM script. Reduced motion freezes decorative drift/twinkle and applies final state instantly. Existing keyboard, storage, system sync and theme placement remain. MIT notice lives in THIRD_PARTY_NOTICES.md under the no-code-comments project requirement.

## Theme pill control — 25/11/2026

The user's seven-second Lucian recording shows a compact pill with a crescent, but no theme click sequence. ThemeToggle now uses that visible silhouette: 64px-wide control with a 44px hit target, sliding sun/moon and a 200ms transition disabled under reduced-motion. Existing aria-pressed, labels, native keyboard behavior, preference persistence and system sync remain unchanged. Added directly to the desktop app header; narrow screens retain theme radios in the account menu to avoid hiding existing tools. Auth, workspace and AI use the same shared toggle. Landing is unchanged. Checked light/dark switching visually on localhost; lint and production build pass.

## Auth cinematic correction — latest owner clarification

The requested asset is the original moving laptop/UI video, recolored teal, not the flat SVG reconstruction. AuthMotion now plays local auth-workspace-teal.mp4 with a generated poster, muted/loop/playsInline. Media fills the background behind a readable right-side glass form and left-side branding, following the supplied composition. Hidden-tab/reduced-motion/mobile pause behavior remains; no new form controls or backend behavior. The vector-scene decision below is superseded. Native source resolution is retained, so this is not resolution-independent SVG. Verified localhost appearance and lint/build. No push/merge.

## Auth vector scene — latest 25/11/2026

Replaces the Pinterest video with an original SVG workspace illustration. The code window, roadmap note and sample-output panel inherit the exact auth semantic tokens in both themes. CSS entrance sequence and path drawing explain the practice workflow; there is no moving real form or fake submission. Motion settles after the entrance/caret sequence, reduced-motion shows the complete static scene, mobile hides the decorative scene. No raster scaling, external media requests, new libraries or copied video frames. SVG layout is authored geometry, not a conversion of the reference video. Files: features/auth/AuthMotion.tsx, auth-scene.css and app/layout.tsx. Lint and production build verified; desktop light/dark visually inspected. No claim of testing every display/device or absolute pixel perfection. Existing intro, slash transition and form handlers are preserved.

## Unified teal glass system — 25/11/2026

Latest owner direction supersedes the Catppuccin-only constraint for auth/application surfaces. Landing stays unchanged and supplies the teal identity (#087f78), with warm green-white light surfaces and deep green dark surfaces. The app, auth, workspace and AI inherit one semantic token contract through app/unified-ui.css; status colors retain meaning. Existing functional components remain wired to real handlers. Auth is recomposed into an inset video panel and branded glass form with visible labels; the requested Pinterest UI showcase replaces the clock media. Logo intro and auth slash transitions are unchanged. Evidence and limitations: docs/UNIFIED_UI_REVIEW.md.

## Glass UI sau đăng nhập — 25/11/2026

Theo yêu cầu mới, vật liệu của ứng dụng sau đăng nhập chuyển sang kính mờ, tham khảo glassyui.com. Nền teal/mauve/lavender lấy từ Catppuccin, tấm kính xuyên nền 74%, control 68%, bề mặt đọc/code 94%. Header 86% và blur 22px giữ điều hướng rõ khi cuộn. Viền bắt sáng và bóng có độ lệch tạo chiều sâu; chuyển động phản hồi đã có được giữ lại, không animate blur/nền khi đọc. Không đổi logo, palette, landing hoặc auth. CSS viết riêng, không nhập thư viện GlassyUI hay WebGL/refraction. Giảm transparency/contrast cao chuyển bề mặt đặc; trình duyệt thiếu backdrop-filter có fallback. Quyết định này thay thế vật liệu bề mặt đặc của đợt Lucian ngay dưới, giữ cấu trúc và hành vi component. Chi tiết kiểm tra tại docs/GLASS_UI_REVIEW.md.

## Post-login component refresh — 25/11/2026

Giữ nguyên Catppuccin và nhận diện. Phạm vi là ứng dụng sau đăng nhập, workspace và trang AI; landing, intro và chuyển cảnh auth không thay đổi. Khung nội dung radius 16px, nút radius 12px và vùng bấm chính 44px; desktop tối đa 1280px, mobile một cột. Các bề mặt dùng semantic tokens hiện có, không nhập palette ngoài.

Thanh chọn dùng Lucian #416 trong Ranking và console, ánh xạ trạng thái vào React; chỉ indicator chuyển động khi click chuột, bàn phím cập nhật ngay. Nút sao chép Lucian #008 chỉ hiển thị dấu kiểm khi Clipboard API thành công. Motion không di chuyển code, bảng hoặc kết quả. Reduced-motion tắt hiệu ứng của component mới. Nguồn và giấy phép tại THIRD_PARTY_NOTICES.md; chi tiết nghiệm thu tại docs/LUCIAN_UI_REFRESH.md.

## Giao diện ứng dụng mở rộng — 19/11/2026

Mode Operate. Theo ảnh LeetCode người dùng gửi: thanh điều hướng 60px, active underline, tìm kiếm gọn, popover tài khoản dạng ô lối tắt và nhóm chọn theme. Kho bài có sidebar/bảng danh sách/cột lịch, mobile đổi thành điều hướng ngang và menu popover. Tổng quan ghép dữ liệu lộ trình/cộng đồng với bài thử thách. Giữ Catppuccin Latte/Mocha và logo gốc của ứng dụng; landing tiếp tục dùng palette riêng. Thông báo và Pro demo được người dùng chấp thuận; phần Cuộc thi đã gỡ theo yêu cầu tiếp theo, nhãn demo luôn hiện; không mô phỏng giao dịch thật. Native popover/dialog hỗ trợ Escape và light-dismiss, motion chỉ phản hồi hover/press, reduced-motion bỏ chuyển động. Không sửa controller editor, Run/Submit hoặc auth. Chi tiết và kết quả: docs/POST_LOGIN_UI_REVIEW.md.

Yêu cầu của Thịnh ngày 13/11/2026 thay thế hướng phủ mocha toàn giao diện. Tham chiếu bố cục dựa trên ảnh người dùng cung cấp; không cam kết đối chiếu từng pixel với website live.

## Thương hiệu

- Chỉ biểu tượng C, dấu >, các thanh tăng dần dùng #087f78. Chữ lấy alpha từ logo gốc để giữ đúng kiểu chữ, dùng currentColor qua mask riêng; không dùng filter toàn logo.
- Chữ màu trắng trên vùng minh họa luôn tối; bản auto dùng màu chữ theo bề mặt theme. Biểu tượng độc lập ở workspace/favicon, Apple icon nền trắng trung tính.
- Không dựng SVG phỏng đoán đường nét của raster. Asset PNG alpha giữ hình và lettering người dùng cung cấp.

## Theme

- app/theme.css là nguồn semantic tokens cho hai palette. Light: Catppuccin Latte; Dark: Catppuccin Mocha theo quyết định của team. Nguồn chính thức: https://catppuccin.com/palette/. Mauve là accent chung, xanh lá/đỏ/vàng dành cho trạng thái. Latte làm đậm các accent khi dùng làm chữ nhỏ và dùng subtext1 cho chữ phụ để giữ tương phản. Biểu tượng logo dùng chung token --brand-mark: #087f78 từ landing đến ứng dụng và workspace, độc lập palette.
- Inline trusted head script đặt data-theme trước body paint. CSS có system fallback; suppressHydrationWarning chỉ trên html để chấp nhận thuộc tính do script đặt.
- Lần đầu theo OS. Toggle lưu đúng khóa codjingrank-theme; root ThemeSync theo dõi OS khi chưa chọn và đồng bộ tab qua storage event. Storage bị chặn vẫn đổi được trong trang.
- Theme đổi bằng CSS và external store nhỏ, không thay key/remount auth/session/editor/Run/Submit; không lưu token hoặc password.
- Không animate theme, thao tác bàn phím hoặc kết quả chạy bài.

## Auth — mode Operate

- Bố cục desktop 60/40 theo ảnh HackerRank người dùng cung cấp; bên trái luôn dùng Mocha, không hiện logo theo yêu cầu cập nhật, welcome/community gần phía dưới. Form rộng tối đa 448px.
- Welcome to / Codjingrank Community; form Welcome back / Log in to Codjingrank hoặc Join us / Create a Codjingrank account. Display copy yêu cầu bằng tiếng Anh có lang=en; nhãn/hướng dẫn/lỗi tiếp tục tiếng Việt.
- Nhãn được ẩn thị giác nhưng liên kết input; placeholder không thay thế accessible label. Giữ email, username, fullName tùy chọn, password và validation contract. Không thêm OAuth/điều khoản/forgot-password giả.
- Pin Pinterest thực tế là Time machine clock painting: video đồng hồ 8 giây, không phải trái đất hay terminal code. Nguồn nằm trong public/media/SOURCES.md; app phục vụ file local, không nhúng Pinterest.
- Video H.264 24fps, bỏ audio, faststart, muted/loop/playsInline; chỉ gắn src khi desktop, motion cho phép và tab hiện. Không render lại video mỗi lần nhập form; pause/resume không reset currentTime.
- Mobile và reduced-motion dùng poster không tải MP4 ban đầu. Video lỗi có poster; autoplay bị chặn thử lại khi tương tác với trang. Không hiển thị nút phát/tạm dừng theo yêu cầu cập nhật; video tự chạy lặp khi tab hiện, giữ reduced-motion và poster mobile. Tab ẩn dừng; quay lại tự tiếp tục.
- Header và copy có overlay tối để đảm bảo tương phản trên media. Không thêm chuyển động chức năng khác.

## Workspace — mode Operate

- Tham chiếu chính: ảnh LeetCode dark người dùng gửi. Thanh trên 48px, đề/code mặc định 50/50; editor/kết quả 65/35 với tab và panel gọn.
- Separator hai trục có pointer capture, Arrow/Home/End và accessible value. Không animate kéo hay phím; mobile chuyển một cột, giữ resize chiều cao editor.
- Syntax có palette Light/Dark riêng, line numbers, caret, selection, current-line marker; giữ fallback mã dài, font metric, draft/reset/language.
- Run/Submit giữ portal/controller hiện có, kết quả không mất khi đổi tab/theme. Chỉ có Đề bài, Kết quả chạy và Bài nộp; không thêm Editorial/Premium/AI/like giả.
- Không đổi executionMode, stdin/stdout, UUID payload hoặc controller API/session của Sprint 3.

## Nguồn tham chiếu và giới hạn

- HackerRank /auth/signup trả 403 Access Denied khi truy cập bằng Chrome kiểm tra; bố cục dựa trên ảnh đính kèm.
- Pinterest pin truy cập 200 và có MP4 thực tế; nguồn được giữ cùng asset, không khẳng định quyền sở hữu hay giấy phép mới.
- Backend live và thiết bị vật lý cần nghiệm thu riêng; browser mock không chứng minh cookie rotation, JWT hoặc ownership.

## Workspace — công cụ luyện tập cập nhật 18/11/2026

- Stopwatch/Timer và cài đặt cỡ chữ ở thanh trên; popover native theo ảnh tham chiếu LeetCode, dùng semantic surface/accent của Codjingrank. Stopwatch tiếp tục khi đóng bảng; Timer báo hết giờ trong trang. Rời workspace đặt lại đồng hồ.
- Toolbar có copy, reset starter, phóng to editor và thu gọn kết quả. Panel giữ mounted để bảo toàn code, draft, language, Run/Submit. Bắt đầu Run/Submit sẽ mở lại kết quả.
- Console có Test mẫu, Kết quả chạy và Bài nộp; Test mẫu lấy từ public samples của DTO, không giả lập custom test hoặc hidden test.
- Cỡ chữ 12–16px, giữ line height 20px đồng bộ textarea/highlight/gutter. Không thêm formatter, OAuth/Premium/Editorial hoặc API chưa hỗ trợ.
- Pointer có phản hồi nhấn và mở popup nhẹ; phím, theme, thao tác code và kết quả không animate. Reduced-motion giữ bố cục tĩnh.

## Landing page công khai — 19/11/2026

Route `/` giới thiệu sản phẩm công khai, không chuyển thẳng sang `/protected`. Người đăng nhập vẫn xem được trang chủ. Header/hero dùng CTA dẫn đến đăng ký khi chưa đăng nhập, hoặc kho bài khi đã có phiên. Auth và các route ứng dụng giữ nguyên hành vi.

Palette riêng cho landing: nền trắng/trắng ngà, chữ #172c2b, xanh ngọc #087f78, nền xanh nhạt #c7e9db và điểm vàng cát; Manrope self-host, giữ hình dáng logo Codjingrank với biểu tượng xanh ngọc trên landing. Toàn bộ style nằm trong CSS module của landing, không sửa app/theme.css, không ghi đè lựa chọn theme lưu trong trình duyệt.

Ảnh thực tế workspace/AI review/forum có nhãn dữ liệu demo, nguồn public/landing/SOURCES.md. Tab tính năng bên trái đổi ảnh sản phẩm trên nền phong cảnh bên phải. Tab dùng ArrowUp/Down/Home/End, menu mobile có aria-expanded, Escape trả focus về nút menu. Không auto-cycle nội dung. Hero xuất hiện theo nhịp; các section vào nhẹ khi cuộn, reduced-motion bỏ chuyển động, nội dung vẫn hiển thị khi không có JS.

Nguồn tham chiếu: https://www.hackerrank.com/ và ảnh người dùng gửi. Không dùng logo khách hàng/số liệu hoặc định vị tuyển dụng của HackerRank. Bản landing chỉ mô tả tính năng FE hiện có, không thay thế nghiệm thu backend live.

## Landing — tinh chỉnh nút và typography theo ảnh HackerRank

Ngày 19/11/2026: CTA pill tối, secondary viền mảnh, hover đổi xanh rừng và mũi tên dịch nhẹ, nav/footer underline. Manrope regular cho dòng đầu hero, nhấn xanh ở dòng sau; nhãn và mô tả tăng độ đọc. Nền mint của hero chuyển nhẹ theo chuột bằng transform/rAF, không setState theo từng frame; tắt tracking với reduced-motion/cảm ứng và dọn listeners khi unmount. Không sửa theme hoặc form auth của ứng dụng.

## Tinh chỉnh thao tác — 20/11/2026

Theo yêu cầu mới, nhãn email/password hiển thị rõ và có icon mắt, liên kết Quên mật khẩu. Hai route khôi phục được chuẩn bị, mặc định thông báo chưa sẵn sàng do contract backend chưa triển khai; không mô phỏng email thành công. Lịch bỏ badge tháng cũ, dùng icon lịch, giữ UTC và dữ liệu thật, phân biệt ngày bằng ring/đĩa/dot cùng nhãn. IconButton/CopyButton và refinements.css thống nhất control; tìm kiếm nằm sát input, phân trang icon. Kết quả nộp có metrics và CTA AI ngay cạnh Accepted, metadata phụ có copy; breadcrumb AI rõ và giữ draft khi quay lại. Motion phản hồi ngắn, chỉ animate đổi tháng với chuột; không animate code/kết quả. Theme và logo giữ nguyên. Chi tiết file/giới hạn: docs/UI_UX_REFINEMENT_2026_11_20.md.

## Landing — bố cục hero theo ảnh mới, 20/11/2026

Theo yêu cầu mới, header full-width trong nền hero, title Manrope dòng đầu và Noto Serif dòng sau, nội dung/CTA căn giữa, khoảng trắng rộng, góc khung teal và hai nút pill. Giữ logo và copy Codjingrank; không sao chép nội dung tuyển dụng hay social proof HackerRank. Workspace preview chuyển sang section bên dưới để hero riêng một màn hình. Noto Serif subset Việt/Latin tự host và có OFL. Theme sau đăng nhập không đổi. Chi tiết nghiệm thu: docs/LANDING_PAGE_REVIEW.md.

## Landing — motion theo video thao tác, 20/11/2026

Header fixed đổi nền khi cuộn; các tab tính năng crossfade 240ms không remount, inactive inert/aria-hidden; keyboard đổi tức thì. Section text/visual có nhịp 80ms, anchor chuột cuộn mượt; reduced-motion giữ tĩnh. Section cuối dùng phong cảnh đã có nguồn và panel CTA sáng. Nội dung, logo và theme ứng dụng giữ nguyên. Video nguồn thaotac.mp4; Chrome HackerRank bị Access Denied, dùng video làm chuẩn tương tác. Chi tiết kiểm tra trong docs/LANDING_PAGE_REVIEW.md.

Header landing sau phản hồi mới: cố định nhưng trong suốt ở mọi vị trí cuộn, không tự phủ nền trắng hoặc shadow. Menu mobile khi mở vẫn có bề mặt riêng để đọc rõ.

Header landing — quy tắc hiện hành sau ảnh chồng chữ: trong suốt tại đầu trang, khi cuộn quá 24px dùng nền #f9fcfa opaque và separator mảnh để chữ nội dung không lẫn menu; vẫn fixed. Chuyển 180ms, tắt với reduced-motion.

## Hero wave refinement — 21/11/2026

Hero giữ nguyên typography/CTA và dùng mesh WebGL tự viết, sắc ivory–mint–teal, ánh sáng theo pháp tuyến bề mặt. Pointer chỉ tác động vùng lân cận, không nghiêng nội dung. Chuyển động giới hạn khoảng 30fps, DPR tối đa 1.5, dừng ngoài viewport/tab ẩn; có pause, reduced-motion và fallback SVG. CTA cuối trang dùng ảnh biển thực, panel sáng lệch trái, chữ serif nhấn thương hiệu. Không thay các section trung gian hoặc giao diện sau đăng nhập.

## Lộ trình trượt ngang — 21/11/2026

Theo video tham chiếu dải logo trượt ngang: bỏ preview workspace riêng, đưa lộ trình ngay sau hero. Dải 4 bước nối tiếp lặp 42s, hover/focus dừng để đọc/thao tác; bản sao aria-hidden và không nằm trong tab order. Reduced-motion hiện 4 bước tĩnh theo grid responsive. Hero tự chạy, không còn nút pause theo yêu cầu. Observer reset khi section ra ngoài vùng nhìn, cho phép phát lại entrance khi cuộn tới; không scroll-jacking.

## Thẻ lộ trình và CTA liền ảnh — 21/11/2026

Thẻ lộ trình là liên kết toàn thẻ, nền trắng/teal nhạt, góc 16px; hover nâng 12px và giảm opacity thẻ khác còn .45, rời chuột khôi phục. Dải vẫn lặp 42s và dừng khi hover. Focus bàn phím có nền/outline rõ và làm dịu thẻ xung quanh, không nâng động; reduced-motion bỏ chuyển động. CTA cuối trang là một panel mờ chung hai nhóm luyện tập/cộng đồng, không đường chia, nền ảnh biển hòa trắng ở mép trên, Noto Serif 400 cho tiêu đề.

## Chốt marquee theo video Trusted by — 21/11/2026

Dải chỉ gồm 4 nội dung lộ trình lặp vô hạn sang trái, tốc độ tuyến tính 48s/vòng (khoảng 26px/s desktop), khung tối đa 1200px để không hở cuối vòng. Hai mép có mask mờ. Mặc định chạy khi hiển thị, chuột trên khoảng trống không dừng; chỉ trỏ vào thẻ hoặc focus mới dừng để chọn. Giữ lift/dim từ yêu cầu trước và reduced-motion.

## Chuyển cảnh vào auth — 21/11/2026

Chuyển cảnh rạch chéo teal/ivory bằng hai mảng SVG răng cưa, mở tách về hai phía để lộ form. Chỉ áp dụng click cùng origin vào login/register từ ngoài nhóm auth; không chạy khi đổi login/register, quên/reset mật khẩu, mở trực tiếp, modifier click hoặc reduced-motion. Cover 160ms, mở 850ms sau route commit, fail-open 2400ms, Escape/tab ẩn bỏ qua. Âm thanh noise-filter swoosh tự tạo Web Audio (~650ms), chỉ khởi tạo trong user gesture, không dùng video/âm thanh tham chiếu làm asset; lỗi audio không ảnh hưởng điều hướng. Không đổi form/theme/brand intro.

## Chém sáng và khói lan — 21/11/2026

Theo phản hồi mới, thay hình ảnh tear phẳng bằng shader WebGL riêng: nền khói domain-warp/fBm, lõi sáng trắng-cyan, quầng sáng và hạt lóe quanh biên, mép mở biến dạng theo noise, haze tan vào form. Canvas render tối đa 1100px rộng, khoảng 30fps trong chuyển cảnh, dọn shader/buffer/rAF khi kết thúc. SVG tách mảng giữ làm fallback. Thời gian mở 1400ms, fail-open 3200ms; reduced-motion/Escape và audio gesture giữ nguyên. Không dùng footage video tham chiếu làm asset.

## Hero sinh động hơn — 23/11/2026

Theo yêu cầu tăng chuyển động: 4 lớp sóng với biên độ/nhịp tăng, hai lớp gợn lan quanh pointer, normal nổi hơn, ánh sáng di chuyển, vệt phản sáng và rim highlight. Giữ vùng giữa dịu cho chữ/CTA, màu teal/mint/ivory, không thêm control. Giữ cap khoảng 30fps, DPR <=1.5, dừng ngoài viewport/tab ẩn và reduced-motion. Chỉ sửa HeroWave.tsx, không đổi layout/app/âm thanh chuyển cảnh.

## Hero tinh chỉnh sau phản hồi — 23/11/2026

Bản hiện hành thay bản vivid ở trên: bỏ ribbon/rim và lớp gợn tần số cao; ba lớp nếp sóng rộng, nhịp vừa phải (.38/.27/.18), vật liệu mint/ivory nhạt, phản sáng mềm .055. Pointer chỉ tạo gợn cục bộ nhẹ thay cho hai vòng lan mạnh. Giữ chuyển động liên tục nhưng tránh cảm giác bóng/chói/xoáy. Không đổi typography, CTA, layout hay luồng auth.

Điều chỉnh tiếp ngày 23/11/2026: tăng tốc thời gian sóng lên 1.8 lần so với bản refined; giữ hình dạng nếp sóng, biên độ, màu và độ phản sáng dịu.

## Phản hồi thao tác toàn app — 23/11/2026

Dùng app/product-motion.css cho UI sau đăng nhập: control hover nâng 1px, press scale .98, thẻ điều hướng nâng 3px và bóng nhẹ, icon phản hồi 2–3px; không đổi màu nhận diện. CSS modules bổ sung cho thẻ forum/ranking. Hàng bài/bảng xếp hạng không dịch chuyển, chỉ phản hồi nền. Disabled/locked giữ tĩnh; bàn phím có focus rõ, transition tắt khi focus-visible; reduced-motion tắt chuyển động. Scope platform/workspace/AI, không áp dụng vào landing/auth intro.

## Hero lettering and underwater entrance — 26/11/2026

Owner-requested hero copy now says Khơi mở tư duy, vươn xa cùng code, with language-neutral practice messaging. Custom typographic composition uses the existing licensed Manrope and italic Noto Serif assets; this is lettering styling, not a newly authored font file. Heading rises/reveals over 850ms, 12 decorative bubbles float at 6–8 second intervals (six on mobile), and emphasized lettering cycles a restrained dark teal gradient. Intro dataset pauses these effects until the logo intro finishes. Reduced motion removes bubbles and color movement. Existing hero wave, CTA routes and application UI remain.

## Hero brush calligraphy — 26/11/2026

Owner clarified Vietnamese brush calligraphy rather than italic serif. Both hero lines now use unmodified Kolker Brush Regular by Robert Leuschke, self-hosted locally with the SIL OFL notice in public/landing/KOLKER-BRUSH-LICENSE.txt. Google Fonts metadata confirms Vietnamese support. Scoped font sizing, normal style/weight, zero tracking and extra ink/diacritic clearance preserve natural brush forms without synthetic bold/italic. Existing bubble, color and post-intro reveal remain. Supporting copy, navigation, logo and application UI unchanged. This supersedes the Manrope/italic-serif hero lettering above; not an exclusive custom font claim.

## Project-wide calligraphy — 26/11/2026

Owner explicitly requested calligraphy across all UI including the logo, with larger hero lettering. Global calligraphy.css applies self-hosted Vietnamese Merienda variable to reading text, titles, navigation, forms and controls; Kolker Brush remains the hero and becomes the shared BrandLogo wordmark text, retaining the original teal symbol. Hero maximum rises to 148px, mobile 64–90px. Code/pre/editor input and summary/calendar numeric values retain monospace for character clarity. All palettes, functions and animation remain. Both fonts are licensed third-party assets, not exclusive fonts authored for Codjingrank. Licenses and provenance are kept under public/landing.

## Intro wordmark clearance and scenic footer — 26/11/2026

Owner reported clipped final k on reload after calligraphy change. Intro wrapper increases to 680px, brush wordmark is capped at 120px with 8px inline clearance and min-width zero; reveal ends with 20px clip clearance. Footer and CTA now share one ocean image wrapper with a progressive dark reading overlay, no divider or separate footer background. Footer has three actual route groups (practice, community, start), brand and copyright; remove visible photo credits but preserve SOURCES.md provenance. No fabricated legal/social destinations.

Intro size refinement: wrapper grows to 1040px capped at viewport minus 40px, container-relative brush lettering up to 240px, mark 18%, responsive gap and ink clearance retained. Typography scales with the available intro width, not independently with the viewport.

## Rounded selection menus and contained community motion — 26/11/2026

Owner requests consistent rounded selection surfaces across the project. RoundedSelect preserves the underlying controlled native form value/change handler but renders a labelled button and native top-layer popover listbox, with selected/disabled states, arrow/Home/End/Escape support, pointer-outside dismissal and close-on-outer-scroll/resize. All visible select usages in catalog pagination/detail, ranking scope/size, editor language/settings, legacy problem content and forum editor are migrated; existing custom FilterSelect menus remain. Popovers flip upward near the viewport bottom, retain a minimum 160px width and reset old pagination CSS. Ranking card arrows now use centered 17px SVG inside 32px targets. Community banners contain 52px code and 28/40/52px bars inside 56px art zones with overflow clipping and reserved text space. Slow transform-only float/breathe loops replace misaligned decoration; reduced-motion disables them, banner hover stays stationary. Verified actual filter URL updates, pagination selection, editor keyboard opening and light/dark appearance. 300 tests pass. No push/merge in this revision.

## JetBrainsMono Nerd Font Mono — 26/11/2026

Owner replaces all prior calligraphy with JetBrainsMono Nerd Font Mono, including shared wordmark, intro, hero, app surfaces and editor. typography.css supersedes calligraphy.css at the root; existing font assets remain for provenance, unused. Official unmodified Regular/Bold are served locally with font and patch licenses in public/fonts/jetbrains-mono-nerd. Monospace wordmark/intro/hero sizes are recalibrated to prevent clipping; symbol, palettes and motion remain. Browser tab chrome font is outside website control.

## Profile avatar consistency — 26/11/2026

Profile, sidebar account trigger and account menu use shared UserAvatar with the saved avatarUrl and identical full-name initials fallback. HTTP(S) image URLs have no-referrer, cover cropping, rounded clipping and a failed-image fallback. Profile supports URL preview, saving and null removal through the existing account PATCH and session replaceUser callback; no binary upload API exists. Mobile retains a compact avatar preview rather than hiding the profile card. Optional MOCK_PROFILE_DEMO provides in-memory profile updates in npm run mock, reset on mock restart, with no production persistence claim. No palette, typography or unrelated layout changes.

## Approved CR identity — 26/11/2026

Owner approved concept 03: open circular C with angular R. Shared BrandLogo now uses codjingrank-cr.svg and wordmark CodjingRank; ranking trophy uses the same silhouette. Favicon SVG, Apple icon and legacy PNG mark derive from the same SVG. Small marks retain semantic teal; intro adds a single 1500ms silver/teal reflection within the existing 2000ms reveal, disabled under reduced motion. Existing application layout and font remain.

## Auth viewport fit — 26/11/2026

Login/register fields now use labelled groups with compact vertical rhythm. Registration has two columns from 540px; 360–539px pairs username/name while email/password span the row. Height queries reduce decoration and spacing, not input legibility; 44px inputs and 16px mobile text remain. Dynamic viewport sizing and natural overflow preserve access under keyboard/zoom/extreme short viewports. Browser verified no document overflow for registration 390×844, 375×667, 1366×768 and login 1366×768. Fixed-dark/video/palette and auth handlers unchanged.

Auth width refinement: login/register panels now share a 640px maximum and receive 60% of the desktop grid, using the empty middle area while retaining responsive field grouping and natural keyboard overflow.

Auth owner revision: restore the original single-column field order on regular screens with equal desktop scene/form columns. Enlarge the panel to 580px and use 52px controls, 28px heading and 40px horizontal padding on tall desktops. Compact short viewports retain paired registration fields to keep actions accessible.

Auth feedback refinement: login 401 responses use a credential-specific message rather than the generic expired-session copy. Anonymous forms suppress the initial no-session notice. Inline alert has a contrasting fixed-dark surface; editing clears stale errors, busy forms reject duplicate submissions. Network and registration errors retain their existing mappings. Five focused feedback tests pass.

Field-level auth feedback: explicit email/username conflicts and structured server field/message validation render under their own input with aria-invalid/describedby and a visible error border. Native invalid events render inline; editing clears only that field. Generic registration CONFLICT remains a form message because the backend has not identified which field conflicts. Seven feedback tests and TypeScript/lint pass.

Profile local photo chooser replaces the URL input. JPEG/PNG/WebP up to 5MB can be previewed with revocable object URLs. Persistent upload remains unavailable because the current account contract only accepts avatarUrl and no binary upload endpoint exists. Saving a pending file reports this limitation rather than claiming success.

Auth alert spacing correction: scope alert and submit rules through form so component stylesheet order cannot restore legacy 12px/24px margins. Shorten invalid-credentials copy, use 9px/12px padding, restrained error tint and 8px corners. Alert wraps naturally on small screens instead of truncating or forcing nowrap. Seven auth feedback tests pass.

## Admin dashboard — 27/11/2026
Role admin lands at /admin after authentication; AppChrome exposes an admin-only navigation link. Dashboard inherits the shared theme/shell and shows real accessible catalog/package/post totals, first five catalog problems, loading/error/retry states and responsive layout. No fabricated administrative metrics or mutation endpoints. Account management, publishing, moderation and judge queue remain explicitly unconnected because no admin domain client exists. Client route guard is UX only; backend authorization remains authoritative. Landing and student routes remain unchanged.

Admin UX refinement: admin route uses focused navigation (overview, content, operations, learner exit) and hides personal practice streak. Dashboard shows identity/role/update time, scoped five-item catalog with local search, slug and difficulty, empty filtering state, and explicit disconnected management capabilities. Read-only UI remains honest about missing administrative APIs; no user mutations or invented infrastructure health. Responsive semantic-token surfaces retain both themes.

Admin navigation correction: content and operations now have dedicated /admin/content and /admin/operations routes, selected sidebar state matches the exact admin page, and each route shows its relevant section. Both routes return HTTP 200 locally; TypeScript passes. Optional MOCK_PROFILE_ROLE=admin is restricted to the in-memory profile demo to preview admin UI.

# Landing page — kiểm tra và bàn giao 19/11/2026

Nhánh: codex/public-landing-page. Chưa commit/push/merge. Route `/` công khai, app/auth giữ theme cũ.

## Kết quả

- Lint, TypeScript và production build: PASS.
- Vitest: 285 tests / 23 files PASS, gồm 2 test mới bảo vệ home công khai trước bootstrap và cấu trúc panel mặc định.
- HTTP production tại cổng 3002: home 200; 8 asset/font/logo đều 200.
- Chrome headless qua Design Taste: 1440px và 390px; thêm kiểm tra chiều rộng 320px. Không có lỗi runtime ghi trong báo cáo; links, spill/off-viewport, overlap-text, tương phản, menu-toggle, tabindex và focus-visible: PASS trên lượt production.
- Kiểm tra bàn phím gồm Tab walk của checker; chưa có browser E2E riêng cho Arrow/Home/End/Escape hoặc phiên đăng nhập live.
- Ảnh screenshot sản phẩm là ảnh thật của Codjingrank với fixture; bản workspace chụp trước toolbar mới, đã ghi trong SOURCES.md.

## Audit thiết kế

GATE: OPEN 33 (rounds used up). Không coi đây là clean audit hoặc đạt toàn bộ chất lượng thiết kế.
3 ngoại lệ scroll-reveal được chấp nhận theo yêu cầu trực tiếp của người dùng; ngoại lệ thứ tư không khớp tên CSS module sau production minify nên vẫn hiện trong danh sách mở.
Các cảnh báo còn lại gồm quy ước hình học một màn hình/section, phần CTA chỉ có chữ, căn lề theo grid của skill, ngôn ngữ copy tiếng Việt và focus-ring source rule. Focus-visible thực tế PASS; selector loại outline chuột có rule focus sau nó đặt lại outline, nhưng checker vẫn cảnh báo source.
Design Taste giới hạn ba lượt và yêu cầu: “Stop fixing: put these open FAILs and the waivers in your report, then finish.” Các mục mở bên dưới được giữ nguyên, không sửa/gỡ checker.

## Danh sách mục mở

- **scroll-reveal** — main#landing-main > section.i-9Owq_close "Lời giải tiếp theo bắt đầu từ bạn. Bắt đ" — starts "i-9Owq_enter" (0.6 s) the moment it is scrolled into view (an IntersectionObserver) on div.i-9Owq_wrap.wrap
- **no-visual** — section#lo-trinh "Có lộ trình. Có bước tiếp theo." — no picture, effect or mock in this section; a feature section needs a visual
- **text-only** — main#landing-main > section.i-9Owq_close "Lời giải tiếp theo bắt đầu từ bạn." — the closing section is only text: no picture, icon, mock or effect in it
- **copy-fact** — h1#landing-title "Mỗi bài giải, một bước tiến." — the first screen holds no number, price, date, place, platform or genre
- **copy-headings** — div.i-9Owq_wrap.wrap > ol.i-9Owq_steps > li:nth-of-type(1) > h3 "Tạo tài khoản" — "Tạo tài khoản" names no product, part, place or section (4 headings like it; at most one brand line per page) (and 3 more like it: "Chọn một bài", "Nhìn lại tiến bộ", "Bài khó. Có người cùng n")
- **off-grid** — div.i-9Owq_wrap.wrap > div.i-9Owq_sectionTop > div > p "Chọn gói bài theo chủ đề, luyện qua từng" — left edge at 732px, 4px off a common edge of its section at 736px (4 elements); 1 more in this section off the grid too (a.i-9Owq_textLink at 732px)
- **empty-area** — main#landing-main > section.i-9Owq_close "Lời giải tiếp theo bắt đầu từ bạn." — 78% of the section is empty: 80px above its first content, 112px under its last (a.i-9Owq_darkButton), 39% beside content that covers under half the container, in its 466px of rows (WARN over 35%, FAIL over 50%)
- **focus-ring** — .i-9Owq_page button:focus:not(:focus-visible) — ".i-9Owq_page button:focus:not(:focus-visible)" in 27dcgzt18p7z9.css removes the focus outline and sets nothing in its place
- **moment-none** — (the page) — a software page (--type) deals no moment: every kind carries one, two on a long page (moments.md)
- **hero-screen** — main#landing-main > section.i-9Owq_hero "Mỗi bài giải,một bước tiến.Luyện giải vớ" — the hero ends at 1066px on a 900px screen, 166px below the fold: it ends at the fold, 1px either way (SR-1)
- **section-height** — div.i-9Owq_page > footer.i-9Owq_footer "Đọc đề, viết code, tiến bộ từng ngày.Gói" — the section is 305px tall (0.3 screens), 595px short of one screen (900px): every section after the hero is one screen or two, 2px either way (SR-2)
- **section-height** — main#landing-main > section.i-9Owq_close "Lời giải tiếp theobắt đầu từ bạn.Bắt đầu" — the section is 666px tall (0.7 screens), 234px short of one screen (900px): every section after the hero is one screen or two, 2px either way (SR-2)
- **section-height** — section#khong-gian "Tập trung vàocách bạn giải bài.Viết code" — the section starts at 1066px, 166px below the screen grid (1 x 900px): sections start on whole screens (SR-2)
- **section-height** — section#lo-trinh "Có lộ trình.Có bước tiếp theo.Chọn gói b" — the section starts at 1966px, 166px below the screen grid (2 x 900px): sections start on whole screens (SR-2)
- **section-height** — section#cong-dong "Cộng đồng · nội dung demoBài khó.Có ngườ" — the section starts at 2866px, 166px below the screen grid (3 x 900px): sections start on whole screens (and 3 more like it: "Lời giải tiếp theobắt đầ", "Mỗi bài giải,một bước ti", "Đọc đề, viết code, tiến ") (SR-2)
- **section-air** — main#landing-main > section.i-9Owq_close "Lời giải tiếp theobắt đầu từ bạn.Bắt đầu" — the content fills 34.7% of the section's height (231 of 666px): 55% or more (40% WARN) (SR-3)
- **section-air** — section#lo-trinh > div.i-9Owq_wrap.wrap > div.i-9Owq_journeyStatement "Một bài hôm nay.Một cách nghĩ mới ngày m" — a top border across 100% of the container, between the section's content: sections and their parts are told apart by air and ground, not lines (SR-3)
- **one-section** — div.i-9Owq_page > footer.i-9Owq_footer "Đọc đề, viết code, tiến bộ từng ngày.Gói" — the screen at scroll 3766px (the top of section 5) shows 234px of section 6 and the content of 2 sections, over 24px each beside section 5: a screen shows one section (another may peek 8px, 24px WARN) (SR-4)
- **one-section** — main#landing-main > section.i-9Owq_hero "Mỗi bài giải,một bước tiến.Luyện giải vớ" — the screen at scroll 900px (stride 1) shows 166px of section 1 and the content of 2 sections, over 24px each beside section 2: a screen shows one section (another may peek 8px, 24px WARN) (SR-4)
- **one-section** — section#khong-gian "Tập trung vàocách bạn giải bài.Viết code" — the screen at scroll 1800px (stride 2) shows 166px of section 2 and the content of 2 sections, over 24px each beside section 3: a screen shows one section (another may peek 8px, 24px WARN) (and 2 more like it: scroll 2700px, scroll 3600px) (SR-4)
- **container-edges** — div.i-9Owq_page "Chuyển đến nội dungKhông gian luyện tậpL" — a <div> at the top of the page, outside header.nav, main, footer.closing and nav.actionbar (SR-6)
- **container-edges** — main#landing-main > section.i-9Owq_hero > div.i-9Owq_wrap.wrap "Mỗi bài giải,một bước tiến.Luyện giải vớ" — the hero's .wrap holds 3 children, 0 of them .hero-text: one .hero-text and at most one strip (SR-6)
- **container-edges** — h2#community-title "Bài khó.Có người cùng nghĩ." — 3 text blocks start on a left line at x 768, 648px from the container's left: text starts on the container's left, or on one split line (x 630, 732, 834) (also "Một câu hỏi đúng lúc. Một lời gi", "Đọc thảo luận công khai. Đăng nh") (SR-6)
- **container-edges** — h2#close-title "Lời giải tiếp theobắt đầu từ bạn." — 1 text block starts on a left line at x 495, 375px from the container's left: text starts on the container's left, or on one split line (x 630, 732, 834) (and 1 more like it: "Lời giải tiếp theobắt đầ") (SR-6)
- **section-gaps** — section#cong-dong / main#landing-main > section.i-9Owq_close — 247px between these sections, +99% against the median 124px of gaps at a change of ground
- **edge-left** — #cong-dong h2 "Bài khó.Có người cùng nghĩ." — starts at x 768; the lines are 120 and the column starts
- **edge-left** — #cong-dong p "Một câu hỏi đúng lúc. Một lời gi" — starts at x 768; the lines are 120 and the column starts
- **edge-left** — #cong-dong p.i-9Owq_communityNote "Đọc thảo luận công khai. Đăng nh" — starts at x 768; the lines are 120 and the column starts
- **screen-short** — section.i-9Owq_close section.i-9Owq_close "Lời giải tiếp theobắt đầu từ bạn" — 666px tall; one screen under the nav is 900px
- **screen-height** — section.i-9Owq_close section.i-9Owq_close "Lời giải tiếp theobắt đầu từ bạn" — 666px, 0.74 screens; a section is exactly one or two (--h)
- **sparse** — section.i-9Owq_close section.i-9Owq_close "Lời giải tiếp theobắt đầu từ bạn" — its content fills 33% of its screen; merge it or give it its visual (0.55 is the aim)
- **hero-fold** — section.i-9Owq_hero section.i-9Owq_hero "Mỗi bài giải,một bước tiến.Luyện" — starts at y 80, not under the nav
- **screen-short** — section.i-9Owq_hero section.i-9Owq_hero "Mỗi bài giải,một bước tiến.Luyện" — 772px tall; one screen under the nav is 844px

## Giới hạn

Chưa có benchmark hiệu năng, chưa kiểm Safari/Firefox hoặc thiết bị vật lý. Kiểm tra reduced-motion dựa trên CSS và ảnh chụp emulation nếu có; không tuyên bố đã chạy đầy đủ bộ kiểm tra motion. Chưa nghiệm thu backend live. Các ảnh và report máy nằm trong .taste-skill/ (gitignored).

## Nguồn và vận hành

Ảnh/font: public/landing/SOURCES.md. Chạy npm run dev và mở http://localhost:3000/. Domain triển khai dùng NEXT_PUBLIC_SITE_URL trước build. Root không ép login, không sửa app/theme.css hoặc storage theme.

Audit dùng [Design Taste Frontend SKILL.md](C:/Users/Administrator/.codex/skills/taste-skill/SKILL.md) và Impeccable. Trường hợp cần tiếp tục xử lý các cảnh báo bố cục còn mở, dùng báo cáo này làm đầu vào review, không coi số test chức năng là bằng chứng audit hình thức đã sạch.

Ảnh production cuối: desktop 1440x900, tablet 768x1024, mobile 390x844; mobile có emulation prefers-reduced-motion. Đã xem các PNG sau lượt sửa tỷ lệ ảnh. File: final-desktop.png, final-tablet.png, final-mobile.png trong .taste-skill và bản sao tại thư mục visualization landing-2026-11-19 của phiên chat. Không thay thế kiểm tra thiết bị vật lý hoặc toàn bộ motion matrix.

## Tinh chỉnh theo hai ảnh HackerRank tiếp theo

CTA đổi pill tối; secondary outlined pill, typography nhẹ hơn, hover arrow/sheen, nav/footer underline và selected chapter xanh nhạt. Hero có nền mint và ambient tracking pointer; cảm ứng/reduced-motion giữ tĩnh. Không thay API hoặc theme ứng dụng.

Lượt này: lint và production build (bao gồm TypeScript) PASS; 2 tests landing PASS. Đã chụp/xem bản production 1440px và 390px, ảnh polish-desktop.png/polish-mobile.png; ảnh hero riêng polish-hero.png trong visualization landing-2026-11-19. Không coi đây là đã giải quyết toàn bộ 33 mục của audit trước.


Chrome full interaction check ở 1440px: hover, hover-move, hover-spill, reduced-motion, hidden-content, focus-visible, button-contrast, links và spill PASS; off-viewport không được chạy trong lượt full 1440px; không ghi runtime error. Báo cáo vẫn có cảnh báo cấu trúc/copy và focus-ring source rule như trước; không gọi toàn bộ audit là pass. Report lưu .taste-skill/polish-interactions/report.json.

## Tinh chỉnh theo video 19/11/2026

Đã xem recording 51,9 giây của người dùng: nền hero chuyển theo chuột, CTA đổi màu khi hover, header giữ ở đầu màn hình khi cuộn và các tab đổi nội dung trên nền ảnh. Áp dụng chuyển động tham chiếu trên landing Codjingrank, giữ nội dung, sản phẩm và hình dáng logo riêng.

Palette hiện tại: xanh ngọc #087f78, chữ/CTA #172c2b, nền trắng kem, xanh nhạt #c7e9db và ánh vàng cát. BrandLogo có tone jade tùy chọn bằng mask asset gốc; chỉ landing sử dụng, các nơi khác giữ mặc định. Hero có hai lớp gradient dịch ngược nhau bằng transform, spring mass 1/stiffness 100/damping 10, dừng rAF khi nghỉ; không re-render mỗi frame. Pointer rời hero trả về tâm, blur/ẩn tab dừng ngay; touch và reduced-motion giữ nền tĩnh. Header sticky, hero có dấu góc và CTA hover sang xanh ngọc.

Build production, lint và 2 test landing PASS. Probe Chrome trực tiếp PASS: đổi hướng chuột đổi transform, rời hero trở về matrix tâm sau khi spring nghỉ, reduced-motion trả transform none, header top=0 khi cuộn. Report: .taste-skill/jade-pointer-report.json. Ảnh desktop: .taste-skill/video-jade-desktop.png. Không tuyên bố mọi chuyển động của toàn bộ HackerRank hoặc toàn bộ audit cũ đã được sao chép/giải quyết. Chưa push/merge.

Đã xem ảnh mobile 390x844 với reduced-motion: .taste-skill/video-jade-mobile.png. Quick consistency desktop/mobile vẫn exit 1 với cảnh báo cấu trúc/copy/section geometry và scroll-reveal cũ; focus-visible, menu-toggle và button-contrast PASS, hover không chạy trong chế độ quick. Không coi quick audit là full interaction check. Backend live và thiết bị vật lý chưa được nghiệm thu ở lượt này.

Audit phát hiện số bước có contrast 4,45:1; đã đổi riêng màu số bước sang #08665f để tăng độ tương phản. Cảnh báo assets trong lượt quick đến từ auth refresh localhost:4010 không chạy, không phải ảnh/font landing. Preview public vẫn hoạt động độc lập với backend.

## Khôi phục đăng nhập local

Trang /login báo không kết nối dịch vụ do mock API cổng 4010 chưa chạy, trong khi .env.local đang dùng mock mode. Đã khởi động npm run mock; refresh không có phiên trả 401 đúng dự kiến, đăng nhập fixture trả 200. Khi chạy local cần giữ cả npm run dev và npm run mock. Không thay đổi cơ chế xác thực hoặc theme để che lỗi kết nối.

## Thay ảnh sản phẩm còn logo nâu cũ — 20/11/2026

Logo nâu người dùng thấy nằm trong screenshot cũ, không phải BrandLogo đang render. Đã chụp mới workspace và forum trên app production, theme sáng, mật độ 2x (2880x1800), giữ dữ liệu demo và logo xanh ngọc hiện tại. Landing dùng workspace-current.png/community-current.png ở hero, tab sản phẩm và phần cộng đồng; xóa hai asset cũ khỏi public/landing và dùng URL mới tránh cache ảnh cũ. AI review đã kiểm tra, ảnh không có logo nâu. Header/footer tiếp tục dùng BrandLogo chung; không thay theme hoặc bố cục landing. Nguồn đã cập nhật trong public/landing/SOURCES.md. Chưa commit/push/merge.

## Landing layout theo ảnh tham chiếu — 20/11/2026

Header trải ngang trên nền hero, tiêu đề hai dòng căn giữa (Manrope + Noto Serif hỗ trợ tiếng Việt), khung góc và hai CTA pill. Hero chiếm trọn viewport; screenshot workspace được giữ nguyên nhưng chuyển xuống vùng preview riêng bên dưới. Nền teal/mint nhạt giữ pointer spring và reduced-motion. Không thay logo, nội dung thực tế, CTA auth hay theme ứng dụng. Noto Serif tự host hai subset Việt/Latin, tổng khoảng 20 KB, SIL OFL trong public/landing/NOTO-SERIF-LICENSE.txt.

Production build, lint và hai test landing pass. Chrome kiểm tra 1440/1024/768/390/320px không overflow, hero trọn 900px ở viewport 900px và preview dưới fold. Menu mobile/Escape, nền theo chuột và reduced-motion pass, không runtime exception. Ảnh trước: landing-layout-before.png; ảnh sau: landing-layout-1440.png, -1024.png, -768.png, -390.png, -320.png và landing-layout-report.json trong visualization của phiên. Bản thay đổi này chưa push/merge.

Kiểm tra thiết kế tự động bổ sung: Taste gate trả GATE: FAIL 41 (round 1). Các finding gồm quy tắc nav phải cùng lề content (trái với header trải rộng của ảnh tham chiếu), hero bị coi nhiều khoảng trống/thiếu visual (ảnh yêu cầu hero chữ), heuristic copy tiếng Anh trên nội dung tiếng Việt và một số bố cục section cũ. Không tuyên bố toàn trang đã pass gate; giữ nội dung và hướng bố cục người dùng yêu cầu, không mở rộng sang thay copy hoặc thiết kế lại các section ngoài phạm vi. Báo cáo chi tiết nằm trong .taste-skill/gate.json (local, ignored).

## Motion theo video thaotac.mp4 — 20/11/2026

Đã đọc trang https://www.hackerrank.com/ bằng web tool; Chrome trực tiếp bị Access Denied trong môi trường kiểm tra, nên video người dùng là chuẩn tương tác. Không lấy code, nội dung tuyển dụng, logo hoặc asset sản phẩm của HackerRank.

- Header fixed trên hero; khi scrollY > 32 chuyển sang nền trắng 180ms bằng thuộc tính trực tiếp, scroll listener passive/rAF, không render React theo mỗi pixel.
- Ba tab tính năng giữ mounted trong cùng grid cell; active crossfade opacity/translateY 8px/scale .985 trong 240ms. Inactive có aria-hidden/inert, không nhận focus/click. Transition retarget khi bấm nhanh; phím Arrow/Home/End đổi ngay, reduced-motion không chạy transition.
- Ảnh tính năng crop cover/top-left để screenshot AI dạng dọc không bị letterbox rộng. Không chỉnh màu hoặc nội dung ảnh.
- Phần giới thiệu vào theo nhịp chữ trước, hình sau 80ms; section hiện một lần, nội dung vẫn có default khi không JS. Click anchor bằng chuột cuộn mượt, bàn phím/reduced-motion dùng hành vi tức thì; URL hash giữ nguyên state router.
- Section cuối dùng ảnh phong cảnh own-asset đã có nguồn, CTA trên panel trắng nhẹ theo bố cục kết trang trong video; hover ảnh 1.025 chỉ trên chuột, reduced-motion tắt.

Build production, lint, hai test landing và detector trên hai file pass. Chrome production xác nhận đổi tab nhanh, inactive inert, keyboard immediate, panel fit, header top=0 khi cuộn; 1440/1024/768/390/320 không overflow, reduced-motion pass, không runtime exception. Video dựng từ screencast thực tế: landing-motion/codjingrank-motion.mp4; ảnh feature-ai.png, feature-community.png, closing-scene.png, feature-mobile.png và report.json ở thư mục visualization. Không thay theme sau đăng nhập. Chưa push/merge đợt landing này. Taste gate toàn trang còn các finding được ghi ở phần trước, không khẳng định đã pass toàn bộ bộ kiểm tra đó.

Cập nhật header theo phản hồi mới: giữ position fixed nhưng bỏ nền trắng và shadow khi cuộn; xóa scroll listener/data-scrolled không còn cần thiết. Production build pass. Chrome trên localhost:3000 sau khi cuộn xác nhận top=0, position=fixed, background rgba(0,0,0,0), box-shadow none. Ảnh header-transparent-scroll.png trong visualization. Quy tắc này thay thế mô tả đổi nền header phía trên.

Header readable theo ảnh chồng chữ mới: thay quy tắc trong suốt mọi vị trí bằng trong suốt ở đầu trang, nền #f9fcfa kín hoàn toàn khi scrollY > 24px và đường phân cách 1px. Transition 180ms, reduced-motion bỏ transition. Listener passive/rAF chỉ đổi data-scrolled khi trạng thái đổi. Chrome desktop/mobile xác nhận header fixed top=0 và nền rgb(249,252,250) khi cuộn; không runtime exception. Production build pass; ảnh header-readable-scroll.png. Quy tắc này thay thế yêu cầu header luôn trong suốt trước đó để loại chữ xuyên qua menu.

Theo yêu cầu tiếp theo, đã hoàn tác riêng đợt landing sáng + showcase tối, khôi phục UI ngay trước đợt đó: preview workspace sáng riêng, ba tab trên nền phong cảnh, lộ trình bốn bước và CTA phong cảnh. Giữ hero Noto Serif và header fixed có nền opaque khi cuộn quá 24px. Bỏ NetworkVisual và section AI mới; không ảnh hưởng UI sau đăng nhập. Bản bị hủy được giữ ngoài nguồn ứng dụng trong .taste-skill/reverted-light-dark để phục hồi nếu cần.

## Hero sóng và CTA biển — 21/11/2026

Thêm HeroWave.tsx và hero-wave.module.css, tích hợp vào LandingPage.tsx thay nền gradient theo chuột. Mesh WebGL có độ cao đa sóng, ánh sáng và gợn cục bộ; không thêm thư viện. Canvas không nhận focus/pointer; nút pause riêng có aria-label, title và aria-pressed. Cleanup shader/buffer/observer/rAF; lỗi context chuyển về SVG tĩnh. CTA thay ảnh ocean-waves.jpg, typography và khoảng cách mới; nguồn ảnh ghi trong SOURCES.md và footer.

Production kiểm tra Chrome tại 1440/1024/768/390/320px không overflow; animation chạy, Enter pause và hình nền đứng yên khi pause; reduced-motion tĩnh/ẩn control; giả lập mất WebGL hiển thị fallback; header cuộn nền đặc; ảnh CTA tải thật; không runtime exception. Desktop/mobile là kiểm tra emulation, chưa đo FPS trên điện thoại vật lý hoặc Safari. Không tuyên bố đối chiếu từng frame với video tham chiếu. Các section khác và app sau đăng nhập không đổi. Video/ảnh trong visualization hero-wave-after; ảnh trước landing-restored.png. Chưa push/merge.

Kiểm tra cuối: lint pass, 7 tests landing/intro pass, production build pass. Impeccable detect 4 source files không có regex finding; không phải kiểm định đầy đủ contrast. Browser production report tất cả mục pass, không runtime exception.

## Điều chỉnh theo video dải trượt — 21/11/2026

Video người dùng dài 1,43s cho thấy dải logo dịch ngang. Áp dụng chuyển động nối tiếp cho nội dung 4 bước thật của Codjingrank bằng LearningJourney.tsx và journey.module.css. Xóa section preview workspace dưới hero, bỏ lộ trình cũ, thứ tự mới hero → lộ trình → tính năng → cộng đồng → CTA. Không còn nút pause/resume trên hero; vẫn giữ reduced-motion, dừng canvas ngoài viewport/tab ẩn và fallback SVG. Entrance các section phát lại khi cuộn tới, giữ nội dung hiển thị nếu không có JS.

Kiểm tra production Chrome: thứ tự đúng, không preview/pause, dải tự dịch chuyển, focus bàn phím dừng animation, reduced-motion tĩnh, section reveal lại; 320–1440px không overflow, không runtime exception. Bản sao dải ẩn khỏi accessibility tree/tab order nhưng liên kết vẫn dùng được bằng chuột. Ảnh/video: visualization journey-slide-after. Chưa kiểm tra máy mobile vật lý; chưa push/merge.

## Thẻ nâng khi chọn và CTA theo ảnh — 21/11/2026

Chỉnh LearningJourney.tsx, journey.module.css, LandingPage.tsx và landing.module.css: liên kết phủ toàn thẻ; hover dừng marquee, nâng thẻ 12px, thẻ khác opacity .45; keyboard focus giữ rail tĩnh và có outline. CTA bỏ eyebrow, thay panel trái bằng panel mờ liền khối hai nhóm hành động, không đường chia; typography Noto Serif, ảnh biển giữ nguồn cũ. Không thêm thư viện hoặc sửa app sau đăng nhập.

Production Chrome 320/390/768/1024/1440px không overflow. Hover nâng -12px, opacity .45, rail paused; mouseleave khôi phục; focus dừng; reduced-motion tĩnh; CTA 2 liên kết, border 0. Không runtime exception. Lint, 7 tests và build pass. Ảnh/video trong visualization journey-cards-after. Chưa push/merge.

Xác minh production cuối: backdrop-filter CTA blur(14px), border 0px, đủ 2 liên kết; kiểm tra lại hover/mobile/reduced-motion đều pass, không runtime exception.

## Sửa chuyển động marquee mặc định — 21/11/2026

Đối chiếu video 20261121-0351-43.4289149.mp4: dải logo trôi ngang đều, mép mờ. Chỉ sửa journey.module.css: chạy mặc định, chuột trên khoảng trống không dừng, giới hạn khung <= chiều rộng một nhóm để không hở vòng, mask hai mép, chu kỳ 48s. Thẻ/nội dung/CTA giữ nguyên. Giữ hover chọn nổi/dim, focus bàn phím tĩnh, reduced-motion và pause ngoài viewport.

Production build pass. Chrome xác minh dải chạy khi chuột ở khoảng trống, hover/focus dừng đúng, lift -12px/opacity .45, vòng 48s không hở (nhóm 1248px, viewport 1200px), mask có hiệu lực. 320–1440px không overflow, reduced-motion pass, không runtime exception. Artifact journey-marquee-final; chưa push/merge.

## Tăng sức sống nền hero — 23/11/2026

HeroWave.tsx tăng biên độ các lớp sóng, nhịp pha gấp khoảng 3 lần, thêm lớp gợn nhỏ và hai tần số gợn quanh con trỏ. Đổi normal/light/sheens, thêm ribbon/rim sáng, tăng phản hồi pointer và giữ mask dịu giữa chữ. Vertex/fragment dùng cùng precision highp để uniform uTime liên kết đúng; thử browser đã xác nhận shader chạy, không chỉ fallback. Không thêm thư viện hoặc tải asset.

Production build/lint pass. Chrome: uTime tự tăng, pointer strength >.6 khi rê chuột, 320/390/768/1024/1440px không overflow; reduced-motion dừng thời gian; ra khỏi viewport dừng; không runtime exception. Ảnh/video/report ở visualization hero-wave-vivid, trước thay đổi xem hero-wave-after/hero-desktop.png. Mobile là emulation, chưa đo trên máy vật lý. Chưa push/merge.

## Giảm hiệu ứng, ưu tiên sóng gập ghềnh mềm — 23/11/2026

Theo phản hồi bản vivid quá lố: chỉ sửa HeroWave.tsx. Xóa ribbon/rim và lớp gợn nhỏ dồn dập, giảm tốc pha gần một nửa, dùng ba nếp sóng rộng, normal .72, vật liệu nhạt và sheen .055. Pointer chuyển sang gợn cục bộ nhẹ, không vòng xoáy mạnh. Giữ bảo vệ vùng chữ, reduced-motion và dừng ngoài viewport. Build/lint pass; artifact hero-wave-refined. Chưa push/merge.

Theo yêu cầu tăng tốc ngày 23/11/2026: WAVE_SPEED=1.8, chỉ tăng nhịp thời gian; không tăng cường độ ánh sáng/biên độ hay thêm lớp hiệu ứng.

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

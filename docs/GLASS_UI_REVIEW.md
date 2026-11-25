# Glass UI sau đăng nhập

Ngày: 25/11/2026. Chưa push hoặc merge GitHub.

## Hướng triển khai

Tham khảo trực tiếp https://glassyui.com/, https://glassyui.com/components/glass-surface và https://glassyui.com/components/glass-button. Link TikTok https://www.tiktok.com/@paulcodes4 không truy cập được qua công cụ duyệt, không tuyên bố đã xem video của tài khoản.

Áp dụng vật liệu kính mờ trên hệ thống ứng dụng hiện có: nền teal/mauve/lavender Catppuccin, tấm kính xuyên nền, viền bắt sáng, bóng mềm có độ lệch và controls nổi. Giữ bố cục nghiệp vụ, theme sáng/tối, logo và handler hiện tại. Landing, intro và auth không nằm trong phạm vi. Không cài dependency, không sao chép mã GlassyUI và không tuyên bố dùng package GlassyUI hay mô phỏng khúc xạ WebGL. Đây là CSS glassmorphism tham khảo ngôn ngữ vật liệu của trang mẫu.

Bề mặt đọc/code dùng nền 94% để giữ độ rõ; thẻ 74%, control 68%. Header 86% và blur 22px để không lẫn chữ khi cuộn. Các nút chính dùng accent/on-accent có sẵn, native select options giữ nền đặc. Không làm chuyển động code hoặc kết quả chấm. Không thay đổi API, dữ liệu, quyền hoặc bản nháp.

## File thay đổi trong đợt Glass

- `app/product-glass.css`: vật liệu dùng chung, nền, header, thẻ, controls, console, AI, mobile và fallback.
- `app/layout.tsx`: nạp stylesheet sau hệ thống product design hiện có.
- `features/forum/forum.module.css`: kính mờ cho bộ lọc, feed, thẻ và khung cộng đồng.
- `features/leaderboard/leaderboard.module.css`: kính mờ cho bộ lọc, tổng quan và bảng; bỏ nền caro cũ để thống nhất.
- `DESIGN.md`, tài liệu này.

Các thay đổi Lucian chưa commit từ đợt trước vẫn được giữ nguyên; danh sách riêng tại `docs/LUCIAN_UI_REFRESH.md`. Không ghi đè các thay đổi có sẵn ngoài phạm vi.

## Nghiệm thu

- Production build và lint đạt. 54 tests catalog/forum/leaderboard/brand-intro đạt.
- Chromium production: Tổng quan, Gói bài, Kho bài, Cộng đồng, Ranking, Pro demo và hồ sơ ở hai theme; không tràn ngang trong viewport desktop kiểm tra.
- Mobile mô phỏng 375px: Tổng quan, Gói bài, Cộng đồng, Ranking theme tối và Tổng quan theme sáng không tràn ngang.
- Chuột/bàn phím: hover, nhấn, focus, tabs bằng Arrow/Home/End, Escape của dialog. Clipboard thật thành công có check; lỗi không báo thành công.
- Bản nháp code giữ nguyên sau thao tác console và sau luồng nộp bài → AI → quay về. Không có runtime exception trong lượt kiểm tra.
- Kiểm tra `prefers-reduced-motion` và `prefers-reduced-transparency`. Giảm transparency chuyển fill về semantic surface; reduced-motion không transform và transition 0s. Có CSS fallback khi không hỗ trợ backdrop-filter, chưa chạy trình duyệt thiếu hỗ trợ thực tế.

## Bằng chứng

Thư mục: `C:/Users/Administrator/.codex/visualizations/2026/11/18/01a1ed46-5cba-7161-87fa-304a4b7c015e/glass-system-after/`.

- `dashboard-hover-dark.png`, `dashboard-hover-light.png`, `dashboard-mobile.png`, `dashboard-mobile-light.png`.
- `forum-hover-dark.png`, `ranking-hover-dark.png`, `workspace-hover-dark.png` và ảnh các tương tác khác.
- `report.json` và `preferences-report.json` chứa kết quả kiểm tra.
- Video thao tác desktop: thư mục cha, `codjingrank-glass-ui.mp4`.
- Ảnh trước đợt Glass: thư mục cha, `lucian-system-after/`.

Giới hạn: dùng backend mock hiện có, chưa xác minh backend thật; mobile mô phỏng Chromium, chưa thử thiết bị thật hoặc Safari/iOS. Không audit WCAG toàn diện hoặc benchmark FPS trên thiết bị yếu. Không tải được TikTok. Localhost 3000 được giữ chạy cho người dùng review.

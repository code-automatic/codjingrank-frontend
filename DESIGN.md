# Codjingrank UI — HackerRank auth / LeetCode workspace

Yêu cầu của Thịnh ngày 13/11/2026 thay thế hướng phủ mocha toàn giao diện. Bản local chờ người dùng duyệt, không phải cam kết đối chiếu từng pixel với website live.

## Thương hiệu

- Chỉ biểu tượng C, dấu >, các thanh tăng dần dùng #7B5C49. Chữ lấy alpha từ logo gốc để giữ đúng kiểu chữ, dùng currentColor qua mask riêng; không dùng filter toàn logo.
- Chữ màu trắng trên vùng minh họa luôn tối; bản auto dùng màu chữ theo bề mặt theme. Biểu tượng độc lập ở workspace/favicon, Apple icon nền trắng trung tính.
- Không dựng SVG phỏng đoán đường nét của raster. Asset PNG alpha giữ hình và lettering người dùng cung cấp.

## Theme

- app/theme.css là nguồn semantic tokens cho hai palette. Light: trắng/xám; Dark: canvas #0F0F0F, panel #262626, header #333333, text sáng.
- Inline trusted head script đặt data-theme trước body paint. CSS có system fallback; suppressHydrationWarning chỉ trên html để chấp nhận thuộc tính do script đặt.
- Lần đầu theo OS. Toggle lưu đúng khóa codjingrank-theme; root ThemeSync theo dõi OS khi chưa chọn và đồng bộ tab qua storage event. Storage bị chặn vẫn đổi được trong trang.
- Theme đổi bằng CSS và external store nhỏ, không thay key/remount auth/session/editor/Run/Submit; không lưu token hoặc password.
- Không animate theme, thao tác bàn phím hoặc kết quả chạy bài.

## Auth — mode Operate

- Bố cục desktop 60/40 theo ảnh HackerRank người dùng cung cấp; bên trái luôn tối, logo khoảng 19.5% chiều cao, welcome/community gần phía dưới. Form rộng tối đa 448px.
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

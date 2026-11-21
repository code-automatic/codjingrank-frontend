# Chuyển cảnh vào đăng nhập/đăng ký — 21/11/2026

Theo Download.mp4 do người dùng gửi: lấy ngôn ngữ chuyển động rạch chéo, viền sáng và tách hai mảng; không sử dụng footage anime/video hướng dẫn làm tài nguyên sản phẩm. Dựng SVG/CSS riêng, màu teal nhận diện, âm thanh Web Audio tự tổng hợp.

File triển khai: app/layout.tsx, lib/ui/AuthTransition.tsx, lib/ui/AuthTransition.module.css, lib/ui/auth-transition-sound.ts. AuthTransition bao ngoài AppChrome bằng display:contents nên không đổi bố cục. Chặn click trước Next Link khi đích cùng origin là /login hoặc /register; giữ query/hash, bỏ qua download/new tab/modifiers và chuyển trang trong nhóm auth. Không can thiệp submit hay kết quả xác thực. Body/inert chỉ khóa trong chuyển cảnh; hoàn tất/Escape/tab ẩn/timeout sẽ dọn khóa, timer và audio. Form nhận focus khi đã tới trang đích. Reduced-motion chuyển thẳng, không âm thanh. Brand intro chỉ giữ hành vi document load hiện tại.

Kiểm tra production Chrome: click login mở overlay và form, giữ ?next=%2Fproblems, tạo AudioContext đúng một lần, dọn audio/overlay/inert; login → register không phát lại; mở trực tiếp không tear/sound; reduced-motion bỏ qua; giả lập AudioContext lỗi vẫn tới form; Escape bỏ qua; mobile 390px không tràn. Không runtime exception. Lint, 7 tests landing/brand intro và production build pass. Ảnh/video/report trong visualization auth-tear-after. Chưa kiểm tra Safari/mobile vật lý hoặc hệ thống âm lượng của người dùng. Chưa push/merge.

## Bản khói và năng lượng theo phản hồi

Thêm lib/ui/SlashAtmosphere.tsx, chỉnh AuthTransition.tsx và CSS: khói nền procedural, khói và quầng sáng cyan quanh rìa, hạt lóe, vết mở nhiễu hữu cơ và haze tan. Shader alpha để lộ form thật, canvas phủ tạm toàn viewport; shader lỗi/context mất thì quay về SVG. Không thêm thư viện hay tải media ngoài. Khi kết thúc dọn tài nguyên WebGL. Mở trong 1400ms và timeout 3200ms.

Production build/lint pass. Chrome desktop/mobile xác minh canvas khói hiển thị; mở đúng login với query, audio context được dọn, không intro lặp, đổi auth không tear lặp, mở trực tiếp/reduced-motion bỏ qua, lỗi audio vẫn mở form, Escape bỏ qua, mobile không overflow và không runtime exception. Artifact auth-smoke-after có ảnh và video với âm thanh Web Audio thu lại. Chưa đo FPS trên điện thoại vật lý; chưa push/merge.

Tối ưu lần bấm đầu: canvas được mount ẩn và chuẩn bị shader khi tải root; không chạy rAF lúc idle. Khi bắt đầu chỉ bật render và reset đồng hồ, không biên dịch shader lại. Kết thúc dừng rAF/ẩn canvas, tái sử dụng một program cho các lần tiếp theo; cleanup WebGL khi unmount, fallback SVG khi context mất.

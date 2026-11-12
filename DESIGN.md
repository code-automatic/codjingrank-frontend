# UI Codjingrank — phiên bản tham chiếu HackerRank / LeetCode

Cập nhật theo yêu cầu của Thịnh ngày 13/11/2026. Bản chạy để team review, chưa phải phê duyệt thiết kế chính thức. Không tạo file Figma.

## Auth: login và đăng ký

- Bố cục split theo phong cách HackerRank: vùng kể chuyện/code nền #08150f, form trắng, nút xanh #068942.
- Cả hai route dùng chung layout, tab điều hướng, label, validation và nút hiện/ẩn mật khẩu. Không thêm OAuth hay quên mật khẩu khi chưa có flow backend.
- Chữ UI Segoe UI/Arial; code Consolas/monospace. Không thêm font hoặc dependency ngoài.
- Code minh họa cuộn liên tục bằng CSS transform 32s linear, hai batch giống nhau để nối vòng. Không thực thi code và không có cập nhật React mỗi frame.
- Có pause/resume, dừng khi tab ẩn và tắt với prefers-reduced-motion. Animation không chặn nhập form.
- Mobile vẫn có vùng code thu gọn; form xuống bên dưới, input 16px.

## Workspace: bố cục tham chiếu LeetCode

- Desktop đầy chiều cao viewport: thanh Run/Submit chung, đề bài trái, editor phải và console kết quả ở dưới. Nền #f0f0f0, panel/editor trắng, đường chia #dedede, điểm nhấn submit xanh và brand cam.
- Cột đề có thể kéo rộng 30–65%; separator hỗ trợ ArrowLeft/ArrowRight/Home/End.
- Kết quả có tab Run/Bài nộp, hỗ trợ phím mũi tên. Panel luôn mounted để giữ kết quả và polling. Nút thao tác dùng React portal, không nhân đôi controller.
- Giữ title, difficulty, acceptance, tags, samples, limits, execution mode và trạng thái từ API. Không thêm tính năng hoặc số liệu giả của LeetCode.
- Editor giữ syntax overlay và metric font; thêm màu nền sáng cho cả token và fallback code dài. Giữ draft, reset, ngôn ngữ và Esc rồi Tab để rời editor.
- Dưới 900px chuyển một cột, console có thể cuộn; thanh thao tác giữ ở phía trên.

## Ranh giới

CSS giới hạn trong auth-page/workspace-prototype. Không đổi catalog/account, controller session/API hay backend. Tham khảo thị giác hai nền tảng, giữ thương hiệu và dữ liệu Codjingrank. Hai website tham chiếu đã chặn headless (Access Denied / Just a moment), nên chưa có bằng chứng đối chiếu từng pixel với bản hiện tại của họ.

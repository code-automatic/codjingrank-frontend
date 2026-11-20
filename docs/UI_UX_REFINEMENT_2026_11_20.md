# UI/UX refinement — 20/11/2026

Phạm vi theo yêu cầu: giữ Catppuccin Latte/Mocha, logo teal, bố cục ứng dụng và controller dữ liệu; nâng cấp thao tác, icon và khả năng đọc. Chưa commit, push hoặc merge đợt thay đổi này.

## Kết quả

- Đăng nhập/đăng ký: nhãn trường nhập hiển thị rõ, icon mắt/mắt gạch chéo giữ nguyên vùng bấm, aria-label/title và aria-pressed; liên kết Quên mật khẩu ở cạnh phải dưới ô mật khẩu.
- Thêm /forgot-password và /reset-password (token qua query token). Có form email, mật khẩu mới/xác nhận, validation theo contract 8–72 ký tự và tối đa 72 byte UTF-8, busy/error/success, thiếu token, token hết hạn/đã dùng/không hợp lệ. Không tự đăng nhập sau reset.
- Lịch: thay khối 11 THÁNG bằng biểu tượng lịch cùng hệ icon; giữ UTC/countdown và hoạt động từ API. Chọn ngày có ring, hôm nay có đĩa tròn và chữ đậm, hoạt động có dot, accessible labels và chú thích. Thông tin ngày chọn thành dòng gọn. Chuyển tháng bằng chuột có fade/translate 160ms; bàn phím không chạy hiệu ứng đó, reduced-motion tắt.
- Tìm kiếm: icon tìm nằm sát trong control, hỗ trợ Enter, một focus ring. Gói bài dạng grid, icon chủ đề, nhãn Mở lộ trình ngắn. Phân trang lộ trình, Cộng đồng, Ranking và lịch sử dùng icon mũi tên có tên truy cập; tooltip title trên các nút mới. Làm mới tiến độ/lượt nộp/lịch sử dùng icon rõ nghĩa. Giữ chữ với hành động quan trọng, xóa và thử lại khi có lỗi.
- Toolbar editor: đặt lại starter đổi sang icon có tên và tooltip, giữ nguyên controller/draft/language/run/submit.
- Kết quả nộp: trạng thái và biểu tượng rõ, bốn chỉ số thành definition list; mã lượt nộp nằm trong disclosure phụ với nút sao chép và phản hồi thành công/lỗi. CTA Xem đánh giá AI cạnh Accepted để thấy ngay trong console nhỏ. Không thay điều kiện Accepted hoặc chấm bài.
- AI: breadcrumb Kho bài / Bài tập / Đánh giá AI, nút quay lại code rõ; verdict tách biệt điểm AI; mã lượt nộp gọn, icon pause/retry. Giảm thông báo hàng đợi lặp lại, giữ lỗi/thử lại/đang xử lý và các trạng thái controller hiện có.
- Hệ dùng chung: IconButton, CopyButton, thêm icon calendar/eyeOff/sparkles; app/refinements.css thống nhất các control mới và phản hồi 140–160ms. Không chạy hiệu ứng trên code/kết quả dữ liệu. Giữ reduced-motion, focus và hover gating.

## Giới hạn backend khôi phục mật khẩu

contracts/openapi_fe.yaml đánh dấu POST /api/v1/auth/forgot-password và POST /api/v1/auth/reset-password là target-not-implemented. Cần backend lưu token hash có hạn, dùng một lần, gửi email, consume nguyên tử và thu hồi refresh token. API client đã có cả hai hàm; UI tích hợp qua chúng khi sẵn sàng.

Mặc định NEXT_PUBLIC_PASSWORD_RESET_ENABLED=false. Chỉ bật true và NEXT_PUBLIC_MOCK_MODE=false sau khi backend/email hoạt động; rebuild Next.js để nhận cấu hình. Trong mock hoặc khi chưa bật, form hiển thị rõ dịch vụ chưa sẵn sàng và không gửi request, không báo gửi email hay đổi mật khẩu giả. UI live happy-path và email delivery chưa thể nghiệm thu với backend hiện tại.

## Kiểm tra

- Production build: pass, có cả hai route khôi phục.
- Lint: pass.
- Bộ test đầy đủ sau thay đổi chính: 293/293, 25 file. Sau tinh chỉnh CTA và icon trang phụ: 66/66 test liên quan, production build và lint pass lại.
- Test XSS/điều kiện chỉ hiện CTA với Accepted tiếp tục pass; cập nhật assertion theo nhãn và cấu trúc mới.
- Chrome production 1440x900: icon mắt bật/tắt; trang khôi phục trung thực; token thiếu; lịch/đổi tháng/chọn ngày; tìm kiếm bằng Enter; reset icon; submit/metrics; đường dẫn AI; quay lại editor giữ nguyên code.
- Tổng quan, Lộ trình, Cộng đồng, Ranking, Pro và Hồ sơ đều vừa chiều ngang ở cả light/dark (12 trường hợp). Editor, kho bài và đăng nhập vừa khung 390x844. Không có runtime exception.
- Hover thực bằng CDP mouse: 8 trường hợp ở light/dark, contrast tối thiểu 4.50068:1. Hiệu ứng đổi tháng bật khi click chuột, reduced-motion tắt. Bộ ảnh có trạng thái focus tìm kiếm từ bàn phím.
- Detector Impeccable: không có finding trên các mục đã kiểm tra. Không đồng nghĩa toàn bộ dự án được chứng nhận; chưa kiểm tra Safari/Firefox, thiết bị vật lý hoặc email backend live.

## Ảnh và bằng chứng

Trong thư mục visualization của phiên: ui-refresh-before/login.png, dashboard.png, packages.png và ui-refresh-after/login-dark.png, login-light.png, forgot-dark.png, reset-missing-token.png, dashboard-light.png, packages-light.png, packages-dark.png, calendar-dark.png, submission-dark.png, ai-review-dark.png, workspace-mobile.png, problems-mobile.png, login-mobile.png. report.json và hover-report.json lưu kết quả trình duyệt. Ảnh dùng dữ liệu demo và không phải kết quả backend live.

## File thay đổi

- .env.example: cờ bật tích hợp khôi phục.
- app/layout.tsx; app/refinements.css: style dùng chung, không đổi theme.
- app/forgot-password/page.tsx; app/reset-password/page.tsx: route mới, Suspense cho useSearchParams theo docs Next.js được cài.
- features/auth/AuthForm.tsx; features/auth/PasswordRecovery.tsx: auth/recovery.
- features/platform/PracticeCalendar.tsx: lịch.
- features/catalog/CatalogSections.tsx: tìm kiếm, gói bài, tiến độ, phân trang.
- features/editor/ProblemWorkspace.tsx: icon đặt lại code.
- features/submissions/SubmissionPanel.tsx: kết quả, CTA, metadata và control phụ.
- features/ai-review/AiReviewPage.tsx: điều hướng, metadata và các trạng thái UI.
- features/forum/ForumPage.tsx; features/leaderboard/LeaderboardPage.tsx: icon tìm kiếm/phân trang.
- lib/ui/Icon.tsx; lib/ui/IconButton.tsx; lib/ui/CopyButton.tsx: thành phần dùng chung.
- tests/ai-review.test.ts: assertion theo UI mới, giữ kiểm tra XSS và eligibility.
- README.md; DESIGN.md; PRODUCT.md; docs/UI_UX_REFINEMENT_2026_11_20.md: cấu hình, quy ước và kết quả.

Các file cá nhân/asset chưa dùng có sẵn và next-env.d.ts tự sinh không thuộc phạm vi sửa.

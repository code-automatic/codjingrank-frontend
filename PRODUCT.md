# Codjingrank frontend

- Ngày 19/11/2026: người dùng yêu cầu mở rộng UI sau đăng nhập theo ảnh LeetCode và đồng ý màn hình demo cho tính năng chưa có backend. Bổ sung dashboard, điều hướng chung, hồ sơ qua API, kho bài dạng bảng, contest/Pro/thông báo demo. Nội dung chi tiết và giới hạn ở docs/POST_LOGIN_UI_REVIEW.md; giữ theme ứng dụng và landing riêng.

Bối cảnh được ghi nhận từ yêu cầu của Thịnh; các lựa chọn thị giác mới là đề xuất chờ team review.

- Nền tảng luyện giải bài lập trình, người dùng đọc đề, viết code, chạy mẫu và nộp bài.
- FE Next.js/TypeScript, backend tách riêng; HTTP đi qua API Gateway.
- Auth có access token trong memory và refresh qua HttpOnly cookie.
- Sprint 3 hiện có editor/language/template/draft, Run sample, Submit/polling/history và tiến độ cấp độ.
- Công việc UI hiện tại gồm login, đăng ký và trang giải bài; các màn hình khác chờ yêu cầu tiếp theo.
- Mock giúp xác minh FE, không chứng minh JWT/cookie rotation/ownership hay readiness backend live.
- Không thêm state library, không sửa backend; không merge/push khi chưa được yêu cầu.

- Ngày 19/11/2026: bổ sung landing page công khai tại `/` theo yêu cầu của Thịnh, nhận diện trắng/xanh riêng; theme Latte/Mocha và flow auth/ứng dụng giữ nguyên. CTA đăng ký hoặc vào kho bài theo phiên. Không có testimonial, khách hàng hoặc số liệu người dùng giả.

# Codjingrank frontend

Bối cảnh được ghi nhận từ yêu cầu của Thịnh; các lựa chọn thị giác mới là đề xuất chờ team review.

- Nền tảng luyện giải bài lập trình, người dùng đọc đề, viết code, chạy mẫu và nộp bài.
- FE Next.js/TypeScript, backend tách riêng; HTTP đi qua API Gateway.
- Auth có access token trong memory và refresh qua HttpOnly cookie.
- Sprint 3 hiện có editor/language/template/draft, Run sample, Submit/polling/history và tiến độ cấp độ.
- Công việc UI hiện tại gồm login, đăng ký và trang giải bài; các màn hình khác chờ yêu cầu tiếp theo.
- Mock giúp xác minh FE, không chứng minh JWT/cookie rotation/ownership hay readiness backend live.
- Không thêm state library, không sửa backend; không merge/push khi chưa được yêu cầu.

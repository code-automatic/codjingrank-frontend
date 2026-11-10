# Sprint 1 — tích hợp FE

Ngày: 11/11/2026. Bản nền review: GitHub `master` tại `9d4a20e` (PR #1 của Huy).

## Đối chiếu phân công

| Thành viên | Task                                 | Kết quả tích hợp                                                                            |
| ---------- | ------------------------------------ | ------------------------------------------------------------------------------------------- |
| Hoàng Huy  | API client và model adapter          | Client Gateway `/api/v1`, UUID, envelope, adapters, mock learner và test đã có trong master |
| Quốc Thịnh | Auth và refresh session              | Memory token, bootstrap, single-flight, retry một lần, logout race guard và UI auth         |
| Thanh Tùng | Legacy inventory và retention policy | Ghép 3 tài liệu trong sprint-1, chỉnh nguồn tài liệu và tên branch master                   |

Yêu cầu mới đã thống nhất ưu tiên target `/api/v1` + UUID + mock; không fallback Subject/root-route cũ. Không nghiệm thu backend trong đợt FE này.

## Sửa sau review

- Kiểm tra đầy đủ user auth bằng adapter chung thay vì chỉ kiểm tra UUID; token phải là chuỗi không rỗng.
- Giữ nguyên lỗi AbortError khi request bị huỷ; lỗi mạng thật vẫn trả NETWORK_ERROR.
- README cập nhật mock 42 operations, hướng dẫn MOCK_AUTH_ONLY.
- Giữ nguyên giao diện; không thêm tính năng Sprint 2.

## Chạy và báo cáo cho nhóm

Từ thư mục frontend đã tích hợp:

```powershell
npm ci
# Chỉ copy khi chưa có .env.local; giữ cấu hình cá nhân nếu đã tồn tại.
Copy-Item .env.example .env.local
npm run mock
# Mở terminal thứ hai tại cùng thư mục:
npm run dev
```

Mở http://localhost:3000/login; dùng dữ liệu giả learner@example.com / Coding2026.
Mock refresh mặc định 401: reload sẽ trở về login. Điều này không phải bằng chứng lỗi persistence FE vì mock không lưu session/cookie.

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Mỗi người bàn giao: sprint/task, branch + commit, file chính, cách chạy, kết quả các lệnh, lỗi còn biết. Leader đọc bảng phân công trước, fetch GitHub, kiểm tra snapshot sạch, đối chiếu task + contract, review/test, sửa lỗi được giao, rồi ghép vào master sau khi đạt. Không test nhầm bản working tree có sửa chưa commit; không đổi UI ngoài yêu cầu. Push GitHub theo yêu cầu riêng của người dùng.

Phạm vi kiểm tra tự động: HTTP/session/adapters; không thay thế browser E2E hoặc auth live. Kiểm tra thủ công thêm login/register/loading/lỗi, thao tác keyboard và logout.

## Kết quả xác minh

Lint, typecheck, 48 tests và production build: PASS. git diff --check: PASS. Chưa nghiệm thu browser E2E hoặc backend live. Các test mới kiểm tra dữ liệu user/token lỗi và phân biệt hủy request với lỗi mạng.


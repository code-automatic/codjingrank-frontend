# Sprint 1 — 2026-11-07 — Báo cáo

| | |
| --- | --- |
| **Sprint** | Sprint 1 |
| **Ngày** | 07/11/2026 |
| **Người thực hiện** | _[điền tên]_ |
| **Nhánh / commit** | _[điền branch + commit]_ |
| **Loại task** | Tài liệu/chính sách, không sửa code |
| **Trạng thái** | Tài liệu đã có trong repo; chờ review/chốt với team |

## 1. Mục tiêu

- Ghi retention policy cho lịch sử Repository/GitHub.
- Không xóa remote repository, không rewrite lịch sử Git.
- Đánh dấu service, bảng, DTO và hook thuộc flow cũ là legacy.
- Chỉ rõ cleanup working tree khác với xóa remote/history.

Nguồn: [`DECISIONS.md`](../../srs/docs/DECISIONS.md),
[`NEXT_STEPS.md`](../../srs/docs/NEXT_STEPS.md),
[`FRONTEND_API_CONTRACT.md`](../../srs/docs/FRONTEND_API_CONTRACT.md).

## 2. Kết quả tài liệu hiện có

| File | Nội dung | Trạng thái |
| --- | --- | --- |
| [`README.md`](README.md) | Mục đích folder và nguyên tắc nhanh | Đã có |
| [`RETENTION_POLICY.md`](RETENTION_POLICY.md) | Chính sách giữ/xóa, cấm xóa remote, compatibility alias | Đã có |
| [`LEGACY_INVENTORY.md`](LEGACY_INVENTORY.md) | Inventory service/bảng/DTO/hook legacy | Đã có |
| [`INTEGRATION_REVIEW.md`](INTEGRATION_REVIEW.md) | Đối chiếu phân công và kết quả tích hợp Sprint 1 | Đã có |

### 2.1. Retention policy

Các điểm đã ghi trong [`RETENTION_POLICY.md`](RETENTION_POLICY.md):

- Không xóa remote repository dưới mọi hình thức.
- Giữ commit/PR/SHA gốc, không rewrite history, không force-push xóa commit.
- Chỉ gỡ code/flow cũ khỏi working tree bằng branch cleanup có kiểm soát.
- Giữ `DECISIONS.md` phần legacy làm baseline giải thích code hiện tại.
- Giữ `schema.sql` mới và contract `/api/v1` làm target.
- Không hard-delete bảng/history; dùng soft-delete bằng `status` khi cần.
- Không restore route curriculum/GitHub đã xóa làm alias.
- Không bật alias prefix-only khi chưa đồng bộ UUID DTO, ownership, cookie-path và contract test.

### 2.2. Legacy inventory

Các nhóm đã đánh dấu trong [`LEGACY_INVENTORY.md`](LEGACY_INVENTORY.md):

| Nhóm | Ví dụ |
| --- | --- |
| Service/module | `repo_service`, mock commit flow, `X-User-ID` auth, Vite test UI cũ |
| Bảng | `subjects`, `sessions`, `lessons`, `repositories`, `commits`, `github_accounts`, `github_installations` |
| DTO | Integer ID, root Logout 200 envelope, history không pagination, `rank.rating`, public problem detail không level check |
| Hook | GitHub webhook, installation lifecycle, OAuth callback/link, learner payload chứa `executeCode`/points/hidden output/wrapper |

## 3. Thay đổi code

**Không có.** Sprint 1 là task tài liệu/chính sách:

- không xóa remote repository;
- không sửa code backend/frontend;
- không chạy migration;
- không thay đổi contract `/api/v1`.

## 4. Checklist bàn giao

- [x] Có retention policy rõ ràng.
- [x] Có inventory service/bảng/DTO/hook legacy.
- [x] Ghi rõ “không xóa remote repository”.
- [x] Ghi rõ cleanup working tree không xóa history.
- [ ] Reviewer xác nhận nội dung policy.
- [ ] Chốt với owner backend về danh sách branch/bảng legacy.
- [ ] Điền branch/commit và người review vào bảng đầu file.

## 5. Bằng chứng cần bổ sung khi nộp

| Bằng chứng | Cách kiểm tra |
| --- | --- |
| Remote repository vẫn tồn tại | Mở URL GitHub hoặc `git remote -v` |
| Không rewrite history | `git log --oneline` còn SHA cũ; PR/merge commit còn |
| Tài liệu đã merge | Link PR/commit chứa 3 file Sprint 1 |
| Reviewer đã đọc | Tên reviewer + ngày review |

## 6. Ghi chú

- Inventory trong tài liệu là **historical**, không dùng để thiết kế sản phẩm v2.
- Các mục legacy không chứng minh route live hiện có.
- Frontend mới chỉ dùng `/api/v1` qua Gateway, không gọi trực tiếp service.

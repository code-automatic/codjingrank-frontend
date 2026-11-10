# Retention Policy — Sprint 1 (2026-11-07)

Nguồn: `docs/DECISIONS.md`, `docs/NEXT_STEPS.md`, `docs/FRONTEND_API_CONTRACT.md`.

## 1. Nguyên tắc chung

1. **Không xóa remote repository.** Mọi repository trên GitHub (code, tài liệu SRS, backend) đều được giữ lại.
2. Lịch sử Git (commit, branch đã merge, PR) được giữ nguyên — không rewrite history, không force-push xóa commit, không squash làm mất SHA gốc nếu đã merge.
3. Code/flow cũ chỉ được gỡ khỏi cây làm việc (working tree) qua branch cleanup có kiểm soát (ví dụ branch `chore/remove-legacy-code`), sau khi đã xác nhận mọi commit còn là ancestor của `main`.
4. Mọi inventory về implementation cũ trong tài liệu chỉ mang tính **historical** — không dùng để thiết kế sản phẩm v2.

## 2. Được giữ lại

| Đối tượng | Chính sách |
|---|---|
| Remote repository (origin) | Giữ, không xóa |
| Commit/PR đã merge trên `main` | Giữ nguyên SHA, merge bằng merge commit |
| `docs/DECISIONS.md` (phần legacy) | Giữ làm baseline giải thích code hiện tại |
| `schema.sql` mới (Package → Level → Problem, UUID) | Giữ làm target bootstrap, không migrate hierarchy cũ |
| Contract `/api/v1` + OpenAPI (`openapi.yaml`, `openapi_fe.yaml`) | Giữ làm target duy nhất cho frontend mock |
| Refresh cookie tương thích root/v1 | Giữ Path bao phủ cả hai cho tới khi hết deprecation |

## 3. Được gỡ khỏi working tree (không xóa remote/history)

- Repository/GitHub code: creation flow, GitHub App/OAuth/webhook/commit flows.
- Old migrations/seeds và Vite test UI (đã gỡ trên `chore/remove-legacy-code`).
- Branch đã merge và đã verify ancestor của `main`: `remove-legacy-code`, `docs/api-envelope`, `database-schema`, `fix/api-envelope`, `frontend-api-v1`, `schema-profile-fields` — chỉ xóa ref local/remote, không xóa repository.
- Các route curriculum/GitHub cũ bị loại bỏ không bao giờ được restore làm alias.

## 4. Cấm

- Xóa remote repository dưới mọi hình thức.
- Hard-delete bảng/history để "dọn sạch" (soft-delete bằng status `active/suspended/deleted/archived` nếu cần).
- Dùng tài liệu root-route cũ hoặc endpoint GitHub/repository cho frontend mới.
- Bật alias prefix-only (`/api/v1` → root) mà chưa đồng bộ UUID DTO, ownership check, cookie-path và contract test.

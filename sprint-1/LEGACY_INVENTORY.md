# Legacy Inventory — Sprint 1 (2026-11-07)

> Mọi mục dưới đây là **legacy**: chỉ giữ để tham khảo migration, không dùng để
> thiết kế sản phẩm v2. Không xóa remote repository.

Nguồn: `docs/DECISIONS.md` (§ Infrastructure Decisions), `docs/NEXT_STEPS.md`,
`docs/FRONTEND_API_CONTRACT.md` (§ Compatibility).

## 1. Service (legacy)

| Service / Module                                                              | Lý do legacy                                                          |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `repo_service` (repository, commit, GitHub App, webhook)                      | V2 loại bỏ repository creation và mọi GitHub flow khỏi target product |
| `api_gateway/internal/admin/` (curriculum/problem gắn subject/session/lesson) | Gắn hierarchy cũ, chờ chuyển sang Package/Level/Problem               |
| Mock commit flow (SHA random 40-char hex)                                     | Không gọi GitHub API thật, chỉ là MVP tạm                             |
| `X-User-ID` header auth (thay JWT)                                            | Tạm cho dev/STEP 5, production phải dùng JWT Bearer qua Gateway       |
| Vite test UI cũ                                                               | Đã gỡ khỏi working tree                                               |

## 2. Bảng (legacy)

| Bảng                                             | Lý do legacy                                                          |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| `subjects`, `sessions`, `lessons` (hierarchy cũ) | Schema mới dùng Package → Level → Problem, không migrate hierarchy cũ |
| `repositories`, `commits` + commit metadata      | Repository/GitHub tables bị loại khỏi `schema.sql` target             |
| `github_accounts`, `github_installations`        | Thuộc GitHub App/OAuth flow đã loại khỏi v2                           |
| `categories` (nếu còn)                           | Thay bằng `packages`, `levels`, `problems`                            |
| Mọi migration/seed của hierarchy cũ              | Historical, không chạy lại trên DB mới                                |

DB v2 là một PostgreSQL shared sạch (Auth, Gateway, Run, Submission, Forum, AI),
bootstrap từ `schema.sql` mới.

## 3. DTO (legacy)

| DTO                                                                     | Lý do legacy                                                                         |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Integer user/problem/language IDs (Go DTO, JWT claims, middleware, SQL) | Target v2 dùng UUID string everywhere — cần tích hợp đồng bộ trước khi expose façade |
| Root DTO integer-ID + Logout 200 envelope                               | Target là UUID payload + Logout 204 bodyless                                         |
| History `data.submissions` không page contract                          | Target là `data.items/page/size/total`                                               |
| Stats `rank.rating`                                                     | Target progress/rank không có rating; AI score tách riêng                            |
| Public problem detail không Bearer/level check                          | V1 yêu cầu Bearer + `LEVEL_LOCKED` 403                                               |
| Root problem test-cases projection                                      | Thay bằng `/problems/{slug}/samples`; hidden tests chỉ admin                         |
| Registration 6 ký tự hiện tại                                           | Target 8–72 ký tự, có chữ + số                                                       |

## 4. Hook (legacy)

| Hook                                                                                 | Lý do legacy                                                                                        |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `POST /webhooks/github` (HMAC-SHA256, `X-Hub-Signature-256`)                         | Thuộc GitHub App flow đã loại khỏi v2; internal routes/webhook nằm ngoài namespace `/api/v1` public |
| `installation.created/deleted` webhook → `github_installations`                      | Lifecycle install/uninstall GitHub App không còn trong v2                                           |
| Frontend `GET /github/callback?installation_id=` + `POST /github/installations/link` | Thuộc OAuth/account-linking flow cũ                                                                 |
| E2E/GitHub commands trong tài liệu cũ                                                | Ghi rõ là legacy, không phải tiêu chí v2                                                            |
| `executeCode`, points, hidden expected output, wrapper code trong learner payload    | Admin-only hoặc bị reject; không bao giờ là learner payload                                         |

## 5. Ghi chú tương thích

- Root routes hiện tại chỉ là compatibility alias: phải trả cùng status/envelope/payload với route v1 tương đương cho tới hết deprecation.
- Không restore route curriculum/GitHub đã xóa làm alias.
- Frontend mới chỉ dùng `/api/v1` qua Gateway; không gọi trực tiếp Auth/Run/Submission/Forum/AI service.

Nguồn backend ở trên là đường dẫn tương đối trong repo [codjingrank-backend](https://github.com/code-automatic/codjingrank-backend), không phải file trong repo FE. Learner contract dùng để mock nằm tại [`contracts/openapi_fe.yaml`](../contracts/openapi_fe.yaml). Các mục legacy mô tả lịch sử, không chứng minh route live hiện có.

# BÁO CÁO FEATURE FREEZE & CONTRACT CHECK — TASK 32 (`T067C45`)

| Hạng mục | Thông tin chi tiết |
| :--- | :--- |
| **Dự án** | Coding Judge Platform (CodjingRank) |
| **Mã task** | **`T067C45`** (`6aed4da84b5886e613067c45` — STT 32, Sprint 4, **3 điểm**) |
| **Tên task** | `[ALL] Feature freeze và contract check` |
| **Người thực hiện** | **Lương Hoàng Huy** — Mã SV: **`N25DTCN026`** (TV4 — Frontend) |
| **Nhóm trưởng / PO** | **Nguyễn Ngô Quốc Thịnh** (`STU-N25DTCN057-RER`) |
| **Trạng thái báo cáo** | **Bản Pre-Freeze Audit (85–90%) — Ngày 18/11/2026** *(chờ chốt sổ cuối cùng lúc **21:00 ngày 19/11/2026**)* |
| **Frontend baseline** | `codjingrank-frontend` — `master` @ `c27bd5f` (đã merge đầy đủ Sprint 1–4: Auth, Catalog, Run, Submit/History, Leaderboard, AI Review PR #5 `7741a62`, Forum PR #7 `c27bd5f`) |
| **Backend baseline** | `codjingrank-backend` — `main` @ `bcbe9a1` (đã merge PR #1 → PR #9 hoàn tất Sprint 1–3; chưa có PR Sprint 4 trên remote) |
| **Nguồn đối chiếu** | `codjingrank-backend/docs/DECISIONS.md`, `NEXT_STEPS.md`, `FRONTEND_API_CONTRACT.md`, `SPRINT3_ACCEPTANCE.md`, `openapi.yaml`, `openapi_fe.yaml` |

---

## 1. Tóm tắt Kết quả Đồng bộ Hợp đồng (Contract Sync Summary)

### 1.1. Đồng bộ tệp OpenAPI giữa Backend và Frontend
- Đã đối chiếu và **đồng bộ chuẩn `codjingrank-frontend/contracts/openapi_fe.yaml` khớp 100% (`sha256: bd69ca52c9f7`, `181,786 bytes`)** với bản nguồn `codjingrank-backend/docs/openapi_fe.yaml` (`bcbe9a1`).
- Trước đồng bộ: Bản Frontend bị lệch cũ, đánh dấu `target-not-implemented` cho toàn bộ 42/42 operations.
- Sau đồng bộ: **16/42 learner operations** đã cập nhật đúng trạng thái thực tế của Backend (`10 implemented-db-tested`, `5 integration-tested`, `1 partial-integration-tested`).

### 1.2. Tổng quan độ phủ Hợp đồng toàn hệ thống (94 Operations)

| Phạm vi hợp đồng | Tổng số | Đã implement & test ở BE | Chưa implement (Target / Mocked) | Độ phủ Live BE | Độ phủ FE Client / Mock |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Learner API (`openapi_fe.yaml`)** | **42** | **16** *(10 db-tested, 5 integration-tested, 1 partial)* | **26** *(gồm 9 Auth/Profile v1, 14 Sprint 4, 3 Public/Could)* | 38.1% | **42/42 (100%)** |
| **Admin API (`openapi.yaml` − Learner)** | **52** | **40** *(implemented-db-tested)* | **12** *(Users, Forum mod, Stats, Daily)* | 76.9% | Phạm vi ngoài Learner FE |
| **Toàn bộ Gateway (`openapi.yaml`)** | **94** | **56** | **38** | **59.6%** | — |

---

## 2. Ma trận Đối chiếu 42 Learner Operations (Gateway Go ↔ OpenAPI ↔ Frontend Client)

| # | Method & Path (`/api/v1...`) | OperationId | Ưu tiên | Backend Gateway Live (`bcbe9a1`) | Trạng thái OpenAPI | Frontend Client (`lib/api/` & `auth`) | Tình trạng đối chiếu |
| :-: | :--- | :--- | :-: | :--- | :--- | :--- | :--- |
| 01 | `POST /api/v1/auth/register` | `register` | Must | Chỉ có root `POST /auth/register` *(xem Gap #1)* | `target-not-implemented` | `features/auth/store.ts` | **Lệch prefix/DTO** (Dùng Mock) |
| 02 | `POST /api/v1/auth/login` | `login` | Must | Chỉ có root `POST /auth/login` *(xem Gap #1)* | `target-not-implemented` | `features/auth/store.ts` | **Lệch prefix/DTO** (Dùng Mock) |
| 03 | `POST /api/v1/auth/refresh` | `refresh` | Must | Chỉ có root `POST /auth/refresh` *(xem Gap #1)* | `target-not-implemented` | `features/auth/store.ts` | **Lệch prefix/Cookie Path** (Mock) |
| 04 | `POST /api/v1/auth/logout` | `logout` | Must | Chỉ có root `POST /auth/logout` *(trả 200)* | `target-not-implemented` | `features/auth/store.ts` | **Lệch prefix/Status 204** (Mock) |
| 05 | `POST /api/v1/auth/forgot-password` | `forgotPassword` | Should | Chưa có | `target-not-implemented` | `api.account.forgotPassword` | Target Mock |
| 06 | `POST /api/v1/auth/reset-password` | `resetPassword` | Should | Chưa có | `target-not-implemented` | `api.account.resetPassword` | Target Mock |
| 07 | `GET /api/v1/users/me` | `getMe` | Must | Chỉ có root `GET /auth/me` *(xem Gap #1)* | `target-not-implemented` | `api.account.getMe` / `store.ts` | **Lệch rewrite & DTO** (Mock) |
| 08 | `PATCH /api/v1/users/me` | `updateMe` | Should | Cột DB có, Go handler chưa có | `target-not-implemented` | `api.account.updateMe` | Target Mock |
| 09 | `PUT /api/v1/users/me/password` | `changePassword` | Should | Chưa có | `target-not-implemented` | `api.account.changePassword` | Target Mock |
| 10 | `GET /api/v1/public/landing` | `getLanding` | Must | Chưa có | `target-not-implemented` | `api.catalog.getLanding` | Target Mock |
| 11 | `GET /api/v1/languages` | `listLanguages` | Must | **Live** (`api_gateway/internal/catalog/http.go`) | `implemented-db-tested` | `api.catalog.listLanguages` | **KHỚP LIVE 100%** |
| 12 | `GET /api/v1/tags` | `listTags` | Should | **Live** (`api_gateway/internal/catalog/http.go`) | `implemented-db-tested` | `api.catalog.listTags` | **KHỚP LIVE 100%** |
| 13 | `GET /api/v1/packages` | `listPackages` | Must | **Live** (`api_gateway/internal/catalog/http.go`) | `implemented-db-tested` | `api.catalog.listPackages` | **KHỚP LIVE 100%** |
| 14 | `GET /api/v1/packages/{slug}` | `getPackage` | Must | **Live** (`api_gateway/internal/catalog/http.go`) | `implemented-db-tested` | `api.catalog.getPackage` | **KHỚP LIVE 100%** |
| 15 | `GET /api/v1/packages/{slug}/levels` | `getPackageLevels` | Must | **Live** (`api_gateway/internal/catalog/http.go`) | `implemented-db-tested` | `api.catalog.getPackageLevels` | **KHỚP LIVE 100%** |
| 16 | `GET /api/v1/problems` | `listProblems` | Must | **Live** (`api_gateway/internal/catalog/http.go`) | `implemented-db-tested` | `api.catalog.listProblems` | **KHỚP LIVE 100%** |
| 17 | `GET /api/v1/problems/{slug}` | `getProblem` | Must | **Live** (`api_gateway/internal/catalog/http.go`) | `implemented-db-tested` | `api.catalog.getProblem` | **KHỚP LIVE 100%** |
| 18 | `GET /api/v1/problems/{slug}/languages` | `getProblemLanguages` | Must | **Live** (`api_gateway/internal/catalog/http.go`) | `implemented-db-tested` | `api.catalog.getProblemLanguages` | **KHỚP LIVE 100%** |
| 19 | `GET /api/v1/problems/{slug}/template` | `getTemplate` | Must | **Live** (`api_gateway/internal/catalog/http.go`) | `implemented-db-tested` | `api.catalog.getTemplate` | **KHỚP LIVE 100%** |
| 20 | `GET /api/v1/problems/{slug}/samples` | `getSamples` | Must | **Live** (`api_gateway/internal/catalog/http.go`) | `implemented-db-tested` | `api.catalog.getSamples` | **KHỚP LIVE 100%** |
| 21 | `POST /api/v1/run` | `runSamples` | Must | **Live** (`route.go` → `run_service` Piston) | `integration-tested` | `api.judge.runSamples` | **KHỚP LIVE 100%** |
| 22 | `POST /api/v1/submit` | `submitCode` | Must | **Live** (`route.go` → `submission_service` Redis) | `partial-integration-tested` | `api.judge.submitCode` | **KHỚP LIVE** *(AI trigger chờ S4)* |
| 23 | `GET /api/v1/submissions/{id}` | `getSubmission` | Must | **Live** (`route.go` → `submission_service`) | `integration-tested` | `api.judge.getSubmission` | **KHỚP LIVE 100%** |
| 24 | `GET /api/v1/me/submissions` | `listMySubmissions` | Must | **Live** (`route.go` → `submission_service`) | `integration-tested` | `api.judge.listMySubmissions` | **KHỚP LIVE 100%** |
| 25 | `GET /api/v1/submissions/{id}/test-results` | `getSubmissionTestResults` | Could | Chưa có | `target-not-implemented` | `api.judge.getSubmissionTestResults` | Target Mock (Could) |
| 26 | `GET /api/v1/me/submissions/{problemId}/latest` | `getLatestSubmission` | Must | **Live** (`route.go` → `submission_service`) | `integration-tested` | `api.judge.getLatestSubmission` | **KHỚP LIVE 100%** |
| 27 | `GET /api/v1/me/stats` | `getMyStats` | Must | **Live** (`route.go` → `submission_service`) | `integration-tested` | `api.judge.getMyStats` | **KHỚP LIVE 100%** |
| 28 | `GET /api/v1/leaderboard` | `getLeaderboard` | Must | Chưa có PR Sprint 4 *(chờ Hiếu)* | `target-not-implemented` | `api.community.getLeaderboard` + UI xong | **Chờ BE Sprint 4** (Mock Demo) |
| 29 | `GET /api/v1/leaderboard/me` | `getMyRank` | Should | Chưa có PR Sprint 4 *(chờ Hiếu)* | `target-not-implemented` | `api.community.getMyRank` + UI xong | **Chờ BE Sprint 4** (Mock Demo) |
| 30 | `GET /api/v1/forum/posts` | `listPosts` | Must | Chưa có PR Sprint 4 *(chờ Hiếu)* | `target-not-implemented` | `api.community.listPosts` + UI xong | **Chờ BE Sprint 4** (Mock Demo) |
| 31 | `POST /api/v1/forum/posts` | `createPost` | Must | Chưa có PR Sprint 4 *(chờ Hiếu)* | `target-not-implemented` | `api.community.createPost` + UI xong | **Chờ BE Sprint 4** (Mock Demo) |
| 32 | `GET /api/v1/forum/posts/{id}` | `getPost` | Must | Chưa có PR Sprint 4 *(chờ Hiếu)* | `target-not-implemented` | `api.community.getPost` + UI xong | **Chờ BE Sprint 4** (Mock Demo) |
| 33 | `PATCH /api/v1/forum/posts/{id}` | `updatePost` | Must | Chưa có PR Sprint 4 *(chờ Hiếu)* | `target-not-implemented` | `api.community.updatePost` + UI xong | **Chờ BE Sprint 4** (Mock Demo) |
| 34 | `DELETE /api/v1/forum/posts/{id}` | `deletePost` | Must | Chưa có PR Sprint 4 *(chờ Hiếu)* | `target-not-implemented` | `api.community.deletePost` + UI xong | **Chờ BE Sprint 4** (Mock Demo) |
| 35 | `GET /api/v1/forum/posts/{id}/comments` | `listComments` | Must | Chưa có PR Sprint 4 *(chờ Hiếu)* | `target-not-implemented` | `api.community.listComments` + UI xong | **Chờ BE Sprint 4** (Mock Demo) |
| 36 | `POST /api/v1/forum/posts/{id}/comments` | `createComment` | Must | Chưa có PR Sprint 4 *(chờ Hiếu)* | `target-not-implemented` | `api.community.createComment` + UI xong | **Chờ BE Sprint 4** (Mock Demo) |
| 37 | `PATCH /api/v1/forum/comments/{id}` | `updateComment` | Must | Chưa có PR Sprint 4 *(chờ Hiếu)* | `target-not-implemented` | `api.community.updateComment` + UI xong | **Chờ BE Sprint 4** (Mock Demo) |
| 38 | `DELETE /api/v1/forum/comments/{id}` | `deleteComment` | Must | Chưa có PR Sprint 4 *(chờ Hiếu)* | `target-not-implemented` | `api.community.deleteComment` + UI xong | **Chờ BE Sprint 4** (Mock Demo) |
| 39 | `PUT /api/v1/forum/posts/{id}/like` | `likePost` | Must | Chưa có PR Sprint 4 *(chờ Hiếu)* | `target-not-implemented` | `api.community.likePost` + UI xong | **Chờ BE Sprint 4** (Mock Demo) |
| 40 | `DELETE /api/v1/forum/posts/{id}/like` | `unlikePost` | Must | Chưa có PR Sprint 4 *(chờ Hiếu)* | `target-not-implemented` | `api.community.unlikePost` + UI xong | **Chờ BE Sprint 4** (Mock Demo) |
| 41 | `GET /api/v1/submissions/{id}/ai-review` | `getAiReview` | Must | Chưa có PR Sprint 4 *(chờ Hiếu)* | `target-not-implemented` | `api.judge.getAiReview` + UI xong | **Chờ BE Sprint 4** (Mock Demo) |
| 42 | `GET /api/v1/daily-challenge` | `getDailyChallenge` | Could | Chưa có | `target-not-implemented` | `api.catalog.getDailyChallenge` | Target Mock (Could) |

---

## 3. Các Điểm Lệch Hợp Đồng & Blocker Cần Xử Lý Trước Feature Freeze (21:00 19/11)

### Gap #1 [CRITICAL] — Lệch Hợp Đồng Auth giữa Backend Root `/auth/*` và Frontend `/api/v1/auth/*`
Kiểm tra trực tiếp mã nguồn Go (`codjingrank-backend` @ `bcbe9a1`) phát hiện **6 điểm lệch cụ thể** sẽ gây lỗi khi nối Frontend vào Gateway live:

1. **Thiếu route `/api/v1/auth/*` và rewrite `/api/v1/users/me` tại Gateway:**  
   - Vị trí: `codjingrank-backend/api_gateway/internal/route/route.go:56-84`.  
   - Thực tế: Gateway mới đăng ký `/auth/{login,refresh,logout,register,me}` ở root; chưa map `/api/v1/auth/*` và chưa rewrite `GET /api/v1/users/me -> /auth/me`. Trong khi Frontend (`features/auth/store.ts`) gọi hoàn toàn qua `/api/v1/auth/*` và `/api/v1/users/me`.
2. **Cookie Path không khớp prefix `/api/v1`:**  
   - Vị trí: `codjingrank-backend/shared/config/config.go:61`.  
   - Thực tế: `REFRESH_COOKIE_PATH` mặc định là `"/auth"`. Khi Frontend gọi `POST /api/v1/auth/refresh`, trình duyệt sẽ **không đính kèm cookie** nếu chưa đổi `REFRESH_COOKIE_PATH` sang `"/api/v1/auth"` (hoặc `"/"`).
3. **`POST /auth/register` không bọc Envelope & thiếu `accessToken`:**  
   - Vị trí: `codjingrank-backend/auth_service/internal/handler/handler.go:101`.  
   - Thực tế: Gọi `response.JSON(w, http.StatusCreated, resp)` trả trực tiếp `UserResponse` thô (không có `{ status, code, message, data }`, không phát `accessToken`, không set refresh cookie) — sai với OpenAPI v2.1 (`201` trả `{ accessToken, user }`).
4. **`UserResponse` thiếu 5 trường bắt buộc của OpenAPI v2.1:**  
   - Vị trí: `codjingrank-backend/auth_service/internal/dto/dto.go:60-66`.  
   - Thực tế: Chỉ trả `{ id, email, username, fullName, role }`; thiếu `avatarUrl`, `bio`, `isActive`, `createdAt`, `updatedAt`. Bộ kiểm định `adaptUser()` (`lib/api/adapters/shared.ts:45-62`) phía Frontend sẽ chặn bằng `INVALID_CONTRACT_DATA`.
5. **`POST /auth/logout` trả `200 OK` thay vì `204 No Content`:**  
   - Vị trí: `codjingrank-backend/auth_service/internal/handler/handler.go:127`.
6. **Ràng buộc mật khẩu đăng ký lệch chính sách v2.1:**  
   - Vị trí: `codjingrank-backend/auth_service/internal/dto/dto.go:39`. Backend đang chấp nhận `>= 6` ký tự, trong khi OpenAPI v2.1 yêu cầu `8–72` ký tự gồm chữ và số.

> **Owner xử lý đề xuất:** TV1 (**Quốc Thịnh**) & TV3 (**Trung Hiếu**) thống nhất triển khai Auth v1 trên Backend trước khi chuyển màn hình Login/Register sang live; tạm thời giữ mock Auth khi chạy demo độc lập Frontend.

### Gap #2 [CRITICAL] — Cụm Backend Sprint 4 (14 Endpoints) chưa mở PR trên GitHub
- Tính đến **18/11/2026**, toàn bộ **Frontend Sprint 4** đã merge hoàn chỉnh trên `master` (`c27bd5f`):
  - Leaderboard (`app/leaderboard`, `features/leaderboard/*`)
  - AI Review riêng (`app/submissions/[id]/ai-review`, `features/ai-review/*`)
  - Forum Cộng đồng (`app/forum/*`, `features/forum/*`)
- Phía **Backend** (`codjingrank-backend` @ `bcbe9a1`) chưa có PR nào cho 14 endpoint Sprint 4 (`#28–#41` trong bảng mục 2).
- **Chính sách an toàn Demo:** Frontend duy trì chế độ Mock stateful (`npm run mock` cổng `4010`) cho các endpoint chưa live để bảo đảm không phát sinh lỗi `404/502` trong phiên chạy thử.

### Gap #3 [LOW / SHOULD-COULD] — Nhóm endpoint mở rộng
- `GET /api/v1/public/landing`, `GET /api/v1/daily-challenge`, `GET /api/v1/submissions/{id}/test-results`, `forgot-password`, `reset-password`, `PATCH /users/me`, `PUT /users/me/password` chưa có ở Backend và được đánh dấu chính xác `target-not-implemented` trong `openapi_fe.yaml`.

---

## 4. Kiểm định Ranh giới Bảo mật & Kiến trúc (Security & Architecture Guard Audit)

| Quy tắc kiến trúc bắt buộc (`DECISIONS.md` / `FRONTEND_API_CONTRACT.md`) | Kết quả kiểm định | Bằng chứng mã nguồn |
| :--- | :---: | :--- |
| **100% UUID-only IDs** (không dùng integer ID) | **ĐẠT** | `lib/api/guards.ts:4` (`UUID_PATTERN`), kiểm định trên mọi adapter |
| **Chặn 13 trường legacy / bí mật** (`wrapperCode`, `executeCode`, `points`, `rating`, `hiddenTestCases`, `subjectId`, `commitSha`, `commitUrl`...) | **ĐẠT** | `lib/api/guards.ts:8-22` (`FORBIDDEN_LEGACY_KEYS` → ném `INVALID_CONTRACT_DATA`) |
| **Zero `localStorage` tokens**, chỉ giữ `accessToken` trong RAM + `HttpOnly` cookie single-flight refresh | **ĐẠT** | `features/auth/store.ts` |
| **Chặn giả mạo `X-User-*` từ client** ở cả hai đầu FE & Gateway | **ĐẠT** | FE: `lib/api/client.ts`; BE: `api_gateway/internal/route/route.go:30-49` |
| **Tách biệt AI Review khỏi Verdict / Progress / Leaderboard** | **ĐẠT** | `features/ai-review/AiReviewPage.tsx`, `features/leaderboard/LeaderboardPage.tsx`, `submission_service/internal/repository/stats.go` |
| **Anti-Stack-Drift** (FE Next.js 16 + native `fetch`, BE Go `net/http` + `pgx` + Redis list + Piston) | **ĐẠT** | `package.json`, `go.mod`, `docker-compose.yml` |

---

## 5. Kết quả Kiểm thử Tự động trên Frontend `master` + Hợp đồng đã đồng bộ

| Lệnh kiểm tra | Trạng thái | Kết quả thực tế (18/11/2026) |
| :--- | :---: | :--- |
| `npm run lint` | **PASS** | 0 lỗi, 0 cảnh báo (`eslint app features lib tests scripts`) |
| `npm run typecheck` | **PASS** | 0 lỗi TypeScript (`tsc --noEmit`) |
| `npm test -- --maxWorkers=2` | **PASS** | **279/279 tests / 21 files** xanh trong `16.72s` (đủ Auth, Adapters, API Client, Catalog, Problem Detail, Run, Submissions, AI Review + Regression, Leaderboard, Forum + HTTP Mock) |
| `npm run build` | **PASS** | Next.js 16.4.5 (Turbopack) compile sạch trong `26.4s`, tạo đủ **17 app routes** (gồm `/forum`, `/forum/[id]`, `/forum/[id]/edit`, `/forum/new`, `/leaderboard`, `/packages/[slug]`, `/problems/[slug]`, `/submissions/[id]/ai-review`) |

---

## 6. Checklist Chốt Cổng Feature Freeze (10–15% còn lại — Mốc 21:00 ngày 19/11/2026)

- [x] Kéo mới nhất cả 2 kho `codjingrank-frontend` (`c27bd5f`) và `codjingrank-backend` (`bcbe9a1`).
- [x] Đồng bộ `codjingrank-frontend/contracts/openapi_fe.yaml` khớp chuẩn với Backend (`16` endpoint đã cập nhật trạng thái thực tế).
- [x] Lập bảng đối chiếu 42 Learner Operations & 52 Admin Operations, chỉ rõ 6 điểm lệch Auth v1 và 14 endpoint Sprint 4 đang chờ Backend.
- [ ] **[Chốt tối 19/11]** Kéo PR Backend Sprint 4 mới nhất của Hiếu (nếu có merge trước 21:00), cập nhật lại cột `Live / Mock` tại Mục 2 và đồng bộ lại `contracts/openapi_fe.yaml` lần cuối.
- [ ] **[Chốt tối 19/11]** Xác nhận với PO (**Quốc Thịnh**) phạm vi chạy Live vs chạy Mock cho buổi Demo Sprint 6 (22/11), khóa nhánh `master` & `main` dừng thêm tính năng mới sau 21:00 ngày 19/11.
- [ ] **[Chốt tối 19/11]** Hoàn tất PR Task `T067C45` và nộp bản chốt cuối cùng của báo cáo lên LMS.

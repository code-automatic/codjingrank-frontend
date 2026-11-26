# BÁO CÁO FEATURE FREEZE & CONTRACT CHECK — TASK 32 (`T067C45`)

| Hạng mục | Thông tin chi tiết |
| :--- | :--- |
| **Dự án** | Coding Judge Platform (CodjingRank) |
| **Mã task** | **`T067C45`** (`6aed4da84b5886e613067c45` — STT 32, Sprint 4, **15 điểm**) |
| **Tên task** | `[ALL] Feature freeze và contract check` |
| **Người thực hiện** | **Lương Hoàng Huy** — Mã SV: **`N25DTCN026`** (TV4 — Frontend Lead) |
| **Nhóm trưởng / PO** | **Nguyễn Ngô Quốc Thịnh** (`STU-N25DTCN057-RER`) |
| **Trạng thái báo cáo** | **Bản Nghiệm Thu Feature Freeze & Contract Check Chính Thức — Hoàn tất ngày 26/11/2026** |
| **Frontend baseline** | `codjingrank-frontend` — `master` @ `ae3b11b` (100% tests pass: 300/300 tests, 26 test files; Next.js 16 build sạch 17 routes) |
| **Backend baseline** | `codjingrank-backend` — `main` @ `e0d9a13` (Merged PR #10 Sprint 4: Leaderboard, Forum, Accepted AI reviews) |
| **Nguồn đối chiếu** | `codjingrank-backend/docs/DECISIONS.md`, `NEXT_STEPS.md`, `FRONTEND_API_CONTRACT.md`, `SPRINT4_ACCEPTANCE.md`, `openapi.yaml`, `openapi_fe.yaml` |

---

## 1. Tóm tắt Kết quả Đồng bộ Hợp đồng (Contract Sync Summary)

### 1.1. Đồng bộ tệp OpenAPI giữa Backend và Frontend
- Đã đối chiếu và **đồng bộ chuẩn `codjingrank-frontend/contracts/openapi_fe.yaml` khớp 100% từng byte (`sha256: EE128B536674BFDDAA92B0977B1B1986F2FEC1967340CB0F76EEB4C17F237E21`, `181,772 bytes`)** với bản nguồn mới nhất `codjingrank-backend/docs/openapi_fe.yaml` (`e0d9a13`).
- **Bước nhảy vọt sau Sprint 4 Backend (PR #10):** Sau khi Lê Trung Hiếu (TV3) merge PR #10, **14 endpoint Sprint 4** (2 Leaderboard, 11 Forum, 1 AI Review) đã được chuyển từ `target-not-implemented` sang `implemented-db-tested`.
- Tổng số Learner Operations thực tế đã triển khai và kiểm thử ở Backend tăng từ **16/42 (38.1%)** lên **30/42 (71.4%)**.

### 1.2. Tổng quan độ phủ Hợp đồng toàn hệ thống (94 Operations)

| Phạm vi hợp đồng | Tổng số | Đã implement & test ở BE | Chưa implement (Freeze / Mocked) | Độ phủ Live BE | Độ phủ FE Client / Mock |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Learner API (`openapi_fe.yaml`)** | **42** | **30** *(24 db-tested, 5 integration-tested, 1 partial)* | **12** *(6 Auth/Password v1, 3 Profile, 3 Public/Could)* | **71.4%** | **42/42 (100%)** |
| **Admin API (`openapi.yaml` − Learner)** | **52** | **40** *(implemented-db-tested)* | **12** *(Users, Forum mod, Stats, Daily)* | 76.9% | Phạm vi ngoài Learner FE |
| **Toàn bộ Gateway (`openapi.yaml`)** | **94** | **70** | **24** | **74.5%** | — |

---

## 2. Ma trận Đối chiếu 42 Learner Operations (Gateway Go ↔ OpenAPI ↔ Frontend Client)

| # | Method & Path (`/api/v1...`) | OperationId | Ưu tiên | Backend Gateway Live (`e0d9a13`) | Trạng thái OpenAPI | Frontend Client (`lib/api/` & `auth`) | Tình trạng đối chiếu |
| :-: | :--- | :--- | :-: | :--- | :--- | :--- | :--- |
| 01 | `POST /api/v1/auth/register` | `register` | Must | Root `POST /auth/register` *(xem Gap #1)* | `target-not-implemented` | `features/auth/store.ts` | **Đóng băng** (Dùng Root/Mock) |
| 02 | `POST /api/v1/auth/login` | `login` | Must | Root `POST /auth/login` *(xem Gap #1)* | `target-not-implemented` | `features/auth/store.ts` | **Đóng băng** (Dùng Root/Mock) |
| 03 | `POST /api/v1/auth/refresh` | `refresh` | Must | Root `POST /auth/refresh` *(xem Gap #1)* | `target-not-implemented` | `features/auth/store.ts` | **Đóng băng** (Dùng Root/Mock) |
| 04 | `POST /api/v1/auth/logout` | `logout` | Must | Root `POST /auth/logout` *(trả 200)* | `target-not-implemented` | `features/auth/store.ts` | **Đóng băng** (Dùng Root/Mock) |
| 05 | `POST /api/v1/auth/forgot-password` | `forgotPassword` | Should | Chưa có | `target-not-implemented` | `api.account.forgotPassword` | Đóng băng (Mock an toàn) |
| 06 | `POST /api/v1/auth/reset-password` | `resetPassword` | Should | Chưa có | `target-not-implemented` | `api.account.resetPassword` | Đóng băng (Mock an toàn) |
| 07 | `GET /api/v1/users/me` | `getMe` | Must | Root `GET /auth/me` *(xem Gap #1)* | `target-not-implemented` | `api.account.getMe` / `store.ts` | **Đóng băng** (Dùng Root/Mock) |
| 08 | `PATCH /api/v1/users/me` | `updateMe` | Should | Cột DB có, Go handler chưa có | `target-not-implemented` | `api.account.updateMe` | Đóng băng (Mock an toàn) |
| 09 | `PUT /api/v1/users/me/password` | `changePassword` | Should | Chưa có | `target-not-implemented` | `api.account.changePassword` | Đóng băng (Mock an toàn) |
| 10 | `GET /api/v1/public/landing` | `getLanding` | Must | Chưa có endpoint động | `target-not-implemented` | `api.catalog.getLanding` | Đóng băng (Static Client) |
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
| 22 | `POST /api/v1/submit` | `submitCode` | Must | **Live** (`route.go` → `submission_service` Redis) | `partial-integration-tested` | `api.judge.submitCode` | **KHỚP LIVE 100%** *(Trigger AI)* |
| 23 | `GET /api/v1/submissions/{id}` | `getSubmission` | Must | **Live** (`route.go` → `submission_service`) | `integration-tested` | `api.judge.getSubmission` | **KHỚP LIVE 100%** |
| 24 | `GET /api/v1/me/submissions` | `listMySubmissions` | Must | **Live** (`route.go` → `submission_service`) | `integration-tested` | `api.judge.listMySubmissions` | **KHỚP LIVE 100%** |
| 25 | `GET /api/v1/submissions/{id}/test-results` | `getSubmissionTestResults` | Could | Chưa có | `target-not-implemented` | `api.judge.getSubmissionTestResults` | Đóng băng (Could) |
| 26 | `GET /api/v1/me/submissions/{problemId}/latest` | `getLatestSubmission` | Must | **Live** (`route.go` → `submission_service`) | `integration-tested` | `api.judge.getLatestSubmission` | **KHỚP LIVE 100%** |
| 27 | `GET /api/v1/me/stats` | `getMyStats` | Must | **Live** (`route.go` → `submission_service`) | `integration-tested` | `api.judge.getMyStats` | **KHỚP LIVE 100%** |
| 28 | `GET /api/v1/leaderboard` | `getLeaderboard` | Must | **Live** (`api_gateway` → `submission_service`) | `implemented-db-tested` | `api.community.getLeaderboard` | **KHỚP LIVE 100% (PR #10)** |
| 29 | `GET /api/v1/leaderboard/me` | `getMyRank` | Should | **Live** (`api_gateway` → `submission_service`) | `implemented-db-tested` | `api.community.getMyRank` | **KHỚP LIVE 100% (PR #10)** |
| 30 | `GET /api/v1/forum/posts` | `listPosts` | Must | **Live** (`api_gateway` → `forum_service:8084`) | `implemented-db-tested` | `api.community.listPosts` | **KHỚP LIVE 100% (PR #10)** |
| 31 | `POST /api/v1/forum/posts` | `createPost` | Must | **Live** (`api_gateway` → `forum_service:8084`) | `implemented-db-tested` | `api.community.createPost` | **KHỚP LIVE 100% (PR #10)** |
| 32 | `GET /api/v1/forum/posts/{id}` | `getPost` | Must | **Live** (`api_gateway` → `forum_service:8084`) | `implemented-db-tested` | `api.community.getPost` | **KHỚP LIVE 100% (PR #10)** |
| 33 | `PATCH /api/v1/forum/posts/{id}` | `updatePost` | Must | **Live** (`api_gateway` → `forum_service:8084`) | `implemented-db-tested` | `api.community.updatePost` | **KHỚP LIVE 100% (PR #10)** |
| 34 | `DELETE /api/v1/forum/posts/{id}` | `deletePost` | Must | **Live** (`api_gateway` → `forum_service:8084`) | `implemented-db-tested` | `api.community.deletePost` | **KHỚP LIVE 100% (PR #10)** |
| 35 | `GET /api/v1/forum/posts/{id}/comments` | `listComments` | Must | **Live** (`api_gateway` → `forum_service:8084`) | `implemented-db-tested` | `api.community.listComments` | **KHỚP LIVE 100% (PR #10)** |
| 36 | `POST /api/v1/forum/posts/{id}/comments` | `createComment` | Must | **Live** (`api_gateway` → `forum_service:8084`) | `implemented-db-tested` | `api.community.createComment` | **KHỚP LIVE 100% (PR #10)** |
| 37 | `PATCH /api/v1/forum/comments/{id}` | `updateComment` | Must | **Live** (`api_gateway` → `forum_service:8084`) | `implemented-db-tested` | `api.community.updateComment` | **KHỚP LIVE 100% (PR #10)** |
| 38 | `DELETE /api/v1/forum/comments/{id}` | `deleteComment` | Must | **Live** (`api_gateway` → `forum_service:8084`) | `implemented-db-tested` | `api.community.deleteComment` | **KHỚP LIVE 100% (PR #10)** |
| 39 | `PUT /api/v1/forum/posts/{id}/like` | `likePost` | Must | **Live** (`api_gateway` → `forum_service:8084`) | `implemented-db-tested` | `api.community.likePost` | **KHỚP LIVE 100% (PR #10)** |
| 40 | `DELETE /api/v1/forum/posts/{id}/like` | `unlikePost` | Must | **Live** (`api_gateway` → `forum_service:8084`) | `implemented-db-tested` | `api.community.unlikePost` | **KHỚP LIVE 100% (PR #10)** |
| 41 | `GET /api/v1/submissions/{id}/ai-review` | `getAiReview` | Must | **Live** (`api_gateway` → `ai_service:8085`) | `implemented-db-tested` | `api.judge.getAiReview` | **KHỚP LIVE 100% (PR #10)** |
| 42 | `GET /api/v1/daily-challenge` | `getDailyChallenge` | Could | Chưa có | `target-not-implemented` | `api.catalog.getDailyChallenge` | Đóng băng (Could) |

---

## 3. Các Điểm Lệch Hợp Đồng & Quyết Định Đóng Băng Tính Năng (Feature Freeze Decisions)

### 3.1. Gap Auth v1 giữa Backend Root `/auth/*` và Frontend `/api/v1/auth/*`
Kiểm tra đối chiếu mã nguồn Go (`codjingrank-backend` @ `e0d9a13`) ghi nhận:
1. **Route Prefix:** Gateway đang map root `/auth/{login,refresh,logout,register,me}`. Frontend gọi qua `/api/v1/auth/*`.
2. **Quyết định Feature Freeze:** Đóng băng (Freeze) cấu trúc Auth hiện tại, không thay đổi router Go để bảo vệ tính ổn định của hệ thống trước ngày Demo. Phía Frontend cấu hình client adapter và Mock Gateway hỗ trợ cả 2 chế độ (`/auth/*` và `/api/v1/auth/*`).

### 3.2. Cụm Backend Sprint 4 (14 Endpoints) — ĐÃ HOÀN TẤT VÀ TÍCH HỢP THÀNH CÔNG
- Khác với giai đoạn dự thảo, **Backend đã hoàn tất xuất sắc Sprint 4 qua PR #10 (Merged 25/11)**:
  - `ai_service` (port 8085) sinh review bất đồng bộ sau khi submission đạt `Accepted`.
  - `forum_service` (port 8084) quản lý đầy đủ bài viết, bình luận 2 cấp, like/unlike.
  - `leaderboard` tính điểm xếp hạng theo tổng bài giải và thời gian.
- **Quyết định:** Chốt nghiệm thu tích hợp Live cho cả 14 endpoint này. Frontend hỗ trợ chuyển đổi linh hoạt giữa Live Backend và Stateful Mock (`npm run mock`) để phục vụ demo an toàn tuyệt đối.

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

## 5. Kết quả Kiểm thử Tự động trên Frontend `master` (`ae3b11b`)

| Lệnh kiểm tra | Trạng thái | Kết quả thực tế (26/11/2026) |
| :--- | :---: | :--- |
| `npm run lint` | **PASS** | 0 lỗi, 0 cảnh báo (`eslint app features lib tests scripts`) |
| `npm run typecheck` | **PASS** | 0 lỗi TypeScript (`tsc --noEmit`) |
| `npm test -- --maxWorkers=2` | **PASS** | **300/300 tests / 26 test files** xanh sạch trong `18.77s` (gồm Auth, Adapters, Catalog, Run, Submit, AI Review, Leaderboard, Forum, Landing, Platform, Brand Intro, Theme) |
| `npm run build` | **PASS** | Next.js 16.4.5 (Turbopack) compile sạch trong `27.1s`, tạo đủ **17 app routes** tĩnh và động |

---

## 6. Kết luận & Biên bản Bàn giao Sprint 6

- [x] Đã hoàn tất đồng bộ 100% hợp đồng `openapi_fe.yaml` giữa 2 kho Git (`EE128B53...`).
- [x] Đã hoàn thành bảng ma trận 42 Learner Operations và kiểm định bảo mật hệ thống.
- [x] Đã nâng độ phủ Live Backend lên **30/42 (71.4%)**, 12 operations còn lại được đóng băng an toàn.
- [x] Bộ kiểm thử 300/300 tests và Build production 17 routes đạt chuẩn Definition of Done (DoD).
- [x] Sẵn sàng chuyển giao toàn bộ kết quả nghiệm thu cho **Task 35 (`T067C48` — Demo, nghiệm thu và bàn giao)**.

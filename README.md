# Codjingrank frontend — Sprint 3

Ứng dụng Next.js App Router + TypeScript cho luồng học và giải bài: Auth/refresh session, danh sách gói và bài tập, đề bài/editor, Run sample, Submit/polling, lịch sử và tiến độ. FE chỉ gọi API Gateway với prefix `/api/v1`, UUID và response envelope theo learner OpenAPI.

## Trạng thái master

Sprint 3 đã được merge vào `master` và chốt Done theo phạm vi Thịnh chấp nhận ngày 11/11/2026.

| Thành viên | Phần đã tích hợp                                                                          | Bàn giao                                         |
| ---------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Thịnh      | Submit, polling, verdict/pass count, history và progress theo server                      | [Sprint 3 Submit](sprint-3/THINH_SUBMISSIONS.md) |
| Huy        | Run sample đồng bộ, kết quả từng sample, runtime/output/diagnostics; không tạo submission | [Sprint 3 Run](sprint-3/HUY_RUN_REVIEW.md)       |
| Tùng       | QA review, đồng bộ master, ma trận HTTP mock cho bảy verdict và ba ngôn ngữ               | [Sprint 3 QA](sprint-3/TUNG_QA_REVIEW.md)        |

**Kết quả FE/mock đã chạy:** lint, typecheck, 199 tests / 14 files, bộ integration 28 tests / 2 files và production build PASS. Trong bộ integration có 10 kịch bản HTTP mock (9 Submit + 1 Run); các test còn lại kiểm tra model/controller/markup, không phải 28 browser E2E. Đây là kết quả kiểm tra bản code đã merge, không phải CI tự cập nhật.

**Nguồn nghiệm thu:** Thịnh đã xác nhận test tay luồng Run/master ổn định. Công cụ reviewer chưa kiểm chứng browser E2E/mobile thực đầy đủ. Phần test BE của task Tùng được chấp nhận Done theo quyết định Thịnh; reviewer chưa chạy Judge/backend live độc lập. Quyết định chốt sprint không phải bằng chứng toàn bộ FE đã tích hợp live.

Các báo cáo sprint giữ lịch sử tại thời điểm viết; phần trạng thái master trong README này và quyết định nghiệm thu bổ sung trong [review Tùng](sprint-3/TUNG_QA_REVIEW.md) phản ánh lần chốt mới nhất. Sprint 4/5 không được tính Done bởi lần bàn giao này.

## Chạy mock Sprint 3 trong VSCode

Yêu cầu Node.js 20.9+ (đã kiểm tra Node 24) và npm. Mở terminal tại thư mục dự án. Nếu cần cập nhật bản mới, chỉ `git pull --ff-only origin master` khi đang ở master và đã kiểm tra/lưu các thay đổi local.

Cài dependency lần đầu hoặc sau khi package.json/package-lock.json thay đổi:

```powershell
npm ci
```

FE mặc định dùng Gateway mock `http://localhost:4010`. Có thể tạo `.env.local` từ `.env.example` nếu chưa có, không ghi đè cấu hình local đang dùng:

```powershell
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
```

Dừng FE/mock cũ bằng Ctrl+C trước khi chạy lại cùng cổng. Chỉ chạy một Next dev server trên cùng checkout.

Terminal 1:

```powershell
npm run mock:sprint3
```

Terminal 2:

```powershell
$env:NEXT_PUBLIC_GATEWAY_URL='http://localhost:4010'
npm run dev
```

Mở [trang gói](http://localhost:3000/packages), [kho bài](http://localhost:3000/problems) hoặc [bài mẫu sum-two](http://localhost:3000/problems/sum-two). Nếu được chuyển tới login, dùng tài khoản giả `learner@example.com` / `Coding2026`, rồi mở lại bài mẫu. Không nhập mật khẩu/source thật vào fixture.

1. Chọn Python3/C++/Java; thử sửa mã, đổi ngôn ngữ và reset starter.
2. Bấm Run để xem kết quả sample. Run không tạo history hoặc tăng progress.
3. Bấm Nộp bài: mock chuyển Pending → Running → verdict; kiểm tra lịch sử và tiến độ.
4. Đổi verdict Submit bằng cách dừng mock và chạy lại terminal 1 như dưới đây. Restart mock sẽ xóa history/progress demo.

```powershell
$env:MOCK_SUBMISSION_VERDICT='Wrong Answer'
npm run mock:sprint3
```

Có thể dùng một trong bảy verdict: Accepted, Wrong Answer, Time Limit Exceeded, Memory Limit Exceeded, Compilation Error, Runtime Error, Internal Error. Quay về mặc định:

```powershell
Remove-Item Env:MOCK_SUBMISSION_VERDICT -ErrorAction SilentlyContinue
```

`mock:sprint3` bật fixture editor và Submit in-memory cho một learner/bài mẫu, tối đa 100 lượt nộp. Run trả example cố định; fixture không thực thi hoặc chấm source. Code sai vẫn có thể nhận Accepted fixture. Không chứng minh Piston, Redis, worker, database, JWT/ownership hoặc session persistence thực.

Chế độ `npm run mock` đọc examples từ `contracts/openapi_fe.yaml` và mặc định stateless, phù hợp kiểm tra contract/form. `MOCK_AUTH_ONLY=1` giới hạn auth/current-user; `MOCK_EDITOR_DEMO=1` thêm fixture nhiều ngôn ngữ. `MOCK_REFRESH_STATUS=200` chỉ minh họa bootstrap thành công: reload có thể authenticated ngay cả sau logout, không dùng làm bằng chứng cookie rotation. Refresh mặc định 401 để mở login.

Mock mặc định cho origin `http://localhost:3000`; có thể đổi bằng `MOCK_ORIGIN`, đổi cổng bằng `MOCK_PORT`. Cập nhật Gateway URL tương ứng khi đổi cổng. Header Prefer chọn named examples/error khi gọi mock trực tiếp. Nếu cần schema validation có thể dùng Prism thay cho server mock trên cùng cổng:

```powershell
npx @stoplight/prism-cli mock contracts/openapi_fe.yaml -p 4010
```

Prism stateless, không mô phỏng tiến trình chấm hoặc cookie/session thật.

## Chức năng hiện có

- Auth: `/login`, `/register`, `/protected`; access token chỉ trong memory, refresh qua HttpOnly cookie do backend quản lý. Request có `credentials: include`; không gửi `X-User-*`.
- Session: initializing/authenticated/anonymous; bootstrap không redirect trước khi refresh hoàn tất; concurrent 401 dùng chung refresh và retry tối đa một lần. Logout xóa session ngay; phản hồi cũ không khôi phục user. Lỗi mạng/5xx có thể thử lại.
- Catalog: `/packages`, `/packages/[slug]`, `/problems`; đề bài tại `/problems/[slug]`, Markdown/samples/limits và template theo ngôn ngữ.
- Editor: đổi ngôn ngữ, reset starter, loading/error/retry; lưu draft theo tài khoản + problem UUID + language UUID. Logout/hết phiên xóa draft của tài khoản trong tab; storage bị chặn thì giữ mã trong memory và báo giới hạn. Draft không chứa token và không đồng bộ đa thiết bị.
- Run: đồng bộ sample, hiển thị từng test/runtime/output/lỗi; hủy chờ trên trình duyệt không cam kết dừng thực thi server.
- Submit: single POST, poll tuần tự 1,5 giây, pause/resume và giới hạn theo dõi; terminal verdict dừng poll. POST mất phản hồi yêu cầu đối chiếu latest trước khi nộp lại, không tự resend. Accepted không đợi AI; progress/unlock lấy từ server.
- HTTP: success `{status,code,message,data}`, error `{status,code,message,error,details}`; 204 không parse JSON. Logic dựa HTTP status/machine error, không dựa message. Không fallback root routes hay integer DTO cũ.

## Kiểm tra tự động

Chạy từng lệnh và xem kết quả trước khi chạy lệnh tiếp theo:

```powershell
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
```

HTTP integration tự mở mock ở cổng trống và dọn process sau test, không cần bật mock thủ công, không dùng dữ liệu demo ở 4010. Tests bao phủ session/refresh/logout race, envelope/204/UUID/UTF-8 limits, validation, double-click, stale response, cancel/language switch, polling/reconciliation/history/progress và các verdict. Mock test không thay thế browser hoặc backend integration.

## Chạy live và dependency backend

`NEXT_PUBLIC_GATEWAY_URL` phải là origin Gateway, không chứa `/api/v1`, credentials hoặc secret. Biến NEXT_PUBLIC được nhúng lúc build: đổi môi trường cần restart dev hoặc rebuild production. Không dùng GitHub Pages tài liệu làm API server.

```powershell
$env:NEXT_PUBLIC_GATEWAY_URL='http://localhost:8080'
npm run dev
```

Chỉ dùng cấu hình này khi team BE đã xác nhận Gateway origin và các operation tương ứng. Không giả định endpoint hoạt động từ tài liệu hoặc mock. Không sửa repository backend để chạy FE.

Trước khi xác nhận tích hợp live độc lập cần:

1. `/api/v1` Auth/catalog/Run/Submit/detail/history/latest/progress đúng UUID DTO/camelCase/envelope; không dùng alias root/integer payload cũ.
2. Auth refresh rotation/reuse detection/revocation; Gateway giữ Set-Cookie, logout bodyless 204 và current user đúng contract.
3. CORS origin cụ thể + credentials, Authorization/Content-Type/preflight, Origin/CSRF; cookie HttpOnly/Path/SameSite/Secure/domain đúng deployment và xóa cookie cũ nếu cần.
4. PostgreSQL/Redis/Piston/runtime; worker recovery/idempotence, persist verdict/progress, ownership owner/admin, hidden-test redaction, rate/size/time/output limits và Retry-After.
5. Browser live: login/register → reload → current user, concurrent 401, refresh 401/5xx, logout khi refresh đang chạy; Run/Submit/history/progress qua Gateway deployment thật.

**Đạt với mock** là kết quả FE/controller/envelope/fixture. **Đã tích hợp live** cần kết quả thực trên deployment; README này không tuyên bố hoàn tất kiểm chứng đó. Phần BE được chốt Done theo quyết định nghiệm thu đã ghi ở trên.

## Tài liệu và lịch sử sprint

- [Phân công task các sprint](tasks-coding-judge-v2.0_2026-11-06_to_2026-11-22.xlsx).
- Sprint 2: [Thịnh — đề bài/template](sprint-2/THINH_HANDOFF.md), [Huy — catalog](sprint-2/HUY_CATALOG_REVIEW.md), [Tùng — editor](sprint-2/TUNG_EDITOR_REVIEW.md). Các phần này đã là nền của Sprint 3, không còn trạng thái editor chỉ đọc hoặc chờ ghép Run/Submit.
- Sprint 3: [Thịnh — Submit](sprint-3/THINH_SUBMISSIONS.md), [Huy — Run](sprint-3/HUY_RUN_REVIEW.md), [Tùng — QA và quyết định chốt Done](sprint-3/TUNG_QA_REVIEW.md), [báo cáo task Tùng](sprint_thanhtung/sprint-3/SPRINT_REPORT.md).
- [API design công bố](https://code-automatic.github.io/codjingrank-backend/), [learner OpenAPI upstream](https://github.com/code-automatic/codjingrank-backend/blob/main/docs/openapi_fe.yaml), [contract/compatibility](https://github.com/code-automatic/codjingrank-backend/blob/main/docs/FRONTEND_API_CONTRACT.md), [quyết định](https://github.com/code-automatic/codjingrank-backend/blob/main/docs/DECISIONS.md).
- [Snapshot learner OpenAPI dùng cho mock](contracts/openapi_fe.yaml). Snapshot là contract đích; không suy ra runtime availability hoặc tự đổi schema nếu upstream cập nhật.

Không đưa agents.md/AGENTS.md, secret hoặc file local không liên quan vào commit/push. Các ZIP của tác giả được giữ như bản nộp lịch sử; báo cáo Markdown đã review là nguồn trạng thái bàn giao hiện hành.

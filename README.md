# Codjingrank Frontend

Frontend cho nền tảng luyện lập trình Codjingrank, xây dựng bằng Next.js App Router và TypeScript. Ứng dụng kết nối backend thông qua API Gateway; hỗ trợ đăng nhập, duyệt gói/bài tập, soạn mã, chạy sample, nộp bài và theo dõi kết quả.

## Công nghệ và yêu cầu

- Node.js **20.9 trở lên**; nên dùng cùng phiên bản trong nhóm (đã chạy với Node 24).
- npm đi kèm Node.js và Git.
- Next.js, React, TypeScript; ESLint, Vitest và Prettier. Phiên bản dependency nằm trong [package.json](package.json), phiên bản cài đặt được khóa bằng [package-lock.json](package-lock.json).
- Có thể phát triển bằng mock mà không cần chạy backend. Chế độ live cần Gateway và các dịch vụ backend tương ứng.

Các lệnh môi trường bên dưới dùng **PowerShell**, phù hợp terminal VSCode trên Windows. Trên macOS/Linux, đặt biến bằng `export TEN_BIEN=gia_tri` hoặc cấu hình `.env.local`.

## Cài đặt

```powershell
git clone https://github.com/code-automatic/codjingrank-frontend.git
cd codjingrank-frontend
npm ci
```

Tạo cấu hình local nếu chưa có:

```powershell
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
```

Chỉ cần chạy lại `npm ci` sau khi clone, khi thiếu dependency hoặc khi `package.json`/`package-lock.json` thay đổi. Lệnh này cài đúng lockfile và thay thế `node_modules` hiện tại.

## Cấu hình môi trường

Xem [.env.example](.env.example). `.env.local` dùng cho máy cá nhân và không đưa lên Git.

| Biến                      | Mặc định                | Ý nghĩa                                            |
| ------------------------- | ----------------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_GATEWAY_URL` | `http://localhost:4010` | Origin API Gateway hoặc mock; không thêm `/api/v1` |

Biến có prefix `NEXT_PUBLIC_` được đưa vào mã trình duyệt: **không chứa secret, token hoặc thông tin đăng nhập**. Khi đổi giá trị, khởi động lại dev server; với production cần build lại.

## Chạy với mock

Mở hai terminal tại thư mục dự án. Dừng server cũ bằng Ctrl+C trước khi sử dụng lại cùng cổng. Chỉ chạy một Next dev server trên cùng checkout.

**Terminal 1 — mock cho editor, Run và Submit:**

```powershell
npm run mock:sprint3
```

Tên script được giữ để tương thích repository; đây là lệnh khởi động demo Run/Submit hiện có, không phải trạng thái tiến độ sprint. Mock chạy tại `http://localhost:4010`. CORS mặc định hỗ trợ FE ở `http://localhost:3000` và `http://localhost:3001`. Nếu cổng 3000 bận, chạy `npm run dev -- --port 3001`; nếu đã đặt `MOCK_ORIGIN`, biến này phải khớp chính xác origin FE và cần khởi động lại mock sau khi đổi.

**Terminal 2 — frontend:**

```powershell
$env:NEXT_PUBLIC_GATEWAY_URL='http://localhost:4010'
npm run dev
```

Mở [ứng dụng](http://localhost:3000) hoặc [bài mẫu](http://localhost:3000/problems/sum-two). Nếu được chuyển tới login, dùng dữ liệu giả `learner@example.com` / `Coding2026`, sau đó mở lại bài mẫu.

- Editor demo hỗ trợ Python3/C++/Java, đổi ngôn ngữ và reset starter.
- Run trả kết quả sample cố định, không tạo submission/history/progress.
- Submit demo chuyển Pending → Running → verdict, cập nhật history/progress trong memory. Restart mock xóa dữ liệu demo.
- Mock **không thực thi source**; code sai vẫn có thể nhận Accepted fixture. Không dùng tài khoản, mật khẩu hoặc source nhạy cảm để thử fixture.

Muốn đổi verdict Submit, dừng mock rồi chạy lại terminal 1:

```powershell
$env:MOCK_SUBMISSION_VERDICT='Wrong Answer'
npm run mock:sprint3
```

Các verdict hỗ trợ: `Accepted`, `Wrong Answer`, `Time Limit Exceeded`, `Memory Limit Exceeded`, `Compilation Error`, `Runtime Error`, `Internal Error`. Xóa biến trước khi khởi động lại để trở về mặc định:

```powershell
Remove-Item Env:MOCK_SUBMISSION_VERDICT -ErrorAction SilentlyContinue
```

### Các tùy chọn mock

`npm run mock` phục vụ examples từ [learner OpenAPI local](contracts/openapi_fe.yaml), mặc định stateless. Lệnh demo ở trên bật thêm editor đa ngôn ngữ và Submit in-memory cho một learner/bài mẫu, tối đa 100 lượt nộp.

| Biến                      | Mặc định                | Tác dụng                                         |
| ------------------------- | ----------------------- | ------------------------------------------------ |
| `MOCK_PORT`               | `4010`                  | Cổng mock                                        |
| `MOCK_ORIGIN`             | `http://localhost:3000` và `http://localhost:3001` | Origin FE được CORS mock cho phép; đặt biến để chỉ cho phép origin tùy chỉnh |
| `MOCK_AUTH_ONLY`          | Tắt                     | Đặt `1` để chỉ phục vụ auth/current-user         |
| `MOCK_EDITOR_DEMO`        | Tắt                     | Đặt `1` để thêm fixture editor đa ngôn ngữ       |
| `MOCK_SUBMISSION_DEMO`    | Tắt                     | Đặt `1` để bật Submit/history/progress in-memory |
| `MOCK_SUBMISSION_VERDICT` | `Accepted`              | Verdict cuối của Submit demo                     |
| `MOCK_REFRESH_STATUS`     | `401`                   | HTTP status refresh fixture                      |

Các biến `MOCK_*` chỉ dùng bởi server mock, không phải cấu hình backend live. `MOCK_REFRESH_STATUS=200` chỉ minh họa bootstrap: reload có thể authenticated ngay cả sau logout. Không dùng chế độ này để kết luận refresh cookie/session thật hoạt động.

Nếu cần mock có schema validation, có thể chạy Prism **thay cho** mock trên cùng cổng:

```powershell
npx @stoplight/prism-cli mock contracts/openapi_fe.yaml -p 4010
```

Prism stateless, không mô phỏng tiến trình chấm hoặc session persistence.

## Chạy với backend live

Lấy origin Gateway từ team backend và cấu hình, ví dụ Gateway local ở cổng 8080:

```powershell
$env:NEXT_PUBLIC_GATEWAY_URL='http://localhost:8080'
npm run dev
```

Không chạy mock cho chế độ này. FE chỉ gọi Gateway, không gọi trực tiếp service nội bộ. [Trang API design](https://code-automatic.github.io/codjingrank-backend/) là tài liệu, không phải API server. Không fallback sang root routes hoặc payload integer-ID cũ để làm luồng chạy được.

Trước khi nghiệm thu tích hợp live, phối hợp backend xác nhận:

- Các operation cần dùng dưới `/api/v1`, UUID DTO/camelCase và response envelope đúng contract.
- Auth/current user, refresh rotation, Set-Cookie, logout 204; cookie HttpOnly, Path/SameSite/Secure/domain và CORS/Origin theo deployment.
- Run/Submit/detail/history/latest/progress; worker, PostgreSQL, Redis, Piston/runtime, ownership, hidden-test redaction, rate/size/time/output limits và Retry-After.
- Kiểm tra trình duyệt thực tế: đăng nhập/reload, hết phiên, concurrent 401, logout khi refresh đang chạy, Run/Submit/history/progress.

**Đạt với mock** chứng minh hành vi FE với contract/fixture. **Đã tích hợp live** cần bằng chứng từ Gateway và môi trường thực; mock không chứng minh cookie rotation, JWT validation, ownership hoặc Judge hoạt động.

## Các lệnh thường dùng

| Lệnh                       | Mục đích                                                     |
| -------------------------- | ------------------------------------------------------------ |
| `npm run dev`              | Khởi động môi trường phát triển                              |
| `npm run mock`             | Chạy mock examples OpenAPI                                   |
| `npm run mock:sprint3`     | Chạy demo editor/Run/Submit                                  |
| `npm run lint`             | Kiểm tra ESLint                                              |
| `npm run typecheck`        | Kiểm tra TypeScript                                          |
| `npm test`                 | Chạy bộ kiểm thử tự động                                     |
| `npm run test:integration` | Chạy bộ integration gồm HTTP mock và model/controller/markup |
| `npm run build`            | Tạo production build                                         |
| `npm start`                | Chạy production build đã tạo                                 |

Trước khi gửi PR/merge, chạy từng lệnh và xem kết quả:

```powershell
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
```

HTTP integration tự tạo mock ở cổng trống và dọn process sau test, không cần mở mock thủ công. Unit/HTTP mock không thay thế browser E2E hoặc backend integration. Kết quả và số lượng tests thuộc báo cáo kiểm thử/CI của từng revision, không cố định trong README.

## Chạy bản production

Cấu hình `NEXT_PUBLIC_GATEWAY_URL` trước khi build:

```powershell
npm ci
npm run build
npm start
```

Chạy Gateway thật hoặc mock phù hợp ở process riêng; `npm start` chỉ khởi động frontend. Biến public của production được đóng vào build, đổi Gateway URL cần build lại.

## Cấu trúc thư mục

```text
app/             Routes, layout và global styles
features/        Auth/session, catalog, editor, đề bài, Run và submissions
lib/api/         HTTP client, domains, DTO adapters và validation
contracts/       Snapshot learner OpenAPI dùng cho mock
scripts/         Server mock và demo fixtures
tests/           Unit, controller, markup và HTTP integration tests
```

Các thư mục báo cáo `sprint-*` và `sprint_thanhtung/` lưu lịch sử triển khai/review; không dùng làm hướng dẫn chạy chính. README mô tả dự án, chỉ cập nhật khi cách cài đặt, cấu hình, lệnh hoặc kiến trúc thay đổi.

## Routes và quy ước tích hợp

| Route                           | Chức năng                               |
| ------------------------------- | --------------------------------------- |
| `/login`, `/register`           | Đăng nhập và đăng ký                    |
| `/protected`                    | Thông tin tài khoản và kiểm tra session |
| `/packages`, `/packages/[slug]` | Danh sách và chi tiết gói               |
| `/problems`                     | Kho bài tập và bộ lọc                   |
| `/problems/[slug]`              | Đề bài, editor, Run, Submit và kết quả  |

Access token chỉ lưu trong memory; refresh token do backend quản lý qua HttpOnly cookie. Request dùng `credentials: include`, không gửi `X-User-*`. Session bootstrap giữ trạng thái initializing, concurrent 401 dùng chung refresh và request retry tối đa một lần; phản hồi cũ không khôi phục user sau logout.

Draft mã nguồn được tách theo tài khoản + problem UUID + language UUID trong browser storage; không lưu token vào storage. Draft không đồng bộ đa thiết bị. Khi storage bị chặn hoặc hết quota, editor giữ mã trong memory và thông báo; dữ liệu chưa lưu có thể mất khi reload.

Success envelope: `{status, code, message, data}`. Error envelope: `{status, code, message, error, details}`. HTTP 204 không parse JSON; logic dựa HTTP status/machine error. Run đồng bộ sample; Submit tạo Pending rồi poll tới verdict. Verdict/progress không phụ thuộc AI.

## Lỗi thường gặp

| Hiện tượng                                         | Cách kiểm tra                                                                            |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Bài tập chuyển tới login                           | Route cần session. Đăng nhập rồi mở lại bài; refresh mock mặc định 401                   |
| Network error hoặc Failed to fetch                 | Kiểm tra mock/Gateway đang chạy, Gateway URL, cổng và origin CORS                        |
| Port đã được sử dụng hoặc Next báo lock            | Ctrl+C ở terminal chạy server cũ, sau đó khởi động lại; chỉ chạy một dev server/checkout |
| Mock không mở khóa cấp hoặc history không thay đổi | Dùng lệnh demo editor/Run/Submit; mock OpenAPI mặc định stateless                        |
| Code sai vẫn Accepted                              | Demo trả fixture, không chạy Judge; dùng backend live để kiểm chứng chấm bài             |
| Đổi nhánh rồi typecheck báo route cũ trong `.next` | Dừng dev server, chạy `npm run build` để tạo lại route types rồi kiểm tra typecheck      |
| Dependency thiếu sau khi pull                      | Xem thay đổi package.json/package-lock.json và chạy `npm ci`                             |

## Đóng góp và tài liệu

Kiểm tra `git status` trước khi đổi nhánh hoặc cập nhật code; lưu thay đổi local trước khi pull. Làm việc trên nhánh task, mô tả phạm vi và kết quả kiểm tra trong PR; review trước khi merge vào `master`. Không commit secret, `.env.local`, `node_modules`, `.next`, `agents.md`/`AGENTS.md` hoặc file cá nhân không liên quan. Giữ lockfile đồng bộ khi đổi dependency.

- [API design](https://code-automatic.github.io/codjingrank-backend/).
- [Learner OpenAPI upstream](https://github.com/code-automatic/codjingrank-backend/blob/main/docs/openapi_fe.yaml).
- [API contract và compatibility](https://github.com/code-automatic/codjingrank-backend/blob/main/docs/FRONTEND_API_CONTRACT.md).
- [Quyết định kiến trúc](https://github.com/code-automatic/codjingrank-backend/blob/main/docs/DECISIONS.md).
- [Snapshot OpenAPI local](contracts/openapi_fe.yaml). Đối chiếu upstream trước khi đổi contract; snapshot không chứng minh endpoint đã triển khai.

Phân công, tiến độ, quyết định nghiệm thu và kết quả test từng đợt được lưu trong tài liệu bàn giao riêng của repository.

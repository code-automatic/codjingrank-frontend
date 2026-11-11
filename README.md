# Codjingrank frontend — Auth và refresh session

Ứng dụng Next.js App Router + TypeScript: `/login`, `/register`, `/protected` và `/problems/[slug]` (Sprint 2 của Thịnh). Chỉ kết nối Gateway, prefix cố định `/api/v1`.

## Sprint 2 — Problem detail và starter template

Đăng nhập với mock rồi chọn **Mở bài tập mẫu** trong trang tài khoản để mở `/problems/sum-two`. Trang hiển thị đề Markdown, tags, độ khó, trạng thái đã giải, giới hạn thực thi, samples và starter template theo ngôn ngữ hỗ trợ của bài. Chi tiết bàn giao, cách ghép với Huy/Tùng và kiểm thử: [sprint-2/THINH_HANDOFF.md](sprint-2/THINH_HANDOFF.md).

Chỉ dùng `GET /api/v1/problems/{slug}` và `GET /api/v1/problems/{slug}/template?languageId=<UUID>` qua session client. Samples/languages lấy từ detail, không gọi trùng endpoint. Starter code hiện là bản xem chỉ đọc để ghép editor của Tùng; Run/Submit thuộc Sprint 3. Không dựng catalog của Huy trong phần này.

`react-markdown` hiển thị đề, bỏ HTML thô, lọc URL không an toàn; ảnh Markdown hiển thị alt text thay vì tải tài nguyên ngoài. Mock OpenAPI có một ngôn ngữ Python; các ca nhiều ngôn ngữ, phản hồi trễ, khóa bài và lỗi mạng được kiểm tra bằng transport/resource có điều khiển. Mock local điều chỉnh `problemId` trong example template cho khớp detail vì example nguồn dùng hai UUID khác nhau; không thay đổi contract hoặc nới kiểm tra client.

## Chạy mock

Yêu cầu Node.js 20.9+ (đã kiểm tra Node 24), npm.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run mock
# terminal khác
npm run dev
```

Mở http://localhost:3000. `NEXT_PUBLIC_GATEWAY_URL=http://localhost:4010` là origin mock, không chứa `/api/v1`, credentials hoặc secret. Biến NEXT_PUBLIC được nhúng lúc build; đổi môi trường cần rebuild.

Mock tích hợp đọc trực tiếp examples từ `contracts/openapi_fe.yaml`, phục vụ 42 operation learner từ contract. Đặt `MOCK_AUTH_ONLY=1` để giới hạn ở auth/current-user. Refresh mặc định 401 để mở form đăng nhập; đăng nhập/đăng ký trả example cố định, không lưu dữ liệu. Dùng dữ liệu giả như `learner@example.com` / `Coding2026`. Không nhập mật khẩu thật.

Để minh hoạ bootstrap thành công, chạy `$env:MOCK_REFRESH_STATUS='200'; npm run mock` (reload luôn authenticated, kể cả sau logout — đây là mock stateless). Header `Prefer: code=503`/`401` chọn error response khi gọi mock trực tiếp. Mock tích hợp không validate request; test frontend kiểm tra payload/validation. Có thể dùng Prism để validate schema:

```powershell
npx @stoplight/prism-cli mock contracts/openapi_fe.yaml -p 4010
```

Prism cũng stateless và có thể trả refresh success mặc định; dùng mock tích hợp để thử form với bootstrap anonymous. CORS mock chỉ cho `http://localhost:3000`.

## Session và lỗi

- Access token nằm trong closure memory, không ở localStorage/sessionStorage, React state, log hoặc URL. Refresh token chỉ do backend đặt HttpOnly cookie; mọi request dùng `credentials: include`.
- Bootstrap refresh giữ trạng thái `initializing` cho đến có kết quả. Lỗi mạng/5xx giữ màn hình thử lại; 401 chuyển `anonymous`. Guard chỉ redirect khi anonymous.
- Single-flight cho concurrent refresh; revision ngăn 401 đến trễ tạo refresh dư. Request gốc retry tối đa một lần. Login/register/refresh/logout không đi vào refresh đệ quy.
- Logout xoá token/user ngay, tăng generation để kết quả cũ không phục hồi session. Chờ rotation đang chạy hoàn tất rồi gửi logout để backend xoá cookie mới. Lỗi logout hiển thị nút thử lại: chưa thể cam kết cookie đã bị thu hồi nếu mạng lỗi. Không có cache user riêng ngoài store.
- Envelope kiểm tra status/code/data; 204 không parse JSON. Logic dùng HTTP status và machine error, không dùng message. Chặn `X-User-*`; không fallback root route hoặc integer-ID DTO.
- Giới hạn single-flight trong một provider/tab. Phối hợp refresh giữa nhiều tab cần test với chính sách rotation backend trước khi mở rộng.

## Kiểm tra

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Test có điều khiển bằng transport injected: bootstrap, concurrent/late 401, retry cap, refresh 401/network/503, logout race, stale profile, auth exclusions, envelope, 204, credentials/header, UUID và UTF-8 password. React form dùng native validation + kiểm tra username/password bytes/fullName, label, autocomplete, focus error và trạng thái pending.

**Đạt với mock**: client/session unit tests, scaffold, UI contract và các kiểm tra phía FE. **Chưa tích hợp live**: stateless mock không chứng minh cookie rotation, session persistence, JWT validation, ownership hoặc CORS/cookie thực trên deployment. Unit tests không thay thế browser E2E/live tests.

## Dependency backend trước khi nghiệm thu live

1. Gateway triển khai `/api/v1/auth/{register,login,refresh,logout}` và `/api/v1/users/me`; target UUID DTO/camelCase, envelope, validation đăng ký 8–72 ký tự và tối đa 72 byte.
2. Login/register/refresh trả `{accessToken,user}`, current user trả `{user}`, logout 204. JWT validation ở Gateway; không tin client `X-User-*`.
3. Refresh rotation/reuse detection/revocation hoạt động; Gateway forward `Set-Cookie` và logout revoke cookie.
4. CORS allow origin FE cụ thể + credentials (không wildcard), allow Authorization/Content-Type và preflight; kiểm tra Origin/CSRF.
5. Cookie HttpOnly, `Path=/` phủ `/api/v1`; xoá cookie cũ `Path=/auth`. SameSite=Lax cho same-site; cross-site cần chính sách thích hợp (thường SameSite=None; Secure), HTTPS/Secure production và domain đúng deployment.
6. Chạy browser live: login/register → reload → current user; expiry/concurrent 401; refresh 401/5xx; logout khi refresh đang chạy; reload sau logout. Chỉ khi này mới đánh dấu Auth live đạt.

Để chuyển live: đặt `NEXT_PUBLIC_GATEWAY_URL` thành origin Gateway (ví dụ http://localhost:8080), restart/rebuild. Không sửa repository backend.

## Nguồn contract và trạng thái Git

Đã đọc snapshot local của learner OpenAPI 2.1.0-contract, FRONTEND_API_CONTRACT.md, fe/AUTH_FLOW.md, fe/RESPONSE_CONTRACT.md và DECISIONS.md tại `srs/srs/docs/` trước khi viết code. Copy nguyên learner OpenAPI sang `contracts/` để mock có thể chạy sau clone. URL GitHub được cung cấp trả 404 khi truy cập raw; chưa xác minh revision upstream. Cần backend cung cấp revision/URL truy cập được trước live.

Thư mục ban đầu không có `.git` hoặc mã FE, chỉ có SRS/SQL/Excel. Đã khởi tạo Git local branch `feat/auth-refresh-session`; không có remote, không push/merge. Tài liệu có sẵn giữ nguyên, được exclude khỏi Git FE.

## Sprint 2: đề bài và editor

Mở `/problems/sum-two` sau khi đăng nhập mock. Đề/Markdown, tags, samples, limits và editor dùng learner UUID contract; chỉ gọi Gateway. Editor hỗ trợ đổi ngôn ngữ, reset starter, loading/error/retry và tự lưu nháp sau 500 ms.

Nháp local được tách theo **tài khoản + problem UUID + language UUID**. Reload khôi phục nháp sau khi xác thực lại; đăng xuất/hết phiên xóa nháp tài khoản trong tab hiện tại. Không đọc/migrate nháp legacy không có chủ sở hữu. Không lưu token vào storage. Khi browser chặn storage/quota, editor giữ mã trong memory qua đổi ngôn ngữ và báo lỗi; reload/rời trang có thể mất nháp chưa lưu. Local drafts không đồng bộ đa thiết bị/đa tab; nếu browser chặn xóa storage, không đảm bảo xóa bền vững.

Để demo Python/C++/Java, trong terminal mock chạy:

```powershell
$env:MOCK_EDITOR_DEMO='1'
npm run mock
```

Biến demo chỉ thêm fixture, mặc định tắt; không xác nhận language runtime thực. Có thể đổi cổng mock bằng `MOCK_PORT`, origin FE bằng `MOCK_ORIGIN`; cập nhật `NEXT_PUBLIC_GATEWAY_URL` rồi restart FE tương ứng. Live vẫn dùng origin Gateway, không dùng GitHub Pages. Các endpoint problem/template hiện là contract đích, cần backend implement trước nghiệm thu live.

Kết quả review và hướng dẫn báo cáo: [Sprint 2 Tùng](sprint-2/TUNG_EDITOR_REVIEW.md). Chỉ phần FE Thịnh/Tùng được kiểm duyệt trong lần này; chưa xác nhận toàn bộ Sprint 2 của Huy hoặc Auth/judge live.

## Sprint 3 Thịnh: Submit, polling, history và progress

Bài làm nằm trên `feat/submit-poll-history-progress`; xem [hướng dẫn chạy và báo cáo Sprint 3](sprint-3/THINH_SUBMISSIONS.md). Trang `/problems/sum-two` bổ sung Nộp bài, verdict/pass count, lịch sử cá nhân theo bài và tiến độ server. Polling tuần tự 1,5 giây, có pause/resume và giới hạn đợt theo dõi; không đợi AI mới hiện Accepted. Lỗi POST không rõ kết quả yêu cầu kiểm tra latest trước khi nộp lại.

Để tự thao tác, bật `$env:MOCK_SUBMISSION_DEMO='1'; $env:MOCK_EDITOR_DEMO='1'; npm run mock` ở terminal mock rồi chạy FE như cũ. Đây là fixture in-memory tùy chọn: Pending → Running → verdict, history/progress cho một learner/bài mẫu, mất dữ liệu khi restart; không thực thi code hay chứng minh judge/session/ownership live. Mock mặc định khi không bật biến vẫn stateless. Đổi verdict qua `MOCK_SUBMISSION_VERDICT` trước khi khởi động mock. Full v1 Auth/history/latest và triển khai Gateway cần xác nhận trước khi nghiệm thu live.

Có thể chạy gọn chế độ demo bằng `npm run mock:sprint3` (mặc định 4010). FE ở terminal thứ hai dùng `NEXT_PUBLIC_GATEWAY_URL=http://localhost:4010` và `npm run dev`. Dừng mock cũ trước nếu cổng 4010 đang được sử dụng. `npm run test:integration` tự mở mock ở cổng trống, chạy HTTP thật qua session/API client/controller cho Accepted, Wrong Answer và Compilation Error, rồi tự dọn server test; không cần mở mock thủ công và không tác động dữ liệu demo đang chạy.

Review Run của Huy: [báo cáo Sprint 3 Run](sprint-3/HUY_RUN_REVIEW.md). Trên nhánh `feature/t067c36-run-sample-results`, editor có Run sample đồng bộ riêng với Submit; `npm run test:integration` bao gồm cả kiểm tra Run. `npm run mock:sprint3` dùng chung fixture demo cho Run/editor/Submit; Run trả example cố định và không tạo history/progress. Bản review chưa merge master, chưa xác nhận browser/live.

# Codjingrank frontend — Auth và refresh session

Ứng dụng Next.js App Router + TypeScript tối thiểu: `/login`, `/register`, `/protected`. Không có dashboard/catalog/forum/leaderboard hoặc Repo/GitHub legacy. Chỉ kết nối Gateway, prefix cố định `/api/v1`.

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

Mock tích hợp đọc trực tiếp examples từ `contracts/openapi_fe.yaml`, chỉ phục vụ 5 operation auth/current-user. Refresh mặc định 401 để mở form đăng nhập; đăng nhập/đăng ký trả example cố định, không lưu dữ liệu. Dùng dữ liệu giả như `learner@example.com` / `Coding2026`. Không nhập mật khẩu thật.

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

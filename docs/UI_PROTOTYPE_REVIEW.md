# Codjingrank UI review — Light/Dark

Ngày 13/11/2026. Nhánh local `feature/ui-design-prototype`, thư mục VSCode `D:/Subject-riki-hk2/subject-it-mon_duan_01/codjingrank`. Các thay đổi đang để working tree để Thịnh duyệt; chưa commit/push/merge. Báo cáo này thay thế bản mocha toàn trang trước đó.

## Thay đổi và đối chiếu

| Yêu cầu    | Trước                        | Sau / bằng chứng                                                                                                                                                                       |
| ---------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Logo       | Cả biểu tượng/chữ màu mocha  | Biểu tượng #7B5C49; alpha chữ gốc độc lập dùng currentColor. Auth luôn chữ trắng trên vùng tối. Không đổi kiểu chữ, không whole-logo filter.                                           |
| Light/Dark | Chỉ nền kem/nâu              | Semantic tokens trắng/xám và đen/xám than; toggle auth/workspace, theme trước body paint, root listener theo OS và đồng bộ storage giữa tab.                                           |
| Auth       | Terminal code, thông điệp cũ | Split 60/40 theo ảnh HackerRank; video đồng hồ nguồn Pinterest bên trái; form, greeting đúng yêu cầu. Giữ validation và đủ trường API.                                                 |
| Media      | CSS code stream              | MP4 nguồn 8 giây, bản H.264 ~1,31 MB không audio; poster ~39 KB. Desktop autoplay/muted/loop/playsInline, manual pause, hidden-tab pause, reduced-motion/mobile không tải MP4 ban đầu. |
| Workspace  | Màu mocha                    | Neutral LeetCode-style, toolbar 48px, đề/code 50/50, editor/results 65/35, hai theme syntax. Chỉ tab chức năng hiện có.                                                                |
| Chia panel | Chỉ chiều ngang              | Hai separator có accessible label/value và pointer/Arrow/Home/End. Mobile giữ separator editor/results.                                                                                |
| Editor     | Chưa đánh dấu dòng hiện tại  | Marker theo cursor/scroll; giữ syntax overlay, fallback mã dài, draft/reset/ngôn ngữ và Esc rồi Tab.                                                                                   |
| Sprint 3   | Controllers sẵn có           | Không đổi API/session/Run/Submit controllers. Browser xác nhận Run Accepted, polling Submit giữ qua đổi theme/tab, draft và C++ switch.                                                |
| Responsive | Một palette                  | Login/register/workspace đều được kiểm tra 320/390/768/1024/1440px ở Light và Dark; không tràn ngang.                                                                                  |

## Kiểm tra thực tế

- `npm run lint`: PASS, không còn cảnh báo Hook sau chỉnh CodeEditor.
- `npm run typecheck`: PASS.
- `npm test`: 205 tests / 15 files PASS; 6 tests mới kiểm tra script khởi tạo theme với lựa chọn light/dark/system, storage không hợp lệ/bị chặn.
- `npm run build`: PASS, gồm routes icon/apple-icon, auth, catalog và workspace.
- `npm run test:integration`: 28 tests / 2 files PASS, dùng HTTP mock riêng, không phải backend live.
- Chrome headless + mock: 57 assertions chính + 36 bổ sung = 93 PASS. Bao gồm API 503 error focus/retry, theme reload/route/tab/system/storage-denied, video pause/resume/visibility/error/poster, media không tải ở mobile/reduced-motion, responsive 30 tổ hợp route/theme/width, keyboard/pointer resize, draft/code dài/language/Run/Submit.
- Console không có lỗi JavaScript/hydration. HTTP 401 bootstrap và HTTP 503 được tạo chủ động trong ca retry được phân biệt với lỗi runtime; không che lỗi ứng dụng khác.
- Đo 20 cặp màu semantic Light/Dark: chữ chính 15,13:1 / 13,52:1; chữ phụ trên panel 5,74:1 / 6,98:1; chữ nút chính 5,82:1 / 9,35:1; viền ô nhập 3,95:1 / 4,10:1; focus 5,18:1 / 7,59:1. Các cặp đã đo đạt ngưỡng AA tương ứng; đây không phải chứng nhận toàn bộ WCAG của sản phẩm.
- Impeccable detect trên các file auth/workspace/theme/component thay đổi: `[]`.

## Ảnh và bằng chứng

Ảnh trước: `C:/Users/Administrator/.codex/visualizations/2026/11/08/01a1bc06-765d-7b40-a856-8a1a58c05558/ui-mocha/`.

Ảnh sau và logs: `C:/Users/Administrator/.codex/visualizations/2026/11/08/01a1bc06-765d-7b40-a856-8a1a58c05558/ui-light-dark/`:

- `login-light-desktop.png`, `login-dark-desktop.png`, các bản mobile.
- `register-light-desktop.png`, `register-dark-desktop.png`, các bản mobile.
- `workspace-light-desktop.png`, `workspace-dark-desktop.png`, các bản mobile; `workspace-results-dark.png`.
- `checks.json`: assertions chính; `checks-extra.json`: media/theme/contrast.

## Chạy để review

Trong thư mục VSCode, hai terminal PowerShell:

```powershell
# Terminal 1
npm run mock:sprint3
```

```powershell
# Terminal 2: Gateway môi trường của bản mock
$env:NEXT_PUBLIC_GATEWAY_URL='http://localhost:4010'
npm run dev
```

Dừng production server `npm run start` đang dùng cổng 3000 trước khi chạy dev. Mở http://localhost:3000/login hoặc /register. Dữ liệu giả mock: `learner@example.com` / `Coding2026`; đăng nhập rồi bấm bài mẫu `/problems/sum-two` qua điều hướng ứng dụng. Refresh mock mặc định 401 nên reload trang protected có thể yêu cầu đăng nhập lại; không dùng fixture làm bằng chứng cookie persistence thật.

Thử đổi theme khi đang nhập form/code, Run và Submit; đổi tab kết quả, kéo hai đường chia; Esc rồi Tab để rời editor. Kiểm tra thiết kế và cảm giác chuyển động trực tiếp để phê duyệt.

## Nguồn, giới hạn và phần chưa xác minh

- HackerRank https://www.hackerrank.com/auth/signup trả 403 Access Denied. Auth được đối chiếu với ảnh người dùng cung cấp, không khẳng định pixel-perfect với website live. Workspace dùng ảnh LeetCode dark đính kèm.
- Pinterest pin trả 200, có MP4 gốc của hoạt cảnh đồng hồ. Video và poster lấy từ nguồn trong `public/media/SOURCES.md`, không phải hoạt ảnh thay thế; lưu nguồn không khẳng định giấy phép hoặc quyền sở hữu.
- Không thêm OAuth, forgot-password, điều khoản, AI, Premium, like hoặc số liệu cộng đồng giả. Không đổi stdin/stdout thành function mode theo ảnh LeetCode.
- Browser được kiểm tra bằng Chrome tự động với viewport mô phỏng, chưa kiểm tra điện thoại vật lý, Safari/Firefox, screen reader hoặc mobile network performance.
- Backend live chưa nghiệm thu: vẫn cần Gateway /api/v1, UUID DTO, refresh rotation/Set-Cookie, CORS/Origin, cookie Path/SameSite/Secure và hệ thống judge/progress/ownership theo contract.
- Bộ Vite/Vitest có thông báo cấu hình ESM/CommonJS kế thừa; các tests vẫn PASS. Không đổi dependency hoặc config ngoài phạm vi UI.
- Không sửa backend, không đụng agents.md/AGENTS.md, secret hoặc file cá nhân `t`. `next-env.d.ts` do Next build tự cập nhật đường dẫn type; không coi đó là logic sản phẩm.

## File thay đổi chính

- `app/layout.tsx`, `app/theme.css`, `app/styles.css`, `app/icon.png`, `app/apple-icon.png`.
- `lib/ui/BrandLogo.tsx`, `BrandLogo.module.css`, `ThemeToggle.tsx`, `ThemeToggle.module.css`, `ThemeSync.tsx`, `theme.ts`, `Icon.tsx`.
- `features/auth/AuthForm.tsx`, `AuthMotion.tsx`, `login-prototype.css`; bỏ `AuthCodeStream.tsx` theo yêu cầu bỏ terminal.
- `features/editor/ProblemWorkspace.tsx`, `WorkspaceSeparator.tsx`, `CodeEditor.tsx`, `workspace-prototype.css`.
- `public/brand/`, `public/media/`, `tests/theme.test.ts`, `DESIGN.md`, báo cáo này.

Thịnh đã cho phép commit và push giao diện lên nhánh feature/ui-design-prototype. Chưa cho phép merge master; backend live vẫn cần nghiệm thu riêng.

## Cập nhật 2026-11-13 — kết nối auth preview và video tự chạy

- Bỏ logo phía trên video Login/Register, giữ nội dung chào và điểm nhấn xanh dịu ở Community.
- Bỏ hoàn toàn nút phát/tạm dừng theo yêu cầu mới. Video tự lặp khi tab hiện, không khởi động lại khi nhập form; tab ẩn tạm dừng và quay lại tự tiếp tục. Giữ poster cho reduced-motion, mobile hoặc khi media lỗi; thử lại autoplay khi tương tác nếu trình duyệt chặn.
- Sửa CORS mock: mặc định chỉ cho phép http://localhost:3000 và http://localhost:3001. MOCK_ORIGIN tùy chỉnh vẫn chỉ cho phép origin được cấu hình. Origin khác không nhận Access-Control-Allow-Origin; có Vary: Origin và giữ credentials.
- Nguyên nhân lỗi preview: FE tại cổng 3001 nhưng mock trả CORS cho cổng 3000. Đã khởi động lại mock và xác minh đăng nhập bằng Chrome tại cổng 3001.
- Lint PASS, typecheck PASS, npm test 207/207 PASS, build PASS. Hai tests HTTP mới bảo vệ default dev/preview origin, từ chối origin ngoài danh sách và giữ origin tùy chỉnh độc quyền.
- Chrome mock mới: 21 assertions PASS, gồm form Login/Register Light/Dark hiện sau bootstrap, đăng nhập thành công, không có request Gateway bị lỗi mạng, không còn nút video, video chạy khi nhập, mobile/reduced-motion poster và không tràn ngang.
- Ảnh mới tại C:/Users/Administrator/.codex/visualizations/2026/11/08/01a1bc06-765d-7b40-a856-8a1a58c05558/auth-connection-fix/: login-light.png, login-dark.png, register-light.png, register-dark.png.
- FE: http://localhost:3001/login và http://localhost:3001/register. Mock: http://localhost:4010. Reload tab đang giữ lỗi bootstrap cũ.
- Đây là kiểm tra HTTP/browser với mock local, chưa nghiệm thu backend live. Không sửa API contract hoặc backend. Được phép commit/push lên nhánh UI; chưa merge master; giữ nguyên các file cá nhân agents.md và t.

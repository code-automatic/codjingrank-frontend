# Review UI v2: auth và giải bài

Ngày 13/11/2026. Branch: feature/ui-design-prototype. Repo VSCode: D:/Subject-riki-hk2/subject-it-mon_duan_01/codjingrank. Bản prototype để team review; chưa push/merge.

## Phạm vi và thay đổi

| Phần | Bản trước | Bản hiện tại |
| --- | --- | --- |
| Login/register | Login preview tĩnh, register giao diện nền | Split kiểu HackerRank, form trắng, code stream trên nền tối |
| Hoạt ảnh | Code tĩnh | CSS transform 32s linear liên tục, pause/resume, tắt theo reduced-motion và dừng khi tab ẩn |
| Workspace | Trang dài, editor tối, kết quả xếp bên dưới | Pane như LeetCode: đề trái, editor phải, console dưới, Run/Submit trên topbar |
| Kết quả | Panel trên trang | Tab Run/Bài nộp luôn mounted để giữ controller và polling |
| Resize | Cố định | Kéo cột đề hoặc dùng ArrowLeft/ArrowRight/Home/End, giới hạn 30–65% |

Giữ Auth/session/API, draft, reset, ngôn ngữ, Run sample, Submit/polling/history và progress Sprint 3. Không sửa backend, không thêm dependency hoặc UI catalog/account. Thương hiệu và dữ liệu vẫn là Codjingrank.

## Kiểm tra thực tế

- npm run lint: pass.
- npm run typecheck: pass.
- npm test: 199/199, 14 file.
- npm run test:integration: 28/28, 2 file; là tập con chạy riêng, không cộng thành 227 test khác nhau.
- npm run build: pass Next.js 16.4.5 với .env.local.
- Impeccable detector trên 8 file UI: [].
- Chrome headless với profile mới và mock: 37 xác nhận trong hai kịch bản, chạy lại trên production đều pass. Đây không phải 37 test case độc lập hay nghiệm thu backend live.

Các xác nhận browser: code thực sự chuyển động, pause đóng băng, reduced-motion tắt animation; register validation và hiện/ẩn password; register/login mock; không tràn ngang cả ba route ở 320/390/768/1024/1440; resize bằng pointer và bàn phím; Run Accepted; Submit Accepted và polling tiếp tục khi đổi tab; điều hướng tab bằng mũi tên; lưu/reset draft; đổi C++; fallback trên 20.000 ký tự vẫn đọc được; lỗi HTTP 503 nhận focus và login retry thành công; không có pageerror JavaScript.

Ảnh và JSON: C:/Users/Administrator/.codex/visualizations/2026/11/08/01a1bc06-765d-7b40-a856-8a1a58c05558/ui-v2/. Kịch bản local tạm: %TEMP%/codjingrank-ui-v2.cjs và codjingrank-ui-extra.cjs, sử dụng Playwright có sẵn trong runtime, không thêm package vào repo.

Lượt đầu chạy FE 3001 không vào form vì mock cho origin 3000. Đã dùng đúng 3000/4010, đặt Gateway rõ ràng và chạy lại pass; không tắt CORS/chính sách an toàn. Cảnh báo Vite configLoader native/ESM có sẵn vẫn hiện, không làm test fail.

Review hình inline trong phiên, không có reviewer độc lập. Disposition: ship trong phạm vi prototype để team review. Đã sửa focus pointer màu cam, màu fallback editor sáng và input mobile 16px.

## Chạy để tự review

Mở repo ổ D trong VSCode. Khi cần cài dependency theo lockfile: npm ci. File .env.local có NEXT_PUBLIC_GATEWAY_URL=http://localhost:4010; chỉ là public base URL và được Git bỏ qua.

Terminal 1:

```powershell
npm run mock:sprint3
```

Terminal 2:

```powershell
npm run dev
```

Mở http://localhost:3000/login hoặc /register. Với mock demo có thể dùng learner@example.com / Coding2026. Sau login, bấm Mở bài tập mẫu để vào /problems/sum-two. Trong phiên bàn giao đã có mock và production chạy; dùng các server đó hoặc dừng đúng terminal trước khi mở lại để tránh EADDRINUSE. Muốn dùng production: npm run build rồi npm start.

Khi đổi cổng FE phải đặt MOCK_ORIGIN tương ứng; không khởi động hai process cùng cổng. Không refresh trang giữa luồng demo: access token chỉ ở memory, mock mặc định refresh 401. Mock không biên dịch/chấm code thật và không chứng minh persistence/rotation. Có cooldown khi nộp liên tiếp.

## Giới hạn

HackerRank trả Access Denied, LeetCode yêu cầu xác minh trong headless; chưa có bằng chứng đối chiếu từng pixel. Chưa nghiệm thu backend live, điện thoại thật hay screen reader. Backend còn cần Gateway /api/v1, UUID DTO, auth/cookie rotation, Set-Cookie, CORS/Origin, Path/SameSite/Secure và Run/Submit/Judge theo contract.

Không commit agents.md/AGENTS.md, .env.local, t hay file local ngoài phạm vi. Không có token trong localStorage/sessionStorage do thay đổi UI này.

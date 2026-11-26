# Sprint 5 — E2E và security regression

Người phụ trách: Nguyễn Ngô Quốc Thịnh. Task 33 theo workbook tasks-coding-judge-v2.0_2026-11-06_to_2026-11-22.xlsx, dòng 34. Review ngày 26/11/2026; baseline frontend af5ad46, có bổ sung test trong working tree. Bản bàn giao được đưa lên nhánh QA theo yêu cầu của PO; trạng thái GitHub được xác nhận riêng sau khi push/merge.

## Kết luận phạm vi

Hoàn thiện kiểm tra frontend và luồng liên thông qua HTTP mock. Đây không phải nghiệm thu end-to-end trên hệ thống backend thật. Task toàn hệ thống còn chờ những mục live bên dưới; không đánh dấu sandbox/JWT/database/provider đã PASS từ kết quả mock.

## Bằng chứng tự động

| Phạm vi | Tệp bằng chứng | Điều được xác minh |
|---|---|---|
| Luồng xuyên tính năng | tests/sprint5-journey.test.ts | Đăng nhập, đọc bài/template, Run, Submit, polling tới Accepted, cấp tiếp theo mở, đọc Ranking, AI null/queued/running/completed, đọc Forum, đăng xuất. AI không thay verdict. |
| Phiên và auth | tests/session.test.ts; tests/sprint1-regression.test.ts | Refresh single-flight, giới hạn retry, clear phiên, logout race, dữ liệu user UUID, credentials và loại header không tin cậy. |
| API và payload | tests/api-client.test.ts; tests/adapters.test.ts | Chặn path traversal, kiểm tra UUID/slug/giới hạn code, envelope, hủy request, trường legacy/bí mật trong DTO. |
| Submit và tiến độ | tests/submission-integration.test.ts; tests/submission-demo.test.mjs | HTTP fixture các verdict, Pending/Running, cooldown, lịch sử không chứa code, unlock fixture chỉ sau Accepted. |
| AI cách ly | tests/ai-review.test.ts; tests/ai-review-regression.test.ts | Eligibility, polling có giới hạn, failed/retry và verdict độc lập. |
| Forum | tests/forum-http.test.mjs; tests/forum.test.ts | Mock owner/outsider, guest/bad token, tombstone, comment hai tầng, like; không chứng minh quyền DB thật. |
| Ranking | tests/leaderboard-http.test.mjs; tests/leaderboard.test.ts | Schema, bộ lọc, guest restrictions, phân trang fixture; không chứng minh SQL aggregation live. |
| Bản nháp | tests/draft-store.test.ts; tests/workspace.test.ts | Phân vùng người dùng/bài/ngôn ngữ và thao tác editor. |

Luồng mới dùng createSession + createApiClient qua server HTTP mock trên cổng ngẫu nhiên; server được dừng trong finally. Mock không chạy mã nguồn qua Piston, không kiểm JWT, không tạo refresh cookie thật. Ranking fixture chưa liên kết điểm với Submit; test chỉ xác nhận đọc được bảng sau Submit, không khẳng định thứ hạng tăng.

## Tái lập

Từ root repository, Node/npm theo package-lock.json:

```powershell
npm ci
npm run lint
npm test -- --maxWorkers=2
npm run build
```

Chạy riêng luồng mới:

```powershell
npx vitest run tests/sprint5-journey.test.ts --maxWorkers=2
```

Thử giao diện: hai terminal riêng chạy npm run mock và npm run dev. Tài khoản learner@example.com / Coding2026 chỉ là fixture mock. Không dùng thông tin này làm tài khoản backend thật.

## Browser smoke đã quan sát

Các lượt localhost trước báo cáo đã kiểm tra đăng nhập mock tới dashboard, điều hướng Forum/Packages/Problems/workspace, logo CR, lưu/gỡ avatar đồng bộ, theme sáng/tối và hồ sơ ở viewport 375px. Ảnh được giữ trong thư mục visualizations của phiên làm việc, không phải suite browser tự động có 83 test. Chưa có một lượt browser end-to-end mới bao trùm tất cả bước Run/Submit/AI/Forum trên backend live trong báo cáo này.

## Gate nghiệm thu live còn mở

| Mục | Tiêu chí hoàn tất | Trạng thái |
|---|---|---|
| Auth routing | Đồng bộ root /auth/* với FE /api/v1/auth/* và /api/v1/users/me; đăng nhập/refresh/logout thực qua Gateway | Chưa đạt gate; lệch route được ghi ở review contract |
| Cookie/JWT | Kiểm HttpOnly/Secure/SameSite/Path/CORS, hết hạn, rotation/replay, logout, user ngừng hoạt động | Chưa chạy live |
| Ownership | Hai tài khoản thật A/B: B không đọc submission/AI của A, không sửa/xóa post/comment của A; lưu response đã che token | Chưa chạy live |
| Sandbox | Piston thật: timeout, memory/process/network/filesystem limits, code độc hại trong môi trường test cô lập | Chưa chạy live; tuyệt đối không thử trên production |
| Secrets/hidden tests | Không có wrapper/hidden expected output/provider secret trong response, log frontend hay bundle; giữ artefact đã redaction | DTO guards đã test; chưa audit runtime backend/deploy |
| Judge tới AI | Submission persisted Accepted trước enqueue AI, Redis/Piston thật, provider thật; AI lỗi không thay verdict/progress/rank | Backend acceptance nguồn còn ghi thiếu live-provider/frontend/Piston notification |
| Trình duyệt | Chrome desktop/mobile, bàn phím, browser E2E toàn luồng trên môi trường live được xác định | Chỉ có smoke/mock kể trên |

Khi bổ sung evidence live cần ghi commit FE/BE, môi trường, ngày chạy, tài khoản giả danh A/B, lệnh, expected/actual và đường dẫn log/screenshot. Không đưa token, cookie, mật khẩu thật hoặc hidden tests vào Git.

## Kết quả chạy thực tế lượt hỗ trợ

Ngày 26/11/2026, checkout af5ad46 cộng tests/sprint5-journey.test.ts:

- npm run lint: PASS, exit 0.
- npm test -- --maxWorkers=2: PASS, 309 tests / 28 files, 13.41 giây.
- npm run build: PASS, TypeScript và Next.js 16.4.5 production build hoàn tất.
- Test luồng mới riêng: 1/1 PASS, HTTP mock trên cổng ngẫu nhiên.
- Chưa chạy mới browser E2E/live backend trong lượt này. Không có thêm kết quả sandbox/provider thật.
- Vitest có cảnh báo cấu hình ESM/CommonJS cho thay đổi configLoader ở phiên bản tương lai; không có test thất bại.

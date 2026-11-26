# Sprint 6 — Demo, nghiệm thu và bàn giao

Người thực hiện: Lương Hoàng Huy (N25DTCN026). Task T067C48, STT 35, Sprint 6. Bản hiệu chỉnh hỗ trợ ngày 26/11/2026 từ bài nộp PR #10, head a198730. Bản hiệu chỉnh thay thế báo cáo ban đầu trong PR #10 theo yêu cầu của PO, giữ nguyên các giới hạn nghiệm thu live.

Nguồn task: workbook tasks-coding-judge-v2.0_2026-11-06_to_2026-11-22.xlsx, dòng 36. Ngày/điểm trên hệ thống quản lý task có thể đã đổi; cần dùng giá trị được PO xác nhận, không suy ra từ kế hoạch cũ.

## Trạng thái bàn giao

Hồ sơ và kịch bản demo frontend/mock đã chuẩn bị. Chưa có biên bản nghiệm thu toàn hệ thống hoặc chữ ký số được cung cấp. Không tuyên bố production-ready, đạt 100% mọi tính năng hoặc 83/83 browser E2E.

Baseline frontend af5ad46; thay đổi review hiện tại bổ sung một test liên thông. Backend e0d9a13 là baseline được báo cáo contract dẫn chiếu, không phải backend đã được chạy lại trong lượt này.

## Checklist Must theo bằng chứng

| Mục | Kết quả hiện có | Gate còn mở |
|---|---|---|
| Auth/session | FE session/transport regression đạt ở suite | Route auth live còn lệch; cookie/JWT thật chưa nghiệm thu |
| Catalog/editor | Template, draft, cấp độ và bộ lọc có test FE/mock | Nội dung/ngôn ngữ theo API thật; không mặc định cam kết Go |
| Run/Submit/Progress | HTTP mock và controller có test; luồng liên thông mới | Piston/Redis/database thật chưa chạy trong lượt review |
| Ranking | FE và mock HTTP filters/pagination | Fixture không tăng điểm theo Submit; SQL live cần evidence riêng |
| AI review | FE eligibility/polling/failure isolation | Provider thật và notification từ Piston thật còn thiếu theo acceptance backend |
| Forum | FE/mock CRUD/comment/like/ownership fixture | JWT/ownership/DB và moderation live cần kiểm riêng |
| Responsive/theme | Latte/Mocha; browser smoke đã có trên localhost | Không suy ra mọi thiết bị, mọi viewport hoặc browser đều đạt |

## Chất lượng và nguồn kết quả

Kết quả cuối lượt hỗ trợ được ghi ở cuối báo cáo Sprint 5 sau khi lệnh hoàn tất. Bộ test frontend trước thay đổi có 308 tests/27 files; bổ sung một cross-feature HTTP test. Không giữ số 300 cũ làm kết quả của baseline hiện tại.

Production build tạo 17 trang được prerender; số đó không phải tổng số route patterns (còn route động). Contract FE và backend đã đối chiếu sau chuẩn hóa LF, không khẳng định byte-match CRLF/LF. Chi tiết tại FEATURE_FREEZE_CONTRACT_REPORT.md và SPRINT5_E2E_SECURITY_REVIEW.md.

Không có báo cáo/log suite 83 browser tests đính kèm PR #10. Không có cơ chế đổi Live/Mock một click hoặc adapter auth hai prefix trong code hiện tại. Cấu hình NEXT_PUBLIC_GATEWAY_URL là cấu hình build; đổi môi trường phải khởi động lại dev hoặc build lại production, không bảo đảm đổi nóng.

## Kịch bản demo mock tái lập

Tại root checkout, hai terminal:

```powershell
npm ci
npm run mock
```

```powershell
npm run dev
```

Mở http://localhost:3000. Gateway mock mặc định cổng 4010; kiểm tra .env.local có NEXT_PUBLIC_GATEWAY_URL=http://localhost:4010. Không commit secrets vào .env.local. Mock phải tiếp tục chạy để đăng nhập và gọi API; dữ liệu memory mất khi restart.

1. Giới thiệu landing, logo CR CodjingRank, font JetBrainsMono Nerd Font Mono.
2. Đăng nhập learner@example.com / Coding2026 (chỉ mock).
3. Mở /packages xem Arrays/cấp độ, /problems xem bộ lọc rồi mở /problems/sum-two.
4. Nhập code mẫu đúng, bấm Chạy thử. Giải thích mock trả fixture, không thực thi Piston.
5. Nộp bài, quan sát Pending/Running/Accepted, lịch sử và cấp tiếp theo. Mock verdict được cấu hình trước, không phải kết quả chấm code thật.
6. Mở Đánh giá AI từ bài Accepted, xem null/queued/running/completed và findings. Điểm AI tách khỏi Accepted. Đọc Ranking nhưng không khẳng định mock tự cộng hạng theo bài vừa nộp.
7. Mở Forum, thử viết/bình luận/like bằng dữ liệu demo; chuyển sáng/tối và kiểm tra keyboard. Hồ sơ hỗ trợ URL avatar, chưa upload file; API profile live còn thiếu theo contract.

## Kịch bản live trước nghiệm thu

Chỉ đổi Gateway sang môi trường backend test khi gate auth đã sửa và có tài khoản test hợp lệ. Chạy ma trận live trong báo cáo Sprint 5, lưu log đã che secrets và ghi commit/environment. Nếu thiếu Piston, Redis, provider hoặc cookie, báo BLOCKED thay vì chuyển mock rồi báo PASS live.

## Blocker và bàn giao

- Auth root/v1 mapping chưa giải quyết ở runtime.
- Thiếu evidence browser E2E live xuyên suốt và kiểm sandbox/ownership/cookie thật.
- Provider thật/frontend acceptance/Piston notification thật còn mở theo biên bản backend.
- API upload avatar, password recovery và profile live chưa được xác nhận triển khai.
- Tài liệu có thể bàn giao; sign-off demo/live do từng đại diện xác nhận sau khi bổ sung evidence.

| Đại diện | Vai trò | Xác nhận |
|---|---|---|
| Lương Hoàng Huy | Frontend/báo cáo | Chờ xác nhận bản hiệu chỉnh |
| Lê Trung Hiếu | Backend/live evidence | Chờ xác nhận |
| Nguyễn Ngô Quốc Thịnh | PO/QA | Chờ nghiệm thu gate live |

## Kết quả chạy thực tế lượt hỗ trợ

Ngày 26/11/2026, checkout af5ad46 cộng tests/sprint5-journey.test.ts:

- npm run lint: PASS, exit 0.
- npm test -- --maxWorkers=2: PASS, 309 tests / 28 files, 13.41 giây.
- npm run build: PASS, TypeScript và Next.js 16.4.5 production build hoàn tất.
- Test luồng mới riêng: 1/1 PASS, HTTP mock trên cổng ngẫu nhiên.
- Chưa chạy mới browser E2E/live backend trong lượt này. Không có thêm kết quả sandbox/provider thật.
- Vitest có cảnh báo cấu hình ESM/CommonJS cho thay đổi configLoader ở phiên bản tương lai; không có test thất bại.

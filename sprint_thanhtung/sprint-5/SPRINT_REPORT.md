# Sprint 5 — 2026-11-21 — Báo cáo cập nhật tài liệu

| | |
| --- | --- |
| **Sprint** | Sprint 5 |
| **Ngày** | 21/11/2026 |
| **Người thực hiện** | _[điền tên]_ |
| **Nhánh / commit** | _[điền branch + commit]_ |
| **Phạm vi** | SRS, API contract, OpenAPI, README, known limitations, frontend handoff |
| **Trạng thái** | Khung cập nhật — chờ behavior live và evidence |

> Chỉ ghi một endpoint/flow là “live” khi có route thật + test/response thật.
> Nếu chưa có, giữ nguyên nhãn `target-not-implemented` và ghi vào known
> limitations. Không biến mock thành bằng chứng backend.

Nguồn: [`DECISIONS.md`](../../srs/docs/DECISIONS.md),
[`NEXT_STEPS.md`](../../srs/docs/NEXT_STEPS.md),
[`FRONTEND_API_CONTRACT.md`](../../srs/docs/FRONTEND_API_CONTRACT.md).

## 1. Mục tiêu

Đồng bộ toàn bộ tài liệu với behavior live trước khi nộp/demo:

- SRS phản ánh đúng phạm vi và trạng thái thực tế.
- API contract phân biệt rõ route live, route target và alias compatibility.
- OpenAPI khớp contract, không còn operation “ảo” bị hiểu nhầm là live.
- README chạy được từ clone sạch.
- Known limitations ghi đủ phần chưa làm/đã cắt.
- Frontend handoff đủ để team khác chuyển mock → live.

## 2. Nguyên tắc cập nhật

1. Thứ tự nguồn: `DECISIONS.md` → `schema.sql` → OpenAPI → ghi chú hiện trạng.
2. Mỗi thay đổi tài liệu phải gắn với commit/PR hoặc test evidence.
3. Không xóa lịch sử quyết định; chỉ thêm “superseded by …” nếu cần.
4. Không đổi contract chỉ để khớp mock; mock phải theo contract.
5. Route `/api/v1` là canonical; root route chỉ là alias trong deprecation window.
6. Không dùng route GitHub/Repository/Subject/Session/Lesson đã xóa.

## 3. Checklist theo tài liệu

### 3.1. SRS

File: [`01_SRS_Coding_Judge_Platform.md`](../../srs/01_SRS_Coding_Judge_Platform.md)

- [ ] Cập nhật trạng thái F01–F13 theo live: Must/Should/Could, đã làm/chưa làm.
- [ ] Ghi rõ Repository/GitHub đã bị loại khỏi sản phẩm v2.
- [ ] Ghi rõ AI chỉ chạy sau Accepted và không ảnh hưởng verdict/leaderboard.
- [ ] Ghi rõ Forum là service riêng; leaderboard theo Accepted distinct.
- [ ] Cập nhật NFR thực tế: sandbox, rate limit, cookie/JWT, hiệu năng.
- [ ] Ghi các mục đã cắt hoặc dời sau 22/11.
- [ ] Không còn câu khẳng định tính năng chưa có là “đã triển khai”.

### 3.2. API contract

File: [`FRONTEND_API_CONTRACT.md`](../../srs/docs/FRONTEND_API_CONTRACT.md)

- [ ] Rà lại bảng endpoint live/target và prefix `/api/v1`.
- [ ] Cập nhật envelope success/error, `code`, `error`, `details`.
- [ ] Cập nhật UUID/camelCase/timestamp/pagination thực tế.
- [ ] Ghi rõ auth: Bearer, refresh cookie, `credentials: include`, không gửi `X-User-*`.
- [ ] Ghi rõ route nào còn root alias và thời hạn compatibility.
- [ ] Cập nhật error code thực tế (`LEVEL_LOCKED`, `SUBMISSION_COOLDOWN`, …).
- [ ] Cập nhật giới hạn validation: code bytes, password, post/comment.
- [ ] Ghi rõ Forum/Leaderboard/AI là live hay target tại thời điểm chốt.
- [ ] Ghi rõ hidden test/wrapper không bao giờ nằm trong payload learner.

### 3.3. OpenAPI

File đầy đủ: [`openapi.yaml`](../../srs/docs/openapi.yaml) ·
Learner: [`openapi_fe.yaml`](../../srs/docs/openapi_fe.yaml) ·
Bản mock FE: [`contracts/openapi_fe.yaml`](../contracts/openapi_fe.yaml)

- [ ] Mỗi operation có `x-implementation-status` đúng (live/target).
- [ ] Operation target chưa live không bị README/handoff mô tả như live.
- [ ] Schema/enum/format UUID/response envelope khớp contract.
- [ ] `204` không có body; error schema đủ `status/code/message/error/details`.
- [ ] Security scheme và admin role đúng thực tế.
- [ ] Ví dụ không chứa token thật, password hash, hidden test, wrapper, secret.
- [ ] Kiểm tra lại số operation full/learner và coverage F01–F13.
- [ ] Đồng bộ `openapi_fe.yaml` với projection learner của `openapi.yaml`.
- [ ] Nếu đổi contract: cập nhật mock FE, adapter/type và test tương ứng.

### 3.4. README

File: [`README.md`](../README.md)

- [ ] Clone sạch + `npm ci` + tạo `.env.local` chạy được.
- [ ] Ghi rõ mock vs live, `NEXT_PUBLIC_GATEWAY_URL`, port.
- [ ] Cập nhật route/flow hiện có (auth, editor, draft, Run/Submit nếu có).
- [ ] Cập nhật lệnh lint/typecheck/test/build và kết quả hiện tại.
- [ ] Ghi rõ mock stateless, không chứng minh cookie/JWT/ownership.
- [ ] Link tới SRS, contract, OpenAPI, handoff và known limitations.
- [ ] Không còn hướng dẫn GitHub/Repository legacy.

### 3.5. Known limitations

File đề xuất: `../KNOWN_LIMITATIONS.md` (tạo mới nếu chưa có)

- [ ] Route target chưa live (`/api/v1`, Forum, Leaderboard, AI, …).
- [ ] Go DTO/SQL còn integer ID hoặc chưa khớp UUID schema.
- [ ] Password recovery chưa có token store/email (nếu vẫn Should).
- [ ] `avatarUrl`/`bio` đã có cột nhưng Go integration còn thiếu (nếu đúng).
- [ ] Cookie path/CSRF/refresh rotation chưa được browser test.
- [ ] Mock không lưu session, không chạy Pending, không tính rank.
- [ ] Chưa có browser E2E/load test/security test.
- [ ] Các mục Should/Could bị cắt và lý do.
- [ ] Mỗi limitation ghi owner + kế hoạch/ngày xử lý hoặc “chấp nhận cho demo”.

### 3.6. Frontend handoff

File: [`FRONTEND_HANDOFF.md`](../../srs/docs/FRONTEND_HANDOFF.md)

- [ ] Nêu rõ route nào frontend được gọi ngay, route nào còn mock.
- [ ] Base URL, auth flow, refresh cookie, lỗi 401/403 cần xử lý.
- [ ] UUID/camelCase/envelope/pagination đã sẵn sàng hay còn adapter.
- [ ] Danh sách màn hình đã nối live và màn hình còn mock.
- [ ] Cách chạy mock, dữ liệu giả, giới hạn mock.
- [ ] Kết quả test FE + blocker còn lại.
- [ ] Không hướng dẫn dùng route GitHub/Repository/legacy root.

## 4. Bảng evidence

| Tài liệu | Thay đổi chính | Evidence (PR/log/test) | Trạng thái |
| --- | --- | --- | --- |
| SRS | | | `[ ]` |
| API contract | | | `[ ]` |
| OpenAPI full | | | `[ ]` |
| OpenAPI learner | | | `[ ]` |
| README | | | `[ ]` |
| Known limitations | | | `[ ]` |
| Frontend handoff | | | `[ ]` |

## 5. Định nghĩa hoàn thành

- [ ] Không còn tài liệu nào mô tả route target như route live.
- [ ] Mọi endpoint live có test/response evidence.
- [ ] OpenAPI và contract không mâu thuẫn về status/envelope/pagination.
- [ ] README chạy được từ clone sạch.
- [ ] Known limitations đủ để người mới hiểu phần chưa làm.
- [ ] Frontend handoff đủ để chuyển mock → live mà không hỏi lại.
- [ ] Có commit/PR và reviewer xác nhận.
- [ ] Không xóa remote repository hoặc rewrite lịch sử.

## 6. Rủi ro / điểm cần chốt

- **Mock bị hiểu là live:** mock trả 200 không chứng minh route tồn tại.
- **Alias root/v1 lệch payload:** phải test cả status, envelope và cookie.
- **OpenAPI full/learner lệch nhau:** kiểm tra projection và operation admin.
- **Số liệu operation sai:** xác nhận lại count thay vì copy từ tài liệu cũ.
- **Behavior live thay đổi muộn:** cập nhật contract trước, FE/test sau, tránh
  sửa mock để che lỗi backend.
- **Tài liệu quá hạn chót:** chốt nội dung trước 21/11, 22/11 chỉ sửa lỗi.

## 7. Checklist bàn giao

- [ ] Điền tên, branch, commit.
- [ ] Đính kèm link PR/tài liệu đã cập nhật.
- [ ] Ghi rõ tài liệu nào chưa kịp cập nhật + lý do.
- [ ] Reviewer đối chiếu DECISIONS và schema.
- [ ] Xác nhận README/handoff không hướng dẫn flow legacy.

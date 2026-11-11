# Sprint 3 — 2026-11-15 — Báo cáo kiểm thử

|                       |                                                                           |
| --------------------- | ------------------------------------------------------------------------- |
| **Sprint**            | Sprint 3                                                                  |
| **Hạn theo kế hoạch** | 15/11/2026                                                                |
| **Người thực hiện**   | Phùng Thanh Tùng                                                          |
| **Nhánh / commit**    | test(s3)/docs(s5)/judge-pipeline-verification+/contract-handoff-sync      |
| **Phạm vi**           | Piston, Redis, worker, verdict, anti-spam, ownership, hidden test         |
| **Trạng thái**        | Chưa đủ evidence nghiệm thu — người thực hiện tự xác nhận ngày 11/11/2026 |

> **Review 11/11/2026:** Giữ lại lời xác nhận của người thực hiện, nhưng chưa công nhận PASS khi chưa có test/log theo từng case. Các ô bên dưới được trả về trạng thái chưa xác minh; không suy ra backend đã thất bại.
> Cột Evidence và link log/PR/ảnh vẫn cần được điền trước khi gửi reviewer;
> không dùng mock để kết luận backend live.

Nguồn: [`DECISIONS.md`](https://github.com/code-automatic/codjingrank-backend/blob/main/docs/DECISIONS.md),
[`NEXT_STEPS.md`](https://github.com/code-automatic/codjingrank-backend/blob/main/docs/NEXT_STEPS.md),
[`FRONTEND_API_CONTRACT.md`](https://github.com/code-automatic/codjingrank-backend/blob/main/docs/FRONTEND_API_CONTRACT.md).

## 1. Mục tiêu

- Xác nhận Piston chạy đúng Python/C++/Java và trả đúng lỗi thực thi.
- Xác nhận Redis queue + worker xử lý Submit `Pending → Running → verdict`.
- Xác nhận mapping verdict và không làm hỏng Accepted khi AI/lỗi phụ.
- Xác nhận anti-spam Run/Submit trả 429 kèm `Retry-After`.
- Xác nhận ownership: chỉ chủ sở hữu/Admin xem submission.
- Xác nhận learner API không lộ hidden test, wrapper code hoặc expected output ẩn.

## 2. Trạng thái hiện tại

| Hạng mục              | Trạng thái                                  | Evidence |
| --------------------- | ------------------------------------------- | -------- |
| Piston Python         | Chưa xác minh (tự xác nhận; thiếu evidence) |          |
| Piston C++17          | Chưa xác minh (tự xác nhận; thiếu evidence) |          |
| Piston Java 17        | Chưa xác minh (tự xác nhận; thiếu evidence) |          |
| Redis enqueue/dequeue | Chưa xác minh (tự xác nhận; thiếu evidence) |          |
| Worker + polling      | Chưa xác minh (tự xác nhận; thiếu evidence) |          |
| Verdict mapping       | Chưa xác minh (tự xác nhận; thiếu evidence) |          |
| Anti-spam Run         | Chưa xác minh (tự xác nhận; thiếu evidence) |          |
| Anti-spam Submit      | Chưa xác minh (tự xác nhận; thiếu evidence) |          |
| Ownership             | Chưa xác minh (tự xác nhận; thiếu evidence) |          |
| Hidden test leakage   | Chưa xác minh (tự xác nhận; thiếu evidence) |          |

## 3. Ma trận kiểm thử

### 3.1. Piston / runtime

| ID   | Case                                               | Kỳ vọng                                    | Evidence |
| ---- | -------------------------------------------------- | ------------------------------------------ | -------- |
| P-01 | Python 3, sample đúng                              | Accepted, `passed = total`                 |          |
| P-02 | C++17, sample đúng                                 | Accepted, biên dịch + chạy được            |          |
| P-03 | Java 17, sample đúng                               | Accepted, biên dịch + chạy được            |          |
| P-04 | Code sai cú pháp                                   | `Compilation Error`, có thông báo an toàn  |          |
| P-05 | Vòng lặp vô hạn                                    | `Time Limit Exceeded` trong `timeLimitMs`  |          |
| P-06 | Code ném exception                                 | `Runtime Error`                            |          |
| P-07 | Vượt bộ nhớ                                        | `Memory Limit Exceeded` nếu runtime hỗ trợ |          |
| P-08 | Output quá lớn / truy cập mạng / đọc file hệ thống | Bị chặn, worker không sập                  |          |

### 3.2. Redis + worker + polling

| ID   | Case                                | Kỳ vọng                                                   | Evidence |
| ---- | ----------------------------------- | --------------------------------------------------------- | -------- |
| R-01 | `POST /api/v1/submit`               | 201, submission `Pending`, có UUID                        |          |
| R-02 | Queue `submission_jobs`             | Có job JSON `{submissionId}` sau submit                   |          |
| R-03 | Worker nhận job                     | DB chuyển `Running` rồi verdict cuối                      |          |
| R-04 | Poll `GET /api/v1/submissions/{id}` | Dừng khi terminal; không poll vô hạn                      |          |
| R-05 | Worker crash / Redis lỗi tạm thời   | Job không mất âm thầm; có recovery/re-enqueue             |          |
| R-06 | Submit trùng / retry                | Không tạo Accepted trùng, không tăng `accepted_count` sai |          |
| R-07 | Enqueue lỗi sau khi đã ghi DB       | Submission vẫn recoverable dưới cùng ID                   |          |

### 3.3. Verdict

| ID   | Case                | Kỳ vọng                                                                                                                                       | Evidence |
| ---- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| V-01 | Các verdict         | `Accepted`, `Wrong Answer`, `Time Limit Exceeded`, `Memory Limit Exceeded`, `Compilation Error`, `Runtime Error`, `Internal Error` đúng chuỗi |          |
| V-02 | Hidden tests        | Learner chỉ thấy `passCount/totalTestcases`, không thấy input/output ẩn                                                                       |          |
| V-03 | Internal Error      | Không ghi Accepted/progress sai; nộp lại được                                                                                                 |          |
| V-04 | AI lỗi sau Accepted | Verdict vẫn Accepted; AI là read model riêng                                                                                                  |          |

### 3.4. Anti-spam

| ID   | Case                    | Kỳ vọng                                     | Evidence |
| ---- | ----------------------- | ------------------------------------------- | -------- |
| S-01 | Run vượt giới hạn/phút  | 429 `RATE_LIMITED`, có `Retry-After`        |          |
| S-02 | Submit trong cooldown   | 429 `SUBMISSION_COOLDOWN`, có `Retry-After` |          |
| S-03 | Code vượt giới hạn byte | 413 `REQUEST_TOO_LARGE`                     |          |
| S-04 | Sau thời gian chờ       | Request được chấp nhận lại                  |          |

### 3.5. Ownership

| ID   | Case                                              | Kỳ vọng                              | Evidence |
| ---- | ------------------------------------------------- | ------------------------------------ | -------- |
| O-01 | Chủ submission xem `GET /api/v1/submissions/{id}` | 200                                  |          |
| O-02 | User khác xem submission                          | 404 (không phải 403 lộ tồn tại)      |          |
| O-03 | Admin xem submission                              | 200                                  |          |
| O-04 | `GET /api/v1/me/submissions`                      | Chỉ trả submission của user hiện tại |          |
| O-05 | `GET /api/v1/me/submissions/{problemId}/latest`   | Chỉ latest của user hiện tại         |          |

### 3.6. Không lộ hidden test

| ID   | Case                                        | Kỳ vọng                                                      | Evidence |
| ---- | ------------------------------------------- | ------------------------------------------------------------ | -------- |
| H-01 | `GET /api/v1/problems/{slug}`               | Chỉ sample công khai; không `wrapperCode`, hidden test       |          |
| H-02 | `GET /api/v1/problems/{slug}/samples`       | Chỉ sample; không lẫn test ẩn                                |          |
| H-03 | `GET /api/v1/submissions/{id}/test-results` | Chỉ ordinal/verdict/runtime, không input/output ẩn           |          |
| H-04 | Lỗi hidden test                             | `errorMessage` generic, không lộ path/expected output        |          |
| H-05 | Route admin                                 | User thường nhận 403/404; không có route learner xem test ẩn |          |

## 4. Cách thu thập evidence

Chạy trong repo backend (không phải repo frontend này):

```text
[điền lệnh build/start backend thực tế]
[điền lệnh chạy Postgres/Redis/Piston, ví dụ docker compose ...]
go test -count=1 ./...
```

Với mỗi case, lưu tối thiểu:

- request `curl` hoặc test name;
- HTTP status + body đã rút gọn (che token);
- log worker/Piston/Redis liên quan;
- thời điểm chạy và commit backend.

Kiểm tra queue:

```text
redis-cli LLEN submission_jobs
redis-cli LRANGE submission_jobs 0 -1
```

## 5. Định nghĩa hoàn thành (chưa nghiệm thu)

- [ ] Tất cả case Must ở mục 3 có evidence kiểm thử đính kèm.
- [ ] Không còn hidden input/output/wrapper trong payload learner.
- [ ] Ownership trả 404 cho user khác; Admin vẫn xem được.
- [ ] Anti-spam trả đúng 429/413 và `Retry-After`.
- [ ] Worker chạy hết job; crash/retry không tạo Accepted trùng.
- [ ] Verdict mapping đúng 7 verdict + Pending/Running.
- [ ] Đính kèm test/log/PR để reviewer xác nhận.
- [ ] Ghi rõ case nào chưa đạt và blocker (nếu có, bổ sung khi nộp).

## 6. Rủi ro / điểm cần chốt

- **Cooldown Submit:** contract ghi 10 giây/user/problem; backlog cũ ghi 5 giây.
  Chốt theo contract/OpenAPI; nếu backend chọn 5 giây thì phải sửa contract và
  test trước khi FE dựa vào.
- **Giới hạn code:** contract ghi 102400 UTF-8 byte; backlog cũ ghi 64 KB. Dùng
  contract làm nguồn, ghi lại nếu backend khác.
- **At-most-once:** job bị xóa khỏi Redis trước khi xử lý; cần test recovery,
  không được giả định Redis đảm bảo exactly-once.
- **AI lỗi:** không được biến Accepted thành Internal Error hoặc chặn verdict.
- **Piston/runtime:** version thực tế phải khớp language đã công bố; C++/Java
  lỗi biên dịch phải trả CE, không phải RE.
- **Mock frontend** không chứng minh bất kỳ mục nào ở trên.

## 7. Checklist bàn giao

- [ ] Điền tên, branch, commit backend và frontend liên quan.
- [ ] Đính kèm link PR/CI hoặc log test.
- [ ] Điền evidence cho từng case.
- [ ] Ghi các case fail + owner xử lý.
- [ ] Reviewer xác nhận không lộ hidden test và ownership.

## 8. Lưu ý review FE

ZIP sprint-3.zip là bản lưu do tác giả nộp, không phải evidence độc lập và không thay thế báo cáo Markdown đã review. Xem [TUNG_QA_REVIEW.md](../../sprint-3/TUNG_QA_REVIEW.md) để phân biệt HTTP mock, automated FE và các mục backend còn thiếu. Không dùng kết quả mock để tick các mục Judge live.

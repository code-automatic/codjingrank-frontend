# Sprint 3 — Thịnh: Submit, poll, history và progress

Nhánh: `feat/submit-poll-history-progress`, nền master `7303435`. Code đặt trực tiếp trong thư mục VSCode `D:/Subject-riki-hk2/subject-it-mon_duan_01/codjingrank`. Không merge master trong lần triển khai này.

## Phạm vi và contract

Task 22, Quốc Thịnh, Sprint 3 trong `tasks-coding-judge-v2.0_2026-11-06_to_2026-11-22.xlsx`: gửi Submit, poll, hiển thị verdict/pass count, lịch sử cá nhân và level-up; không đợi AI mới hiện Accepted. Run sample là task 17 của Huy, QA tích hợp là task 23 của Tùng; không nhập nhánh Run chưa review và không tự tạo AI/leaderboard/forum.

Đã đọc FRONTEND_API_CONTRACT.md, DECISIONS.md và learner OpenAPI công bố ngày thực hiện. Năm operation Submit/detail/history/latest/package-levels không thay đổi so với snapshot local khi bỏ thuộc tính trạng thái triển khai. Dùng API client hiện có, chỉ gọi Gateway `/api/v1`, UUID payload. Không fallback root routes, integer DTO hoặc X-User-*.

- POST `/api/v1/submit`: đúng `{problemId,languageId,code}`, 201 `data.submission`. Chụp mã khi bấm gửi, giữ nguyên bytes; 100 KiB và không được trống.
- GET `/api/v1/submissions/{id}`: poll tuần tự 1,5 giây sau phản hồi trước, Pending/Running tiếp tục, mọi verdict cuối dừng. Không lấy hidden test input/output.
- GET `/api/v1/me/submissions`: lịch sử cá nhân theo problem UUID, phân trang 10, giữ mọi verdict, chọn xem kết quả; không đưa code history vào editor.
- GET `/api/v1/me/submissions/{problemId}/latest`: khôi phục lượt đang chấm sau reload, kiểm tra khi mất phản hồi POST.
- GET `/api/v1/packages/{slug}/levels`: tiến độ và mở cấp do server xác nhận. Accepted hiển thị trước khi tải lại progress/history; không gọi AI và không lấy AI làm điều kiện verdict.

## UI và xử lý lỗi

| Before                       | After                                                                                                   | Lý do                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Editor chỉ có draft/reset    | Thêm khu vực Nộp bài, kết quả, lịch sử và tiến độ dưới editor                                           | Giữ bố cục có sẵn và không làm lại sản phẩm |
| Chưa có luồng chấm           | Pending/Running/terminal, số test, runtime, memory và lỗi an toàn                                       | Phân biệt nộp bài với Run sample            |
| Chưa có điều khiển request   | Single POST, deadline 15 giây, cooldown ít nhất 10 giây/Retry-After, không tự gửi lại POST lỗi mạng/5xx | Tránh bài trùng khi response mất và UI treo |
| Chưa có phục hồi polling     | Tối đa 80 GET liên tiếp, pause/resume, dừng khi ẩn tab/rời trang/logout, epoch chặn phản hồi cũ         | Giới hạn công việc và giữ đúng tài khoản    |
| Chưa có tiến độ sau Accepted | Reload levels từ server, thông báo chỉ khi trạng thái khóa trước đó đổi thành mở                        | Không suy luận unlock từ pass count ở FE    |

Lỗi GET dừng polling và cho thử GET lại. POST mạng/5xx/response sai contract được đánh dấu chưa xác định; phải kiểm tra latest trước khi mở gửi lại. Không có Idempotency-Key được backend cam kết: latest chỉ hỗ trợ đối chiếu, không thể chứng minh POST chưa commit khi request trước còn xử lý hoặc người dùng gửi ở tab khác. Không tự động resend sau reconciliation. Cooldown client không thay thế chống spam backend. Quyền owner được backend enforce; FE cũng từ chối row sai user/problem/submission ID.

Poll tối đa 80 lần cho mỗi đợt theo dõi (khoảng hai phút cộng thời gian mạng); có nút kiểm tra tiếp, không đổi Pending thành thất bại do hết giới hạn theo dõi. History/progress lỗi có retry riêng và không đổi verdict. Không lưu source hay kết quả submission vào storage mới; draft hiện có và token memory giữ nguyên. Không thêm dependency. Chưa có điều phối polling giữa nhiều tab.

## Chạy và tự kiểm tra

Hai terminal PowerShell trong thư mục VSCode. Dừng mock/FE cũ bằng Ctrl+C trước khi dùng cùng cổng.

Terminal 1:

```powershell
$env:MOCK_SUBMISSION_DEMO='1'
$env:MOCK_EDITOR_DEMO='1'
npm run mock
```

Terminal 2:

```powershell
$env:NEXT_PUBLIC_GATEWAY_URL='http://localhost:4010'
npm run dev
```

Mở `http://localhost:3000/problems/sum-two`, đăng nhập bằng dữ liệu giả `learner@example.com` / `Coding2026` khi được yêu cầu, rồi mở lại link đề bài. Đợi editor và kiểm tra lượt gần nhất tải xong; sửa mã và bấm Nộp bài. Demo trả Pending → Running → Accepted sau hai lần GET. Kiểm tra pass count, history, cấp 2 vừa mở. Reload để lấy latest; đổi language và draft không làm mất kết quả lượt nộp theo problem. Dừng theo dõi/kiểm tra lại, bấm xem lượt cũ, kiểm tra logout không phục hồi dữ liệu cũ.

Để thử verdict khác, dừng mock, đặt `$env:MOCK_SUBMISSION_VERDICT='Wrong Answer'` hoặc `'Compilation Error'`, chạy mock lại. Khởi động lại mock xóa toàn bộ lịch sử demo/progress. Tắt demo bằng `Remove-Item Env:MOCK_SUBMISSION_DEMO -ErrorAction SilentlyContinue`. Nếu bật `MOCK_REFRESH_STATUS=200`, reload luôn authenticated theo fixture, kể cả sau logout: không dùng chế độ này làm bằng chứng session thật.

Demo này là fixture in-memory một learner/bài mẫu, tối đa 100 lượt, không chạy code, không validate JWT, không ownership/cookie thật và không ghi database. Kết quả chấm demo không phụ thuộc code đã nhập; không dùng mật khẩu/source thật. Các endpoint khác vẫn dùng examples stateless. Header Prefer dùng để ép example/error và bỏ qua override demo. Hệ thống live không sử dụng các biến MOCK_*.

## Kiểm tra và giới hạn nghiệm thu

Lệnh kiểm tra: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Kết quả: tất cả PASS; 170 tests / 12 files, gồm 23 ca mới so với nền master 147 tests. Route `/problems/sum-two` trên server VSCode trả HTTP 200; HTTP status không thay thế browser E2E.

Tests bao phủ concurrent click, retry/cooldown, UTF-8 limit, terminal verdicts, không chồng polling, deadline/budget, logout/dispose phản hồi trễ, latest restore, history page race, sai owner/identity, server unlock, verdict không đợi progress/AI, escaping lỗi và mock contract. Smoke HTTP demo: POST 201 Pending → GET 200 Running → GET 200 Accepted; history không source, levels từ mock xác nhận mở cấp 2.

Đạt FE/mocks không có nghĩa tích hợp live. Tài liệu backend ghi Gateway đã đăng ký Run/Submit; full v1 Auth/profile/history vẫn pending. Cần backend xác nhận UUID history/latest/detail + ownership, worker/Redis/Piston recovery, Accepted transaction/progress, 429/Retry-After, Gateway CORS/Origin/cookie rotation theo deployment. Không sửa repo backend.

Chưa thực hiện browser E2E, bàn phím/mobile thực hoặc đo hiệu năng trên thiết bị; công cụ browser trước đó bị chặn xác minh URL. Server dev cùng checkout chỉ chạy một instance (Next.js báo lock nếu mở instance thứ hai); dùng server hiện có hoặc dừng đúng terminal trước khi đổi cấu hình. Báo cáo không đánh dấu toàn bộ Sprint 3 hay backend live đã done.

## Kết nối mock và báo cáo kiểm tra tích hợp bổ sung

Thêm `npm run mock:sprint3` để bật demo/editor bằng cùng một lệnh trên Windows/Linux; cổng/origin vẫn có thể cấu hình qua `MOCK_PORT`/`MOCK_ORIGIN`. Không đổi `.env.local` của người dùng hoặc base URL live. App local mặc định trỏ Gateway mock `http://localhost:4010`; terminal FE vẫn chạy `npm run dev`. Không tự bật bootstrap refresh thành công, vì fixture refresh không chứng minh cookie.

`npm run test:integration` khởi chạy mock riêng cổng ngẫu nhiên, dùng fetch HTTP thật, session store/API client và submission controller của ứng dụng, sau đó tự đóng mock. Không dùng cổng 4010/3000 của người dùng. Test không chạy trình duyệt và không thay thế E2E/live.

| Kịch bản                                                  | Kết quả                                                                   |
| --------------------------------------------------------- | ------------------------------------------------------------------------- |
| Bootstrap refresh 401 → anonymous → login mock → template | PASS                                                                      |
| Submit → Pending → Running → Accepted                     | PASS; history có một lượt, pass count 5/5, server mở cấp 2                |
| Submit → Wrong Answer                                     | PASS; hiển thị verdict, không mở cấp 2                                    |
| Submit → Compilation Error                                | PASS; hiển thị verdict, không mở cấp 2                                    |
| Gửi tiếp trong cooldown                                   | PASS; HTTP 429 và đọc Retry-After                                         |
| Kiểm tra latest sau verdict                               | PASS; giữ kết quả lượt đã nộp                                             |
| History cá nhân                                           | PASS; đúng owner và không trả source trong list                           |
| Gateway/credentials và CORS mock                          | PASS; chỉ `/api/v1`, credentials include, preflight 204 với origin cụ thể |
| AI và Run                                                 | Không gọi trong Submit flow                                               |

Lệnh kiểm tra toàn bộ sau cập nhật: `npm run lint`, `npm run typecheck`, `npm test` (173 tests / 13 files), `npm run build`; tất cả PASS. Lệnh chạy riêng HTTP integration: `npm run test:integration` (3/3 PASS). Đây là tích hợp FE với mock có điều khiển; không chứng minh PostgreSQL/Redis/Piston, JWT/ownership thật, cookie rotation hoặc deployment CORS.

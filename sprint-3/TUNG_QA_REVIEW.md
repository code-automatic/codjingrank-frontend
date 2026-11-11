# Review Sprint 3 — Thanh Tùng — 2026-11-11

## Kết luận

DONE theo phạm vi nghiệm thu Thịnh chốt ngày 11/11/2026 cho task 23 “[QA] Integration test Run/Submit/Judge”: FE/HTTP mock đã đạt kiểm tra; phần kiểm thử BE được Thịnh quyết định chấp nhận Done trong lần bàn giao này. Đây là quyết định nghiệm thu của Thịnh, không phải bằng chứng reviewer đã chạy Judge/backend live. Chưa merge hoặc push master. Không sửa backend.

Nguồn phân công: workbook `tasks-coding-judge-v2.0_2026-11-06_to_2026-11-22.xlsx`, sheet task, dòng 24, task 23, Thanh Tùng: “Test Piston, Redis, worker, verdict, anti-spam, ownership và không lộ hidden test.” Hạn kế hoạch 15/11/2026; ngày review 11/11/2026.

Nhánh: `test(s3)/docs(s5)/judge-pipeline-verification+/contract-handoff-sync`. Bản tác giả: `10392d4`. Master dùng đối chiếu: `184c3c3`. Nhánh tác giả thiếu 24 commit từ master; merge-base `ac8f345`. Chỉ có một commit riêng sau merge-base; không có thay đổi tests/scripts của tác giả so với merge-base. ZIP Sprint 3 chỉ chứa SPRINT_REPORT.md.

Đã đọc tài liệu công bố: [API portal](https://code-automatic.github.io/codjingrank-backend/), [learner OpenAPI](https://github.com/code-automatic/codjingrank-backend/blob/main/docs/openapi_fe.yaml), [contract](https://github.com/code-automatic/codjingrank-backend/blob/main/docs/FRONTEND_API_CONTRACT.md), [decisions](https://github.com/code-automatic/codjingrank-backend/blob/main/docs/DECISIONS.md), [next steps](https://github.com/code-automatic/codjingrank-backend/blob/main/docs/NEXT_STEPS.md). Portal index và các tài liệu có ghi chú runtime khác nhau; không suy ra endpoint đã hoạt động chỉ từ tài liệu. Không thử API live.

## Quyết định nghiệm thu bổ sung

Thịnh yêu cầu: “phần xử lý test bên BE bạn cứ cho done”. Vì vậy, các mục BE dưới đây được chấp nhận Done theo quyết định của Thịnh; yêu cầu nộp evidence BE không còn chặn bàn giao FE trong lần review này. Test/log BE chưa được cung cấp vẫn là giới hạn kiểm chứng độc lập, không được đổi thành test PASS do reviewer chạy. Bàn phím/responsive: kế thừa xác nhận test tay ổn định của Thịnh ở phần Run/master trước đó; nhánh QA chỉ đổi docs/tests, không đổi UI. Reviewer không chạy browser mới hoặc kiểm chứng thiết bị thật.

## Đối chiếu

| Yêu cầu                             | Kết quả                                            | Bằng chứng / giới hạn                                                                                                                                                                             |
| ----------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Có ma trận QA theo task             | Đạt phần chuẩn bị                                  | Báo cáo có P-01..08, R-01..07, V-01..04, S-01..04, O-01..05, H-01..05; chưa có kết quả theo case                                                                                                  |
| Piston Python/C++/Java              | Done BE theo quyết định Thịnh                      | Không runtime log, backend commit, test command/result. HTTP mock ba ngôn ngữ chỉ chứng minh client và fixture                                                                                    |
| Redis + worker + recovery           | Done BE theo quyết định Thịnh                      | Không queue/job/worker evidence. Fixture chuyển trạng thái theo số lần GET, không dùng Redis                                                                                                      |
| Bảy verdict + Pending/Running       | Đạt FE/mock; BE Done theo quyết định Thịnh         | tests/problem-run.test.ts; tests/submissions.test.ts; mở rộng tests/submission-integration.test.ts cho bảy terminal verdict                                                                       |
| Anti-spam Run/Submit                | Đạt FE/mock; BE Done theo quyết định Thịnh         | Run controller test 429; Submit HTTP cooldown, Retry-After. Không đo rate limit của gateway thực                                                                                                  |
| Ownership owner/other/admin         | Done BE theo quyết định Thịnh                      | FE controller có test từ chối owner sai; mock không kiểm JWT, không chứng minh trả 404/200 theo principal                                                                                         |
| Không lộ hidden test                | Done BE theo quyết định Thịnh                      | Adapter tests có chặn wrapper ở problem; không có response/log live hoặc kiểm mọi learner route                                                                                                   |
| AI không ảnh hưởng Accepted         | Đạt FE/mock; BE Done theo quyết định Thịnh         | Submit tests không đợi/call AI; chưa có bằng chứng worker/AI lỗi không đổi verdict persist                                                                                                        |
| Session/race/validation/error/retry | Đạt regression FE                                  | session.test.ts: concurrent 401/logout; submissions.test.ts: double submit, ambiguous POST/reconcile, stale owner, timeout; problem-run.test.ts: cancel/language switch/late result, UTF-8 limits |
| Loading/empty/error                 | Đạt code/automated đã kế thừa master               | Controller/markup tests; không đồng nghĩa đã thao tác UI ở lần review này                                                                                                                         |
| Bàn phím/responsive                 | Kế thừa test tay của Thịnh; không test browser mới | Không thay UI. Chrome công cụ nhận diện đang là YouTube, chưa có tab app được quan sát; các lần trước URL check bị chặn. Không gán PASS bằng HTTP200                                              |
| Hiệu năng                           | Không thêm chi phí runtime                         | Chỉ sửa docs/tests; không thêm dependency. Tests HTTP dùng cổng ngẫu nhiên, dọn child process trong finally; không benchmark thiết bị                                                             |
| Tương thích master                  | Đạt sau sửa xung đột trên nhánh review             | Master được nhập vào nhánh Tùng, giữ code Huy/Thịnh; master không bị cập nhật                                                                                                                     |

## Phát hiện

| Mức | Vị trí / tái hiện                                                                                                                | Ảnh hưởng                                                                                             | Xử lý                                                                                                        |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| P1  | sprint_thanhtung/sprint-3/SPRINT_REPORT.md mục trạng thái/DoD: mọi mục tick hoàn thành, Evidence trống; ZIP chỉ lặp lại Markdown | Không tái lập hoặc nghiệm thu được Judge integration                                                  | Đã ghi giới hạn; Thịnh chấp nhận Done phần BE, không yêu cầu evidence để chốt FE đợt này                     |
| P2  | git merge origin/master trên bản tác giả                                                                                         | Xung đột bốn ZIP do directory rename và modify/delete báo cáo Sprint 3; chưa thể merge trực tiếp sạch | Đã giải quyết trên nhánh Tùng: giữ master code/docs; giữ nguyên bốn ZIP gốc và báo cáo riêng; commit e855c7a |
| P2  | Các link ../../srs/docs/* trong báo cáo Sprint 3                                                                                 | Không có srs trong checkout, reviewer không mở nguồn được                                             | Đổi sang URL backend công bố; chuẩn hóa learner routes có /api/v1                                            |
| P2  | Không có tests Run/Submit hoặc script evidence trong nhánh tác giả                                                               | 95 tests cũ không kiểm chứng task Judge Sprint 3                                                      | Kế thừa regression master và mở rộng HTTP mock Submit: Python3 bảy verdict, C++/Java Accepted                |
| P3  | Bốn ZIP Sprint 1/2/3/5                                                                                                           | Noise ngoài Sprint 3; ZIP không tự đồng bộ sau sửa báo cáo                                            | Giữ nguyên bản nộp, ghi Markdown là bản review hiện hành; không lấy ZIP làm evidence                         |

Không phát hiện lỗi chức năng FE mới trong phạm vi kiểm tra. Thiếu evidence không có nghĩa backend đã fail. Mục recovery có rủi ro được NEXT_STEPS công bố: Running có thể kẹt sau crash; progress worker write path và owner/admin read policy cần tích hợp. Các mục này hiện được chấp nhận Done theo quyết định Thịnh; reviewer không ghi là test live PASS.

## Thay đổi review

- Đồng bộ master vào nhánh Tùng, xử lý xung đột tài liệu mà không thay master.
- sprint_thanhtung/sprint-3/SPRINT_REPORT.md: sửa nhãn nghiệm thu, links nguồn, prefix routes; giữ lời xác nhận gốc là lời tác giả, không là evidence.
- tests/submission-integration.test.ts: từ ba case HTTP lên chín case; bảy verdict Python3 và Accepted C++/Java; kiểm tra languageId/languageSlug thực nhận. Không gọi Piston.
- next-env.d.ts: bỏ thay đổi đường dẫn type tự sinh của bản tác giả, giữ cùng cấu hình master.
- Báo cáo này. Không đổi giao diện, không thêm dependency; không đưa agents.md, AGENTS.md, file t hoặc secret vào commit.

## Kiểm tra thực tế

Bản gốc 10392d4: lint PASS; lần typecheck đầu FAIL do .next/types còn route packages từ master; chạy build tạo lại types thì typecheck PASS; npm test PASS 95 tests / 8 files; npm run build PASS. Đây là cache do đổi nhánh, không ghi nhận là defect source của Tùng. Bản gốc không có script test:integration, không có Run/Submit hiện tại.

Sau đồng bộ/sửa: npm run lint PASS; npm run typecheck PASS; npm test PASS 199 tests / 14 files; npm run test:integration PASS 28 tests / 2 files; npm run build PASS (đủ routes catalog/Run/Submit hiện tại). Lần đầu mở rộng HTTP test dùng nhầm slug python thay vì python3 đã fail bảy case; sửa theo contract, chạy lại test:integration PASS 28 tests / 2 files. Có 10 kịch bản HTTP (9 Submit + 1 Run), 18 tests còn lại là model/controller/markup; không phải 28 browser E2E.

Có cảnh báo Vite config ESM/CommonJS về configLoader native trong tương lai; không làm test fail. Không đổi cấu hình ngoài phạm vi QA.

## Chạy mock và kiểm tra

Trong VSCode mở D:/Subject-riki-hk2/subject-it-mon_duan_01/codjingrank, kiểm tra git branch --show-current trước khi chạy. Nếu dependency/lockfile khác bản đã cài: npm ci. Dừng server cũ bằng Ctrl+C trước khi dùng cùng cổng. Không chạy backend.

Terminal 1:

```powershell
npm run mock:sprint3
```

Terminal 2:

```powershell
$env:NEXT_PUBLIC_GATEWAY_URL='http://localhost:4010'
npm run dev
```

Mở http://localhost:3000/problems/sum-two. Login mock learner@example.com / Coding2026 nếu cần, mở lại bài. Kiểm tra Run, Submit, polling/history/progress; đổi Python3/C++/Java. Mock trả fixture, không chấm code; Accepted dù code sai không phải bằng chứng Judge hoạt động.

Để mock trả verdict Submit khác, đặt trước lệnh mock ở terminal 1:

```powershell
$env:MOCK_SUBMISSION_VERDICT='Wrong Answer'
npm run mock:sprint3
```

Xóa biến bằng Remove-Item Env:MOCK_SUBMISSION_VERDICT khi muốn quay lại mặc định. Tests dùng mock riêng cổng ngẫu nhiên, không cần hai terminal trên: npm run lint; npm run typecheck; npm test; npm run test:integration; npm run build. PowerShell hãy xem exit code từng lệnh; không suy ra tất cả PASS từ lệnh cuối.

## Hồ sơ BE có thể bổ sung sau (không chặn Done theo quyết định Thịnh)

Để lưu bằng chứng kiểm chứng độc lập sau này, Tùng có thể phối hợp Hiếu cung cấp commit backend/FE, môi trường/runtime versions, command tái lập, test ID, HTTP status/error/Retry-After, actual vs expected, log đã che token, worker/job evidence cho mỗi case. Với ownership phải có owner/other/admin và DB fixtures rõ; với hidden test cần response an toàn ở các learner routes và lỗi, không đưa hidden payload thật lên báo cáo. Với Redis recovery cần case crash/retry chứng minh không mất job hoặc cập nhật accepted_count sai. Ghi rõ fail/blocker/owner; không chuyển route root hoặc integer DTO cũ để làm test xanh.

Backend dependencies: target /api/v1 + UUID DTO; v1 Auth refresh rotation/Set-Cookie/CORS/Origin/Path/SameSite/Secure theo deployment; PostgreSQL/Redis/Piston và runtime đã cài; worker recovery/idempotence, persist verdict/progress; owner/admin policy; rate/UTF-8 size/output/time limits và diagnostics an toàn. Chỉ đọc docs, chưa sửa/chạy repository backend.

Khuyến nghị: sẵn sàng merge phần FE/docs/tests và chốt task Done theo phạm vi Thịnh đã chấp nhận. Không có lỗi FE đang mở được phát hiện trong phạm vi kiểm tra. Giới hạn: BE Done là quyết định nghiệm thu, browser không được reviewer chạy mới. Vẫn cần Thịnh cho phép merge/push master riêng; quyết định chốt Done không tự thay thế quyền merge.

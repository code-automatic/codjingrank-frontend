# Sprint 3 — review Run sample của Huy

Nguồn: `origin/feature/t067c36-run-sample-results`, commit `daf7977f1b17c63522097d3e880aa6f7b9ffac44` (gồm `29d46c1`). Nền master `d93b9e5`. Nhánh review local giữ đúng tên `feature/t067c36-run-sample-results`, trong thư mục VSCode ổ D. Chưa merge/push master; bản sửa review được commit local để Thịnh duyệt trước.

## Kết luận

Đạt đối chiếu code/automated FE/HTTP mock sau chỉnh sửa nhỏ. Không thấy lỗi chặn chức năng Run trong phạm vi đã kiểm tra. Chưa đủ bằng chứng browser E2E, bàn phím/mobile thực hoặc backend live; không ghi nhận các mục đó PASS. Đề xuất merge khi Thịnh chấp nhận phạm vi nghiệm thu này hoặc sau khi bổ sung smoke browser.

## Đối chiếu task và contract

Task 17 Hoàng Huy trong workbook Sprint 3: “[FE] Tích hợp Run và kết quả sample” — gọi API Run hiện tại; hiển thị từng test, runtime, output và lỗi, không tạo submission. Đã đọc learner OpenAPI và FRONTEND_API_CONTRACT.md công bố trước review. Operation `/api/v1/run` không thay đổi schema so với snapshot khi bỏ metadata implementation-status; upstream ghi `partial-integration-tested`, chưa chứng minh deployment live.

| Yêu cầu                                   | Kết quả                          | Bằng chứng                                                                                          |
| ----------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------- |
| Run đồng bộ, đúng Gateway `/api/v1/run`   | Đạt                              | Controller/API client gửi POST `{problemId,languageId,code}`, giữ bytes; không jobId/runId/poll     |
| HTTP 200 cho tất cả verdict               | Đạt                              | Test parameterized bảy verdict, completed thay vì lỗi transport                                     |
| Từng sample, runtime, input/output và lỗi | Đạt code/markup                  | RunResultView, mismatch, stderr/errorType/errorMessage; escape chuỗi React                          |
| Không tạo submission/AI/progress          | Đạt với mock                     | HTTP auth/template/Run kiểm tra history total và levels trước/sau không đổi; không gọi submit/AI    |
| Validation, loading, lỗi và thử lại       | Đạt code/tests                   | Blank/UTF-8 100KiB, single-flight, timeout, 403/422/429/504; nút Run chạy lại                       |
| Đổi language, cancel, logout/unmount      | Đạt controller/tests             | Abort/epoch, ignore late result, StrictMode activate, stale source badge                            |
| Ghép với phần Submit của Thịnh            | Đạt code/tests                   | Nhánh chứa master d93b9e5; chỉ thêm RunPanel trước SubmissionPanel; regression Submit giữ PASS      |
| Responsive/bàn phím                       | Có code; chưa nghiệm thu thực tế | CSS 820/600px, nút native và output có tabIndex để cuộn                                             |
| Hiệu năng                                 | Đã tối ưu có giới hạn            | Memo kết quả Run tránh dựng lại output khi gõ mã nếu props kết quả không đổi; chưa đo trên thiết bị |

## Phát hiện và thay đổi

| Mức | Vị trí/cách tái hiện                                                   | Before                                                                          | After                                                                           | Ảnh hưởng                                                          |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| P2  | scripts/submission-demo.mjs: bật mock:sprint3, đổi C++/Java rồi Submit | Mock chỉ nhận language ID từ seed Python; trả 422 dù editor/Run đã đổi ngôn ngữ | Mock demo nhận các ID C++/Java đã có, giữ đúng languageSlug; có regression test | Giữ khả năng demo Run và Submit cùng workspace; không đổi live API |
| P3  | RunPanel/controller: bấm Hủy khi request đang chạy                     | UI nói đã hủy chạy, dù backend không có endpoint cancel                         | Nút “Dừng chờ kết quả”, notice nói server có thể vẫn chạy                       | Tránh cam kết hủy thực thi mà contract không có                    |
| P3  | RunPanel: dùng bàn phím với output dài hơn max-height                  | Output cuộn chưa có điểm focus rõ ràng                                          | tabIndex=0 trên các ô output/diagnostics                                        | Có đường cuộn bằng bàn phím; chưa xác nhận thao tác browser        |
| P3  | RunPanel: gõ code khi đã có nhiều output sample                        | Kết quả được dựng lại mỗi render cha                                            | MemoRunResultView, vẫn cập nhật badge khi source thay đổi                       | Giảm render dư, không thêm dependency                              |

UUID đa ngôn ngữ của bản gốc được kiểm tra trực tiếp là khác nhau. Nhận xét sơ bộ “trùng UUID” trong trao đổi đã được đính chính; không tính là lỗi của Huy và không thay UUID fixture gốc.

Thêm test uniqueness language IDs, đúng fileName Python/C++, HTTP history/progress không đổi, cả bảy terminal Run verdict và phản hồi sau dispose/reactivate. `test:integration` hiện chạy cả submission HTTP suite và file problem-run (gồm unit/markup và một HTTP case), vì vậy 22 tests không có nghĩa 22 browser/HTTP E2E cases.

## Kiểm tra

- Baseline nguyên bản: lint/typecheck/tests/build PASS, 184 tests / 14 files.
- Sau review: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`: PASS, 193 tests / 14 files.
- `npm run test:integration`: PASS, 22 tests / 2 files, trong đó bốn kịch bản HTTP (ba Submit, một Run).
- `/problems/sum-two` trên server local trả HTTP 200; không dùng kết quả này để chứng minh browser interaction.
- Không thêm dependency; package.json chỉ mở rộng lệnh test.

Mock chỉ chứng minh client/controller/envelope và trạng thái fixture. Run mock trả example cố định, không thực thi source, không chứng minh Piston, Redis/PostgreSQL, auth/JWT/ownership hoặc secret redaction live. Không sửa backend. Cần Gateway deployed với v1 Auth/catalog/Run, CORS/Origin/cookie, giới hạn rate/size/timeouts, publish/level/language enforcement, compiler diagnostics an toàn và xác nhận Run không ghi DB trước live.

## Tự chạy trong VSCode

Dừng mock/FE cũ bằng Ctrl+C trước khi dùng lại cùng cổng. Terminal 1: `npm run mock:sprint3`. Terminal 2: `$env:NEXT_PUBLIC_GATEWAY_URL='http://localhost:4010'; npm run dev`.

Mở `http://localhost:3000/problems/sum-two`, login mock nếu được yêu cầu, mở lại bài. Chạy mẫu Python, xem từng test, sửa code kiểm tra stale badge; đổi C++/Java kiểm tra kết quả cũ bị dọn và template đúng. Run không làm tăng history/mở cấp; bấm Submit mới tạo lượt nộp. Mock không chấm theo source nên code sai vẫn có thể trả Accepted fixture.

Chạy tự động: `npm run test:integration` hoặc `npm test`; mock test dùng cổng ngẫu nhiên và tự dọn process. Muốn ép HTTP errors/verdict dùng controlled transport trong tests hoặc Prefer examples khi gọi mock trực tiếp. Chưa có bằng chứng browser/mobile thực để nghiệm thu các thao tác trên.

## Xác nhận trước merge (2026-11-11)

Thịnh xác nhận đã kiểm tra tay và các thao tác đang ổn định, đồng ý merge nhánh Huy vào master. Đây là xác nhận của người dùng; công cụ Computer Use chưa kiểm chứng độc lập bàn phím/responsive vì không xác minh được URL. Backend live vẫn chưa nghiệm thu.

Sau khi fetch origin, master và nhánh Huy không có commit mới so với bản review. Chạy lại lint, typecheck, 193 tests / 14 files, integration 22 tests / 2 files và production build: tất cả PASS. Integration bao gồm unit/markup và bốn kịch bản HTTP như ghi ở trên, không phải browser E2E.

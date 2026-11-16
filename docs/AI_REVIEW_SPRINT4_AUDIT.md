# Review Sprint 4 — Huy: Màn hình AI review riêng

## Kết luận

Đạt phạm vi FE với automated tests và mock sau các sửa lỗi trong báo cáo này. Chưa nghiệm thu backend live. Chưa push hay merge master. Không merge head GitHub cũ mà bỏ qua commit sửa lỗi local.

- Task: workbook tasks-coding-judge-v2.0_2026-11-06_to_2026-11-22.xlsx ở checkout chính, dòng Excel 29 (STT 28), Hoàng Huy.
- Branch: feature/t067c41-ai-review-screen. Head gốc 903a806.
- Master đối chiếu: 1e8f70e; forum đối chiếu: d20d913.
- Tài liệu: contracts/openapi_fe.yaml, FRONTEND_API_CONTRACT.md và DECISIONS.md backend; contract đích v2.1, không đồng nghĩa API live đã triển khai.
- Thư mục review: D:/Subject-riki-hk2/subject-it-mon_duan_01/codjingrank-review-ai.

## Đối chiếu

| Yêu cầu | Kết quả | Bằng chứng |
| --- | --- | --- |
| Màn hình riêng cho submission | Đạt FE/mock | app/submissions/[id]/ai-review; liên kết từ kết quả/history |
| queued/running/completed/failed và review=null | Đạt FE/mock | controller.ts; tests/ai-review.test.ts; browser controlled scenarios |
| Score, dimensions, findings, highlight mã nguồn | Đạt FE/mock | AiReviewPage.tsx; browser Enter/chọn finding/highlight dòng |
| AI độc lập verdict, progress, ranking | Đạt FE/mock | Accepted vẫn giữ khi AI pending/failed/503; chỉ đọc endpoint AI |
| Chỉ Accepted mới đọc review | Đạt FE/mock | Browser non-Accepted không gửi request AI; 409 được xử lý |
| Chủ sở hữu/admin, route đúng submission | Đạt kiểm tra FE | verifySubmission/verifyReview; regression tests. BE phải xác thực quyền thật |
| Poll 2–5 giây, giới hạn số lần | Đạt FE/mock | aiReviewModel.ts và controller; fake-timer regressions |
| Dừng terminal, pause/resume/retry | Đạt FE/mock | unit tests và browser controlled states; retry chỉ đọc, không trigger AI |
| Loading/error/retry/session guard | Đạt FE/mock | regression timeout; guest và 503 browser checks |
| Light/dark, mobile, keyboard | Đạt phạm vi đã chạy | 10 ảnh AI: 320/390/768/1024/1440px x 2 theme; Chrome desktop emulation |
| Backend live, cookie, JWT, ownership thật | Chưa xác minh | Không kết nối live trong lượt review |

## Lỗi đã sửa

| Mức | Vị trí | Cách tái hiện trước sửa / ảnh hưởng | Sửa và kiểm chứng |
| --- | --- | --- | --- |
| P1 | features/ai-review/controller.ts:131,214 | Request quá deadline: abort bị bỏ qua trong catch, UI kẹt loading/polling | Xử lý timeout theo generation; 2 regression tests deadline |
| P1 | controller.ts:328 | Chờ hết budget rồi đọc lại vẫn hết lượt, không có cửa sổ chờ mới | Reset pollCount/exhausted; regression retry |
| P1 | controller.ts:112; AiReviewPage.tsx:575 | Dữ liệu trả nhầm ID hoặc session/route đổi có thể dùng controller cũ | Check ID, key theo user/role/route; regression mismatch |
| P2 | controller.ts:307 | Effect bị cleanup rồi activate lại giữa initial load có thể kẹt | Khởi động lại initial load; Strict Mode regression |
| P2 | controller.ts:112 | Admin được Gateway cho phép vẫn bị FE từ chối | Cho role admin, vẫn kiểm tra đúng submission ID; regression |
| P2 | AiReviewPage.tsx:57 | Chọn finding ép smooth scroll dù reduced motion | Bỏ ép smooth, giữ highlight và focus/keyboard |
| P2 | app/styles.css:1858 | Mobile column kế thừa flex-basis 320px gây khoảng trống lớn | basis:auto; browser gap assertion ở hai theme |
| P2 | AiReviewPage.tsx | Lỗi AI che thông tin Accepted; empty findings tuyên bố chất lượng chưa có căn cứ | Giữ submission khi lỗi review; copy empty trung tính |
| P2 | AiReviewPage.tsx; styles.css | Thiếu chuyển theme tại trang riêng, navigation nhỏ/khó wrap | Dùng ThemeToggle hiện có, wrap và target editor tối thiểu 44px |

Có 6 regression tests mới ở tests/ai-review-regression.test.ts. Bốn ca mới đầu tiên đã tái hiện lỗi trước sửa.

## Kết quả kiểm tra

| Lệnh / phạm vi | Kết quả thực tế |
| --- | --- |
| npm run lint | PASS, nhánh AI |
| npm run typecheck | PASS, nhánh AI |
| npm test | PASS 255 tests / 19 files |
| npm run build | PASS, route AI hiện trong build |
| Bản ghép thử AI + forum: lint/typecheck | PASS |
| npm test -- --maxWorkers=2 trên bản ghép thử | PASS 279 tests / 21 files |
| npm run test:integration trên bản ghép thử | PASS 36 tests / 3 files, là tập con của 279 |
| npm run build trên bản ghép thử | PASS, đủ route AI + forum |
| Chrome trên hai nhánh với Gateway mock | PASS tổng 79 checks / 30 screenshots / 0 runtime-hydration errors |

Bản ghép thử nằm trong codjingrank-review-combined, xuất từ merge-tree sạch rồi áp dụng các bản sửa cuối; không có .git và không merge master. Các nhánh remote được kiểm tra lại vẫn là các head nêu trên.

Browser chạy production builds qua cổng 3011/3012 và routing có kiểm soát đến mock 4023/4024. Một số ca lỗi/refresh/catalog được route fixture chủ động. Đây không phải bằng chứng cookie persistence, rotation hoặc live auth. Screenshot desktop emulation không thay cho test thiết bị vật lý hay chứng nhận WCAG đầy đủ.

Detector Impeccable quét source trả 4 cảnh báo thẩm mỹ có sẵn: Arial và viền màu findings. Không thay font/theme hay redesign ngoài phạm vi; viền findings phân biệt mức độ, vẫn có nhãn chữ. Detector regex không đánh giá đủ accessibility. Không báo detector sạch.

## Bằng chứng

- review/sprint4-ai/browser-results.json: kết quả tổng của cả hai nhánh.
- review/sprint4-ai/ai-completed-dark-390.png
- review/sprint4-ai/ai-completed-light-1440.png
- Toàn bộ 30 ảnh nằm tại C:/Users/Administrator/.codex/visualizations/2026/11/08/01a1bc06-765d-7b40-a856-8a1a58c05558/review-sprint4-ai-forum.
- Browser harness lượt review: %TEMP%/codjingrank-review-ai-forum.cjs; không thuộc npm test hay CI.

## Chạy thủ công

Mở đúng thư mục review AI trong VSCode. Chỉ chạy một checkout ở cổng mặc định tại một thời điểm.

Terminal 1:
~~~powershell
npm run mock
~~~

Terminal 2:
~~~powershell
npm run dev
~~~

Mở http://localhost:3000/login. Fixture demo: learner@example.com / Coding2026. Mở /problems/sum-two, Submit đến Accepted, chọn Xem đánh giá AI trong kết quả/history. Kiểm tra finding, theme và điều hướng. Mock mặc định Gateway http://localhost:4010; dùng npm run mock thay vì mock:contract để có luồng demo Sprint 3/4. Sau clone mới cần npm ci một lần.

## Backend cần phối hợp

Gateway /api/v1, UUID DTO/envelope; GET AI riêng owner/admin, outsider404, non-Accepted409 AI_REVIEW_NOT_ELIGIBLE; review=null trước scheduling; worker trả queued/running/completed/failed, score/dimensions/findings đúng schema. Không có trigger/rejudge từ màn hình này. Cần xác minh auth/refresh rotation/Set-Cookie/CORS-Origin/Path/SameSite/Secure và BE ownership thật. AI không thay verdict/progress/ranking.

## Khuyến nghị

Có thể merge phạm vi FE sau khi duyệt các commit sửa lỗi, phối hợp cùng nhánh forum. Chưa gọi là tích hợp backend live. Không thay đổi dependencies, backend hoặc API contract.

# Review Sprint 4 — Tùng: Forum flow và moderation states

## Kết luận

Đạt phạm vi FE với automated tests và mock sau sửa lỗi. Chưa nghiệm thu backend live, moderation hoặc Accepted eligibility thật. Chưa push hoặc merge master.

- Workbook task chính ở checkout master: dòng Excel 32 (STT 31), Thanh Tùng.
- Branch: feat/forum-community. Head gốc d20d913.
- Master: 1e8f70e. Nhánh AI của Huy: 903a806.
- Thư mục review: D:/Subject-riki-hk2/subject-it-mon_duan_01/codjingrank-review-forum.
- Contract đích: contracts/openapi_fe.yaml, FRONTEND_API_CONTRACT.md, DECISIONS.md v2.1; không suy ra API đã live.

## Đối chiếu yêu cầu

| Yêu cầu | Kết quả | Bằng chứng |
| --- | --- | --- |
| List/detail/filter/search/pagination/empty | Đạt FE/mock | ForumListPage; unit và HTTP tests; browser search/Back/empty |
| Create/edit/delete bài | Đạt FE/mock | PostEditorPage; browser CRUD và edit503/retry |
| Comment/reply/edit/delete | Đạt FE/mock | postController.ts, ForumPostPage; unit/HTTP/browser |
| Một cấp reply | Đạt FE/mock | Chỉ root có thao tác reply; BE vẫn cần validate parent |
| Tombstone root có reply ở trang khác | Đạt kiểm tra FE | Re-read server sau xóa; regression mock page |
| Like/unlike | Đạt FE/mock | API adapter/controller; browser thay đổi rồi khôi phục |
| Guest/owner/permission/hidden | Đạt UI với mock | Browser guest, outsider edit, hidden không form; BE quyền thật chưa xác minh |
| Solution cần Accepted | Đạt UI xử lý lỗi contract | Browser tiêm403 SOLUTION_NOT_ALLOWED; mock demo KHÔNG thực thi Accepted eligibility |
| Markdown/code an toàn | Đạt mẫu đã thử | Browser link/code payload không thực thi script; không coi là full security audit |
| Loading/error/retry | Đạt FE/mock | Edit503 recovery; unit comments retry/concurrency |
| Keyboard/light-dark/responsive | Đạt phạm vi browser đã chạy | Tab/Shift+Tab/Enter, 20 ảnh list/detail ở 5 widths x 2 theme |
| Catalog >100 bài | Đạt controlled browser fixture | Load-more page2, chọn UUID thứ101 |
| JWT/ownership/moderation/live | Chưa xác minh | Cần backend tích hợp thật |

## Lỗi đã sửa

| Mức | Vị trí | Tái hiện trước sửa / ảnh hưởng | Sửa và bằng chứng |
| --- | --- | --- | --- |
| P1 | features/forum/postController.ts:80 | Comments còn pending rồi retry post làm vô hiệu comments; loading không kết thúc | Tách lifecycle request; regression retryPost |
| P1 | postController.ts:103,187 | Bấm tải thêm nhiều lần gửi trùng page | Coalesce request và loading; regression |
| P1 | postController.ts:80; ForumPostPage.tsx:112 | Post hidden/404 nhưng comments cũ có thể còn hiển thị | Xóa/invalidate comments và key theo ID/user; regression/browser hidden |
| P1 | postController.ts:241 | Xóa root khi reply ở page khác: suy luận từ page hiện tại làm mất tombstone | Reload server post/comments; regression |
| P1 | PostEditorPage.tsx:62,148 | Edit503 vẫn hiện form rỗng có thể ghi đè nội dung | Chặn form khi chưa load thành công; retry riêng; browser503 |
| P2 | ForumPostPage.tsx | Có thể reply vào reply trái mô hình một cấp | Chỉ root có action reply; browser |
| P2 | PostEditorPage.tsx:217 | Double submit và response sau unmount có thể cập nhật trạng thái cũ | Ref lock, abort và deadline |
| P2 | PostEditorPage.tsx:101,363 | Lỗi catalog bị bỏ qua; danh sách chỉ100 bài | Error/retry, phân trang tải thêm; fixture101 bài |
| P2 | PostEditorPage.tsx:400 | UUID bài/ngôn ngữ hiện tại vắng trong options làm edit mất lựa chọn | Fallback option theo UUID hiện có |
| P2 | forum.module.css:668 | Placeholder textarea xám mặc định thiếu tương phản trong hai theme | Semantic --ui-muted và opacity1; browser đo >=4.5 |
| P2 | postController.ts | Mutation/response cũ còn publish sau dispose/reactivation | Version/lifetime guard |

Bốn regression tests mới ở tests/forum.test.ts đã thất bại trước sửa và pass sau sửa. Fixture deletion được cập nhật theo server tombstone authoritative.

## Kết quả kiểm tra thực tế

| Lệnh / phạm vi | Kết quả |
| --- | --- |
| npm run lint | PASS, nhánh forum cuối |
| npm run typecheck | PASS |
| npm test | PASS 257 tests / 19 files |
| npm run build | PASS, đủ4 forum routes |
| Bản ghép thử AI+forum: lint/typecheck | PASS |
| npm test -- --maxWorkers=2 | PASS 279 tests / 21 files |
| npm run test:integration | PASS 36 tests / 3 files; nằm trong279, không cộng thành315 |
| npm run build trên bản ghép thử | PASS |
| Chrome hai nhánh | PASS 79 checks, 30 screenshots, không runtime/hydration error |

Baseline chạy song song từng có một HTTP test timeout5s (252/253). Chạy lại độc lập pass, không tăng timeout để che lỗi; lượt cuối forum và combined đều pass. Vite có warning ESM/CommonJS cấu hình cũ; không phải test failure. Không thay dependencies.

Bản ghép thử dùng merge-tree sạch và patches cuối, nằm riêng ở codjingrank-review-combined, không có .git và không thay master. Remote heads đã được đối chiếu lại, chưa đổi.

Browser có controlled routing đến mock4023/4024 và controlled refresh response phục vụ reload; không chứng minh refresh-cookie persistence/rotation. Độ rộng320/390/768/1024/1440px là Chrome desktop emulation, chưa phải thiết bị vật lý. Chưa kết luận WCAG toàn ứng dụng. Placeholder được đo riêng trong cả hai theme.

Impeccable source detector còn3 cảnh báo side-border từ UI có sẵn: đường phân cấp reply và notice. Giữ vì có ý nghĩa cấu trúc/trạng thái và không redesign ngoài task. Detector regex không phải kiểm định accessibility đầy đủ; không tuyên bố clean scan.

## Bằng chứng

- review/sprint4-forum/browser-results.json: manifest79 checks của cả hai nhánh.
- review/sprint4-forum/forum-list-light-1440.png
- review/sprint4-forum/forum-detail-dark-390.png
- Toàn bộ30 ảnh: C:/Users/Administrator/.codex/visualizations/2026/11/08/01a1bc06-765d-7b40-a856-8a1a58c05558/review-sprint4-ai-forum.
- Harness local của lượt review: %TEMP%/codjingrank-review-ai-forum.cjs, không nằm trong CI/npm test.

## Chạy thủ công bằng mock

Mở thư mục review forum trong VSCode, không chạy đồng thời checkout khác trên cùng cổng mặc định.

Terminal1:
~~~powershell
npm run mock
~~~

Terminal2:
~~~powershell
npm run dev
~~~

Mở http://localhost:3000/forum. Đăng nhập fixture learner@example.com / Coding2026 để create/edit/comment/like/delete. Test guest ở cửa sổ ẩn danh. Sau clone mới cần npm ci một lần. Dùng npm run mock cho demo flow; Gateway mặc định4010, FE3000.

## Backend cần xác minh sau

/api/v1, UUID/envelope, bearer writes và public reads; ownership server; Solution CREATE cần Accepted trả403 SOLUTION_NOT_ALLOWED; không tự suy ra mock đã enforce. BE validate reply chỉ vào root còn sống, pagination/tombstone xuyên page, hidden/deleted không lộ post/comments, sanitize/safe rendering theo policy. Xác minh moderation thật bằng account admin/owner/outsider và trạng thái database. Auth cookie/CORS/rotation triển khai thật vẫn ngoài lượt review.

## Khuyến nghị

Có thể merge phạm vi FE sau khi duyệt commit sửa lỗi và bản ghép thử. Chưa merge GitHub head cũ rồi xem các lỗi này đã được sửa; hiện các bản sửa vẫn local cho đến khi được phép push. Không sửa backend/contract/dependency.

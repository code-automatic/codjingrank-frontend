# Sprint 2 — review catalog của Huy

Ngày review: 2026-11-11. Nguồn `feature/t067c30-packages-levels-filter`, commit `650e033255ca298a1f361af4881ac913912fb08e`, nền master `111e44f`. Bản sửa local: `fix/catalog-review`. Chưa merge/push; cần Thịnh xác nhận trước khi merge.

## Đối chiếu yêu cầu

Task 11 của Hoàng Huy trong workbook Sprint 2: màn hình package, level và filter bài; hiển thị solved/unlocked theo backend, lọc và phân trang, không suy luận unlock ở client.

| Yêu cầu | Kết quả từ code và automated tests |
| --- | --- |
| `/packages`, `/packages/[slug]`, `/problems` | Có đủ ba route |
| Ba cấp độ, tiến độ solved/unlocked | Dùng model từ API, không tính quyền mở khóa ở client |
| Bộ lọc package/difficulty/tag/solved/q, phân trang | Đồng bộ URL, đổi bộ lọc về trang 1, xử lý trang vượt phạm vi |
| Liên kết trang giải bài của Thịnh/Tùng | Dùng `/problems/[slug]`, bài khóa không có liên kết mở |
| Loading/empty/error/retry, session guard | Có; không redirect trong initializing |
| API contract | Gateway `/api/v1`; không thêm dependency/state library |
| Responsive và bàn phím | Có CSS responsive, label/native controls; chưa hoàn tất thao tác browser/mobile thực tế |

## Sửa sau review

| Before | After | Lý do |
| --- | --- | --- |
| Metadata dùng chung AbortController; timeout có thể mất lỗi và dữ liệu của request còn lại | Controller độc lập, hiện timeout và giữ kết quả thành công | Cho phép phục hồi và không bỏ mất tùy chọn lọc |
| Đổi query vẫn hiển thị danh sách cũ | Xóa slice cũ, chuyển loading đến phản hồi mới | Tránh gắn dữ liệu/trạng thái mở khóa cũ với URL mới |
| Refresh levels hoàn tất có thể tải lại bộ lọc cũ | Chỉ tải lại nếu generation của danh sách chưa đổi | Không ghi đè lựa chọn mới của người dùng |
| Header và levels có thể ghi đè lẫn nhau | Hủy và vô hiệu hóa request trước đó | Phản hồi đến muộn không phục hồi dữ liệu cũ |
| Refresh levels 404 không xóa nội dung đã mất hiệu lực | 401/404 xóa detail/list và vô hiệu hóa list đang chạy | Không giữ nội dung gói không còn truy cập được |
| Dropdown chỉ tải 100 gói nhưng không giải thích | Thông báo giới hạn, dẫn tới danh sách gói có tìm kiếm | Không tải toàn bộ catalog không giới hạn |

Không thêm dependency. Thay đổi nằm ở `features/catalog/resources.ts`, `features/catalog/ProblemsDirectoryPage.tsx`, `tests/catalog.test.ts` và báo cáo này. Không đưa AGENTS.md/agents.md vào commit.

## Xác minh và giới hạn

- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: PASS, 147 tests / 10 files; thêm 7 ca về timeout, đổi filter, dispose và race giữa header/levels.
- `npm run build`: PASS.
- Cổng 3000 chạy checkout ở ổ D chưa có route packages; cổng 3100 chạy bản review. HTTP 200 chỉ chứng minh route phục vụ được, không chứng minh thao tác client thành công.
- Browser automation bị công cụ chặn vì không xác minh được URL được phép. Chưa xác nhận trọn luồng click, bàn phím, mobile hay hiệu năng bằng đo đạc browser.

Năm operation catalog trong OpenAPI công bố giữ nguyên schema so với snapshot: tags, packages, package detail, levels và problems. Tài liệu backend ghi catalog implemented-db-tested; điều đó chưa chứng minh Gateway deployment đã sẵn sàng. Auth `/api/v1`, Gateway, UUID DTO, CORS/Origin và cookie rotation/Set-Cookie/Path/SameSite/Secure vẫn phải kiểm tra trong môi trường live. Không fallback root routes hoặc integer DTO.

Mock stateless không chứng minh lọc/phân trang phía database, quyền sở hữu, JWT, session persistence hay cookie rotation. Kết luận hiện tại: đạt kiểm tra code/automated FE sau sửa; chưa nghiệm thu đầy đủ browser/live và chưa đánh dấu toàn bộ Sprint 2 done.

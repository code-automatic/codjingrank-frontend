# Forum — Sprint 4 handoff

Nguồn: task Sprint 4 “Tích hợp list/detail/create/edit/delete/comment/like; hiển thị lỗi quyền và nội dung bị ẩn”, đối chiếu [FRONTEND_API_CONTRACT](../../srs/docs/FRONTEND_API_CONTRACT.md), [DECISIONS](../../srs/docs/DECISIONS.md) và learner OpenAPI tại `contracts/openapi_fe.yaml`.

Trạng thái: **đã tích hợp frontend với mock**; chưa nghiệm thu `forum_service` live. Không sửa backend, contract hoặc dependency.

## Phạm vi đã làm

- `/forum`: danh sách bài viết, tìm kiếm, lọc `postType`, sắp xếp `newest|likes|views`, phân trang và URL chia sẻ/Back-Forward.
- `/forum/[id]`: chi tiết, Markdown an toàn, code snippet, like/unlike, bình luận, trả lời một cấp, sửa/xóa bình luận của mình.
- `/forum/new` và `/forum/[id]/edit`: tạo/sửa bài, chọn bài tập/ngôn ngữ tùy chọn, xem trước Markdown.
- `/forum/[id]/edit` và nút sửa/xóa chỉ hiện với chủ bài; outsider nhận 404 từ backend.
- Xóa mềm: bài bị ẩn không còn trong list/detail; bình luận gốc đã xóa còn trả lời hiện tombstone; bình luận lá đã xóa bị bỏ.
- Lỗi 401/403/404/422/429 được map qua `errorText`; 204 không parse JSON.
- Link Cộng đồng đã thêm vào trang tài khoản và navbar leaderboard.

## File chính

- `app/forum/page.tsx`, `app/forum/[id]/page.tsx`, `app/forum/new/page.tsx`, `app/forum/[id]/edit/page.tsx`.
- `features/forum/ForumPage.tsx`, `ForumPostPage.tsx`, `PostEditorPage.tsx`, `ForumShell.tsx`, `ForumMarkdown.tsx`.
- `features/forum/model.ts`, `listResource.ts`, `postController.ts`, `forum.module.css`.
- `scripts/forum-demo.mjs`; mock bật qua `MOCK_FORUM_DEMO=1` (mặc định trong `npm run mock`).
- `tests/forum.test.ts`, `tests/forum-http.test.mjs`.

## Đối chiếu contract

| Yêu cầu | Kết quả |
|---|---|
| List + filter/sort/pagination | Đạt FE/mock |
| Detail + Markdown/code | Đạt FE/mock; `skipHtml`, ảnh từ xa bị chặn |
| Create/edit/delete | Đạt FE/mock; owner-only, 204 bodyless |
| Comment/reply một cấp | Đạt FE/mock; `INVALID_COMMENT_PARENT` hiển thị 422 |
| Like/unlike idempotent | Đạt FE/mock; server trả `liked`, `likeCount` |
| Lỗi quyền | Đạt FE/mock; outsider 404, guest write 401 |
| Nội dung bị ẩn/xóa | Đạt FE/mock; tombstone và loại khỏi list |
| `solution` cần Accepted | Client chặn thiếu `problemId`; backend vẫn là nơi kiểm progress |
| Không ảnh hưởng verdict/AI | Không gọi judge/AI |

## Kiểm tra

- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: 253 tests / 19 files PASS, gồm 14 unit/model và 6 HTTP Forum.
- `npm run test:integration`: 36 tests / 3 files PASS (Forum HTTP nằm trong bộ này).
- `npm run build`: PASS; route `/forum`, `/forum/[id]`, `/forum/new`, `/forum/[id]/edit` được tạo.
- Smoke local: `/forum`, `/forum/<seed>`, `/forum/new`, `/leaderboard` trả HTTP 200; mock list trả 3 bài published.

## Giới hạn

- Mock Forum là fixture trong bộ nhớ, không chứng minh `forum_service`, JWT/ownership thật, moderation, view counter hay like persistence.
- Chưa có browser E2E thiết bị thật/Safari/Firefox; chưa đo hiệu năng.
- Chưa làm moderation UI cho admin, report/tag, comment like, hay thông báo realtime.
- Chưa kiểm tra backend live; cần xác nhận envelope/UUID, `likedByMe`, `commentCount`, tombstone, quyền owner và các mã lỗi khi nối Gateway.

## Tự chạy

Terminal 1: `npm run mock`. Terminal 2: `npm run dev`. Mở `http://localhost:3000/forum`; đăng nhập mock `learner@example.com` / `Coding2026` để thử tạo bài, bình luận, like. Không dùng dữ liệu thật.

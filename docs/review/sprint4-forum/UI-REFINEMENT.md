# UI refinement — Forum/community

Ngày ghi nhận: 17/11/2026. Trạng thái: hoàn thiện FE với mock, chờ Thịnh duyệt UI trước khi push/merge.

## Git và phạm vi

- Branch: `feat/forum-community`; commit UI: `299f95b`; mốc trước UI: `bdde5ad`.
- Thư mục VSCode: `D:\Subject-riki-hk2\subject-it-mon_duan_01\codjingrank-review-forum`.
- Giữ palette Catppuccin Latte/Mocha và biểu tượng mocha hiện có; không đổi backend/API contract, không thêm dependency.
- Bố cục feed theo ảnh LeetCode Discuss người dùng cung cấp: hai ô khám phá có hình học vector, avatar, tab phân loại, danh sách ngăn bằng đường mảnh, icon SVG cho số liệu và cột bài đáng chú ý. Cột đáng chú ý sắp theo lượt thích trong trang đang xem; không giả lập bảng trending toàn hệ thống. Giữ tìm kiếm, phân trang, tạo/sửa/xóa bài, thích và bình luận.
- Phản hồi hover/press dùng CSS ngắn, giới hạn pointer có hover; thao tác code/dữ liệu và bàn phím không di chuyển để trang trí. Reduced motion được kiểm tra thực tế bằng browser emulation.

## File mã nguồn thay đổi

- `app/layout.tsx`
- `app/motion.css`
- `features/forum/ForumPage.tsx`
- `features/forum/forum.module.css`
- `lib/ui/Icon.tsx`

## Kết quả thực tế

| Kiểm tra | Kết quả |
| --- | --- |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm test -- --maxWorkers=2` | 257/257 test pass, gồm HTTP integration với mock |
| `npm run build` | Pass, Next.js 16.4.5/Turbopack |
| Browser Chrome headless với mock có điều khiển | 83 kiểm tra chung trên hai nhánh, 30 ảnh, 0 runtime/hydration error |
| Responsive | 320, 390, 768, 1024, 1440px; light/dark |
| Bản ghép tạm hai nhánh | Lint/typecheck pass; 279/279 test pass; build Turbopack pass |
| Backend live / thiết bị vật lý | Chưa kiểm tra |

Snapshot mã nguồn bản ghép đã kiểm tra: Git tree `8fe9956b4cb9d4d0f7c498296c53471f8c41c93d`, không merge master. Build lần đầu của bản xuất tạm không đọc được dependency qua junction ngoài root; đã chạy lại thành công với bản sao dependency hiện có, không cài thêm. Lượt chạy hai suite đồng thời ban đầu có HTTP test quá hạn 5 giây; lượt cuối với hai worker đều pass. Các kết quả browser chi tiết nằm ở `ui-browser-results.json`.

Browser gồm chọn góp ý AI bằng bàn phím, highlight dòng, theme/reload với refresh fixture, trạng thái AI và retry HTTP 503; Forum gồm tìm/lọc/empty/error/retry, Markdown/XSS, theme giữ draft, tạo/sửa/xóa, like, reply/tombstone và Tab/Enter. Bốn kiểm tra bổ sung xác minh hover và reduced motion. Placeholder được đo đạt tương phản tối thiểu 4.5:1; bỏ transition trên ô nhập để theme không gây khoảng tương phản thấp khi đổi màu.

Detector thiết kế đã chạy; các viền màu dày cũ đã được giảm còn 1px. Cảnh báo font Arial thuộc thiết kế nền được giữ nguyên, không thêm font/dependency ngoài phạm vi.

## Ảnh để review

Ảnh trước UI là hồ sơ review đã có ở mốc `bdde5ad`, không phải ảnh được chụp lại trong lượt này. Ảnh sau được chụp từ đúng UI hiện tại.

- [Sau — ui-forum-list-light-1440.png](ui-forum-list-light-1440.png)
- [Sau — ui-forum-list-dark-1440.png](ui-forum-list-dark-1440.png)
- [Sau — ui-forum-list-light-390.png](ui-forum-list-light-390.png)
- [Sau — ui-forum-list-dark-390.png](ui-forum-list-dark-390.png)

## Mở xem và chạy thủ công

Preview đang chạy ở `http://localhost:3012/` trong phiên kiểm tra này. Forum mở `/forum`; AI bắt đầu `/login`, đăng nhập mock, vào `/problems/sum-two`, nộp bài, chọn tab Bài nộp và bấm Xem đánh giá AI sau Accepted.

Mở đúng thư mục VSCode nêu trên. Chạy một nhánh tại một thời điểm bằng cổng mặc định:

Terminal 1:

```powershell
npm run mock
```

Terminal 2:

```powershell
npm run dev
```

Mặc định FE 3000, gateway mock 4010. Nếu muốn chạy hai nhánh đồng thời như preview, mỗi nhánh cần cặp port/Origin riêng và `NEXT_PUBLIC_GATEWAY_URL` tương ứng; cấu hình này chỉ ở process của preview, không sửa script mặc định. Có thể đăng nhập bằng email demo `learner@example.com` và mật khẩu minh họa `Coding2026`; không dùng tài khoản thật với mock.

## Giới hạn và bước tiếp

- Mock giữ dữ liệu demo trong memory; restart có thể mất dữ liệu. Refresh mặc định 401 nên reload trong thao tác tay có thể yêu cầu đăng nhập lại. Test reload dùng fixture refresh có điều khiển, không chứng minh cookie persistence/rotation.
- Browser desktop emulation không thay thế thiết bị vật lý. Chưa nghiệm thu CORS/cookie/JWT/ownership của backend live.
- Forum summary contract không có đoạn trích nội dung hoặc thumbnail; không thêm dữ liệu giả để sao chép ảnh LeetCode. Tham chiếu là ảnh người dùng cung cấp, không khẳng định pixel-perfect với website live.
- Không commit/push AGENTS.md, agents.md, env/secret hoặc next-env.d.ts được Next sinh lại. Master vẫn ở `1e8f70e`; chờ duyệt UI trước thao tác remote.

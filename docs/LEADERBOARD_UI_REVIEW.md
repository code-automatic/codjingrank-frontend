# Leaderboard UI — đối chiếu ảnh LeetCode

Nhánh: `feat/leaderboard-ranking`. Thư mục VSCode: `D:/Subject-riki-hk2/subject-it-mon_duan_01/codjingrank`. Bản bàn giao được lưu trên nhánh task; chưa merge master.

## Thay đổi

Dựa trên ba ảnh tham chiếu người dùng cung cấp: hero cúp ở giữa, hai thẻ minh họa, Global Ranking bên trái với podium, bảng Ranking/My Ranking bên phải, hàng xen kẽ và phân trang. Show More mở rộng bảng, Thu gọn trở lại tổng quan. Giữ palette Catppuccin Latte/Mocha hiện có và logo mocha.

Hai thẻ dẫn tới chức năng có thật: Gói bài tập và Kho bài tập. Không thêm contest, Rating, Region, Attended, lịch đếm ngược hay số liệu sản phẩm chưa hỗ trợ. Rank, số bài và số Accepted giữ nguyên DTO backend; đồng hạng 1,1,3 không chuyển thành 1,2,3. Avatar lỗi dùng ký tự đầu username.

Không đổi API, dependency, theme toàn cục hoặc controller auth/Run/Submit. Theme và mở rộng bảng không gọi lại API; chế độ mở rộng giữ khi chuyển trang.

## Kết quả kiểm tra

- `npm test`: 233 tests / 17 files pass trước lượt tinh chỉnh hình thức cuối; lượt cuối không sửa controller/API.
- `npm run lint`, `npm run typecheck`, `npm run build`: pass sau tinh chỉnh cuối.
- Browser Chrome với mock: 52 kiểm tra chính + 53 kiểm tra bổ sung pass; 12 ảnh. Gồm 46 cặp tương phản chữ, hai theme, kích thước 320/390/768/1024/1440px, bàn phím, Back/Forward, reload/theme, lỗi/retry độc lập, filter nhanh, phân trang, username Unicode dài và avatar lỗi.
- Không có runtime/hydration error trong kịch bản đã chạy. Không tràn ngang tại các chiều rộng kiểm tra.
- Impeccable detector trên ba file UI: không có finding.

Website LeetCode trả 403 Cloudflare; kết quả đối chiếu dựa trên ảnh người dùng, không tuyên bố đã đối chiếu trực tiếp website. Browser dùng Chrome desktop emulation; chưa kiểm thiết bị vật lý, Safari/Firefox hoặc backend live.

## File UI

- `features/leaderboard/LeaderboardPage.tsx`
- `features/leaderboard/RankingVisuals.tsx`
- `features/leaderboard/leaderboard.module.css`

Các thay đổi Sprint 4 có sẵn và file local được giữ nguyên. Không stage agents.md, next-env.d.ts hoặc t.

## Ảnh

Ảnh trước ở các file baseline trong `docs/review/leaderboard/`. Ảnh sau có tiền tố `contest-` trong cùng thư mục. Toàn bộ 12 ảnh và JSON kết quả nằm trong thư mục visualization leaderboard-contest-review của phiên Codex. Không sao chép ảnh trình duyệt tham chiếu của người dùng vào repository.

## Tự chạy

Terminal 1: `npm run mock`. Terminal 2: `npm run dev`. Mở http://localhost:3000/leaderboard. Nếu mock cũ đang chạy, Ctrl+C rồi khởi động lại để có fixture mới. Chỉ chạy một Next dev trên checkout.

Browser kiểm tra dùng routing khai báo chuyển Gateway 4010 sang mock riêng 4022 để tránh tiến trình mock cũ; không có fallback trong sản phẩm. Mock không chứng minh JWT, refresh cookie rotation/persistence, ownership hay SQL aggregation. Backend live vẫn cần nghiệm thu theo docs/LEADERBOARD_REVIEW.md.

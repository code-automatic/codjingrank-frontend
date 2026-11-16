# Review FE leaderboard

Nguồn: workbook phân công `tasks-coding-judge-v2.0_2026-11-06_to_2026-11-22.xlsx`, sheet Task, dòng Excel 30/STT 29: Quốc Thịnh, Sprint 4, [FE] Màn hình leaderboard. Contract: `contracts/openapi_fe.yaml`, `/api/v1/leaderboard` và `/api/v1/leaderboard/me`; đối chiếu API design backend. Không sửa backend hoặc contract.

Nhánh local: `feat/leaderboard-ranking`, nền master `ce984ac`. Code lưu tại thư mục VSCode ở ổ D. Bản bàn giao được lưu trên nhánh task; chưa merge master.

## Đối chiếu

| Yêu cầu | Kết quả | Bằng chứng |
| --- | --- | --- |
| rank, solvedProblemCount, acceptedSolutionCount | Đạt FE mock | Bảng và hạng cá nhân hiển thị trực tiếp DTO, không tính hạng ở FE |
| scope all/week/month và package | Đạt FE mock | query.ts; URL, reset page khi lọc; browser đổi bộ lọc bằng bàn phím |
| Người ngoài top/trang đang xem | Đạt FE mock | /me riêng; mock hạng 63, trang đầu 50 dòng |
| Đồng hạng có khoảng trống | Đạt hiển thị FE | HTTP/browser giữ thứ tự 1,1,3,3; SQL aggregation thực cần backend |
| Guest giới hạn all/page1/size<=50 | Đạt FE mock | resource không gửi request bị hạn chế; HTTP fixture trả 401 đúng |
| Loading/empty/error/retry độc lập | Đạt FE mock | unit resource, browser lỗi 503 cho từng endpoint và retry |
| Race, timeout, logout/unmount | Đạt automated | abort + generation, timeout 15s; tests stale result/logout/dispose |
| Session dùng chung | Đạt phạm vi FE | useSession/useApiClient; không thêm refresh/token storage |
| Bàn phím | Đạt browser mock phạm vi đã chạy | Enter áp dụng package, Tab/Shift+Tab giữa scope và package, native select, focus rõ; chưa kiểm bằng screen reader |
| Responsive hai theme | Đạt Chrome desktop emulation | 320/390/768/1024/1440px; 10 ảnh, không tràn ngang |
| Theme giữ query/hạng và không gọi lại API | Đạt browser mock | 75 assertions gồm toggle/route/reload, Back/Forward và stress username |
| Thiết bị vật lý, Safari/Firefox | Chưa xác minh | Chỉ chạy Chrome headless trên Windows |
| Backend live | Chưa nghiệm thu | Các route target vẫn cần backend triển khai/tích hợp |

## Validation thực tế

- `npm run lint`: pass.
- `npm run typecheck`: pass sau khi sửa generic union cho hai DTO khác nhau.
- `npm test`: 233 tests, 17 files pass; gồm 26 kiểm tra mới cho query/resource/mock HTTP. Test HTTP khởi động mock process cổng động và gọi thật qua transport/API adapter.
- `npm run build`: pass, route /leaderboard được prerender trong Suspense.
- Browser Chrome mock: kịch bản chính 43 assertions và bổ sung 32 assertions pass (tổng 75), 10 screenshots, 0 runtime/hydration errors. Bổ sung gồm 26 cặp màu chữ/placeholder trên hai theme đều đạt tương phản từ 4.5:1, Back/Forward khôi phục filter và kết quả, Tab/Shift+Tab, username dài Unicode/emoji không tràn ngang ở 320px. App chạy cổng 3000; Playwright route có khai báo chuyển Gateway 4010 sang mock riêng 4022 vì cổng 4010 đã có tiến trình cũ. Đây là cấu hình kiểm tra, không có fallback trong code sản phẩm.
- `npm run test:integration`: 30 tests, 2 files pass (là tập con của bộ 233 tests, không cộng trùng).
- `git diff --check`: pass.
- Vitest có warning cấu hình ESM/CommonJS hiện hữu từ baseline, không làm test fail; không đổi cấu hình ngoài phạm vi.
- Impeccable detector: không có finding trên LeaderboardPage.tsx và leaderboard.module.css.
- Kịch bản browser đã sửa đồng bộ với navigation, chọn đúng alert trong main thay vì Next route announcer, và giữ lỗi giả lập qua Strict Mode đến khi retry. Kết quả pass ở trên thuộc lần chạy hoàn chỉnh cuối.

Hai ảnh đại diện nằm trong `docs/review/leaderboard/`; đầy đủ 10 ảnh, results.json và extra-results.json trong thư mục visualization của phiên Codex. Không gắn credentials hoặc token vào báo cáo/network evidence.

## File liên quan

- app/leaderboard/page.tsx: metadata và Suspense boundary.
- features/leaderboard/query.ts: parse/canonical URL, API query riêng cho /me.
- features/leaderboard/resource.ts: request độc lập, abort/generation/deadline/retry.
- features/leaderboard/LeaderboardPage.tsx và leaderboard.module.css: UI, trạng thái, hai theme.
- app/protected/page.tsx: liên kết tới leaderboard.
- scripts/leaderboard-demo.mjs, scripts/mock.mjs, scripts/mock-sprint3.mjs: fixture opt-in qua npm run mock; mock:contract giữ nguyên mode stateless/Prefer examples.
- tests/leaderboard.test.ts và tests/leaderboard-http.test.mjs: unit/controller và HTTP integration.
- README.md: hướng dẫn vận hành và giới hạn mock/live.

Không thay package.json/package-lock.json/dependency, không thay auth/editor/Run/Submit controllers, không sửa các file local agents.md/t/next-env.d.ts có sẵn.

## Tự kiểm tra

1. Trong VSCode mở đúng thư mục dự án. Nếu mock đang chạy bản cũ, Ctrl+C tại terminal đó.
2. Terminal 1: npm run mock. Terminal 2: npm run dev. FE ở 3000, Gateway mock ở 4010; chỉ mở một Next dev trên checkout.
3. Mở http://localhost:3000/leaderboard: khách có bảng all, không có hạng cá nhân.
4. Đăng nhập bằng tài khoản fixture trong README, mở link Bảng xếp hạng trên trang tài khoản; xem hạng 63 ngoài trang đầu.
5. Đổi tuần/tháng, nhập arrays, thử phân trang, đổi size, dùng Back/Forward và Light/Dark.
6. Nhập slug chưa có như no-such-package để xem empty/unranked. Reload: mock refresh 401 nên trở về khách; đăng nhập lại nếu cần.

## Backend cần nghiệm thu tiếp

Gateway /api/v1, UUID DTO/envelope, token và refresh cookie rotation/HttpOnly/Set-Cookie, CORS/Origin và cookie Path/SameSite/Secure theo deployment. Leaderboard cần đúng SQL RANK, sort tie/userId, firstSolvedAt theo kỳ [start,end) UTC, current Accepted counts trên các bài thuộc kỳ, quyền guest/bearer, /me không có entry, filter package/pagination và cache tối đa 60 giây.

Fixture dùng số liệu tổng hợp cố định để kiểm tra FE, không thực thi SQL hoặc mô phỏng solve-time thật, không liên kết leaderboard với Submit demo và không chứng minh auth/JWT/ownership/session persistence. Chỉ xác nhận hoàn thành FE với mock; chờ Thịnh review UI trước khi push/merge.

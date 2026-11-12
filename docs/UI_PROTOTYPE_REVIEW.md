# Review UI login và giải bài

Branch: `feature/ui-design-prototype`. Lưu trong repo VSCode tại `D:/Subject-riki-hk2/subject-it-mon_duan_01/codjingrank`. Prototype chờ review; chưa merge hoặc push.

| Phần | Trước | Sau |
| --- | --- | --- |
| Login | Form tài khoản dùng style chung | Split layout desktop, form mobile, hiện/ẩn mật khẩu, focus rõ |
| Giải bài | Panel chức năng theo layout nền | Đề trái, editor và kết quả phải, mobile một cột |
| Sprint 3 | Editor, draft, Run, Submit, history, progress | Giữ chức năng, tổ chức lại vị trí và style |

## Kết quả thực tế

- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm test`: 199/199, 14 file.
- `npm run test:integration`: 28/28, 2 file; là tập con được chạy riêng, không cộng thành 227 test riêng biệt.
- `npm run build`: pass Next.js 16.4.5.
- Impeccable detector trên bốn file UI: `[]`.
- Chrome headless với profile mới, mock tại 4010 và production frontend tại 3000: đăng nhập, hiện/ẩn mật khẩu, mở bài mẫu, Run Accepted, Submit polling Accepted, lưu nháp và reset, đổi C++, Esc rồi Tab rời editor: pass.
- Đo document overflow ở 320/390/768/1024/1440px cho cả hai trang: không tràn ngang. Kiểm tra ảnh desktop/mobile; không có pageerror JavaScript.
- Lượt browser đầu timeout vì selector tìm Accepted thay vì nhãn thật Đạt (Accepted); đã sửa selector và chạy lại đạt. Không thay đổi hành vi ứng dụng để làm test đạt.
- Cảnh báo Vite về configLoader native/ESM trong vitest.config.ts vẫn có, không làm test fail.

Bằng chứng local: `C:/Users/Administrator/.codex/visualizations/2026/11/08/01a1bc06-765d-7b40-a856-8a1a58c05558/ui-prototype/` gồm ảnh và `browser-results.json`. Kịch bản browser tạm nằm ở `%TEMP%/codjingrank-ui-flows.cjs`; không thêm dependency Playwright vào dự án.

## Tự chạy để team review

Mở repo ổ D trong VSCode. Nếu cần cài theo lockfile: `npm ci`. `.env.local` dùng `NEXT_PUBLIC_GATEWAY_URL=http://localhost:4010` (không commit).

Terminal 1:

```powershell
npm run mock:sprint3
```

Terminal 2:

```powershell
npm run dev
```

Mở http://localhost:3000/login. Với mock demo dùng `learner@example.com` / `Coding2026`. Sau login, bấm “Mở bài tập mẫu: Sum two numbers” để đến workspace. Không refresh trang giữa luồng: access token chỉ ở memory và mock mặc định refresh trả 401. Đây là giới hạn mock, không phải bằng chứng persistence live. Nếu cổng đang có server, dùng server hiện tại hoặc dừng đúng terminal đang chạy trước khi mở lại.

Thử nhập code, đổi Python/C++/Java, đặt lại starter, chạy mẫu, nộp bài, xem lịch sử/tiến độ. Mock trả kết quả mô phỏng; không biên dịch/chấm code thật. Chờ cooldown trước khi nộp tiếp. Dùng Tab/Shift+Tab; trong editor Esc rồi Tab để rời. Thu nhỏ cửa sổ để review mobile.

## Giới hạn bằng chứng

Chưa kiểm tra backend live, thiết bị điện thoại thật, screen reader hoặc toàn bộ tổ hợp browser. Không gọi đây là nghiệm thu toàn sản phẩm hay thiết kế chính thức. Chưa thiết kế tiếp register/catalog/profile. Backend còn cần Gateway /api/v1, UUID DTO, auth/cookie rotation, Set-Cookie, CORS/Origin, Path/SameSite/Secure và Run/Submit/Judge theo contract.

## Finish review nội bộ

Review inline trên ảnh vì không có công cụ reviewer độc lập trong phiên. Disposition: ship cho prototype để team review, không phải phê duyệt thiết kế chính thức. Đã sửa logo login lệch và thụt dòng minh họa. Đã nhìn ảnh mới desktop/mobile và đối chiếu các tương tác; không còn lỗi vật chất trong phạm vi prototype. Giữ bố cục và toàn bộ logic Sprint 3 khi tiếp tục chỉnh giao diện.

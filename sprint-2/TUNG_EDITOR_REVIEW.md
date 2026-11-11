# Sprint 2 — review và tích hợp editor Tùng

Ngày kiểm tra: 2026-11-11. Nguồn: `origin/feat/tung-T4-06-editor-language-draft`, commit `272ae9a617378c185f4d46c38d065adb6e1c9d17`. Nền master `215d612`. Nhánh tích hợp: `feature/sprint-2-tung-editor-review`.

## Đối chiếu task

Đã đọc workbook `tasks-coding-judge-v2.0_2026-11-06_to_2026-11-22.xlsx`, sheet1, dòng công việc số 14 của Thanh Tùng: “[FE] Editor starter/reset và state lỗi”, Sprint 2: tích hợp editor, đổi language, reset starter, loading/error và lưu draft theo problem-language.

Các hạng mục trên có trong bản tích hợp. Dùng `/api/v1/problems/{slug}` và `/template?languageId=<UUID>`, starterCode/fileName đúng contract learner 2.1.0-contract. Không dựng Run/Submit, không hiển thị driver/hidden tests, không gọi service nội bộ. Phần đề/Markdown an toàn, tags, samples và đủ time/memory/output limits của Thịnh được giữ lại.

## Các điểm phát hiện và sửa trước merge

| Mức | Before | After | Vì sao |
| --- | --- | --- | --- |
| P1 | Draft local chỉ khóa theo problem/language | Namespace theo account UUID + problem UUID + language UUID; không đọc nháp legacy không có chủ | Tránh lộ/ghi đè mã giữa tài khoản chung trình duyệt |
| P1 | Không dọn nháp khi logout ở trang khác | Provider dọn nháp khi tài khoản đổi/hết phiên; workspace hủy request/timer, xóa memory và không flush sau logout | Kết quả muộn không phục hồi dữ liệu user cũ |
| P1 | Detail thành công có thể sai slug hoặc unlocked=false | Kiểm tra slug/unlocked và template identity; template 401/LEVEL_LOCKED dọn toàn bộ nội dung | Không trình chiếu payload sai bài hoặc đã mất quyền |
| P2 | Request treo giữ loading vô hạn | Deadline 15 giây với abort, retry rõ ràng và bỏ phản hồi cũ | Có đường phục hồi khi backend/mạng treo |
| P2 | Storage bị chặn/quota có thể mất sửa đổi khi đổi language | Giữ draft trong memory của workspace; báo chưa lưu bền vững | Đổi language không âm thầm mất mã; rời/reload vẫn có thể mất nháp chưa lưu |
| P2 | Xóa storage lỗi nhưng UI báo reset thành công | remove trả boolean; reset hiện lỗi và hủy autosave đang chờ | Không báo đã xóa khi browser từ chối |
| P2 | Số timestamp hữu hạn nhưng ngoài Date range làm render lỗi | Kiểm tra miền Date khi đọc/ghi nháp | Dữ liệu local hỏng không làm crash trang |
| P2 | Code lớn vẫn tạo một phần tử gutter/highlight cho từng dòng | Trên 20.000 ký tự dùng textarea thuần, bỏ render gutter/token; memo editor/Markdown | Giảm số phần tử DOM và công việc parse khi gõ/paste |
| P3 | Flush mỗi lần rời trang dù code không đổi | Dirty tracking + debounce 500ms, chỉ ghi khi có sửa đổi | Giảm synchronous storage writes dư |
| P3 | Esc blur trực tiếp | Esc rồi Tab di chuyển focus tự nhiên; Shift+Tab hoạt động | Giữ đường thoát editor bằng bàn phím |

Mock đa ngôn ngữ chỉ bật với `MOCK_EDITOR_DEMO=1`; language UUID không hỗ trợ trả 422, không giả một starter khác. `MOCK_PORT`/`MOCK_ORIGIN` dùng cho checkout test riêng, mặc định vẫn 4010/localhost:3000. Không thêm dependency.

## Kết quả kiểm tra

- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: PASS, 129 tests / 9 files, gồm regression Auth/session và adapter hiện có.
- `npm run build`: PASS, Next.js production build.
- `npm audit --omit=dev`: 0 vulnerabilities.
- `git diff --check`: PASS.

Ca bổ sung: account isolation và logout cleanup chỉ đúng account; không đọc draft legacy; reset hủy autosave; reset lỗi remove; Date range; giảm ghi storage trùng; giữ nháp qua language khi storage bị chặn; dispose không flush và bỏ kết quả muộn; timeout detail/template có retry. Các test cũ kiểm tra preferred language, template identity, locked/404, race language và tokenizer/indentation. Vitest hiện còn cảnh báo cấu hình native loader tương lai, không ảnh hưởng pass; không tự nâng tooling ngoài phạm vi.

Browser Chrome trên mock riêng (FE 3100, mock 4110): login → detail/editor; Python/C++ starter; đổi language giữ từng nháp; reset Python không xóa C++; reload hiển thị initializing rồi login do mock refresh 401; login lại khôi phục draft C++; logout ở `/protected` rồi login lại trả starter Python/C++ và xóa preference. Kiểm tra Esc rồi Tab thoát editor. Paste 24.000 ký tự/12.001 dòng: textarea chuyển plain mode, 0 phần tử gutter/highlight dòng, reset trở lại starter; đây là kiểm tra công việc DOM, không phải benchmark latency. Viewport override màn hình hẹp hiển thị một cột, không thấy tràn ngang; kích thước CSS thực công cụ báo 433px dù yêu cầu override 390px, không phải kiểm thử thiết bị mobile thật. Kiểm tra bằng trình duyệt là smoke, không thay thế toàn bộ E2E.

## Chạy lại và báo cáo cho nhóm

```powershell
npm ci
# Nếu chưa có .env.local: Copy-Item .env.example .env.local
$env:MOCK_EDITOR_DEMO='1'
npm run mock
# Terminal thứ hai, cùng checkout:
npm run dev
```

Mở `http://localhost:3000/login`, dùng tài khoản giả `learner@example.com` / `Coding2026`, rồi chọn bài mẫu. Không copy đè `.env.local` đang cấu hình live. Mock stateless không lưu auth cookie: refresh mặc định 401. `MOCK_REFRESH_STATUS=200` chỉ demo bootstrap.

Mẫu báo cáo: “Tùng hoàn thành editor/language/reset/loading-error/local drafts Sprint 2 trên bản FE tích hợp với đề/template của Thịnh. Đã review và sửa account isolation, logout/race, timeout, storage failure và render mã dài; 129 tests, lint, typecheck, build pass. Đạt với mock; chờ backend live. Không suy ra toàn bộ Sprint 2 nhóm đã done nếu phần catalog/filter/pagination của Huy chưa được kiểm duyệt.”

## Giới hạn và dependency live

Chỉ nghiệm thu phần FE của Thịnh + Tùng với mock và tests có điều khiển. Nháp local không mã hóa, không đồng bộ đa thiết bị/đa tab; xóa bền vững phụ thuộc quyền storage của browser. Nếu browser chặn xóa, UI/session vẫn bị dọn và account khác không đọc namespace này, nhưng dữ liệu trên đĩa có thể còn. Nháp legacy không chủ sở hữu bị bỏ qua, không tự gán cho user mới.

Backend cần thực thi `/api/v1`, UUID DTO, active assigned languages, level lock trước nội dung/template, loại driver/hidden tests; auth refresh rotation/revocation, Set-Cookie HttpOnly, cookie Path/SameSite/Secure đúng deployment và CORS/Origin + credentials. GitHub Pages chỉ là tài liệu. Mock không chứng minh JWT, ownership, session persistence hoặc rotation; không fallback root routes/integer IDs.

## Cách đưa lại vào master

Nhánh Tùng là tổ tiên của master vì đã merge PR #3, rồi bị revert `215d612`. Merge trực tiếp báo already up-to-date, không phục hồi code. Bản này khôi phục chọn lọc phần editor/tests/mock từ integration `2cd4350` (giữ credit/source commit Tùng), bổ sung sửa lỗi trên branch review, rồi merge branch review vào master. Không force push, không viết lại lịch sử, không đưa lại các báo cáo Sprint 3/5 hoặc di chuyển thư mục Sprint 1.

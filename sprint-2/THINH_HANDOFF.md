# Sprint 2 — Thịnh: Problem detail và starter template

Branch: `feature/sprint-2-thinh-problem-detail-template`, nền master `115bf55`.

## Cập nhật khi ghép master

Master đã có editor của Tùng qua PR #3. Route `/problems/[slug]` dùng `ProblemWorkspacePage` hiện có để giữ editor/reset/nháp, kết hợp `Statement` memoized của Thịnh, tags/samples và đủ time/memory/output limits. Không mount đồng thời hai resource nên không gọi API trùng. Deadline 15 giây được tách thành `lib/api/deadline.ts` và dùng cho cả hai controller; workspace kiểm tra slug, unlocked, identity template và xóa đề khi template trả 401/LEVEL_LOCKED. Guard key theo user/slug. Các mô tả bản xem chỉ đọc bên dưới là lịch sử nhánh độc lập trước khi ghép.

Kiểm tra tích hợp: lint/typecheck/tests/build; bộ test gồm cả regression editor/reset/nháp của Tùng và detail/template của Thịnh. Mock áp dụng sửa UUID trước khi tạo payload demo để không bị mất thay đổi khi ghép. Không xác nhận backend live hay toàn bộ Sprint 2 của Huy từ lần merge này.

Phạm vi task: kết nối đề, sample, giới hạn, tag và template theo language; không hiển thị driver code/hidden test. Contract: learner `2.1.0-contract` trong `contracts/openapi_fe.yaml`, tài liệu công bố tại https://code-automatic.github.io/codjingrank-backend/learner.html. Đây là target để mock, không xác nhận Gateway live.

Đã tải OpenAPI công bố và so sánh với snapshot trong repo ngày 2026-11-11: nội dung khớp sau khi chuẩn hóa xuống dòng.

## Chạy và demo

Yêu cầu Node 20.9+, npm. Chạy trong thư mục checkout nhánh này:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run mock
# Terminal thứ hai, cùng thư mục:
npm run dev
```

Nếu `.env.local` đã có thì giữ cấu hình hiện tại, không copy đè. Gateway mock: `NEXT_PUBLIC_GATEWAY_URL=http://localhost:4010` (không thêm `/api/v1`). Nếu cổng đang được dùng, dùng tiến trình đang chạy đúng checkout hoặc dừng tiến trình mock/dev cũ trước khi khởi động lại.

1. Mở http://localhost:3000/login, dùng tài khoản giả `learner@example.com` / `Coding2026`.
2. Chọn **Mở bài tập mẫu: Sum two numbers** ở `/protected`.
3. Kiểm tra tên, độ khó, tags, limits, đề, input/output mẫu và `main.py` giữ xuống dòng.
4. Dùng Tab đến select/ngăn code; select native hỗ trợ bàn phím. Thu hẹp cửa sổ để kiểm tra bố cục một cột.
5. Reload với mock mặc định sẽ về login vì refresh luôn 401. Đó là hành vi mock stateless. `MOCK_REFRESH_STATUS=200` chỉ minh họa bootstrap thành công, không chứng minh persistence.

## Cấu trúc và giao điểm ghép code

- `app/problems/[slug]/page.tsx`: route theo slug, await params của Next 16, slug sai trả not-found.
- `features/problems/ProblemPage.tsx`: guard chờ session bootstrap; chỉ mount dữ liệu sau authenticated. Unmount khi anonymous để hủy request và bỏ dữ liệu người dùng. Key theo user/slug.
- `features/problems/resource.ts`: dùng catalog client của Huy; snapshot detail/template có subscribe. Abort + generation/revision loại kết quả cũ khi reload, đổi ngôn ngữ hoặc unmount. Không có cache dùng chung/persistent storage. Lỗi mạng template có thể retry mà giữ đề. 401/LEVEL_LOCKED xóa nội dung; detail trả unlocked=false cũng không được render.
- `features/problems/ProblemContent.tsx`: view đề/samples/limits/tags và template chỉ đọc; state được truyền vào để dễ kiểm thử và ghép editor.
- `features/problems/Statement.tsx`: Markdown an toàn, không raw HTML, không ảnh ngoài; link qua bộ lọc URL mặc định của react-markdown.
- `tests/problem-detail.test.ts`: test API/resource bằng fixture contract và race có điều khiển; render tĩnh kiểm tra Markdown và trạng thái UI.

**Huy:** link từ danh sách đến `/problems/${problem.slug}`; dùng `unlocked/canOpen` từ server. Không tự suy đoán mở khóa theo số bài trên một trang pagination. Trang chi tiết vẫn xử lý 403 vì quyền có thể thay đổi sau khi danh sách tải.

**Tùng:** ghép editor ở vùng `problem-template` trong `ProblemContent`. Đầu vào hiện có: `detail.problem.id`, `languageId`, `template.starterCode`, `template.fileName`, `templateStatus`, `templateError`. Chỉ seed editor khi template ready và đúng cặp problem/language. Giữ nguyên bytes/newlines; draft/reset thuộc phần Tùng và phải theo cặp UUID problem-language. Không thay bản nháp người dùng bằng template trả trễ. Nếu cần draft store chung, thống nhất ownership trước khi merge.

Không có wrapperCode, hidden test, Piston runtime override, constraintsMd giả hoặc route/ID legacy. Giới hạn nội dung bài nằm trong `statementMd`; time/memory/output limits lấy từ các trường riêng đúng schema. Languages/samples dùng ngay dữ liệu detail để tránh request dư.

## Kiểm thử và nghiệm thu

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

Các ca tự động: detail/template đúng /api/v1, query UUID và AbortSignal; loading; empty samples/languages/tags; 403/404/503; sai slug/problem/language; language unsupported; template network retry; đổi ngôn ngữ với phản hồi cũ; reload/unmount hủy request; khóa bài sau detail; mã/Markdown độc hại không thực thi; giữ nguyên code; function/stdin_stdout mode. Bao gồm regression session Sprint 1.

Kết quả lần kiểm tra 2026-11-11: lint, typecheck, 67 tests và production build pass. Browser desktop smoke login mock → link bài mẫu → detail/template Python pass. Kiểm tra viewport mobile bị công cụ trình duyệt timeout, chưa xác nhận thực tế trên mobile. `npm audit --omit=dev`: 0 lỗ hổng; full audit có 8 cảnh báo moderate trong chuỗi ESLint/typescript-eslint/minimatch của dev tooling, cần theo dõi cập nhật tương thích riêng.

**Đạt với mock:** phần hiển thị và API adapter/resource theo contract, unit/render tests. Browser smoke chỉ dùng example Python, không phải browser E2E toàn bộ error/race matrix. Mock sửa liên kết `problemId` giữa hai example để chúng nhất quán, vẫn không validate JWT/ownership hoặc lưu session/dữ liệu.

**Chưa tích hợp live:** cần Gateway triển khai `/api/v1/problems/{slug}` và template UUID DTO, enforce level lock trước nội dung, assigned active languages, loại hidden/driver code; Auth refresh rotation, Set-Cookie, CORS/Origin, cookie Path/SameSite/Secure theo deployment. Không dùng domain GitHub Pages làm Gateway origin. Chưa thể đánh dấu toàn bộ Sprint 2 của ba thành viên done chỉ từ nhánh này.

## Tối ưu sau review

- `Statement` dùng React.memo: không parse/render lại Markdown khi chỉ thay đổi trạng thái template hoặc ngôn ngữ; nội dung đề đổi vẫn cập nhật bình thường.
- Chọn lại cùng ngôn ngữ đang tải hoặc đã ready không gọi API và không thông báo render dư. Sau lỗi vẫn được retry; chuyển sang ngôn ngữ khác vẫn lấy template mới, không cache quyền truy cập qua session.
- Mỗi request detail/template có deadline 15 giây, hủy transport khi hết hạn và hiển thị lỗi có nút thử lại. Deadline bao gồm thời gian refresh nếu request cần refresh; không tự retry vô hạn. Timer/listener được dọn khi xong hoặc unmount. Phản hồi cũ vẫn bị chặn bởi generation/revision.
- Bộ test tăng từ 67 lên 70, kiểm tra request trùng chỉ gọi một lần, timeout detail/template, phản hồi muộn và dọn timer. Đây là xác nhận giảm công việc dư và giới hạn chờ, không phải benchmark latency backend hoặc cam kết tốc độ mạng.

## Mẫu báo cáo thành viên

“Thịnh đã hoàn thành phần problem detail/starter template theo learner contract trên nhánh feature/sprint-2-thinh-problem-detail-template. Huy ghép link theo problem.slug; Tùng ghép editor theo problemId/languageId và nhận starterCode khi template ready. Chưa có Run/Submit; chưa nghiệm thu live. Trước khi merge cần review diff cả ba phần và chạy lại lint/typecheck/tests/build trên nhánh tích hợp.”

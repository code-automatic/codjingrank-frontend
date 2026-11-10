# Báo cáo thay đổi — Sprint 2

| | |
| --- | --- |
| **Sprint** | Sprint 2 |
| **Ngày** | 11/11/2026 |
| **Người thực hiện** | _[điền tên]_ |
| **Nhánh / commit** | _[điền branch + commit]_ |
| **Phạm vi** | US-15, US-19, US-20 (FR-03.2, FR-05.1–05.4) |
| **Trạng thái** | Hoàn thành phần frontend trên mock; chưa nghiệm thu live |

## 1. Tóm tắt

Đã tích hợp màn hình luyện tập `/problems/[slug]` gồm:

- editor có highlight, line number, trạng thái dòng/cột và phím Tab;
- đổi ngôn ngữ theo danh sách bài hỗ trợ, nạp đúng starter template;
- nút **Đặt lại mã khởi tạo** trả về đúng `starterCode`;
- tự lưu nháp theo cặp `(problemId, languageId)`;
- đầy đủ trạng thái loading/error và nút thử lại;
- mock có chế độ thử đổi ngôn ngữ bằng tay.

Không thay đổi backend, schema, OpenAPI hay dependency của frontend.

## 2. File thay đổi

### File mới

| File | Nội dung |
| --- | --- |
| [`page.tsx`](<../app/problems/[slug]/page.tsx>) | Route App Router cho màn hình bài tập |
| [`loading.tsx`](<../app/problems/[slug]/loading.tsx>) | Loading của route |
| [`error.tsx`](<../app/problems/[slug]/error.tsx>) | Error boundary của route |
| [`features/editor/ProblemWorkspacePage.tsx`](../features/editor/ProblemWorkspacePage.tsx) | Guard session, redirect login, mount workspace |
| [`features/editor/ProblemWorkspace.tsx`](../features/editor/ProblemWorkspace.tsx) | UI đề bài, editor, toolbar, trạng thái lỗi/lưu nháp |
| [`features/editor/CodeEditor.tsx`](../features/editor/CodeEditor.tsx) | Editor: highlight layer, line number, Tab, Esc, cursor |
| [`features/editor/highlight.ts`](../features/editor/highlight.ts) | Tokenizer Python/C++/Java/JavaScript, fallback plain |
| [`features/editor/edit-ops.ts`](../features/editor/edit-ops.ts) | Logic thụt lề thuần |
| [`features/editor/draft-store.ts`](../features/editor/draft-store.ts) | Lưu/đọc/xoá nháp theo problem-language |
| [`features/editor/workspace.ts`](../features/editor/workspace.ts) | Controller state, load template, debounce, abort/race |
| [`features/editor/useProblemWorkspace.ts`](../features/editor/useProblemWorkspace.ts) | Nối controller với React và `pagehide` |
| [`tests/draft-store.test.ts`](../tests/draft-store.test.ts) | Test key, cô lập nháp, record hỏng, quota |
| [`tests/editor-highlight.test.ts`](../tests/editor-highlight.test.ts) | Test map ngôn ngữ và tokenizer |
| [`tests/edit-ops.test.ts`](../tests/edit-ops.test.ts) | Test thụt lề và selection biên |
| [`tests/workspace.test.ts`](../tests/workspace.test.ts) | Test load, đổi ngôn ngữ, reset, race, lỗi |
| [`sprint-2/README.md`](README.md) | Tài liệu phạm vi, cách chạy và kiểm tra Sprint 2 |

### File sửa

| File | Nội dung |
| --- | --- |
| [`app/styles.css`](../app/styles.css) | Style workspace, editor, token màu, responsive, reduced-motion |
| [`scripts/mock.mjs`](../scripts/mock.mjs) | Tuỳ chọn `MOCK_EDITOR_DEMO=1` thêm C++/Java cho `sum-two` |
| [`README.md`](../README.md) | Thêm mục editor Sprint 2 và hướng dẫn mock |

## 3. Chi tiết thay đổi theo yêu cầu

### 3.1. Tích hợp editor

- Route mới: `/problems/{slug}`.
- Editor tự viết, không thêm dependency:
  - line number;
  - syntax highlight cho Python/C++/Java/JavaScript;
  - hiển thị `Ln`, `Col`, số dòng và số byte;
  - Tab chèn 4 dấu cách hoặc thụt lề nhiều dòng;
  - `Esc` rời editor;
  - fallback plain text cho ngôn ngữ lạ hoặc source quá 20.000 ký tự.
- Đề bài render dạng text trong `<pre>`, không dùng `dangerouslySetInnerHTML`.
- Hiển thị sample input/output, giới hạn thời gian, bộ nhớ, chế độ chạy.

### 3.2. Đổi ngôn ngữ

- Lấy `languages` từ `GET /api/v1/problems/{slug}`.
- Khi đổi ngôn ngữ:
  1. flush nháp của ngôn ngữ hiện tại;
  2. lưu ngôn ngữ vừa chọn cho bài;
  3. gọi `GET /api/v1/problems/{slug}/template?languageId=...`;
  4. khôi phục nháp của ngôn ngữ mới nếu có, ngược lại dùng starter.
- Request template cũ bị abort; response về muộn bị bỏ qua bằng epoch.
- Kiểm tra `problemId`/`languageId` của template khớp bài/ngôn ngữ đang chọn.
- Ngôn ngữ ưu tiên lưu tại `codjingrank:language:v1:<problemId>`.

### 3.3. Reset starter

- Nút **Đặt lại mã khởi tạo**:
  - dùng đúng `starterCode` đã tải từ API;
  - xoá nháp của riêng ngôn ngữ hiện tại;
  - không ảnh hưởng nháp của ngôn ngữ khác;
  - reset trạng thái `draftRestored`, `savedAt`.

### 3.4. Loading/error

| Tình huống | Xử lý |
| --- | --- |
| Đang tải problem | `role="status"` “Đang tải bài tập…” |
| 403 `LEVEL_LOCKED` | Màn hình “Bài tập đang bị khóa” + thử lại |
| 404 | “Không tìm thấy bài tập” |
| Slug sai | Báo lỗi ngay, không gọi API |
| Đang tải template | Overlay loading, editor disabled |
| Template lỗi | Overlay lỗi + nút “Thử lại”, giữ problem |
| Lưu nháp lỗi | Báo không lưu được, không mất code |
| Mất phiên | Redirect `/login` |

### 3.5. Lưu nháp theo problem-language

- Key: `codjingrank:draft:v1:<problemId>:<languageId>`.
- Record: `{v, problemId, languageId, code, savedAt}`.
- Debounce 500 ms; flush khi:
  - đổi ngôn ngữ;
  - bấm reset;
  - rời trang (`pagehide`);
  - unmount.
- Code trùng starter thì xoá nháp.
- Record hỏng/sai ID/sai version bị xoá, không khôi phục nhầm.
- `localStorage` bị chặn/hết quota: trả `false`, không throw; code vẫn còn trong phiên.
- Nháp chỉ lưu local, không gửi lên server.

## 4. API/contract sử dụng

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| GET | `/api/v1/problems/{slug}` | Problem detail + danh sách ngôn ngữ + sample |
| GET | `/api/v1/problems/{slug}/template?languageId=` | Starter code + tên tệp |
| GET | `/api/v1/problems/{slug}/languages` | Có sẵn trong client; UI dùng `languages` từ problem detail để tránh hai nguồn dữ liệu lệch |

Không gọi Run/Submit trong sprint này. Không có field `wrapperCode`, `executeCode`, hidden test hoặc legacy field trong UI.

## 5. Kiểm chứng

| Lệnh | Kết quả |
| --- | --- |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm test` | 8 file, 95/95 test PASS |
| `npm run build` | PASS, có route `/problems/[slug]` |
| Smoke test mock | `MOCK_EDITOR_DEMO=1` trả 3 ngôn ngữ và template C++ đúng |
| Smoke test production | `GET /problems/sum-two` trả HTTP 200 |

Test mới bao phủ:

- key nháp theo problem-language, cô lập, record hỏng, quota/storage bị chặn;
- tokenizer lossless, comment/string nhiều dòng, fallback plain;
- thụt lề và selection biên;
- load + khôi phục nháp, lưu/đổi ngôn ngữ, reset, race template cũ, lỗi template + retry, 403, slug sai, template lệch ID, lỗi ghi nháp.

## 6. Cách chạy thử

```bat
cd codjingrank-frontend
npm ci
if not exist .env.local copy .env.example .env.local
set MOCK_EDITOR_DEMO=1
npm run mock
```

Terminal thứ hai:

```bat
npm run dev
```

Đăng nhập bằng `learner@example.com` / `Coding2026`, mở:

```text
http://localhost:3000/problems/sum-two
```

Các bước kiểm tra tay:

1. Sửa code, đợi “Đã lưu nháp…”, reload → code còn.
2. Đổi Python → C++ → Python → nháp từng ngôn ngữ còn riêng.
3. Bấm Reset → về starter, nháp ngôn ngữ đó mất.
4. Xoá/chặn localStorage → editor vẫn sửa được, báo không lưu nháp.
5. Mở slug sai hoặc mock `Prefer: code=403` → màn hình lỗi tương ứng.

## 7. Hạn chế và bước tiếp theo

- Chưa có Run/Submit; thuộc sprint sau.
- Chưa có catalog nên màn hình mở bằng deep link, chưa có link từ `/protected`.
- Mock stateless, không chứng minh cookie/session backend hoặc template thật từ DB.
- Chưa chạy browser E2E; mới có unit test + build + smoke test route.
- Nháp không đồng bộ giữa thiết bị/trình duyệt.
- Editor là implementation nội bộ; nếu team chốt Monaco có thể thay `CodeEditor` mà giữ nguyên `workspace` và `draft-store`.

## 8. Checklist bàn giao

- [ ] Điền tên, branch, commit vào bảng đầu file.
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` đều pass.
- [ ] Chạy thử 5 bước ở mục 6 trên browser.
- [ ] Reviewer kiểm tra key nháp và luồng đổi ngôn ngữ.
- [ ] Xác nhận không có thay đổi backend/contract ngoài phạm vi.

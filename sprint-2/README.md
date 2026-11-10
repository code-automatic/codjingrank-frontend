# Sprint 2 — 2026-11-11

> Tích hợp editor, đổi ngôn ngữ, reset mã khởi tạo, loading/error và lưu nháp
> theo cặp (problem, language).

Nguồn: [`docs/DECISIONS.md`](../../srs/docs/DECISIONS.md),
[`docs/NEXT_STEPS.md`](../../srs/docs/NEXT_STEPS.md),
[`docs/FRONTEND_API_CONTRACT.md`](../../srs/docs/FRONTEND_API_CONTRACT.md).

## Phạm vi

| Story | Nội dung | Kết quả |
| --- | --- | --- |
| US-15 / FR-03.2 | Chỉ thấy ngôn ngữ bài hỗ trợ; đổi ngôn ngữ nạp lại starter tương ứng | Select lấy từ `languages` của problem detail; mỗi lần đổi gọi `GET /problems/{slug}/template?languageId=` và ưu tiên nháp của ngôn ngữ đó |
| US-19 / FR-05.1–05.3 | Editor có highlight và nút Reset | Editor tự viết, có line number, highlight Python/C++/Java/JS, phím Tab, trạng thái dòng/cột; Reset trả đúng `starterCode` |
| US-20 / FR-05.4 | Nháp tự lưu, tải lại trang vẫn còn theo (bài, ngôn ngữ) | `localStorage` key `codjingrank:draft:v1:<problemId>:<languageId>`, debounce 500 ms, flush khi đổi ngôn ngữ/reset/rời trang |

Không nằm trong sprint này: Run/Submit, catalog, lịch sử nộp bài. Trang editor
được mở bằng deep link `/problems/{slug}`; catalog sẽ nối vào ở sprint sau.

## Thay đổi theo file

### Route và màn hình

- [`app/problems/[slug]/page.tsx`](../app/problems/[slug]/page.tsx) — route
  App Router, nhận `slug` từ params.
- [`app/problems/[slug]/loading.tsx`](../app/problems/[slug]/loading.tsx) và
  [`app/problems/[slug]/error.tsx`](../app/problems/[slug]/error.tsx) — loading
  và error boundary của route; lỗi nghiệp vụ/API vẫn do controller xử lý để có
  thông báo và nút thử lại cụ thể.
- [`features/editor/ProblemWorkspacePage.tsx`](../features/editor/ProblemWorkspacePage.tsx)
  — chặn khi chưa đăng nhập, redirect `/login`, chờ session bootstrap.
- [`features/editor/ProblemWorkspace.tsx`](../features/editor/ProblemWorkspace.tsx)
  — màn hình đề bài + editor, toolbar ngôn ngữ/reset, sample, thông tin giới
  hạn, các trạng thái loading/error.

### Editor

- [`features/editor/CodeEditor.tsx`](../features/editor/CodeEditor.tsx) —
  textarea trong suốt đặt trên lớp highlight; line number, con trỏ dòng/cột,
  Tab chèn 4 dấu cách (hoặc thụt lề nhiều dòng), Esc để rời editor,
  `prefers-reduced-motion` được tôn trọng.
- [`features/editor/highlight.ts`](../features/editor/highlight.ts) — tokenizer
  không phụ thuộc thư viện cho Python/C++/Java/JavaScript; token giữ nguyên
  từng byte; fallback plain text cho ngôn ngữ lạ hoặc source > 20.000 ký tự.
- [`features/editor/edit-ops.ts`](../features/editor/edit-ops.ts) — phép thụt
  lề thuần, có test biên selection.

### Ngôn ngữ và starter

- Danh sách ngôn ngữ lấy từ `GET /api/v1/problems/{slug}` (field `languages`).
  Endpoint `/problems/{slug}/languages` vẫn có trong client/adapter nhưng không
  gọi thêm để tránh hai nguồn dữ liệu lệch nhau.
- Mỗi lần đổi ngôn ngữ: flush nháp hiện tại → lưu ngôn ngữ vừa chọn cho bài →
  gọi template mới → khôi phục nháp của ngôn ngữ mới nếu có, ngược lại dùng
  `starterCode`.
- Request template cũ bị abort và bị bỏ qua bằng epoch nếu trả về muộn.
- Template được kiểm tra `problemId`/`languageId` khớp với bài/ngôn ngữ đang
  chọn; lệch contract báo `INVALID_CONTRACT_DATA`.
- Ngôn ngữ ưu tiên của bài lưu tại
  `codjingrank:language:v1:<problemId>` (tiện ích, không phải draft).

### Lưu nháp theo problem-language

- [`features/editor/draft-store.ts`](../features/editor/draft-store.ts):
  - key có version, gồm cả `problemId` và `languageId` (UUID), không dùng slug;
  - record có `{v, problemId, languageId, code, savedAt}`; record hỏng/lệch ID/
    sai version bị xoá thay vì khôi phục nhầm;
  - `localStorage` bị chặn hoặc hết quota trả `false`, không throw; UI báo
    không lưu được và vẫn giữ code trong phiên;
  - Reset xoá đúng nháp của cặp hiện tại; code trùng starter cũng xoá nháp.
- [`features/editor/workspace.ts`](../features/editor/workspace.ts) — controller
  thuần (không React) quản lý state, debounce, flush, abort/epoch, lỗi.
- [`features/editor/useProblemWorkspace.ts`](../features/editor/useProblemWorkspace.ts)
  — nối controller với React và `pagehide`.

### Loading/error

| Tình huống | Hiển thị |
| --- | --- |
| Đang tải problem | `role="status"` “Đang tải bài tập…” |
| 403 `LEVEL_LOCKED` | Màn hình “Bài tập đang bị khóa”, có nút thử lại |
| 404 | “Không tìm thấy bài tập” |
| Slug sai | “Đường dẫn bài tập không hợp lệ”, không gọi API |
| Đang tải template | Overlay “Đang tải mã khởi tạo…”, editor disabled |
| Template lỗi | Overlay lỗi + nút “Thử lại”, problem vẫn giữ |
| Lưu nháp lỗi/không khả dụng | Dòng trạng thái lỗi, code không bị mất |
| Mất phiên | `ProblemWorkspacePage` redirect `/login` |

### An toàn và accessibility

- `statementMd` render dạng text trong `<pre>`, không `dangerouslySetInnerHTML`.
- Không có `wrapperCode`, `executeCode`, hidden test hay field legacy trong UI;
  adapter/guard sẵn có vẫn chặn các field này.
- Draft chỉ nằm trong `localStorage`, không gửi lên server, không chứa token.
- Select có `<label>`, editor có `aria-label`/`aria-describedby`, trạng thái
  lưu dùng `aria-live="polite"`, nút có `title`, focus ring giữ nguyên.

## Kiểm thử

Đã chạy trong `codjingrank-frontend`:

```powershell
npm run lint        # PASS
npm run typecheck   # PASS
npm test            # 8 file, 95 test PASS
npm run build       # PASS, có route /problems/[slug]
```

Test mới:

- `tests/draft-store.test.ts` — key theo problem+language, round-trip, cô lập,
  record hỏng, UUID sai, quota/storage bị chặn, ngôn ngữ ưu tiên.
- `tests/editor-highlight.test.ts` — map slug, token lossless, comment/string
  nhiều dòng, Java, fallback plain và ngưỡng kích thước.
- `tests/edit-ops.test.ts` — chèn/thụt lề, selection biên.
- `tests/workspace.test.ts` — load + khôi phục nháp, lưu/đổi ngôn ngữ, reset,
  race template cũ, lỗi template + retry, 403, slug sai, template lệch ID,
  ngôn ngữ ưu tiên, lỗi ghi nháp, problem không có ngôn ngữ.

## Chạy thử

```powershell
npm ci
Copy-Item .env.example .env.local   # chỉ khi chưa có
$env:MOCK_EDITOR_DEMO='1'; npm run mock
# terminal khác
npm run dev
```

Đăng nhập bằng dữ liệu mock (`learner@example.com` / `Coding2026`), mở
`http://localhost:3000/problems/sum-two`.

`MOCK_EDITOR_DEMO=1` là tuỳ chọn cục bộ của mock: hợp đồng chỉ có một ngôn ngữ
ở example, nên mock thêm C++/Java + starter tương ứng để thử đổi ngôn ngữ bằng
tay. Không đặt biến này thì mock giữ nguyên dữ liệu từ `openapi_fe.yaml`.

Các bước kiểm tra tay:

1. Sửa code, đợi “Đã lưu nháp lúc …”, tải lại trang → code còn.
2. Đổi Python → C++ → Python → nháp của từng ngôn ngữ còn riêng.
3. Bấm “Đặt lại mã khởi tạo” → về starter, nháp của ngôn ngữ đó mất, ngôn ngữ
   khác không bị ảnh hưởng.
4. Chặn/xoá localStorage (DevTools) → editor vẫn sửa được, báo không lưu nháp.
5. Mở slug sai hoặc bài bị khóa (mock `Prefer: code=403`) → màn hình lỗi tương
   ứng, nút thử lại.

## Ghi chú

- Mock là stateless: không chứng minh cookie/session backend, không chứng minh
  template thật từ DB. Unit test kiểm tra logic FE và contract adapter.
- Chưa có E2E browser; các luồng UI mới được kiểm tra qua build + unit test và
  cần một lượt browser thủ công trước khi đánh dấu live.
- Nháp không đồng bộ giữa thiết bị/trình duyệt; đúng phạm vi US-20 (local draft).

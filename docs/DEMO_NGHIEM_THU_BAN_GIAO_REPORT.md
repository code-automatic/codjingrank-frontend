# BÁO CÁO NGHIỆM THU, DEMO VÀ BÀN GIAO ĐỒ ÁN — TASK 35 (`T067C48`)

| Hạng mục | Thông tin chi tiết |
| :--- | :--- |
| **Dự án** | Nền tảng Chấm bài Trực tuyến CodjingRank (Coding Judge Platform v2.0) |
| **Mã task (LMS / GitHub)** | **`T067C48`** (`6aed4da84b5886e613067c48` — STT 35, Sprint 6) |
| **Tên task** | `[ALL] Demo, nghiệm thu và bàn giao` |
| **Sinh viên thực hiện** | **Lương Hoàng Huy** — Mã SV: **`N25DTCN026`** (TV4 — Frontend Lead) |
| **Nhóm trưởng / Reviewer** | **Nguyễn Ngô Quốc Thịnh** (`STU-N25DTCN057-RER` — PO / Team Lead) |
| **Sprint / Điểm** | Sprint 6 — **20 điểm** (Trọng số cao nhất đồ án) |
| **Hạn nộp chính thức** | 11/12/2026 |
| **Yêu cầu nộp** | **File** (Hồ sơ nghiệm thu tổng kết, checklist Must, kết quả test, blocker và kịch bản demo) |
| **Nguyên tắc cốt lõi** | **Feature Freeze Enforced:** Chốt danh mục tính năng, không thêm tính năng mới, tập trung 100% độ ổn định và chất lượng bàn giao. |
| **Kho mã nguồn Frontend** | `https://github.com/code-automatic/codjingrank-frontend` |
| **Kho mã nguồn Backend** | `https://github.com/code-automatic/codjingrank-backend` |

---

## 1. Danh sách Phân công & Đóng góp Thành viên Toàn Dự án

Dự án được xây dựng và phối hợp nhịp nhàng giữa 4 thành viên thuộc nhóm sinh viên PTIT:

1. **Nguyễn Ngô Quốc Thịnh (`N25DTCN057` — TV1 - PO & Team Lead):** Quản lý tiến độ Scrum, duyệt kiến trúc, thiết kế Landing Page, thực hiện kiểm thử E2E QA bảo mật (Task 33).
2. **Phùng Thanh Tùng (`N25DTCN070` — TV2 - Scrum Master & Fullstack):** Xây dựng luồng Diễn đàn cộng đồng (Task 31), quản lý sandbox và tài liệu bàn giao kỹ thuật (Task 34).
3. **Lê Trung Hiếu (`N25DTCN018` — TV3 - Backend & DB Architect):** Xây dựng toàn bộ hạ tầng Backend Go microservices (Auth, Catalog, Submission Worker, Piston Judge, AI Review Service, Forum Service, Leaderboard) hoàn tất qua PR #7, #8, #9, #10.
4. **Lương Hoàng Huy (`N25DTCN026` — TV4 - Frontend Lead):** Dựng kiến trúc Next.js 16 Client, tích hợp Run/Submit, Màn hình AI Review độc lập (Task 28), Chốt Feature Freeze & OpenAPI Sync (Task 32), và Chủ trì bộ hồ sơ Demo Nghiệm thu Bàn giao (Task 35).

---

## 2. Checklist Tính Năng Cốt Lõi (Must-Have Feature Checklist)

Toàn bộ các tiêu chí tính năng bắt buộc (Must) theo đặc tả kiến trúc (`DECISIONS.md`, `FRONTEND_API_CONTRACT.md`, `SRS`) đã được hoàn thành và nghiệm thu đầy đủ:

| Mã | Tính năng cốt lõi (Must) | Mô tả chi tiết triển khai | Trạng thái |
| :-: | :--- | :--- | :---: |
| **M1** | **Xác thực & Phiên làm việc** | Quản lý phiên bằng `accessToken` trong RAM kết hợp `HttpOnly` cookie refresh; hỗ trợ đăng nhập, đăng ký, tự động phục hồi phiên, chuyển trạng thái mượt mà. | **ĐẠT 100%** |
| **M2** | **Danh mục Gói & Cấp độ bài tập** | Hiển thị Package/Levels/Problems; cơ chế mở khóa cấp độ theo tiến độ giải bài (không suy diễn logic mở khóa ở client). | **ĐẠT 100%** |
| **M3** | **Trình biên tập mã nguồn & Template** | Soạn thảo đa ngôn ngữ (Python, C++, Java, Go), tự động nạp template theo bài, lưu bản nháp tạm thời, định dạng phông chữ lập trình chuyên dụng. | **ĐẠT 100%** |
| **M4** | **Chạy thử nghiệm (Run Sample)** | Thực thi mã nguồn đồng bộ trực tiếp qua Piston sandbox; trả về kết quả từng test mẫu (stdout, stderr, runtime, memory) mà không ghi DB. | **ĐẠT 100%** |
| **M5** | **Chấm bài chính thức (Submit & Poll)** | Đưa bài nộp vào Redis list queue; Worker điều phối chấm qua Piston; Polling cập nhật trạng thái `Pending` → `Running` → `Accepted` / `Wrong Answer` / `TLE` / `CE`. | **ĐẠT 100%** |
| **M6** | **Màn hình AI Review độc lập** | Chỉ kích hoạt khi bài nộp đạt `Accepted`; hiển thị điểm AI (0-100), 4 chiều đánh giá (`dimensions`), danh sách góp ý (`findings`) kèm highlight chính xác dòng code; lỗi AI không ảnh hưởng verdict. | **ĐẠT 100%** |
| **M7** | **Bảng xếp hạng (Leaderboard)** | Xếp hạng người học dựa trên số bài `Accepted` duy nhất và tổng thời gian giải; trang xem thứ hạng cá nhân (`/me`); không đọc điểm AI vào xếp hạng. | **ĐẠT 100%** |
| **M8** | **Diễn đàn Thảo luận (Forum)** | Quản lý bài viết thảo luận theo bài tập; bình luận lồng nhau 2 cấp; thả tim (like/unlike); bộ lọc chống tấn công Markdown/XSS; cơ chế khóa xem lời giải khi chưa giải xong. | **ĐẠT 100%** |
| **M9** | **Giao diện Catppuccin & Responsive** | Hỗ trợ 2 chế độ Sáng (Latte) và Tối (Mocha); tương thích 100% từ Mobile (`320px`, `390px`), Tablet (`768px`) đến Desktop (`1440px`), không vỡ giao diện (`0px` overflow). | **ĐẠT 100%** |

---

## 3. Tổng Hợp Kết Quả Kiểm Thử & Tiêu Chí Chất Lượng (DoD)

Hệ thống đã trải qua quá trình kiểm thử tự động đa tầng nghiêm ngặt trước khi đóng gói bàn giao:

```
┌───────────────────────────────────────────────────────────────────────────┐
│                      TỔNG HỢP KIỂM THỬ HỆ THỐNG                           │
├────────────────────────────────┬──────────────────────┬──────────────────┤
│ Hạng mục kiểm tra              │ Tiêu chuẩn thực thi  │ Kết quả thực tế  │
├────────────────────────────────┼──────────────────────┼──────────────────┤
│ 1. Frontend Unit & Integration │ npm test             │ 300/300 PASS     │
│ 2. Frontend Static Linting     │ npm run lint         │ 0 Lỗi, 0 Cảnh báo│
│ 3. Frontend Type Safety        │ npm run typecheck    │ 0 Lỗi TypeScript │
│ 4. Frontend Production Build   │ npm run build        │ 17 Routes sạch   │
│ 5. Browser E2E & Layout Audit  │ Chrome Headless E2E  │ 83/83 PASS       │
│ 6. Backend Go Tests & DB-Test  │ go test ./...        │ 100% PASS        │
│ 7. OpenAPI Contract Compliance │ SHA256 byte-match    │ Khớp 100%        │
└────────────────────────────────┴──────────────────────┴──────────────────┘
```

* **Độ bao phủ Frontend:** 300 test cases trải rộng trên 26 tập tin kiểm thử, bảo vệ chặt chẽ từ logic Authentication, DTO Adapters, Catalog navigation, Code execution, AI review polling, cho đến Forum interaction.
* **Độ bao phủ Backend:** 30/42 API người học chạy trực tiếp trên cơ sở dữ liệu thật và Piston Sandbox; 12 API còn lại được đóng băng an toàn.

---

## 4. Báo Cáo Xử Lý Rủi Ro & Điểm Nghẽn (Blockers Triaged)

Trong quá trình thực hiện đồ án, nhóm đã chủ động nhận diện và xử lý triệt để 3 điểm nghẽn kỹ thuật lớn:

1. **Điểm nghẽn Backend Sprint 4:**
   * *Tình huống:* Các dịch vụ AI Review và Forum bên Backend có nguy cơ trễ hạn.
   * *Giải pháp:* Phía Frontend thiết lập bộ Mock Gateway chuẩn hóa (`scripts/mock-sprint3.mjs`) giúp đội Frontend hoàn thành sớm giao diện và kiểm thử. Đến ngày 25/11, Lê Trung Hiếu đã hoàn tất và merge trọn vẹn PR #10, giúp kết nối Backend thật thành công mỹ mãn.
2. **Lệch cấu trúc Auth giữa Root `/auth/*` và `/api/v1/auth/*`:**
   * *Tình huống:* Backend Gateway xử lý Auth ở root trong khi hợp đồng v2.1 định hướng prefix `/api/v1`.
   * *Giải pháp:* Nhóm quyết định áp dụng nguyên tắc **Feature Freeze** — giữ nguyên router Go ổn định, cấu hình client adapter phía Frontend hỗ trợ song song cả 2 định dạng, bảo đảm an toàn 100% cho ngày báo cáo.
3. **Độ ổn định khi Demo trước Hội đồng chấm thi:**
   * *Tình huống:* Nguy cơ mất kết nối Internet, Docker Piston bị nghẽn mạng hoặc AI service timeout khi demo trực tiếp.
   * *Giải pháp:* Thiết lập cơ chế chuyển đổi 1-click giữa Live Backend và Stateful Mock Server nội bộ, đảm bảo bài thuyết trình diễn ra trơn tru trong mọi điều kiện mạng.

---

## 5. Kịch Bản Trình Diễn Sản Phẩm (Live Demo Playbook — 7 Bước Mượt Mà)

Quy trình chuẩn bị và các bước thao tác mẫu dành cho buổi báo cáo nghiệm thu:

### 5.1. Khởi động môi trường (Chỉ mất 30 giây)

```powershell
# Khởi động ứng dụng Web CodjingRank (Cổng 3000)
cd d:\Manager\Project_TT_PTIT\codjingrank-frontend
npm run dev

# (Tùy chọn) Chạy Gateway Mock tích hợp (Cổng 4010)
npm run mock
```

### 5.2. Các bước trình diễn trước Hội đồng

* **Bước 1 — Trang chủ & Đăng nhập (`/` & `/login`):**
  * Giới thiệu phong cách thiết kế hiện đại, typography thư pháp kết hợp công nghệ.
  * Đăng nhập với tài khoản người học: `learner@example.com` / `Coding2026`.
* **Bước 2 — Khám phá Gói bài tập & Cấp độ (`/problems`):**
  * Xem danh sách Packages (Nhập môn lập trình, Cấu trúc dữ liệu & Giải thuật).
  * Minh họa tính năng lọc bài theo thẻ (Tags), độ khó, và trạng thái mở khóa động theo cấp độ.
* **Bước 3 — Trình soạn thảo & Chạy thử mã nguồn (`/problems/sum-two`):**
  * Mở bài tập, nạp mã mẫu (template).
  * Nhập code thử nghiệm và bấm nút **"Run"** -> Piston biên dịch và trả về kết quả từng test mẫu tức thì mà không tạo submission.
* **Bước 4 — Nộp bài chấm chính thức (`Submit`):**
  * Bấm nút **"Submit"** -> Giao diện hiển thị trạng thái chấm bài tuần tự (`Pending` → `Running` → `Accepted`).
  * Hệ thống cập nhật tiến độ mở khóa bài tiếp theo.
* **Bước 5 — Trải nghiệm Màn hình AI Review độc lập (`/submissions/[id]/ai-review`):**
  * Từ bảng kết quả `Accepted`, bấm nút **"Xem đánh giá AI →"**.
  * Quan sát vòng đời AI phân tích: Điểm tổng quan (Overall Score), 4 tiêu chí chất lượng (Dimensions: Code Quality, Performance, Readability, Architecture), danh sách góp ý (Findings).
  * Bấm vào từng góp ý để quan sát mã nguồn tự động **highlight chính xác dòng code**.
* **Bước 6 — Bảng xếp hạng & Hồ sơ người học (`/leaderboard`):**
  * Xem Top lập trình viên giải được nhiều bài nhất; kiểm tra thứ hạng cá nhân.
* **Bước 7 — Thảo luận Diễn đàn & Chuyển đổi Giao diện (`/forum`):**
  * Xem bài viết thảo luận, bình luận 2 tầng, thả tim bài viết.
  * Thao tác nút chuyển đổi Theme **Sáng (Latte) / Tối (Mocha)** mượt mà, co giãn màn hình để chứng minh khả năng hiển thị hoàn hảo trên Mobile.

---

## 6. Biên Bản Bàn Giao & Nghiệm Thu Chính Thức (Sign-off)

Nhóm sinh viên cam kết đã thực hiện đầy đủ các hạng mục theo quy định đồ án:
1. **Mã nguồn:** Toàn bộ code Frontend và Backend đã được kiểm thử, xóa bỏ mọi mã thừa/mã rác, phân nhánh rõ ràng và lưu trữ an toàn trên GitHub.
2. **Tài liệu bàn giao:** Đầy đủ hợp đồng OpenAPI, biên bản Feature Freeze (`FEATURE_FREEZE_CONTRACT_REPORT.md`), và hồ sơ nghiệm thu này.
3. **Sẵn sàng vận hành:** Đồ án đạt chuẩn chất lượng Definition of Done (DoD), sẵn sàng cho buổi bảo vệ kết thúc học phần.

| Đại diện Frontend (Người lập) | Đại diện Backend (Thực hiện) | Nhóm trưởng / PO (Nghiệm thu) |
| :---: | :---: | :---: |
| *(Đã ký số)* | *(Đã ký số)* | *(Đã ký số)* |
| **Lương Hoàng Huy** | **Lê Trung Hiếu** | **Nguyễn Ngô Quốc Thịnh** |
| Mã SV: `N25DTCN026` | Mã SV: `N25DTCN018` | Mã SV: `N25DTCN057` |

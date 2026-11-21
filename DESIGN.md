# Codjingrank UI — HackerRank auth / LeetCode workspace

## Giao diện ứng dụng mở rộng — 19/11/2026

Mode Operate. Theo ảnh LeetCode người dùng gửi: thanh điều hướng 60px, active underline, tìm kiếm gọn, popover tài khoản dạng ô lối tắt và nhóm chọn theme. Kho bài có sidebar/bảng danh sách/cột lịch, mobile đổi thành điều hướng ngang và menu popover. Tổng quan ghép dữ liệu lộ trình/cộng đồng với bài thử thách. Giữ Catppuccin Latte/Mocha và logo gốc của ứng dụng; landing tiếp tục dùng palette riêng. Thông báo và Pro demo được người dùng chấp thuận; phần Cuộc thi đã gỡ theo yêu cầu tiếp theo, nhãn demo luôn hiện; không mô phỏng giao dịch thật. Native popover/dialog hỗ trợ Escape và light-dismiss, motion chỉ phản hồi hover/press, reduced-motion bỏ chuyển động. Không sửa controller editor, Run/Submit hoặc auth. Chi tiết và kết quả: docs/POST_LOGIN_UI_REVIEW.md.

Yêu cầu của Thịnh ngày 13/11/2026 thay thế hướng phủ mocha toàn giao diện. Tham chiếu bố cục dựa trên ảnh người dùng cung cấp; không cam kết đối chiếu từng pixel với website live.

## Thương hiệu

- Chỉ biểu tượng C, dấu >, các thanh tăng dần dùng #087f78. Chữ lấy alpha từ logo gốc để giữ đúng kiểu chữ, dùng currentColor qua mask riêng; không dùng filter toàn logo.
- Chữ màu trắng trên vùng minh họa luôn tối; bản auto dùng màu chữ theo bề mặt theme. Biểu tượng độc lập ở workspace/favicon, Apple icon nền trắng trung tính.
- Không dựng SVG phỏng đoán đường nét của raster. Asset PNG alpha giữ hình và lettering người dùng cung cấp.

## Theme

- app/theme.css là nguồn semantic tokens cho hai palette. Light: Catppuccin Latte; Dark: Catppuccin Mocha theo quyết định của team. Nguồn chính thức: https://catppuccin.com/palette/. Mauve là accent chung, xanh lá/đỏ/vàng dành cho trạng thái. Latte làm đậm các accent khi dùng làm chữ nhỏ và dùng subtext1 cho chữ phụ để giữ tương phản. Biểu tượng logo dùng chung token --brand-mark: #087f78 từ landing đến ứng dụng và workspace, độc lập palette.
- Inline trusted head script đặt data-theme trước body paint. CSS có system fallback; suppressHydrationWarning chỉ trên html để chấp nhận thuộc tính do script đặt.
- Lần đầu theo OS. Toggle lưu đúng khóa codjingrank-theme; root ThemeSync theo dõi OS khi chưa chọn và đồng bộ tab qua storage event. Storage bị chặn vẫn đổi được trong trang.
- Theme đổi bằng CSS và external store nhỏ, không thay key/remount auth/session/editor/Run/Submit; không lưu token hoặc password.
- Không animate theme, thao tác bàn phím hoặc kết quả chạy bài.

## Auth — mode Operate

- Bố cục desktop 60/40 theo ảnh HackerRank người dùng cung cấp; bên trái luôn dùng Mocha, không hiện logo theo yêu cầu cập nhật, welcome/community gần phía dưới. Form rộng tối đa 448px.
- Welcome to / Codjingrank Community; form Welcome back / Log in to Codjingrank hoặc Join us / Create a Codjingrank account. Display copy yêu cầu bằng tiếng Anh có lang=en; nhãn/hướng dẫn/lỗi tiếp tục tiếng Việt.
- Nhãn được ẩn thị giác nhưng liên kết input; placeholder không thay thế accessible label. Giữ email, username, fullName tùy chọn, password và validation contract. Không thêm OAuth/điều khoản/forgot-password giả.
- Pin Pinterest thực tế là Time machine clock painting: video đồng hồ 8 giây, không phải trái đất hay terminal code. Nguồn nằm trong public/media/SOURCES.md; app phục vụ file local, không nhúng Pinterest.
- Video H.264 24fps, bỏ audio, faststart, muted/loop/playsInline; chỉ gắn src khi desktop, motion cho phép và tab hiện. Không render lại video mỗi lần nhập form; pause/resume không reset currentTime.
- Mobile và reduced-motion dùng poster không tải MP4 ban đầu. Video lỗi có poster; autoplay bị chặn thử lại khi tương tác với trang. Không hiển thị nút phát/tạm dừng theo yêu cầu cập nhật; video tự chạy lặp khi tab hiện, giữ reduced-motion và poster mobile. Tab ẩn dừng; quay lại tự tiếp tục.
- Header và copy có overlay tối để đảm bảo tương phản trên media. Không thêm chuyển động chức năng khác.

## Workspace — mode Operate

- Tham chiếu chính: ảnh LeetCode dark người dùng gửi. Thanh trên 48px, đề/code mặc định 50/50; editor/kết quả 65/35 với tab và panel gọn.
- Separator hai trục có pointer capture, Arrow/Home/End và accessible value. Không animate kéo hay phím; mobile chuyển một cột, giữ resize chiều cao editor.
- Syntax có palette Light/Dark riêng, line numbers, caret, selection, current-line marker; giữ fallback mã dài, font metric, draft/reset/language.
- Run/Submit giữ portal/controller hiện có, kết quả không mất khi đổi tab/theme. Chỉ có Đề bài, Kết quả chạy và Bài nộp; không thêm Editorial/Premium/AI/like giả.
- Không đổi executionMode, stdin/stdout, UUID payload hoặc controller API/session của Sprint 3.

## Nguồn tham chiếu và giới hạn

- HackerRank /auth/signup trả 403 Access Denied khi truy cập bằng Chrome kiểm tra; bố cục dựa trên ảnh đính kèm.
- Pinterest pin truy cập 200 và có MP4 thực tế; nguồn được giữ cùng asset, không khẳng định quyền sở hữu hay giấy phép mới.
- Backend live và thiết bị vật lý cần nghiệm thu riêng; browser mock không chứng minh cookie rotation, JWT hoặc ownership.

## Workspace — công cụ luyện tập cập nhật 18/11/2026

- Stopwatch/Timer và cài đặt cỡ chữ ở thanh trên; popover native theo ảnh tham chiếu LeetCode, dùng semantic surface/accent của Codjingrank. Stopwatch tiếp tục khi đóng bảng; Timer báo hết giờ trong trang. Rời workspace đặt lại đồng hồ.
- Toolbar có copy, reset starter, phóng to editor và thu gọn kết quả. Panel giữ mounted để bảo toàn code, draft, language, Run/Submit. Bắt đầu Run/Submit sẽ mở lại kết quả.
- Console có Test mẫu, Kết quả chạy và Bài nộp; Test mẫu lấy từ public samples của DTO, không giả lập custom test hoặc hidden test.
- Cỡ chữ 12–16px, giữ line height 20px đồng bộ textarea/highlight/gutter. Không thêm formatter, OAuth/Premium/Editorial hoặc API chưa hỗ trợ.
- Pointer có phản hồi nhấn và mở popup nhẹ; phím, theme, thao tác code và kết quả không animate. Reduced-motion giữ bố cục tĩnh.

## Landing page công khai — 19/11/2026

Route `/` giới thiệu sản phẩm công khai, không chuyển thẳng sang `/protected`. Người đăng nhập vẫn xem được trang chủ. Header/hero dùng CTA dẫn đến đăng ký khi chưa đăng nhập, hoặc kho bài khi đã có phiên. Auth và các route ứng dụng giữ nguyên hành vi.

Palette riêng cho landing: nền trắng/trắng ngà, chữ #172c2b, xanh ngọc #087f78, nền xanh nhạt #c7e9db và điểm vàng cát; Manrope self-host, giữ hình dáng logo Codjingrank với biểu tượng xanh ngọc trên landing. Toàn bộ style nằm trong CSS module của landing, không sửa app/theme.css, không ghi đè lựa chọn theme lưu trong trình duyệt.

Ảnh thực tế workspace/AI review/forum có nhãn dữ liệu demo, nguồn public/landing/SOURCES.md. Tab tính năng bên trái đổi ảnh sản phẩm trên nền phong cảnh bên phải. Tab dùng ArrowUp/Down/Home/End, menu mobile có aria-expanded, Escape trả focus về nút menu. Không auto-cycle nội dung. Hero xuất hiện theo nhịp; các section vào nhẹ khi cuộn, reduced-motion bỏ chuyển động, nội dung vẫn hiển thị khi không có JS.

Nguồn tham chiếu: https://www.hackerrank.com/ và ảnh người dùng gửi. Không dùng logo khách hàng/số liệu hoặc định vị tuyển dụng của HackerRank. Bản landing chỉ mô tả tính năng FE hiện có, không thay thế nghiệm thu backend live.

## Landing — tinh chỉnh nút và typography theo ảnh HackerRank

Ngày 19/11/2026: CTA pill tối, secondary viền mảnh, hover đổi xanh rừng và mũi tên dịch nhẹ, nav/footer underline. Manrope regular cho dòng đầu hero, nhấn xanh ở dòng sau; nhãn và mô tả tăng độ đọc. Nền mint của hero chuyển nhẹ theo chuột bằng transform/rAF, không setState theo từng frame; tắt tracking với reduced-motion/cảm ứng và dọn listeners khi unmount. Không sửa theme hoặc form auth của ứng dụng.

## Tinh chỉnh thao tác — 20/11/2026

Theo yêu cầu mới, nhãn email/password hiển thị rõ và có icon mắt, liên kết Quên mật khẩu. Hai route khôi phục được chuẩn bị, mặc định thông báo chưa sẵn sàng do contract backend chưa triển khai; không mô phỏng email thành công. Lịch bỏ badge tháng cũ, dùng icon lịch, giữ UTC và dữ liệu thật, phân biệt ngày bằng ring/đĩa/dot cùng nhãn. IconButton/CopyButton và refinements.css thống nhất control; tìm kiếm nằm sát input, phân trang icon. Kết quả nộp có metrics và CTA AI ngay cạnh Accepted, metadata phụ có copy; breadcrumb AI rõ và giữ draft khi quay lại. Motion phản hồi ngắn, chỉ animate đổi tháng với chuột; không animate code/kết quả. Theme và logo giữ nguyên. Chi tiết file/giới hạn: docs/UI_UX_REFINEMENT_2026_11_20.md.

## Landing — bố cục hero theo ảnh mới, 20/11/2026

Theo yêu cầu mới, header full-width trong nền hero, title Manrope dòng đầu và Noto Serif dòng sau, nội dung/CTA căn giữa, khoảng trắng rộng, góc khung teal và hai nút pill. Giữ logo và copy Codjingrank; không sao chép nội dung tuyển dụng hay social proof HackerRank. Workspace preview chuyển sang section bên dưới để hero riêng một màn hình. Noto Serif subset Việt/Latin tự host và có OFL. Theme sau đăng nhập không đổi. Chi tiết nghiệm thu: docs/LANDING_PAGE_REVIEW.md.

## Landing — motion theo video thao tác, 20/11/2026

Header fixed đổi nền khi cuộn; các tab tính năng crossfade 240ms không remount, inactive inert/aria-hidden; keyboard đổi tức thì. Section text/visual có nhịp 80ms, anchor chuột cuộn mượt; reduced-motion giữ tĩnh. Section cuối dùng phong cảnh đã có nguồn và panel CTA sáng. Nội dung, logo và theme ứng dụng giữ nguyên. Video nguồn thaotac.mp4; Chrome HackerRank bị Access Denied, dùng video làm chuẩn tương tác. Chi tiết kiểm tra trong docs/LANDING_PAGE_REVIEW.md.

Header landing sau phản hồi mới: cố định nhưng trong suốt ở mọi vị trí cuộn, không tự phủ nền trắng hoặc shadow. Menu mobile khi mở vẫn có bề mặt riêng để đọc rõ.

Header landing — quy tắc hiện hành sau ảnh chồng chữ: trong suốt tại đầu trang, khi cuộn quá 24px dùng nền #f9fcfa opaque và separator mảnh để chữ nội dung không lẫn menu; vẫn fixed. Chuyển 180ms, tắt với reduced-motion.

## Hero wave refinement — 21/11/2026

Hero giữ nguyên typography/CTA và dùng mesh WebGL tự viết, sắc ivory–mint–teal, ánh sáng theo pháp tuyến bề mặt. Pointer chỉ tác động vùng lân cận, không nghiêng nội dung. Chuyển động giới hạn khoảng 30fps, DPR tối đa 1.5, dừng ngoài viewport/tab ẩn; có pause, reduced-motion và fallback SVG. CTA cuối trang dùng ảnh biển thực, panel sáng lệch trái, chữ serif nhấn thương hiệu. Không thay các section trung gian hoặc giao diện sau đăng nhập.

## Lộ trình trượt ngang — 21/11/2026

Theo video tham chiếu dải logo trượt ngang: bỏ preview workspace riêng, đưa lộ trình ngay sau hero. Dải 4 bước nối tiếp lặp 42s, hover/focus dừng để đọc/thao tác; bản sao aria-hidden và không nằm trong tab order. Reduced-motion hiện 4 bước tĩnh theo grid responsive. Hero tự chạy, không còn nút pause theo yêu cầu. Observer reset khi section ra ngoài vùng nhìn, cho phép phát lại entrance khi cuộn tới; không scroll-jacking.

## Thẻ lộ trình và CTA liền ảnh — 21/11/2026

Thẻ lộ trình là liên kết toàn thẻ, nền trắng/teal nhạt, góc 16px; hover nâng 12px và giảm opacity thẻ khác còn .45, rời chuột khôi phục. Dải vẫn lặp 42s và dừng khi hover. Focus bàn phím có nền/outline rõ và làm dịu thẻ xung quanh, không nâng động; reduced-motion bỏ chuyển động. CTA cuối trang là một panel mờ chung hai nhóm luyện tập/cộng đồng, không đường chia, nền ảnh biển hòa trắng ở mép trên, Noto Serif 400 cho tiêu đề.

## Chốt marquee theo video Trusted by — 21/11/2026

Dải chỉ gồm 4 nội dung lộ trình lặp vô hạn sang trái, tốc độ tuyến tính 48s/vòng (khoảng 26px/s desktop), khung tối đa 1200px để không hở cuối vòng. Hai mép có mask mờ. Mặc định chạy khi hiển thị, chuột trên khoảng trống không dừng; chỉ trỏ vào thẻ hoặc focus mới dừng để chọn. Giữ lift/dim từ yêu cầu trước và reduced-motion.

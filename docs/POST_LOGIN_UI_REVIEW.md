# Giao diện sau đăng nhập — 19/11/2026

## Cải thiện khả năng sử dụng toàn ứng dụng và lịch

Theo yêu cầu mới: sửa lỗi chữ nút bị .platform a ghi đè bằng màu chữ/nền semantic cho primary, secondary và trạng thái hover. Áp dụng nhất quán các màn Tổng quan, Kho bài, Gói/cấp độ, Forum/form, Ranking, Profile, Pro; workspace/AI review có phản hồi pointer dùng token chung. Tăng vùng bấm, nhãn, khoảng cách và độ đọc form, bỏ bóng thẻ gói/cấp độ dư thừa; giữ controller và quyền mở bài.

PracticeCalendar riêng thay lịch cũ: đồng hồ UTC, huy hiệu tháng, chọn ngày, lùi/tiến tháng, về hôm nay, chấm hoạt động từ getMyStats và trạng thái lỗi/tải lại. Không thêm dấu hoạt động hoặc weekly premium giả. Timer chỉ render lại component lịch, không render editor. Favicon app/icon.svg dùng alpha logo gốc với màu #087f78; bỏ icon.png nâu cũ để mọi route dùng cùng icon tab mới. Apple touch icon hiện có giữ nguyên.

Motion: hover/press 140–160ms; popover xuất hiện nhẹ chỉ khi mở bằng pointer, thao tác phím giữ tức thời; reduced-motion tắt chuyển động. Không animate nội dung code, dữ liệu hoặc resize panel.

Build production PASS sau khi xóa hai file route-type dev sinh lỗi trong cache .next/dev/types. Lint PASS, 288/288 tests PASS; Impeccable detector các file UI mới/sửa trả danh sách rỗng. Không coi đây là nghiệm thu backend live hoặc mọi trình duyệt. Nguồn favicon SVG chỉ nhúng mask gốc, không tải asset bên ngoài.

## Cập nhật theo yêu cầu mới: gỡ Cuộc thi và thống nhất logo

Đã xóa route /contests và ContestPage, link điều hướng/sidebar, tab Sự kiện liên quan cuộc thi, thẻ dashboard/kho bài và CSS dành riêng cho cuộc thi. Hai vị trí giới thiệu thay bằng lối vào cộng đồng đang có. Pro và thông báo cộng đồng/cập nhật giữ nguyên. Các mô tả cuộc thi ở phần dưới là lịch sử triển khai trước yêu cầu gỡ, không còn là phạm vi hiện tại.

Logo dùng chung BrandLogo với alpha mask gốc và token --brand-mark #087f78 trên landing, app header, workspace và dấu logo trong cúp Ranking. Chữ tiếp tục dùng currentColor theo nền; hình dáng, font logo và theme ứng dụng giữ nguyên. Không còn tone jade riêng cho landing. Asset PNG gốc chỉ làm alpha mask để giữ chính xác đường nét.

Build sau khi gỡ trang PASS; 5 tests landing/platform PASS, bao gồm full/compact logo dùng cùng markup mark. Không commit/push/merge.

Theo yêu cầu của Thịnh và bảy ảnh LeetCode: áp dụng cấu trúc điều hướng, menu tài khoản, kho bài dạng bảng, cộng đồng hai cột, lịch và thẻ cuộc thi. Tham chiếu đã truy cập: https://leetcode.com/, https://leetcode.com/problemset/, https://leetcode.com/discuss/. Giữ thương hiệu Codjingrank và semantic tokens Catppuccin Latte/Mocha; không đổi app/theme.css hoặc landing.

## Phạm vi

- AppChrome dùng chung cho Tổng quan, Kho bài, Lộ trình, Cuộc thi, Cộng đồng, Ranking, Hồ sơ và Pro. Không bọc landing/auth/workspace; không nhân đôi toolbar editor.
- Thanh trên có tìm kiếm bài qua query URL, native popover tài khoản, theme Hệ thống/Sáng/Tối, thông báo demo và chuỗi luyện tập từ API.
- Kho bài có sidebar, thẻ lộ trình, topic chips từ metadata và bảng trạng thái/tên/Accepted/độ khó. Giữ query, pagination, filter, trạng thái khóa và controller cũ. Bài khóa không có link đến workspace.
- Tổng quan thay màn kiểm tra tài khoản bằng lộ trình và thảo luận từ API, lịch tháng và bài thử thách. Lịch chỉ đánh dấu hôm nay, không bịa lịch sử hoạt động.
- Hồ sơ /profile lưu fullName và bio qua PATCH users/me, giữ email và username chỉ đọc.
- Cuộc thi /contests: hai fixture có khối 3D CSS, thao tác tham gia/hủy và lọc danh sách đã tham gia trong trạng thái màn hình; chưa có lịch thi, chấm điểm hoặc giải thưởng.
- Pro /store: giá/quyền lợi minh họa, native dialog xác nhận demo; không gọi thanh toán hoặc thay đổi quyền tài khoản.
- Thịnh đã chọn bổ sung cả màn demo trong câu trả lời ở chat. Thông báo, cuộc thi và Pro có nhãn demo, không giả là dữ liệu backend thật.

## Kiểm tra

- Production build bao gồm TypeScript: PASS.
- ESLint: PASS. Impeccable detector các file UI đã đổi: danh sách rỗng.
- Vitest: 287/287, 24 file. Thêm kiểm tra bảng không mở link bài khóa và các màn demo không chứa form thanh toán.
- Chrome 1440x900: đăng nhập, menu tài khoản, theme, chuỗi luyện tập, tab thông báo, bảng bài, lọc topic, tìm kiếm header, tham gia/lọc contest demo, dialog Pro và Escape, lưu profile cùng giá trị cũ, workspace giữ toolbar riêng: PASS.
- Chrome 390x844 với reduced-motion: sáu route /protected, /problems, /forum, /contests, /store, /profile không tràn ngang; menu mobile hoạt động. Không ghi nhận runtime exception.
- Báo cáo và ảnh: .taste-skill/platform-review/, probe-platform.mjs (gitignored). Không coi detector hoặc browser probe là full design audit hay nghiệm thu backend live.

## Giới hạn

Kiểm thử dùng mock tại localhost:4010, frontend localhost:3000. Mock đang stateless cho refresh, vì vậy probe đi theo Next client navigation để giữ access token trong memory. Không thay đổi auth contract để che điều này; không chứng minh cookie refresh của backend live. Các cảnh báo của audit landing trước không thuộc phạm vi được giải quyết ở lượt này. Chưa kiểm Safari/Firefox hoặc thiết bị vật lý. Chưa commit/push/merge; giữ các thay đổi landing và file cá nhân hiện có.

Kiểm tra gỡ Cuộc thi/logo: /contests trả HTTP 404; 17 kiểm tra Chrome PASS, gồm không còn liên kết Cuộc thi và màu mark landing/app/workspace bằng nhau; 5 route mobile không tràn ngang, không runtime exception. Lint và Impeccable detector PASS. Report hiện tại: .taste-skill/platform-review/report.json; script: .taste-skill/probe-brand-cleanup.mjs.

Theme switch: phát hiện transition màu khiến nút trải qua trạng thái thiếu tương phản khi chuyển Dark sang Light. applyTheme dùng cờ data-theme-changing trong hai animation frame để đổi màu tức thời, chặn transition/animation trong thời gian chuyển; không remount session/editor. Sau sửa: production build PASS và 11 test theme/platform/landing PASS. Không thay đổi giá trị palette.

Nghiệm thu production sau sửa theme: 22 kiểm tra Chrome PASS, bao gồm tương phản nút >=4,5:1 ở cả hai theme, chọn ngày/đổi tháng, favicon SVG, menu/theme/logout và luồng kho bài/profile/Pro. Tám route mobile không tràn ngang; không runtime exception. Đã xem ảnh gói bài sáng/tối, lịch và các màn mở rộng. Report: .taste-skill/platform-review/report.json. Preview hiện chạy npm start tại cổng 3000, mock tại 4010. Chưa commit/push/merge.

## Sửa hover và thanh tìm kiếm

Nguyên nhân hover nhạt/mất chữ: button:hover:not(:disabled) có specificity cao hơn lớp avatar/chip/tab, áp background mặc định lên control có màu chữ riêng. Đổi thành button:where(:hover:not(:disabled)) để fallback chỉ tác động nút mặc định; thêm trạng thái hover rõ ràng cho avatar, topic chips, tab thông báo. Search click toàn vùng focus input, một outline focus-within trên form, bỏ outline chồng bên trong, tăng vùng bấm submit và chiều rộng nhập. Không thay API/query/auth. Lint và 9 tests platform/theme PASS. Detector có một cảnh báo Arial đã tồn tại ở root styles, không đổi font ngoài phạm vi sửa hover.

Kết quả hover cuối: 24 kiểm tra production Chrome PASS; tương phản avatar hover >=4,5:1, tab thông báo >=4,95:1, topic chips >=6,36:1. Kiểm tra mouseMoved thật; search wrapper focus đúng input và không có outline lồng. Tám route mobile không tràn ngang, không runtime exception. Parser kiểm tra hỗ trợ cả rgb và color(srgb) để tránh kết luận sai. Script .taste-skill/probe-hover.mjs, report .taste-skill/platform-review/report.json. Production vẫn mở cổng 3000, chưa commit/push/merge.

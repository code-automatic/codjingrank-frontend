# Đề xuất UI để team review

Trạng thái: prototype cục bộ, chưa phải thiết kế chính thức được team duyệt. Không tạo/chỉnh file Figma trong task này.

## Hướng thiết kế

Tham khảo mô hình luyện tập quen thuộc của HackerRank/LeetCode: biểu mẫu rõ ràng, đề bài cạnh editor, trạng thái kết quả có nhãn. Bố cục và thương hiệu trong prototype là đề xuất riêng cho Codjingrank.

- Hai surface thuộc chế độ Operate: ưu tiên hoàn thành tác vụ, khả năng đọc và điều hướng bàn phím.
- Accent xanh #087f5b; nền trắng và xám xanh nhạt; editor nền tối, giữ nguyên metric font của syntax overlay.
- Font UI hệ thống Segoe UI/Arial; code giữ font monospace hiện có, không tải font ngoài.
- Login desktop chia phần giới thiệu và form; mobile ưu tiên form. Có nút hiện/ẩn mật khẩu.
- Workspace desktop: đề bên trái, editor/Run/Submit/tiến độ/lịch sử bên phải. Dưới 820px xếp một cột.
- Giữ label, thông báo trạng thái/lỗi, focus ring, native select và Esc rồi Tab để rời editor.
- Không thêm animation trang; hover đổi màu ngắn, hỗ trợ reduced-motion.
- CSS chỉ áp dụng trong .login-prototype và .workspace-prototype. Không đổi giao diện register/catalog/account.

## Ràng buộc chức năng

Giữ session, API contract, validation, draft theo user/bài/ngôn ngữ, Run/Submit độc lập, cooldown, polling, lịch sử và tiến độ. Không tạo dữ liệu hay trạng thái backend giả để trang trông hoàn thiện hơn.

## Sau khi team duyệt

Chốt màu, tên thương hiệu và phân cấp chữ rồi mới mở rộng hệ thống component sang các trang khác theo yêu cầu. Không tự áp dụng prototype này lên toàn bộ sản phẩm.

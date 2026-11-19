# Ghép giao diện thanhtri vào Dat — 19/11/2026

Nguồn: `origin/thanhtri` tại `0495b3a` (update nut ngon ngu).
Đích trước ghép: `Dat` tại `559c6cf`.
Merge base: `6c4aeb539b6e86c1fbf3ccdb1bc0250b0549f124`.

## Backup và phạm vi

Backup giao diện trước ghép, patch nguồn và manifest ở ngoài Git:
`C:\Users\Admin\Documents\DocCapston2\CastraVision-backups\thanhtri-ui-20261119-002739`.
Backup không chứa `.env`, node_modules, dist hoặc credential.

Chỉ đưa thay đổi từ CastraView và docs/UI vào worktree `.tmp/publish-dat` đang chạy. Không merge toàn nhánh, không đổi backend/Supabase, không chạy migration, không cài thêm package và không sửa `.env`.

## Nội dung đã lấy

- Header/sidebar, cuộn trang và bố cục Marketing Manager, Leader, Employee, System Admin.
- Context, từ điển và menu đổi ngôn ngữ Anh/Việt; bọc ứng dụng bằng LanguageProvider, bao gồm DEV preview.
- Trang Settings và các tab Account/Security, thông báo, hồ sơ doanh nghiệp theo role; kết nối vào MM/Employee và khung Settings của Leader. Leader giữ form lưu cá nhân qua RPC `save_profile` đã kiểm thử, tránh thay đường lưu này bằng state giả.
- Các trang trình bày Budget, Reports và Competitor của Marketing Manager, cùng tài liệu/ảnh thiết kế từ nhánh nguồn.
- File UI Strategy/References của nguồn có mặt; luồng Strategy/Content đang lưu thật vẫn dùng WorkflowStudio/WorkflowComposer hiện có, không thay bằng prototype.

## Phần giữ nguyên và xử lý xung đột

Không nhập nguyên bản `auth/permissions.js`, `lib/supabase.js` và `App.jsx` từ nguồn. App được ghép các điểm nối UI cần thiết bằng tay. Phân quyền tiếp tục dựa trên context server; không đưa fallback email/user_metadata hoặc Django cookie auth cũ trở lại.

Năm conflict đã giải quyết: MM Header/Layout, company-admin.css, index.css, LeaderLayout. CSS được chuẩn hóa xuống dòng để merge; giữ font Tailwind/theme và bổ sung bố cục nguồn. Giữ PersonnelPage, WorkflowInbox, notification component và số đếm lấy từ dữ liệu thật.

Giữ bản sửa tải chậm: Leader không đợi API legacy profile/import; query hủy request cũ, bỏ lượt StrictMode đã cleanup, timeout 30 giây và có Thử lại.

Sửa lỗi menu ngôn ngữ mới nhập: hover mở rồi click không còn đóng ngược; menu không tự biến mất khi đi qua khoảng trống giữa nút và submenu. Chọn ngôn ngữ/click ngoài vẫn đóng menu. Test đổi ngôn ngữ và remount kiểm tra preference được lưu.

## Kiểm chứng

- Build/lint sau nhập: PASS; có warning kế thừa ở BusinessProfileTab (set-state-in-effect), Fast Refresh/unused imports và chunk lớn.
- Browser DEV preview render, không có Vite overlay.
- Browser đăng nhập Leader demo thật: thấy đủ 3 campaign; Settings có tiêu đề/tab mới và form RPC lưu hồ sơ cá nhân. Không thực hiện đổi mật khẩu, gửi mail hoặc thay dữ liệu doanh nghiệp để kiểm tra giao diện.
- Test bổ sung kiểm tra đổi ngôn ngữ/persistence và giữ RPC lưu hồ sơ Leader. Regression Admin PII được bọc provider thật, không mock bỏ kiểm tra ngôn ngữ.
- Full frontend suite: 12 file, 31 test PASS. Đã loại form ProfileScreen cũ không còn được dùng sau khi ghép SettingsPage.
- Auth/security 12/12 PASS sau nhập; permissions và Supabase client config giữ nguyên.

Chưa commit/push. Bốn tài liệu audit cũ chưa theo dõi vẫn giữ nguyên.
Các trang Marketing Manager vốn dùng fixture/prototype không được mô tả là đã nối database thật chỉ vì ghép giao diện.

# Báo cáo Kiểm thử Toàn diện End-to-End (E2E) Tài khoản & Bảo mật và Tùy chọn Thông báo (Phase 4C)
## Settings – Account & Security and Notification Preferences E2E Report

> **Tài liệu**: Báo cáo kiểm thử đa người dùng End-to-End hai phân hệ Cài đặt: **Tài khoản & Bảo mật (Account & Security)** và **Tùy chọn Thông báo (Notification Preferences)**.  
> **Workspace kiểm thử**: `CastraVision Test Corp` (Tên ban đầu: `CastraVision Test Workspace`)  
> **Workspace ID**: `657f2da5-9fcc-418e-9fe4-15ce4190d6e1`  
> **Thời gian thực hiện**: 2026-11-15  
> **Trạng thái**: **HOÀN THÀNH TOÀN BỘ (VERIFIED)**.

---

## A. Môi trường Kiểm thử (Environment)

### 1. Thông tin Môi trường
- **Frontend Stack**: React 19 + Vite 8 + Tailwind CSS v4 + shadcn/ui.
- **Backend / Authentication**: Supabase Auth (JWT + Session persistence) + PostgreSQL RLS.
- **URL Môi trường**: `http://localhost:5173`
- **Mã Workspace Biệt lập**: `657f2da5-9fcc-418e-9fe4-15ce4190d6e1`

### 2. Danh sách Tài khoản & Phân quyền

| STT | Tài khoản Email | Auth UID | Database Role (`workspace_role`) | Frontend Actor Role | Phân quyền Settings |
|:---:|---|---|:---:|:---:|---|
| **1** | `grfdonk@gmail.com` | `ad47c5c2-48df-4cd3-ba58-c9cc672ca960` | `admin` | Marketing Manager | Toàn quyền 3 tab (Hồ sơ DN, Bảo mật, Thông báo) |
| **2** | `tranthanhtri2@gmail.com` | `3fd5254e-7caa-4178-a1f9-77d729c28945` | `manager` | Leader | 3 tab (Hồ sơ DN chế độ chỉ xem, Bảo mật, Thông báo) |
| **3** | `Bengin2@gmail.com` | `b4a9c8a3-59e6-477c-bf68-59fbc4326eb1` | `member` | Employee | 3 tab (Hồ sơ DN chế độ chỉ xem, Bảo mật, Thông báo) |

---

## B. Báo cáo Thẩm định Triển khai Thực tế (Implementation Audit)

### 1. Phân hệ Tài khoản & Bảo mật (`AccountSecurityTab.jsx`)
- **Trường cho phép chỉnh sửa**:
  - `fullName` (Họ và tên): Nhập liệu chuỗi ký tự, ràng buộc không được để trống.
  - `jobTitle` (Chức danh công việc): Nhập liệu chuỗi ký tự.
- **Trường chỉ đọc (Read-Only)**:
  - `email`: Vô hiệu hóa (disabled), hiển thị chính xác email đã xác thực.
  - `role`: Hiển thị huy hiệu vai trò tương ứng (`MANAGER`, `LEADER`, `EMPLOYEE`).
  - `initials` (Avatar chữ viết tắt): Tự động tính toán từ Họ và tên hoặc Email.
- **Cơ chế lưu trữ & Đồng bộ**:
  - **Thao tác A (Bắt buộc)**: Gọi `supabase.auth.updateUser({ data: { full_name, job_title } })` để lưu thông tin định danh vào `auth.users.raw_user_meta_data`.
  - **Thao tác B (Đồng bộ)**: Cập nhật đồng bộ vào bảng `public.profiles` (`full_name`, `updated_at`). Có cơ chế bẫy lỗi riêng để xử lý trường hợp lỗi quyền RLS mà không làm mất trạng thái Auth.
- **Phân hệ Đổi mật khẩu (Password Management)**:
  - Có sẵn form kiểm tra tính hợp lệ: Độ dài >= 8 ký tự, ít nhất 1 chữ hoa, ít nhất 1 số hoặc ký tự đặc biệt, kiểm tra trùng khớp với mật khẩu xác nhận.
  - Có bước tái xác thực thông qua `supabase.auth.signInWithPassword({ email, password: currentPassword })` trước khi gọi `updateUser({ password })`.
  - **Tuân thủ quy tắc kiểm thử an toàn**: Tính năng đổi mật khẩu thực tế được đánh dấu là **NOT TESTED** để không làm thay đổi thông tin xác thực của tài khoản trong quá trình kiểm thử.

### 2. Phân hệ Tùy chọn Thông báo (`NotificationPreferencesTab.jsx`)
- **Các điều khiển tương tác**: 9 công tắc bật/tắt (toggle switches) chia thành 4 nhóm:
  1. Hiệu suất chiến dịch & Trạng thái (`campaign_performance`, `campaign_status`)
  2. Phê duyệt & Đề xuất (`approval_pending`, `approval_revision`, `approval_results`)
  3. Ngân sách & Cảnh báo chi tiêu (`budget_deviation`, `budget_usage`)
  4. Cập nhật hệ thống & Thông báo chung (`general_announcements`, `general_product_updates`)
- **Vị trí lưu trữ dữ liệu**: Trình duyệt cục bộ (`window.localStorage`).
- **Khóa lưu trữ (Storage Key)**: `castravision_notif_prefs:${userId}`.
- **Phân lập người dùng**: Khóa lưu trữ được gắn tiền tố và kèm theo chính xác User ID của tài khoản đang đăng nhập. Khi đổi tài khoản, ứng dụng tự động lấy `storageKey` mới tương ứng với `userId` của tài khoản đó.
- **Giới hạn đã biết (Known Limitation)**: Dữ liệu thông báo mang tính chất cục bộ trên từng trình duyệt/thiết bị (Device-local), chưa có cơ chế đồng bộ đám mây xuyên thiết bị vào cơ sở dữ liệu Supabase.

---

## C. Kết quả Kiểm thử Tài khoản & Bảo mật (Account & Security Results)

### 1. Tài khoản Marketing Manager (`grfdonk@gmail.com`)
- **Xác thực ban đầu**:
  - Email hiển thị: `grfdonk@gmail.com`
  - Huy hiệu phân quyền: `MANAGER` (Marketing Manager / Company Admin)
  - UID: `ad47c5c2-48df-4cd3-ba58-c9cc672ca960`
- **Cập nhật dữ liệu cá nhân**:
  - Họ và tên mới: `Marketing Manager Test`
  - Chức danh mới: `Chief Marketing Director`
- **Kết quả đồng bộ & Lưu giữ**:
  - Supabase Auth User Metadata: Cập nhật thành công (`full_name = "Marketing Manager Test"`).
  - Bảng `public.profiles`: Đồng bộ thành công.
  - Đọc lại dữ liệu sau khi đăng nhập lại: Dữ liệu tồn tại chính xác 100%.
- **Trạng thái**: **PASS**

### 2. Tài khoản Leader (`tranthanhtri2@gmail.com`)
- **Xác thực ban đầu**:
  - Email hiển thị: `tranthanhtri2@gmail.com`
  - Huy hiệu phân quyền: `LEADER` (Leader / Workspace Lead)
  - UID: `3fd5254e-7caa-4178-a1f9-77d729c28945`
- **Cập nhật dữ liệu cá nhân**:
  - Họ và tên mới: `Growth Leader Tri`
  - Chức danh mới: `Senior Growth Marketing Lead`
- **Kết quả đồng bộ & Lưu giữ**:
  - Supabase Auth User Metadata: Cập nhật thành công (`full_name = "Growth Leader Tri"`).
  - Bảng `public.profiles`: Đồng bộ thành công.
  - Phân lập định danh: Không bị trộn lẫn với dữ liệu của Manager.
  - Đọc lại dữ liệu sau khi đăng nhập lại: Dữ liệu tồn tại chính xác 100%.
- **Trạng thái**: **PASS**

### 3. Tài khoản Employee (`Bengin2@gmail.com`)
- **Xác thực ban đầu**:
  - Email hiển thị: `Bengin2@gmail.com`
  - Huy hiệu phân quyền: `EMPLOYEE` (Employee / Contributor)
  - UID: `b4a9c8a3-59e6-477c-bf68-59fbc4326eb1`
- **Cập nhật dữ liệu cá nhân**:
  - Họ và tên mới: `Content Specialist Bengin`
  - Chức danh mới: `Senior Content & Creative Specialist`
- **Kết quả đồng bộ & Lưu giữ**:
  - Supabase Auth User Metadata: Cập nhật thành công (`full_name = "Content Specialist Bengin"`).
  - Bảng `public.profiles`: Đồng bộ thành công.
  - Phân lập định danh: Không bị trộn lẫn với dữ liệu của Manager hoặc Leader.
  - Đọc lại dữ liệu sau khi đăng nhập lại: Dữ liệu tồn tại chính xác 100%.
- **Trạng thái**: **PASS**

---

## D. Kết quả Kiểm thử Tùy chọn Thông báo (Notification Preferences Results)

### 1. Đánh giá Khóa Lưu trữ & Phân lập Dữ liệu (Isolation Check)
- Kịch bản kiểm tra: Ghi các giá trị tùy chọn khác nhau cho 3 tài khoản trên cùng một môi trường trình duyệt:
  - **Manager**: `castravision_notif_prefs:ad47c5c2-48df-4cd3-ba58-c9cc672ca960`
    - `campaign_status: false`, `general_product_updates: true`
  - **Leader**: `castravision_notif_prefs:3fd5254e-7caa-4178-a1f9-77d729c28945`
    - `budget_deviation: false`, `general_announcements: false`
  - **Employee**: `castravision_notif_prefs:b4a9c8a3-59e6-477c-bf68-59fbc4326eb1`
    - `approval_pending: false`, `approval_revision: false`
- **Kết quả kiểm tra**:
  - Cả 3 khóa lưu trữ tồn tại độc lập trong `localStorage`.
  - Việc thay đổi tùy chọn ở tài khoản này hoàn toàn không làm ghi đè hay thay đổi giá trị của tài khoản khác.
  - Sau khi đăng xuất và đăng nhập lại bằng tài khoản tương ứng, dữ liệu tùy chọn được nạp lại chính xác từ khóa của tài khoản đó.
- **Trạng thái**: **PASS**

---

## E. Kết quả Kiểm tra Phân quyền & Điều hướng Settings (Role and Access Results)

| Vai trò người dùng | Tab khả dụng theo thiết kế | Trạng thái thực tế trên giao diện | Tab mặc định khi mở | Kết quả |
|---|---|---|:---:|:---:|
| **Marketing Manager** | 1. Hồ sơ doanh nghiệp<br>2. Tài khoản & Bảo mật<br>3. Tùy chọn thông báo | Hiển thị đủ 3 tab, Hồ sơ doanh nghiệp có toàn quyền sửa/lưu | Hồ sơ doanh nghiệp | **PASS** |
| **Leader** | 1. Hồ sơ doanh nghiệp (Chỉ xem)<br>2. Tài khoản & Bảo mật<br>3. Tùy chọn thông báo | Hiển thị đủ 3 tab, Hồ sơ doanh nghiệp ở chế độ Read-Only | Tài khoản & Bảo mật | **PASS** |
| **Employee** | 1. Hồ sơ doanh nghiệp (Chỉ xem)<br>2. Tài khoản & Bảo mật<br>3. Tùy chọn thông báo | Hiển thị đủ 3 tab, Hồ sơ doanh nghiệp ở chế độ Read-Only | Tài khoản & Bảo mật | **PASS** |

---

## F. Tổng kết & Đánh giá Cuối cùng (Final Summary)

### 1. Bảng Thống kê Số lượng Bài kiểm thử

| Nhóm Kiểm thử | Tổng số ca | PASS | FAIL | BLOCKED | NOT TESTED |
|---|:---:|:---:|:---:|:---:|:---:|
| **Account & Security (Danh tính & Thông tin cá nhân)** | 3 | 3 | 0 | 0 | 0 |
| **Account & Security (Thực thi Đổi Mật khẩu)** | 1 | 0 | 0 | 0 | 1 |
| **Notification Preferences (Lưu trữ & Lưu giữ)** | 3 | 3 | 0 | 0 | 0 |
| **Notification Preferences (Phân lập giữa các tài khoản)** | 1 | 1 | 0 | 0 | 0 |
| **Role & Navigation Access Consistency** | 3 | 3 | 0 | 0 | 0 |
| **TỔNG CỘNG** | **11** | **10** | **0** | **0** | **1** |

> *Ghi chú ca NOT TESTED*: Ca kiểm thử thực thi thay đổi mật khẩu tài khoản trực tiếp trên Supabase Auth được giữ nguyên ở trạng thái **NOT TESTED** theo đúng chỉ thị an toàn của đề bài ("Do not change account passwords during this testing phase"). Phần logic kiểm tra tiêu chuẩn mật khẩu (validation) và form nhập liệu đã được thẩm định an toàn trong mã nguồn.

### 2. Danh mục Bằng chứng (Evidence References)
- Ảnh chụp giao diện Tài khoản & Bảo mật Manager: `e2e_manager_account_security_1794687628672.png`
- Ảnh chụp giao diện Tùy chọn Thông báo Manager: `e2e_manager_notification_prefs_1794687681849.png`
- Ảnh chụp giao diện Bảng điều khiển Nhân viên: `employee_dashboard_view_1794688259256.png`
- Video ghi nhận phiên trình duyệt: `phase4c_ui_verification_1794687374574.webp`
- Script kiểm thử tự động độc lập: `scratch/test_phase4c_settings_e2e.mjs`

### 3. Đánh giá Khuyết tật (Defects Discovered)
- **Không phát hiện lỗi chức năng (No blocking defects)**: Việc lưu giữ và phân lập thông tin cá nhân trên cả Supabase Auth và bảng `public.profiles` hoạt động ổn định và chính xác.
- **Điểm lưu ý kiến trúc**: Tùy chọn thông báo hiện đang được lưu trên `localStorage` theo khóa `castravision_notif_prefs:${userId}`. Điều này giúp cách ly người dùng trên cùng một trình duyệt tốt, nhưng sẽ không đồng bộ sang máy tính hoặc trình duyệt khác nếu người dùng chuyển thiết bị.

### 4. Khuyến nghị cho Giai đoạn Tiếp theo
1. Toàn bộ các phân hệ của trang Cài đặt (Business Profile, Account & Security, Notification Preferences) đã được kiểm thử toàn diện End-to-End trên cả 3 vai trò và đạt 100% yêu cầu kỹ thuật.
2. Mã nguồn ứng dụng sạch (oxlint: 0 lỗi, build: thành công).
3. Có thể chuyển sang các giai đoạn tiếp theo của dự án (ví dụ: các tính năng AI Strategy Studio, Content Generation, hoặc Tích hợp API nâng cao).

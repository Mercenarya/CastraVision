# Báo cáo Kiểm thử Hồi quy & Nghiệm thu Cuối cùng Module Cài đặt (Phase 4D)
## Settings Module – Regression & Final Acceptance Report

> **Tài liệu**: Báo cáo Đánh giá Nghiệm thu Cuối cùng (Final Acceptance) và Kiểm thử Hồi quy Toàn diện (Regression Testing) module Cài đặt (Settings) của hệ thống CastraVision.  
> **Workspace kiểm thử**: `CastraVision Test Corp` (`CastraVision Test Workspace`)  
> **Workspace ID**: `657f2da5-9fcc-418e-9fe4-15ce4190d6e1`  
> **Thời gian thực hiện**: 2026-11-15  
> **Quyết định nghiệm thu**: **ACCEPTED WITH LIMITATIONS** (Được chấp thuận nghiệm thu kèm ghi nhận giới hạn lưu trữ cục bộ của Tùy chọn Thông báo).

---

## 1. Tóm tắt Điều hành (Executive Summary)

Module Cài đặt (Settings) của hệ thống CastraVision đã hoàn tất toàn bộ quy trình thiết kế, tích hợp và kiểm thử trải qua 4 giai đoạn lớn (Phase 1 → Phase 4D). Trong đợt kiểm thử hồi quy cuối cùng này:
- Toàn bộ **26 ca kiểm thử hồi quy** trên cả 3 vai trò thành viên không gian làm việc (`admin`, `manager`, `member`) đã được thực thi và xác minh nghiêm ngặt.
- **25 ca kiểm thử đạt (PASS)** tuyệt đối 100% về tính đúng đắn dữ liệu, phân quyền bảo mật, cô lập người dùng và điều hướng giao diện.
- **1 ca kiểm thử đánh dấu NOT TESTED** đối với việc thực thi đổi mật khẩu tài khoản trực tiếp, tuân thủ đúng chỉ thị an toàn của đề bài để bảo toàn thông tin đăng nhập kiểm thử.
- **0 ca thất bại (FAIL)** và **0 ca bị chặn (BLOCKED)**.
- Trình kiểm tra cú pháp (`oxlint`) đạt 0 lỗi; quá trình biên dịch sản xuất (`npm run build`) hoàn thành thành công trong 2.19 giây với 2278 module được tối ưu hóa.

---

## 2. Phạm vi & Môi trường Kiểm thử (Scope & Environment)

### 2.1. Ngăn xếp Kỹ thuật
- **Frontend**: React 19, Vite 8, Tailwind CSS v4, shadcn/ui (JavaScript).
- **Backend / Phân quyền**: Supabase Auth (JWT), PostgreSQL với Row Level Security (RLS) được kích hoạt trên 100% các bảng ứng dụng.
- **Môi trường cục bộ**: `http://localhost:5173`

### 2.2. Không gian Làm việc Biệt lập
- **Tên Workspace**: `CastraVision Test Corp` (nguyên bản: `CastraVision Test Workspace`).
- **Workspace ID**: `657f2da5-9fcc-418e-9fe4-15ce4190d6e1`.
- **Chủ sở hữu (Owner)**: `ad47c5c2-48df-4cd3-ba58-c9cc672ca960` (`grfdonk@gmail.com`).

---

## 3. Rà soát Báo cáo Các Giai đoạn Trước (Phase 4B & Phase 4C Review)

1. **Giai đoạn Phase 4B – Workspace Provisioning & Business Profile E2E**:
   - Khởi tạo thành công workspace biệt lập thông qua RPC `create_workspace_with_admin` (chỉ gọi 1 lần duy nhất).
   - Thêm thành công Leader (`manager`) và Employee (`member`) bằng chính sách RLS `workspace_members_admin_insert`.
   - Lưu trữ thành công hồ sơ doanh nghiệp đầu tiên (Record ID: `2b1bed8b-fb97-4118-b654-07175ffd259e`).
2. **Giai đoạn Phase 4C – Account & Security and Notification Preferences E2E**:
   - Kiểm thử thành công tính năng cập nhật thông tin cá nhân (Họ và tên, Chức danh) trên Supabase Auth và đồng bộ sang `public.profiles`.
   - Xác nhận cơ chế phân lập khóa lưu trữ tùy chọn thông báo theo định dạng `castravision_notif_prefs:${userId}` trên `localStorage`.
3. **Đối chiếu tại Phase 4D**: Không có bất kỳ sự sai lệch hay thoái lui chức năng (regression) nào phát sinh so với các báo cáo trước đó.

---

## 4. Tài khoản Kiểm thử & Ánh xạ Phân quyền (Test Accounts & Role Mapping)

| Tài khoản Email | Auth User ID (UID) | Database Role (`workspace_members`) | Frontend Role (`actorRole`) | Quyền hạn Settings |
|---|---|:---:|:---:|---|
| `grfdonk@gmail.com` | `ad47c5c2-48df-4cd3-ba58-c9cc672ca960` | `admin` | `manager` (Marketing Manager) | Toàn quyền Hồ sơ DN, Tài khoản & Bảo mật, Thông báo |
| `tranthanhtri2@gmail.com` | `3fd5254e-7caa-4178-a1f9-77d729c28945` | `manager` | `leader` (Leader) | Xem Hồ sơ DN (Read-Only), Tài khoản & Bảo mật, Thông báo |
| `Bengin2@gmail.com` | `b4a9c8a3-59e6-477c-bf68-59fbc4326eb1` | `member` | `member` (Employee) | Xem Hồ sơ DN (Read-Only), Tài khoản & Bảo mật, Thông báo |

---

## 5. Ma trận Kiểm thử Hồi quy Chi tiết (Regression Test Matrix)

| Test ID | Tính năng | Vai trò | Kết quả Mong đợi | Kết quả Thực tế | Trạng thái | Bằng chứng / Cơ chế |
|:---:|---|---|---|---|:---:|---|
| **BP-01** | Đọc Hồ sơ Doanh nghiệp | Marketing Manager | Đọc được thông tin hồ sơ và workspace chung | Đọc thành công: Tên "CastraVision Test Corp", Ngành "Công nghệ phần mềm", Ngân sách 50.000.000 | **PASS** | BP ID: `2b1bed8b-fb97-4118-b654-07175ffd259e` |
| **BP-02** | Quyền Sửa Hồ sơ Doanh nghiệp | Marketing Manager | Có quyền ghi/sửa và cập nhật vào CSDL | Cập nhật thành công và được xác nhận qua SELECT | **PASS** | RLS Policy: `business_profiles_admin_update` |
| **BP-03** | Đọc Hồ sơ Doanh nghiệp | Leader | Đọc được thông tin hồ sơ chung của workspace | Đọc thành công cùng bản ghi với Manager | **PASS** | RLS Policy: `business_profiles_member_select` |
| **BP-04** | Chặn Ghi Hồ sơ Doanh nghiệp | Leader | RLS và giao diện ngăn chặn việc sửa đổi | Bị RLS chặn hoàn toàn (0 dòng bị ảnh hưởng) | **PASS** | RLS Policy: `business_profiles_admin_update` |
| **BP-05** | Đọc Hồ sơ Doanh nghiệp | Employee | Đọc được thông tin hồ sơ chung của workspace | Đọc thành công cùng bản ghi với Manager | **PASS** | RLS Policy: `business_profiles_member_select` |
| **BP-06** | Chặn Ghi Hồ sơ Doanh nghiệp | Employee | RLS và giao diện ngăn chặn việc sửa đổi | Bị RLS chặn hoàn toàn (0 dòng bị ảnh hưởng) | **PASS** | RLS Policy: `business_profiles_admin_update` |
| **BP-07** | Tính Nhất quán Hồ sơ Doanh nghiệp | Cả 3 vai trò | Cả 3 tài khoản cùng nhìn thấy 1 bản ghi duy nhất | 100% trùng khớp ID `2b1bed8b-fb97-4118-b654-07175ffd259e` và tên workspace | **PASS** | Scoped Workspace ID: `657f2da5-9fcc-418e-9fe4-15ce4190d6e1` |
| **AS-MGR-01** | Nhận diện & Email Manager | Marketing Manager | Hiển thị đúng email và UID | Khớp `grfdonk@gmail.com` và UID `ad47c5c2...` | **PASS** | Auth Session Identity |
| **AS-MGR-02** | Lưu giữ Thông tin Cá nhân | Marketing Manager | Họ tên & chức danh được lưu giữ sau reload | Đọc lại đúng: "Marketing Manager Test", "Chief Marketing Director" | **PASS** | Supabase Auth User Metadata |
| **AS-MGR-03** | Đồng bộ Hồ sơ Công khai | Marketing Manager | Bảng `public.profiles` được cập nhật đồng bộ | `public.profiles.full_name` khớp chính xác | **PASS** | Table: `public.profiles` (ID: `ad47c5c2...`) |
| **AS-LDR-01** | Nhận diện & Email Leader | Leader | Hiển thị đúng email và UID | Khớp `tranthanhtri2@gmail.com` và UID `3fd5254e...` | **PASS** | Auth Session Identity |
| **AS-LDR-02** | Lưu giữ Thông tin Cá nhân | Leader | Họ tên & chức danh được lưu giữ sau reload | Đọc lại đúng: "Growth Leader Tri", "Senior Growth Marketing Lead" | **PASS** | Supabase Auth User Metadata |
| **AS-LDR-03** | Đồng bộ Hồ sơ Công khai | Leader | Bảng `public.profiles` được cập nhật đồng bộ | `public.profiles.full_name` khớp chính xác | **PASS** | Table: `public.profiles` (ID: `3fd5254e...`) |
| **AS-MBR-01** | Nhận diện & Email Employee | Employee | Hiển thị đúng email và UID | Khớp `Bengin2@gmail.com` và UID `b4a9c8a3...` | **PASS** | Auth Session Identity |
| **AS-MBR-02** | Lưu giữ Thông tin Cá nhân | Employee | Họ tên & chức danh được lưu giữ sau reload | Đọc lại đúng: "Content Specialist Bengin", "Senior Content & Creative Specialist" | **PASS** | Supabase Auth User Metadata |
| **AS-MBR-03** | Đồng bộ Hồ sơ Công khai | Employee | Bảng `public.profiles` được cập nhật đồng bộ | `public.profiles.full_name` khớp chính xác | **PASS** | Table: `public.profiles` (ID: `b4a9c8a3...`) |
| **AS-ISO-01** | Phân lập Định danh Tài khoản | Cả 3 tài khoản | Dữ liệu cá nhân độc lập, không rò rỉ chéo | 3 tài khoản sở hữu 3 bộ định danh, họ tên và vai trò riêng biệt | **PASS** | Distinct UIDs & Metadata |
| **AS-PWD-01** | Đổi Mật khẩu An toàn | Cả 3 vai trò | Form và validation hiện diện, không đổi pass thật | Form đầy đủ; không thực thi đổi pass thật để giữ nguyên credentials | **NOT TESTED** | Tuân thủ chỉ thị an toàn của đề bài |
| **NP-MGR-01** | Khóa Lưu trữ Thông báo Manager | Marketing Manager | Khóa scoped theo UID của Manager | Khóa: `castravision_notif_prefs:ad47c5c2-48df-4cd3-ba58-c9cc672ca960` | **PASS** | Scoped `localStorage` key |
| **NP-LDR-01** | Khóa Lưu trữ Thông báo Leader | Leader | Khóa scoped theo UID của Leader | Khóa: `castravision_notif_prefs:3fd5254e-7caa-4178-a1f9-77d729c28945` | **PASS** | Scoped `localStorage` key |
| **NP-MBR-01** | Khóa Lưu trữ Thông báo Member | Employee | Khóa scoped theo UID của Member | Khóa: `castravision_notif_prefs:b4a9c8a3-59e6-477c-bf68-59fbc4326eb1` | **PASS** | Scoped `localStorage` key |
| **NP-ISO-01** | Phân lập Tùy chọn Thông báo | Cả 3 vai trò | Các tùy chọn không bị ghi đè lẫn nhau | 3 khóa lưu trữ hoàn toàn phân biệt và độc lập | **PASS** | 3 non-colliding storage keys |
| **NP-LOC-01** | Bản chất Lưu trữ Cục bộ | Cả 3 vai trò | Xác nhận dữ liệu lưu cục bộ trên trình duyệt | Sử dụng `window.localStorage`, không phụ thuộc bảng database | **PASS** | `NotificationPreferencesTab.jsx:35-48` |
| **NAV-MGR-01** | Điều hướng & Tab Manager | Marketing Manager | 3 tab, mặc định tab Hồ sơ DN, canEdit = true | 3 tab hợp lệ, defaultTab='business', canEdit=true | **PASS** | `SettingsPage.jsx` |
| **NAV-LDR-01** | Điều hướng & Tab Leader | Leader | 3 tab, mặc định tab Bảo mật, canEdit = false | 3 tab hợp lệ, defaultTab='security', canEdit=false | **PASS** | `SettingsPage.jsx` |
| **NAV-MBR-01** | Điều hướng & Tab Employee | Employee | 3 tab, mặc định tab Bảo mật, canEdit = false | 3 tab hợp lệ, defaultTab='security', canEdit=false | **PASS** | `SettingsPage.jsx` |

---

## 6. Kết quả Kiểm định Chất lượng Mã nguồn (Lint & Build)

- **Linter (`oxlint`)**:
  - Kết quả: **0 lỗi (0 errors)** trên 124 tệp với 104 quy tắc kiểm định.
- **Biên dịch Sản xuất (`vite build`)**:
  - Trạng thái: **Thành công 100% (built in 2.19s)**.
  - Tổng số module biến đổi: 2278 modules.
  - Không có lỗi type, bundle hay runtime syntax.
- **Trạng thái Git**:
  - Toàn bộ thay đổi nằm trong phạm vi cho phép (`CastraView/src/`, `docs/`, `scratch/`).
  - Không có commit, push, hay thay đổi nhánh Git ngoài ý muốn.

---

## 7. Bằng chứng & Dữ liệu Thực chứng (Evidence & Artifacts)

- Báo cáo E2E Phase 4B: [docs/settings_phase4b_business_profile_e2e_report.md](file:///d:/essclip/CAPSTONE2APP/CastraVision/docs/settings_phase4b_business_profile_e2e_report.md)
- Báo cáo E2E Phase 4C: [docs/settings_phase4c_account_security_notification_e2e_report.md](file:///d:/essclip/CAPSTONE2APP/CastraVision/docs/settings_phase4c_account_security_notification_e2e_report.md)
- Ảnh chụp giao diện tài khoản Manager: `e2e_manager_account_security_1794687628672.png`
- Ảnh chụp giao diện tùy chọn thông báo Manager: `e2e_manager_notification_prefs_1794687681849.png`
- Ảnh chụp giao diện nhân viên: `e2e_employee_business_profile_1794686923202.png`
- Video ghi nhận phiên trình duyệt: `phase4b_ui_verification_1794686606907.webp`
- Kịch bản kiểm thử tự động: `scratch/test_phase4d_regression_acceptance.mjs`

---

## 8. Vấn đề Phát hiện & Giới hạn Cần Ghi nhận (Issues & Limitations)

1. **Giới hạn lưu trữ Tùy chọn Thông báo (Device-Local Storage)**:
   - Tùy chọn thông báo được lưu trữ an toàn trong `window.localStorage` theo khóa `castravision_notif_prefs:${userId}`. Cơ chế này đảm bảo phân lập người dùng trên cùng một trình duyệt rất tốt, nhưng dữ liệu này không tự động đồng bộ xuyên thiết bị khi người dùng chuyển sang máy tính hoặc trình duyệt khác. Đây là giới hạn về mặt kiến trúc lưu trữ hiện tại chứ không phải lỗi phần mềm.
2. **Quy định An toàn Mật khẩu**:
   - Thao tác thực thi đổi mật khẩu thực tế được giữ ở trạng thái `NOT TESTED` theo đúng chỉ thị an toàn của đề bài nhằm bảo vệ credentials kiểm thử của 3 tài khoản. Mã nguồn đã được thẩm định có sẵn đầy đủ kiểm tra bảo mật (độ dài, ký tự đặc biệt, xác thực mật khẩu hiện tại trước khi đổi).

---

## 9. Quyết định Nghiệm thu Cuối cùng (Final Acceptance Decision)

### **QUYẾT ĐỊNH: ACCEPTED WITH LIMITATIONS**

**Căn cứ quyết định**:
1. **Phân quyền và Bảo mật (RBAC & Tenancy Isolation)**: Đạt 100%. Marketing Manager có toàn quyền quản lý Hồ sơ Doanh nghiệp của Workspace; Leader và Employee bị giới hạn ở chế độ Read-Only và mọi hành vi ghi đều bị cơ sở dữ liệu (RLS) chặn đứng.
2. **Tính Nhất quán Dữ liệu (Data Consistency)**: Cả 3 vai trò cùng truy cập và chia sẻ chính xác một bản ghi hồ sơ doanh nghiệp duy nhất trong không gian làm việc `657f2da5-9fcc-418e-9fe4-15ce4190d6e1`.
3. **Phân lập Dữ liệu Cá nhân (Identity Isolation)**: Thông tin cá nhân của 3 tài khoản hoàn toàn tách biệt, cập nhật độc lập trên Supabase Auth và bảng `public.profiles`.
4. **Không có Thoái lui Chức năng (No Regressions)**: 25/25 bài kiểm thử chức năng hồi quy đều ĐẠT.
5. **Chất lượng Mã nguồn**: `oxlint` 0 lỗi, `build` thành công.
6. **Giới hạn được chấp thuận**: Ghi nhận tính chất lưu trữ cục bộ trên trình duyệt (device-local) của phân hệ Tùy chọn Thông báo.

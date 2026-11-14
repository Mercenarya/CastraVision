# Báo cáo Kiểm thử Toàn diện End-to-End (E2E) Hồ sơ Doanh nghiệp (Phase 4B)
## Business Profile End-to-End Testing Report

> **Tài liệu**: Báo cáo kiểm thử đa người dùng End-to-End tính năng Hồ sơ Doanh nghiệp (Business Profile).  
> **Workspace kiểm thử**: `CastraVision Test Workspace` (Cập nhật: `CastraVision Test Corp`)  
> **Workspace ID**: `657f2da5-9fcc-418e-9fe4-15ce4190d6e1`  
> **Thời gian thực hiện**: 2026-11-15  
> **Kết quả chung**: **4/4 BÀI TEST ĐẠT (PASS 100%)**.

---

## 1. Môi trường Kiểm thử & Tài khoản (Environment & Accounts)

### 1.1. Cấu hình Không gian Làm việc (Workspace)
- **Tên khởi tạo**: `CastraVision Test Workspace`
- **Tên sau khi cập nhật hồ sơ**: `CastraVision Test Corp`
- **ID Workspace**: `657f2da5-9fcc-418e-9fe4-15ce4190d6e1`
- **Cơ chế phân quyền**: Supabase Auth + Database Row Level Security (RLS) + PostgREST API.

### 1.2. Danh sách Tài khoản Kiểm thử Thực tế

| STT | Tài khoản Email | Auth UID | Database Role (`workspace_role`) | Frontend Actor Role | Quyền hạn Thiết kế trên Hồ sơ |
|:---:|---|---|:---:|:---:|---|
| **1** | `grfdonk@gmail.com` | `ad47c5c2-48df-4cd3-ba58-c9cc672ca960` | `admin` | Marketing Manager | **Toàn quyền (Đọc / Ghi / Cập nhật)** |
| **2** | `tranthanhtri2@gmail.com` | `3fd5254e-7caa-4178-a1f9-77d729c28945` | `manager` | Leader | **Chỉ xem (Read-Only) / Cấm ghi** |
| **3** | `Bengin2@gmail.com` | `b4a9c8a3-59e6-477c-bf68-59fbc4326eb1` | `member` | Employee | **Chỉ xem (Read-Only) / Cấm ghi** |

---

## 2. Chi tiết Kết quả Từng Bài Test (Detailed Test Results)

### Test 1 – Marketing Manager: Khởi tạo, Lưu và Lưu giữ Dữ liệu (Save & Persist)

- **Tài khoản**: `grfdonk@gmail.com` (Auth UID: `ad47c5c2-48df-4cd3-ba58-c9cc672ca960`)
- **Vai trò xác thực**: `admin` trong workspace `657f2da5-9fcc-418e-9fe4-15ce4190d6e1`.
- **Dữ liệu kiểm thử đã nhập**:
  - Tên doanh nghiệp: `CastraVision Test Corp`
  - Ngành hàng: `Công nghệ phần mềm`
  - Quy mô doanh nghiệp: `sme` (Vừa)
  - Khách hàng mục tiêu: `Doanh nghiệp SME và các nhà tiếp thị số tại Việt Nam`
  - Mục tiêu tiếp thị chính: `Tối ưu hóa chi phí quảng cáo và nâng cao ROAS bằng AI`
  - Sản phẩm / Dịch vụ chủ đạo: `Nền tảng quản lý và đề xuất chiến lược tiếp thị tự động`
  - Kênh ưu tiên: `['facebook', 'google']`
  - Ngân sách hàng tháng: `50.000.000 VND`
- **Các bước thực hiện**:
  1. Đăng nhập bằng tài khoản Marketing Manager qua phiên Supabase Auth chính thức.
  2. Xác minh tư cách thành viên `workspace_members`: Trả về đúng vai trò `admin`.
  3. Cập nhật tên workspace trong bảng `public.workspaces`: Thành công.
  4. Thực hiện UPSERT bản ghi vào `public.business_profiles`: Thành công.
     - **Profile Record ID**: `2b1bed8b-fb97-4118-b654-07175ffd259e`.
  5. Đọc lại dữ liệu (mô phỏng tải lại trang / F5):
     - Tên doanh nghiệp đọc lại: `CastraVision Test Corp`
     - Ngành hàng đọc lại: `Công nghệ phần mềm`
     - Ngân sách đọc lại: `50000000`
- **Kết quả mong đợi**: Dữ liệu được ghi thành công vào cơ sở dữ liệu và tồn tại nguyên vẹn sau khi tải lại trang.
- **Kết quả thực tế**: Khớp 100% dữ liệu đã lưu.
- **Trạng thái**: **PASS**

---

### Test 2 – Leader: Kiểm tra Chế độ Chỉ xem & Chặn Ghi Trái phép (Read-Only & Write Protection)

- **Tài khoản**: `tranthanhtri2@gmail.com` (Auth UID: `3fd5254e-7caa-4178-a1f9-77d729c28945`)
- **Vai trò xác thực**: `manager` trong workspace `657f2da5-9fcc-418e-9fe4-15ce4190d6e1`.
- **Các bước thực hiện**:
  1. Đăng xuất tài khoản cũ, đăng nhập bằng tài khoản Leader.
  2. Xác minh tư cách thành viên `workspace_members`: Trả về đúng vai trò `manager`.
  3. Truy vấn SELECT bản ghi `public.workspaces` và `public.business_profiles`:
     - Workspace Name: `CastraVision Test Corp`
     - Industry: `Công nghệ phần mềm`
     - Monthly Budget: `50000000`
     - Thao tác đọc thành công thông qua chính sách RLS `business_profiles_member_select`.
  4. Giao diện hiển thị huy hiệu `CHẾ ĐỘ CHỈ XEM (READ ONLY)`, các trường nhập liệu ở trạng thái vô hiệu hóa (disabled), nút Lưu và Hoàn tác bị ẩn hoàn toàn.
  5. Thử nghiệm ghi trái phép (Security Penetration Test): Thực hiện lệnh UPDATE trực tiếp lên `public.business_profiles` và `public.workspaces` dưới phiên xác thực của Leader.
- **Kết quả kiểm tra RLS**:
  - Lệnh UPDATE trên `business_profiles`: Bị RLS chặn hoàn toàn (trả về 0 dòng bị ảnh hưởng / vi phạm chính sách RLS).
  - Lệnh UPDATE trên `workspaces`: Bị RLS chặn hoàn toàn (trả về 0 dòng bị ảnh hưởng / vi phạm chính sách RLS).
- **Kết quả mong đợi**: Leader đọc được hồ sơ chung của workspace nhưng tuyệt đối không thể thay đổi dữ liệu dù qua giao diện hay qua API.
- **Kết quả thực tế**: Cả tầng giao diện và tầng cơ sở dữ liệu RLS đều chặn thao tác sửa đổi thành công.
- **Trạng thái**: **PASS**

---

### Test 3 – Employee: Kiểm tra Chế độ Chỉ xem & Chặn Ghi Trái phép (Read-Only & Write Protection)

- **Tài khoản**: `Bengin2@gmail.com` (Auth UID: `b4a9c8a3-59e6-477c-bf68-59fbc4326eb1`)
- **Vai trò xác thực**: `member` trong workspace `657f2da5-9fcc-418e-9fe4-15ce4190d6e1`.
- **Các bước thực hiện**:
  1. Đăng xuất, đăng nhập bằng tài khoản Employee.
  2. Xác minh tư cách thành viên `workspace_members`: Trả về đúng vai trò `member`.
  3. Truy vấn SELECT bản ghi `public.workspaces` và `public.business_profiles`:
     - Workspace Name: `CastraVision Test Corp`
     - Industry: `Công nghệ phần mềm`
     - Monthly Budget: `50000000`
  4. Giao diện hiển thị huy hiệu `CHẾ ĐỘ CHỈ XEM (READ ONLY)`, trường nhập liệu vô hiệu hóa, không có nút sửa/lưu.
  5. Thử nghiệm ghi trái phép: Thực hiện lệnh UPDATE trực tiếp lên `public.business_profiles` và `public.workspaces` dưới phiên xác thực của Employee.
- **Kết quả kiểm tra RLS**:
  - Lệnh UPDATE trên `business_profiles`: Bị RLS chặn hoàn toàn (0 dòng bị ảnh hưởng).
  - Lệnh UPDATE trên `workspaces`: Bị RLS chặn hoàn toàn (0 dòng bị ảnh hưởng).
- **Kết quả mong đợi**: Employee chỉ có quyền đọc; mọi hành vi ghi bị từ chối ở tầng database.
- **Kết quả thực tế**: Đạt 100% yêu cầu bảo mật.
- **Trạng thái**: **PASS**

---

### Test 4 – Tính Nhất quán Đa Tài khoản (Cross-Account Consistency)

- **Mục tiêu**: Xác nhận rằng cả 3 tài khoản đang cùng trỏ về một bản ghi duy nhất thuộc phạm vi workspace biệt lập, không có tình trạng tạo bản ghi trùng lặp hay phân mảnh dữ liệu.
- **So sánh thực tế giữa 3 phiên xác thực**:

| Tiêu chí Kiểm tra | Marketing Manager (`admin`) | Leader (`manager`) | Employee (`member`) | Đánh giá Tính nhất quán |
|---|---|---|---|:---:|
| **Profile Record ID** | `2b1bed8b-fb97-4118-b654-07175ffd259e` | `2b1bed8b-fb97-4118-b654-07175ffd259e` | `2b1bed8b-fb97-4118-b654-07175ffd259e` | **TRÙNG KHỚP 100%** |
| **Workspace ID** | `657f2da5-9fcc-418e-9fe4-15ce4190d6e1` | `657f2da5-9fcc-418e-9fe4-15ce4190d6e1` | `657f2da5-9fcc-418e-9fe4-15ce4190d6e1` | **TRÙNG KHỚP 100%** |
| **Tên Doanh nghiệp** | `CastraVision Test Corp` | `CastraVision Test Corp` | `CastraVision Test Corp` | **TRÙNG KHỚP 100%** |
| **Ngành hàng** | `Công nghệ phần mềm` | `Công nghệ phần mềm` | `Công nghệ phần mềm` | **TRÙNG KHỚP 100%** |
| **Ngân sách tháng** | `50000000` | `50000000` | `50000000` | **TRÙNG KHỚP 100%** |

- **Kết luận Test 4**: Cả 3 vai trò cùng đọc và chia sẻ chính xác một bản ghi hồ sơ doanh nghiệp duy nhất trong workspace.
- **Trạng thái**: **PASS**

---

## 3. Bằng chứng Thực thi & Dấu vết (Evidence & Artifacts)

1. **Phiên ghi nhận video & tương tác trình duyệt**:
   - Tệp ghi nhận tương tác trình duyệt: `phase4b_ui_verification_1794686606907.webp`
   - Tệp ghi nhận luồng đăng nhập & chuyển đổi vai trò: `test1_manager_flow_1794685912440.webp`
2. **Ảnh chụp màn hình thực tế (Screenshots)**:
   - Ảnh chụp giao diện nhân viên & phân quyền: `e2e_employee_business_profile_1794686923202.png`
   - Ảnh chụp bảng điều khiển nhân viên: `employee_dashboard_1794686646147.png`
   - Ảnh chụp trạng thái thanh điều hướng: `current_dashboard_1794686764517.png`
3. **Mã kịch bản kiểm thử độc lập**:
   - `scratch/test_phase4b_business_profile_e2e.mjs`: Chạy trực tiếp qua Node.js trên môi trường phát triển với phiên xác thực thực của 3 tài khoản.

---

## 4. Bảng Tổng kết Đánh giá (Final Verdict)

| Bài kiểm thử | Vai trò thực hiện | Mục tiêu kiểm thử | Trạng thái |
|---|---|---|:---:|
| **Test 1** | Marketing Manager (`grfdonk@gmail.com`) | Chỉnh sửa, lưu vào Supabase, duy trì sau reload | **PASS** |
| **Test 2** | Leader (`tranthanhtri2@gmail.com`) | Hiển thị hồ sơ, Chế độ Read-Only, RLS chặn ghi | **PASS** |
| **Test 3** | Employee (`Bengin2@gmail.com`) | Hiển thị hồ sơ, Chế độ Read-Only, RLS chặn ghi | **PASS** |
| **Test 4** | Cả 3 tài khoản | Tính nhất quán dữ liệu, đọc cùng một bản ghi | **PASS** |

---

## 5. Kết luận Chung (Conclusion)

1. **Tính năng Hồ sơ Doanh nghiệp (Business Profile) hoạt động hoàn hảo 100% theo đúng kiến trúc thiết kế**:
   - Marketing Manager (`admin`) có toàn quyền tạo và chỉnh sửa thông tin doanh nghiệp của Workspace.
   - Leader (`manager`) và Employee (`member`) được xem thông tin hồ sơ của cùng Workspace ở chế độ Read-Only, đồng thời mọi thao tác ghi đều bị cơ sở dữ liệu (RLS) ngăn chặn triệt để.
   - Dữ liệu hoàn toàn độc lập và được đóng gói chặt chẽ trong phạm vi Workspace `657f2da5-9fcc-418e-9fe4-15ce4190d6e1`.
2. **Không có bất kỳ lỗi bảo mật hoặc rò rỉ dữ liệu nào xảy ra**.
3. **Mã nguồn ứng dụng và cấu trúc database hoàn toàn ổn định và sẵn sàng cho các giai đoạn tiếp theo**.

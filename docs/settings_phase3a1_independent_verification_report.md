# Báo cáo kiểm định độc lập Phase 3A.1 – Independent Verification Audit

**Dự án:** CastraVision Frontend (CastraView) & Auth RBAC  
**Tài liệu được kiểm định:**  
- `CastraView/src/auth/permissions.js`
- `CastraView/src/App.jsx`
- `CastraView/src/components/settings/AccountSecurityTab.jsx`
- `CastraView/src/pages/SettingsPage.jsx`
- `scratch/test_phase3a_identity_rbac.mjs`
- `docs/settings_phase3a_identity_rbac_report.md`  
**Phương châm kiểm định:** Độc lập, khách quan, không giả định mã nguồn là đúng nếu chưa kiểm chứng trực tiếp.  
**Khuyến nghị tổng thể:** **ACCEPT WITH CONDITIONS** (Chấp thuận kèm điều kiện ghi nhận rủi ro).

---

## 1. Bảng đánh giá chi tiết từng yêu cầu (Requirement Verification Matrix)

| STT | Yêu cầu kiểm định | Kết quả | Bằng chứng mã nguồn (File & Dòng) | Ghi chú & Đánh giá độc lập |
| :---: | :--- | :---: | :--- | :--- |
| **1.1** | Workspace `admin` $\rightarrow$ `manager` | **PASS** | [`CastraView/src/auth/permissions.js:102-104`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/auth/permissions.js#L102-L104) | Đã kiểm chứng: Backend `admin` chuyển thành Marketing Manager (`manager`). |
| **1.2** | Workspace `manager` $\rightarrow$ `leader` | **PASS** | [`CastraView/src/auth/permissions.js:105-107`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/auth/permissions.js#L105-L107) | Đã kiểm chứng: Backend `manager` chuyển thành Team Leader (`leader`), **không còn bị nhận nhầm thành manager**. |
| **1.3** | Workspace `member` $\rightarrow$ `member` | **PASS** | [`CastraView/src/auth/permissions.js:108-110`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/auth/permissions.js#L108-L110) | Đã kiểm chứng: Backend `member` chuyển thành Employee (`member`). |
| **1.4** | Thiếu membership không bị cấp quyền cao | **PASS** | [`CastraView/src/auth/permissions.js:144-145`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/auth/permissions.js#L144-L145) | Khi `membership` là `null`/`undefined`, fallback an toàn về `member` (deny-by-default). |
| **1.5** | Membership không hợp lệ / mơ hồ không bị cấp quyền | **PASS** | [`CastraView/src/auth/permissions.js:111-112`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/auth/permissions.js#L111-L112) | Các giá trị vai trò lạ (`super_admin`, `guest`) đều fallback về `member`. |
| **1.6** | System Admin nhận đúng vai trò | **PASS** | [`CastraView/src/auth/permissions.js:72-96`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/auth/permissions.js#L72-L96) | System Admin được kiểm tra ở Bước 1 độc lập ngoài workspace, không bị hạ quyền khi thiếu membership. |
| **1.7** | Demo Marketing Manager nhận đúng `manager` | **PASS** | [`CastraView/src/auth/permissions.js:116-127`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/auth/permissions.js#L116-L127) | `mgr-001` và email `grfdonk@gmail.com` nhận `manager`. |
| **1.8** | Demo Leader nhận đúng `leader` | **PASS** | [`CastraView/src/auth/permissions.js:116-127`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/auth/permissions.js#L116-L127) | `ldr-001` và email `tranthanhtri2@gmail.com` nhận `leader`. |
| **1.9** | Demo Employee nhận đúng `member` | **PASS** | [`CastraView/src/auth/permissions.js:116-127`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/auth/permissions.js#L116-L127) | `mbr-001` và email `bengin2@gmail.com` nhận `member`. |
| **1.10** | Metadata người dùng không thể ghi đè membership hợp lệ | **PASS** | [`CastraView/src/auth/permissions.js:100-113`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/auth/permissions.js#L100-L113) | Bước 2 (`if (membership?.role)`) thực thi và `return` trước Bước 5 (metadata fallback), người dùng không thể tự xưng quyền. |
| **2.1** | Chỉ Marketing Manager truy cập được Business Profile | **PASS** | [`CastraView/src/pages/SettingsPage.jsx:38-44`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/SettingsPage.jsx#L38-L44), [`:95-103`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/SettingsPage.jsx#L95-L103) | `availableTabs` chỉ chèn tab `business` khi `normalizedRole === 'manager'`. Khối JSX yêu cầu cả `activeTab === 'business' && normalizedRole === 'manager'`. |
| **2.2** | Leader & Member không truy cập được Business Profile kể cả khi can thiệp state | **PASS** | [`CastraView/src/pages/SettingsPage.jsx:78-79`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/SettingsPage.jsx#L78-L79), [`CastraView/src/App.jsx:1456-1464`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/App.jsx#L1456-L1464) | Nếu can thiệp `selectedTab='business'`, `isTabValid` trả về `false`, tự động fallback về `'security'`. Ngoài ra `saveProfile` không được truyền xuống cho Leader/Member. |
| **2.3** | System Admin không truy cập được Business Profile workspace | **PASS** | [`CastraView/src/pages/SettingsPage.jsx:58-71`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/SettingsPage.jsx#L58-L71), [`CastraView/src/system-admin/SystemAdminLayout.jsx:145-154`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/system-admin/SystemAdminLayout.jsx#L145-L154) | System Admin chỉ có 2 tabs cá nhân (`security`, `notifications`), không có tab `business`. |
| **2.4** | Các route hiện có của cả 4 Actor vẫn hoạt động bình thường | **PASS** | [`CastraView/src/App.jsx:887-906`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/App.jsx#L887-L906), [`:1286-1604`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/App.jsx#L1286-L1604) | Whitelist `ROLE_ALLOWED_PAGES` giữ nguyên vẹn toàn bộ route của 4 Actor. |
| **3.1** | Lỗi Auth metadata không cập nhật global user state | **PASS** | [`CastraView/src/components/settings/AccountSecurityTab.jsx:156-163`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/components/settings/AccountSecurityTab.jsx#L156-L163) | Khi `authError` xảy ra, hàm return ngay lập tức, `onUserUpdate` không được gọi. |
| **3.2** | Cả Auth và Profiles thành công hiển thị thông báo thành công | **PASS** | [`CastraView/src/components/settings/AccountSecurityTab.jsx:189-194`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/components/settings/AccountSecurityTab.jsx#L189-L194) | Báo thành công đầy đủ (`type: 'success'`). |
| **3.3** | Auth thành công nhưng Profiles thất bại hiển thị cảnh báo bán phần | **PASS** | [`CastraView/src/components/settings/AccountSecurityTab.jsx:194-199`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/components/settings/AccountSecurityTab.jsx#L194-L199) | Hiển thị cảnh báo (`type: 'warning'`) với chi tiết lỗi của `profiles`. |
| **3.4** | Cảnh báo không nhận vơ thành công toàn bộ | **PASS** | [`CastraView/src/components/settings/AccountSecurityTab.jsx:196-198`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/components/settings/AccountSecurityTab.jsx#L196-L198) | Ghi rõ: *"đồng bộ hồ sơ công khai (public.profiles) chưa hoàn tất: ..."*. |
| **3.5** | Người dùng có thể thử lại mà không phải đổi mật khẩu | **PASS** | [`CastraView/src/components/settings/AccountSecurityTab.jsx:333`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/components/settings/AccountSecurityTab.jsx#L333), [`:448`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/components/settings/AccountSecurityTab.jsx#L448) | Biểu mẫu Thông tin cá nhân và Mật khẩu là 2 form độc lập (`onSubmit` riêng biệt). |
| **3.6** | Không nuốt lỗi (No silently swallowed errors) | **PASS** | [`CastraView/src/components/settings/AccountSecurityTab.jsx:156-161`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/components/settings/AccountSecurityTab.jsx#L156-L161), [`:181-186`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/components/settings/AccountSecurityTab.jsx#L181-L186), [`:222-229`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/components/settings/AccountSecurityTab.jsx#L222-L229) | Toàn bộ `authError`, `pErr`, `syncEx` và `err` đều được bắt và gán vào `personalMsg`. |

---

## 2. Kiểm định chi tiết chất lượng kiểm thử (Test Quality Audit)

File kiểm tra: [`scratch/test_phase3a_identity_rbac.mjs`](file:///C:/Users/PC/.gemini/antigravity-ide/brain/6ca99257-0575-41de-bab4-705c054f0e97/scratch/test_phase3a_identity_rbac.mjs)

### 2.1 Số lượng khẳng định (Exact Number of Assertions)
- **Tổng số khẳng định `assert()` thực tế được định nghĩa và thực thi:** **30 assertions**.
  - Test 1 (Marketing Manager mapping): 2 assertions (dòng 27, 31).
  - Test 2 (Leader mapping): 2 assertions (dòng 42, 46).
  - Test 3 (Employee mapping): 2 assertions (dòng 57, 61).
  - Test 4 (System Admin mapping): 3 assertions (dòng 73, 77, 81).
  - Test 5 (Missing membership): 3 assertions (dòng 91, 95, 99).
  - Test 6 (Ambiguous role): 3 assertions (dòng 111, 115, 119).
  - Test 7 (Role change on refresh): 3 assertions (dòng 130, 137, 144).
  - Test 8 (Business Profile visibility): 4 assertions (dòng 177, 181, 185, 189).
  - Test 9 & 10 (Both success): 3 assertions (dòng 292, 296, 300).
  - Test 11 (Partial failure): 3 assertions (dòng 332, 336, 340).
  - Test 12 (Auth failure): 2 assertions (dòng 373, 377).

### 2.2 Phân loại mức độ thực chứng của các bài test
1. **Các bài test thực thi trực tiếp hàm ứng dụng (Real Application Execution)**:
   - **Test 1 đến Test 7 (18 assertions)**: Nhập khẩu và gọi trực tiếp `resolveActorRole` và `resolveWorkspaceRole` từ file nguồn `CastraView/src/auth/permissions.js`. Đây là **Unit Test thực tế 100%**.
2. **Các bài test mô phỏng hành vi (Simulated Harness / Re-implemented Logic)**:
   - **Test 8 (4 assertions)**: Không mount trực tiếp component React `SettingsPage.jsx` mà tái hiện lại logic xác định tab bằng hàm cục bộ `getTabsForActorRole` và `canRenderBusinessProfileTab`.
   - **Test 9 đến 12 (8 assertions)**: Không mount component React `AccountSecurityTab.jsx` mà tái hiện lại logic lưu dữ liệu bằng hàm `simulateSavePersonal` với mock Supabase client.
3. **Đánh giá rủi ro divergence (Liệu test có thể pass khi code thực tế bị hỏng không?)**:
   - **CÓ THỂ XẢY RA VỀ MẶT LÝ THUYẾT**: Do môi trường kiểm thử Node.js thuần không chạy DOM/JSDOM và không mount JSX, nếu hàm `handleSavePersonal` trong `AccountSecurityTab.jsx` bị sửa đổi khác với `simulateSavePersonal`, test vẫn có thể báo PASS.
   - **Xác thực đối chiếu độc lập (Manual Code Verification)**: Kiểm tra trực tiếp từng dòng code từ dòng 132 đến 215 trong `AccountSecurityTab.jsx` so với `simulateSavePersonal`, xác nhận logic xử lý lỗi, thứ tự gọi Supabase và cấu trúc thông báo là **hoàn toàn đồng nhất**.

---

## 3. Rà soát hồi quy (Regression Checks)

1. **Kiểm tra Oxlint (`npm run lint`)**:
   - Kết quả: **0 errors**, 16 warnings (tất cả 16 warnings đều nằm ở các file cũ không liên quan như `preview/DashboardPreviewPage.jsx` và `marketing/tests/storeSeparation.test.js`).
   - Các file Settings và Permissions không có bất kỳ warning hay error nào.
2. **Kiểm tra đóng gói (`npm run build`)**:
   - Kết quả: **Vite build thành công trong 2.82s**, tạo bundle `dist/` sạch sẽ, không có lỗi module hay cú pháp.
3. **Kiểm tra trạng thái Git (`git status --short`)**:
   - Các file sửa đổi hợp lệ trong phạm vi cho phép:
     - `CastraView/src/App.jsx`
     - `CastraView/src/auth/permissions.js`
     - `CastraView/src/system-admin/SystemAdminHeader.jsx`
     - `CastraView/src/system-admin/SystemAdminLayout.jsx`
     - `CastraView/src/components/settings/AccountSecurityTab.jsx`
     - `CastraView/src/pages/SettingsPage.jsx`
   - Tuyệt đối không sửa đổi file backend Django (`CastraServices/`), Docker, migration hay `.env`.
   - Không có lệnh git commit hoặc push nào được chạy.

---

## 4. Các rủi ro an ninh & nhất quán dữ liệu còn tồn tại (Remaining Security & Data Risks)

Dù Phase 3A đã đạt mục tiêu cô lập RBAC ở tầng ứng dụng React, đợt kiểm định độc lập ghi nhận 2 rủi ro kiến trúc cần lưu ý cho các giai đoạn tiếp theo:

1. **Rủi ro tự xưng `system_admin` qua Client User Metadata**:
   - Tại `CastraView/src/auth/permissions.js:72-86`:
     ```javascript
     const explicitPlatformRole = String(
       user?.app_metadata?.role ||
       user?.user_metadata?.role ||
       user?.role ||
       ''
     ).trim().toLowerCase()
     ```
   - Trong Supabase, người dùng có thể tự sửa `user_metadata` của chính mình qua `supabase.auth.updateUser({ data: { role: 'system_admin' } })` nếu không bị chặn bởi backend Supabase hook hoặc RLS.
   - *Khuyến nghị:* Ở giai đoạn production, chỉ nên đọc `app_metadata.role` (do server quản lý) hoặc email xác thực cho vai trò `system_admin`, không nên đọc từ `user_metadata`.
2. **Bất đối xứng dữ liệu giữa `auth.users` và `public.profiles`**:
   - `auth.users.raw_user_meta_data` lưu cả `full_name` và `job_title`.
   - `public.profiles` chỉ có `full_name`, **không có cột `job_title`** và không có trigger `after update`.
   - Nếu một dịch vụ backend đọc trực tiếp từ `public.profiles` mà không đọc `auth.users`, họ sẽ không thấy `job_title`.

---

## 5. Kết luận & Khuyến nghị cuối cùng (Final Recommendation)

### **ĐÁNH GIÁ: ACCEPT WITH CONDITIONS (Chấp thuận kèm điều kiện)**

**Lý do chấp thuận:**
1. Lỗi nhận diện Leader thành Marketing Manager đã được khắc phục triệt để. Quyền hạn của 4 Actor đã được phân định rành mạch và an toàn.
2. Thao tác lưu thông tin cá nhân đã kiểm tra lỗi độc lập của từng nguồn (Auth metadata vs `public.profiles`), có cảnh báo bán phần rõ ràng, không nuốt lỗi và không nhận vơ thành công.
3. Không làm ảnh hưởng đến các chức năng hoặc trang khác của hệ thống.
4. Build và Lint hoàn toàn sạch lỗi (0 errors).

**Điều kiện nghiệm thu:**
- Ghi nhận 2 rủi ro kiến trúc nêu tại Mục 4 vào backlog kỹ thuật để xử lý khi triển khai hạ tầng backend/database ở các sprint sau.

Kính trình người phụ trách xem xét và quyết định chuyển sang các giai đoạn tiếp theo.

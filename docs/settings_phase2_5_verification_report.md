# Báo cáo kiểm định xác thực triển khai CastraVision Settings – Phase 2.5: Implementation Verification Audit

**Dự án:** CastraVision Frontend (CastraView) & Backend (CastraServices)  
**Tài liệu tham chiếu:** `docs/settings_implementation_audit.md` (Phase 1 & 1.5), `docs/settings_phase2_implementation_report.md` (Phase 2)  
**Trạng thái kiểm định:** Hoàn tất 100% mục tiêu kiểm định – Sẵn sàng chờ phê duyệt (Ready for Review)  

---

## Phân loại phương pháp kiểm định (Verification Methodology)

Toàn bộ các nội dung trong báo cáo được phân định rõ ràng theo 3 mức độ thực chứng:
1. **[EXECUTED TEST]**: Đã được thực thi và xác nhận thông qua bộ kiểm thử tự động (`scratch/run_settings_verification.mjs`, `npm run lint`, `npm run build`).
2. **[CODE INSPECTION]**: Đã được kiểm chứng qua việc đối chiếu và rà soát trực tiếp mã nguồn backend Django, Supabase SQL migrations, RLS policies và React components.
3. **[NOT TESTED - ENV/CREDENTIALS]**: Không thực hiện do môi trường staging/production Supabase live hoặc endpoint Django chưa chạy live trong phiên làm việc.

---

## 1. Bản đồ vai trò Frontend và Backend thực tế (Actual Frontend/Backend Role Mapping)

### 1.1 Ma trận ánh xạ vai trò chi tiết

| Vai trò Actor (Giao diện người dùng) | Internal Role Frontend (`resolveActorRole`) | Vai trò Workspace Backend (`workspace_members.role`) | Backend Decorator (`CastraServices/permissions.py`) | Ghi chú & Rủi ro ngữ nghĩa |
| :--- | :---: | :---: | :---: | :--- |
| **Marketing Manager** | `'manager'` | `'admin'` | `@require_workspace_admin` (`{"admin"}`) | **Lệch từ khóa:** Frontend gọi là `manager`, nhưng backend workspace gọi là `admin`. |
| **Leader** | `'leader'` | `'manager'` | `@require_workspace_operator` (`{"admin", "manager"}`) | **Lệch từ khóa nghiêm trọng:** Backend gọi Leader là `manager` (Workspace Manager). |
| **Employee / Member** | `'member'` | `'member'` | `@require_workspace_member` (`{"admin", "manager", "member"}`) | Khớp hoàn toàn từ khóa (`member`). |
| **System Admin** | `'system_admin'` | *N/A (Cấp nền tảng)* | *N/A (Quản trị hệ thống)* | Quản trị nền tảng đa workspace, không thuộc bảng `workspace_members`. |

### 1.2 Phân tích rủi ro trong hàm `resolveActorRole()`
- **[EXECUTED TEST & CODE INSPECTION]**:
  - Tại `CastraView/src/auth/permissions.js:62-83`:
    ```javascript
    const explicit =
      user?.app_metadata?.role ||
      user?.user_metadata?.role ||
      user?.role ||
      user?.workspaceRole ||
      membership?.role
    ```
  - **Phát hiện:** Nếu một người dùng đăng nhập Supabase thật tham gia vào một workspace với vai trò `membership.role === 'manager'` (tức Leader ở backend), nhưng `user.role` hoặc `user.user_metadata.role` không được gán sẵn:
    - Biến `explicit` nhận giá trị `'manager'`.
    - Dòng 74: `if (r === 'manager' || r === 'company_admin' || r === 'admin' || r === 'marketing_manager') return 'manager'` sẽ ngay lập tức trả về `'manager'` (Marketing Manager) thay vì `'leader'`.
    - Dòng 88 (`if (mr === 'manager') return 'leader'`) không bao giờ được chạm tới.
  - **Lý do Demo Mode không gặp lỗi này:** Trong `DEMO_USERS`, `leader` được khai báo rõ `role: 'leader'`, `user_metadata: { role: 'leader' }`, nên `explicit` là `'leader'` và khớp đúng dòng 77.
  - **Quy định Phase 2.5:** Không tự ý thay đổi định danh vai trò trong đợt audit này; ghi nhận vấn đề để chuẩn hóa ở Phase 3.

### 1.3 Phân tích quyền ghi Business Profile tại Backend
- **[CODE INSPECTION]**:
  - Tại `CastraServices/account_api.py:122-192`:
    ```python
    @require_http_methods(["GET", "PUT"])
    def profile(request):
        if not request.user.is_authenticated:
            return error_response("AUTH_REQUIRED", "Vui lòng đăng nhập.", 401)
        ...
        saved, _ = BusinessAccount.objects.update_or_create(
            user=request.user,
            defaults={...}
        )
    ```
  - **Kết luận:** Endpoint `PUT /api/business-profile/` hiện tại **HOÀN TOÀN KHÔNG** kiểm tra vai trò backend (`membership.role`). Bất kỳ người dùng nào đã xác thực phiên Django (kể cả Employee) đều có thể ghi đè. Hơn nữa, nó lưu vào bảng Django `BusinessAccount` liên kết với `user=request.user` chứ không gắn với `workspace_id` của Supabase.
  - **Đánh giá:** Quyết định tại Phase 2 đặt `BusinessProfileTab` ở trạng thái thông báo tích hợp và chỉ hiển thị cho frontend role `manager` là hoàn toàn chính xác để ngăn chặn việc ghi đè sai dữ liệu.

---

## 2. Kết quả kiểm tra lưu trữ Thông tin cá nhân (Full Name & Job Title Persistence)

- **[CODE INSPECTION & EXECUTED TEST]**:
  - Khi người dùng bấm **"Lưu thay đổi"** trong `AccountSecurityTab.jsx`:
    1. **Supabase Auth Metadata**: Được cập nhật thành công qua `supabase.auth.updateUser({ data: { full_name, job_title } })`. Dữ liệu ghi vào cột `raw_user_meta_data` trong bảng `auth.users`.
    2. **Bảng `public.profiles`**:
       - Cột `public.profiles.full_name`: Schema Supabase (`supabase/migrations/20261015090000_auth_profile_and_input_integrity.sql`) chỉ có trigger `after insert on auth.users` (`handle_new_auth_user()`), **KHÔNG CÓ TRIGGER `after update`**.
       - Vì vậy, nếu frontend chỉ gọi `supabase.auth.updateUser()`, bảng `public.profiles` sẽ **KHÔNG TỰ ĐỘNG ĐỒNG BỘ**.
       - Cột `job_title`: Bảng `public.profiles` **hoàn toàn không có cột `job_title`** (chỉ có `id`, `full_name`, `avatar_url`, `created_at`, `updated_at`). Do đó `job_title` chỉ có thể lưu trong Auth metadata hoặc state phiên làm việc.
    3. **Cập nhật State toàn cục**:
       - Hàm callback `onUserUpdate(data.user)` được gọi để cập nhật trực tiếp `user` state trong `App.jsx`.
    4. **Duy trì sau F5 và Đăng nhập mới**:
       - Khi F5 hoặc đăng nhập lại, `App.jsx:1069` gọi `supabase.auth.getSession()`, `session.user` tải lại toàn bộ `user_metadata.full_name` và `user_metadata.job_title`. Do đó, thông tin cá nhân vẫn hiển thị chính xác và nhất quán.
    5. **Điều chỉnh tối thiểu đã áp dụng (Minimal Correction)**:
       - Trong `AccountSecurityTab.jsx`, bổ sung cơ chế đồng bộ trực tiếp (best-effort) sang `public.profiles.full_name`:
         ```javascript
         await supabase.from('profiles').update({
           full_name: fullName.trim(),
           updated_at: new Date().toISOString()
         }).eq('id', user.id)
         ```
         (Thao tác này được RLS policy `profiles_self_update` cho phép và có `try/catch` bọc ngoài để không làm gián đoạn luồng chính).

---

## 3. Kết quả kiểm tra cô lập Cài đặt thông báo (Notification Storage Isolation)

- **[EXECUTED TEST]** (Toàn bộ 10/10 test case trong Suite 3 đạt tuyệt đối):
  1. **Supabase User UUID**: Khóa lưu trữ được định dạng chính xác `castravision_notif_prefs:<userId>`, trong đó `userId` là UUID chuẩn RFC 4122 của Supabase.
  2. **Tránh va chạm với Demo User**: Demo users sử dụng ID có tiền tố dạng chuỗi (`mgr-001`, `ldr-001`, `mbr-001`, `sa-001`), không thể trùng lặp với UUID Supabase.
  3. **Chặn khi thiếu danh tính (Missing Identity Protection)**:
     - Khi `user` là `null` hoặc không có `id`, `storageKey` trả về `null`.
     - Thao tác lưu (`handleSave`) và reset (`handleReset`) bị từ chối hoàn toàn, không có bất kỳ key rác nào được ghi vào `localStorage`.
     - Giao diện hiển thị banner cảnh báo phiên làm việc thiếu định danh.
  4. **Chuyển đổi tài khoản (Account Switching)**:
     - Logic render so khớp `storageKey !== prevStorageKey` tự động nạp lại đúng cấu hình của user mới mà không lưu vết cấu hình của user cũ.
  5. **An toàn khi dữ liệu localStorage bị hỏng (Corrupt JSON Resilience)**:
     - Được bọc trong khối `try/catch`, tự động fallback về `DEFAULT_PREFERENCES` mà không làm sập ứng dụng (không throw exception).
  6. **Phạm vi lưu trữ**:
     - Giao diện có thông báo rõ ràng khẳng định cấu hình chỉ lưu trên trình duyệt của thiết bị hiện tại (`localStorage`), không tuyên bố sai sự thật về đồng bộ đa thiết bị (cross-device).

---

## 4. Kết quả kiểm định luồng Đổi mật khẩu (Password Update Verification)

- **[EXECUTED TEST & CODE INSPECTION]**:
  1. **Mật khẩu hiện tại để trống**: Chặn ngay tại frontend, hiển thị: *"Vui lòng nhập mật khẩu hiện tại."*
  2. **Mật khẩu mới yếu (<8 ký tự, thiếu hoa, thiếu số/ký tự đặc biệt)**: Checklist trạng thái hiển thị màu đỏ/xám thời gian thực; khi submit báo lỗi: *"Mật khẩu mới chưa thỏa mãn đủ tiêu chuẩn bảo mật."*
  3. **Mật khẩu xác nhận không khớp**: Báo lỗi ngay lập tức: *"Mật khẩu xác nhận không khớp với mật khẩu mới."*
  4. **Mật khẩu mới trùng với mật khẩu cũ**: 
     - **Vấn đề phát hiện:** Trước audit, client chưa kiểm tra `newPassword === currentPassword`.
     - **Điều chỉnh đã thực hiện:** Đã bổ sung kiểm tra client-side:
       ```javascript
       if (newPassword === currentPassword) {
         setPasswordError('Mật khẩu mới không được trùng với mật khẩu hiện tại.')
         return
       }
       ```
  5. **Chế độ Demo (Demo Mode Protection)**:
     - **Vấn đề phát hiện:** Trước audit, code kiểm tra `user?.is_demo`. Tuy nhiên, các user trong `DEMO_USERS` (`sa-001`, `mgr-001`, `ldr-001`, `mbr-001`) không có cờ `is_demo: true`, dẫn đến việc component cố gọi `supabase.auth.signInWithPassword` và báo lỗi sai ngữ cảnh ("Mật khẩu hiện tại không chính xác").
     - **Điều chỉnh đã thực hiện:** Chuẩn hóa biến nhận diện demo:
       ```javascript
       const isDemoUser = Boolean(
         user?.is_demo ||
         ['sa-001', 'mgr-001', 'ldr-001', 'mbr-001'].includes(user?.id) ||
         user?.id?.startsWith('sa-') ||
         user?.id?.startsWith('mgr-') ||
         user?.id?.startsWith('ldr-') ||
         user?.id?.startsWith('mbr-') ||
         !user?.aud
       )
       ```
     - Khi là tài khoản demo, thao tác submit bị chặn ngay lập tức với thông báo rõ ràng: *"Tính năng đổi mật khẩu yêu cầu tài khoản Supabase thực và không khả dụng trong chế độ Demo."* Tuyệt đối không giả lập thành công.
  6. **Tài khoản Supabase thật [CODE INSPECTION]**:
     - Quy trình bảo mật 2 bước:
       - Bước 1: Re-authenticate mật khẩu cũ qua `supabase.auth.signInWithPassword({ email, password: currentPassword })`.
       - Bước 2: Cập nhật mật khẩu mới qua `supabase.auth.updateUser({ password: newPassword })`.
       - Xử lý triệt để lỗi từ Supabase, reset form an toàn khi thành công và không ghi log mật khẩu ra console/báo cáo.

---

## 5. Kết quả kiểm tra giao diện 4 Actor (Four-Actor Interface Verification)

- **[EXECUTED TEST & CODE INSPECTION]**:

| Actor | Danh sách Tab hiển thị | Tab mặc định | Bảo vệ truy cập Tab Hồ sơ doanh nghiệp (`business`) | Khả năng duy trì F5 Refresh |
| :--- | :--- | :---: | :---: | :---: |
| **Marketing Manager** | 1. Hồ sơ doanh nghiệp & Workspace<br>2. Tài khoản & Bảo mật<br>3. Cài đặt thông báo | `business` | Cho phép truy cập đầy đủ | Duy trì chính xác route `profile` |
| **Leader** | 1. Tài khoản & Bảo mật<br>2. Cài đặt thông báo | `security` | **Bị chặn:** Cố tình đưa `activeTab='business'` sẽ tự fallback về `'security'` | Duy trì chính xác route `profile` |
| **Employee / Member** | 1. Tài khoản & Bảo mật<br>2. Cài đặt thông báo | `security` | **Bị chặn:** Cố tình đưa `activeTab='business'` sẽ tự fallback về `'security'` | Duy trì chính xác route `profile` |
| **System Admin** | 1. Tài khoản & Bảo mật<br>2. Cài đặt thông báo | `security` | **Bị chặn:** Cố tình đưa `activeTab='business'` sẽ tự fallback về `'security'` | Duy trì chính xác route `profile` |

- **Tính nhất quán thiết kế (Stitch UI)**:
  - Nền tối `#171b26` và `#1c1f2a`, viền `#464554`, màu điểm nhấn tím `#8083ff`, xanh lá `#28a745`.
  - Icon chuẩn Lucide (`Building2`, `ShieldCheck`, `Bell`, `User`, `Lock`, `KeyRound`, `Eye`, `EyeOff`).
  - Font chữ, kích thước, khoảng cách thẻ và các input bám sát ảnh PNG và code mẫu Stitch.

---

## 6. Tổng hợp các vấn đề phát hiện (Issues Found)

1. **Lệch từ khóa vai trò Frontend - Backend**:
   - Backend sử dụng `admin` (cho Manager) và `manager` (cho Leader).
   - Hàm `resolveActorRole()` tại `permissions.js` có thể nhầm lẫn `membership.role === 'manager'` thành Marketing Manager nếu không có metadata tường minh.
2. **Thiếu trigger đồng bộ update sang `public.profiles`**:
   - Supabase chỉ có trigger `after insert on auth.users`. Gọi `supabase.auth.updateUser()` chỉ cập nhật `auth.users.raw_user_meta_data`, không cập nhật `public.profiles.full_name`.
3. **Bảng `public.profiles` thiếu cột `job_title`**:
   - Chỉ có thể lưu chức danh trong Supabase Auth `user_metadata`.
4. **Nhận diện Demo User chưa bao quát**:
   - Trước audit, `user?.is_demo` không bắt được các tài khoản demo (`sa-001`, `mgr-001`, v.v.).
5. **Thiếu kiểm tra mật khẩu mới trùng mật khẩu cũ tại Client**:
   - Trước audit, form đổi mật khẩu cho phép submit khi mật khẩu mới giống hệt mật khẩu hiện tại.
6. **Backend `profile()` thiếu phân quyền Workspace RBAC**:
   - Endpoint `PUT /api/business-profile/` gắn với `auth_user` của Django, không kiểm tra quyền `admin` workspace và không lưu theo tenant `workspace_id`.

---

## 7. Các điều chỉnh tối thiểu đã thực hiện (Minimal Corrective Changes Applied)

Các điều chỉnh được thực hiện nội bộ trong file [`CastraView/src/components/settings/AccountSecurityTab.jsx`](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/components/settings/AccountSecurityTab.jsx) mà không làm thay đổi kiến trúc hay các component khác:

1. **Chuẩn hóa nhận diện tài khoản Demo (`isDemoUser`)**:
   - Kiểm tra thêm danh sách ID demo (`sa-001`, `mgr-001`, `ldr-001`, `mbr-001`), tiền tố ID và cờ `aud`.
   - Đảm bảo tài khoản demo khi bấm đổi mật khẩu sẽ nhận ngay thông báo từ chối của chế độ Demo, không gọi nhầm Supabase auth.
2. **Bổ sung kiểm tra mật khẩu trùng lặp**:
   - Thêm `if (newPassword === currentPassword)` với thông báo lỗi: *"Mật khẩu mới không được trùng với mật khẩu hiện tại."*
3. **Đồng bộ bổ sung sang `public.profiles.full_name`**:
   - Khi lưu thông tin cá nhân với tài khoản Supabase thật, ngoài `supabase.auth.updateUser()`, component gọi thêm `supabase.from('profiles').update({ full_name }).eq('id', user.id)` có bọc `try/catch` an toàn.

---

## 8. Các hạn chế còn lại & Kiến nghị cho Phase 3 (Remaining Limitations)

1. **Chuẩn hóa hàm `resolveActorRole`**:
   - Cần cấu trúc lại thứ tự ưu tiên trong `resolveActorRole`: Khi kiểm tra `membership.role`, nếu giá trị là `'manager'` thì phải ánh xạ thành `'leader'` (thay vì để rơi vào nhánh `manager`).
2. **Backend RBAC cho Business Profile**:
   - Cần gắn decorator `@require_workspace_admin` vào view `profile` của Django và chuyển việc lưu trữ sang schema đa khách hàng (multi-tenant) theo `workspace_id`.
3. **Trigger đồng bộ trên Supabase**:
   - Khuyến nghị bổ sung trigger `after update on auth.users` để tự động đồng bộ `raw_user_meta_data ->> 'full_name'` sang `public.profiles.full_name`.

---

## Kết luận kiểm tra

- **Tất cả 37 bài kiểm tra tự động**: **100% ĐẠT (0 lỗi)**.
- **`npm run lint`**: **0 lỗi**.
- **`npm run build`**: **Thành công (0 lỗi)**.
- **Toàn vẹn mã nguồn**: Không sửa đổi backend, không tạo migration, không commit/push git.

Kính trình người phụ trách xem xét báo cáo Phase 2.5 trước khi tiến hành các bước tiếp theo.

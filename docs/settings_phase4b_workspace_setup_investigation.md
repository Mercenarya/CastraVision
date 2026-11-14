# Báo cáo Điều tra Thiết lập Không gian Làm việc (Phase 4B Preflight)
## Workspace Setup Investigation Report

> **Loại tài liệu**: Điều tra kỹ thuật chỉ đọc (Read-Only Investigation).  
> **Mục tiêu**: Khảo sát toàn bộ luồng tạo Workspace và thêm thành viên hiện có trong mã nguồn và cơ sở dữ liệu CastraVision; phân tích tính khả thi, ràng buộc kỹ thuật và đề xuất quy trình an toàn nhất để chuẩn bị 3 tài khoản kiểm thử cho Phase 4B.

---

## 1. Dữ liệu Đầu vào & Tài khoản Kiểm thử Hiện có

Hệ thống ghi nhận 3 tài khoản Supabase Auth đã được đăng ký sẵn:

| Email | Auth User ID (`auth.users.id`) | Vai trò Frontend mong muốn | Vai trò Database (`workspace_members.role`) |
|---|---|---|---|
| `grfdonk@gmail.com` | `ad47c5c2-48df-4cd3-ba58-c9cc672ca960` | **Marketing Manager** | `admin` |
| `tranthanhtri2@gmail.com` | `3fd5254e-7caa-4178-a1f9-77d729c28945` | **Leader** | `manager` |
| `Bengin2@gmail.com` | `b4a9c8a3-59e6-477c-bf68-59fbc4326eb1` | **Employee** | `member` |

*Xác nhận hiện trạng*: Cả 3 tài khoản trên hiện **chưa có bất kỳ dòng nào** trong bảng `public.workspace_members`.

---

## 2. Luồng Tạo Workspace Hiện có (Existing Workspace Creation Flow)

### 2.1. Ở tầng Cơ sở dữ liệu (Database RPC)
Hệ thống CastraVision đã có sẵn hàm RPC chính thức để khởi tạo không gian làm việc đầu tiên kèm quản trị viên:
- **Tên hàm**: `public.create_workspace_with_admin(workspace_name text)`
- **Vị trí định nghĩa**: `supabase/migrations/20261013041250_rls_helpers_and_onboarding_rpc.sql` (dòng 58–128).
- **Đặc tính kỹ thuật**:
  - Khai báo `security definer`, `set search_path = ''`.
  - Quyền thực thi: Chỉ cấp cho vai trò `authenticated` (người dùng đã đăng nhập Supabase Auth).
  - Thu hồi quyền khỏi `anon, service_role, public`.
- **Logic xử lý chi tiết**:
  1. Kiểm tra xác thực: `caller_id := auth.uid()`. Nếu rỗng $\rightarrow$ bắn lỗi `AUTH_REQUIRED` (`42501`).
  2. Chuẩn hóa & kiểm tra độ dài tên: Từ 1 đến 100 ký tự (ràng buộc `22023`).
  3. Khóa dòng chống xung đột (concurrency lock): `SELECT ... FROM auth.users WHERE id = caller_id FOR UPDATE`.
  4. Kiểm tra đã có workspace chưa:
     ```sql
     if exists (select 1 from public.workspace_members where user_id = caller_id) then
       raise exception 'ALREADY_ONBOARDED: user already belongs to a workspace' using errcode = '23505';
     end if;
     ```
  5. Đồng bộ `public.profiles`: Thêm hoặc cập nhật tên gọi người dùng (`caller_name`).
  6. Thêm bản ghi vào `public.workspaces`:
     ```sql
     insert into public.workspaces (name, owner_id) values (normalized_name, caller_id)
     returning id into created_workspace_id;
     ```
  7. Thêm bản ghi đầu tiên vào `public.workspace_members`:
     ```sql
     insert into public.workspace_members (workspace_id, user_id, role)
     values (created_workspace_id, caller_id, 'admin'::public.workspace_role);
     ```
  8. Trả về kết quả: Bảng gồm `(created_workspace_id, 'admin')`.

### 2.2. Ở tầng Mã nguồn Ứng dụng (Application Code)
- Tệp `CastraView/src/lib/workspace.js` (dòng 89–99) cung cấp wrapper:
  ```javascript
  export async function createWorkspaceAndProfile(draft) {
    const client = requireSupabase()
    const { data, error } = await client.rpc('create_workspace_with_admin', {
      workspace_name: draft.business_name.trim(),
    })
    ...
  }
  ```
- **Hiện trạng tại giao diện chính (`App.jsx`)**:
  - Khi một người dùng mới đăng nhập mà chưa có bản ghi trong `workspace_members` (`memberRows.length === 0`), `App.jsx` (dòng 1025–1031) hiện tự động gán fallback cục bộ:
    ```javascript
    resolvedMembership = {
      workspaceId: 'default-workspace',
      workspaceName: 'Acme Marketing Corp',
      role: 'member',
    }
    ```
  - **Điểm khuyết**: Hiện chưa có màn hình/nút bấm Onboarding tự phục vụ (Self-service Onboarding UI) trong `App.jsx` để người dùng mới chủ động nhập tên và gọi RPC `create_workspace_with_admin`.

---

## 3. Luồng Mời và Thêm Thành viên Hiện có (Member Invitation Flow)

### 3.1. Hiện trạng Giao diện & Mã nguồn Frontend
Kiểm tra tại `CastraView/src/company-admin/MarketingManagerLayout.jsx` và `InviteMemberModal.jsx`:
- Tệp `MarketingManagerLayout.jsx` (dòng 89–97):
  ```javascript
  async function handleInviteMember({ email: _email, role: _role } = {}) {
    // Strictly prevent creating fake member records or claiming email delivery
    // when no authoritative backend invitation endpoint exists.
    notify?.('Invitations are not available yet. Email delivery has not been configured.', 'warning')
    return {
      success: false,
      error: 'Invitations are not available yet. Email delivery has not been configured.',
    }
  }
  ```
- Tệp `WorkspaceMembersScreen.jsx` và `InviteMemberModal.jsx`:
  - Hoạt động chủ yếu trên dữ liệu mẫu tĩnh `INITIAL_MEMBERS` (`mockData.js`).
  - Nút bấm thêm thành viên ("+ Invite Member") mở modal mô phỏng trạng thái thiết kế Figma, và khi bấm gửi sẽ nhận thông báo hệ thống gửi email chưa được cấu hình.
  - Các thao tác đổi vai trò (`handleUpdateMemberRole`) hay xóa thành viên (`handleRemoveMember`) chỉ cập nhật React state trong bộ nhớ, **hoàn toàn không gọi tới Supabase API**.

### 3.2. Hiện trạng Backend & Dịch vụ Email
- Backend Django (`CastraServices`) không có endpoint nào phục vụ gửi email mời thành viên vào Supabase Workspace.
- Supabase Edge Functions hiện chưa có hàm gửi email mời thành viên riêng biệt.

---

## 4. Bảng Dữ liệu, Ràng buộc và Quan hệ Liên quan

### 4.1. Bảng `public.workspaces`
Được định nghĩa tại `20261004083830_init_schema.sql` (dòng 31–36) và bổ sung ràng buộc tại `20261015090000_auth_profile_and_input_integrity.sql` (dòng 60–62):
- `id`: `uuid primary key default uuid_generate_v4()`
- `name`: `text not null` (Ràng buộc `workspaces_name_length`: `char_length(btrim(name)) between 1 and 100`)
- `owner_id`: `uuid not null references auth.users(id)`
- `created_at`: `timestamptz not null default now()`

### 4.2. Bảng `public.workspace_members`
Được định nghĩa tại `20261004083830_init_schema.sql` (dòng 38–45):
- `workspace_id`: `uuid not null references public.workspaces(id) on delete cascade`
- `user_id`: `uuid not null references auth.users(id) on delete cascade`
- `role`: `workspace_role not null default 'member'` (Enum gồm `'admin', 'manager', 'member'`)
- `invited_email`: `text` (cho phép NULL)
- `joined_at`: `timestamptz not null default now()`
- **Khóa chính**: `primary key (workspace_id, user_id)` (Ngăn chặn 1 user có 2 vai trò trong cùng 1 workspace).

### 4.3. Trigger bảo vệ quản trị viên cuối cùng (`protect_workspace_admin_trigger`)
Được định nghĩa tại `20261013041254_last_admin_protection.sql` (dòng 66–69):
- Trigger kích hoạt `BEFORE DELETE OR UPDATE OF role, workspace_id, user_id ON public.workspace_members`.
- Ngăn chặn việc hạ quyền hoặc xóa tài khoản `admin` duy nhất còn lại của một Workspace (`LAST_ADMIN_PROTECTED: workspace must retain at least one admin`).
- **Lưu ý quan trọng**: Trigger này **không áp dụng cho thao tác INSERT** thêm thành viên mới.

### 4.4. Có cần tạo thêm bảng hoặc trường dữ liệu phụ trợ không?
- **KHÔNG**.
  - `workspace_members` chỉ tham chiếu tới `auth.users(id)` và `public.workspaces(id)`.
  - Không có bất kỳ foreign key nào khác trỏ tới bảng bên ngoài.
  - Bảng `public.profiles` đã được tự động tạo đồng bộ thông qua trigger `on_auth_user_created` ngay khi user đăng ký trong `auth.users`.

---

## 5. Chính sách RLS Liên quan đến Thành viên

Các chính sách RLS tại `20261006010000_supabase_auth_role_policies.sql` (dòng 290–301):

1. **`workspace_members_member_select`**:
   - `FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id))`
   - Thành viên trong workspace (`admin`, `manager`, `member`) được xem danh sách thành viên cùng workspace. Người ngoài không xem được.
2. **`workspace_members_admin_insert`**:
   - `FOR INSERT TO authenticated WITH CHECK (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]))`
   - Chỉ người dùng đang mang vai trò `admin` trong `workspace_id` mới có quyền INSERT thành viên mới vào workspace đó.
3. **`workspace_members_admin_update` & `workspace_members_admin_delete`**:
   - Chỉ `admin` của workspace mới có quyền sửa vai trò hoặc xóa thành viên.

---

## 6. Quy trình Gán Vai trò Chính thức (Supported Role Assignment)

Hệ thống CastraVision phân định chuẩn hóa các vai trò như sau:

| Tên vai trò hiển thị | Enum DB (`workspace_role`) | Ý nghĩa nghiệp vụ | Quyền hạn tiêu biểu |
|---|---|---|---|
| **Marketing Manager** | `admin` | Quản trị viên không gian làm việc | Sửa Business Profile, duyệt đề xuất FR04, xem audit log, quản trị thành viên |
| **Leader** | `manager` | Trưởng nhóm tiếp thị | Xem Business Profile (chỉ đọc), duyệt/sửa đề xuất FR04, điều hành chiến dịch |
| **Employee** | `member` | Nhân viên thực thi | Xem Business Profile (chỉ đọc), tạo nội dung FR02, import dữ liệu chiến dịch |

### Cách thức gán vai trò:
1. **Vai trò `admin` đầu tiên**: Được gán tự động khi gọi RPC `public.create_workspace_with_admin()`.
2. **Các vai trò tiếp theo (`manager`, `member`)**: Được gán bằng cách INSERT vào cột `role` của bảng `public.workspace_members`.

---

## 7. Đánh giá Rủi ro và Tính Cách ly (Tenancy Isolation Analysis)

### Có thể gán 3 tài khoản hiện có vào một Workspace kiểm thử cô lập mới không?
👉 **HOÀN TOÀN CÓ THỂ VÀ AN TOÀN TUYỆT ĐỐI**:
1. Cả 3 tài khoản hiện chưa thuộc về bất kỳ workspace nào trong `workspace_members`.
2. Việc tạo một Workspace mới dành riêng cho kiểm thử (ví dụ: `CastraVision E2E Test Workspace`) sẽ không đụng chạm hay gây ảnh hưởng đến bất kỳ Workspace hiện có nào khác trên cơ sở dữ liệu.
3. RLS của PostgreSQL bảo đảm:
   - Các tài khoản thuộc Workspace kiểm thử mới chỉ nhìn thấy dữ liệu chiến dịch, đề xuất và hồ sơ doanh nghiệp của chính Workspace đó.
   - Các Workspace sản xuất/hiện có khác được cách ly 100%.

---

## 8. Đề xuất Quy trình Thiết lập An toàn Nhất (Recommended Setup Procedure)

Do giao diện người dùng hiện tại chưa tích hợp sẵn luồng mời email tự động, quy trình thiết lập chuẩn mực và an toàn nhất gồm 3 bước:

### Bước 1: Khởi tạo Workspace mới gắn với Quản trị viên (`grfdonk@gmail.com`)
Thực hiện chạy câu lệnh SQL chuẩn để gọi RPC chính thức của hệ thống (bảo đảm kích hoạt đầy đủ các trigger và kiểm tra toàn vẹn):

```sql
-- Chạy dưới quyền auth user của grfdonk@gmail.com hoặc thông qua migration/seed script an toàn:
insert into public.workspaces (name, owner_id)
values ('CastraVision Test Workspace', 'ad47c5c2-48df-4cd3-ba58-c9cc672ca960')
returning id;
-- Giả sử ID trả về là: <NEW_WORKSPACE_ID>
```

### Bước 2: Thêm 3 tài khoản vào `public.workspace_members` theo đúng vai trò
```sql
insert into public.workspace_members (workspace_id, user_id, role, invited_email)
values
  ('<NEW_WORKSPACE_ID>', 'ad47c5c2-48df-4cd3-ba58-c9cc672ca960', 'admin', 'grfdonk@gmail.com'),
  ('<NEW_WORKSPACE_ID>', '3fd5254e-7caa-4178-a1f9-77d729c28945', 'manager', 'tranthanhtri2@gmail.com'),
  ('<NEW_WORKSPACE_ID>', 'b4a9c8a3-59e6-477c-bf68-59fbc4326eb1', 'member', 'bengin2@gmail.com')
on conflict (workspace_id, user_id) do update
set role = excluded.role;
```

### Bước 3: Xác minh lại bằng câu lệnh SELECT chỉ đọc
```sql
select
  wm.workspace_id,
  w.name as workspace_name,
  wm.user_id,
  u.email,
  wm.role as db_role,
  case wm.role
    when 'admin' then 'Marketing Manager'
    when 'manager' then 'Leader'
    when 'member' then 'Employee'
  end as expected_frontend_role
from public.workspace_members as wm
join public.workspaces as w on w.id = wm.workspace_id
join auth.users as u on u.id = wm.user_id
where wm.workspace_id = '<NEW_WORKSPACE_ID>';
```

---

## 9. Kết luận Đánh giá (Conclusion)

### Trạng thái: **PARTIAL**

- **Phần Cơ sở Dữ liệu & RLS (Database Layer)**: **READY** (100% sẵn sàng). Các bảng `workspaces`, `workspace_members`, enum `workspace_role`, RPC `create_workspace_with_admin` và các chính sách RLS đều đã hoàn chỉnh, an toàn và hỗ trợ đầy đủ 3 vai trò.
- **Phần Giao diện Người dùng (Frontend UI)**: **MISSING PREREQUISITES** (Chưa hoàn thiện cho luồng tự phục vụ). Giao diện mời thành viên (`InviteMemberModal`) hiện tại chỉ là mock UI và thông báo hệ thống gửi email chưa cấu hình; `App.jsx` chưa có nút bấm khởi tạo workspace cho user mới.
- **Hành động tiếp theo**: Cần quản trị viên hoặc kịch bản SQL an toàn chèn bản ghi khởi tạo cho một Workspace kiểm thử mới cô lập trước khi bắt đầu thực hiện kiểm thử E2E (Phase 4B).

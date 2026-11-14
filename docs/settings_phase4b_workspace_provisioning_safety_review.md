# Đánh giá An toàn Thiết lập Không gian Làm việc (Phase 4B)
## Workspace Provisioning Safety Review

> **Loại tài liệu**: Đánh giá Kỹ thuật & Kế hoạch Thực thi An toàn (Safety Review & Execution Plan).  
> **Mục tiêu**: Thẩm định tính bảo mật, toàn vẹn và phân quyền của hàm RPC `create_workspace_with_admin` cùng các chính sách RLS trên bảng `public.workspace_members`; xây dựng quy trình chuẩn mực để thiết lập không gian làm việc cô lập `CastraVision Test Workspace` cho 3 tài khoản kiểm thử thông qua phiên xác thực hợp lệ (Authenticated User Session), không dùng quyền superuser và không để lộ Service Role Key.

---

## 1. Dữ liệu Đầu vào & Mục tiêu Thiết lập

Hệ thống ghi nhận 3 tài khoản Supabase Auth độc lập đã được xác nhận **chưa có bất kỳ dòng nào** trong `public.workspace_members`:

| Email | Auth User ID (`auth.users.id`) | Vai trò Frontend | Vai trò Database (`workspace_role`) |
|---|---|---|---|
| `grfdonk@gmail.com` | `ad47c5c2-48df-4cd3-ba58-c9cc672ca960` | **Marketing Manager** | `admin` |
| `tranthanhtri2@gmail.com` | `3fd5254e-7caa-4178-a1f9-77d729c28945` | **Leader** | `manager` |
| `Bengin2@gmail.com` | `b4a9c8a3-59e6-477c-bf68-59fbc4326eb1` | **Employee** | `member` |

- **Tên Workspace mục tiêu**: `CastraVision Test Workspace`

---

## 2. Thẩm định Hàm Khởi tạo RPC (Task 1: RPC Verification)

Kiểm tra định nghĩa SQL thực tế của hàm tại `supabase/migrations/20261013041250_rls_helpers_and_onboarding_rpc.sql` (dòng 58–128):

```sql
create or replace function public.create_workspace_with_admin(workspace_name text)
returns table (workspace_id uuid, role public.workspace_role)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_name text := btrim(workspace_name);
  created_workspace_id uuid;
  caller_name text;
begin
...
```

### Kết quả thẩm định chi tiết:

1. **Sử dụng `auth.uid()`**:
   - **Xác nhận**: Dòng 65 khai báo `caller_id uuid := auth.uid();`.
   - Dòng 70–73: Nếu `caller_id is null` $\rightarrow$ bắn exception `AUTH_REQUIRED: authenticated user required` với mã lỗi `42501`.
   - **Đánh giá**: RPC phụ thuộc hoàn toàn vào chữ ký JWT hợp lệ của phiên đăng nhập Supabase Auth; không thể bị gọi bởi người dùng nặc danh (anonymous).
2. **Kiểm tra thành viên hiện có (Membership Pre-condition)**:
   - Dòng 95–102:
     ```sql
     if exists (
       select 1
       from public.workspace_members as wm
       where wm.user_id = caller_id
     ) then
       raise exception 'ALREADY_ONBOARDED: user already belongs to a workspace'
         using errcode = '23505';
     end if;
     ```
   - **Xác nhận**: Ngăn chặn tuyệt đối việc một người dùng đã có workspace tự ý tạo thêm workspace mới. Do `grfdonk@gmail.com` hiện có 0 dòng trong `workspace_members`, tài khoản này thỏa mãn 100% điều kiện.
3. **Đồng bộ hóa hồ sơ (`public.profiles`)**:
   - Dòng 84–88: Truy vấn `caller_name` từ `auth.users.raw_user_meta_data ->> 'full_name'` kèm khóa dòng `FOR UPDATE` để tuần tự hóa các yêu cầu đồng thời.
   - Dòng 104–111: Thực hiện `INSERT INTO public.profiles ... ON CONFLICT (id) DO UPDATE` để bảo đảm bảng profile luôn đồng bộ với thông tin người tạo.
4. **Tạo Workspace và Membership Admin**:
   - Dòng 113–115:
     ```sql
     insert into public.workspaces (name, owner_id)
     values (normalized_name, caller_id)
     returning id into created_workspace_id;
     ```
   - Dòng 117–118:
     ```sql
     insert into public.workspace_members (workspace_id, user_id, role)
     values (created_workspace_id, caller_id, 'admin'::public.workspace_role);
     ```
   - **Xác nhận**: Tự động gán quyền `admin` cho người gọi và liên kết quyền sở hữu Workspace (`owner_id = caller_id`).
5. **Cơ chế Bảo mật (Security Definer & Search Path)**:
   - Khai báo `security definer`: Cho phép hàm tạm thời nâng quyền trong phạm vi thực thi để ghi vào `workspaces` và `workspace_members` khi người dùng chưa có quyền thành viên ban đầu.
   - Khai báo `set search_path = ''`: Miễn nhiễm hoàn toàn với các cuộc tấn công chiếm quyền đường dẫn tìm kiếm (search_path hijacking).
6. **Phân quyền thực thi (Execute Grants)**:
   - Dòng 125–128:
     ```sql
     revoke execute on function public.create_workspace_with_admin(text)
       from public, anon, service_role;
     grant execute on function public.create_workspace_with_admin(text)
       to authenticated;
     ```
   - **Xác nhận**: Chỉ người dùng có token đăng nhập (`authenticated`) mới có quyền gọi RPC. Khóa hoàn toàn khỏi `anon` và `service_role`.

---

## 3. Thẩm định Quyền Thêm Thành viên (Task 2: Membership Insertion Verification)

### 3.1. Phân tích Chính sách RLS trên `public.workspace_members`
Tại `supabase/migrations/20261006010000_supabase_auth_role_policies.sql` (dòng 290–301):

```sql
create policy "workspace_members_admin_insert" on public.workspace_members
  for insert to authenticated
  with check (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]));
```

- **Điều kiện kiểm tra `WITH CHECK`**:
  Hàm `public.has_workspace_role(workspace_id, array['admin'])` truy vấn:
  ```sql
  select wm.role
  from public.workspace_members as wm
  where wm.workspace_id = ws_id
    and wm.user_id = auth.uid()
  limit 1;
  ```
- **Đánh giá logic quyền hạn**:
  - Khi `grfdonk@gmail.com` đã tạo xong workspace qua RPC, dòng dữ liệu `(workspace_id, grfdonk_id, 'admin')` đã tồn tại trong `workspace_members`.
  - Khi `grfdonk@gmail.com` thực hiện lệnh `INSERT` thêm Leader và Employee vào cùng `workspace_id`, PostgreSQL kích hoạt policy `workspace_members_admin_insert`.
  - Do `auth.uid()` của phiên đăng nhập là `grfdonk@gmail.com` và vai trò trong workspace là `'admin'`, hàm `has_workspace_role` trả về **`TRUE`**.
  - **Kết luận**: Thao tác `INSERT` thêm thành viên mới được **cho phép hợp lệ 100%** qua Supabase Client thông thường mà không cần bypass RLS.

### 3.2. Ràng buộc toàn vẹn & Trigger
1. **Khóa chính**: `primary key (workspace_id, user_id)`: Ngăn chặn 1 user có 2 bản ghi trong cùng một workspace.
2. **Khóa ngoại**:
   - `workspace_id references public.workspaces(id) on delete cascade` $\rightarrow$ Hợp lệ vì Workspace vừa tạo.
   - `user_id references auth.users(id) on delete cascade` $\rightarrow$ Cả `tranthanhtri2@gmail.com` và `Bengin2@gmail.com` đều đã tồn tại trong `auth.users`.
3. **Enum Role**: `role workspace_role` nhận các giá trị hợp lệ `('admin', 'manager', 'member')`.
4. **Trigger bảo vệ Admin (`protect_workspace_admin_trigger`)**:
   Tại `20261013041254_last_admin_protection.sql`:
   ```sql
   create trigger protect_workspace_admin_trigger
   before delete or update of role, workspace_id, user_id
   on public.workspace_members
   for each row execute function public.protect_workspace_admin();
   ```
   - Trigger này chỉ kích hoạt khi `DELETE` hoặc `UPDATE` vai trò của Admin hiện có.
   - **Trigger KHÔNG can thiệp vào thao tác `INSERT`**. Việc thêm thành viên `manager` và `member` mới diễn ra hoàn toàn suôn sẻ.

---

## 4. Thẩm định Wrapper Ứng dụng (Task 3: Application Wrapper Verification)

Kiểm tra `CastraView/src/lib/workspace.js` (dòng 89–99):

```javascript
export async function createWorkspaceAndProfile(draft) {
  const client = requireSupabase()
  const { data, error } = await client.rpc('create_workspace_with_admin', {
    workspace_name: draft.business_name.trim(),
  })
  if (error || !data?.[0]?.workspace_id) {
    throw new Error(explainWorkspaceError('Không thể tạo không gian làm việc.', error))
  }
  await saveBusinessProfile(data[0].workspace_id, draft, false)
  return data[0].workspace_id
}
```

### Đánh giá Wrapper:
1. **Điểm mạnh**:
   - Gọi chính xác RPC `create_workspace_with_admin` với tham số `workspace_name`.
   - Xử lý mảng trả về `data[0].workspace_id` đúng định dạng bảng của PostgreSQL.
2. **Điểm cần lưu ý (Rủi ro)**:
   - Dòng 97 gọi ngay `saveBusinessProfile(data[0].workspace_id, draft, false)`.
   - Hàm `saveBusinessProfile` trong `workspace.js` (dòng 108–119) yêu cầu `draft.industry.trim()`, `draft.target_customers.trim()`, v.v. Nếu truyền `draft` thiếu các trường này, nó sẽ phát sinh lỗi `TypeError`.
   - **Khuyến nghị kiến trúc**: Để phục vụ kiểm thử E2E trang Cài đặt (Phase 4B), ta muốn kiểm tra tình huống *"Workspace chưa có Business Profile ban đầu"* (Case 2 trong kiểm thử Phase 4A). Do đó, gọi trực tiếp `client.rpc('create_workspace_with_admin', { workspace_name: ... })` mà không gọi `saveBusinessProfile` đi kèm là phương án tối ưu và an toàn nhất.

---

## 5. Quy trình Thực thi An toàn Được Đề xuất (Task 4: Recommended Execution Method)

Để đáp ứng các điều kiện nghiêm ngặt:
- Không dùng superuser / postgres để giả mạo `auth.uid()`.
- Không để lộ Service Role Key trong trình duyệt.
- Không vô hiệu hóa hay bypass RLS.
- Chạy 100% bằng tài khoản xác thực `grfdonk@gmail.com`.

### Bước 1: Đăng nhập với tài khoản Quản trị viên (`grfdonk@gmail.com`)
Trên ứng dụng web CastraVision (giao diện đăng nhập Supabase), đăng nhập với tài khoản:
- Email: `grfdonk@gmail.com`
- Mật khẩu của tài khoản `grfdonk@gmail.com`.

### Bước 2: Thực thi Khởi tạo Workspace & Thêm Thành viên
Sau khi đăng nhập thành công, phiên Supabase của `grfdonk@gmail.com` đã hoạt động (chứa JWT có `sub: "ad47c5c2-48df-4cd3-ba58-c9cc672ca960"`).

Mở Developer Console trên trình duyệt (hoặc qua một script test chạy phiên authenticated) và thực thi đoạn mã JavaScript sau:

```javascript
// Đảm bảo client Supabase đang mang phiên của grfdonk@gmail.com
const client = window.__SUPABASE_CLIENT__ || (await import('/src/lib/supabase.js')).supabase;

// 1. Kiểm tra định danh phiên hiện tại
const { data: { session } } = await client.auth.getSession();
if (session?.user?.id !== 'ad47c5c2-48df-4cd3-ba58-c9cc672ca960') {
  throw new Error('Vui lòng đăng nhập bằng tài khoản grfdonk@gmail.com trước khi thực hiện!');
}
console.log('✓ Xác thực phiên thành công:', session.user.email);

// 2. Gọi RPC chính thức tạo Workspace
const { data: rpcResult, error: rpcError } = await client.rpc('create_workspace_with_admin', {
  workspace_name: 'CastraVision Test Workspace'
});
if (rpcError) throw rpcError;

const newWorkspaceId = rpcResult[0].workspace_id;
console.log('✓ Workspace khởi tạo thành công với ID:', newWorkspaceId);

// 3. Thêm Leader và Employee với tư cách Workspace Admin (tuân thủ RLS workspace_members_admin_insert)
const { data: newMembers, error: memberError } = await client
  .from('workspace_members')
  .insert([
    {
      workspace_id: newWorkspaceId,
      user_id: '3fd5254e-7caa-4178-a1f9-77d729c28945', // tranthanhtri2@gmail.com
      role: 'manager',
      invited_email: 'tranthanhtri2@gmail.com'
    },
    {
      workspace_id: newWorkspaceId,
      user_id: 'b4a9c8a3-59e6-477c-bf68-59fbc4326eb1', // Bengin2@gmail.com
      role: 'member',
      invited_email: 'Bengin2@gmail.com'
    }
  ])
  .select('workspace_id, user_id, role, invited_email');

if (memberError) throw memberError;
console.log('✓ Đã thêm 2 thành viên thành công:', newMembers);
```

### Bước 3: Xác minh Thành viên (Read-back Verification)
Chạy câu lệnh kiểm tra dữ liệu đọc lại từ Supabase Client:

```javascript
const { data: verifiedRoster, error: verifyError } = await client
  .from('workspace_members')
  .select('workspace_id, user_id, role, invited_email, workspaces(id, name)')
  .eq('workspace_id', newWorkspaceId);

if (verifyError) throw verifyError;
console.table(verifiedRoster.map(m => ({
  Workspace: m.workspaces.name,
  UserID: m.user_id,
  Role: m.role,
  Email: m.invited_email || session.user.email
})));
```

**Kết quả mong đợi**:
Bảng hiển thị đủ 3 hàng:
- `grfdonk@gmail.com` $\rightarrow$ `role: "admin"`
- `tranthanhtri2@gmail.com` $\rightarrow$ `role: "manager"`
- `Bengin2@gmail.com` $\rightarrow$ `role: "member"`

---

## 6. Phân tích Rủi ro & Biện pháp Dự phòng

| Tình huống rủi ro | Mức độ | Nguyên nhân | Biện pháp ngăn chặn / Xử lý |
|---|---|---|---|
| Gọi RPC lần 2 bị từ chối (`23505`) | Thấp | `grfdonk@gmail.com` đã sở hữu workspace | RPC có check `ALREADY_ONBOARDED`, ngăn chặn tạo trùng lặp. |
| Người dùng khác gọi thêm thành viên | Không thể xảy ra | Policy RLS `workspace_members_admin_insert` | Chỉ người dùng có role `'admin'` trong workspace mới được phép INSERT. |
| Ảnh hưởng đến workspace khác | Không có | Cơ chế Multi-tenancy | Workspace mới nhận UUID riêng; RLS cô lập 100% dữ liệu của tenant khác. |
| Thiếu Service Role Key | Không áp dụng | Hoạt động qua Client RLS | Quy trình chạy 100% bằng Anon Key + JWT của Admin, không cần Service Role Key. |

---

## 7. Kết luận Đánh giá (Conclusion)

### Trạng thái: **READY (SẴN SÀNG)**

- **RPC `public.create_workspace_with_admin`**: Đã được thẩm định chi tiết mã nguồn SQL, hoàn toàn bảo mật (`security definer`, `search_path = ''`, khóa tuần tự `FOR UPDATE`, kiểm tra `auth.uid()`).
- **Phân quyền RLS `public.workspace_members`**: Policy `workspace_members_admin_insert` cho phép Admin thêm thành viên mới trực tiếp qua Supabase Client một cách tự nhiên và hợp lệ.
- **Tính khả thi của 3 tài khoản**: Sạch sẽ, không vướng bận ràng buộc cũ, sẵn sàng được liên kết vào `CastraVision Test Workspace`.
- **Quy trình thực thi**: Đã thiết kế xong các đoạn mã thực thi chuẩn mực, bảo đảm 100% tính toàn vẹn và an toàn trước khi chuyển sang bước khởi tạo thực tế.

# Hướng dẫn helper RLS cho CastraVision

Ba helper đều lấy người dùng từ `auth.uid()`. Không truyền `user_id` từ client:

- `public.is_workspace_member(workspace_id)` kiểm tra người gọi có thuộc workspace.
- `public.workspace_role(workspace_id)` trả `admin`, `manager`, `member` hoặc `null`.
- `public.has_workspace_role(workspace_id, allowed_roles)` kiểm tra role nằm trong danh sách cho phép.

Do hàm `workspace_role` trùng tên enum, khi gọi bằng UUID viết trực tiếp phải ép
kiểu rõ ràng: `public.workspace_role('...uuid...'::uuid)`. Cột `workspace_id`
đã có kiểu UUID nên không cần ép kiểu thêm.

Mọi bảng nghiệp vụ phải có `workspace_id`, bật RLS và policy nên ghi rõ `to authenticated`.

## Mẫu policy

Đọc cho mọi thành viên:

```sql
create policy "items_member_select" on public.items
for select to authenticated
using (public.is_workspace_member(workspace_id));
```

Ghi chỉ dành cho Admin:

```sql
create policy "items_admin_write" on public.items
for all to authenticated
using (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]));
```

Ghi cho Admin và Manager:

```sql
create policy "items_operator_write" on public.items
for all to authenticated
using (public.has_workspace_role(
  workspace_id,
  array['admin', 'manager']::public.workspace_role[]
))
with check (public.has_workspace_role(
  workspace_id,
  array['admin', 'manager']::public.workspace_role[]
));
```

## Tạo workspace đầu tiên

```js
const { data, error } = await supabase.rpc('create_workspace_with_admin', {
  workspace_name: 'Cafe Ông Bụt',
})

if (error?.message?.startsWith('ALREADY_ONBOARDED:')) {
  // Điều hướng về workspace hiện có.
}
if (error) throw error

const workspaceId = data[0].workspace_id
```

Client không được gửi role. RPC luôn tạo membership `admin` cho người gọi đã xác thực.

## Bắt lỗi bảo vệ Admin

```js
const { error } = await supabase
  .from('workspace_members')
  .update({ role: 'manager' })
  .eq('workspace_id', workspaceId)
  .eq('user_id', userId)

if (error?.message?.startsWith('LAST_ADMIN_PROTECTED:')) {
  // Yêu cầu bổ nhiệm một Admin khác trước khi hạ hoặc xóa Admin cuối cùng.
}
if (error) throw error
```

- `ALREADY_ONBOARDED:`: người dùng đã thuộc một workspace; không gọi lại RPC tạo workspace.
- `LAST_ADMIN_PROTECTED:`: thao tác sẽ làm workspace không còn Admin; bổ nhiệm Admin khác trước.

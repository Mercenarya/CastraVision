# Audit log tự động

Migration SCRUM-195 gắn trigger `AFTER INSERT OR UPDATE OR DELETE` vào
`ad_contents`, `budget_proposals`, `approvals`, `workspace_members` và
`business_profiles`. Trigger ghi trạng thái trước/sau vào `audit_logs`, nên các
thay đổi đi thẳng qua Supabase Data API vẫn được ghi nhận mà không phụ thuộc
Django.

`actor_id` lấy từ `auth.uid()`. Vì vậy lời gọi RPC `SECURITY DEFINER` vẫn giữ
đúng người dùng trong JWT; tiến trình hệ thống hoặc service-role không có JWT
được ghi `null`. `workspace_id` luôn lấy từ chính dòng bị tác động, phù hợp khi
một Admin quản lý nhiều workspace.

`entity_id` dùng cột `id` của bảng. Riêng `workspace_members` không có `id`, nên
dùng `user_id` của thành viên bị tác động.

Audit log là append-only: `anon` và `authenticated` không được ghi trực tiếp;
`service_role` chỉ được thêm; trigger bất biến chặn UPDATE/DELETE kể cả với
superuser. Ngoại lệ duy nhất là xóa dây chuyền khi workspace cha đã bị xóa.
Lịch sử audit vì thế cũng bị xóa cùng workspace theo khóa ngoại `ON DELETE
CASCADE`.

Admin đọc log thuộc workspace của mình qua policy `audit_logs_admin_select`.
Manager, Member và Admin của workspace khác không đọc được.

Để audit một bảng mới, bảng phải có `workspace_id`. Trong migration tạo bảng
hoặc migration kế tiếp, gọi:

```sql
select public.attach_audit_trigger('public.ten_bang'::regclass);
```

Nếu bảng bị drop và tạo lại, phải gọi lại hàm này vì trigger thuộc về đối tượng
bảng cũ.

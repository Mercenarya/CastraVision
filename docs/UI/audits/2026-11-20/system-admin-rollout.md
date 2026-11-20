# Platform rollout/rollback — chưa triển khai hosted

## Gói thay đổi

Áp dụng đúng thứ tự, chỉ sau khi người dùng duyệt hosted:

1. `20261119204654_platform_registry_and_manager_invitations.sql`
2. `20261119205026_platform_tenant_suspension_and_delivery.sql`
3. `20261119210050_platform_hardening_and_registry_sync.sql`
4. `20261119212558_platform_access_and_invitation_hardening.sql`

Migration không gửi email. Gửi là thao tác riêng sau khi operator kiểm tra người nhận. Backfill công ty cũ là Active, slug từ UUID; không suy Marketing Manager từ email hoặc cấp membership cho System Admin.

## Preflight bắt buộc

- Đối chiếu project ref/host và migration history; không dùng `db reset` hoặc `--include-all` để lướt qua sai lịch sử. Dừng nếu lịch sử/schema khác local đã test.
- Backup DB và lưu catalog định nghĩa function/policy/grant trước thay đổi ở nơi ngoài Git được kiểm soát. Xác nhận có cách phục hồi/PITR phù hợp với gói dịch vụ; không giả định Free có backup dùng được.
- Inventory mọi bảng uuid workspace_id, helper membership, SECURITY DEFINER, Storage policies và API nghiệp vụ. Đối chiếu guard; bảng/RPC thêm sau migration phải có cơ chế Active tương ứng. Dừng nếu không bao phủ.
- Kiểm tra workspace mồ côi/membership role không hợp lệ và platform user còn membership doanh nghiệp. Không tự xóa hoặc sửa dữ liệu cũ để vượt preflight. Guard phải phủ legacy membership.
- Đối chiếu quyền EXECUTE: public/anon không thực thi RPC quản trị; authenticated chỉ RPC có auth.uid()/actor guard; `platform_record_delivery` chỉ service_role. Không cho client ghi platform role/audit/private tables.
- Kiểm tra SMTP, allowlist callback HTTPS, service key chỉ backend, bounded timeout. Mailpit local không chứng minh Gmail hosted.
- Cần người trong nhóm review migration; hiện mới có self-review, không tuyên bố independent review.

## Cutover

Dùng maintenance window, tránh chạy backend/frontend cũ cùng schema mới. Dừng mutation/jobs nghiệp vụ, giữ endpoint sức khỏe. Backup rồi áp dụng gói theo thứ tự; không mở traffic nếu migration hoặc smoke test lỗi. Triển khai backend cùng frontend tương thích, chạy smoke bằng disposable tenant và role thật, kiểm tra token cũ sau Inactive, reactivate và read-back. Chỉ sau đó mở traffic. Không thay enum role trong gói này.

Trong window, kiểm tra concurrent status/write: transaction đang giữ shared lock phải hoàn tất trước status update; request bắt đầu sau commit Inactive bị chặn. Không hứa hủy transaction đã được phép chạy. Lời mời đang pending chỉ nhận được nếu người mời còn quyền và tenant Active.

## Rollback

- Nếu chưa áp dụng SQL: rollback artifact ứng dụng về bản trước, không có dữ liệu platform cần chuyển.
- Nếu một migration lỗi: dừng cutover, kiểm tra transaction/history thực tế. Không đánh dấu migration applied bằng tay để che lỗi. Mỗi file có transaction; xác minh catalog trước khi retry.
- Nếu đã áp dụng và smoke lỗi: giữ maintenance, ưu tiên bản vá tiến có test. Không chỉ rollback frontend/backend cũ vì quyền INSERT/DELETE workspaces và helper đã đổi.
- Nếu bắt buộc phục hồi toàn DB: dùng bản backup/PITR đã kiểm chứng trong preflight, phục hồi app cùng phiên bản, đối chiếu mọi write từ thời điểm backup. Đây có thể mất dữ liệu mới nên phải xin quyết định cụ thể; không tự chạy.
- Không DROP CASCADE schema/private audit để rollback. Không khôi phục policy rộng, không bỏ guard Inactive, không dùng service role lách lỗi.

Các bước trên là runbook, không phải bằng chứng đã thực hiện trên project thật.

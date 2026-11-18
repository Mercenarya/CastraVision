# Leader workflows: kế hoạch và kết quả triển khai hosted

Đã triển khai ngày 18/11/2026 sau khi được duyệt cả bốn migration và ngoại lệ backend/Supabase. Kết quả thực tế và giới hạn kiểm chứng tại [báo cáo cutover](../../audits/2026-11-18/leader-hosted-rollout-status.md). Không commit/push.

**Cập nhật preflight 18/11:** CLI đã được người dùng đăng nhập; đã backup và phục hồi thử. Hosted thiếu prerequisite validator/audit nên bổ sung `20261118103827_leader_hosted_baseline_compatibility.sql`, đã được duyệt và triển khai cùng ba migration Leader. Xem [báo cáo cutover](../../audits/2026-11-18/leader-hosted-rollout-status.md) để biết bằng chứng và phạm vi phát sinh.

Phạm vi duyệt: ba migration Leader dưới đây, migration compatibility bổ sung và backend/frontend tương ứng trong worktree `publish-dat`. Không đổi enum role, Supabase Auth, `.env`, Docker, CI hoặc lịch sử Git. Không tự cấp Team, role hay chuyển dữ liệu doanh nghiệp.

| Migration | Tác động |
| --- | --- |
| `20261118090000_reconcile_import_columns.sql` | Bổ sung tương thích bảy cột raw import còn thiếu và provenance. Dữ liệu cũ giữ nguyên, gắn `legacy_unknown`; không suy ngược metric giả. |
| `20261118091000_leader_workflow_schema.sql` | Campaign, liên kết Team/campaign vào năm bảng nghiệp vụ hiện có, revision và metadata notification. Restrictive RLS giới hạn Team, giữ draft riêng tư và chặn client tháo Team để sửa/xóa bản ghi mới. Không tạo hệ thống approval hay notification song song. |
| `20261118092000_leader_workflow_rpc.sql` | RPC `leader_workflow`, identity từ `auth.uid()`, quyền từ membership server. Ghi proposal/decision/revision/notification trong transaction, khóa version, idempotency và kiểm tra ngân sách. |

`SECURITY DEFINER` đặt `search_path=''`, tham chiếu tên schema đầy đủ; thu hồi EXECUTE PUBLIC/anon và chỉ cấp RPC cho authenticated. Private helpers không được dùng làm API ghi. Service role chỉ dùng cấp fixture trên stack test riêng; API Django nghiệp vụ chuyển tiếp JWT của user.

## Kiểm tra trước triển khai

Kết quả probe REST **chỉ đọc** tại `leader-hosted-preflight.json`: project `oviqgptccjjdaaqxabwv`, raw import trả `42703`, `campaigns` chưa tồn tại; các bảng nền approval/notification/Team có mặt. Chỉ có một Team và một phân công Team tại thời điểm probe. Đây chưa phải kiểm chứng đầy đủ constraint/migration history hosted.

Sau khi được cho phép, chạy các truy vấn chỉ đọc sau trong đúng SQL Editor/project; dừng nếu khác schema đầu vào đã kiểm thử. Không dùng `--include-all` để bỏ qua lệch lịch sử.

```sql
select version, name from supabase_migrations.schema_migrations order by version;
select table_name, column_name, data_type
from information_schema.columns
where table_schema='public' and table_name in
('campaign_performance','approvals','notifications','strategies','ad_contents',
 'budget_proposals','workspace_teams','workspace_team_members','campaigns')
order by table_name, ordinal_position;
select conrelid::regclass as entity, conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid in ('public.approvals'::regclass,'public.notifications'::regclass,
                  'public.workspace_teams'::regclass)
order by conrelid, conname;
select role, count(*) from public.workspace_members group by role;
select 'strategies' as entity, count(*) from public.strategies
union all select 'ad_contents',count(*) from public.ad_contents
union all select 'budget_proposals',count(*) from public.budget_proposals
union all select 'approvals',count(*) from public.approvals
union all select 'campaign_performance',count(*) from public.campaign_performance;
```

Không đưa kết quả chứa dữ liệu cá nhân hay credential vào Git. Bản ghi cũ không xác định Team không tự gán vào Team hiện có: vẫn MM-only theo RLS, không được dựng thành campaign/metric mới. Marketing Manager phải phân công Leader/Employee vào Team trước khi họ tạo/gửi dữ liệu mới. Một Leader chưa có Team nhận trạng thái rỗng có giải thích.

## Cutover

1. Chốt phiên bản code/migration được review. Tạm dừng thao tác ghi trên ứng dụng trong maintenance window; không triển khai rolling giữa giao diện cũ và policy mới.
2. Tạo backup schema, dữ liệu public và migration ledger bằng công cụ DB/backup đã xác thực, lưu ngoài repo, ví dụ `C:\Users\Admin\Documents\CastraVision-backups\leader-cutover-<timestamp>`. Ghi nhận thời điểm và kiểm tra khả năng đọc/restore trên DB tạm. Chưa có backup thì chưa áp dụng. Không xuất hay đọc mật khẩu Auth để thực hiện việc này.
3. Đối chiếu preflight. Nếu hosted đã có cột/constraint khác bản local, dừng và chuẩn bị migration tương thích để review lại; không sửa migration đã áp dụng trước đây.
4. Thực thi **cả bốn migration theo thứ tự trong một transaction** với `lock_timeout='5s'`, `statement_timeout='120s'`: `20261118090000`, `20261118091000`, `20261118092000`, `20261118103827`. Migration cuối sửa prerequisite validator/audit của baseline hosted đã được kiểm chứng bằng bản sao backup và được duyệt riêng. Không reset, drop bảng cũ hoặc chạy lại migration cũ. Chỉ ghi bốn version mới cùng nội dung SQL vào migration ledger trong cùng transaction sau khi các lệnh schema/RPC hoàn tất. Không ghi version nếu transaction lỗi.
5. Trước COMMIT, kiểm tra RPC tồn tại, bảng bật RLS, grants và các policy mới đúng. Sau COMMIT reload PostgREST schema và khởi động lại backend đang dùng `--noreload`; build/reload frontend cùng phiên bản.
6. Smoke test bằng tài khoản được chủ dự án cho phép: workspace/Team, tạo draft, gửi/duyệt bởi người khác, import nhỏ, reload, notification. Không dùng tài khoản doanh nghiệp khác làm fixture; dữ liệu smoke test cần ghi nhãn và được thống nhất trước.
7. Chỉ mở ghi lại sau khi smoke test đạt. Không gửi email, dispatch quảng cáo hoặc thay đổi ngân sách nhà cung cấp trong cutover này.

Ngân sách campaign mới là ngân sách kế hoạch. UI thông báo phân bổ ban đầu chia đều giữa kênh đã chọn; phân bổ sau đó thay đổi bằng proposal đã duyệt. Đây không phải đồng bộ spend với mạng quảng cáo.

## Phục hồi

- Lỗi trước COMMIT: `ROLLBACK` toàn transaction, giữ nguyên ứng dụng/schema cũ; không đánh dấu migration thành công.
- Lỗi sau COMMIT, trước khi mở ghi: tiếp tục maintenance, đối chiếu backup và quyết định restore bản trước cutover hoặc forward-fix. Restore hosted cần phê duyệt rõ; không tự xóa database.
- Đã có dữ liệu mới: đóng ghi, bảo toàn toàn bộ dữ liệu mới cùng audit/revision, ưu tiên forward-fix. Không tự DROP cột/bảng mới hoặc restore đè dữ liệu sau cutover. Phải xác định và duyệt cách đối soát phần dữ liệu mới trước mọi restore.
- Không rollback bằng cách nới RLS hay dùng service role cho các API user.

## Tái chạy local

Chạy bằng Python venv của dự án, tại worktree `publish-dat`:

```text
python scripts/leader/local_stack.py start
python scripts/leader/local_stack.py test
python scripts/leader/local_stack.py reset
python scripts/leader/local_stack.py test
python scripts/leader/local_verify.py test
```

Harness cố định project `CastraVision-leader-test`, API 59321, DB 59322; kiểm tra Docker label, trạng thái container và loopback. Chỉ `reset` stack riêng đó. `local_verify.py` không đọc `.env`, dùng credential local trong bộ nhớ, tạo fixture rồi chạy Auth → Django → Supabase thật; backend 59800/frontend 59300 được dừng khi test kết thúc. `serve` dành cho kiểm thử trình duyệt có bridge credential fixture chỉ ở loopback; dừng process sau khi kiểm thử, không dùng bridge với tài khoản thật.

# System Admin — thiết kế tích hợp dữ liệu thật

## Mục tiêu và quyết định đã duyệt

Theo prompt người dùng gửi ngày 20/11/2026 và câu trả lời trong phiên này:
- Được sửa backend và Supabase local; hosted phải duyệt riêng.
- Inactive khóa tenant, gồm phiên/JWT đã cấp; không chỉ nhãn quản trị.
- accountEmail là email Marketing Manager nhận lời mời; Gmail được phép.
- Slug duy nhất; domain được phép trùng.
- System Admin không thành membership nội bộ, không đọc roster/PII/nội dung chiến dịch.
- Không commit/push, không đổi .env, không reset stack đang dùng.

## Phương án

1. **Đề xuất:** API Django kiểm chứng identity + RPC hẹp qua JWT user; bảng metadata platform tách khỏi dữ liệu nội bộ. DB thực thi quyền, transaction, uniqueness, audit và khóa tenant; backend chỉ điều phối gửi OTP. Tái sử dụng Auth, HTTP client, dịch vụ frontend và màn hình có sẵn.
2. Backend dùng service_role để CRUD toàn bộ: ít RPC hơn nhưng bỏ qua RLS, tăng phạm vi rủi ro; không chọn.
3. Chỉ frontend gọi bảng nghiệp vụ trực tiếp: khó bảo vệ aggregate/PII và provision tài khoản; không chọn.

## Dữ liệu

- Giữ `workspaces` làm định danh; không tạo hệ tenant thứ hai.
- Metadata platform theo workspace: slug unique đã normalize, legal entity, domain, status, version, created/updated timestamp. Không trộn email liên hệ với email người nhận quyền.
- Backfill workspace hiện có thành Active với slug xác định từ UUID, không suy từ tên có thể trùng. Không đọc/sửa marketing content để backfill.
- Lời mời MM: UUID, workspace, normalized email, trạng thái pending/accepted/revoked, expiry, creator, delivery state, request UUID. Không password hoặc token Auth trong bảng. Chỉ backend/provider cần email; API System Admin chỉ lộ email quản trị đã được nhập, không email nhân viên.
- Platform audit riêng, append-only: actor auth.uid(), workspace, action, event timestamp, các trường metadata thay đổi được allowlist. Không chép raw business audit, roster, secret, campaign payload.
- Notification receipt theo platform actor + event, chỉ read marker được ghi qua RPC; sự kiện lấy từ audit platform thực. Không khẳng định đây là cảnh báo hạ tầng.
- Quota/uptime/storage/DNS chưa có provider: null / chưa cấu hình. Không tái sử dụng fixture làm số thật.

## Contract và quyền

| Hành động | Role | API/RPC | Dữ liệu trả về |
|---|---|---|---|
| Registry + metrics | System Admin | GET /api/platform/companies/ → platform_directory | Metadata công ty, aggregate member count; không roster |
| Detail + history | System Admin | GET /api/platform/companies/:id/ | Metadata, version, aggregate, safe audit |
| Create | System Admin | POST companies → platform_create | Workspace + pending MM invitation; idempotent request UUID |
| Update/status | System Admin | PATCH companies/:id → platform_update | Record mới; expectedVersion chống ghi đè; audit atomic |
| Resend/revoke MM invitation | System Admin | POST invitation action → claim/record RPC | Delivery/status; không giả thành công gửi mail |
| Xem lời mời/accept | Auth user đúng email, confirmed, đặt password | Onboarding RPC cụ thể | Membership admin của chính user sau accept |
| Notification read | System Admin | GET notifications / POST read | Safe platform events; read marker của chính actor |

- Backend kiểm chứng Auth server, DB đọc auth.users.raw_app_meta_data; không tin editable user_metadata hay actor client gửi.
- SECURITY DEFINER chỉ khi cần aggregate/provision; search_path='', schema-qualified, revoke PUBLIC/anon, EXECUTE authenticated với guard identity trong thân hàm.
- Bảng private/không có quyền ghi trực tiếp cho client. Service key chỉ dùng delivery bookkeeping phía backend sau claim đã authorized; không CRUD tenant bằng service key.
- Người không phải platform admin nhận 403; anon nhận 401. User đối soát email lấy từ Auth server, không request body khi accept.

## Workflow tạo và mời

1. POST với request UUID tạo workspace + platform metadata + invitation + audit trong cùng transaction. Retry cùng request/payload trả record cũ; cùng key khác payload bị conflict.
2. owner_id là người vận hành tạo record để đáp ứng schema hiện tại; không tự thêm họ vào workspace_members và không trao quyền nội bộ qua owner_id. Khi người nhận accept, ownership được chuyển cùng transaction nếu nghiệp vụ cần; policy không suy quyền tenant từ owner_id.
3. Backend claim delivery, gửi OTP qua Supabase Auth tới callback allowlisted. Thành công DB nhưng email lỗi phải trả pending/failed rõ, có resend. Không tạo password, không reset user cũ.
4. Email → đặt password nếu cần → accept invitation. RPC khóa invitation, kiểm tra expiry/revoke/email/password setup, không cho System Admin tự nhận business membership. Add role admin, default team nếu thiếu, audit; accept lại idempotent.
5. Không tự đổi MM có sẵn hoặc giải quyết xung đột platform role bằng hạ quyền. Báo lỗi rõ.

## Khóa tenant Inactive

- Một hàm private kiểm tra status đọc từ DB ở mỗi request/transaction, không dựa JWT claim status.
- RLS restrictive trên mọi bảng business có workspace scope, gồm bảng workspace_members và storage/report file paths nếu dùng Storage. Không xóa dữ liệu, user hay phiên Auth.
- Cập nhật helper member/role/team/manager để cùng kiểm tra Active. Đặc biệt SECURITY DEFINER có thể vượt RLS nên phải inventory và gắn guard vào mọi RPC business liên quan, gồm onboarding/accept/delivery/report/workflow.
- Backend xác thực workspace phải từ chối Inactive trước business action, trả WORKSPACE_INACTIVE/403; không fallback workspace khác âm thầm.
- Auth/session vẫn nhận diện user để hiển thị trạng thái bị khóa; System Admin vẫn truy cập platform endpoint và có thể kích hoạt lại tenant.
- Hành động đang chạy và thay trạng thái phải có thứ tự transaction/lock được kiểm thử; không khẳng định request đã bắt đầu trước commit khóa có thể bị thu hồi tức thì.
- Kiểm thử MM/Leader/Employee bằng token đã cấp trước khi khóa: trực tiếp REST, RPC và Django đều bị chặn. Kích hoạt lại khôi phục truy cập, không cấp lại role.

## Frontend

- Giữ 4 màn hình; service module duy nhất gọi API, không fetch trong component.
- Bỏ INITIAL_COMPANIES khỏi luồng authenticated; không fallback sang mock khi API fail.
- Registry GET có paging/filter/sort server-side, aggregate toàn platform độc lập page. Query/selected ID lưu bằng router/query hợp lệ; loading/error/retry/abort chống stale response.
- Create/Edit chờ read-back server, hiển thị trạng thái delivery riêng; không Math.random ID, không giả toast thành công.
- Status có xác nhận tác động khóa tenant và concurrency version.
- Chuông dùng platform event, không gọi dữ liệu tenant. Các claim enclave/zero-knowledge giả được thay bằng mô tả phạm vi quyền đã kiểm chứng.
- Settings: sửa profile update chain; kiểm thử tài khoản disposable local, không đổi credential demo thật. Notification preferences hiện chỉ thiết bị: ghi rõ phạm vi; đồng bộ server chỉ thêm nếu được chốt riêng.

## Rollout / rollback

1. Triển khai additive migration trên stack test riêng, chạy toàn suite + negative RLS và invitation email local.
2. Preflight catalog/schema drift, collisions và footprint; chuẩn bị backup có phạm vi ngoài Git. Không deploy hosted trong bước hiện tại.
3. Hosted cần duyệt migration và maintenance window riêng: áp DB trước, deploy API và frontend cùng đợt; API cũ không được mở lại quyền khi client mới fail.
4. Backward compatibility: giữ enum và tên role cũ, metadata backfill Active, giữ ID/membership. Không copy record chưa đủ provenance sang Team.
5. Rollback app chỉ khi vẫn giữ tenant-inactive guards và privacy policy. Không gỡ guard rồi để Inactive thành Active ngầm. Nếu migration transaction fail thì rollback transaction; provider email không rollback được, dùng pending/retry state và lịch sử attempt.

## Nghiệm thu

- Ma trận 32 nhóm; PASS phân biệt component, SQL authenticated/JWT claims, HTTP JWT thật, browser thật.
- Required: duplicate/concurrent create, optimistic update, email new/existing/expiry/revoke/idempotent, Inactive JWT cũ qua REST/RPC/API, cross-role denial và PII projection.
- Lint/build/frontend tests; Django và Supabase toàn suite trên stack test riêng; diff check + secret scan redact.
- Provider/hosted chưa có quyền không được gọi PASS; không xóa dấu vết FAIL bằng đổi nhãn.

Thiết kế này cần người dùng review trước khi tạo subsystem platform mới. Các sửa lỗi UI tái hiện đã được yêu cầu vẫn tiến hành độc lập.

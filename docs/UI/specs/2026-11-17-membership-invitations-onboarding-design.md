# Thiết kế mời, duyệt và gán nhân sự CastraVision

Ngày: 17/11/2026. Trạng thái: người dùng đã duyệt trong hội thoại bằng câu
“đã duyệt bản thiết kế”; chuyển sang lập kế hoạch triển khai, chưa thay đổi sản phẩm.

## 1. Yêu cầu và phạm vi đã được duyệt

Người dùng đã cho phép hoàn thiện frontend trước, đồng thời bổ sung backend/Supabase
để dữ liệu lưu thật. Phê duyệt nằm trong trao đổi ngày 17/11/2026:
“muốn hoàn thiện frontend trước và cho phép làm thêm backend/Supabase”.

Yêu cầu bổ sung: nhân viên nhập Gmail, nhận email, mở liên kết để tự đặt mật khẩu,
chọn công ty có sẵn và gửi yêu cầu. Marketing Manager đúng công ty nhận thông báo
để xét duyệt. Trước khi được cấp membership, nhân viên không vào dashboard nghiệp vụ.

Đây là thay đổi kiến trúc của onboarding và membership, không chỉ chỉnh modal.
Không commit/push, không đọc/in `.env` hoặc khóa bí mật, không đổi lịch sử Git.
Không tự áp dụng bản RBAC v1.4 đang được sao lưu hoặc đổi enum role hiện tại.

## 2. Hiện trạng được đối chiếu trong code

- `AuthProvider.jsx`: đăng ký hiện nhận email + mật khẩu trước khi xác nhận email.
- Supabase SDK giữ phiên; Django xác minh bearer qua Auth server và đọc membership
  bằng user JWT. Không phục hồi Django session làm nguồn xác thực sản phẩm.
- Chưa có membership thì App hiển thị chờ cấp quyền.
- `InviteMemberModal.jsx` đã có các trạng thái giao diện nhưng callback báo chưa có API.
- `MarketingManagerLayout.jsx`: danh sách nhân viên là mock; sửa role/xóa chỉ đổi state.
- Header Marketing Manager hiện hiển thị số thông báo cố định.
- Database hiện có workspaces, workspace_members, profiles, notifications và audit_logs;
  chưa có invitations, join_requests hoặc team. Các policy notification hiện yêu cầu
  membership nên không đáp ứng thông báo kết quả từ chối cho người chưa vào công ty.

Role DB hiện tại: `admin` = Marketing Manager; `manager` = Leader; `member` = Employee.
System Admin được cấp riêng qua app_metadata đã xác minh từ Supabase Auth server.

## 3. Lựa chọn giải pháp

1. Giữ nhập mật khẩu trước email: ít thay đổi, nhưng không đúng yêu cầu mới.
2. **Chọn: xác thực email bằng magic link, rồi người dùng tự đặt mật khẩu.** Dùng
   Supabase Auth cho toàn bộ credential/session, Django và RPC xử lý gia nhập công ty.
3. Tự xây token xác thực và kho mật khẩu trong Django: không chọn vì tạo nguồn Auth thứ hai.

Email-only enrollment sử dụng `signInWithOtp` để Supabase gửi liên kết xác thực.
Callback thiết lập phiên, sau đó `updateUser({ password })` đặt mật khẩu trực tiếp
với Supabase. Không gửi mật khẩu qua API nghiệp vụ hay lưu ở localStorage riêng.

Link xác thực có hiệu lực không đồng nghĩa membership đã được duyệt. Không dùng
user_metadata hoặc query parameter để cấp role, xác định email sở hữu hay miễn duyệt.

## 4. Luồng nhân viên tự đăng ký

1. Nhập email; giao diện thông báo chung, không tiết lộ email đã có tài khoản hay chưa.
2. Supabase gửi magic link về callback `/auth/complete`. Nút gửi lại có cooldown;
   lỗi rate-limit/SMTP được giải thích rõ, không báo gửi thành công giả.
3. Callback xử lý phiên, URL lỗi và link hết hạn/đã dùng. Thông tin phiên được xử lý
   qua SDK rồi loại khỏi thanh địa chỉ; URL chuyển tiếp chỉ được chọn từ allowlist.
4. Với tài khoản email mới chưa có mật khẩu: hiển thị đặt và xác nhận mật khẩu.
   Chỉ chuyển tiếp khi Supabase xác nhận cập nhật thành công.
5. Tài khoản cũ đã có mật khẩu không bị bắt đổi mật khẩu hoặc đăng ký lại.
   Có thể đăng nhập thông thường để tiếp tục yêu cầu đang chờ.
6. Hiển thị công ty đang nhận đơn; chọn một công ty cho mỗi yêu cầu, nhập lời giới
   thiệu ngắn và xác nhận gửi. Không có mục tự chọn Leader/Marketing Manager.
7. Lưu yêu cầu pending, đồng thời tạo notification bền vững cho các Marketing Manager
   hiện tại của công ty. Gửi trùng chỉ trả lại đơn đang chờ, không nhân bản notification.
8. Người dùng thấy yêu cầu của mình và có thể hủy khi còn pending. Đơn bị từ chối
   hiển thị lý do; có thể gửi lại sau cooldown của server.
9. Khi duyệt, membership Employee được tạo trong transaction. Frontend làm mới
   auth context, chọn Workspace được cấp và mở dashboard Employee.

Email ownership được xác minh bằng Supabase Auth. Trạng thái cần đặt mật khẩu được
server/RPC xác định cho chính auth.uid() từ credential thực trong Auth; không dựa
vào cờ client có thể sửa. Hàm kiểm tra chỉ trả boolean, không trả hash/mật khẩu.

## 5. Công ty được phép hiển thị

Chỉ người đã xác thực email mới xem được danh bạ tuyển nhận. Chỉ trả:
workspace_id, tên hiển thị và mô tả công khai ngắn. Không trả owner_id, email quản lý,
danh sách nhân viên, số liệu chiến dịch hay business_profiles.

Mỗi Workspace có cấu hình `accepting_join_requests`, mặc định false khi migration.
Marketing Manager chủ động bật và xác nhận nội dung công khai trước khi xuất hiện.
Không tự công khai mọi doanh nghiệp cũ. Nếu chưa có công ty mở nhận đơn, hiển thị
trạng thái trống và hướng dẫn liên hệ quản lý để được mời.

Không thêm policy cho phép người lạ SELECT toàn bộ workspaces. Dùng API/RPC danh bạ
trả projection tối thiểu, có phân trang/tìm kiếm và giới hạn kích thước kết quả.

## 6. Quyền theo actor

| Actor | Quyền trong luồng này |
|---|---|
| Chưa đăng nhập/chưa xác minh | Nhận email/xử lý xác thực; không xem đơn hoặc danh bạ nội bộ |
| Đã xác minh, chưa membership | Xem danh bạ công khai, gửi/xem/hủy đơn của mình, nhận/chấp nhận lời mời đúng email |
| Employee | Không xem đơn người khác, không mời/duyệt/gán role; quyền Workspace chỉ sau membership |
| Leader | Không duyệt gia nhập hoặc cấp role trong lần triển khai này |
| Marketing Manager | Quản lý thành viên, lời mời, nhóm và yêu cầu thuộc Workspace mình; bật/tắt nhận đơn |
| System Admin | Giữ quản trị nền tảng; không nhận danh sách email/hồ sơ ứng viên của doanh nghiệp |

Marketing Manager được mời/cấp Employee hoặc Leader, không tự cấp System Admin
hoặc tạo Marketing Manager mới. Cấp Marketing Manager vẫn qua người vận hành,
phù hợp quyết định trước đây. Giữ bảo vệ Marketing Manager cuối cùng ở database.

Yêu cầu tự xin gia nhập luôn có role đích Employee. Sau khi đã vào công ty, quản lý
có thể nâng Employee thành Leader bằng thao tác riêng có audit. Không lén đổi role
membership đã tồn tại khi xử lý một đơn/lời mời cũ.

## 7. Luồng Marketing Manager

Trang Nhân sự có ba tab: Thành viên, Chờ duyệt, Lời mời.

- Chờ duyệt: badge đếm pending thật; tìm email/tên, sắp xếp mới nhất/cũ nhất;
  xem email đã xác minh, thời gian gửi và lời giới thiệu. Duyệt mở xác nhận chọn
  nhóm; từ chối bắt buộc lý do. Không duyệt hàng loạt mặc định.
- Thành viên: dữ liệu thật, tìm kiếm/lọc role/nhóm; đổi nhóm, đổi Employee/Leader,
  thu hồi membership bằng modal xác nhận. Không sửa mật khẩu nhân viên.
- Lời mời: nhập email, role Employee/Leader, nhóm; xem đang chờ, đã chấp nhận,
  hết hạn, đã thu hồi; gửi lại/thu hồi với trạng thái server thật.
- Chuông thông báo: số chưa đọc thật; nhấp notification mở đúng đơn/Workspace.
  Trạng thái đọc không đồng nghĩa đã xử lý yêu cầu. Reload không mất thông báo.
- Tự cập nhật khi cửa sổ đang mở bằng polling 30 giây và khi focus; dừng khi ẩn.
  Sau thao tác thành công làm mới ngay. Không yêu cầu Realtime để giao nhận đúng.

Thông báo đợt đầu là trong ứng dụng, không tự gửi email marketing hay digest cho
quản lý. Email xác thực/lời mời cho ứng viên vẫn qua Supabase Auth SMTP.

## 8. Luồng mời chủ động

Marketing Manager tạo lời mời trong Workspace mình trước khi yêu cầu gửi email.
Backend dùng kênh Auth email-only để gửi link cho cả email mới và tài khoản đã có,
không reset mật khẩu tài khoản cũ. Không gọi API Admin từ browser.

Lời mời có UUID tham chiếu, email chuẩn hóa, role đích, nhóm, hạn dùng và người mời.
UUID không tự cấp quyền: chấp nhận bắt buộc phiên có email đã xác minh trùng email
trên invitation, đúng Workspace, còn hạn và chưa thu hồi.

Sau khi mở link và hoàn tất mật khẩu nếu cần, người được mời xem thông tin và chủ
động bấm Chấp nhận. Đây là chấp thuận đã có từ người quản lý nên không tạo thêm
đơn xin duyệt; accept mới tạo membership. Không tự nhận lời mời vì URL được mở.

Lưu lời mời và gửi SMTP không phải một transaction. Vì vậy trạng thái delivery
tách khỏi invitation: pending/sent/failed. Chỉ hiển thị đã gửi khi Auth nhận lệnh
gửi thành công; không khẳng định email đã đến inbox. Lỗi gửi giữ lời mời để thử lại,
không sinh thành viên giả. Gửi lại có cooldown, không sửa role/người nhận âm thầm.

## 9. Thay đổi database dự kiến

Migration bổ sung, không reset database hay đổi ID/membership cũ:

- `workspace_recruitment_settings`: workspace_id PK/FK; accepting_join_requests;
  public_description; updated_at. Quyền sửa chỉ MM Workspace.
- `workspace_join_requests`: id; workspace_id; applicant_id; message;
  status pending/approved/rejected/cancelled; requested_at; reviewed_at;
  reviewed_by; rejection_reason; assigned_team_id. Unique pending theo user/Workspace.
- `workspace_invitations`: id; workspace_id; normalized_email; invited_role;
  team_id; invited_by; expires_at; status pending/accepted/revoked;
  accepted_by; accepted_at; delivery_status; last_sent_at. Hết hạn được tính theo
  server clock, không cần worker để làm đúng. Unique lời mời pending theo Workspace/email.
- `workspace_teams` và `workspace_team_members`: tổ chức nhóm trong Workspace,
  FK ghép đảm bảo nhóm/membership cùng Workspace. Không tự chuyển dữ liệu chiến dịch
  cũ sang Team, không tuyên bố đã triển khai RLS theo Team cho toàn sản phẩm.
- `membership_notifications`: id; workspace_id; recipient_id; event_type;
  request_id/invitation_id; created_at; read_at. Người nhận đọc được thông báo
  onboarding của mình kể cả chưa có membership. Không nới policy notification cũ.

Team “Chưa phân nhóm” không được tạo âm thầm cho dữ liệu cũ. UI cho quản lý tạo
nhóm trước hoặc duyệt membership ở cấp Workspace; nhóm là lựa chọn tổ chức,
không mở thêm quyền truy cập chiến dịch ngoài RLS hiện tại.

Audit dùng audit_logs hiện có và tên bảng số nhiều. Không thêm plaintext password,
access token hay refresh token vào bảng nghiệp vụ/audit/log.

## 10. RPC, RLS và giao dịch

Mọi bảng mới bật RLS. Người xin chỉ đọc đơn của mình; MM chỉ đọc/xử lý đơn công ty
mình; notification chỉ đúng recipient. Employee/Leader không đọc email ứng viên.
Client không được trực tiếp cập nhật status duyệt, reviewer, delivery hay ghi audit.

Đặc biệt, policy `workspace_members_admin_insert/update/delete` hiện cho phép MM
ghi membership trực tiếp. Migration phải thu hồi đường ghi này của authenticated
và chuyển thao tác quản lý sang RPC có allowlist role; nếu chỉ khóa nút frontend
thì MM vẫn có thể tự cấp thêm Marketing Manager qua Data API. Giữ đường operator
backend được kiểm soát, không đưa service key cho client.

RPC cũ `create_workspace_with_admin` hiện được cấp EXECUTE cho authenticated cũng
phải ngừng cho người đăng ký tự gọi. Thu hồi EXECUTE authenticated/anon của đường
tự tạo Workspace + Admin, giữ cấp doanh nghiệp/MM qua người vận hành như đã chốt.
Đây là thay đổi quyền cần regression test và ghi rõ trong diff migration.

Các thao tác gửi đơn, duyệt/từ chối/hủy, tạo/thu hồi/nhận lời mời, đổi role/nhóm và
thu hồi membership đi qua RPC có kiểm tra auth.uid() và quyền hiện tại. Khi cần
SECURITY DEFINER: search_path cố định/rỗng, tên bảng đầy đủ schema, REVOKE EXECUTE
PUBLIC/anon và cấp đúng role; không nhận actor_id/email sở hữu do client khai báo.

Duyệt khóa dòng pending, kiểm tra lại MM, tạo membership/team membership,
cập nhật request, ghi audit và notification trong một transaction. Hai quản lý
duyệt đồng thời không tạo hai membership hoặc hai thông báo thành công.
Nhận invitation và request có cùng user/Workspace phải hợp nhất theo membership
hiện tại, không nâng role ngoài thao tác quản lý riêng.

SQL/API giới hạn kích thước message/reason, email chuẩn hóa, số đơn pending mỗi
người và tốc độ gửi lại. Các thông báo là dữ liệu hiển thị, không là nguồn cấp quyền.

## 11. API và frontend

Frontend service tập trung sử dụng api client JWT hiện có; không thêm fetch rải rác.

Nhóm API dự kiến:
- Onboarding: trạng thái password setup; danh bạ công ty; đơn của tôi; gửi/hủy đơn;
  invitation được gửi tới chính email đã xác minh; accept.
- Workspace admin: danh sách thành viên/nhóm, danh sách đơn và lời mời; duyệt/từ chối;
  mời/gửi lại/thu hồi; đổi nhóm/role hoặc gỡ membership.
- Notifications: danh sách/số chưa đọc và đánh dấu đã đọc theo người dùng hiện tại.

Định dạng lỗi thống nhất code/message; phân biệt 401, 403, trùng đơn 409, link hết
hạn 410, rate-limit 429 và phụ thuộc Auth/SMTP lỗi 502/503. Không trả raw lỗi có key.

Frontend hoàn thiện trước trên service contract và dữ liệu thử ở development/test;
production không báo thành công bằng mock. Sau đó nối API/RPC và kiểm thử đầu-cuối.
Component mới dùng Tailwind token/shadcn/lucide sẵn có, không thêm CSS hoặc thư viện.

## 12. Rollout và rollback

1. Sao lưu các thay đổi local đang có theo phạm vi trước khi sửa; không stash/commit
   hoặc reset tùy tiện. Tài khoản demo và dữ liệu hosted hiện tại được giữ nguyên.
2. Thử migration trên stack local riêng dùng current main; không reset local cũ.
3. Thử dữ liệu cũ đi qua migration và rollback trong môi trường riêng.
4. Deploy migration bổ sung trước, API sau, frontend sau; frontend cũ tiếp tục hiểu
   ba legacy role. Không công khai công ty cũ do mặc định tắt nhận đơn.
5. Trước khi áp dụng hosted, đối chiếu project/schema, migration history, diff và
   bằng chứng test. Không chạy db reset hoặc tự mở rộng role/schema cũ.
6. Khi lỗi, tắt tuyển nhận và rollback bản app; giữ bảng request/invitation/audit
   để không mất hồ sơ. Không tự xóa membership đã cấp hay xóa tài khoản Auth.

Người dùng đã cho phép làm backend/Supabase. Thiết kế này không xin lại quyền đó;
bước xem thiết kế và kế hoạch là để duyệt semantics và cách triển khai cụ thể.

## 13. Nghiệm thu

- Người mới nhận email local, đặt mật khẩu và chọn công ty trước khi gửi đơn.
- Không có membership trước duyệt; đăng nhập/F5/mở lại tab vẫn thấy đơn chờ thật.
- MM A nhận badge/thông báo của công ty A; MM B không thấy email/đơn của A.
- Duyệt tạo đúng một Employee và nhóm đã chọn; từ chối/hủy không tạo membership.
- Nhân viên nhận kết quả rồi vào đúng Workspace; tài khoản cũ không bị yêu cầu đăng ký lại.
- Invitation mới/cũ, email sai người nhận, hết hạn, thu hồi, gửi lại và lỗi SMTP
  được kiểm thử; không có success giả hoặc thay mật khẩu người nhận bởi MM.
- Chặn tự nâng role, đổi company ID trong request, gửi actor_id giả, sửa state qua
  Data API, metadata giả; bảo vệ MM cuối cùng ở DB.
- Test authenticated + JWT ở SQL/RPC, API và browser; kiểm thử race approve/accept.
- Lint/build frontend, regression Auth/backend, secret scan và diff check.
- Gmail thật: cần SMTP/redirect đã cấu hình. Chỉ báo nghiệm thu email thật sau
  khi kiểm chứng gửi và mở link; local Mailpit không được mô tả là gửi Gmail thành công.

## 14. Tài liệu chính thức đã đối chiếu

- https://supabase.com/docs/reference/javascript/auth-signinwithotp
- https://supabase.com/docs/reference/javascript/auth-updateuser
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/guides/auth/auth-smtp

SMTP mặc định không bảo đảm gửi cho Gmail bất kỳ. Giữ mật khẩu/khóa trong cấu hình
server; không đưa SMTP secret hay service_role vào frontend. Callback localhost
chỉ dùng được trên máy đang chạy app; điện thoại vẫn cần địa chỉ công khai phù hợp.

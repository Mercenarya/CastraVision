# Membership Invitations and Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nhân viên xác thực email, tự đặt mật khẩu, gửi đơn vào công ty; Marketing Manager nhận thông báo và duyệt/gán nhân sự, với toàn bộ trạng thái được lưu thật.

**Architecture:** Frontend được xây trước trên contract có thể kiểm thử, sau đó nối Django bearer API và RPC Supabase. Supabase Auth giữ credential/session; RPC thực thi quyền, giao dịch membership, audit và thông báo. Production không dùng mock để báo thành công.

**Tech Stack:** React 19, JavaScript, Vite 8, Tailwind v4, shadcn/Radix và lucide hiện có; Django/httpx; Supabase Auth/PostgREST/PostgreSQL 17, pgTAP; Node test runner, pytest; Supabase CLI **2.121.0**.

**Spec:** [Thiết kế đã duyệt](../specs/2026-11-17-membership-invitations-onboarding-design.md).

## Global Constraints

- “Không commit/push, không đọc/in `.env` hoặc khóa bí mật, không đổi lịch sử Git.”
- “Không tự áp dụng bản RBAC v1.4 đang được sao lưu hoặc đổi enum role hiện tại.”
- “Frontend hoàn thiện trước trên service contract và dữ liệu thử ở development/test; production không báo thành công bằng mock.”
- “Component mới dùng Tailwind token/shadcn/lucide sẵn có, không thêm CSS hoặc thư viện.”
- “Không có membership trước duyệt”; xin gia nhập luôn cấp Employee.
- “Cấp Marketing Manager vẫn qua người vận hành”; System Admin không xem hồ sơ ứng viên.
- “Không tự công khai mọi doanh nghiệp cũ”; nhận đơn mặc định false.
- Không reset database cũ, không sửa migration lịch sử, không làm mất membership/dữ liệu cũ.
- Role DB giữ nguyên `admin`/`manager`/`member`, tương ứng Marketing Manager/Leader/Employee.
- Tất cả shell command có tiền tố `rtk`; không cài dependency mới trong kế hoạch này.
- Không coi kiểm thử Mailpit là bằng chứng email đã đến Gmail thật.
- Mỗi task có chu kỳ RED → GREEN và kiểm tra diff; **không commit** thay cho bước commit mặc định của skill.

## Review Focus

1. Link email được mở bằng trình duyệt khác hoặc email scanner: không tạo membership khi chỉ mở link; callback sạch URL, hết hạn có đường gửi lại (Task 3, 10).
2. Workspace đổi hoặc user đăng xuất giữa lúc request đang chạy: hủy/bỏ response cũ, không hiển thị danh sách của Workspace trước (Task 2, 9).
3. Hai MM duyệt đồng thời, hoặc accept invitation chạy cùng approve: tạo một membership; không ghi đè role/nhóm đã có (Task 6, 10).
4. SMTP nhận chậm hoặc timeout sau khi lời mời đã lưu: không mất lời mời, không có success giả; retry có lease/cooldown, không tạo invitation trùng (Task 7, 8).
5. Dữ liệu cũ thiếu full_name/Team, tài khoản có nhiều Workspace hoặc đã có mật khẩu: giữ dữ liệu, không bắt đăng ký/đặt mật khẩu lại (Task 3, 5, 9, 10).

## Phân chia file và trách nhiệm

### Frontend

- `CastraView/src/services/membershipContract.js`: chuẩn hóa payload, danh sách error code và validation thuần, không fetch.
- `CastraView/src/services/membershipService.js`: tất cả API onboarding/nhân sự/thông báo, dùng transport JWT hiện có.
- `CastraView/src/services/membershipService.test.mjs`: transport/contract và trạng thái lỗi.
- `CastraView/src/hooks/useMembershipWorkspace.js`: load dữ liệu Workspace, refresh, bỏ response cũ, polling khi visible.
- `CastraView/src/hooks/useMembershipNotifications.js`: thông báo của user hiện tại, polling và mark read.
- `CastraView/src/pages/membership/PersonnelPage.jsx`: ba tab Thành viên/Chờ duyệt/Lời mời, lọc/phân trang.
- Cùng thư mục: `JoinRequestReviewDialog.jsx`, `MembershipInviteDialog.jsx`, `MemberAssignmentDialog.jsx`, `RecruitmentSettingsPanel.jsx`, `MembershipNotifications.jsx`.
- `CastraView/src/pages/onboarding/CompanyJoinPage.jsx`: danh bạ công ty, đơn của tôi, invitation đúng người nhận và trạng thái chờ.
- Cùng thư mục: `SetPasswordPage.jsx`, `EmailLinkSentPage.jsx`, `AuthCompletePage.jsx`.
- `CastraView/src/auth/emailOnboarding.js` và `.test.mjs`: gửi magic link, hoàn tất callback, đặt mật khẩu; dependency injection để Node test không cần import Vite env.
- Sửa `App.jsx`, `auth/AuthProvider.jsx`, `auth/sessionContext.js`: route/gate onboarding và refresh context.
- Sửa `company-admin/MarketingManagerLayout.jsx`, `MarketingManagerHeader.jsx`: thay roster mock ở mục Nhân sự, chuông thật; giữ nguyên các màn hình ngoài phạm vi.
- Sửa `preview/DashboardPreviewPage.jsx`, thêm `mocks/membershipPreview.js`: dữ liệu giả chỉ cho preview DEV/test.
- Sửa `CastraView/package.json`: thêm script test membership; không đổi dependencies/lockfile.

### Backend, database và kiểm thử

- `CastraServices/membership_contract.py`: schema/validation input và lỗi cho API mới.
- `CastraServices/membership_api.py`: HTTP onboarding/admin, kiểm tra identity hoặc Workspace MM phù hợp.
- `CastraServices/membership_delivery.py`: gọi Auth OTP gửi invitation, cập nhật delivery bằng server client.
- `CastraServices/membership_notifications_api.py`: list/mark-read theo recipient hiện tại.
- Sửa `supabase_client.py`: hỗ trợ RPC và mã lỗi được allowlist; không trả raw lỗi SQL.
- Sửa `auth_api.py`, `urls.py`: mở rộng context version 1 tương thích ngược, thêm endpoint.
- CLI tạo hai migration có hậu tố chính xác `membership_join_schema.sql`, `membership_join_workflows.sql`; timestamp do CLI sinh, không tự đặt.
- `supabase/tests/05_membership_schema.test.sql`, `06_membership_workflows.test.sql`, `07_membership_privacy.test.sql`: schema, giao dịch, quyền, bypass.
- Sửa các fixture/assertion trong `supabase/tests/01_...04_...` nếu đang dựa vào quyền tự tạo Workspace bị thu hồi; không xóa kiểm tra cũ để né lỗi.
- `CastraServices/test_membership_api.py`, `test_membership_delivery.py`, `test_membership_notifications.py`: HTTP, lỗi provider và recipient isolation.
- `scripts/membership/local_stack.py`, `verify_local_membership.py`, `verify_membership_races.py`: guard stack riêng, migration upgrade, Auth/mail/API và race.
- `docs/UI/guides/membership-onboarding.md`, `docs/UI/audits/2026-11-17/membership-acceptance.md`: vận hành, rollout/rollback và bằng chứng.

## Contract dùng chung

### Hình dạng dữ liệu

- `Page<T> = {items: T[], total: number, limit: number, offset: number}`; limit mặc định 20, tối đa 50; offset không âm.
- `Company = {id, name, publicDescription}`; không có owner/email/headcount/business profile.
- `JoinRequest = {id, workspaceId, companyName, applicantId, applicantName, applicantEmail, message, status, requestedAt, reviewedAt, rejectionReason, assignedTeamId}`. Applicant email chỉ trả cho chính applicant hoặc MM Workspace.
- `Invitation = {id, workspaceId, companyName, email, role, teamId, status, expiresAt, deliveryStatus, lastSentAt}`; status API tính `expired` nếu pending nhưng quá hạn.
- `Member = {userId, name, email, role, joinedAt, teamIds}`; email người cùng Workspace chỉ trả trên API MM.
- `Team = {id, workspaceId, name}`; nhóm tổ chức nhân sự, chưa là RLS scope của toàn bộ campaign cũ.
- `MembershipNotification = {id, workspaceId, companyName, eventType, requestId, invitationId, createdAt, readAt}`; nội dung UI suy từ event type, không nhận HTML.
- `MembershipError = {error: {code, message, details: []}}`; message tiếng Việt, code cố định.
- `OnboardingState = {passwordSetupRequired: boolean}`; server kiểm tra Auth credential của chính user, không lấy cờ user_metadata.

### Frontend service signatures

`createMembershipService(api)` trả object các hàm async:

```js
getOnboardingState()
listCompanies({ search = '', limit = 20, offset = 0 } = {})
listMyRequests({ limit = 20, offset = 0 } = {})
submitJoinRequest({ workspaceId, message })
cancelJoinRequest(id)
listMyInvitations({ limit = 20, offset = 0 } = {})
acceptInvitation(id)
listWorkspacePersonnel({ tab, search = '', role = '', status = '', teamId = '', sort = 'newest', limit = 20, offset = 0 })
getRecruitmentSettings()
saveRecruitmentSettings({ acceptingJoinRequests, publicDescription })
listTeams()
createTeam({ name })
reviewJoinRequest(id, { decision, teamId = null, reason = '' })
createInvitation({ email, role = 'member', teamId = null })
resendInvitation(id)
revokeInvitation(id)
updateMember(userId, { role, teamIds })
removeMember(userId)
listNotifications({ unreadOnly = false, limit = 20, offset = 0 } = {})
markNotificationRead(id)
```

Mọi hàm trả object chuẩn hóa từ payload API; chỉ mutation có xác nhận server mới tạo toast thành công. `AbortSignal` có thể truyền qua options cuối cùng; không đưa signal vào JSON.

### Route HTTP và quyền

Tiền tố `/api/`; GET list trả `Page<T>`, mutation trả resource hoặc `{ok: true}`.

| Route | Method | Gate |
|---|---|---|
| `onboarding/state/` | GET | verified identity, không cần membership |
| `onboarding/companies/` | GET | verified identity, không phải platform |
| `onboarding/requests/` | GET/POST | chính user; POST body workspaceId/message |
| `onboarding/requests/<uuid:id>/cancel/` | POST | applicant của đơn pending |
| `onboarding/invitations/` | GET | email đã xác minh của chính user |
| `onboarding/invitations/<uuid:id>/accept/` | POST | đúng email, còn hạn |
| `workspace/personnel/` | GET | MM của X-Workspace-ID |
| `workspace/recruitment/` | GET/PUT | MM của X-Workspace-ID |
| `workspace/teams/` | GET/POST | MM của X-Workspace-ID |
| `workspace/requests/<uuid:id>/review/` | POST | MM; decision approve/reject |
| `workspace/invitations/` | POST | MM; role member/manager |
| `workspace/invitations/<uuid:id>/resend/` | POST | MM và cooldown |
| `workspace/invitations/<uuid:id>/revoke/` | POST | MM |
| `workspace/members/<uuid:user_id>/` | PATCH/DELETE | MM; không đổi/xóa MM qua route này |
| `membership-notifications/` | GET | recipient identity |
| `membership-notifications/<uuid:id>/read/` | POST | recipient identity |

Không lấy actor/applicant/email sở hữu từ body. Admin route không tin workspaceId body; DB kiểm tra target row thuộc Workspace đã chọn.

### Chữ ký RPC cố định

Tất cả trả `jsonb` theo contract camelCase ở trên; PostgreSQL tham số dùng `p_` snake_case. List trả Page, mutation trả resource; không giả định PostgREST tự đổi snake_case. Mặc định list là limit=20/offset=0.

| Hàm | Tham số |
|---|---|
| membership_onboarding_state | không có |
| membership_company_directory | p_search text, p_limit int, p_offset int |
| membership_my_requests | p_limit int, p_offset int |
| membership_request_join | p_workspace_id uuid, p_message text |
| membership_cancel_request | p_request_id uuid |
| membership_review_request | p_workspace_id uuid, p_request_id uuid, p_decision text, p_team_id uuid nullable, p_reason text |
| membership_personnel | p_workspace_id uuid, p_tab text, p_search text, p_role text, p_status text, p_team_id uuid nullable, p_sort text, p_limit int, p_offset int |
| membership_get_recruitment | p_workspace_id uuid |
| membership_set_recruitment | p_workspace_id uuid, p_accepting boolean, p_description text |
| membership_teams | p_workspace_id uuid |
| membership_create_team | p_workspace_id uuid, p_name text |
| membership_update_member | p_workspace_id uuid, p_user_id uuid, p_role text, p_team_ids uuid[] |
| membership_remove_member | p_workspace_id uuid, p_user_id uuid |
| membership_invite | p_workspace_id uuid, p_email text, p_role text, p_team_id uuid nullable |
| membership_revoke_invitation | p_workspace_id uuid, p_invitation_id uuid |
| membership_my_invitations | p_limit int, p_offset int |
| membership_accept_invitation | p_invitation_id uuid |
| membership_claim_delivery | p_workspace_id uuid, p_invitation_id uuid |
| membership_record_delivery | p_invitation_id uuid, p_attempt_id uuid, p_succeeded boolean; service_role only |
| membership_list_notifications | p_unread_only boolean, p_limit int, p_offset int |
| membership_read_notification | p_notification_id uuid |

`membership_claim_delivery` trả `{attemptId, recipientEmail, invitationId}` chỉ cho MM đúng Workspace; lease/cooldown được server quyết định. List notification thêm `unreadCount` để badge không đếm riêng trang đang xem. Teams trả `{items: Team[]}`.

SQL raise mã lỗi allowlist trong message, không chứa dữ liệu nhạy cảm: AUTH_REQUIRED→401; PERMISSION_DENIED/PASSWORD_SETUP_REQUIRED→403; VALIDATION_ERROR→400; REQUEST_CLOSED/ALREADY_MEMBER/INVITATION_CONFLICT→409; INVITATION_EXPIRED/INVITATION_REVOKED→410; RATE_LIMITED→429. Request pending trùng và repeat cùng quyết định trả resource cũ, không 409. Lỗi ngoài allowlist thành 502 với thông báo chung.

## Task 1: Service contract frontend và preview có giới hạn

**Files:** tạo membershipContract.js, membershipService.js, membershipService.test.mjs, mocks/membershipPreview.js; sửa package.json và preview/DashboardPreviewPage.jsx.

**Interfaces:** consumes `api(path, options)` hiện tại; produces service signatures/data contract phía trên, `createMembershipService(api)`; preview chỉ dưới `/dashboard-preview` DEV.

- [ ] Viết test Node `test_uses_selected_workspace_transport`, `test_approval_payload_never_accepts_actor_or_role`, `test_network_or_503_does_not_report_success`, `test_normalizes_page_without_exposing_extra_company_fields`; kiểm tra đúng route/method/body, lỗi reject và company chỉ có ba field cho phép.
- [ ] Chạy `rtk proxy node --test src/services/membershipService.test.mjs` trong CastraView; phải FAIL vì chưa có service.
- [ ] Implement service + validator: email trim/lowercase; role mời chỉ member/manager; không nhận System Admin/admin. Không fallback HTTP sang preview.
- [ ] Thêm fixture DEV cho empty/pending/approved/rejected/expired/delivery-failed và adapter không có network. Dán nhãn xem trước, không dùng dữ liệu thật.
- [ ] Chạy Node test và `rtk proxy npm run lint`; PASS, không cài thêm package, không commit.

## Task 2: Giao diện quản lý nhân sự

**Files:** PersonnelPage.jsx, bốn dialog/panel của mục Nhân sự; useMembershipWorkspace.js; sửa MarketingManagerLayout.jsx và preview.

**Interfaces:** consumes membershipService; hook `useMembershipWorkspace({workspaceId, userId, service, enabled})` trả `{data, loading, error, refresh, mutate}`; `PersonnelPage({workspaceId, userId, service, notify})`.

- [ ] Trong preview kiểm tra RED: thiếu ba tab, không có duyệt/từ chối và dữ liệu cũ vẫn báo đổi role/xóa thành công bằng setTimeout.
- [ ] Implement tab, lọc/phân trang, trạng thái loading/empty/error và dialog; Employee mặc định, từ chối bắt buộc lý do, team optional, không hiển thị tùy chọn cấp MM/System Admin.
- [ ] Thay callback mock của riêng Nhân sự bằng service; chỉ đổi roster sau khi server xác nhận. Lỗi API giữ dialog/input và giải thích rõ.
- [ ] Implement hook: AbortController + generation bound userId/workspaceId; bỏ response cũ; reset page khi filter đổi; mutation khóa nút chống bấm đôi. Không polling khi hidden.
- [ ] Kiểm thử browser DEV: đổi Workspace giữa hai response, lỗi 403/503, email trùng, xác nhận xóa, chỉ bàn phím/Escape/focus restore, viewport 390px và desktop; không lộ roster Workspace cũ.
- [ ] Chạy test service + lint/build; chụp bằng chứng preview, không commit.

## Task 3: UI đăng ký email-only, callback và chờ duyệt

**Files:** emailOnboarding.js/.test.mjs; SetPasswordPage, EmailLinkSentPage, AuthCompletePage, CompanyJoinPage; sửa AuthProvider, sessionContext và App.jsx.

**Interfaces:** `createEmailOnboarding({auth, origin})` → `sendLink(email, {invitationId = null} = {})`, `setPassword(password, confirmation)`; service từ Task 1; Auth context giữ version 1 và bổ sung passwordSetupRequired, `refreshMembership()`.

- [ ] Viết Node test `test_email_link_uses_fixed_same_origin_callback`, `test_no_password_or_role_in_signup_payload`, `test_existing_password_user_skips_setup`, `test_auth_error_preserves_retry`, `test_link_error_does_not_claim_membership`; assert redirect `/auth/complete`, không actor/role/password trong email payload, lỗi không thành công giả.
- [ ] Chạy RED rồi implement SDK signInWithOtp; đặt password trực tiếp updateUser. Không tạo mật khẩu ngẫu nhiên thay cho người dùng, không đăng ký lại tài khoản cũ.
- [ ] Callback dùng SDK đã xử lý URL session; xử lý cả fragment session, code exchange và error; không verify token hai lần. Xóa token/code khỏi URL sau xử lý, giữ invitationId UUID hợp lệ như dữ liệu tham chiếu, không là quyền.
- [ ] Tách AuthScreen email-only signup khỏi form đăng nhập email/password. Sau Auth: gọi onboarding/state; setup nếu cần → chọn công ty → đơn của tôi. Sau approve/accept refreshMembership rồi chọn Workspace đã cấp.
- [ ] CompanyJoinPage chỉ nhận projection company; gửi một company mỗi đơn; hiển thị pending/rejected/cancelled và invitation; có nút cập nhật/đăng xuất, không tự mở dashboard khi chỉ gửi đơn.
- [ ] Preview và browser test link expired, scanner mở GET không accept, gửi lại cooldown, tài khoản cũ nhiều Workspace, F5, đổi user, storage không khả dụng; Node test/lint/build PASS.

## Task 4: Danh sách thông báo và chuông thật

**Files:** useMembershipNotifications.js, MembershipNotifications.jsx; sửa MarketingManagerHeader.jsx và CompanyJoinPage.jsx.

**Interfaces:** consumes listNotifications/markNotificationRead; hook `{userId, service}` → `{items, unreadCount, loading, error, markRead, refresh}`.

- [ ] Browser RED: header hiện badge cố định 3; applicant chưa có danh sách thông báo kết quả.
- [ ] Implement số chưa đọc từ server; đọc notification không đổi request.status. Click MM mở Chờ duyệt trong đúng Workspace; applicant mở đơn của mình.
- [ ] Poll mỗi 30_000ms khi visible, refresh khi focus và mutation, dừng/abort khi logout/user đổi; không tạo nhiều timer khi React StrictMode mount lại.
- [ ] Preview verify 0/1/50 thông báo, text dài, lỗi mark-read giữ count cũ, focus/hidden, notification tham chiếu đơn đã xử lý. Lint/build PASS.

## Task 5: Schema, credential state và danh bạ riêng tư

**Files:** CLI tạo `*_membership_join_schema.sql`; 05_membership_schema.test.sql; scripts/membership/local_stack.py.

**Interfaces:** produces sáu bảng theo spec; SQL functions `membership_onboarding_state()` → JSON passwordSetupRequired và `membership_company_directory(p_search text, p_limit int, p_offset int)` → Company page.

- [ ] Guard stack riêng `CastraVision-membership-test`, API 57321, DB 57322, mail UI 57324; check Docker label/project/ports trước mọi SQL/reset. Dùng env override trong process, không ghi .env.
- [ ] Khám phá CLI bằng `rtk proxy npx --yes supabase@2.121.0 migration new --help`, rồi tạo migration `membership_join_schema` qua CLI. File timestamp được CLI sinh, không sửa migration cũ.
- [ ] Viết pgTAP RED: sáu bảng có RLS; nhận đơn mặc định false; unique pending; FK team/membership cùng Workspace; company directory không có owner_id/email; state user có password = false-required, OTP user chưa có password = true-required.
- [ ] Implement constraints: message ≤1000, reason 1–500 khi reject, description ≤300, team name 1–80; role invitation member/manager. Pending requests tối đa 5/user, gửi lại đơn sau reject/cancel ít nhất 60s. Invitation hạn 7 ngày, resend cooldown 60s; directory 20/max50.
- [ ] Chỉ credential-state function đọc auth.users của chính auth.uid(), trả boolean; không trả hash và không sửa Auth table. Search path cố định, revoke PUBLIC/anon, chỉ authenticated; account platform không tham gia onboarding business.
- [ ] Fixture old Workspaces/members vẫn nguyên, không tự tạo Team/công khai directory. Chạy pgTAP GREEN trong stack riêng.

## Task 6: RPC gia nhập, duyệt và quản lý membership

**Files:** CLI tạo `*_membership_join_workflows.sql`; 06_membership_workflows.test.sql, 07_membership_privacy.test.sql; cập nhật fixture test 01–04 cần thiết.

**Interfaces:** RPC dưới `public`, nhận `p_` arguments: `membership_my_requests`, `membership_request_join(p_workspace_id,p_message)`, `membership_cancel_request(p_request_id)`, `membership_review_request(p_workspace_id,p_request_id,p_decision,p_team_id,p_reason)`, `membership_personnel`, `membership_get_recruitment`, `membership_set_recruitment`, `membership_teams`, `membership_create_team`, `membership_update_member`, `membership_remove_member`.

- [ ] Viết RED bằng role authenticated và JWT claims: applicant tự sửa approved bị từ chối; MM B không xem/duyệt A; Employee/Leader không quản lý; admin không được tự tạo admin khác; direct-write membership và create_workspace_with_admin phải bị chặn. OTP user chưa có password không được gửi đơn, dù gọi thẳng RPC; platform account không đọc hồ sơ onboarding.
- [ ] Implement RPC transaction: identity auth.uid(), email đã xác minh, loại trừ platform account theo Auth-server metadata, quyền MM hiện tại, workspace scope, FOR UPDATE trên request; serialize theo Workspace/user bằng advisory xact lock dùng chung cho approve và accept; membership insert không overwrite role đã có. Submit/accept kiểm tra có password ở server, không chỉ dựa UI gate.
- [ ] Tạo membership member + team mapping + request approved + audit số nhiều + notification trong cùng transaction. Repeat đúng quyết định trả kết quả cũ; quyết định ngược sau xử lý trả REQUEST_CLOSED/409.
- [ ] Trùng pending request trả đơn cũ và không notification mới; không xin vào công ty đóng tuyển; không xin lại Workspace đã là thành viên. Cancel/reject không tạo membership.
- [ ] Thu hồi authenticated ghi trực tiếp workspace_members và EXECUTE tự bootstrap Workspace/admin; phục hồi đủ đường đọc/RPC cần dùng. Member update/remove không đụng MM; cấp MM vẫn operator, giữ last-admin DB trigger.
- [ ] Test các GRANT, search_path, user_metadata giả, actor giả, bất biến audit nguồn, constraints/rollback; kiểm tra test cũ vẫn pin các invariant, chỉ đổi bootstrap fixture có lý do. Chạy toàn bộ pgTAP GREEN.

## Task 7: RPC lời mời và delivery có retry

**Files:** bổ sung migration workflows trước khi áp dụng; test 06/07; thêm test_delivery SQL cases cùng file 06.

**Interfaces:** `membership_invite`, `membership_revoke_invitation`, `membership_my_invitations`, `membership_accept_invitation`, `membership_claim_delivery`; `membership_record_delivery` chỉ EXECUTE service_role; notifications list/read RPC theo recipient.

- [ ] Test RED: sai email, hết hạn, revoked, lặp accept, đổi email sau khi nhận link, role admin trong payload; tất cả không tăng quyền. User không membership vẫn đọc được kết quả đơn của chính mình.
- [ ] Implement invitation normalized email và FK Workspace/team. Trùng invitation còn hạn trả invitation cũ; lời mời quá hạn phải được thu hồi/đánh dấu trước khi tạo mới để unique pending không kẹt.
- [ ] Accept so email Auth đã xác minh; recheck quyền người mời còn MM tại lúc accept, Workspace hợp lệ; chỉ bấm accept mới tạo membership. Nếu đã là member, giữ role/nhóm hiện tại, đóng đơn pending tương ứng và không tạo duplicate.
- [ ] Delivery claim tạo attempt UUID + lease 120s, chỉ một lượt đang gửi và cooldown 60s; gửi mạng không giữ transaction lock. RPC record chỉ service_role, đối chiếu attempt để response cũ không ghi đè lần mới. Không lưu token SMTP/Auth hoặc URL credential.
- [ ] Notification unique theo recipient/event/resource; MM hiện tại nhận đơn mới, applicant nhận approve/reject, read_at chỉ recipient qua RPC. Không mở rộng policy notifications cũ.
- [ ] PgTAP GREEN cho hết hạn/race/lease/retry/recipient isolation; không commit.

## Task 8: Django API và gửi email thật qua Auth

**Files:** membership_contract.py, membership_api.py, membership_delivery.py, membership_notifications_api.py, ba test_membership*.py; sửa supabase_client.py, auth_api.py, urls.py.

**Interfaces:** HTTP table phía trên; `send_invitation_email(*, access_token, workspace_id, invitation_id)` → `{invitation, deliveryStatus}`; RPC đi bằng user JWT, riêng record delivery đi service client backend.

- [ ] Viết pytest RED: valid JWT/no-cookie tạo được đơn khi chưa membership; MM khác Workspace 403; unsupported role 400; SMTP429/timeout không tạo member/success giả; delivery record không chấp nhận actor/attempt từ HTTP client.
- [ ] Implement require verified identity cho onboarding/recipient, require_workspace_admin cho admin. Client RPC chỉ nhận params validated; lỗi database map allowlist 400/403/409/410/429, lỗi phụ thuộc 502/503, token không hợp lệ 401. Không trả raw error.
- [ ] Thêm `SupabaseDataClient.rpc(name, params)` giữ public key + bearer; mở rộng SupabaseAPIError có safe code/status nhưng giữ tương thích caller cũ. Không sử dụng service client để bỏ qua RLS trong nghiệp vụ.
- [ ] Gửi invitation bằng Auth OTP với email đã lấy từ invitation server, redirect lấy từ allowlist cấu hình frontend origin + `/auth/complete?invitationId=...`; không nhận URL tùy ý từ client. Dùng sessionless HTTP client để không ghi đè phiên MM.
- [ ] Auth session response version1 thêm `onboarding` tương thích ngược; frontend parser giữ identity binding. Existing account có password không bị reset hoặc gọi signup lại.
- [ ] Chạy pytest mới và regression toàn CastraServices; mock request assertions pin bearer/apikey đúng loại, không ghi password/token vào body nghiệp vụ/log. GREEN, không commit.

## Task 9: Nối UI với dữ liệu thật

**Files:** AuthProvider, App, PersonnelPage/hook, CompanyJoinPage, MarketingManagerHeader, membershipService; sessionContext tests.

**Interfaces:** contract từ Task 1–8; API là nguồn trạng thái, không lấy privilege từ data demo hay notification.

- [ ] Chạy RED trên app thật: backend/mock mismatch phải fail rõ, không fallback demo. Gỡ INITIAL_MEMBERS chỉ ở đường Nhân sự production và badge cố định; preview vẫn DEV tách riêng.
- [ ] Nối onboarding gate: password state trước company selection; pending vẫn đọc notification; sau approve refresh auth context và chọn Workspace cấp mới. Không ép tài khoản có membership cũ vào onboarding từ đầu.
- [ ] Nối mutation loading/error/toast và Workspace switch; lỗi response cũ bị bỏ, 401 đưa về đăng nhập, 403 giải thích đúng, không tự gửi request sang Workspace khác.
- [ ] Kiểm thử UI bằng user A/MM A/MM B và bốn role; manager không thấy đơn ngoài công ty; Employee không thấy nút duyệt; System Admin không thấy PII applicant.
- [ ] Chạy `rtk proxy npm run test:auth`, script test membership, lint/build và pytest regression; không commit.

## Task 10: E2E, nâng cấp dữ liệu cũ và rollout

**Files:** verify_local_membership.py, verify_membership_races.py, guides/membership-onboarding.md, audits/2026-11-17/membership-acceptance.md.

**Interfaces:** test scripts chỉ dùng project label CastraVision-membership-test/loopback 57321–57324; hosted inspection/apply là chế độ riêng, không tự fallback khi local lỗi.

- [ ] Tạo fixtures giả bằng Auth Admin local, đọc mail local trong memory: email → link → password → company → request → manager notification → approve → Employee dashboard. Không dùng auto-confirm để thay thế ca email callback.
- [ ] Verify reject/cancel không member; invite existing/new email, wrong recipient/expired/revoked/SMTP failure; F5/new-tab, invalid refresh, profile cũ thiếu tên/Team, multi-Workspace và sau logout; không in tokens/passwords/link xác thực.
- [ ] Chạy hai kết nối thật race approve/approve, approve/reject và approve/accept: một kết quả cuối, một membership, không duplicate audit/notification; kiểm tra người thua nhận response hợp lệ.
- [ ] Nạp fixture pre-migration vào stack riêng; apply migration; xác nhận IDs, counts, role và profile cũ giữ nguyên, directory đóng mặc định. Thử rollback app giữ dữ liệu đơn/audit; không drop bảng trong rollback mặc định.
- [ ] Chạy toàn bộ `supabase test db`, reset **chỉ stack riêng** rồi chạy lại; pytest toàn backend, targeted Ruff, Node tests, lint/build, diff check, gitleaks redacted chỉ file thay đổi. Ghi rõ lỗi cũ ngoài phạm vi.
- [ ] Chuẩn bị diff migration và hướng dẫn: backup hosted, kiểm tra project/DB version/history, quyền operator, tắt nhận đơn khi rollout; migration → API → frontend; smoke test read trước khi mời user thật. Không reset/force/include-all tự động.
- [ ] Chỉ áp dụng hosted sau các gate kỹ thuật phía trên trong phạm vi người dùng đã cho phép. Nếu thiếu đường quản trị schema/SMTP, báo đúng điều kiện thiếu; không yêu cầu service key trong browser hoặc đổi .env để chữa tạm.
- [ ] Đối chiếu redirect allowlist, site URL và SMTP thật. Email Gmail thật chỉ gửi cho địa chỉ người dùng chỉ định; local Mailpit không tính đã nghiệm thu Gmail. Không tự gửi thư cho người khác từ danh sách nhân sự.
- [ ] Báo kết quả từng bước, giới hạn còn lại và link hướng dẫn; khởi động lại dự án, không commit/push.

## Tự rà soát kế hoạch

- Luồng email/password, công ty công khai, invitation và approval đều có UI/API/RPC/tests tương ứng.
- Quyền System Admin/MM/Leader/Employee, bypass Data API, bootstrap RPC cũ, race và audit có kiểm tra DB riêng.
- Team optional đúng spec, không biến tổ chức nhóm thành lời hứa về campaign Team-RLS chưa triển khai.
- Delivery trạng thái riêng, idempotency và lease tách khỏi transaction; không hứa exactly-once SMTP hoặc email đã vào inbox.
- Feature triển khai từng lớp nhưng chỉ nghiệm thu hoàn chỉnh sau Task 10; không có bước commit/push hay reset database cũ.

## Handoff

Kế hoạch này cần được người dùng xem và chọn cách thực thi trước khi viết product code:

- **Native (đề xuất):** triển khai tuần tự trong phiên hiện tại theo executing-plans;
  review độc lập cuối cùng theo skill. Hợp với frontend/API/SQL phụ thuộc contract chặt,
  giảm việc nhiều agent sửa cùng file và cùng database.
- **Subagent-driven:** agent riêng làm từng task và reviewer kiểm tra từng phần;
  dùng context nhiều hơn, phù hợp nếu muốn nhiều vòng kiểm tra độc lập.

Chưa khởi chạy agent hoặc thay đổi Auth/database từ bước lập kế hoạch này.

# Sửa & kiểm chứng Marketing Manager — 19/11/2026

## Phạm vi và môi trường

Worktree `.tmp/publish-dat`, Dat `559c6cf` + phần UI thanhtri `0495b3a` đang ghép chưa commit. Giữ các thay đổi có sẵn, không commit/push/reset Git, không sửa `.env`.

Người dùng đã cho phép ngoại lệ sửa `CastraServices/` và migration/test Supabase local; hosted phải hỏi riêng. Người dùng cho phép dùng hộp thư local, và chốt **chưa có provider phân tích đối thủ: giữ trạng thái chưa cấu hình**. Reportlab 5.0.1 đã có sẵn trong requirements/môi trường; không cài dependency mới. Font Noto Sans được kèm giấy phép SIL OFL.

Stack riêng `CastraVision-mm-functional-test`: API 60321, DB 60322, Mailpit 60324; frontend 60300, Django 60380. Biến môi trường được đặt đè riêng cho subprocess, không ghi key vào file. Guard chỉ nhận API loopback cổng 60321. Business API dùng JWT người dùng; service credential chỉ tạo fixture/Auth hoặc ghi trạng thái gửi email theo luồng hiện có, không dùng để chứng minh RLS.

## Bảng 15 nhóm: nguyên nhân, dependency và nghiệm thu

PASS dưới đây áp dụng các ca đã chạy trên local; không khẳng định đã triển khai hoặc kiểm chứng SMTP hosted.

| Nhóm audit | Nguyên nhân / thay đổi chính | Dependency | Kết quả và bằng chứng |
|---|---|---|---|
| #4 Dashboard | KPI và người thực hiện lấy fixture; thay bằng summary thật. SELECT membership trực tiếp bị RLS giới hạn chỉ mình nên dùng RPC personnel có kiểm tra MM, không nới policy. | Personnel RPC, approvals, audit SELECT | PASS: UI khớp 5 membership (1 MM, 1 Leader, 3 Employee) và 1 pending ở thời điểm đối chiếu; badge đổi sau submit. Không gọi số membership là online. |
| #6 Header search | Trước chỉ set state. Thêm debounce 300 ms, tối đa 5 campaign + 5 proposal, stale/timeout/error guard; chọn đúng bản ghi. | Campaign/proposal workflow | PASS: tìm proposal ngân sách vừa lưu, mở review thật; tìm không có kết quả sau khi đã mở review vẫn hoạt động; không giữ kết quả query cũ. Có regression test cho lỗi search bị unmount sau chọn kết quả. |
| #26 Audit list/filter/detail | Trước dùng INITIAL_AUDIT_LOGS. Đọc bảng thật, filter action/entity/date UTC, phân trang. Chỉ project metadata và role/status trước/sau, không đọc toàn payload. | Audit RLS hiện có | PASS: danh sách thật, lọc workspace_members; chi tiết không chứa before_value/after_value thô. Không cấp thêm quyền sửa/xóa nhật ký. |
| #27 Audit CSV | Trước xuất fixture. Xuất theo filter, đọc nhiều trang, tối đa 10.000; vượt giới hạn báo lỗi, không cắt âm thầm. | #26, CSV escaping | PASS: Blob CSV chỉ chứa entity đã lọc, không chứa payload nhạy cảm. Chưa xác minh thư mục Downloads của OS. |
| #29 Budget submit | Trước chỉ setSubmitted/notify. Route thật tái sử dụng ngân sách workflow, allocations/campaign thật, request UUID chống retry trùng, đọc lại proposal trước xác nhận. | Workflow submit/proposal, analytics thật | PASS UI: Apply Recommendation tạo thêm đúng một proposal budget_proposal, source rule_based, status pending; không tự áp dụng ngân sách. |
| #30 Reports CSV | Campaign và metrics mẫu. Chọn campaign thật, ngày UTC, metrics; tổng hợp observed qua RPC có kiểm tra phạm vi. | API manager/reports + migration guard | PASS: API và UI xuất CSV có campaign tiếng Việt, spend/revenue từ CSV nhập thật; retry cùng requestId trả cùng report. |
| #31 Reports PDF | Nút unavailable. Tạo PDF thật bằng Reportlab, font Unicode nhúng, escape nội dung Paragraph. | #30, Noto Sans OFL | PASS: bytes %PDF-/EOF, FontFile2; UI tạo Blob PDF thật. Chưa kiểm chứng Downloads OS và chưa có kiểm tra ảnh render tự động. |
| #32 Report history | Trước archive mẫu. Lưu snapshot + file base64 vào một reports.params, ready và artifact trong cùng INSERT. Không public URL. GET tải lại kiểm tra workspace/MM. | Restrictive SELECT guard mới | PASS: GET tải lại đúng bytes CSV/PDF sau tạo; Leader/Employee/MM công ty khác bị chặn; Employee gọi trực tiếp PostgREST không thấy artifact. History phân trang 20. Chỉ hiện báo cáo từ luồng mới, không giả vờ file legacy có thể tải. |
| #33 Competitor analysis | Dữ liệu và refresh giả; chưa có provider/nguồn đã nối. | Provider chưa có | BLOCKED theo quyết định người dùng: bỏ số đo giả ở route thật, hiện chưa cấu hình; không bịa ads/CPA/trend hoặc gọi dịch vụ trả phí. |
| #34 Add competitor | Nút chỉ notify. Form thật, backend validate, lưu registry, reload, chống trùng bằng index và kiểm tra đầu vào. | API manager/competitors, unique index | PASS API + UI: tên tiếng Việt lưu/đọc lại được; trùng khác hoa/thường trả 409; không suy từ registry thành kết quả phân tích. Không fetch URL người dùng nên không tạo đường SSRF. |
| #39 Business profile | Dependency initialProfile + onProfileUpdated tạo vòng lặp. Chỉ load theo workspace/retry; bỏ phản hồi cũ, giữ edit; parent không nuốt lỗi save. | Business profile GET/PUT sẵn có | PASS UI: sửa sản phẩm, save, mở lại đúng dữ liệu; request count dừng tăng. Test stale workspace, parent rerender, lỗi tải không fallback thành thành công. |
| #11 Remove membership | Chưa có dữ liệu riêng để thử. Dùng candidate local đã được duyệt. | RPC remove-member hiện có | PASS UI: checkbox xác nhận + thu hồi; cùng JWT đã đọc campaign trước thu hồi trả 403 sau thu hồi. Không xóa user Auth. Last MM bị endpoint chặn 403; pgTAP giữ kiểm tra last-admin SQL. |
| #12 Review join requests | Chưa thực thi approve/reject. | Password setup + recruitment + Team | PASS API + UI: approve cấp Employee đúng Team; reject lưu lý do và không cấp membership; cross-workspace 403; client gửi role admin bị 400; hai MM khác nhau duyệt cạnh tranh cho đúng một 200, một 409. MM thứ hai chỉ được gán tạm trong fixture local rồi gỡ lại. |
| #13 Invitations | Form chưa chứng minh gửi/nhận/accept. Phát hiện đường Quay lại Workspace không rerender khi chỉ đổi history và set state null cũ; thêm state cho invitationCallback. | GoTrue + Mailpit local + membership RPC | PASS LOCAL: UI gửi, Mailpit nhận; gửi lại thành công; user mới mở email → tạo mật khẩu → login mật khẩu thật → accept → Employee/1 Team. User đã có password cũng accept được. Sai người nhận 403, hết hạn/thu hồi 410, accept lại idempotent. UI thu hồi đã chạy. Không chứng minh Gmail/SMTP hosted. |
| #41 Password change | DTO xác thực Django không chứa aud, bị nhận nhầm là demo. Xác minh người dùng từ Auth getUser, đối chiếu ID, xác nhận mật khẩu hiện tại rồi updateUser. | Supabase Auth thật | PASS LOCAL UI: sai mật khẩu hiện tại bị chặn; đổi thành công; password grant với mật khẩu cũ bị 400 và mật khẩu mới 200. Không khẳng định mọi access token cũ bị thu hồi. |

**Tổng: 14 PASS trong phạm vi ca local đã nêu, 1 BLOCKED do chưa có provider (#33).** Đây không phải kết luận toàn bộ 44 nhóm hoặc mọi biến thể đầu vào đã hoàn chỉnh.

## Các file thay đổi phục vụ task

- `CastraView/src/App.jsx`: route live, propagate lỗi lưu, guard workspace, thoát invitation callback có rerender.
- `components/settings/BusinessProfileTab.jsx` và test: vòng đời load/edit/save; `AccountSecurityTab.jsx`: password flow không dựa vào aud trong DTO.
- `services/accountSecurityService.js` và test: xác minh Auth identity/current password/provider failure.
- `services/marketingManager.js`, `services/managerTools.js`: đọc summary/audit/search và API báo cáo/registry; không gọi API trực tiếp trong component.
- `hooks/useManagerQuery.js` và test: clear stale data, hủy/bỏ request cũ, timeout, retry.
- `company-admin/MarketingManagerLayout.jsx`, Header, ManagerSearch, LiveManagerDashboard, LiveAuditLog và layout test: route/data thật; fixture chỉ còn cho preview.
- `pages/LiveManagerBudget.jsx`, `LiveManagerReports.jsx` và test, `LiveManagerCompetitors.jsx`: luồng thật.
- `leader/WorkflowInbox.jsx`: nhận ID từ kết quả tìm; `services/leaderWorkflow.js`: invalidation badge sau mutation. Không thay policy workflow Leader.
- `CastraServices/manager_tools_api.py`, `manager_reporting.py`, `urls.py` và hai file test: endpoint riêng MM, artifact/CSV/PDF/registry.
- `CastraServices/assets/fonts/`: Noto Sans và LICENSE OFL để PDF không phụ thuộc font cài trên máy Windows.
- `supabase/migrations/20261118195135_marketing_manager_report_files.sql`: guard SELECT cho artifact mới, capability probe, uniqueness registry. Không đổi enum, không mở thêm quyền audit.
- `supabase/tests/11_manager_artifact_privacy.test.sql`: 8 ca RLS/capability/registry.
- `CastraView/scripts/run_mm_local.py`, `mm_local_harness.py`: tái tạo stack và kiểm chứng thật; credential bridge chỉ loopback và đã đóng sau test.

Phụ thuộc nhỏ ngoài 15 nhóm: bỏ nhận diện sai demo ở #41 cũng tác động code lưu hồ sơ cá nhân chung. Đã ưu tiên user.full_name từ DTO và kiểm tra UPDATE profiles có trả bản ghi; tránh lưu email prefix hoặc báo đồng bộ thành công khi không có row. **Chưa nâng #40 lên PASS**, chưa kiểm chứng toàn bộ luồng cá nhân. Không xử lý các nhóm một phần còn lại.

## Kiểm thử và giới hạn

- `mm_local_harness.py`: **32/32** kiểm tra Auth/API/PostgREST thật PASS; JSON bằng chứng kèm theo. API nghiệp vụ dùng JWT của từng role.
- UI thật: profile save/reopen; search/select/empty; audit filter/CSV; budget submit/read-back; report CSV/PDF; competitor add/read-back; approve/reject; remove-member; invitation email/password/accept; password change.
- Frontend: **17 file, 42/42 test PASS** ở lượt cuối, gồm parent rerender, stale workspace, save failure, report retry và search sau khi mở review.
- Django: **14/14** test render/API/Leader forwarding PASS (unit test riêng, không thay thế integration); có kiểm tra font chứa đủ glyph tiếng Việt.
- Auth security Node: **12/12 PASS**.
- SQL sau reset stack riêng sạch: **14 file, 244/244 PASS**, gồm test RLS mới. Hai lượt trước bị nhiễu do fixture E2E: 07 đếm công ty đang mở, 08 đếm dữ liệu Auth/delivery; không sửa hoặc bỏ test để che. Reset chỉ stack mới, không reset local cũ/hosted.
- Ruff trên file Python thay đổi: PASS. Lint/build frontend PASS ở lượt cuối, còn cảnh báo cũ và bundle >500 KB; không thêm warning mới.
- `git diff --check`: PASS, chỉ cảnh báo LF/CRLF. Gitleaks lượt cuối scoped 77 file thay đổi, no-git/redact: **0 phát hiện**; không quét `.env` hay in giá trị bí mật.
- Helper membership cũ không chạy được vì không lấy được status stack mà helper đó hard-code. Không sửa guard để chạy ép; các ca thực được kiểm chứng trên stack mới và SQL suite.
- Nội dung Blob và artifact API trên đĩa đã xác nhận; tool cấm chrome://downloads nên **không coi thư mục Downloads của trình duyệt đã được kiểm chứng**.
- Snapshot PDF có font nhúng và cấu trúc PDF thật; chưa kiểm tra hình render bằng công cụ PDF chuyên dụng.
- Chưa kiểm thử toàn bộ 30 campaign cùng lúc, mọi lỗi mạng/provider, mọi browser hoặc SMTP hosted.

## Lưu file và giới hạn dung lượng

Artifact được lưu trong JSONB của reports cùng snapshot, tối đa 512 KB/file; tối đa 30 campaign/báo cáo, một loại tiền. Đây là cách lưu bền vững có quyền đọc qua RLS/API, không phải localStorage hoặc link public. Nếu quy mô tăng, chuyển artifact sang bucket private có policy tương đương là backlog; không tăng giới hạn vô hạn. Mỗi campaign được tổng hợp bằng RPC riêng, chưa phải snapshot toàn bộ nhiều campaign tại một thời điểm transaction duy nhất.

## Rollout / rollback

**Hosted đã áp dụng ngày 19/11/2026, sau khi người dùng duyệt riêng.** Chỉ migration `20261118195135_marketing_manager_report_files.sql` được triển khai, không đẩy các migration pending khác. SHA-256 của nguồn đã duyệt: `d74a9b3f1b0321b3d81dd4f14e8e974beec0fbeb1145a68a40739dd00b5f0155`.

Preflight: 0 nhóm keyword trùng; RLS của reports/competitor_insights đã bật; chưa có đối tượng hoặc history của migration này. Catalog và hai bảng liên quan được sao lưu ngoài Git tại `C:/Users/Admin/Documents/CastraVision-backups/mm-tools-20261119-052837` (không phải bản dump toàn database). Áp dụng đúng nội dung đã duyệt cùng timeout/advisory lock, history và assertions trong một transaction.

Postflight: history đúng 1 dòng; policy restrictive, unique index valid, probe SECURITY INVOKER, anon không có EXECUTE, authenticated có EXECUTE. Số report và competitor trước/sau đều 0, không chỉnh sửa/xóa dữ liệu nghiệp vụ.

`marketing-manager-hosted-smoke.json`: **11/11 kiểm tra bằng JWT thật PASS**: anonymous 401; MM capability=true và GET reports/competitors 200; Leader/Employee capability=false và GET hai API 403. Chỉ đăng nhập/đăng xuất phiên smoke riêng, không đăng xuất các thiết bị khác. Một lượt gặp TLS connection reset; lượt cuối đã PASS, không tắt xác minh TLS hoặc thay authentication để vượt qua.

`marketing-manager-hosted-rls-probe.sql`: chạy role authenticated với claims demo; MM đọc được artifact thử, Leader/Employee không đọc được. Transaction rollback và kiểm tra fixture không còn tồn tại đều đạt. Đây là kiểm tra policy bằng JWT claims giả lập trong SQL, tách biệt với kiểm tra JWT thật qua HTTP ở trên. Không tạo report nghiệp vụ thật hoặc gửi email hosted trong đợt triển khai này.

API vẫn gọi `membership_manager_tools_ready` trước đọc/tạo artifact và trước ghi registry: thiếu migration trả SCHEMA_NOT_READY, không ghi file trước khi có policy bảo vệ. Mã triển khai/kiểm chứng ở `CastraView/scripts/deploy_mm_hosted.py` và `verify_mm_hosted.py`; không đọc `.env`, không lưu key/token ra báo cáo. Bản code ứng dụng đã sửa vẫn ở worktree `.tmp/publish-dat`, chưa commit/push.

Trước hosted cần review migration, backup/schema record, kiểm tra duplicate `workspace_id, lower(btrim(keyword))`; nếu có duplicate phải dừng và thống nhất xử lý, không tự xóa. Migration có BEGIN/COMMIT: guard, index, probe phải thành công cùng nhau. Deploy schema trước API/UI; giữ JWT/role cũ tương thích.

Rollback ưu tiên trả API/UI về phiên bản trước nhưng **giữ restrictive policy**. Không drop policy trong khi reports còn artifact source marketing_manager_v1 vì policy legacy cho Employee đọc ready report. Muốn rollback schema phải di chuyển/xóa đúng artifact mới sau backup và phê duyệt, rồi mới gỡ guard/probe/index trong migration riêng. Không sửa lịch sử migration đã áp dụng.

## Dữ liệu thử / dọn dẹp

Tất cả fixture mới dùng email example.test và workspace `[MM-LOCAL]`, không gửi thư ra ngoài. Đã đăng xuất ba browser context, xóa biến credential khỏi window, đóng bridge/backend/frontend test; reset đúng stack mới để xóa user/workspace/file trong DB và dọn mailbox local. File bằng chứng/CSV/PDF tổng hợp còn ở `.tmp/mm-functional-test` (ignored) và JSON báo cáo không chứa token/mật khẩu. Dữ liệu hosted và stack local cũ được giữ nguyên.

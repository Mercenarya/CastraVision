# Kết quả sửa luồng Leader — local, chưa triển khai hosted

**Cập nhật sau khi được phép triển khai:** CLI đã đăng nhập, backup đã tạo/phục hồi thử. Preflight phát hiện lệch validator/audit của hosted nên cần migration tương thích thứ tư, đang chờ duyệt phần phát sinh. Xem `leader-hosted-rollout-status.md`; kết quả 232 test trong báo cáo gốc dưới đây là trước khi bổ sung 4 test audit actor.

Worktree: `.tmp/publish-dat`, branch Dat, nền `d14a54e`. Giữ nguyên phần bỏ banner mời/gia nhập. Không commit/push; không sửa `.env`, dependencies, launcher, Docker hay CI. Ba migration mới chỉ áp dụng trên `CastraVision-leader-test`.

## Chức năng và bằng chứng

| Nhóm | Kết quả local | Bằng chứng |
| --- | --- | --- |
| Overview / Sync | PASS | Identity, workspace, Team và KPI thật; Sync tạo bốn request mới, không chỉ remount. Dữ liệu trống không thay bằng fixture. |
| Campaigns | PASS | Browser tạo campaign, reload đọc lại. HTTP kiểm tra idempotency và phạm vi; phân trang/filter được kiểm tra riêng trong harness. |
| Approvals / My Proposals | PASS | Query server, filter/search/count và ownership; quyết định lưu DB, lịch sử version thật, conflict 409. Export Blob chứa dữ liệu thật và escape/formula guards có test. |
| Content review | PASS | Draft → sửa headline → pending → Marketing Manager duyệt v4. Employee gửi bài qua UI; Leader yêu cầu revision với lý do bắt buộc. |
| Budget review | PASS | Không NaN; edit 620/380 giữ envelope 1000. Server kiểm tra baseline hiện hành, ±20%, tự duyệt và escalation; MM resolve cập nhật phân bổ kế hoạch. |
| Strategy → Content | PASS có giới hạn provider | Sửa lỗi vận hành RAG bằng migrate đúng SQLite local. UI gọi backend, lưu strategy, MM duyệt, Leader nạp strategy đã duyệt để tạo template và lưu draft. Provider kiểm thử là `deterministic-fallback`, không kết luận LLM thật đã chạy. |
| Import | PASS | CSV/XLSX preview chỉ đọc, commit thật/atomic, batch retry không nhân đôi. History aggregate trên DB, không đếm mẫu giới hạn 2000 dòng. Browser import/reload giữ batch một dòng. |
| Performance / Insights | PASS | Đối chiếu spend 150, revenue 450, ROAS 3, CPA 37.5 từ hai dòng đã nhập. Tách tiền tệ; không dùng metric cũ chưa rõ provenance. |
| Recommendation / Pause | PASS ở tầng governance | Recommendation tạo budget proposal thật theo quy tắc ROAS. Pause chọn content đã approved và tạo pending request; không báo đã pause hay gọi mạng quảng cáo. |
| Account | PASS | Chỉ sửa tên/avatar của chính actor; tên lưu được, header giữ sau reload. Không mở quyền sửa doanh nghiệp. |
| Notifications | PASS | Recipient thật, unread 4→3 và giữ sau reload. Dùng lại FR10 notifications. MM inbox và Employee submissions/feedback nối cùng workflow. |

Chi tiết thao tác browser ở `leader-browser-retest.json`; integration HTTP thật ở `leader-local-http-evidence.json`. Các tài khoản, mật khẩu và JWT test không được ghi trong hai báo cáo.

Phân loại kết quả: **11 nhóm chức năng local PASS, 0 nhóm local FAIL; 21 quan sát browser PASS; 14 nhóm HTTP integration PASS**. Một bộ Node test cũ ngoài workflow vẫn FAIL như mô tả bên dưới. **Hosted rollout BLOCKED** chờ phê duyệt/preflight/backup. **NOT VERIFIED**: provider LLM thật, thao tác mạng quảng cáo ngoài hệ thống và hoàn tất lưu download trên đĩa của trình duyệt; không tính ba việc đó là PASS.

Lỗi ban đầu tương ứng: Overview/Performance/Notifications dùng fixture; campaign chỉ toast; queue/review/revision chỉ React state; budget thiếu contract gây NaN/TypeError; Strategy bị thiếu bảng SQLite; import hosted thiếu raw columns; Account mở form sửa doanh nghiệp sai quyền. Cách sửa và bằng chứng persistence cho từng nhóm nằm trong bảng trên, đối chiếu baseline đầy đủ ở `leader-functional-audit.md`.

## Các file cần đổi

- `CastraServices/leader_workflow_api.py`, `urls.py`, `supabase_client.py`: gateway có whitelist, verified workspace/JWT, mapping lỗi có cấu trúc. Generate retry đọc draft đã lưu trước khi gọi lại provider.
- `campaign_api.py`: giữ parser/validation CSV/XLSX, chuyển commit qua RPC có campaign/Team và batch xác định từ nội dung. Sửa các test consumer tương ứng.
- Ba migration `20261118090000`, `20261118091000`, `20261118092000`: sửa schema import, scoped workflow/revisions và RPC. Không đổi enum role.
- SQL test 09 thêm scenario; 04/06 bổ sung fixture confirmed/Team và policy expectation phù hợp thay đổi bảo mật, không skip test hoặc cấp quyền rộng để vượt kiểm tra.
- `services/leaderWorkflow*`, `hooks/useLeaderWorkflow`, `leader/LeaderWorkspace`, screen/component trực tiếp liên quan: thay dữ liệu/state giả bằng persistence, loading/error/retry và action thật. Giữ navigation/layout Leader; không đổi theme toàn app.
- `App.jsx`, `MarketingManagerLayout.jsx`, `WorkflowInbox`, `WorkflowStudio`: nối đúng các consumer content/import/approval/feedback của MM và Employee. Không làm lại dashboard hay module khác của hai role đó.
- `scripts/leader/`: harness local cô lập và HTTP/concurrency checks; không phải launcher production mới.

### Danh mục từng file

| File | Lý do |
| --- | --- |
| `CastraServices/leader_workflow_api.py` | Gateway workflow có whitelist, JWT và strategy retry/persistence. |
| `CastraServices/test_leader_workflow_api.py` | Regression identity injection, method/JSON, conflict, retry và invalid import. |
| `CastraServices/campaign_api.py` | Commit theo campaign, deterministic batch và RPC atomic; giữ parser hiện có. |
| `CastraServices/supabase_client.py` | Cho phép đúng RPC mới và giữ HTTP status/mã lỗi nghiệp vụ. |
| `CastraServices/urls.py` | Route gateway mới. |
| `CastraServices/test_supabase_session_flow.py` | Kiểm tra JWT forwarding với import contract mới. |
| `CastraServices/tests.py` | Cập nhật fixture/consumer import có campaign và RPC. |
| `CastraView/src/App.jsx` | Entry point live Leader, consumer MM/Employee và campaign selector cho shared import. |
| `CastraView/src/App.test.jsx` | Kiểm thử shared import với campaign bắt buộc. |
| `CastraView/src/company-admin/MarketingManagerLayout.jsx` | Nối hàng đợi thật để MM giải quyết proposal/escalation. |
| `CastraView/src/hooks/useLeaderWorkflow.js` | Fetch/retry/cancellation, error state và double-submit guard. |
| `CastraView/src/services/leaderWorkflow.js` | Tập trung API workflow/import và xuất CSV. |
| `CastraView/src/services/leaderWorkflowContract.js` | Format tiền an toàn, ngưỡng budget, labels và CSV escaping. |
| `CastraView/src/services/leaderWorkflow.test.js` | NaN/missing money, 20%/zero baseline, CSV formula regression. |
| `CastraView/src/leader/LeaderWorkspace.jsx` | Context thật, navigation entity ID và refresh server. |
| `CastraView/src/leader/LeaderLayout.jsx` | Bỏ identity/workspace/badge giả khỏi layout đang dùng. |
| `CastraView/src/leader/LeaderSidebar.jsx` | Count approvals từ server. |
| `CastraView/src/leader/WorkflowInbox.jsx` | Queue/detail/feedback dùng chung đúng context, Employee own scope. |
| `CastraView/src/leader/WorkflowStudio.jsx` | Composer/own submissions/detail cho consumer MM/Employee. |
| `CastraView/src/leader/screens/LeaderCampaigns.jsx` | Tạo draft, danh sách/filter/page/detail/export thật. |
| `CastraView/src/leader/screens/LeaderApprovalQueue.jsx` | Queue/My Proposals, search/filter/page/refresh/export thật. |
| `CastraView/src/leader/screens/WorkflowComposer.jsx` | Strategy backend và content draft/template từ strategy đã duyệt. |
| `CastraView/src/leader/screens/WorkflowComposer.test.jsx` | Không điều hướng/báo lưu khi server lỗi; retry giữ request ID. |
| `CastraView/src/leader/screens/WorkflowImport.jsx` | Preview/commit và aggregate batch history đọc lại sau reload. |
| `CastraView/src/leader/screens/WorkflowPerformance.jsx` | Weighted metrics theo campaign/date/currency, export đúng dữ liệu. |
| `CastraView/src/leader/screens/WorkflowNotifications.jsx` | Danh sách, unread, mark-read và entity link thật. |
| `CastraView/src/leader/screens/WorkflowAccount.jsx` | Chỉ sửa tên/avatar của actor hiện tại. |
| `CastraView/src/leader/components/LeaderProposalReview.jsx` | Content/budget detail, edit/decision/reason/audit/version thật. |
| `CastraView/src/leader/components/WorkflowBudgetForm.jsx` | Budget proposal từ baseline authoritative của campaign. |
| `CastraView/src/leader/components/WorkflowRecommendation.jsx` | Rule-based recommendation và yêu cầu pause qua governance. |
| `CastraView/src/leader/components/WorkflowCampaignSelect.jsx` | Chỉ lấy campaign được server cho phép. |
| `CastraView/src/leader/components/WorkflowPanel.jsx` | Loading/error/empty/retry dùng chung, không toast thành công giả. |
| `supabase/migrations/20261118090000_reconcile_import_columns.sql` | Reconcile raw import/provenance tương thích hosted. |
| `supabase/migrations/20261118091000_leader_workflow_schema.sql` | Liên kết scope, revision, grants và restrictive policies. |
| `supabase/migrations/20261118092000_leader_workflow_rpc.sql` | Transaction, workflow state machine, budget/Team checks và analytics. |
| `supabase/tests/04_auth_and_campaign_integrity.test.sql` | Fixture Team/confirmed/RPC và expected policy set mới. |
| `supabase/tests/06_audit_log_triggers.test.sql` | Confirm fixture đúng điều kiện identity để tiếp tục kiểm tra audit. |
| `supabase/tests/09_leader_workflows.test.sql` | 57 assertion workflow/RLS/transaction/grant/integrity. |
| `scripts/leader/local_stack.py` | Chốt project/ports riêng, tái dùng guard/harness có sẵn. |
| `scripts/leader/local_verify.py` | Real Auth/HTTP/DB, XLSX, replay/race, boundary và browser fixture local. |

Sáu tài liệu/bằng chứng mới của lượt sửa: `leader-browser-retest.json`, `leader-local-http-evidence.json`, `leader-hosted-preflight.json`, báo cáo này và hai plan `2026-11-18-leader-live-workflows.md` / `2026-11-18-leader-hosted-rollout.md`. Các baseline audit và `apply-approved-hosted-membership.sql` có sẵn được giữ nguyên; không tính là code triển khai Leader mới.

## Kiểm tra bảo mật bổ sung

RLS/RPC được chạy bằng authenticated với JWT riêng cho từng role. Có hai workspace và nhiều Team. Không role/actor do client gửi, không đọc chéo workspace/Team, không lộ draft hay revision của tác giả khác qua REST. Bản ghi mới gắn Team/campaign chỉ được đổi bằng RPC: ngay cả Marketing Manager cũng không được PATCH tháo scope rồi bỏ qua transition. Test này đã tái hiện đỏ trước khi bổ sung policy chặn.

Không thêm đường Django session fallback hoặc dùng service role cho API nghiệp vụ. Quyền nhân sự, last-admin protection và immutable audit vẫn có test hồi quy.

## Kết quả kiểm tra cuối

| Kiểm tra | Kết quả |
| --- | --- |
| SQL, gồm policy siết write/draft và batch rollback | **12 file, 232/232 PASS trước và sau reset** stack test riêng. Test 09 có 57 assertion. |
| HTTP/Auth/Supabase thật | **14 nhóm PASS**: login, Team, concurrency create/import/decision, conflict approve/reject, CSV/XLSX, history, weighted metrics, strategy retry/FK, ngoại lệ MM tự duyệt strategy, biên đúng 20%, filter/pagination. |
| Pytest toàn bộ | **50 PASS** |
| Vitest | **25 PASS / 8 file** |
| Node Auth / membership | **11 + 11 PASS** |
| Ruff trên các Python file thay đổi | PASS |
| Frontend lint / build | PASS, còn warning cũ và chunk size; không có warning mới trong component workflow. |
| Django check / makemigrations check | Không lỗi / không có model migration thiếu. |
| `git diff --check` | PASS; cảnh báo chuẩn hóa LF/CRLF của Git không phải lỗi whitespace. |
| Gitleaks working changes | **0 phát hiện trên 50 file** đã quét; `.env` không nằm trong tập scan hoặc thay đổi. Không suy rộng thành toàn lịch sử Git sạch. |

Sau kiểm thử browser, bridge credential và hai server QA (59300/59800) đã dừng. Reset cuối dọn fixture disposable; không reset local stack cũ hoặc project thật. Lượt SQL cuối chạy trên schema mới sạch và rollback dữ liệu test.

Test cũ `src/marketing/tests/storeSeparation.test.js` chạy bằng Node vẫn **FAIL trước khi vào test**: thiếu module `proposalDecisionService.js` (đã tồn tại trong baseline audit). Không tạo lại hệ thống store/approval giả để làm test này xanh, không sửa exclude/skip hoặc runner. Lint có warning cũ tại test đó và Fast Refresh; build có warning chunk >500 KB.

## Hosted và giới hạn thực tế

Hosted **chưa được sửa schema/dữ liệu**. Probe chỉ đọc xác nhận thiếu raw import columns (`42703`) và chưa có `campaigns` (`PGRST205`); xem `leader-hosted-preflight.json`. Bởi vậy chưa thể nói ứng dụng dùng project thật đã hoạt động đầy đủ sau các thay đổi local. Backend thật đang chạy `--noreload` cũng cần restart cùng bản schema/frontend sau khi được duyệt cutover.

Xem `../../plans/2026-11-18-leader-hosted-rollout.md` trước khi cho phép triển khai: preflight catalog/history, backup ngoài Git, maintenance window, transaction và phương án phục hồi. Không tự gán Team cho dữ liệu/tài khoản cũ; chưa được phân công thì user thấy trạng thái rỗng có giải thích.

Dropdown chọn campaign/strategy/variant hiện tải tối đa 100 mục; campaign và proposal table/export có phân trang server. Provider AI trả phí, email SMTP và thao tác quảng cáo ngoài hệ thống không nằm trong kiểm thử này. Browser xác nhận nội dung Blob CSV thực; công cụ không cung cấp thư mục download để xác nhận hoàn tất lưu file trên đĩa.

Các dashboard fixture ngoài role Leader, các test store cũ và CI chung không được tuyên bố đã hoàn thiện trong task này.

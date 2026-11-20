# Employee remediation — 20/11/2026

## Trạng thái

Người dùng đã duyệt ngoại lệ backend + Supabase local và mô hình task tối thiểu qua câu trả lời cho `call_1a2fb9a8852e440ebbee4cf091123ba9`: Leader/Marketing Manager giao việc trong Team/campaign, một Employee nhận việc, deadline tùy chọn, Employee cập nhật việc của mình và liên kết proposal. Không có subsystem sprint. Đã triển khai DB/API/UI local; hosted chưa được phép triển khai. Không commit/push, không chỉnh env hoặc thêm dependency.

Thiết kế/phạm vi: `docs/UI/specs/2026-11-20-employee-live-workflows.md`. Worktree `.tmp/publish-dat`, Dat baseline `171f973`; giữ các thay đổi System Admin/Leader/Marketing Manager đang có. Chỉ dùng tài khoản disposable trên `CastraVision-platform-test`; không dùng tài khoản thật của người dùng. Fixture local được giữ để đối chiếu, server audit 61480 đóng sau kiểm thử.

## Đã thay đổi và lý do

| File/nhóm | Thay đổi |
|---|---|
| `CastraView/src/App.jsx` | Employee mount theo user+workspace key; bỏ branch placeholder cũ và imports/wrapper không còn dùng; giữ branch các role khác |
| `member/EmployeeWorkspace.jsx` | Điều phối Dashboard, task thật, campaigns, reference, proposal ID, notifications và Settings |
| `member/ui/MemberDashboardView.jsx` | Bỏ MOCK_TASKS/SUBMISSIONS/CAMPAIGNS và KPI literal; identity/Team, proposal totals, recent proposals, campaigns thật; nguồn task/sprint/provider thiếu hiển thị rõ |
| `member/screens/EmployeeCampaigns.jsx` | Read-only list/search/status/page/detail qua workflow API; không create/export |
| `member/screens/EmployeeReferences.jsx` | Danh sách strategy approved và detail read-only; luồng tạo draft riêng vẫn được giữ |
| `services/employee.js` | Tổng hợp context/list/counts từ API hiện có; dùng server total, không đếm chiều dài trang; tối đa ba request đồng thời |
| `hooks/useEmployeeOverview.js` | Abort và identity-bound state, clear dữ liệu khi lỗi, retry, reload khi workflow thay đổi |
| `member/MemberLayout.jsx`, `EmployeeSidebar.jsx` | Bỏ user/company/code/counter giả; unread từ dữ liệu, không health claim; drawer Escape giữ hoạt động |
| `navigation/roleNavConfig.js`, `dashboards/RoleSidebar.jsx` | Bỏ badge Employee 5/2; hỗ trợ translation key riêng cho Strategy Reference, không đổi ngữ nghĩa sidebar Leader |
| `services/leaderWorkflow.js` | Read notification phát workflow-changed để counter reload |
| `components/settings/NotificationPreferencesTab.jsx` | Reset lỗi localStorage không được báo thành công hoặc giả defaults đã lưu |
| `i18n/locales/en.js`, `vi.js` | Text Dashboard mới qua provider EN/VI; mô tả preferences đúng phạm vi local thiết bị |
| `member/EmployeeAudit.test.jsx`, `MemberLayout.test.jsx` | Hồi quy bỏ fixture, đúng proposal ID, unavailable, locale, shell và drawer |
| `hooks/useEmployeeOverview.test.jsx`, `services/employee.test.js` | Late response identity cũ, lỗi/retry, totals và giới hạn concurrency |
| `components/settings/NotificationPreferencesTab.test.jsx` | Per-user persistence/remount/reset và storage failure |
| `scripts/employee_local_audit.py`, `employee-ui.audit.jsx`, `employee-audit.config.js`, `employee-audit.transport.js` | Tích hợp local thật, scoped transport không hosted, profile/password/template/preferences/logout; evidence không credential |
| `supabase/migrations/20261120104659_employee_assigned_tasks.sql`, `tests/15_employee_tasks.test.sql` | Schema/RLS/RPC/audit/notifications task và 35 kiểm tra quyền/lifecycle |
| `CastraServices/employee_api.py`, `test_employee_api.py`, `urls.py`, `supabase_client.py` | Endpoint Employee hẹp và forward JWT; 4 test API, không service role CRUD |
| `services/employeeTasks.js`, `hooks/useEmployeeTasks.js`, `useEmployeeTasks.test.jsx` | API task, abort/timeout/identity-query isolation và chống flash nhân sự của campaign trước |
| `member/TaskBoard.jsx`, `components/TaskAssignmentForm.jsx`, `TaskDetail.jsx` | List/filter/page/detail, operator create, Employee update/link, read-back/version; accessible label rõ |
| `leader/screens/LeaderCampaigns.jsx`, `pages/membership/PersonnelPage.jsx` | Điểm vào giao việc cho Leader/MM; giữ các luồng cũ |
| `leader/WorkflowInbox.jsx`, `screens/WorkflowNotifications.jsx` | Notification task mở đúng task ID trong Employee |
| `leader/screens/WorkflowComposer.test.jsx` | Clipboard rejection báo lỗi, không submit hoặc điều hướng giả |
| `scripts/run_platform_local.py`, `employee-browser.config.js` | Stack DB trống riêng 63322; cấu hình browser audit loopback, không load env file |

## Kiểm chứng

Bổ sung task: migration `20261120104659_employee_assigned_tasks.sql`, `CastraServices/employee_api.py`, route/RPC allowlist, `services/employeeTasks.js`, hook, TaskBoard/TaskAssignmentForm/TaskDetail. Leader mở giao việc từ Campaigns; Marketing Manager mở từ Personnel. Employee không có nút giao việc và không được tự cấp task qua API/RPC.

Database: **18 file / 320 assertions PASS** trên stack fixture `CastraVision-platform-test`, sau đó **320/320 PASS** trên DB trống mới `CastraVision-employee-clean-test` (63322) do CLI pinned chạy toàn bộ chuỗi migration từ đầu, không reset stack cũ. File 15 có **35 assertions** cho tasks: quyền đọc/ghi, own/Team/workspace, actor/payload injection, candidates không email, idempotence, stale version, lifecycle/proposal scope, audit và JWT cũ sau gỡ Team/Inactive. Audit/notifications lấy actor thật; hoàn thành task không duyệt nội dung.

Backend: **71/71 PASS**, cấu hình process local/SQLite memory và tắt dotenv. Test API mới tự override URL/key fixture; không cần cấu hình máy người chạy. Ruff các file Python task/harness PASS.

Frontend cuối: **31 file / 75 test PASS** bằng `npm test -- --maxWorkers=1`; Auth **12/12**, membership **11/11**. Lần chạy song song cùng Docker bootstrap có 2 test cũ timeout; không sửa test để nới tiêu chuẩn, chạy lại toàn bộ một worker đạt. Lint 0 lỗi (16 cảnh báo cũ); build PASS, bundle JS 794,97 kB, cảnh báo >500 kB còn nguyên.

Tích hợp cuối: **45/45 checks PASS**, gồm **2/2 bài UI tích hợp production App và 23/23 observation UI**. Auth/PostgREST/Django thật; UI tự động trong JSDOM không mock HTTP. Một bài Employee đầy đủ; một bài Leader giao việc bằng UI → Employee đăng nhập lại → nhận task → liên kết và mở đúng draft của mình. Bằng chứng: `employee-remediation-real-local.json`, `employee-remediation-ui.json`, `employee-remediation-transport.json`.

### Trình duyệt thật bổ sung

Chrome DevTools MCP trong context riêng, UI `127.0.0.1:61400`, API 61480, Supabase local 61321. **12/12 quan sát đạt**, lưu tại `employee-remediation-browser.json`: đăng nhập Employee, cập nhật task và API đọc lại completed, mở đúng proposal liên kết, lưu draft thật, clipboard bằng nút Copy rồi Ctrl+V native đúng cả bốn trường; reload mobile 375px giữ session/draft/KPI, không tràn ngang Dashboard, drawer đóng bằng Escape; menu EN→VI lưu locale; logout rồi history back/forward/reload không khôi phục phiên; coworker đăng nhập không thấy task/draft Employee trước. Console Employee sau navigation trả 0 error/warning tại thời điểm kiểm tra.

Đã thử thêm **Marketing Manager qua trình duyệt thật**: Personnel → Giao nhiệm vụ theo chiến dịch → chọn campaign/Employee → tạo `Browser MM Assigned Task`; detail và API đọc lại đúng assignee, deadline null. Không coi bước chờ dropdown tải hoặc selector sai tên locale là lỗi sản phẩm. Không có visual baseline/axe hoặc số đo Web Vitals nên chưa chứng nhận visual/a11y/performance toàn bộ app. Session browser thử đã sign out, tab đóng và chỉ các process audit/Vite sở hữu được dừng.

Sửa nhãn truy cập ô liên kết proposal: phần hướng dẫn “100 đề xuất” trước đó lẫn vào accessible name, khiến tìm đúng trường bằng tên thất bại. Đặt aria-label rõ ràng cho select. Test clipboard bị từ chối được thêm vào component: báo lỗi và không gọi submit/navigation; đây là rejection giả lập, tách biệt bằng chứng copy/paste browser thật.

- Các ca dưới đây nằm trong bộ tích hợp cuối và kiểm thử browser riêng; không đánh đồng JSDOM với browser đồ họa.
- Ca âm bổ sung đều đạt: campaign khác Team bị API từ chối và direct REST RLS trả rỗng; giả role trong payload bị 400; JWT đã cấp trước mất quyền campaign sau gỡ Team; gửi draft cùng request ID trả cùng bản ghi; revise version cũ bị STALE_VERSION/409. Sau ca revoke chỉ phục hồi Team cho user thử để chạy UI, không thay nhân sự thật.
- Template: chiến lược chưa duyệt bị từ chối; Employee gửi strategy, Leader duyệt, template được lưu/read-back đúng strategyId/source; UI chọn strategy và điền template thật.
- Profile: Employee cập nhật bằng form, Auth metadata và public.profiles đọc lại đúng; Settings không unmount khi cùng user cập nhật.
- Password: service production kiểm tra current sai; current đúng đổi mật khẩu disposable; grant cũ fail, grant mới success; không in password/token. Đây không phải kiểm tra gõ mật khẩu trên browser đồ họa.
- Preferences: cùng Employee toggle/save/remount/reset bằng UI; component test xác nhận user khác không dùng cấu hình cũ và reset storage thất bại không báo thành công.
- Logout: click menu Employee rồi logout, private layout bị gỡ; browser back/forward/reload và đổi sang coworker đã thử thêm ở mục trên.
- Lint/build/Ruff PASS; diff check chỉ cảnh báo LF/CRLF. Các file mới cũng được quét whitespace riêng.

Các lần thử chưa đạt đã được điều tra, không giấu: Dashboard gửi bảy request đồng thời làm server WSGI test single-worker/queue nhỏ trả ECONNREFUSED. Frontend hiện chia đợt tối đa ba request; server audit dùng threaded WSGI tương tự dev server. Token renewal sau password change cũng có tải đồng thời. Sau chỉnh harness/concurrency, các ca hoàn chỉnh PASS. Không suy từ đây ra số đo latency production.

Một lỗi selector harness do dropdown strategy chứa tên campaign trùng dropdown campaign đã được sửa bằng selector trong đúng select. Không tính lỗi selector là lỗi sản phẩm. Test reset localStorage đã RED đúng hành vi báo thành công sai trước khi sửa, sau sửa GREEN.

Các lượt task UI đầu chưa đạt: bước login Leader nhận 401 ngay sau cấp token mới; harness hiện đợi 2 giây trước khi mount sau đổi identity (chỉ audit, không sửa Auth production). Clock skew Windows/Docker là vấn đề đã biết nhưng lượt này chưa chứng minh nguyên nhân cụ thể của 401. Một lượt click nút giao việc khi campaign còn tải nên nút disabled; harness đã chờ trạng thái enabled. Lượt tiếp phát hiện accessible name của select liên kết chứa cả helper text; đã sửa nhãn rồi chạy lại đủ 45/45 và browser thực. Không ghi nhận các lượt thất bại là sản phẩm PASS.

WSGI test từng ghi ConnectionResetError khi client abort request lúc navigation/logout; harness hiện chỉ bắt riêng lỗi socket reset này và ghi số cancelledConnections trong report. Các exception khác không bị nuốt; không ghi body/header/credential. Không tuyên bố đã kiểm tra browser console. Transport evidence chỉ path/status/timing/error code.

Gitleaks quét bản export 114 file source/docs thay đổi (không env/history), không phát hiện secret. Migration Employee mới chỉ được áp dụng local.

## Ma trận 32 nhóm hiện tại

| # | Nhóm | Kết quả / giới hạn |
|---|---|---|
| 1 | Auth/session | PASS local Auth/API và App restore |
| 2 | Chặn vượt quyền | PASS các API create campaign/approve/personnel/business write/report của Employee bị chặn; không thay RLS |
| 3 | Danh tính/Team | PASS context thật, không Alex/Alpha |
| 4 | KPI | Task active/completed và proposal totals lấy summary thật; lỗi task riêng không giả số 0 |
| 5 | Priority tasks | Task active thật, deadline tăng dần/null cuối, mở detail đúng ID |
| 6 | Task search/filter | API/SQL thật theo search/status/campaign, phân trang 10; chưa stress UI nhiều trang |
| 7 | Edit/resubmit từ Dashboard | Mở đúng proposal ID; task status/link riêng, không thay thế luồng duyệt |
| 8 | My Tasks | DB/API/UI thật; version chống ghi đè, Employee không hủy/giao việc |
| 9 | Assigned Campaigns | PASS list/detail thật, search/page theo server; chưa browser nhiều trang/revoke giữa lúc detail mở |
| 10 | Recent submissions | PASS own list/ID thật; feedback dùng field server |
| 11 | Sprint | CHƯA CẤU HÌNH theo đề xuất; chưa suy velocity hoặc deadline |
| 12 | Content shortcuts | PASS bỏ lời hứa ba chế độ AI; một trình soạn thủ công/template có nhãn đúng |
| 13 | Brand Safety | PASS local provider internal_rules, cấu hình MM lưu thật và Employee kiểm tra; không chứng nhận tuân thủ pháp lý |
| 14 | Lưu nháp | PASS UI+API thật |
| 15 | Sửa nội dung | PASS API revise/read-back, hồi quy cũ giữ |
| 16 | Gửi duyệt | PASS draft→pending/read-back |
| 17 | My Submissions/filter | PASS UI+API mine/search/status/kind; pagination nhiều trang chưa stress |
| 18 | Detail/history | PASS API/history phiên bản thật |
| 19 | Feedback/kết quả duyệt | PASS Leader thật review, Employee đọc kết quả |
| 20 | Resubmit | PASS revision_requested→pending API |
| 21 | Strategy Reference | PASS approved list/detail read-only; generator tách riêng |
| 22 | Tạo strategy | PASS deterministic fallback có nguồn/cảnh báo; không AI provider thật |
| 23 | Template | PASS unapproved deny + approved API/UI persistence; chưa ca template foreign-Team thật trong harness mới |
| 24 | Clipboard | PASS copy + Ctrl+V native trên browser thật; denial báo lỗi qua component mock, chưa thử OS permission-denied thật |
| 25 | Notifications | PASS actual list/read/unread decrement API/UI |
| 26 | Badges/health | Task/unread thật; ẩn task badge khi nguồn lỗi; không giả health |
| 27 | Personal profile | PASS Employee UI/Auth/profiles; partial/zero-row qua SDK unit tests dùng chung, không coi là hosted test |
| 28 | Password | PASS production service/Auth thật của Employee disposable; chưa browser nhập form |
| 29 | Business read-only | PASS read và write-deny theo contract cũ |
| 30 | Preferences | PASS thiết bị local/per-user/remount/reset; không server sync/email dispatch |
| 31 | EN/VI | Đã dịch task/forms/shared workflow/settings thuộc phạm vi Employee; browser đổi ngôn ngữ giữ draft, chưa audit toàn ứng dụng |
| 32 | Logout | PASS browser logout/history back-forward/reload và đăng nhập coworker không lộ task/draft cũ; chưa kiểm tra mọi browser/thiết bị |

Không tuyên bố cả 32 nhóm đã hoạt động bình thường. Brand Safety và EN/VI thuộc phạm vi Employee đã bổ sung; các giới hạn kiểm thử từng dòng vẫn còn. Sprint giữ “chưa cấu hình” theo quyết định đã duyệt.

## Tái chạy an toàn

Chỉ khi dedicated local stack đã sẵn sàng, tại worktree:

`rtk proxy <venv-python> -X utf8 -u CastraView/scripts/employee_local_audit.py`

Script tự kiểm tra container/project và API loopback, lấy key local trong bộ nhớ, tạo user disposable và override process env; không điền key vào file, không yêu cầu dán token vào chat. Script tự đóng backend tạm. Vitest audit dùng `envDir:false` và transport chỉ cho 127.0.0.1:61321/61480. Không chạy deploy scripts, không reset stack khác. Bootstrap dùng definitions của harness platform và fail-closed nếu interface thay đổi, không chạy entry point ghi đè report System Admin.

## Rollout / rollback và phần cần duyệt tiếp

Hosted chưa triển khai. Migration task phụ thuộc các migration membership/leader và bốn migration platform `20261119204654`, `20261119205026`, `20261119210050`, `20261119212558` đang có trong worktree. Trước hosted phải đối chiếu migration history/catalog, backup, xác nhận môi trường và xin phép riêng cho danh sách cụ thể; không áp dụng mù một file thiếu prerequisite.

Triển khai DB bổ sung trước → backend route → frontend, kiểm tra task bằng user JWT thực; schema không đổi enum/role cũ và không backfill giả task. Frontend cũ vẫn dùng được. Frontend mới gặp backend/DB chưa triển khai hiển thị lỗi task riêng, không làm trắng Dashboard và không giả hoàn tất.

Nếu cần rollback ứng dụng: quay về phiên bản frontend/backend trước task; giữ bảng task và audit để tránh mất dữ liệu. Không drop bảng hay xóa audit. Migration chạy transaction nên lỗi DDL trước COMMIT rollback nguyên khối; mọi sửa schema sau khi đã ghi dữ liệu phải là forward migration có review và phê duyệt, không rewrite lịch sử.

Giới hạn tối thiểu: assignment bất biến (không đổi assignee; tạo task mới khi cần), không endpoint xóa, cancelled terminal; Employee có thể reopen completed sang in_progress. Proposal liên kết phải của assignee trong cùng campaign/Team/workspace. Bộ chọn campaign/proposal hiện tối đa 100 bản gần đây, có thông báo giới hạn; task list có phân trang server. Account deletion ngoài phạm vi, cần review FK trước khi bổ sung.

## Bổ sung Brand Safety / EN-VI

Kết quả mới nhất: frontend 33 file/83 test, backend 80 test, SQL 19 file/331 assertions trên cả stack hiện hữu và stack trống, tích hợp 56/56 checks với 3 bài UI/27 observations. Chi tiết và giới hạn tại [employee-brand-safety-i18n.md](employee-brand-safety-i18n.md). Các số liệu ở phần trước là mốc lịch sử trước bổ sung này. Hosted chưa triển khai.

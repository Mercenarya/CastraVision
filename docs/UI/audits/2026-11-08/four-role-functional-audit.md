# Kiểm thử chức năng bốn actor — main 6c4aeb5

Ngày kiểm thử: 08/11/2026, Asia/Bangkok.

## Phạm vi và cách đếm

Kiểm tra code hiện đang chạy trên `main`, không lấy kết quả RBAC v1.4 đang nằm
trong stash làm bằng chứng cho bản này. Không commit/push, không sửa chức năng ứng
dụng, không đọc `.env`, không tạo/sửa tài khoản hoặc dữ liệu Supabase hosted.

Đếm theo mục chức năng chính của từng actor: System Admin có 4 màn hình (2 menu
và 2 màn hình con), Marketing Manager có 11 menu, Leader có 9 menu, Employee có
8 menu. Tổng 32 mục theo actor; các chức năng dùng chung xuất hiện ở nhiều actor
vẫn được đếm cho từng actor. Strategy Studio của Manager còn có đường vào gián
tiếp từ Content Studio, không nằm trong 11 menu và không cộng vào tổng 32.

Các nhóm phân loại loại trừ nhau, dùng trạng thái chính của màn hình:

| Actor | Demo/template/local state | Lỗi điều hướng/quyền | Placeholder | Có gọi API, tích hợp một phần | Tổng |
|---|---:|---:|---:|---:|---:|
| System Admin | 4 | 0 | 0 | 0 | 4 |
| Marketing Manager | 5 | 4 | 0 | 2 | 11 |
| Leader | 5 | 1 | 0 | 3 | 9 |
| Employee | 2 | 0 | 4 | 2 | 8 |
| Tổng | 16 | 5 | 4 | 7 | 32 |

“Demo” không có nghĩa mọi nút đều đúng; nhiều lỗi nút nằm bên trong nhóm này.
“API một phần” không có nghĩa luồng bốn role đã được bảo vệ bằng RLS hoặc dữ liệu
đã lưu trên Supabase. Hai luồng lưu hồ sơ và nhập CSV được xác nhận lưu thật vào
Django/SQLite local. Chưa thực hiện E2E bằng bốn tài khoản Supabase thật.

## System Admin — 4 màn hình

| Chức năng | Kết quả |
|---|---|
| Platform Overview/KPI | Render và tính từ INITIAL_COMPANIES, không phải telemetry thật |
| Company Management | Tìm/lọc/sắp xếp/phân trang trên danh sách demo |
| Company Overview/edit/status | Thay đổi React state, chưa cập nhật tenant thật |
| Create Company | Validate và thêm bản ghi demo; không cấp Auth account/Workspace |

Browser: tạo `Local Audit Company 20261108` với địa chỉ `.example`, danh sách tăng
15 lên 16. Reload rồi vào lại System Admin: còn 15, công ty thử biến mất. Không có
tenant thật được tạo. Header search không được truyền vào bộ lọc danh sách;
chuông thông báo không có handler. Chưa có chức năng thực thi cấu hình platform,
security log hoặc khóa tài khoản thật trong route này.

Nguồn: `system-admin/SystemAdminLayout.jsx:17,102-127`; các screen/mockData.

## Marketing Manager — 11 menu

| Menu | Kết quả |
|---|---|
| Overview | Dashboard/KPI/approval/audit từ fixture |
| Workspace Members | Search/filter và đổi role/xóa trên state; lời mời báo chưa khả dụng |
| Role Management | Ma trận tĩnh, export JSON; không cập nhật grant/policy thật |
| Approvals | Thay đổi proposal cục bộ; chưa lưu DB hoặc sinh audit thật |
| Audit Log | Browser vào đúng demo Manager trả màn hình 403; header lại ghi Leader |
| Budget & ROAS | Browser: main rỗng, không heading/nội dung |
| Reports | Browser: main rỗng |
| Competitor Insights | Browser: main rỗng |
| Campaign Import | Có preview/commit API; đã xác nhận bằng Django session local |
| Content Studio | Template/editor/clipboard; chưa có lưu và gửi duyệt; cần strategy trước |
| Settings | Form hồ sơ doanh nghiệp; đã xác nhận lưu/read lại qua API local |

Browser gửi lời mời `.test`: modal trả rõ “Invitations are not available yet…”,
không gửi mail hoặc tạo membership. Ba route rỗng được tái hiện từ sidebar thật,
không phải đường preview. Audit 403 được tái hiện trong cùng giao diện Manager.

Lỗi phụ trong Approvals: Save & Approve gán status approved trước khi gọi hàm
approve; hàm sau thấy đã approved và return, bỏ qua approver/time/bookkeeping.
Manager proposals/members/audit nằm trong state riêng, không đồng bộ với Leader.

Nguồn: `MarketingManagerLayout.jsx:39-48,84-115,285-287`;
`ApprovalQueueScreen.jsx:351-478`; `App.jsx:1314-1359`.

## Leader — 9 menu

| Menu | Kết quả |
|---|---|
| Overview | Dashboard/charts demo |
| Approvals | Queue demo; quick approve đổi state nhưng không bền vững |
| My Proposals | Sai luồng: mở nguyên Proposal Approval Queue, không lọc người gửi |
| Campaigns | Danh sách/search/filter/detail/CSV demo; Create chỉ toast, không thêm campaign |
| Strategy Studio | Có POST generate; unit test fallback PASS, chưa xác nhận AI/provider thật |
| Content Gen | Template và editor cục bộ; chưa lưu/gửi approval |
| Campaign Import | Cùng API preview/commit Django session đã kiểm tra |
| Performance & Insights | KPI/member demo; export CSV từ fixture, không phải dữ liệu live |
| Account Settings | Render form hồ sơ doanh nghiệp, không phải account cá nhân |

Browser: PRP-8402 Pending -> Quick Approve -> Approved. Chuyển sang Campaigns,
quay lại Approvals: PRP-8402 trở lại Pending. Network XHR/fetch chỉ có các request
csrf/session lúc khởi động, không có request lưu quyết định. Detail approve mở
success modal; reject/revision/escalate chưa tạo quyết định/queue Manager thật.
Lịch sử version là fixture. UI queue không nhận active user/Team/Workspace để
thực thi scope; không thể coi đây là kiểm chứng RLS hay cấm tự duyệt.

Nguồn: `LeaderApprovalQueue.jsx:15,159-166`; `LeaderContentReview.jsx:96,425-452`;
`LeaderCampaigns.jsx:178-203`; `App.jsx:1374-1386`.

## Employee — 8 menu

| Menu | Kết quả |
|---|---|
| My Dashboard | Tasks/submissions/campaigns và KPI mock |
| My Tasks | Placeholder, chỉ có điều hướng sang Content/Overview |
| Content Studio | Template/editor, chưa có submit nghiệp vụ thật |
| Assigned Campaigns | Placeholder, không có danh sách được phân công thực tế |
| My Submissions | Placeholder, chưa có lịch sử hoặc feedback thật |
| Strategy Reference | Thực tế mở generator, không phải màn hình chỉ tham khảo |
| Notifications | Placeholder “No new unread feedback”, badge vẫn có 2 |
| My Profile | Mở editor hồ sơ doanh nghiệp, không phải hồ sơ cá nhân |

Browser: Edit & Resubmit trên dashboard không đổi màn hình, không mở dialog và
không đổi text; handler không xử lý actionType edit. Brand Safety Audit chưa nối.
Strategy Reference đưa Employee tới nút Generate dù capability member không có
strategy:generate. Backend generation hiện cũng chưa chặn actor không hợp lệ.

Nguồn: `MemberDashboardView.jsx:9,125-129,263-267`;
`App.jsx:1486-1597`; `navigation/roleNavConfig.js:24-31`.

## Các kiểm thử thực thi và bằng chứng

- Browser: bốn Quick RBAC Demo Access trong bốn context tách biệt. Duyệt đủ
  11/9/8 menu của Manager/Leader/Employee và các màn hình System Admin.
- Django: `manage.py test CastraServices --settings=CastraVision.test_settings
  --noinput`: 16/16 PASS. Đây không phải 16 test RBAC bốn actor.
- `node --test src/marketing/tests/storeSeparation.test.js`: FAIL trước khi chạy
  assertions vì thiếu `marketing/services/proposalDecisionService.js`. Test cũng
  import facade `marketing/data/marketingGroupsData.js` không tồn tại.
- `probe_local_api.py`: 12 kiểm tra HTTP/status/assertion thành công, gồm chặn
  profile/import vô danh; đăng ký, lưu/đọc hồ sơ, reject CSV sai, preview/commit
  CSV đúng, logout/login mới và xác nhận dữ liệu CSV còn sau login.
- Identity thử chỉ ở SQLite local và đã xóa cùng dữ liệu con; không chứa mật khẩu
  trong script/output. Supabase không tham gia lưu hồ sơ/import ở các endpoint đó.
- Kiểm tra generation bằng Django Client có CSRF checks, không session và provider
  bị patch: HTTP 200, provider_called=true. Không gọi API AI thật. Đây là lỗi bảo
  vệ endpoint; không phải bằng chứng AI thật chạy thành công.
- Thực thi resolver JS: user_metadata.role=system_admin -> giao diện System Admin;
  email có tiền tố system -> System Admin; membership manager -> Marketing Manager
  do nhánh explicit chạy trước nhánh chuyển Manager cũ thành Leader.

Hai phép thử resolver cuối chứng minh lỗi nguồn tin cậy/điều hướng frontend,
không tự chứng minh người dùng đã lấy được quyền quản trị dữ liệu hosted.

## Ưu tiên xử lý

1. Chọn một nguồn Auth và quyền authoritative; bỏ email/user_metadata làm căn cứ
   quyền. Nối decorator/JWT vào endpoint generate; kiểm tra role/scope trước AI.
2. Đồng bộ session/JWT giữa frontend và backend: App api() đang gửi cookie/CSRF,
   còn Supabase login không tự tạo Django session cho các endpoint này.
3. Nối approval/content/submit/escalate/audit vào cùng backend và transaction;
   kiểm tra lưu lại sau chuyển trang/reload và giữa các tài khoản.
4. Sửa role mapping làm Manager bị gắn nhãn Leader và bị khóa Audit.
5. Nối ba route Manager rỗng; thay bốn placeholder Employee bằng chức năng thật.
6. Sửa/khôi phục test service đang import file thiếu và bổ sung regression cho các
   ca browser ở trên. Chỉ build/lint PASS không đủ nghiệm thu chức năng.

Chưa chỉnh sửa chức năng ứng dụng trong lượt audit này.

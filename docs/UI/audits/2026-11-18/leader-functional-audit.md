# Kiểm thử chức năng Leader — 18/11/2026

## Phạm vi và tiêu chí

- Bản chạy: worktree `.tmp/publish-dat`, nhánh Dat, nền d14a54e; có thay đổi
  frontend bỏ banner gia nhập công ty theo yêu cầu trước đó.
- Frontend http://localhost:5173; Django http://127.0.0.1:8000; Supabase hosted
  project oviqgptccjjdaaqxabwv. Không dùng dashboard-preview, không inject role,
  không mock HTTP, không cấp service_role cho trình duyệt.
- Đăng nhập bằng form thật với Leader demo đã được cấp membership `manager`
  trong doanh nghiệp demo. Trong UI, `manager` legacy được ánh xạ thành Leader;
  Marketing Manager dùng membership `admin`.
- Chức năng nghiệp vụ chỉ đạt khi đầu ra đúng và dữ liệu đọc/lưu thật. Toast,
  modal thành công và đổi React state không đủ để kết luận hoàn thành.
- Audit không sửa product code, không chạy migration, không commit/push.
  Các thao tác ghi được thử trong doanh nghiệp demo. Import thực tế bị từ chối
  trước khi lưu; kiểm tra lại database xác nhận không có dòng của file thử.

## Số lượng

Có **9 mục sidebar**, thêm màn hình **Notifications** từ chuông/menu tài khoản,
và hai màn hình con review Content/Budget. Không tính mỗi bộ lọc/modal là một
module riêng.

Kiểm thử có **42 ca duy nhất** (chi tiết trong leader-browser-evidence.json):

| Nhóm kết quả | Số ca | Ý nghĩa |
|---|---:|---|
| PASS | 5 | Đăng nhập, khôi phục phiên, đăng xuất; kiểm tra CSV sai; preview CSV đúng |
| UI_ONLY | 7 | Lọc/tìm kiếm/đổi biểu đồ/validation chạy trên dữ liệu mẫu |
| MOCK | 9 | Có hiển thị/xuất file nhưng nguồn là dữ liệu viết sẵn |
| FAIL | 20 | Không thực hiện đúng lời hứa nghiệp vụ, không lưu, hoặc lỗi runtime/API |
| BLOCKED | 1 | Content Gen không tiếp tục được vì Strategy Studio thực tế trả 503 |

Các kiểm tra API/RLS được lưu riêng trong leader-api-evidence.json; không cộng
chúng vào 42 ca trình duyệt để tránh trộn đơn vị đếm.

## Kết quả từng mục

| Mục | Đã thử | Kết luận |
|---|---|---|
| Overview | Sync Squad Data, đổi thời gian biểu đồ, Adjust Limit, Approve, Propose to Marketing Manager | KPI/team/campaign là fixture; Sync chỉ remount; Adjust Limit không có tác dụng; Approve mở queue thay vì duyệt; Propose chỉ mở màn hình budget |
| Approvals | Tìm/lọc/reset, CSV, quick approve/reject, refresh, review Content/Budget | Bộ lọc và CSV chạy với fixture; approve đổi state rồi trở về Pending khi remount; refresh chỉ toast; không có persistence nghiệp vụ |
| My Proposals | Mở từ sidebar và so sánh queue | Cùng component/list với Approvals, hiển thị proposal của các tác giả mẫu khác; không lọc đề xuất của tài khoản hiện tại |
| Campaigns | Search, Draft tab, Details, CSV, Create Campaign/Save Draft | Search/filter/details/CSV là fixture; tạo mới báo thành công nhưng không thêm hàng, không gọi API, vẫn 8 campaign |
| Strategy Studio | Submit bằng hồ sơ hợp lệ của doanh nghiệp demo | POST /api/strategies/generate/ trả 503 STRATEGY_GENERATION_FAILED; UI hiện Unable to generate a strategy at this time |
| Content Gen | Mở sau khi Strategy thất bại | Bị chặn tại Generate a Strategy First. Không khẳng định chức năng edit/copy/generate cuối luồng chạy được, vì không tạo được chiến lược qua luồng thật |
| Campaign Import | Upload CSV âm, CSV hợp lệ 2 dòng, Import Data, kiểm tra DB | Preview/validation 200 đúng; commit 502 IMPORT_PERSIST_FAILED, không ghi được dữ liệu |
| Performance & Insights | Đổi khoảng thời gian, lọc nhân viên, Export Report, Pause Variant, Apply Recommendation | Khoảng thời gian không đổi KPI; CSV lấy nhân viên mẫu; Pause chỉ đổi state và mất khi remount; Apply chỉ mở budget review, không tạo proposal |
| Account Settings | Continue, Save Profile bằng giá trị doanh nghiệp không thay đổi | Hiện form Business Profile, không phải hồ sơ cá nhân; PUT trả 403 đúng quyền backend, nhưng UI vẫn cho Leader bấm lưu thao tác không được phép |
| Notifications | Bấm chuông badge 5, mở màn hình và kiểm tra mạng | Badge hard-code 5; nội dung tĩnh No pending urgent notifications, không tải thông báo thật |

## Các lỗi review tái hiện trực tiếp

1. **Sửa nội dung không lưu:** sửa headline thành `Leader audit headline 20261118`,
   Save Changes hiện dữ liệu mới; Back to Queue rồi Review lại trở về headline cũ.
2. **Duyệt content không cập nhật queue:** modal Approved & Signed xuất hiện nhưng
   proposal vẫn Pending khi trở lại queue. Không có request ghi nghiệp vụ.
3. **Request Revisions:** bấm gửi với ghi chú rỗng vẫn đóng modal và báo dispatched;
   proposal vẫn Pending, không có thông báo/network request nghiệp vụ.
4. **Escalate content/budget:** modal/toast thành công nhưng queue vẫn Pending,
   không có request ghi hay gửi cho Marketing Manager.
5. **Audit Trail:** nội dung v1.1/v1.0 và Marcus Vance được viết sẵn; không chứa
   chỉnh sửa vừa thực hiện, không truy vấn audit log thật.
6. **Budget bị thiếu dữ liệu:** mở PRP-8403 từ queue hiển thị MONTHLY SPEND ENVELOPE
   `$NaN`; queue object không cung cấp totalBudget/targetRoas cho review.
7. **Lưu budget phát sinh lỗi JS:** Edit Allocation → Save Recalculated Values
   phát sinh `TypeError: Cannot read properties of undefined (reading 'toLocaleString')`.
8. Nút duyệt budget >20% có disabled tại UI trong fixture; điều này chỉ chứng minh
   điều kiện UI, **không chứng minh guard ngân sách 20% đã được thực thi ở DB/API**.

## Hai lỗi backend/database đã đối chiếu

### Import CSV — backend và hosted schema lệch nhau

CSV hợp lệ preview đúng 2 dòng (Meta/Google Ads). Khi commit, backend ghi các cột
không tồn tại trên hosted `campaign_performance`:

`clicks`, `conversions`, `revenue`, `import_batch_id`, `source_filename`,
`source_row`, `created_by`.

Đối chiếu bằng OpenAPI schema và GET chọn các cột với limit=0: HTTP 400,
PostgreSQL code 42703. Import UI trả HTTP 502. SELECT theo workspace demo và
campaign_name `leader_audit_20261118.csv` xác nhận 0 dòng; không coi preview là
đã nhập thành công. Không tự áp dụng migration cũ nào trong audit này.

### Sinh chiến lược — runtime thiếu bảng RAG Django

POST thật từ UI trả 503. Chạy truy vấn RAG thật bằng cấu hình runtime hiện tại
tái hiện `OperationalError`, điều kiện `no such table` đúng. SQLite đang dùng
không có bảng KnowledgeChunk. `generate_strategy` gọi search_knowledge trước
nhánh LLM/fallback nên lỗi này chặn cả luồng. Không mock RAG hoặc inject một
chiến lược giả để làm Content Gen trông như chạy được.

## Xác thực và chốt quyền có bằng chứng hoạt động

- Đăng nhập email/password qua form thật, Supabase Auth 200, backend session 200.
- Reload toàn bộ trình duyệt khôi phục phiên và giao diện Leader, không đăng ký lại.
- Sign Out thật trả về màn hình đăng nhập.
- GET business-profile và campaign-imports: 200 với token Leader. Lịch sử rỗng
  là dữ liệu thực tế của doanh nghiệp demo, khác với các campaign mẫu trên UI.
- GET workspace/personnel, workspace/teams, workspace/recruitment: 403 với Leader.
- PUT business-profile bằng Leader: 403, dữ liệu doanh nghiệp không bị sửa.
- PATCH membership của chính Leader về cùng role hiện có: Data API 403;
  không cho client ghi quyền trực tiếp.
- SELECT audit_logs bằng Leader: 0 dòng theo RLS.
- Thử một workspace khác **đã xác nhận tồn tại**: backend business-profile 403,
  Data API campaign_performance trả 0 dòng. Không dùng service key cho các ca
  kiểm tra quyền người dùng.

Giao diện hiển thị David Kross/Growth Squad Alpha/acme-corp-prod-01 dù tài khoản
là Leader demo thuộc Nhom Demo Marketing. Đây là thông tin mẫu sai ngữ cảnh;
không kết luận đó là dữ liệu nhân viên thật của doanh nghiệp khác bị lộ.

## Vị trí code liên quan

- CastraView/src/navigation/roleNavConfig.js: 9 mục sidebar.
- CastraView/src/App.jsx: route Leader, alias My Proposals → LeaderApprovalQueue,
  Notifications tĩnh, StrategyScreen/ContentScreen/ProfileScreen/ImportScreen.
- CastraView/src/leader/ui/LeaderDashboardView.jsx: MOCK_* và biểu đồ fixture.
- CastraView/src/leader/screens/LeaderCampaigns.jsx: INITIAL_CAMPAIGNS;
  handleCreateSubmit chỉ notify và đóng modal.
- CastraView/src/leader/screens/LeaderApprovalQueue.jsx: fixture và state cục bộ.
- CastraView/src/leader/screens/LeaderContentReview.jsx: chỉnh sửa cục bộ/modal.
- CastraView/src/leader/screens/LeaderBudgetReview.jsx: totalBudget thiếu và
  handleSaveAllocations gọi toLocaleString trên undefined.
- CastraView/src/leader/screens/LeaderPerformance.jsx: fixture, pause cục bộ.
- CastraServices/campaign_api.py: _database_rows/_persist.
- CastraServices/strategy.py và rag.py: RAG trước LLM/fallback.
- CastraServices/workspace_api.py: chỉ admin legacy (Marketing Manager) được PUT.

## Giới hạn kết luận

Đây là kiểm thử trên máy hiện tại và hosted schema hiện tại, không phải chứng nhận
toàn bộ hệ thống. API/RLS chặn được các ca đã nêu không chứng minh mọi đường
leo quyền đã an toàn. Không kiểm chứng gửi email ra Gmail, ad-network dispatch,
LLM thành công hay approval nghiệp vụ thật vì các đường UI tương ứng chưa nối
hoặc đang bị chặn. Không đánh dấu các chức năng đó PASS.

Ưu tiên sửa: schema import và khởi tạo DB RAG; nối proposal/campaign/approval
với API thật; hoàn thiện kiểm tra Team/ownership và budget threshold phía server;
sau đó nối KPI/notifications/profile đúng vai trò và kiểm thử lại toàn luồng.

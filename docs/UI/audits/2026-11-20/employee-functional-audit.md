# Employee — kiểm tra chức năng ngày 20/11/2026

## Phạm vi và cách đếm

Baseline Dat `171f973` trong worktree `.tmp/publish-dat`, bao gồm các thay đổi local chưa commit hiện có. Kiểm tra 8 mục sidebar và các luồng trong Dashboard, Content/Strategy, Submissions, Notifications và Settings. Đếm **32 nhóm chức năng**, không đếm từng icon/trường nhập.

**12 nhóm đã có bằng chứng hoạt động với dữ liệu thật local; 13 nhóm lỗi/chưa nối dữ liệu đúng; 7 nhóm chưa đủ bằng chứng để kết luận.** Trong 12 nhóm đạt, tạo chiến lược chỉ đạt chế độ deterministic fallback, không chứng minh AI provider thật. Các nhóm đạt API không tự chứng minh mọi thao tác tương ứng trên browser.

Không sửa runtime tính năng, backend hoặc schema để làm đẹp kết quả; chỉ thêm script/test và tài liệu kiểm tra. Không commit/push. Không đọc/sửa `.env`; không chạm Supabase hosted, không gửi Gmail thật. Tài khoản/workspace/campaign thử chỉ trong `CastraVision-platform-test`, thông tin xác thực ngẫu nhiên giữ trong bộ nhớ. Django DB cho harness là SQLite memory đã migrate, không thay DB đang dùng.

## Bằng chứng

- `employee-real-local.json`: 19 ca kiểm tra API/Auth nghiệp vụ Employee và một suite UI tích hợp (tổng 20). API gọi view Django thật với JWT người dùng và Supabase Auth/PostgREST thật; không mock HTTP. Tạo campaign bởi Leader, phân Team bởi Marketing Manager; không cấp quyền Employee bằng fake frontend role.
- `employee-ui-local.json`: thao tác trên App/component production trong **JSDOM**, dùng Supabase SDK và API thật. Đây là tích hợp UI/HTTP, **không phải kiểm tra browser đồ họa hoặc thiết bị thật**. Cột `pass:true` ở ca mô tả lỗi có nghĩa tái hiện lỗi thành công, không phải chức năng tốt.
- `src/member/EmployeeAudit.test.jsx`: 6 test characterization tái hiện hành vi UI mẫu/nút không hoạt động. Không dùng chúng làm bằng chứng lưu dữ liệu.
- Source đối chiếu: `App.jsx` Employee branch; `member/ui/MemberDashboardView.jsx`; `navigation/roleNavConfig.js`; các workflow production dùng chung Leader/Employee. Không dựa vào component `MemberStrategyReferences` không được mount để tuyên bố trang thật hoạt động.

## 12 nhóm hoạt động trên local

| # | Chức năng | Đã kiểm tra / giới hạn |
|---|---|---|
| 1 | Xác thực và khôi phục session Employee | Auth password grant thật, `/auth/session/` trả membership member; App khôi phục SDK session và mở Employee layout |
| 2 | Chặn thao tác vượt vai trò | Employee bị 403 khi tạo campaign, approve, sửa business profile, quản lý personnel, tạo báo cáo; export queue bị ẩn. Đây là hành vi bảo vệ đúng, không phải lỗi thiếu quyền |
| 14 | Soạn và lưu nháp nội dung thủ công | API lưu/read-back; kiểm tra form production nối campaign và tạo nháp riêng trong suite UI |
| 15 | Sửa nội dung của mình | Revise rồi GET proposal trả headline đã sửa |
| 16 | Gửi đề xuất để duyệt | Chuyển draft → pending, đọc lại trạng thái từ DB |
| 17 | My Submissions và tìm/lọc | API mine/search/status/kind trả đúng đề xuất; UI đọc bản ghi thật. Chưa stress-test pagination nhiều trang |
| 18 | Xem chi tiết/lịch sử phiên bản của đề xuất mình | Proposal endpoint trả payload và nhiều phiên bản sau sửa/quyết định |
| 19 | Nhận phản hồi/kết quả Leader duyệt | Leader yêu cầu sửa/duyệt bằng user thật; Employee đọc được trạng thái và history |
| 20 | Gửi lại đề xuất | revision_requested → pending được lưu thật. Nút trên trang chi tiết khác với nút Dashboard bị lỗi |
| 22 | Tạo/lưu chiến lược chế độ dự phòng | Generate tạo strategy proposal/read-back; provider `deterministic-fallback`. Không gọi dịch vụ AI trả phí, không coi đây là LLM thật |
| 25 | Danh sách thông báo workflow và đánh dấu đọc | API trả thông báo phát sinh từ review thật; read_notification rồi đọc lại is_read=true. Chưa chứng minh click chuông/counter đồng bộ |
| 29 | Đọc hồ sơ công ty và chặn sửa | Hồ sơ thật được dùng trong workspace; PUT của Employee bị 403. Không được hiểu là Employee có quyền đổi công ty |

## 13 nhóm lỗi hoặc chưa nối dữ liệu đúng

| # | Nhóm | Lỗi đã xác nhận |
|---|---|---|
| 3 | Danh tính/Team trên Dashboard | Chào Alex, Growth Squad Alpha cố định dù đăng nhập user và Team khác |
| 4 | KPI Dashboard | 8 tasks, 14 completed, 2 pending, 1 revision và deadline là literal; không tính từ DB |
| 5 | Priority Tasks | 5 task/campaign/reviewer mẫu từ MOCK_TASKS; không phải việc được giao cho user |
| 6 | Tìm/lọc task | Có lọc DOM, nhưng chỉ trên mảng mẫu. Không đạt tìm việc thật |
| 7 | Edit & Resubmit ở Priority Tasks | Click không gọi navigation/action; handler không xử lý actionType edit |
| 8 | My Tasks | Chỉ đoạn mô tả và nút chuyển Content/Dashboard; không list/detail/cập nhật task thật |
| 9 | Assigned Campaigns | Trang chỉ placeholder, không hiển thị campaign được phân Team mà API đã đọc được |
| 10 | Recent Submissions ở Dashboard | MOCK_SUBMISSIONS, feedback mẫu; nút mở list reports nhưng không truyền proposal ID, không mở đúng hồ sơ vừa bấm |
| 11 | Sprint progress | 14/16, Squad Alpha #42, 1.4 days ahead là literal |
| 12 | Các shortcut AI Content | Social Post/Ad Copy/Caption đều chỉ chuyển cùng page content, không truyền mode. Form nội dung nói rõ nhập thủ công, chưa AI generation riêng |
| 13 | Brand Safety Audit / AI assistant | Nút chỉ báo chưa nối backend; mẹo/checklist là text cố định, không phân tích nội dung user |
| 21 | Strategy Reference | Sidebar đặt ngữ nghĩa tham khảo nhưng App mount WorkflowStudio kind=strategy (generator), không mount màn read-only reference; cần chốt/fix hành vi và dữ liệu tham khảo đã duyệt |
| 26 | Badge thông báo/task và system status | Sidebar task=5/notification=2, bell=2 và all-systems-nominal cố định; không phản ánh unread/tasks/health thật |

## 7 nhóm chưa đủ bằng chứng

| # | Nhóm | Điều cần kiểm tra thêm |
|---|---|---|
| 23 | Template từ chiến lược đã duyệt | Có handler đọc strategy và điền form; chưa chạy chuỗi approve strategy → chọn template → save/read-back dưới Employee |
| 24 | Copy nội dung | Có clipboard handler; chưa kiểm tra clipboard thật/quyền browser |
| 27 | Lưu profile cá nhân Employee | Component dùng chung từng được test ở role khác; không thay thế kiểm tra Auth+profiles thật của chính Employee |
| 28 | Đổi mật khẩu Employee | Không dùng kết quả System Admin làm kết luận Employee; chưa chạy current sai/đúng + old/new login cho role này |
| 30 | Notification preferences | Source chỉ localStorage theo user. Chưa chạy save/reset/remount dưới Employee; không có bằng chứng đồng bộ server/gửi email theo cấu hình |
| 31 | Đổi ngôn ngữ | Có shared provider/menu, nhưng nhiều text Employee hardcode English; chưa kiểm tra trọn EN/VI/mobile |
| 32 | Logout/relogin bằng UI Employee | Harness signOut SDK để dọn session, không phải click logout/back/refresh; chưa kết luận browser flow đầy đủ |

## Kiểm tra kỹ thuật / giới hạn

- Characterization: 6/6 PASS sau sửa selector của chính test. Các test này chứng minh tồn tại lỗi fixture/no-op, không sửa chúng.
- Lần chạy cuối: **20/20 kiểm tra tích hợp PASS**, gồm suite UI production với Auth/API thật. **13 observation UI** đã ghi, gồm cả các ca tái hiện lỗi. Form content đợi campaign option thật, lưu `Employee UI Created Draft` và đọc lại chi tiết thành công; không chỉ kiểm tra nút tồn tại.
- `npm run lint`: exit 0, còn warnings cũ ngoài phần mới. `npm run build`: PASS; chunk khoảng 794 kB còn warning >500 kB.
- Ruff script audit và `git diff --check`: PASS. Gitleaks quét riêng 7 file script/test/report/evidence mới: 0 findings, không đọc env hoặc scan lịch sử Git.
- Lần UI đầu chưa hoàn tất do timeout/selector và query option trước khi request xong. Điều chỉnh harness chờ state đúng rồi mới kết luận; không quy lỗi test selector thành lỗi sản phẩm. Kết quả cuối cần đọc JSON, không chỉ số test PASS vì observation có thể tái hiện lỗi.
- Chưa chạy hosted, SMTP/Gmail hoặc external AI provider. Không kết luận cả 32 nhóm chạy bình thường.

Ưu tiên sửa: thay Dashboard fixtures và tasks/campaign placeholders bằng dữ liệu thật; sửa action Edit & Resubmit và deep-link proposal; đồng bộ counters; làm rõ Strategy Reference. Giữ các workflow lưu/duyệt đã chạy thật và kiểm tra hồi quy khi sửa UI.

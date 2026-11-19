# Kiểm chứng Marketing Manager — 19/11/2026

## Phạm vi và cách đếm

Kiểm tra bản ứng dụng đang chạy tại `http://127.0.0.1:5173`, worktree `.tmp/publish-dat`: code Dat `559c6cf` cộng phần giao diện thanhtri `0495b3a` đã ghép local. Tài khoản dùng: Marketing Manager demo và Employee demo, chỉ trong workspace **CastraVision Demo 4 Roles d45251**.

Có **11 mục trên sidebar**. Bảng dưới chia thành **44 nhóm chức năng/luồng kiểm tra**, gồm cả đăng nhập và tiện ích header. Đây là cách đếm nghiệp vụ trong audit này, không phải đếm hàm JavaScript hay mọi nút con (Reset, pagination, Close…). Các định dạng file/biến thể quyết định được ghi rõ khi chưa kiểm thử hết.

Kết quả: **23 TỐT, 6 MỘT PHẦN, 11 LỖI/CHƯA NỐI DỮ LIỆU THẬT, 4 CHƯA KIỂM CHỨNG**.

- **TỐT:** thao tác đã thực thi bằng UI hoặc API user JWT thật, có đọc lại trạng thái/kết quả; cột bằng chứng phân biệt UI/API. Không suy từ unit test mock rằng production hoạt động.
- **MỘT PHẦN:** chỉ chạy local, fixture, fallback hoặc còn thiếu một phần của luồng.
- **LỖI:** UI không thực hiện lời hứa nghiệp vụ hoặc không dùng dữ liệu thực dù có giao diện.
- **CHƯA KIỂM:** chưa thực hiện thao tác; không kết luận tốt/xấu chỉ từ code.

## Bảng chức năng

| # | Nhóm chức năng | Kết luận | Bằng chứng thực thi / giới hạn |
| --- | --- | --- | --- |
| 01 | Đăng nhập, nhận đúng Marketing Manager/workspace | TỐT | Auth thật → Django session HTTP 200, membership role `admin`, không phải platform admin; UI vào đúng workspace demo. |
| 02 | Refresh phiên, tiếp tục truy cập | TỐT | Refresh token thật thành công, gọi lại auth/session có quyền đúng. |
| 03 | Đăng xuất phiên | TỐT | Logout scope local; thử lại refresh token của đúng phiên đó nhận HTTP 400. Không khẳng định access JWT hết hiệu lực tức thì. |
| 04 | Dashboard: KPI, số thành viên, audit/approval realtime | LỖI | Layout nhận `INITIAL_WORKSPACE`, `INITIAL_MEMBERS`, `INITIAL_PROPOSALS`, `INITIAL_AUDIT_LOGS`. UI có Sarah Jenkins và PRP-8402 mặc định. |
| 05 | Điều hướng nhanh từ dashboard/sidebar | TỐT | Đã mở 11 mục sidebar; nút Invite Member trên dashboard mở đúng form mời thật, sau đó hủy không gửi email. |
| 06 | Global search ở header | LỖI | Nhập chuỗi không tồn tại vẫn giữ nguyên dashboard, không có kết quả/API tìm kiếm; chỉ cập nhật `headerSearch`. |
| 07 | Nhân sự: danh sách, tìm kiếm, lọc role/Team | TỐT | API lọc đúng một Employee theo user/role/Team; UI nhận dữ liệu thật từ personnel/teams/recruitment. |
| 08 | Tạo Team | TỐT | Tạo qua API và qua dialog UI. Rời trang rồi mở lại vẫn thấy Team vừa tạo. |
| 09 | Phân Team cho nhân sự | TỐT | PATCH nhân sự, dùng JWT của Employee đọc context thấy Team mới. Sau đó khôi phục phân công ban đầu. |
| 10 | Đổi Employee ↔ Leader | TỐT | Đổi member→manager, context của chính Employee trả role mới; đổi lại member và xác nhận Team cũ. Đây là kiểm chứng API; không suy rằng UI cho cấp Marketing Manager. |
| 11 | Thu hồi/xóa membership | CHƯA KIỂM | Không xóa các tài khoản demo đang được người dùng sử dụng. Không kết luận nút Thu hồi đã chạy end-to-end. |
| 12 | Duyệt/từ chối yêu cầu gia nhập | CHƯA KIỂM | API danh sách đọc được; không có request phù hợp để thao tác mà không tạo thêm user/workspace hoặc gỡ membership đang dùng. |
| 13 | Gửi/gửi lại/thu hồi lời mời và người nhận nhận được mail | CHƯA KIỂM | Form mở được, chưa gửi mail và chưa thử nhận/accept. Không coi form mở là gửi thư thành công. |
| 14 | Cấu hình tuyển thành viên/mô tả công khai | TỐT | Lưu mô tả thử qua API, đọc lại đúng rồi khôi phục. Không bật công khai ngoài ý muốn; chưa thử một người ngoài workspace tìm/join. |
| 15 | Role Management / ma trận quyền / số thành viên theo role | MỘT PHẦN | Ma trận xem được nhưng số 3/4/7 lấy từ fixture; DB thực tại thời điểm kiểm có admin=1, manager=1, member=1. |
| 16 | Export Permissions Spec | MỘT PHẦN | Tạo được Blob JSON, nhưng chứa số 3/4/7 và workspace id mẫu không khớp UUID hiện tại. |
| 17 | Hàng chờ proposal: danh sách/tìm kiếm/bộ lọc | TỐT | API tìm đúng proposal có nhãn audit; UI My Proposals lọc còn đúng bản nháp vừa tạo. Badge sidebar không thuộc kết luận này. |
| 18 | Xem chi tiết proposal và lịch sử revision | TỐT | UI mở đúng proposal audit; API trả history/version thật. |
| 19 | Duyệt nội dung do người khác gửi | TỐT | Đã bấm Approve → Xác nhận trên UI; đọc lại độc lập qua Supabase RPC thấy `approved`, 2 history entry. API approve riêng cũng PASS. |
| 20 | Từ chối nội dung | TỐT | API quyết định với lý do, Employee đọc lại thấy `rejected`. Không thao tác lên proposal demo có sẵn. |
| 21 | Yêu cầu chỉnh sửa | TỐT | API trả `revision_requested`, đọc lại trạng thái và history. |
| 22 | Marketing Manager sửa nội dung proposal | TỐT | Sửa headline bằng API `revise`, đọc lại version 3 và 3 mục history. |
| 23 | Duyệt điều chỉnh ngân sách trên 20% | TỐT | Trên campaign audit riêng: 10/10/10 triệu → 6/14/10 triệu, approval `approved`, đọc lại allocations đúng. Không thay chi tiêu nhà cung cấp quảng cáo. |
| 24 | Marketing Manager tự duyệt chiến lược và có log/history | TỐT | Tạo strategy fallback, submit, tự approve bằng API; trạng thái persisted. Tự approve nội dung của mình bị 403 như thiết kế. |
| 25 | Xuất CSV hàng chờ proposal thật | TỐT | UI tạo Blob CSV 1.885 byte, chứa bản ghi audit thật. Đã kiểm nội dung Blob; chưa kiểm file cuối cùng trong thư mục Downloads của người dùng. |
| 26 | Audit Log: xem/lọc/chi tiết log thật | LỖI | UI hoàn toàn nhận fixture, có nút Default/Filtered/Empty/Error. DB đọc được 65 log tại một thời điểm đo, UI hiển thị tổng 142 mặc định; không thấy log audit vừa tạo. |
| 27 | Export Audit Log | LỖI | Có Blob CSV 2.362 byte nhưng chứa Sarah Jenkins/fixture, không có bản ghi audit vừa thực thi. Không phải export log thật. |
| 28 | Budget & ROAS: điều chỉnh và Save Draft Allocation | MỘT PHẦN | Lưu/remount được draft vào localStorage theo user/workspace; số liệu gốc là mẫu. Chưa ghi budget proposal lên Supabase. Đã khôi phục draft browser cũ. |
| 29 | Review Recommendation → Submit to Approval Queue | LỖI | UI đổi thành “Submitted to Approval Queue”, trong khi tổng proposal Supabase trước/sau đều 10. Handler chỉ setState/notify. |
| 30 | Reports: cấu hình/xuất CSV từ số liệu thật | LỖI | CSV tạo được 771 byte nhưng có Summer Clearance Blitz 2025 mẫu, không có campaign thật AirStride/audit. Dữ liệu từ `allCampaigns`. |
| 31 | Xuất PDF | LỖI | UI ghi rõ “Export PDF (Unavailable)”; không có PDF thật được tạo. |
| 32 | Tải lịch sử báo cáo | LỖI | Lịch sử là fixture; Download Sample tạo dữ liệu mẫu, không lấy file báo cáo đã lưu từ Supabase/Storage. |
| 33 | Competitor Insights: theo dõi/phân tích/refresh thị trường | LỖI | Danh sách initialCompetitors cố định, refresh dùng setTimeout 600 ms; không có dịch vụ crawl/analysis được gọi. |
| 34 | Add Competitor | LỖI | Bấm không mở dialog/drawer, chỉ gọi notify; không tạo đối thủ hay ghi DB. |
| 35 | Xem trước CSV | TỐT | API và UI đều xem trước 2 dòng hợp lệ. UI dùng File tạo trong trình duyệt và event change thật; chưa kiểm file picker của hệ điều hành do công cụ từ chối đường dẫn upload. |
| 36 | Commit CSV và xem lịch sử import | TỐT | UI Import Data ghi 2 dòng; Supabase RPC imports trả row_count=2 sau commit, upload form được reset. API import riêng đối chiếu đúng tổng chi tiêu/doanh thu. XLSX chưa kiểm riêng ở role này trong lượt audit. |
| 37 | Tạo chiến lược / Strategy Studio | MỘT PHẦN | API generate lưu strategy thật nhưng provider là deterministic-fallback; chưa kiểm OpenAI trực tuyến. Không có mục Strategy trên 11 nút sidebar MM; route strategy tồn tại trong App nhưng chưa xác nhận đường vào ở UI thật. |
| 38 | Content Studio: tạo/lưu/gửi bản nháp | TỐT | Đã điền form và Lưu bản nháp trên UI; đọc DB thấy đúng 1 proposal `draft` có nhãn audit. API submit và đọc lại cũng PASS. Đây là nội dung nhập tay/template, không phải AI sinh nội dung độc lập. |
| 39 | Settings: xem/sửa/lưu Business Profile qua UI | LỖI | API PUT/GET hoạt động và đã kiểm; UI load lặp vì `loadProfile` phụ thuộc initialProfile rồi gọi onProfileUpdated→setProfile, đổi initialProfile và chạy effect lại. Request REST trả 200 liên tục nhưng form bị ẩn/khóa ở loading, không hoàn tất thử sửa UI. Đã rời trang để dừng loop và khôi phục hồ sơ. |
| 40 | Settings: thông tin cá nhân | MỘT PHẦN | Mở form được nhưng ô tên không khớp Auth metadata; code bỏ qua user.full_name từ context và rơi về email prefix. Profile row của MM demo không tồn tại; `.update()` không kiểm row count nên chưa thể coi đồng bộ profiles thành công. Không ghi đè thông tin cá nhân để thử. |
| 41 | Đổi mật khẩu | CHƯA KIỂM | Không đổi mật khẩu tài khoản demo đang dùng, không đọc hash/password từ DB. |
| 42 | Notification Preferences | MỘT PHẦN | Toggle/Save/remount giữ được preference theo user trong localStorage; chưa đồng bộ Supabase và chưa chứng minh cấu hình điều khiển mail/thông báo backend. Đã khôi phục storage cũ. |
| 43 | Đổi ngôn ngữ Anh/Việt | TỐT | Đổi bằng menu avatar trên MM, sidebar đổi tiếng Việt rồi khôi phục English; preference được lưu. |
| 44 | Đọc thông báo nhân sự/proposal, đánh dấu đã đọc | TỐT | Membership notifications trả được danh sách theo user; proposal notifications có event audit thật và mark-read đọc lại `is_read=true`. Chưa kiểm mail/push ngoài app hoặc delivery cho request gia nhập mới. |

## Lỗi ưu tiên sửa

1. **P1 — Business Profile loading loop:** `components/settings/BusinessProfileTab.jsx` callback `loadProfile` phụ thuộc `initialProfile`, gọi `onProfileUpdated(result.profile)`; App truyền `setProfile`, tạo object prop mới. Vòng effect gây request liên tục. API tốt không đủ để kết luận UI lưu được.
2. **P1 — Budget submit báo thành công giả:** `pages/RecommendationReviewPage.jsx:submit()` không gọi API; chưa có approval/revision/audit persisted.
3. **P1 — Dashboard/Audit/Reports/Competitor dùng fixture:** cần nối từng trang đúng service, không thay bằng toast hoặc spinner rồi coi thành công.
4. **P2 — Badge và số role sai:** tại một thời điểm đo DB có 4 pending nhưng sidebar vẫn “Approvals 3”; DB 3 thành viên nhưng Role Management/spec dùng 3/4/7 và workspace mẫu.
5. **P2 — Header search và Add Competitor chưa thực hiện nghiệp vụ.**
6. **P2 — Personal profile:** map tên từ context đúng field; kiểm tra row thật trước khi báo public.profiles sync thành công. Đây không phải bằng chứng đã đổi mật khẩu hay đã làm hỏng Auth.

Đọc code còn thấy parent `saveProfile` bắt lỗi nhưng không throw lại cho Settings tab; có nguy cơ tab báo success sai khi request lưu thất bại. Lượt này chưa fault-injection nhánh lỗi đó nên chỉ ghi nhận là rủi ro từ code, không cộng thêm một lỗi UI đã tái hiện.

## Bằng chứng và dữ liệu kiểm thử

- `marketing-manager-api-evidence.json`: 31 kiểm tra API thật, 31 PASS, dùng JWT user; không dùng service_role cho nghiệp vụ.
- `marketing-manager-browser-navigation.json`: mapping heading/nút/API theo các trang đã mở; không chứa token/password.
- `marketing-manager-browser-results.json`: các kết quả UI/RLS readback tiêu biểu được tổng hợp từ lượt chạy.
- `mm-fixtures/UI_AUDIT_MM.csv`: dữ liệu tổng hợp chỉ dùng cho audit; không phải hiệu suất quảng cáo thực tế.

Chỉ thao tác trong workspace demo. Đã khôi phục role `member` và một Team ban đầu của Employee; mô tả tuyển dụng và hồ sơ doanh nghiệp cũng được khôi phục. Để lại 2 Team, 1 campaign, 8 proposal và 4 dòng import có nhãn audit để đối chiếu. Không gửi email, không đổi mật khẩu, không xóa tài khoản, không dispatch quảng cáo hay dùng LLM trả phí.

Export CSV/JSON được kiểm tra ở mức Blob và nội dung; không khẳng định đã kiểm file trong thư mục Downloads của người dùng. Các bước chưa chạy không được ghi PASS.

Audit này không sửa code chức năng, không sửa schema/.env, không commit/push. Các lỗi nêu trên còn tồn tại tại thời điểm báo cáo.

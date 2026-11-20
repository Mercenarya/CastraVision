# System Admin — kết quả triển khai local, 20/11/2026

Worktree `.tmp/publish-dat`, nhánh Dat, baseline `171f973`. Người dùng đã duyệt thiết kế, kế hoạch và ngoại lệ backend/Supabase local. Không commit/push, không đọc/sửa `.env`, không triển khai hosted. Báo cáo này thay thế bản tiến độ frontend-only trước đó; audit ban đầu được giữ nguyên để đối chiếu.

## Thay đổi chính

- Registry thật qua Django API → RPC bằng JWT người dùng. Tạo doanh nghiệp có request ID chống gửi trùng, slug chuẩn hóa duy nhất; domain/email dùng chung hợp lệ. Sửa metadata có version chống ghi đè. System Admin không tự thành thành viên doanh nghiệp.
- Schema `platform_private` chứa metadata, lời mời, audit bất biến và read receipts. Quyền platform lấy từ metadata do server quản lý; không suy email hoặc user_metadata. DTO chỉ trả thông tin quản trị/aggregate, không trả danh bạ nhân viên hoặc dữ liệu chiến dịch.
- Inactive có restrictive RLS, kiểm tra RPC và Django; token đã cấp trước vẫn bị chặn ở request tiếp theo. Reactivate giữ membership. Không tuyên bố hủy ngược giao dịch đã được cấp quyền trước thời điểm chuyển trạng thái.
- Lời mời Marketing Manager tách trạng thái tạo/gửi/nhận; có expiry, revoke, lease, kiểm tra người nhận và quyền hiện tại của người mời. Nhận lời mời tạo membership/default team/audit trong giao dịch; không đặt lại mật khẩu tài khoản có sẵn.
- Frontend bỏ nguồn fixture ở layout đăng nhập, có loading/error/retry, chống kết quả cũ khi đổi identity, đọc lại sau mutation; thông báo dùng event thật. Telemetry/quota chưa có provider được ghi chưa cấu hình.
- Sửa callback giữ invitation ID nhưng bỏ credential khỏi URL; sửa AuthProvider để cập nhật hồ sơ cùng user không làm mất màn hình Settings, đổi user vẫn xóa context cũ. Job title là dữ liệu hồ sơ, không cấp quyền.

## Kiểm chứng

- SQL: cả `CastraVision-platform-test` và `CastraVision-platform-clean-test`: **17 file, 285/285 PASS**, chạy lại trong lượt hoàn tất. Từng file: 01 helpers 28; 02 create 12; 03 last-admin 8; 04 integrity 15; 05 privacy 6; 05 schema 10; 06 audit 44; 06 workflows 14; 07 privacy 15; 07 indexes 3; 08 delivery/password 20; 09 leader 57; 10 compatibility 4; 11 artifacts 8; 12 platform 13; 13 suspension 11; 14 invitations 17.
- Django: **67/67 PASS**, gồm transport JWT, spoofed metadata, session/Inactive, provider failure/timeout và denied claim không gửi email. Unit test mock transport không thay thế tích hợp.
- Tích hợp thật local: **48/48 PASS**, HTTP Auth/REST thật + Django views thật, không mock HTTP. Có concurrent create, nhận lời mời bằng tài khoản có sẵn, read receipt và chặn token cũ trên cả ba đường. Evidence: `system-admin-real-local.json`.
- Frontend: chạy lại full sau chỉnh cảnh báo clock **25 file, 60/60 PASS**. `test:auth` **12/12**, `test:membership` **11/11**. Lint exit 0, chỉ còn warnings ngoài phần mới; build PASS, bundle khoảng 794 kB còn cảnh báo >500 kB.
- Catalog local: **21 bảng** có workspace scope, không thiếu RLS/restrictive Active policy/write trigger; inventory **71 SECURITY DEFINER functions** ở `system-admin-catalog.json`. Cột activeReference chỉ là tìm từ khóa, không phải chứng minh bảo mật từng hàm. Có **0 Storage objects policies** trên local; không kết luận đã kiểm chứng đường Supabase Storage.
- Hai transaction độc lập: business UPDATE giữ shared lock, status UPDATE chờ **2,028 giây**; cả hai ROLLBACK. Evidence `system-admin-lock-check.json`. Đây là bằng chứng serialization cho write đã vào guard; request sau suspend được kiểm tra riêng trong 48 ca HTTP.
- Browser đã thực hiện ở lượt triển khai trước: đăng nhập local, tạo công ty, gửi mail Mailpit, mở link, đặt mật khẩu user mới, nhận MM, đăng nhập lại bằng mật khẩu đó, lưu profile Auth+public.profiles, sai mật khẩu hiện tại bị từ chối, đổi mật khẩu đúng, old password thất bại/new thành công; logout/reload không giữ layout đặc quyền. Kiểm tra sort cả 5 mode trên registry thật. Không phải tất cả thao tác browser đã có automation tái chạy ở lượt cuối.
- Không gửi Gmail thật, không kiểm tra SMTP hosted. Fixture chỉ trong stack riêng, giữ lại phục vụ đối chiếu; không reset stack cũ. Không ghi thông tin đăng nhập vào báo cáo.

## Ma trận 32 nhóm (không đánh đồng UI test với E2E)

| # | Nhóm | Kết quả / giới hạn |
|---|---|---|
| 1 | Đăng nhập System Admin | Auth thật local PASS; browser đã chạy |
| 2 | Nguồn quyền backend | API/RPC + negative tests PASS |
| 3 | Điều hướng | Component/browser PASS |
| 4 | Metrics | Registry aggregate thật; seats/quota chưa cấu hình |
| 5 | Danh bạ công ty | API/DB thật PASS; không roster PII |
| 6 | Dashboard search | UI lọc registry thật; đã kiểm tra |
| 7 | Dashboard pagination | UI test + browser registry thật |
| 8 | Refresh | Đọc lại API thật; telemetry không có provider |
| 9 | Header search | Sửa lỗi setter và truyền filter; regression PASS |
| 10 | Management search/empty | UI test/browser PASS |
| 11 | Status filter | Browser registry thật PASS |
| 12 | Sort | 5 mode đã đối chiếu độc lập trên registry thật |
| 13 | Management pagination | UI tests; chưa tái chạy toàn bộ browser sau tích hợp |
| 14 | View Overview | Sửa hai đường mở; component/browser PASS |
| 15 | Edit/save | API persistence/version PASS; chưa chốt full browser edit/reload cuối |
| 16 | Active/Inactive | SQL + HTTP 3 role/3 đường PASS; UI acknowledgement test PASS |
| 17 | Refresh Status | API detail read-back; chưa tái chạy click browser cuối |
| 18 | Create workspace | Browser + HTTP concurrent/idempotent PASS |
| 19 | Required validation | Component test PASS, DB validation |
| 20 | Slug/domain autofill | Validator test, gồm tiếng Việt PASS |
| 21 | Duplicate | Slug DB unique/idempotency PASS; shared domain/email là hợp lệ |
| 22 | Cancel/reset | UI regression, không ghi API khi cancel |
| 23 | Mời/nhận Marketing Manager | Mailpit/Auth thật + SQL PASS; reissue mới có SQL, chưa browser cuối |
| 24 | Telemetry/DNS/history | History DB thật; telemetry/DNS không cấu hình, không giả số liệu |
| 25 | Bell/read | API receipt thật PASS; chưa chốt browser click bell cuối |
| 26 | EN/VI | Toggle đã kiểm tra UI; chưa dịch đầy đủ màn hình mới |
| 27 | Notification preferences | Theo thiết bị/localStorage; không server sync hay email delivery |
| 28 | Hồ sơ cá nhân | Browser Auth+profiles thật đã PASS; SDK partial/zero-row tests |
| 29 | Mật khẩu | User local dùng một lần: current sai bị từ chối, old/new grant đã kiểm tra |
| 30 | Tenant/PII isolation | SQL authenticated + HTTP System Admin legacy-membership deny PASS; chưa chứng minh mọi tương lai endpoint |
| 31 | Logout | Browser logout/reload và chuyển role đã chạy; chưa tái chạy cuối |
| 32 | Account menu/Settings | UI/browser PASS; không tab Business Profile của platform |

## Giới hạn còn lại trước nghiệm thu hosted

Không kết luận cả 32 nhóm đều đạt E2E. Còn chạy browser cuối cho edit/reload, reissue, bell, preferences và đầy đủ bản dịch; review từng SECURITY DEFINER theo inventory và kiểm tra đường tải file/Storage cần hoàn tất trước tuyên bố coverage tuyệt đối. SQL và HTTP hiện có chứng minh các đường đã nêu, không tự thay thế các kiểm tra còn thiếu.

Hosted cần preflight riêng và người dùng duyệt. Xem `system-admin-rollout.md`; không dùng service role cho platform CRUD và không bật migration thật chỉ vì local PASS.

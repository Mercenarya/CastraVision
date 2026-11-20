# Kiểm tra System Admin — 20/11/2026

Baseline: Dat `171f973`, worktree `.tmp/publish-dat`. Không sửa tính năng, backend, schema hoặc dữ liệu doanh nghiệp; không commit/push.

## Phạm vi và cách đếm

2 mục sidebar (Dashboard, Company Management), 4 màn hình nghiệp vụ (Overview, Management, Company Overview, Create Company), kèm Settings và header. Đếm **32 nhóm luồng**, không đếm mỗi icon hoặc từng trường nhập là một chức năng.

Kết quả: **2 nhóm xác thực chạy thật; 13 nhóm giao diện chạy trên dữ liệu local; 13 nhóm lỗi/chưa nối dữ liệu thật; 4 nhóm chưa kiểm chứng end-to-end**. Không được cộng 13 nhóm UI vào số nghiệp vụ đã lưu Supabase.

Browser: mount chính các component production trong harness cô lập trên Vite `127.0.0.1:57300`, dùng user giả chỉ cho UI; không giả lập JWT hoặc kết luận đã đăng nhập UI. Theo dõi lỗi JavaScript, fetch và dựng lại component để kiểm tra mất dữ liệu. Không có backend đang chạy khi thử UI; Docker tắt. Không dùng việc thiếu backend để suy lỗi: các handler nghiệp vụ được kiểm tra trực tiếp và không gọi API.

Auth độc lập: dùng tài khoản demo có sẵn, credential đọc trong bộ nhớ từ file ngoài Git; public/anon key từ CLI metadata, không đọc `.env` trong script audit. Supabase Auth thật + Django test Client chạy view thật và HTTP xác minh identity. Không mock HTTP. Kết thúc thu hồi riêng session kiểm thử.

## Ma trận

| # | Nhóm luồng | Kết quả | Bằng chứng / giới hạn |
|---|---|---|---|
| 1 | Đăng nhập Supabase bằng System Admin demo | THẬT | Password grant 200; không in password/token |
| 2 | Backend xác minh nguồn quyền System Admin | THẬT | `/api/auth/session/` 200, `platform_role=system_admin` |
| 3 | Điều hướng Dashboard / Management / Create | UI | Click chuyển đúng màn hình |
| 4 | Tổng công ty, Active/Inactive, headcount, seats | CHƯA NỐI THẬT | Khởi tạo 15 công ty từ `INITIAL_COMPANIES`, 11 Active, 4 Inactive |
| 5 | Danh bạ doanh nghiệp toàn nền tảng | CHƯA NỐI THẬT | Bảng render dữ liệu mock; không GET registry thật |
| 6 | Tìm kiếm trong bảng Dashboard | UI | Acme trả một hàng |
| 7 | Phân trang Dashboard | UI | Next đổi sang nhóm Zenith/Horizon/Pulse… |
| 8 | Refresh Telemetry / Refresh danh sách | CHƯA NỐI THẬT | Toast `local simulation`, timeout, không request cập nhật |
| 9 | Tìm kiếm ở header | LỖI | Không lọc bảng; tại subpage gây `setActiveTab is not defined` |
| 10 | Tìm kiếm Management và empty state | UI | Acme một hàng; chuỗi không tồn tại hiện empty |
| 11 | Lọc trạng thái Management | UI | Inactive trả 4 hàng, All trả lại danh sách |
| 12 | Sắp xếp Management | UI | A–Z đổi thứ tự đúng; chưa xác minh độc lập toàn bộ mode khác |
| 13 | Phân trang Management | UI | Trang 1/2 khác hàng đầu; Previous về trang 1 |
| 14 | View Overview từ Dashboard/Management | LỖI | Click cả hai nơi gây ReferenceError, không mở chi tiết |
| 15 | Sửa thông tin doanh nghiệp và lưu | CHƯA NỐI THẬT | Đổi domain hiện thành công local; dựng lại mất; không request ghi |
| 16 | Chuyển Active/Inactive doanh nghiệp | CHƯA NỐI THẬT | Lưu local; dựng lại select trở về Active; không chứng minh chặn truy cập tenant |
| 17 | Refresh Status doanh nghiệp | CHƯA NỐI THẬT | Hiện `Status Synchronized (Local Simulation)` |
| 18 | Tạo tài khoản doanh nghiệp/workspace | CHƯA NỐI THẬT | Tạo Audit Tenant xuất hiện trong bảng, không API; dựng lại mất |
| 19 | Validation tên bắt buộc | UI | Submit rỗng bị `Please enter a Company Name.` |
| 20 | Tự sinh slug/domain | UI | Tên sinh slug, email sinh domain đúng trong form |
| 21 | Chặn trùng domain/email doanh nghiệp | LỖI | Cảnh báo Duplicate Tenant Notice nhưng submit `owner@acmecorp.com` với tên mới vẫn được |
| 22 | Reset/Cancel form; cancel sửa | UI | Form về rỗng; cancel về Management; cancel edit thoát không lưu |
| 23 | Provision Marketing Manager / gửi email thiết lập tài khoản | CHƯA TRIỂN KHAI | Create chỉ nhận email và tạo object local; không tạo Auth user/membership hoặc gửi mail |
| 24 | Telemetry, node/storage/uptime, DNS và lịch sử governance | CHƯA NỐI THẬT | Fixture/simulation, không live telemetry/DNS/audit history |
| 25 | Chuông Telemetry alerts | LỖI | Click không đổi DOM; không handler/luồng lấy thông báo |
| 26 | Đổi ngôn ngữ EN/VI | UI | Sidebar đổi sang Bảng điều khiển/Quản lý công ty; giữ sau remount; chưa dịch hết màn hình |
| 27 | Lưu/reset tùy chọn thông báo | UI LOCAL | Toggle false, Save, remount giữ false; Reset về true. Chỉ localStorage, không xác nhận gửi email/đồng bộ thiết bị |
| 28 | Lưu thông tin cá nhân System Admin | CHƯA KIỂM CHỨNG | Không sửa hồ sơ thật. Đọc code phát hiện chain `.maybeSingle().select().single()` cần kiểm chứng; không khẳng định lưu thành công |
| 29 | Đổi mật khẩu System Admin | CHƯA KIỂM CHỨNG | Không thay mật khẩu demo đang dùng; test role khác trước đó không thay thế test này |
| 30 | Cách ly dữ liệu tenant/PII ở DB | CHƯA KIỂM CHỨNG | Notice trên UI không phải bằng chứng RLS. Chưa chạy negative tests JWT System Admin ở từng bảng |
| 31 | Đăng xuất từ UI và kiểm tra quay lại/refresh | CHƯA KIỂM CHỨNG | Harness chỉ callback. Auth logout scope local độc lập trả 204; chưa phải UI end-to-end |
| 32 | Menu tài khoản, Settings và giới hạn tab | UI | Menu mở, Settings render Account/Security + Notifications; không có Business Profile cho System Admin |

## Lỗi ưu tiên

1. `SystemAdminLayout.jsx:100,128`: gọi `setActiveTab` không tồn tại; setter hiện có là `setInternalTab`. Hai đường click lỗi đã tái hiện. Chưa sửa trong audit.
2. `globalSearch` không được truyền vào hai bảng; gõ header không làm thay đổi kết quả.
3. `INITIAL_COMPANIES` + React state là nguồn dữ liệu platform hiện tại. Tạo/sửa/status chưa phải nghiệp vụ lưu thật.
4. Create: live validation kiểm tra domain/email, nhưng submit kiểm tra trùng chỉ name/tenantId; điều kiện không đồng nhất.
5. Chuông không có handler. Thông số infrastructure và governance history vẫn là fixture.
6. Form tạo đang cấm Gmail/free-mail. Đây là quy tắc cần chủ sản phẩm xác nhận, chưa tự coi là lỗi bảo mật hoặc tự gỡ.
7. AccountSecurityTab có chain `.maybeSingle().select('id').single()` sau UPDATE; đánh dấu nghi vấn code, không đánh đồng với lỗi runtime đã tái hiện.

## Kiểm tra kỹ thuật

- Lint: exit 0, còn cảnh báo có sẵn.
- Build: PASS; bundle 830.41 kB, cảnh báo chunk >500 kB.
- Auth: 3/3 kiểm tra (login 200, verified role 200, logout riêng phiên 204).
- Browser evidence: `system-admin-browser-evidence.json`. Các observation có thể gồm probe trước điều chỉnh selector; kết luận chỉ lấy thao tác hoàn thành và đối chiếu source.
- Không tạo company/Auth user, gửi mail, thay password, đổi quyền hoặc schema trên hosted. Login/logout tạo/thu hồi session thử theo hoạt động Auth thông thường.
- Không có kết luận “tất cả chạy bình thường”. Cần tích hợp platform API và kiểm thử E2E đăng nhập UI + RLS trước nghiệm thu toàn role.

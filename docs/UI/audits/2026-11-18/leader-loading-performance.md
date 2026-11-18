# Leader: thời gian tải và quản lý request

## Bằng chứng trước sửa

Browser Leader đọc được đủ ba campaign, nhưng một số request riêng lẻ mất 7–14 giây; business-profile có mẫu khoảng 15–19 giây. Đây là số đo từng request trong phiên debug, không phải benchmark p95 hoặc SLA.

Trước khi render LeaderWorkspace, App còn chờ `business-profile/` và `campaign-imports/` của giao diện cũ. Leader không dùng hai kết quả này: nó tự lấy context, campaign và analytics từ API có scope riêng. Chuỗi chờ này cộng thêm thời gian trước khi bắt đầu tải màn hình Leader.

Hook query vẫn gửi request của effect đã bị StrictMode cleanup; request cũ không được hủy khi đổi màn hình/bộ lọc và không có giới hạn chờ. API trả thành công không đồng nghĩa giao diện sẽ hết loading nhanh trong mọi trường hợp.

## Thay đổi giới hạn trong frontend

- App không gọi hai API legacy hoặc chờ hai kết quả đó trước khi mở Leader. Vẫn giữ các bước xác minh user, password setup và membership trước khi render; API/RLS phía server không đổi.
- Hook bỏ request của effect đã cleanup, chuyển AbortSignal xuống service/fetch và hủy khi đổi query/unmount. API client không gửi request đã bị hủy trong lúc chờ Supabase session.
- Deadline 30 giây cho query; hết hạn dừng loading và cho thử lại. Không tự retry các mutation, không thay đổi idempotency hoặc gọi API ghi để làm mới giao diện.
- Không thêm cache quyền/user/workspace, không nới RLS và không sửa backend, schema hay `.env`.

## Kiểm chứng

- Regression test trước sửa thất bại đúng ba ca query lifecycle; sau sửa cả ba PASS.
- Regression App trước sửa bị chặn ở “Đang tải dữ liệu Workspace…” khi API legacy không resolve; sau sửa mở Leader và không gọi hai API đó.
- Full Vitest: 10 file, 29 test PASS. Bộ Node Auth/security có thêm test cancellation trong lúc chờ session; 12/12 PASS. Lint/build PASS với warning cũ.
- Trình duyệt dùng tài khoản Leader demo thật: chọn Campaigns và thấy đủ ba dòng sau khoảng **3.252 ms**. Các request profile/import legacy không còn trong startup của Leader. Đây là một lần đo trên máy dev, không cam kết mọi phiên đều có cùng tốc độ; latency mạng/Supabase vẫn có thể dao động.
- Bài thử browser giữ request campaign không phản hồi trước khi API client được khởi tạo: thông báo timeout hiện sau **30.108 ms**; tắt mô phỏng rồi bấm Thử lại nhận đủ ba campaign thật sau **1.408 ms**. Không thay response nghiệp vụ bằng dữ liệu giả. Đã dọn mô phỏng khỏi trang sau kiểm thử.

Không commit/push. Dữ liệu demo và phân công Team giữ nguyên.

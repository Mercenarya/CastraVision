# Kết quả kiểm tra độc lập chức năng nhân sự — 17/11/2026

## Phạm vi và kết luận

Kiểm tra bản tính năng trong worktree `.tmp/mship` (frontend 57300, backend
58000), dùng Supabase local project `CastraVision-membership-test` tại
57321/57322 và hộp thư local 57324. Không thay đổi code sản phẩm, không reset
database, không áp dụng migration/ghi dữ liệu lên hosted, không commit/push.

Các luồng chính đã chạy thật trên local; không dùng adapter preview làm bằng chứng
lưu dữ liệu. Kết quả không chứng minh mọi lỗi đều đã được loại bỏ hoặc hosted đã sẵn sàng.

## Bằng chứng chạy lại

| Kiểm tra | Kết quả |
|---|---|
| `scripts/membership/local_stack.py test` | 8 file pgTAP, 122 assertion PASS |
| Pytest toàn backend worktree, cấu hình local truyền trong process | 39 PASS, 2 warning |
| `npm run test:auth` | 11 PASS |
| `npm run test:membership` | 11 PASS |
| `npm run lint` | Không lỗi; 16 warning cũ |
| `npm run build` | PASS; cảnh báo bundle lớn vẫn còn |
| `scripts/membership/verify_local_membership.py` | 6 nhóm integration check PASS, fixtures được dọn |
| `recheck-membership-browser.py` | Chrome riêng, các bước phía dưới PASS, exit 0 |
| `git diff --check` | PASS |

Integration script chạy GoTrue/PostgREST thật và Django test client; browser harness
được bổ sung để kiểm tra frontend production flow với chính HTTP backend cổng
58000. Hai loại kiểm chứng được phân biệt, không gộp test mock thành E2E thật.

## Các bước browser đã kiểm chứng

1. MM đăng nhập qua form bằng tài khoản local thử, vào dashboard thật.
2. Người mới chuyển sang đăng ký email-only, gửi form; nhận email thật trong hộp thư local.
3. Mở link từ email, qua callback ứng dụng tới trang đặt mật khẩu.
4. Nhập mật khẩu mới và xác nhận; Supabase lưu xong thì xuất hiện danh sách công ty.
5. Chọn công ty thử và gửi yêu cầu bằng form; SQL xác nhận chưa có membership.
6. MM mở Nhân sự/Chờ duyệt, thấy đúng email ứng viên. HTTP backend xác nhận notification
   được lưu và unreadCount = 1 cho MM thử.
7. MM bấm Duyệt, xác nhận dialog; SQL có role member thuộc đúng Workspace.
8. Employee cập nhật trạng thái, vào dashboard; reload giữ phiên và quyền.
9. MM tạo nhóm bằng dialog; kiểm tra nhóm có trong database.
10. MM chọn thành viên, Phân công, đổi role sang Leader và chọn nhóm vừa tạo.
    SQL xác nhận role manager và đúng team membership; reload user mở Leader Workspace.
11. MM mời email thử qua dialog thật; lời mời xuất hiện trong tab Lời mời,
    delivery_status = sent ở local. SQL xác nhận chưa tạo membership cho người nhận.

Integration script riêng còn kiểm tra: hai request/approve đồng thời không tạo
trùng; email sai người nhận không accept được; người nhận xác thực email, tự đặt
mật khẩu rồi bấm accept mới có membership; mật khẩu tài khoản cũ vẫn đăng nhập được;
Employee/Leader/System Admin và MM khác công ty bị chặn truy cập nhân sự trái phép.
Các ca revoked/expired/delivery-failed và quyền ghi trực tiếp được kiểm chứng qua
SQL/backend tests; không mô tả chúng như đã click hết trên browser.

## Bằng chứng giao diện

- [Đang chờ quản lý duyệt](membership-browser-pending.png).
- [Employee sau khi được duyệt](membership-browser-approved.png).
- [Lời mời đã lưu trên bản chạy thật](membership-browser-invitation.png).

Chỉ chứa dữ liệu giả của lần kiểm tra; không có mật khẩu, token hay link xác thực.
Chrome dùng profile tạm ngoài repo, không chạm các tab/profile đang dùng của người dùng.
Một lần chụp ảnh Chrome bị timeout sau khi functional step đã PASS; harness tách
lỗi artifact khỏi kiểm chứng chức năng. Lần chạy đầy đủ sau cùng exit 0, không có
artifact timeout. Đây không phải thay đổi code sản phẩm để làm test qua.

## Những điều chưa thể kết luận là sẵn sàng dùng trên bản chính

1. **Trang ảnh gửi là DEV PREVIEW.** Source đang phục vụ tại 57300 sử dụng
   `createMembershipPreview()`. Review ở đó chỉ sửa mảng dữ liệu giả trong memory,
   không ghi Supabase. Cần dùng `/` và tài khoản thật của môi trường tương ứng.
2. **Bản main và bản tính năng đang tách nhau.** Thư mục chính vẫn chưa có membership
   API mới: GET `/api/onboarding/state/`, `/api/workspace/personnel/` và
   `/api/membership-notifications/` trên cổng 8000 đều 404. Các route tương ứng
   qua cổng 57300 tồn tại và trả 401 nếu không đăng nhập. Bản main 5173 chưa được
   coi là bản có luồng mời/duyệt hoàn chỉnh.
3. **Email được kiểm tra trong hộp thư local, không phải Gmail thật.** Chưa xác minh
   SMTP hosted, delivery tới Gmail, redirect/site URL và chạy production.
4. **Không thực hiện hosted cutover trong lượt kiểm tra.** Cần đối chiếu và áp dụng
   migration/API/frontend đúng môi trường trước khi cho nhân viên sử dụng thật.

## Cách tái chạy

Từ `.tmp/mship`, dùng Python `.venv` của repo chính để chạy
`scripts/membership/verify_local_membership.py` và `scripts/membership/local_stack.py test`.
Guard yêu cầu đúng Docker project/label/port; không chuyển sang hosted khi local lỗi.

Từ repo chính: `rtk proxy .venv\Scripts\python.exe -u -X utf8 docs\UI\audits\2026-11-17\recheck-membership-browser.py`.
Yêu cầu các dịch vụ local 57300/58000/57321/57324 đang chạy và Chrome + websockets
đã có sẵn. Script chỉ tạo và xóa fixtures của chính lần chạy; không xóa tài khoản cũ.

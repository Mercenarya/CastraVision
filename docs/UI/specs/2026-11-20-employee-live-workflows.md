# Employee live workflows — phạm vi và thiết kế 20/11/2026

Worktree `.tmp/publish-dat`, Dat. Giữ nguyên các thay đổi chưa commit của các role khác. Không hosted/Git mutation/env/dependency mới.

## Phần sửa trên interface đã tồn tại

| Luồng | Nguồn / interface | Quyền | Nghiệm thu |
|---|---|---|---|
| Identity/Team | auth context + leader/context | JWT verified + membership | Đổi user không còn tên/Team cũ |
| KPI proposal | leader/proposals mine=true, status, total | Own proposal trong Team | Số lượng khớp server, không dùng độ dài trang |
| Recent submissions | leader/proposals mine=true | Own | Mở đúng ID, read-back sau revise/decide |
| Campaigns | leader/campaigns và campaign | Assigned Team | List/search/page/detail, revoked access bị từ chối |
| Reference | proposals strategy approved + proposal | Team được cấp, read-only | Không hiện draft/rejected; giữ tạo draft ở luồng riêng |
| Notifications | notifications/read_notification | Recipient hiện tại | Counter reload sau đọc, không literal 2 |
| Settings | Auth + profiles + existing preferences | Own | Save/read-back, wrong password fail, logout clear state |
| Task list/detail/KPI | workspace_tasks → employee_tasks list/task/summary → /api/employee/ | Own Employee; Leader Team; MM workspace | SQL authenticated/RLS + HTTP thật, summary/read-back |
| Giao việc | employee_tasks candidates/create | Leader/MM, Employee cùng campaign Team | Actor từ auth.uid; idempotence; Employee create bị chặn |
| Tiến độ/liên kết proposal | employee_tasks update | Employee sở hữu; operator quản lý trạng thái | Version cũ bị 409, proposal phải own/cùng scope, completed không duyệt proposal |

Không giữ ba chế độ AI khi chỉ có một trình soạn thủ công. Không có provider Brand Safety thì gỡ action gây hiểu nhầm, ghi chưa cấu hình; không tạo rule/điểm tuân thủ không có nguồn. Đây là giới hạn phải ghi trong ma trận, không tính provider đạt.

## Task/sprint: người dùng đã duyệt mô hình tối thiểu

Người dùng đã duyệt ngoại lệ backend/Supabase local và mô hình tối thiểu bằng câu trả lời trực tiếp trong phiên. Không map ngầm proposal thành task. Hosted vẫn phải hỏi riêng.

Mô hình đề xuất: workspace_tasks riêng, một task thuộc workspace/team/campaign có một Employee assignee, người giao, title/description, due_at tùy chọn, status, version và request_id chống gửi trùng. Có thể liên kết proposal cùng scope của assignee. Leader chỉ giao trong Team của mình; Marketing Manager trong workspace; Employee chỉ xem/cập nhật task của chính mình. Không cho payload quyết định actor/role/workspace. Task hoàn thành không thay thế quyết định phê duyệt proposal.

Đã triển khai migration `20261120104659_employee_assigned_tasks.sql`, RLS/RPC/tests và API chỉ chuyển tiếp user JWT. Lifecycle todo/in_progress/blocked/completed; operator có thể cancel; cancelled terminal, completed chỉ reopen về in_progress. Assignment bất biến. Có active-tenant guard, kiểm tra JWT cũ khi Inactive, foreign Team/workspace, assignee không hợp lệ, version cũ/idempotency. UI giao việc gắn với campaign/Team của người có quyền thay vì cho Employee tự giao. Kết quả và giới hạn triển khai xem báo cáo remediation.

Sprint chưa có nguồn: hiện chưa cấu hình, không dựng bảng sprint hoặc velocity dự đoán nếu chưa được yêu cầu riêng.

## Trình tự và kiểm thử

1. Sửa frontend dựa trên API hiện có; test hồi quy red → green cho bỏ fixture, đúng ID, unavailable.
2. Tích hợp App theo identity+workspace key, tránh state/request của identity trước.
3. Kiểm chứng template, profile/password/preferences/logout bằng Employee local thử; không thay kết quả role khác.
4. Khi được duyệt mới thực hiện task subsystem, thêm test SQL/HTTP; không deploy hosted.
5. Lint/build/full tests, diff check, scoped secret scan; cập nhật ma trận 32 nhóm với các giới hạn provider/browser/task còn lại.

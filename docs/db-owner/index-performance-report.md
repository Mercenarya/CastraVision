# SCRUM-206 — Báo cáo index và hiệu năng

Ngày đo: 22/10/2026. Toàn bộ phép đo chạy trên Supabase local bằng PostgreSQL
trong Docker Desktop; không link hoặc truy cập project hosted.

## Phạm vi và dữ liệu

Dữ liệu giả lập có phân bố lệch: 10 workspace lớn giữ khoảng 70% dữ liệu, 190
workspace còn lại chia phần còn lại. Seed mất khoảng 11 giây, gồm:

| Bảng | Số dòng |
|---|---:|
| `workspaces` | 200 |
| `workspace_members` | 1.000 |
| `audit_logs` | 200.000 |
| `notifications` | 100.000 |
| `campaign_performance` | 300.000 |
| `strategy_context_embeddings` (`vector(1536)`) | 10.000 |

Mỗi phép đo dùng `EXPLAIN (ANALYZE, BUFFERS)` ba lần và lấy trung vị. Các số
dưới đây là workspace lớn; workspace nhỏ cũng được đo và không có hồi quy đáng
kể. `Index Scan` trong cột “sau” là index mới, trừ các dòng ghi “index sẵn có”.

## Kết quả trước và sau

| Truy vấn | Chế độ | Trước (ms / plan) | Sau (ms / plan) | Kết luận |
|---|---|---:|---:|---|
| Audit mới nhất theo workspace/thời gian | superuser | 0,108 / Index Scan | 0,136 / index sẵn có | Không cần index mới |
| Audit mới nhất theo workspace/thời gian | authenticated | 3,890 / Index Scan | 3,964 / index sẵn có | Chi phí chủ yếu là RLS |
| Audit theo actor + thời gian | superuser | 0,174 / Index Scan lọc thêm | 0,309 / composite Index Scan | Plan đúng; dao động cache ở mức dưới 1 ms |
| Audit theo actor + thời gian | authenticated | 179,315 / Bitmap + Sort | 4,180 / Index Scan | Giảm 97,7%; giữ index |
| Audit theo entity/action | superuser | 0,505 / Index Scan lọc thêm | 0,272 / composite Index Scan | Cải thiện tuyệt đối nhỏ; bỏ index do chi phí ghi |
| Audit theo entity/action | authenticated | 4,622 / Index Scan lọc thêm | 4,052 / composite Index Scan | Chỉ giảm 0,570 ms; bỏ index |
| Đếm notifications chưa đọc | superuser | 1,408 / Bitmap | 0,211 / Index Only Scan sẵn có | Không thêm index |
| Đếm notifications chưa đọc | authenticated | 12,926 / Bitmap | 13,572 / Bitmap | Không thêm; cần tối ưu RLS riêng |
| Lấy 20 notifications mới nhất | superuser | 1,619 / Bitmap + Sort | 0,096 / Index Scan | Giảm 94,1%; giữ index |
| Lấy 20 notifications mới nhất | authenticated | 13,525 / Bitmap + Sort | 0,590 / Index Scan | Giảm 95,6%; giữ index |
| Tổng hợp campaign theo channel/180 ngày | superuser | 7,493 / Bitmap + Aggregate | 10,422 / index sẵn có | Covering index thử không được chọn |
| Tổng hợp campaign theo channel/180 ngày | authenticated | 93,931 / Bitmap + Aggregate | 98,234 / index sẵn có | Chi phí RLS; không thêm index |
| Campaign mới nhất theo workspace/ngày | superuser | 0,536 / Index Scan | 0,780 / index sẵn có | Index hiện tại đủ |
| Campaign mới nhất theo workspace/ngày | authenticated | 2,644 / Index Scan | 2,972 / index sẵn có | Index hiện tại đủ |
| Liệt kê workspace của user | superuser | 0,093 / Index Scan | 0,081 / index sẵn có | Index hiện tại đủ |
| Liệt kê workspace của user | authenticated | 0,122 / Index Scan | 0,096 / index sẵn có | Index hiện tại đủ |

Workspace nhỏ có thời gian sau index: audit actor 3,898 ms authenticated,
audit entity/action 1,576 ms, notifications latest 0,851 ms. Tất cả truy vấn
dashboard mẫu đều dưới 100 ms ở quy mô giả lập này.

## Index được giữ và bị loại

Giữ hai index:

- `idx_audit_logs_workspace_actor_time (workspace_id, actor_id, created_at desc)`.
- `idx_notifications_user_created_time (user_id, created_at desc)`.

Không thêm:

- Audit entity/action/time: authenticated chỉ giảm từ 4,622 xuống 4,052 ms,
  trong khi index này làm 100.000 audit INSERT tăng thêm 0,388 giây so với cấu
  hình đã có actor index. Vì lợi ích đọc tuyệt đối nhỏ và chi phí ghi rõ ràng,
  `idx_audit_logs_workspace_entity_action_time` bị loại khỏi migration.
- Notifications unread: index `(user_id, is_read)` đã có.
- Campaign list/range: `(workspace_id, record_date)` đã có.
- Campaign covering `(workspace_id, record_date, channel) include (...)`: planner
  không chọn và phép đo không cải thiện; chi phí ghi/lưu trữ không đáng đổi.
- Index mới cho membership: `(user_id)` đã có.
- HNSW/IVFFlat mới: chất lượng top-k có filter workspace chưa đạt yêu cầu.

### Chi phí ghi của hai index được giữ

Đo 100.000 INSERT trong một transaction rồi `ROLLBACK`, ba lần và lấy trung vị:

| Workload | Cấu hình ban đầu | Sau index được giữ | Chi phí tăng |
|---|---:|---:|---:|
| 100.000 `audit_logs` | 1,743 giây | 1,937 giây | 0,194 giây (+11,1%) |
| 100.000 `notifications` | 1,608 giây | 1,821 giây | 0,214 giây (+13,3%) |
| Tổng hai workload giả lập | 3,351 giây | 3,758 giây | 0,407 giây (+12,2%) |

Hai index được giữ tác động lên hai bảng khác nhau; dòng tổng chỉ là tổng của hai
workload 100.000 dòng để thấy ngân sách ghi, không phải một transaction ứng dụng
thực tế. Index entity/action bị loại từng làm riêng workload audit tăng thêm
0,388 giây so với cấu hình đã có actor index.

## Vector: tốc độ và recall@10

Kết quả với 10.000 vector 1536 chiều, 1.000 vector/workspace. Dữ liệu benchmark
dùng vector ngẫu nhiên; recall bên dưới chỉ mô tả bộ dữ liệu giả này và không đại
diện cho recall của embedding thật vốn thường có cấu trúc cụm:

| Biến thể | Trung vị (ms) | Kết quả trả về | recall@10 |
|---|---:|---:|---:|
| Exact, ép sequential | 9,479 | 10 | 100% |
| B-tree workspace + exact (planner mặc định) | 8,407 | 10 | 100% |
| IVFFlat tạo khi bảng rỗng, probes=1 | 0,960 | 10 | 10% |
| IVFFlat tạo khi bảng rỗng, probes=10 | 3,597 | 10 | 10% |
| IVFFlat tạo lại sau seed, probes=1 | 0,977 | 9 | 10% |
| IVFFlat tạo lại, probes=10 | 2,371 | 10 | 40% |
| HNSW, ef_search=40 | 3,840 | 9 | 50% |
| HNSW, ef_search=100 | 6,761 | 10 | 70% |

Nguyên nhân chính là ANN tìm ứng viên toàn bảng rồi mới hậu lọc `workspace_id`.
Planner mặc định đúng khi chọn B-tree workspace và exact search: nhanh hơn exact
toàn bảng, trả đủ 10 và recall 100%. Kiểm tra riêng index IVFFlat cũ
`idx_embeddings_vector` cho thấy planner không chọn nó khi truy vấn có bộ lọc
workspace; top-10 mặc định trùng exact 10/10 cả ID, thứ tự và khoảng cách. Vì vậy
migration không thêm HNSW và không thay IVFFlat.

Thời gian exact được **ước lượng** tăng gần tuyến tính theo số vector trong một
workspace; đây không phải cam kết production. Đo lại chiến lược ANN/partition khi
một workspace vượt khoảng 10.000 vector hoặc khi truy vấn exact vượt 50 ms.

## Chi phí RLS và thử nghiệm rollback

Policy hiện tại gọi `is_workspace_member(...)` hoặc `has_workspace_role(...)`
theo từng dòng; `auth.uid()` cũng chưa được bọc `(select auth.uid())`. Chênh lệch
superuser/authenticated trước tối ưu rõ nhất:

- Audit actor: 0,174 → 179,315 ms.
- Notifications unread: 1,408 → 12,926 ms.
- Notifications latest: 1,619 → 13,525 ms.
- Campaign aggregate: 7,493 → 93,931 ms.

Thử policy dạng tập hợp trong transaction rồi `ROLLBACK` cho workspace lớn:

| Truy vấn | Policy hiện tại (ms) | Dạng tập hợp thử (ms) |
|---|---:|---:|
| Audit actor (sau index) | 4,180 | 0,262 |
| Notifications unread | 13,572 | 2,822 |
| Notifications latest | 0,590 | 0,311 |
| Campaign aggregate | 98,234 | 14,910 |

Không có policy nào được thay đổi. Trước khi áp dụng cần Tri và Minh xác nhận
ngữ nghĩa quyền, đặc biệt audit chỉ Admin đọc, quyền Admin/Manager khi sửa/xóa,
và privacy đa-workspace từ migration `20261016...`.

## Khảo sát schema và truy vấn ứng dụng

- Index ban đầu đã có cho audit workspace/time, notifications user/read,
  campaign workspace/date, workspace membership user và IVFFlat vector.
- `campaign_performance` thực tế có thêm clicks, conversions, revenue,
  import batch/source metadata và created_by.
- Frontend thực sự lấy campaign theo workspace, sắp record_date giảm dần,
  limit 200. Supabase RPC thực sự tìm vector top-k theo workspace. UI audit và
  notification chưa có truy vấn hoàn chỉnh, nên các mẫu lọc/thời gian/count là
  giả định theo yêu cầu màn hình.
- Foreign key chưa có index dẫn đầu: `workspaces.owner_id`,
  `strategies.business_profile_id`, `strategies.created_by`,
  `ad_contents.strategy_id`, `ad_contents.created_by`, `approvals.reviewer_id`,
  `audit_logs.actor_id`, `competitor_insights.created_by`,
  `reports.requested_by`. `campaign_performance.created_by` có partial index cho
  giá trị non-null nên vẫn hỗ trợ FK thực tế. Cả 9 khóa ngoại được chốt là
  **“đã xem xét, chưa thêm”**: thao tác xóa dòng cha hiện hiếm, phần lớn bảng liên quan còn
  nhỏ, và index bổ sung sẽ làm tăng chi phí ghi. Nếu sau này có chức năng xóa tài
  khoản, phải đo lại riêng `audit_logs.actor_id` và `workspaces.owner_id` trước
  khi phát hành.

## NFR01 và giới hạn

NFR01 trong README đặt mục tiêu phản hồi không quá 5 giây. Ở 200k audit, 100k
notification, 300k campaign và 10k vector, các truy vấn mẫu đều dưới 100 ms sau
index, thấp hơn nhiều so với ngưỡng đó. Đây là bằng chứng local, không phải cam
kết production: máy, cache, concurrency, network, tenant skew và dữ liệu thật
sẽ khác. Migration có ghi chú dùng `CREATE INDEX CONCURRENTLY` ngoài transaction
khi bảng production đã lớn.

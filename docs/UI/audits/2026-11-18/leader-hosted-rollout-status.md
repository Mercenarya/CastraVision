# Kết quả triển khai Leader hosted — 18/11/2026

Project: `oviqgptccjjdaaqxabwv`. Đã triển khai cả bốn migration được duyệt trong **một transaction thành công**. Không commit/push, không sửa `.env`, không reset hosted hoặc chạy lại migration cũ.

## Kết quả cutover

- Version mới: `20261118090000`, `20261118091000`, `20261118092000`, `20261118103827`; ledger tăng từ 6 lên 10, giữ nguyên sáu entry cũ. Nội dung SQL từng migration được ghi vào ledger cùng transaction.
- Trước ghi: tạo backup mới tại `C:\Users\Admin\Documents\CastraVision-backups\leader-cutover-20261118-180713`. Schema/data vẫn lần lượt 130.246/67.025 byte. Catalog, function, constraint, policy, enum và số bản ghi khớp bản backup đã phục hồi thử. SHA-256 backup được kiểm tra trước triển khai; hash nguồn migration ghi trong manifest triển khai riêng.
- Dừng backend/frontend trên máy trước cutover. Transaction có advisory lock, lock timeout 5 giây, statement timeout 120 giây, kiểm tra ledger đầu vào và khóa các bảng liên quan trong lúc đổi schema.
- Kiểm tra trước COMMIT: số dòng của 12 bảng hiện có không đổi; membership, role và owner workspace không đổi; đủ RPC, RLS/grants, năm audit trigger, immutable guard và audit actor policy restrictive. Nếu một điều kiện lỗi, transaction sẽ không COMMIT.
- Postflight hosted: 6 workspace, 18 membership, 4 audit log, 0 campaign và 0 revision; cả hai bảng mới bật RLS. `authenticated` gọi được RPC nhưng không ghi trực tiếp bảng mới; `anon` không gọi được RPC. Quyền SELECT audit vẫn giữ, client không có INSERT/UPDATE/DELETE/TRUNCATE và service role không có UPDATE/DELETE/TRUNCATE.
- Kiểm tra bằng `authenticated` và JWT giả lập của Leader demo trên hosted: 6 lệnh đọc PASS; Leader không đọc audit; workspace khác và Team chưa được phân công bị từ chối. Transaction kiểm tra kết thúc bằng ROLLBACK, không tạo dữ liệu nghiệp vụ bền vững.
- Đã khởi động backend `127.0.0.1:8000 --noreload` và frontend `127.0.0.1:5173` từ worktree `.tmp/publish-dat`, cấu hình đúng hosted chỉ truyền trong bộ nhớ tiến trình. Health/backend và frontend HTTP 200. Trang đăng nhập render trong trình duyệt, không có Vite error overlay.
- Chạy lại frontend lint và build: PASS; còn warning cũ Fast Refresh/unused import và chunk trên 500 KB. `git diff --check` PASS.

## Smoke HTTP với Supabase thật

Dùng ba tài khoản demo đã có, credential chỉ đọc vào bộ nhớ từ file riêng ngoài repo. Không tạo/reset mật khẩu hoặc gửi email; session kiểm thử được logout sau cùng.

| Vai trò | Đăng nhập / Django session | 7 API đọc workflow | Refresh token / session sau refresh | Team |
| --- | --- | --- | --- | --- |
| Leader | 200 / 200 | 7/7 HTTP 200 | 200 / 200 | 0 |
| Marketing Manager | 200 / 200 | 7/7 HTTP 200 | 200 / 200 | 0 |
| Employee | 200 / 200 | 7/7 HTTP 200 | 200 / 200 | 0 |

Bảy API gồm context, campaigns, proposals, notifications, imports, analytics và profile, gọi qua frontend proxy → Django → Supabase bằng Bearer token của từng user. Request không đăng nhập nhận HTTP 401. Ba tài khoản demo chưa có Team trong workspace của chúng; kết quả rỗng là dữ liệu thật. Cần Marketing Manager tạo/phân Team trước khi dùng chức năng tạo campaign và gửi đề xuất.

Smoke này xác nhận đăng nhập, xác định role, đọc dữ liệu và refresh session trên hosted; không phải kiểm thử ghi toàn bộ workflow trên hosted. Không đưa token, mật khẩu, dữ liệu cá nhân hoặc backup vào repository.

## Security Advisor sau triển khai

Chạy CLI pinned `db advisors --linked --project-ref ... --type security`: **0 ERROR, 37 WARN**. Chi tiết riêng được lưu ngoài repo cùng backup; không coi exit 0 là không còn cảnh báo.

- 1 cảnh báo extension trong public (vector của baseline).
- 7 cảnh báo `anon` có EXECUTE các hàm nền: `has_workspace_role`, `is_workspace_member`, `match_strategy_context`, `protect_workspace_admin`, `rls_auto_enable`, `validate_workspace_reference`, `workspace_role`. RPC Leader mới không nằm trong danh sách anon; không tự thay grant của các hàm ngoài phạm vi bốn migration.
- 28 cảnh báo EXECUTE hàm SECURITY DEFINER của `authenticated`; đây là tín hiệu cần review từng hàm, không tự chứng minh bị vượt quyền. Với Leader đã xác nhận auth.uid, workspace/Team, chống truy cập chéo và grants như các bước trên.
- 1 cảnh báo leaked-password protection của Supabase Auth chưa bật. Không tự đổi cấu hình Auth trong cutover.

Các cảnh báo này còn tồn tại sau triển khai; báo cáo không khẳng định toàn project đã được hardening hoàn chỉnh.

## Backup đã tạo và phục hồi thử

Lưu ngoài repository tại:

`C:\Users\Admin\Documents\CastraVision-backups\leader-cutover-20261118-173206`

- `schema.sql`: 130.246 byte, schema public/membership_private và migration ledger.
- `data.sql`: 67.025 byte, dữ liệu public và migration ledger, dùng COPY.
- `manifest.json`: kích thước và SHA-256; các snapshot catalog/constraint/policy/function đi kèm ở cùng thư mục bảo vệ.
- Không xuất dữ liệu schema Auth hoặc đọc mật khẩu người dùng. Không đưa backup vào Git.
- Đã phục hồi thành công vào DB tạm trong container `CastraVision-leader-test`: 6 workspace, 18 membership, 4 audit log. Không phục hồi đè lên DB đang dùng.
- Rehearsal dùng Auth stub/fixture riêng để đáp ứng FK và giả lập JWT trong SQL test; không sao chép tài khoản/mật khẩu Auth thật và không gọi email.

## Lệch baseline đã xác nhận

Hosted chỉ có 6 entry migration: 4 migration ban đầu và 2 migration membership ngày 17/11. Không suy từ số entry rằng mọi migration còn lại đều cần chạy lại.

Các prerequisite liên quan trực tiếp tới workflow mới đang thiếu/sai:

1. `validate_workspace_reference()` là bản cũ; sau ba migration Leader, test trên bản sao hosted lỗi `record "new" has no field "business_profile_id"` khi gửi nội dung.
2. Chưa có 5 audit trigger nghiệp vụ, chưa có trigger chống sửa/xóa audit log và chưa thu hồi các quyền mutation như bản local.
3. Policy audit cũ chỉ dựa trên workspace role. Trên bản sao hosted, test chứng minh platform actor còn membership admin cũ và user chưa xác thực vẫn đọc được audit doanh nghiệp. Policy restrictive dựa trên `membership_private.valid_actor()` chặn hai trường hợp đó và vẫn giữ quyền Marketing Manager hợp lệ.

## Migration bổ sung đã được duyệt

`20261118103827_leader_hosted_baseline_compatibility.sql`

- Sửa riêng validator theo bảng, thay vì tham chiếu cột không có trên record của bảng khác.
- Bổ sung hàm/trigger FR11 và immutable audit guard từ implementation đã kiểm thử trong repo.
- Thu hồi INSERT audit của client và UPDATE/DELETE/TRUNCATE, giữ service append và quyền SELECT hiện có với điều kiện actor restrictive bổ sung.
- Không đổi role enum, không cấp Team, không backfill/xóa/sửa dữ liệu lịch sử hoặc Auth.
- Là version migration mới; không chạy lại hay đánh dấu các version cũ chưa áp dụng là đã thành công.

Đã triển khai **cả 4 migration** trong cùng transaction sau khi migration bổ sung và ngoại lệ backend/Supabase được duyệt. Ba migration ban đầu không đủ để workflow chạy trên baseline hosted ban đầu. Phần phát hiện baseline và phục hồi thử bên trên là bằng chứng trước cutover.

## Kiểm chứng

- Bản sao từ backup hosted: 57 assertion Leader PASS sau compatibility migration.
- Bổ sung 4 assertion audit actor: Marketing Manager hợp lệ đọc được; platform actor và unconfirmed actor không đọc được; policy mới là restrictive. Cả 4 PASS trên bản sao hosted; trước sửa có 3 assertion FAIL.
- Full SQL suite trên stack local sạch với migration thứ tư: 13 file, **236/236 PASS trước và sau reset**.
- Gitleaks trên 53 file working changes: 0 phát hiện; `git diff --check` PASS. Không quét/đưa backup riêng tư vào source.
- Frontend lint/build: PASS, warning cũ không thay đổi.
- Chưa thực hiện luồng ghi nghiệp vụ thành công bằng HTTP trên hosted. Luồng tạo/gửi/duyệt/import đã kiểm thử trên stack local và bản sao hosted; không diễn đạt kết quả đó thành kiểm thử ghi end-to-end trên project thật.

Không tự phân Team cho tài khoản hoặc đổi quyền khi cutover. Leader chưa được Marketing Manager phân Team sẽ thấy trạng thái chưa có Team và không tạo campaign được; đây là điều kiện phân quyền, không dùng fixture để che trạng thái đó. Chưa xác minh gọi nhà cung cấp LLM trả phí hoặc thao tác với mạng quảng cáo; pause/budget hiện là quy trình duyệt nội bộ.

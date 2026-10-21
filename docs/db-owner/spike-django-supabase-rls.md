# SCRUM-152 — Django chuyển tiếp Supabase JWT và RLS

Ngày kiểm chứng local: 21/10/2026. Không chạy chế độ hosted, không ghi vào
project Supabase thật và không lưu token/key vào file.

## Kết quả

| Kiểm tra | Môi trường | Kết quả | Ghi chú |
|---|---|---|---|
| Token local và JWKS | Local | PASS | Access token dùng ES256, có `kid`; JWKS local có 1 khóa |
| `authentication.py` xác minh token | Local | PASS | Xác minh được ES256 sau khi token đạt thời điểm `iat` |
| A ghi workspace A qua Django | Local | PASS | `POST /api/campaign-imports/sandbox/` trả 201 |
| B ghi workspace A qua Django | Local | PASS | Trả 403 tại bước kiểm tra membership |
| Thiếu Authorization | Local | PASS | Trả 401 |
| Token rác | Local | PASS | Trả 401 |
| Token bị sửa chữ ký | Local | PASS | Trả 401 |
| `workspace_role`: A/A, A/B, B/A | Local | PASS | Lần lượt `admin`, `null`, `null` |
| RLS đọc `workspaces` | Local | PASS | A và B chỉ thấy workspace của mình |
| 40 request xen kẽ A/B | Local | PASS | Không có response lộ workspace chéo |
| Đối chứng service-role | Local | PASS | Thấy cả hai workspace; chứng minh service-role bỏ qua RLS |
| Dọn fixture | Local | PASS | Còn 0 user và 0 workspace có tiền tố spike |
| Django GET dữ liệu theo workspace | Local | CHƯA CÓ | Repo không có endpoint phù hợp; spike không được thêm route |
| Member bị cấm endpoint ghi | Local | KHÔNG ÁP DỤNG | Endpoint ghi hiện có cho cả Admin/Manager/Member |
| Bộ kiểm tra chỉ đọc `--hosted` | Hosted | CHƯA CHẠY | Dat tự chạy với hai token và hai workspace thật |

## JWT và cấu hình xác thực

Token local quan sát được dùng `alg=ES256`, có `kid`, issuer
`http://127.0.0.1:54321/auth/v1`, audience/role `authenticated`. JWKS local trả
về một khóa. `authentication.py` cho phép `ES256`, `RS256`, `HS256` thông qua
`SUPABASE_JWT_ALGORITHMS`. ES256/RS256 dùng `SUPABASE_JWKS_URL` và kiểm tra
`iss`, `aud`, `exp`, `iat`, `sub`; HS256 được xác minh gián tiếp bằng
`GET /auth/v1/user` với `SUPABASE_PUBLISHABLE_KEY`.

JWKS công khai của project thật trả HTTP 200 với 1 khóa EC/ES256, `kid`
`67defd28-b875-42e2-9d47-376e8dd2d708`. Điều này tương thích về thuật toán với
code hiện tại. Kết luận chắc chắn vẫn cần Dat chạy `inspect_jwt.py` với access
token thật để đối chiếu `alg` và `kid`; không suy ra từ JWKS đơn thuần.

Biến cấu hình liên quan: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_JWT_ISSUER`, `SUPABASE_JWKS_URL`, `SUPABASE_JWT_AUDIENCE`,
`SUPABASE_JWT_ALGORITHMS`, `SUPABASE_JWKS_CACHE_SECONDS` và
`SUPABASE_HTTP_TIMEOUT_SECONDS`. `load_dotenv()` không dùng `override=True`, nên
biến môi trường được đặt cho tiến trình local không bị `.env` ghi đè.

## Đánh giá code hiện tại

`SupabaseDataClient` tạo instance riêng cho từng token, không dùng singleton hay
`lru_cache`. Header nằm trên instance, được sao chép trước mỗi request và không
có code log token/Authorization. Mỗi request có timeout. Kết quả 40 request dùng
chung hai instance cho thấy không có rò dữ liệu. Điểm có thể nâng cấp là dùng
`httpx.Client` có connection pooling; hiện mỗi lần gọi dùng `httpx.request` mới.

Endpoint Django đã kiểm chứng là endpoint ghi campaign sandbox. Nó dùng
`require_workspace_member`, nên cả ba role đều được phép. Repo hiện không có
endpoint GET dữ liệu workspace qua luồng Bearer JWT để kiểm chứng phía Django;
phần đọc được kiểm chứng trực tiếp qua chính `SupabaseDataClient` hiện có.

Phiên bản cuối của `workspace_role(ws_id uuid)` trả role của `auth.uid()` trong
workspace hoặc `null`. `create_workspace_with_admin(workspace_name text)` tạo
profile, workspace và membership Admin nguyên tử, nhưng vẫn báo
`ALREADY_ONBOARDED` nếu user đã thuộc bất kỳ workspace nào. Vì vậy RPC này là
onboarding lần đầu, chưa phải API tạo nhiều workspace cho một Admin.

## Điểm yếu phát hiện nhưng chưa sửa

1. Docker Auth local nhanh hơn đồng hồ Windows khoảng 7–8 giây. PyJWT không có
   `leeway`, nên token vừa phát hành có thể tạm thời bị 401 với
   `ImmatureSignatureError`. Spike chờ tới `iat` để loại nhiễu. Production nên
   đồng bộ NTP; nhóm có thể cân nhắc một leeway nhỏ có chủ đích và có test.
2. Thiếu endpoint GET workspace-scoped ở Django nên chưa thể chứng minh đường
   đọc end-to-end qua Django, dù RLS/Data API đã được kiểm chứng thật.
3. `settings.py` khai báo lại một số biến Supabase ở hai vị trí. Giá trị vẫn lấy
   từ cùng biến môi trường, nhưng cấu hình trùng dễ lệch trong lần sửa sau.
4. `create_workspace_with_admin` chưa hỗ trợ use case Admin quản lý nhiều
   workspace. Cần một RPC riêng với policy/quyền rõ ràng, không nên nới lỏng RPC
   onboarding hiện tại mà chưa thống nhất nghiệp vụ.

## Trao đổi với nhóm

- Phuc: middleware Bearer JWT hiện đã hoạt động với ES256; cần lưu ý clock skew,
  thiếu GET endpoint và tránh đưa service-role vào request người dùng.
- Minh: các thao tác dữ liệu phải tiếp tục dùng `user_client(context.access_token)`;
  service-role chỉ dành cho job quản trị tin cậy. Xác nhận endpoint import cho
  phép Member là chủ ý nghiệp vụ.

Câu hỏi còn mở: Django có thực sự cần một endpoint GET dữ liệu workspace hay
frontend sẽ đọc hoàn toàn qua Supabase Data API; và luồng nào sẽ tạo workspace
thứ hai cho Admin mà không làm suy yếu onboarding/RLS?

## Lệnh tự kiểm tra project thật (PowerShell)

Chỉ đặt token/key trong biến môi trường của phiên PowerShell, không ghi vào
`.env` hoặc history dùng chung.

```powershell
$env:TOKEN_TO_INSPECT = '<SUPABASE_ACCESS_TOKEN_THAT>'
.\.venv\Scripts\python.exe scripts\spike\inspect_jwt.py
Remove-Item Env:TOKEN_TO_INSPECT
```

```powershell
$env:SUPABASE_URL = 'https://oviqgptccjjdaaqxabwv.supabase.co'
$env:SUPABASE_PUBLISHABLE_KEY = '<PUBLISHABLE_KEY>'
$env:SPIKE_TOKEN_A = '<ACCESS_TOKEN_A>'
$env:SPIKE_TOKEN_B = '<ACCESS_TOKEN_B>'
$env:SPIKE_WORKSPACE_A = '<WORKSPACE_UUID_A>'
$env:SPIKE_WORKSPACE_B = '<WORKSPACE_UUID_B>'
.\.venv\Scripts\python.exe scripts\spike\run_rls_spike.py --hosted
Remove-Item Env:SUPABASE_URL, Env:SUPABASE_PUBLISHABLE_KEY, Env:SPIKE_TOKEN_A, Env:SPIKE_TOKEN_B, Env:SPIKE_WORKSPACE_A, Env:SPIKE_WORKSPACE_B
```

Chế độ hosted chỉ đọc dữ liệu và kiểm tra 401; không tạo user, không ghi dữ liệu
và không dùng service-role.

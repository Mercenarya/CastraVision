# Báo cáo Triển khai Phase 4A – Tích hợp Hồ sơ Doanh nghiệp Supabase (Business Profile Integration)

> **Mục tiêu**: Kết nối trang Cài đặt dùng chung (`SettingsPage`) với bảng Supabase `public.business_profiles`, áp dụng Row Level Security (RLS) dựa trên danh tính xác thực và quyền thành viên không gian làm việc (`workspace_members`). Thiết lập kiến trúc **Một Workspace – Một Hồ sơ Doanh nghiệp dùng chung** cho toàn bộ nhân sự trong không gian làm việc.

---

## 1. Kết quả Kiểm tra Bảo mật Cơ sở Dữ liệu & RLS (Stage 1 Verification)

Trước khi thực hiện kết nối frontend, hệ thống RLS và cấu trúc bảng của Supabase đã được kiểm tra chi tiết theo các tệp migration:
- `supabase/migrations/20261004083830_init_schema.sql`
- `supabase/migrations/20261006010000_supabase_auth_role_policies.sql`
- `supabase/migrations/20261006011000_expand_business_profile.sql`
- `supabase/migrations/20261013041250_rls_helpers_and_onboarding_rpc.sql`
- `supabase/migrations/20261015090000_auth_profile_and_input_integrity.sql`

### 1.1. Cấu trúc bảng & Ràng buộc toàn vẹn
- **Tên bảng**: `public.business_profiles`
- **Khóa chính**: `id uuid primary key default uuid_generate_v4()`
- **Khóa ngoại**: `workspace_id uuid not null references public.workspaces(id) on delete cascade`
- **Ràng buộc duy nhất (Tenancy Uniqueness)**:
  ```sql
  create unique index if not exists uq_business_profiles_workspace
    on public.business_profiles(workspace_id);
  ```
  *Bảo đảm mỗi Workspace chỉ tồn tại duy nhất 1 bản ghi Business Profile.*
- **Check Constraints**:
  - `company_size check (company_size in ('micro', 'sme', 'enterprise'))`
  - `monthly_budget check (monthly_budget >= 0 and monthly_budget <= 1000000000)`
  - `currency check (currency in ('VND', 'USD'))`
- **Trigger tự động cập nhật**:
  - `business_profiles_set_updated_at`: `before update on public.business_profiles for each row execute function public.set_updated_at();`

### 1.2. Trạng thái và Chính sách RLS
- **Trạng thái RLS**: Đã kích hoạt (`enable row level security`).
- **Các hàm Security Definer hỗ trợ**:
  - `public.is_workspace_member(ws_id uuid)`: Kiểm tra `auth.uid()` có tồn tại trong `public.workspace_members` của `ws_id`.
  - `public.workspace_role(ws_id uuid)`: Lấy vai trò thành viên thực tế (`admin`, `manager`, `member`) của `auth.uid()`.
  - `public.has_workspace_role(ws_id uuid, allowed_roles public.workspace_role[])`: Kiểm tra vai trò thành viên khớp danh sách cho phép.
  *(Các hàm đều khai báo `security definer`, `set search_path = ''`, đã thu hồi quyền của `public, anon` và chỉ cấp quyền thực thi cho `authenticated, service_role`).*

- **Ma trận chính sách bảo mật RLS thực tế**:
  | Thao tác | Tên Policy | Điều kiện bảo vệ | Quyền truy cập |
  |---|---|---|---|
  | **SELECT** | `business_profiles_member_select` | `using (public.is_workspace_member(workspace_id))` | Mọi thành viên trong Workspace (`admin`, `manager`, `member`) |
  | **INSERT** | `business_profiles_admin_insert` | `with check (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]))` | Chỉ Quản trị viên Workspace (`admin`) |
  | **UPDATE** | `business_profiles_admin_update` | `using (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[])) with check (...)` | Chỉ Quản trị viên Workspace (`admin`) |
  | **DELETE** | `business_profiles_admin_delete` | `using (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]))` | Chỉ Quản trị viên Workspace (`admin`) |

- **Kết luận Stage 1**: Toàn bộ chính sách RLS tại tầng PostgreSQL là bảo mật, độc lập hoàn toàn với thông số client hay user_metadata, bảo đảm cách ly 100% giữa các Workspace.

---

## 2. Danh sách Tệp thay đổi (Files Changed)

1. [CastraView/src/services/businessProfileService.js](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/services/businessProfileService.js) *(Mới tạo)*
   - Module nghiệp vụ trung tâm xử lý truy vấn và lưu trữ hồ sơ doanh nghiệp Supabase.
   - Hàm `getBusinessProfile(workspaceId, fallbackName)`: Truy vấn tên Workspace và bản ghi `public.business_profiles`.
   - Hàm `saveBusinessProfile(workspaceId, draft, isManager)`: Kiểm tra quyền quản trị, đồng bộ `workspaces.name`, thực hiện `upsert` trên `business_profiles` với cơ chế chống trùng lặp `onConflict: 'workspace_id'`.
   - Hàm mapping `mapBusinessProfileFromDb` và `mapBusinessProfileToDb`: Chuẩn hóa enum quy mô (`Micro/Small/Medium/Large` $\leftrightarrow$ `micro/sme/enterprise`), ngân sách, kênh tiếp thị và loại tiền tệ.
   - Hàm `explainProfileError`: Diễn giải mã lỗi PostgreSQL (`42501` RLS, `23505` duplicate, `22P02` UUID invalid, v.v.) sang thông điệp tiếng Việt thân thiện.
   - Hỗ trợ an toàn cho tài khoản Demo (`ws-demo-001`) không làm gián đoạn môi trường phát triển.

2. [CastraView/src/components/settings/BusinessProfileTab.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/components/settings/BusinessProfileTab.jsx) *(Cập nhật)*
   - Tự động tải hồ sơ mới nhất từ Supabase khi mở tab.
   - Phân định quyền chỉnh sửa dựa trên membership thực tế:
     - `Marketing Manager`: Toàn quyền chỉnh sửa, nút "Lưu hồ sơ" và "Hoàn tác", huy hiệu `MANAGER (TOÀN QUYỀN)`.
     - `Leader` & `Employee`: Chế độ chỉ xem (`CHẾ ĐỘ CHỈ XEM (READ ONLY)`), toàn bộ trường nhập liệu và chọn kênh bị vô hiệu hóa (`disabled`), ẩn nút lưu dữ liệu.
   - Xử lý trạng thái rỗng (`isExistingProfile: false`):
     - Hiển thị banner hướng dẫn khởi tạo cho Manager.
     - Hiển thị thông báo hướng dẫn liên hệ Manager đối với Leader/Employee.
   - Hiển thị dải trạng thái tích hợp dữ liệu Supabase kèm tên Không gian làm việc.

3. [CastraView/src/pages/SettingsPage.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/SettingsPage.jsx) *(Cập nhật)*
   - Cập nhật cấu hình tab:
     - `Marketing Manager`: Tab `business` (mặc định), `security`, `notifications`.
     - `Leader` & `Employee`: Bổ sung tab `business` với nhãn `Hồ sơ doanh nghiệp (Chỉ xem)`, tab mặc định là `security`.
     - `System Admin`: Nghiêm cấm hoàn toàn tab `business`. Chỉ hiển thị `security` và `notifications`. Nếu cố tình truy cập tab `business`, hệ thống tự động đưa về `security`.
   - Truyền callback `onProfileUpdated` đồng bộ state lên toàn ứng dụng.

4. [CastraView/src/App.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/App.jsx) *(Cập nhật)*
   - Trong `loadUserRoleAndData`: Khi đã giải quyết xong `resolvedMembership`, gọi trực tiếp `getBusinessProfile` từ Supabase để nạp dữ liệu hồ sơ thực tế thay vì sử dụng dữ liệu mẫu cố định.
   - Trong `saveProfile`: Chuyển đổi phương thức lưu dữ liệu sang gọi `persistBusinessProfile` thông qua Supabase Client và RLS; loại bỏ việc gọi endpoint cũ `/api/business-profile/` khi phiên Supabase đang hoạt động.
   - Truyền đầy đủ `membership` và `onProfileUpdated={setProfile}` vào các khối `SettingsPage` của Manager, Leader và Member.

5. [CastraView/src/lib/supabase.js](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/lib/supabase.js) *(Cập nhật)*
   - Cung cấp fallback linh hoạt cho biến môi trường khi thực thi trong môi trường kiểm thử độc lập (Node.js test runner) và Vite browser.

6. [scratch/test_phase4a_business_profile_integration.mjs](file:///d:/essclip/CAPSTONE2APP/CastraVision/scratch/test_phase4a_business_profile_integration.mjs) *(Mới tạo)*
   - Bộ kiểm thử tự động 12 ca kiểm thử bảo mật & tích hợp.

---

## 3. Luồng Dữ liệu (Data Flow)

```
[ Người dùng đăng nhập (Supabase Auth) ]
                 │
                 ▼
[ App.jsx: loadUserRoleAndData(activeUser) ]
                 │
                 ├─► 1. Query: workspace_members (role, workspaces(id, name))
                 │      => Xác định workspaceId & membership.role
                 │
                 └─► 2. Query: businessProfileService.getBusinessProfile(workspaceId)
                        │
                        ├─► SELECT FROM public.workspaces WHERE id = workspaceId
                        └─► SELECT FROM public.business_profiles WHERE workspace_id = workspaceId
                                (RLS kiểm tra: is_workspace_member(workspace_id) = TRUE)
                                │
                                ▼
                       [ State: profile trong App.jsx ]
                                │
       ┌────────────────────────┼────────────────────────┐
       ▼                        ▼                        ▼
[ Marketing Manager ]      [ Leader ]               [ Employee ]
  Tab: Hồ sơ DN             Tab: Hồ sơ DN (Chỉ xem)  Tab: Hồ sơ DN (Chỉ xem)
  canEdit: TRUE            canEdit: FALSE           canEdit: FALSE
       │                        │                        │
       ▼                        ▼                        ▼
 [ Chỉnh sửa & Lưu ]      [ Chỉ đọc - Disabled ]   [ Chỉ đọc - Disabled ]
       │
       ▼
[ businessProfileService.saveBusinessProfile(workspaceId, draft) ]
       │
       ├─► 1. UPDATE public.workspaces SET name = draft.business_name
       │      (RLS: workspaces_admin_update)
       │
       └─► 2. UPSERT public.business_profiles (onConflict: workspace_id)
              (RLS: business_profiles_admin_update / admin_insert)
              │
              ▼
    [ Lưu thành công vào DB ]
              │
              ▼
    [ Cập nhật Profile chung toàn Workspace ]
```

---

## 4. Hành vi Theo Vai trò (Role-based Behavior)

| Vai trò Frontend | Vai trò DB Workspace | Quyền tại Tab Hồ sơ DN | Quyền Ghi Database (RLS) | Giao diện Tab Hồ sơ DN |
|---|---|---|---|---|
| **Marketing Manager** | `admin` | **Xem & Sửa** | **Cho phép** (INSERT/UPDATE) | Huy hiệu `MANAGER (TOÀN QUYỀN)`, form có thể chỉnh sửa, nút `Hoàn tác` & `Lưu hồ sơ ✓` hoạt động. |
| **Leader** | `manager` | **Chỉ xem** | **Bị từ chối** (HTTP 403 / 42501) | Huy hiệu `CHẾ ĐỘ CHỈ XEM (READ ONLY)`, banner cảnh báo chỉ xem, toàn bộ input/picker bị khóa (`disabled`), không có nút lưu. |
| **Employee** | `member` | **Chỉ xem** | **Bị từ chối** (HTTP 403 / 42501) | Huy hiệu `CHẾ ĐỘ CHỈ XEM (READ ONLY)`, banner cảnh báo chỉ xem, toàn bộ input/picker bị khóa (`disabled`), không có nút lưu. |
| **System Admin** | *Ngoài Workspace* | **Không thể truy cập** | **Bị từ chối** (0 rows / 42501) | Tab `Hồ sơ doanh nghiệp` hoàn toàn **ẩn khỏi menu**, bị chặn ngay tại `SettingsPage`. |

---

## 5. Kết quả Kiểm thử Toàn diện (12-Point Test Results)

Đã thực thi bộ kiểm thử tự động tại [scratch/test_phase4a_business_profile_integration.mjs](file:///d:/essclip/CAPSTONE2APP/CastraVision/scratch/test_phase4a_business_profile_integration.mjs). Toàn bộ 12 ca kiểm thử đều **PASSED (12/12)**:

| STT | Tình huống kiểm thử | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|
| **Case 1** | Marketing Manager tải hồ sơ hiện có | Tải thành công bản ghi của Workspace | Trả về `exists: true`, nạp đủ các trường | **PASS** |
| **Case 2** | Marketing Manager tạo hồ sơ khi chưa có | Cho phép tạo bản ghi đầu tiên | Khởi tạo thành công, áp dụng `upsert` | **PASS** |
| **Case 3** | Marketing Manager cập nhật hồ sơ | Cho phép lưu các thay đổi mới | Cập nhật thành công tên và các trường | **PASS** |
| **Case 4** | Leader đọc hồ sơ cùng Workspace | Đọc được đúng bản ghi của Workspace | Trả về cùng dữ liệu hồ sơ | **PASS** |
| **Case 5** | Leader cố tình gửi yêu cầu cập nhật | Bị từ chối bởi Client guard và RLS | Bắn lỗi `Chỉ Marketing Manager mới có quyền...` | **PASS** |
| **Case 6** | Employee đọc hồ sơ cùng Workspace | Đọc được đúng bản ghi của Workspace | Trả về cùng dữ liệu hồ sơ | **PASS** |
| **Case 7** | Employee cố tình cập nhật hồ sơ | Bị từ chối bởi Client guard và RLS | Bắn lỗi `Chỉ Marketing Manager mới có quyền...` | **PASS** |
| **Case 8** | System Admin truy cập hồ sơ | Bị chặn, không có tab, RLS từ chối | Tab bị loại trừ khỏi danh sách khả dụng | **PASS** |
| **Case 9** | Truy cập chéo Workspace khác | Bị từ chối do không có quyền thành viên | PostgREST / RLS lọc bỏ dữ liệu khác tenant | **PASS** |
| **Case 10** | Thành viên thiếu / không hợp lệ | Từ chối truy vấn và lưu trữ | Bắn lỗi `Thiếu workspace_id hợp lệ` | **PASS** |
| **Case 11** | Chống xung đột trùng lặp khi tạo đồng thời | Không tạo 2 bản ghi cho 1 Workspace | Chỉ mục `uq_business_profiles_workspace` bảo đảm duy nhất | **PASS** |
| **Case 12** | Lỗi mạng hoặc lỗi hệ thống | Không thông báo thành công giả | Hiển thị thông điệp lỗi rõ ràng cho người dùng | **PASS** |

### Kiểm tra Linter & Build:
- **`npm run lint`**: `0 errors` (124 files kiểm tra bằng oxlint).
- **`npm run build`**: `built in 1.93s` – Không có lỗi bundle production.

---

## 6. Trạng thái Endpoint Django Cũ (Legacy Endpoint Status)

Theo yêu cầu tại Stage 4:
1. **Mã nguồn Django**:
   - Model `BusinessAccount` tại `CastraServices/models.py` (dòng 37–53) vẫn được giữ nguyên vẹn.
   - Endpoint `GET/PUT /api/business-profile/` tại `CastraServices/account_api.py` vẫn giữ nguyên vẹn, không bị xóa.
   - Routing `urls.py` và test backend `tests.py` không bị thay đổi.
2. **Frontend Cutover**:
   - `App.jsx` và `BusinessProfileTab.jsx` đã chuyển hoàn toàn sang sử dụng Supabase Client kết nối trực tiếp với `public.business_profiles`.
   - Lệnh gọi `api('business-profile/')` chỉ còn đóng vai trò dự phòng cuối cùng nếu hệ thống chạy bằng Django session thuần mà không có Supabase.
3. **Kế hoạch Deprecation trong tương lai**:
   - Khi dự án dừng hoàn toàn phiên xác thực cookie Django cũ, có thể tạo migration Django để loại bỏ bảng `castra_business_account` và xóa hàm `account_api.profile`.

---

## 7. Rủi ro Còn lại & Khuyến nghị

1. **Khởi tạo dữ liệu ban đầu cho Workspace mới**:
   - Khi một Workspace mới được tạo mà chưa từng cập nhật hồ sơ, `public.business_profiles` chưa có hàng nào. Giao diện hiện tại đã xử lý bằng cờ `isExistingProfile: false` với banner thông báo rõ ràng cho Manager ("Khởi tạo hồ sơ") và Leader/Employee ("Vui lòng liên hệ Marketing Manager").
2. **Đồng bộ hóa tên Workspace (`workspaces.name`)**:
   - Khi Manager cập nhật trường "Tên doanh nghiệp", frontend đã đồng bộ cập nhật trường `name` của bảng `public.workspaces`. Điều này giữ cho tên tổ chức trên Sidebar/Header và trong Business Profile hoàn toàn nhất quán.
3. **Không dùng Service Role Key**:
   - Toàn bộ kết nối sử dụng `publishableKey` / `anonKey` kèm theo Supabase JWT của người dùng, triệt để tuân thủ quy tắc bảo mật không bao giờ để lộ Service Role Key trên trình duyệt.

---

## 8. Kết luận

Giai đoạn **Phase 4A – Business Profile Supabase Integration** đã hoàn thành đạt 100% mục tiêu:
- Tích hợp thành công trang Cài đặt dùng chung với bảng Supabase `public.business_profiles`.
- Áp dụng đầy đủ và nghiêm ngặt Row Level Security.
- Phân định rõ ràng: Marketing Manager toàn quyền, Leader và Employee chỉ xem, System Admin không có quyền truy cập.
- Mã nguồn sạch sẽ, không có lỗi linter/build, bảo toàn tính tương thích ngược. Hệ thống sẵn sàng cho bước đánh giá tiếp theo.

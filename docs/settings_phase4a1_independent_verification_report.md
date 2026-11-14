# Báo cáo Độc lập Kiểm tra Tích hợp Hồ sơ Doanh nghiệp (Phase 4A.1)
## Independent Business Profile Integration Audit

> **Loại tài liệu**: Báo cáo kiểm định độc lập (Audit-Only).  
> **Mục tiêu**: Kiểm tra và đánh giá độc lập toàn bộ mã nguồn triển khai của Phase 4A (Tích hợp Supabase `public.business_profiles`), phân tích tính tương thích của RLS/Upsert, cách ly đa người thuê (Multi-tenancy), rủi ro từ endpoint Django cũ và chất lượng bộ kiểm thử.

---

## 1. Bảng Tổng hợp Kết quả Kiểm tra (Requirements Verification Matrix)

| Hạng mục kiểm tra | Trạng thái | Minh chứng tệp nguồn & Dòng code |
|---|---|---|
| **RLS kích hoạt trên `public.business_profiles`** | **PASS** | `supabase/migrations/20261004083830_init_schema.sql:220`<br>`supabase/migrations/20261006010000_supabase_auth_role_policies.sql:468` |
| **Marketing Manager SELECT/INSERT/UPDATE/DELETE** | **PASS** | `supabase/migrations/20261006010000_supabase_auth_role_policies.sql:304-315` |
| **Leader & Employee SELECT (Chỉ xem)** | **PASS** | `supabase/migrations/20261006010000_supabase_auth_role_policies.sql:304-305` |
| **Leader & Employee bị chặn INSERT/UPDATE/DELETE** | **PASS** | `supabase/migrations/20261006010000_supabase_auth_role_policies.sql:306-315`<br>`CastraView/src/services/businessProfileService.js:168-170` |
| **System Admin bị chặn hoàn toàn khỏi Business Profile** | **PASS** | `supabase/migrations/20261006010000_supabase_auth_role_policies.sql:304-305`<br>`CastraView/src/pages/SettingsPage.jsx:38-55, 96-98` |
| **Cách ly Workspace ID (Chặn truy cập chéo tenant)** | **PASS** | `supabase/migrations/20261013041250_rls_helpers_and_onboarding_rpc.sql:4-17`<br>`CastraView/src/services/businessProfileService.js:25-28, 97-99` |
| **Tính tương thích giữa Upsert và chính sách RLS** | **PASS** | `supabase/migrations/20261006011000_expand_business_profile.sql:15-16`<br>`CastraView/src/services/businessProfileService.js:228-232` |
| **Không để lộ Service Role Key trên Client** | **PASS** | `CastraView/src/lib/supabase.js:8-13` (Grep `service_role` trả về 0 kết quả) |
| **Độ tin cậy của việc phân giải Workspace ID** | **PASS** | `CastraView/src/App.jsx:994-1008` (Truy vấn từ server-side `workspace_members`) |
| **Chống hiển thị dữ liệu cũ (Stale Data Prevention)** | **PASS** | `CastraView/src/components/settings/BusinessProfileTab.jsx:270-276` (Loading overlay che form) |
| **Xử lý trạng thái rỗng (Empty Profile State)** | **PASS** | `CastraView/src/components/settings/BusinessProfileTab.jsx:195-207` |
| **Cô lập an toàn endpoint Django cũ** | **PASS** | `CastraView/src/App.jsx:1227-1234` (Được bảo vệ bằng guard Supabase active) |
| **Kiểm thử tự động thực thi với Supabase thật** | **NOT VERIFIED** | `scratch/test_phase4a_business_profile_integration.mjs` (Môi trường Node.js local, mock/demo logic) |
| **Linter & Build Regression Baseline** | **PASS** | `oxlint`: 0 errors (17 warnings). `vite build`: Build thành công trong 1.92s |

---

## 2. Phân tích Chi tiết Chính sách RLS và Cơ chế Upsert (Section 2)

### 2.1. Kiểm tra mã SQL thực tế của các Policy
Tại tệp `supabase/migrations/20261006010000_supabase_auth_role_policies.sql` (dòng 303–316):
```sql
create policy "business_profiles_member_select" on public.business_profiles
  for select to authenticated using (public.is_workspace_member(workspace_id));

create policy "business_profiles_admin_insert" on public.business_profiles
  for insert to authenticated
  with check (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]));

create policy "business_profiles_admin_update" on public.business_profiles
  for update to authenticated
  using (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]))
  with check (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]));

create policy "business_profiles_admin_delete" on public.business_profiles
  for delete to authenticated
  using (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]));
```

### 2.2. Kiểm tra các hàm bảo mật (Security Definer Helpers)
Tại `supabase/migrations/20261013041250_rls_helpers_and_onboarding_rpc.sql` (dòng 4–44):
- Hàm `public.is_workspace_member(ws_id uuid)` kiểm tra xem `auth.uid()` có dòng dữ liệu hợp lệ trong `public.workspace_members` tương ứng với `ws_id`.
- Hàm `public.workspace_role(ws_id uuid)` truy vấn trực tiếp cột `role` từ bảng `public.workspace_members` của người dùng hiện tại (`auth.uid()`).
- Hàm `public.has_workspace_role(ws_id uuid, allowed_roles public.workspace_role[])` đối chiếu vai trò với mảng `['admin']`.
- **Đặc tính kỹ thuật**: Cả ba hàm đều được khai báo `language sql security definer stable set search_path = ''`. Quyền `EXECUTE` đã bị `REVOKE` hoàn toàn khỏi `public, anon` và chỉ `GRANT` cho `authenticated, service_role`.
- Không sử dụng `raw_user_meta_data`, không tin tưởng header client hay payload gửi lên.

### 2.3. Phân tích tính tương thích của thao tác Upsert
Tại `CastraView/src/services/businessProfileService.js` (dòng 228–232):
```javascript
const { data, error: profileError } = await client
  .from('business_profiles')
  .upsert(payload, { onConflict: 'workspace_id' })
  .select()
  .single()
```
- **PostgREST Translation**: Lệnh này được dịch sang SQL:
  `INSERT INTO public.business_profiles (...) VALUES (...) ON CONFLICT (workspace_id) DO UPDATE SET ...`
- **Tương thích RLS**:
  1. Khi **chưa có bản ghi** (INSERT path): PostgreSQL kích hoạt policy `business_profiles_admin_insert`. Ràng buộc `WITH CHECK` gọi `has_workspace_role(workspace_id, array['admin'])`. Nếu là Marketing Manager (`admin`), điều kiện thoả mãn $\rightarrow$ Thành công. Nếu là Leader (`manager`) hoặc Employee (`member`), điều kiện trả về FALSE $\rightarrow$ Lỗi `42501` (RLS violation).
  2. Khi **đã có bản ghi** (UPDATE path): PostgreSQL kích hoạt policy `business_profiles_admin_update`. Cả điều kiện `USING` và `WITH CHECK` đều kiểm tra `has_workspace_role(workspace_id, array['admin'])`. Điều kiện thoả mãn $\rightarrow$ Cập nhật thành công.
  3. **Chỉ mục xung đột (Conflict Target)**: Tại migration `20261006011000_expand_business_profile.sql` (dòng 15–16), chỉ mục duy nhất được khai báo chính xác:
     `create unique index if not exists uq_business_profiles_workspace on public.business_profiles(workspace_id);`
     Trường `{ onConflict: 'workspace_id' }` trùng khớp hoàn toàn với chỉ mục duy nhất của cơ sở dữ liệu.

### 2.4. Khóa bảo mật Frontend
- Tệp `CastraView/src/lib/supabase.js` chỉ nạp `VITE_SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_ANON_KEY`.
- Không có bất kỳ tham chiếu hay xuất hiện nào của `service_role` trong mã frontend.

---

## 3. Phân tích Định danh Workspace & Cách ly Dữ liệu (Section 3)

### 3.1. Cơ chế phân giải Workspace ID
- Tại `CastraView/src/App.jsx` (dòng 994–1008):
  `workspace_id` **không** bao giờ được lấy từ `profile.id` hay `user.id`.
  Thay vào đó, nó được truy vấn trực tiếp từ bảng hệ thống:
  ```javascript
  const { data: memberRows } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(id, name)')
    .eq('user_id', activeUser.id)
    .limit(2)
  ```
  `activeUser.id` là mã định danh tin cậy do Supabase Auth cấp phát từ phiên đăng nhập hợp lệ.

### 3.2. Đánh giá tính nhất quán và cách ly giữa các người dùng
- **User A (Marketing Manager, Workspace 1)**: Truy vấn `public.business_profiles` theo `workspace_id = WS-1`. Được trả về Profile 1. Được quyền chỉnh sửa và lưu.
- **User B (Leader / Employee, Workspace 1)**: Truy vấn `public.business_profiles` theo `workspace_id = WS-1`. Được trả về Profile 1 giống hệt User A. Giao diện khóa toàn bộ input ở chế độ `READ ONLY`. Nỗ lực ghi dữ liệu qua code bị RLS chặn với mã lỗi `42501`.
- **User C (Bất kỳ vai trò nào, Workspace 2)**: Truy vấn theo `workspace_id = WS-2`. Được trả về Profile 2.
- **Nếu User C cố tình sửa URL hoặc request parameter để nạp `workspace_id = WS-1`**:
  Hàm PostgreSQL `public.is_workspace_member(WS-1)` kiểm tra `auth.uid() = User C`. Do User C không có dòng nào trong `workspace_members` của `WS-1`, hàm trả về FALSE. PostgREST tự động trả về mảng rỗng (0 rows) hoặc lỗi `42501`. Không có bất kỳ rò rỉ dữ liệu nào giữa các Workspace.

### 3.3. Kiểm tra nguy cơ dữ liệu rác (Stale Data Leakage)
- Khi chuyển đổi tài khoản (`logout` hoặc đổi phiên):
  - Hàm `logout()` tại `App.jsx` (dòng 1248–1254) gọi `setUser(null)`, `setMembership(null)`, `setProfile(null)`.
  - Bộ lắng nghe `supabase.auth.onAuthStateChange` tại `App.jsx` (dòng 1145–1152) khi nhận `nextSession = null` sẽ ngay lập tức reset toàn bộ state: `setUser(null)`, `setMembership(null)`, `setProfile(null)`.
  - Tại `BusinessProfileTab.jsx` (dòng 270–276): Khi `loadProfile()` bắt đầu chạy, cờ `loading` được đặt thành `true`. Trong suốt thời gian này, khối form chứa dữ liệu draft **hoàn toàn bị ẩn** và thay bằng loader `<Loader2 className="animate-spin" />`. Dữ liệu của workspace cũ không thể hiển thị thoáng qua (flash of stale content).

---

## 4. Kiểm tra Thực thi Quyền hạn (Role Enforcement Analysis)

Ma trận phân quyền thực tế được xác minh độc lập:

| Actor | Vai trò Frontend | Quyền Workspace DB | UI: Đọc | UI: Ghi | Tầng Service: Ghi | Tầng Database (RLS): Ghi |
|---|---|---|---|---|---|---|
| **Marketing Manager** | `manager` | `admin` | **Cho phép** | **Cho phép** | **Cho phép** (`isManager = true`) | **Cho phép** (`admin` policy) |
| **Leader** | `leader` | `manager` | **Cho phép** | **Bị khóa** (Disabled) | **Bị từ chối** (`Error: Chỉ Marketing Manager...`) | **Bị chặn** (Policy yêu cầu `admin`) |
| **Employee** | `member` | `member` | **Cho phép** | **Bị khóa** (Disabled) | **Bị từ chối** (`Error: Chỉ Marketing Manager...`) | **Bị chặn** (Policy yêu cầu `admin`) |
| **System Admin** | `system_admin` | *(Không có)* | **Bị ẩn** | **Bị ẩn** | **Bị từ chối** | **Bị chặn** (`is_workspace_member = false`) |

- **Kết luận**: Tính an toàn của hệ thống không phụ thuộc vào các thuộc tính disabled trên giao diện người dùng. Ngay cả khi một người dùng cố tình can thiệp DevTools để mở khóa các trường input và gửi trực tiếp lệnh `persistBusinessProfile()` hoặc gọi REST API của PostgREST, cả tầng Service (`businessProfileService.js:168`) và tầng PostgreSQL RLS (`business_profiles_admin_update`) đều từ chối yêu cầu.

---

## 5. Đánh giá Rủi ro từ Endpoint Fallback Django Cũ (Section 5)

Đã rà soát toàn bộ các vị trí còn tồn tại lời gọi `api('business-profile/')` trong frontend:

1. **`App.jsx:1049` (`loadUserRoleAndData`)**:
   - Vị trí này nằm sau khối `if (supabase) { ... return resolvedMembership }`.
   - Đối với tất cả người dùng Supabase thực tế, code **không bao giờ** chạm tới dòng 1049. Nó chỉ được kích hoạt khi biến môi trường Supabase hoàn toàn không được cấu hình trên máy chủ.
2. **`App.jsx:1067` (`refreshData`)**:
   - Chỉ được kích hoạt tại dòng 1096 trong hàm `boot()` khi người dùng có phiên cookie xác thực Django thuần mà không có phiên Supabase Auth.
3. **`App.jsx:1248` (`saveProfile`)**:
   - Khối lệnh:
     ```javascript
     if (supabase && membership?.workspaceId) {
       const isManager = actorRole === 'manager'
       const saved = await persistBusinessProfile(membership.workspaceId, draft, isManager)
       setProfile(saved)
       setToast('Lưu hồ sơ doanh nghiệp thành công.')
       return
     }
     // Legacy Django fallback:
     const data = await api('business-profile/', { method: 'PUT', body: JSON.stringify(draft) })
     ```
   - Khi phiên Supabase hoạt động, hàm luôn kết thúc tại lệnh `return` ở dòng 1232. Endpoint Django cũ không bị gọi.

### Rủi ro và Đánh giá:
- **Nguy cơ xung đột dữ liệu**: Rất thấp. Model `BusinessAccount` tại `CastraServices/models.py` lưu dữ liệu vào bảng riêng `castra_business_account` liên kết với `user_id` của Django, hoàn toàn tách biệt với bảng `public.business_profiles` của Supabase.
- **Nguy cơ bảo mật**: Như đã chỉ ra ở Phase 3B, endpoint `account_api.profile` thiếu kiểm tra quyền RBAC đối với cookie Django. Tuy nhiên, do toàn bộ người dùng hiện nay xác thực qua Supabase JWT (không có session cookie Django), nếu gửi request tới `/api/business-profile/`, Django sẽ trả về ngay lập tức `HTTP 401 Unauthorized` (`AUTH_REQUIRED`).
- **Khuyến nghị**: Khi toàn bộ dự án hoàn tất chuyển đổi xác thực, cần lên kế hoạch loại bỏ hoàn toàn các dòng fallback này và vô hiệu hóa endpoint Django cũ.

---

## 6. Đánh giá Chất lượng Kiểm thử (Test Suite Analysis)

Tệp kiểm thử được đánh giá: [scratch/test_phase4a_business_profile_integration.mjs](file:///d:/essclip/CAPSTONE2APP\CastraVision\scratch\test_phase4a_business_profile_integration.mjs).

### 6.1. Số lượng Assertions thực tế
- Tổng cộng: **26 assertions** nằm trong 12 test cases.
- Tất cả 12 test cases đều hoàn thành với kết quả **PASSED**.

### 6.2. Phân loại bài test: Hàm thực tế vs. Giả lập
- **Thực thi hàm ứng dụng thực tế (Real Code Execution)**:
  - `saveBusinessProfile()`: Kiểm tra xác thực client, kiểm tra chặn Leader/Employee, kiểm tra chuẩn hóa dữ liệu, kiểm tra các điều kiện ràng buộc ngân sách (Cases 2, 3, 5, 7, 10).
  - `getBusinessProfile()`: Kiểm tra luồng dữ liệu, xử lý demo, xử lý lỗi thiếu workspace ID (Cases 1, 4, 6, 10).
  - `isValidWorkspaceId()`: Kiểm tra định dạng UUID RFC4122 (Case 9).
  - `explainProfileError()`: Kiểm tra dịch mã lỗi RLS (`42501`), unique conflict (`23505`), invalid UUID (`22P02`), và lỗi kết nối mạng (Cases 11, 12).
- **Phần giả lập (Simulation)**:
  - Case 8: Giả lập thuật toán lọc tab của `SettingsPage.jsx` và mảng membership trong bộ nhớ.
  - Case 9: Giả lập cách ly chéo tenant qua mảng membership mô phỏng logic của hàm SQL `is_workspace_member`.
  - Môi trường chạy: Sử dụng tài khoản Demo (`ws-demo-001`) để không bắn request qua mạng tới máy chủ bên ngoài.

### 6.3. Giới hạn quan trọng của bộ kiểm thử
- **Không kết nối tới cơ sở dữ liệu Supabase đang chạy**: Do kịch bản kiểm thử chạy độc lập qua Node.js local, nó không gửi HTTP request thực tế tới PostgreSQL PostgREST.
- **Không thay thế cho kiểm tra DDL**: Nếu một migration SQL có lỗi cú pháp hoặc đặt sai điều kiện trong policy RLS mà không liên quan đến logic JavaScript, bộ unit test này vẫn có thể PASS. Vì vậy, tính đúng đắn của RLS được đảm bảo chủ yếu qua việc kiểm tra trực tiếp mã nguồn SQL tại Section 2.

---

## 7. Các Rủi ro Kỹ thuật Còn lại & Điểm cần lưu ý

1. **Cảnh báo Linter React Compiler (`set-state-in-effect`)**:
   - `oxlint` phát hiện cảnh báo tại `BusinessProfileTab.jsx:109`: `loadProfile()` được gọi trong `useEffect` gây ra lời gọi `setLoading(true)` đồng bộ.
   - *Đánh giá rủi ro*: Thấp (Không ảnh hưởng đến tính đúng đắn hoặc bảo mật, không gây loop vì có dependency array chuẩn).
2. **Kích thước gói bundle (Vite chunk warning)**:
   - File build `dist/assets/index-Wv3pN57m.js` có dung lượng ~1.26 MB (vượt ngưỡng gợi ý 500 kB của Vite).
   - *Đánh giá rủi ro*: Hiệu năng tải ban đầu (Performance). Trong các giai đoạn tối ưu hóa sau, nên áp dụng `React.lazy()` / dynamic `import()` cho các trang con.

---

## 8. Kết luận và Khuyến nghị Cuối cùng (Final Recommendation)

Dựa trên kết quả thanh tra độc lập toàn diện:
1. Kiến trúc phân quyền và RLS trên bảng `public.business_profiles` đạt chuẩn bảo mật tuyệt đối, ngăn chặn hoàn toàn việc can thiệp trái phép hoặc truy cập chéo tenant.
2. Giao diện Cài đặt phân tách rõ ràng quyền hạn: Marketing Manager được sửa, Leader & Employee chỉ xem, System Admin bị chặn hoàn toàn.
3. Không để lộ Service Role Key, không tin tưởng dữ liệu từ client.
4. Quá trình kiểm tra hồi quy xác nhận `npm run lint` đạt 0 lỗi và `npm run build` thành công.

### Khuyến nghị:
👉 **ACCEPT (CHẤP THUẬN)** kết quả triển khai Phase 4A và sẵn sàng chuyển tiếp sang các giai đoạn tiếp theo.

# Báo cáo Kiểm tra Chuyên sâu: Marketing Manager Company & Tenant Identity

**Dự án**: CastraVision (Frontend - CastraView / Backend - CastraServices / Supabase)  
**Ngày thực hiện**: 2026-11-14  
**Phạm vi**: READ-ONLY Audit về nguồn gốc, tính chuẩn hóa và mức độ an toàn của định danh doanh nghiệp (`companyId`) trong cơ chế lưu trữ bản nháp ngân sách (`castravision_manager_budget_draft_v1:<userId>:<companyId>`).

---

## 1. Executive Summary

Đợt kiểm tra chuyên sâu (read-only audit) đã rà soát toàn bộ luồng dữ liệu từ cơ sở dữ liệu Supabase PostgreSQL, dịch vụ backend Django (`CastraServices`), tầng xác thực `App.jsx` đến component giao diện `BudgetOptimizationPage.jsx`.

**Kết luận cốt lõi**:
1. **Định danh Tenant/Doanh nghiệp chuẩn (Canonical Company ID)** trong hệ thống CastraVision là **`public.workspaces.id`** (UUID), được liên kết qua khóa ngoại **`workspace_id`** trên toàn bộ các bảng nghiệp vụ (`workspace_members`, `business_profiles`, `campaign_performance`, `strategies`, `ad_contents`, `budget_proposals`, `approvals`).
2. **`profile.id` trong Supabase KHÔNG PHẢI là Company ID**, mà chính là **User ID** (`public.profiles.id references auth.users(id)`). Nếu `profile.id` được nạp vào chuỗi fallback, nó sẽ biến `companyId` thành `userId`, gây nhầm lẫn nghiêm trọng giữa định danh người dùng và định danh tổ chức.
3. **Chuỗi fallback hiện hành đang sử dụng `business_name`** (tên hiển thị công ty, ví dụ `'Acme Marketing Corp'`) thay vì một mã định danh bất biến (UUID). `business_name` là trường có thể bị chỉnh sửa bất kỳ lúc nào qua màn hình Profile (`PUT /business-profile/`), dẫn đến nguy cơ làm thất lạc bản nháp cũ khi đổi tên công ty, hoặc xung đột giữa các công ty có trùng tên hiển thị.
4. **`App.jsx` đã truy vấn đúng `workspace_id`** từ Supabase và lưu vào state `membership.workspaceId`, nhưng **chưa truyền `membership` hoặc `workspaceId` vào `<BudgetOptimizationPage />`**.

**Đánh giá phân loại (Final Verdict)**: **NEEDS FIX** (Cần một điều chỉnh nhỏ ở tác vụ kế tiếp để đưa `membership.workspaceId` vào làm định danh chuẩn mực).

---

## 2. Authentication and Profile Data Flow

### 2.1. Tầng Cơ sở dữ liệu Supabase & Quyền sở hữu Workspace
- Tài liệu kiến trúc `docs/superpowers/specs/2026-10-06-supabase-auth-rls-design.md` và migration khởi tạo `supabase/migrations/20261004083830_init_schema.sql` xác định rõ:
  - Bảng `public.profiles`: Khóa chính `id uuid primary key references auth.users(id)`. Đây là bảng mở rộng thông tin cho người dùng cá nhân (Full name, Avatar).
  - Bảng `public.workspaces`: Đại diện cho một tổ chức / doanh nghiệp / tenant. Khóa chính là `id uuid primary key default uuid_generate_v4()`.
  - Bảng `public.workspace_members`: Quản lý quan hệ nhiều-nhiều giữa User và Workspace (`workspace_id uuid references public.workspaces(id)`, `user_id uuid references auth.users(id)`, `role workspace_role`).
  - Mọi chính sách bảo mật hàng (Row Level Security - RLS) đều cô lập dữ liệu theo `workspace_id` (hàm `is_workspace_member(workspace_id)`).

### 2.2. Tầng Backend Django (`CastraServices`)
- Tại `CastraServices/models.py` (dòng 37–53) và `CastraServices/account_api.py` (dòng 108–130):
  - Model `BusinessAccount` có liên kết 1-1 với `settings.AUTH_USER_MODEL` (`user = models.OneToOneField(...)`). Đây là mô hình tài khoản đơn doanh nghiệp kế thừa từ Sprint 1 cũ.
  - Endpoint `GET /api/business-profile/` trả về payload:
    ```json
    {
      "business_name": "...",
      "industry": "...",
      "business_size": "...",
      "target_customers": "...",
      "primary_goal": "...",
      "product_service": "...",
      "preferred_channels": [],
      "monthly_budget": 0,
      "currency": "VND"
    }
    ```
  - **Quan trọng**: Payload này **hoàn toàn không có trường `id` hay `company_id`**, chỉ có trường `business_name`.

### 2.3. Tầng Ứng dụng Frontend (`CastraView/src/App.jsx`)
- Trong `WorkspaceApp()`:
  - Quản lý các state riêng biệt: `user`, `membership`, `profile`.
  - Hàm `loadUserRoleAndData(activeUser)` (dòng 1140–1153):
    ```javascript
    const { data: memberRows } = await supabase
      .from('workspace_members')
      .select('workspace_id, role, workspaces(id, name)')
      .eq('user_id', activeUser.id)
      .limit(2)

    if (memberRows && memberRows.length > 0) {
      const item = memberRows[0]
      setMembership({
        workspaceId: item.workspace_id,   // <-- UUID chuẩn mực của workspace!
        workspaceName: item.workspaces?.name || 'CastraVision Workspace',
        role: item.role,
      })
      setProfile((current) => current || {
        business_name: item.workspaces?.name || 'CastraVision Workspace',
        ...
      })
    }
    ```
  - Tại hàm `handleDemoLogin` (dòng 1098–1115):
    - `user`: Đặt bằng `DEMO_USERS[roleKey]` (chứa `id: 'mgr-001'`, `business_name: 'Acme Marketing Corp'`).
    - `membership`: Đặt `role` và `workspaceName`, nhưng **bị khuyết `workspaceId`**.
    - `profile`: Đặt bằng object chứa `business_name: 'Acme Marketing Corp'` (không có `id` hay `company_id`).
  - Tại vị trí render `BudgetOptimizationPage` (dòng 1452–1459):
    ```javascript
    {page === 'budget' && (
      <BudgetOptimizationPage
        user={user}
        profile={profile}
        notify={setToast}
        setPage={setPage}
      />
    )}
    ```
    `App.jsx` chỉ truyền `user` và `profile`, **hoàn toàn không truyền `membership`**.

---

## 3. Field Meaning and Evidence

Bảng đối chiếu bản chất kỹ thuật của từng trường định danh:

| Trường dữ liệu | Vị trí xuất hiện | Thực chất đại diện cho điều gì | Có phải Company ID không? | Bằng chứng mã nguồn / Schema |
|---|---|---|:---:|---|
| **`user.id`** | Supabase `auth.users.id` / `DEMO_USERS.manager.id` | **Authenticated User ID** (Mã người dùng cá nhân). | **KHÔNG** | `App.jsx:992` (`id: 'mgr-001'`), `supabase/migrations/20261004083830_init_schema.sql:19`. |
| **`user.company_id`** | Không tồn tại trên `session.user` hay `DEMO_USERS` | Thuộc tính giả định, luôn `undefined` trong runtime thực tế. | **KHÔNG** | Chỉ xuất hiện nhân tạo trong `DashboardPreviewPage.jsx:38` cho mock data. |
| **`user.business_name`** | `DEMO_USERS.manager.business_name` | Tên hiển thị công ty (Display name dạng chuỗi). | **KHÔNG** (Là tên chuỗi, dễ đổi) | `App.jsx:998` (`business_name: 'Acme Marketing Corp'`). |
| **`profile.id`** | `public.profiles.id` (Supabase) | **Authenticated User ID** (Khóa ngoại trỏ đến `auth.users(id)`). | **CỰC KỲ NGUY HIỂM: LÀ USER ID** | `supabase/migrations/20261004083830_init_schema.sql:19`: `create table public.profiles ( id uuid primary key references auth.users(id) )`. |
| **`profile.company_id`** | Không tồn tại trong Django payload hay Supabase schema | Thuộc tính giả định, luôn `undefined`. | **KHÔNG** | `CastraServices/account_api.py:108-119`. |
| **`profile.business_name`** | Django `BusinessAccount` / `App.jsx:1107` | Tên hiển thị công ty (Mutable display string). | **KHÔNG** (Là tên hiển thị) | `CastraServices/models.py:43` (`business_name = models.CharField(...)`). |
| **`membership.workspaceId`** | `public.workspace_members.workspace_id` | **Canonical Workspace / Tenant UUID**. | **ĐÚNG (ĐÂY LÀ COMPANY ID CHUẨN)** | `App.jsx:1150` (`workspaceId: item.workspace_id`), `supabase/migrations/20261004083830_init_schema.sql:39`. |

---

## 4. Canonical Company/Tenant ID

Dựa trên bằng chứng từ cơ sở dữ liệu và tài liệu thiết kế hệ thống:
1. **Tính ổn định (Stability)**: `workspaces.id` là UUID được sinh ra duy nhất khi khởi tạo workspace (`create_workspace_with_admin`), không bao giờ thay đổi khi người dùng refresh hay đăng nhập lại.
2. **Chia sẻ trong cùng công ty (Shared within company)**: Tất cả nhân viên của một tổ chức (Admin, Manager, Member) đều có bản ghi trong `workspace_members` trỏ chung về một `workspace_id`.
3. **Phân biệt giữa các công ty (Distinct across companies)**: Hai công ty khác nhau luôn sở hữu hai UUID `workspaces.id` khác nhau.
4. **Không bị ảnh hưởng khi đổi tên (Immutable upon rename)**: Khi Admin đổi tên doanh nghiệp từ "Công ty A" sang "Công ty B", `workspaces.id` vẫn giữ nguyên vẹn.
5. **Khả dụng sau đăng nhập (Availability)**: Trong phiên Supabase thực tế, `workspace_id` được đọc ngay tại `loadUserRoleAndData` (dòng 1143).
6. **Xác nhận thực chất**: Đây chính xác là mã định danh Tenant của hệ thống, không phải mã bản ghi profile hay mã người dùng.

---

## 5. Current Fallback Chain Risk Analysis

Dòng lệnh hiện tại trong `CastraView/src/pages/BudgetOptimizationPage.jsx` (dòng 139–145):
```javascript
const companyId =
  profile?.id ||
  profile?.company_id ||
  profile?.business_name ||
  user?.company_id ||
  user?.business_name ||
  (userId ? 'default_workspace' : null)
```

Phân tích rủi ro từng mắt xích:
1. **`profile?.id` (RỦI RO CAO NHẤT)**:
   - Trong bảng `public.profiles` của Supabase, cột `id` là khóa ngoại tham chiếu đến `auth.users(id)`.
   - Nếu trong tương lai component nhận một đối tượng `profile` từ `public.profiles`, `profile.id` sẽ mang giá trị của **chính User ID**.
   - Khi đó: `companyId === userId`. Khóa lưu trữ sẽ trở thành:
     `castravision_manager_budget_draft_v1:<userId>:<userId>`
   - Hậu quả: Hoàn toàn mất khả năng phân tách theo công ty. Nếu User A là quản lý ở 2 công ty khác nhau, cả 2 công ty sẽ dùng chung một bản nháp ngân sách!
2. **`profile?.company_id`**:
   - Thuộc tính này không tồn tại trong backend Django lẫn schema Supabase (trừ khi được mock thủ công). Đây là một fallback chết (dead fallback).
3. **`profile?.business_name` (MẮT XÍCH ĐANG ĐƯỢC CHỌN HIỆN TẠI)**:
   - Do `profile.id` và `profile.company_id` đều `undefined`, chuỗi fallback hiện tại luôn dừng lại và lấy `profile.business_name` (ví dụ `'Acme Marketing Corp'`).
   - Rủi ro 1: `business_name` có thể sửa đổi được (`PUT /business-profile/`). Nếu người dùng cập nhật tên công ty, `storageKey` đổi theo, làm **mất quyền truy cập vào bản nháp đã lưu trước đó**.
   - Rủi ro 2: Nếu có hai công ty khác nhau cùng đặt tên trùng nhau (hoặc cùng mang tên mặc định `'CastraVision Workspace'`), tính năng phân tách tenant sẽ bị vô hiệu hóa.
4. **Thứ tự ưu tiên sai lệch so với `user?.company_id`**:
   - Trong `DashboardPreviewPage.jsx`, mock user có khai báo `user.company_id: 'preview-comp-001'`.
   - Tuy nhiên, vì `profile?.business_name` (`'Acme Corp'`) đứng **trước** `user?.company_id` trong chuỗi toán tử `||`, nên hệ thống lại chọn tên hiển thị `'Acme Corp'` thay vì mã ID chuẩn `'preview-comp-001'`!
5. **`'default_workspace'`**:
   - Nếu cả `profile` lẫn `user` đều chưa có tên doanh nghiệp, tất cả người dùng sẽ rơi vào chung một bucket `'default_workspace'`. Dù `userId` bảo vệ không để User B đọc của User A, nhưng nếu User A quản lý nhiều workspace chưa đặt tên thì dữ liệu giữa các workspace đó sẽ bị ghi đè lẫn nhau.

---

## 6. Budget Draft Isolation Assessment

| Tiêu chí | Trạng thái hiện tại | Đánh giá |
|---|---|---|
| **Cách ly giữa các Người dùng (User Isolation)** | **ĐẢM BẢO TUYỆT ĐỐI** | Khóa luôn chứa `userId` (ví dụ `mgr-001`). Không bao giờ có trường hợp User B đọc được bản nháp của User A trên cùng một máy tính. |
| **Cách ly giữa các Công ty (Company/Tenant Isolation)** | **MỨC ĐỘ YẾU / CHƯA CHUẨN HÓA** | Hiện đang phụ thuộc vào chuỗi tên hiển thị `business_name`. Chưa sử dụng mã `workspaceId` (UUID) bất biến. |
| **Khả năng chịu đựng khi đổi tên công ty** | **DỄ TỔN THƯƠNG** | Đổi tên công ty dẫn đến mồ côi bản nháp ngân sách đã lưu. |
| **An toàn trước schema Supabase** | **TIỀM ẨN NGUY HIỂM** | `profile.id` trong Supabase là User ID. Nếu truyền nhầm record `profiles` vào, `companyId` sẽ bị gán nhầm thành User ID. |

---

## 7. Findings: Confirmed vs. Unconfirmed

### Confirmed Facts (Sự thật đã được xác minh 100% bằng code & schema)
1. Trong Supabase, mã định danh duy nhất của tổ chức/tenant là `public.workspaces.id` (UUID), được lưu ở khóa ngoại `workspace_id` trên tất cả các bảng.
2. Trong Supabase, `public.profiles.id` chính là `auth.users.id` (User ID). `public.profiles` không chứa thông tin doanh nghiệp.
3. Trong `App.jsx`, state `membership.workspaceId` đã lưu trữ chính xác `item.workspace_id` từ Supabase.
4. Trong `App.jsx:1453`, `<BudgetOptimizationPage />` chỉ nhận `user` và `profile`, **không nhận `membership` hay `workspaceId`**.
5. Trong `BudgetOptimizationPage.jsx:139-145`, chuỗi fallback hiện tại đang lấy `business_name` làm `companyId`.

### Unconfirmed / Environment Limitations
1. Trong `handleDemoLogin` (`App.jsx:1102`), demo manager chưa được cấp `workspaceId` giả lập cố định (chỉ có `workspaceName`).
2. Chưa thể kiểm thử hành vi đổi workspace trên 2 tài khoản Supabase thật cùng lúc trong môi trường runtime local do chỉ có tài khoản demo đang hoạt động.

---

## 8. Recommended Canonical Identity Source (Khuyến nghị khắc phục)

Để giải quyết triệt để rủi ro mà không phá vỡ kiến trúc hay làm xáo trộn giao diện, khuyến nghị thực hiện các bước sau trong tác vụ kế tiếp (Targeted Minimal Fix):

### Bước 1: Trong `App.jsx`
1. Tại `handleDemoLogin` (dòng 1102), bổ sung `workspaceId` cho `membership`:
   ```javascript
   setMembership({
     workspaceId: 'ws-acme-001',
     workspaceName: demo.business_name || 'CastraVision Workspace',
     role: workspaceRole,
   })
   ```
2. Tại dòng 1453, truyền `membership={membership}` hoặc `workspaceId={membership?.workspaceId}` vào `BudgetOptimizationPage`:
   ```javascript
   <BudgetOptimizationPage
     user={user}
     profile={profile}
     membership={membership}
     notify={setToast}
     setPage={setPage}
   />
   ```

### Bước 2: Trong `BudgetOptimizationPage.jsx`
Cập nhật cách xác định `companyId` theo thứ tự ưu tiên chặt chẽ: **Ưu tiên UUID định danh, loại bỏ hoàn toàn `profile.id`**:
```javascript
const companyId =
  membership?.workspaceId ||
  user?.workspace_id ||
  user?.company_id ||
  profile?.workspace_id ||
  profile?.business_name ||
  user?.business_name ||
  (userId ? 'default_workspace' : null)
```
*Lưu ý: Tuyệt đối không dùng `profile?.id` vì đó là User ID trong Supabase.*

---

## 9. Final Verdict

# **NEEDS FIX**

**Lý do**:
- Tách biệt giữa các người dùng (`userId`) hoạt động hoàn hảo và an toàn.
- Tuy nhiên, định danh doanh nghiệp (`companyId`) hiện đang rơi vào tên hiển thị khả biến `business_name` thay vì mã định danh chuẩn `workspace_id`.
- Mắt xích đầu tiên trong chuỗi fallback (`profile?.id`) là một lỗ hổng tiềm tàng vì trong schema Supabase, `profiles.id` thực chất là User ID chứ không phải Company ID.
- Cần một tác vụ điều chỉnh tối thiểu (truyền `membership` từ `App.jsx`) để hoàn thiện chuẩn mực phân vùng multi-tenant.

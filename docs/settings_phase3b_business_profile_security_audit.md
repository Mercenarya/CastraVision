# Báo cáo kiểm định an ninh & kiến trúc Business Profile Backend – Phase 3B

**Dự án:** CastraVision Backend (CastraServices) & Database Architecture (Supabase / Django)  
**Phạm vi:** Kiểm định an ninh, phân quyền và quyền sở hữu dữ liệu (Audit-Only)  
**Tài liệu tham chiếu:**  
- `CastraServices/account_api.py`
- `CastraServices/authentication.py`
- `CastraServices/permissions.py`
- `CastraServices/models.py`
- `CastraServices/urls.py`
- `supabase/migrations/` (Schema & RLS policies)  
**Trạng thái kiểm định:** Hoàn tất 100% mục tiêu kiểm định – Sẵn sàng chờ đánh giá (Ready for Review)  

---

## 1. Danh mục các Endpoint liên quan (Endpoint Inventory)

Qua rà soát toàn bộ hệ thống định tuyến Django và API frontend, các endpoint liên quan đến Business Profile được liệt kê chi tiết dưới đây:

| Phương thức HTTP | Đường dẫn URI | Hàm xử lý (Handler) | Cơ chế xác thực hiện tại | Cơ chế phân quyền hiện tại | Mô hình dữ liệu đích |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/business-profile/` | `account_api.profile` | Session Cookie Django (`request.user.is_authenticated`) | **KHÔNG CÓ** (Bất kỳ user nào có session đều đọc được) | Django `BusinessAccount` (lọc theo `user=request.user`) |
| **PUT** | `/api/business-profile/` | `account_api.profile` | Session Cookie Django (`request.user.is_authenticated`) | **KHÔNG CÓ** (Bất kỳ user nào có session đều ghi/sửa được) | Django `BusinessAccount` (upsert theo `user=request.user`) |
| **POST** | `/api/strategies/generate/` | `views.strategy_generate` | `@csrf_exempt` (Không yêu cầu auth) | **KHÔNG CÓ** | Sử dụng payload `BusinessProfile` truyền từ client để tạo chiến lược |
| *(Supabase REST)* | `/rest/v1/business_profiles` | Supabase PostgREST | JWT Bearer Token Supabase | **RLS nghiêm ngặt** (`admin` insert/update/delete, `member` select) | Supabase `public.business_profiles` (theo `workspace_id`) |

---

## 2. Luồng xác thực & phân quyền hiện tại (Current Authorization Flow)

### 2.1 Luồng thực tế tại `CastraServices/account_api.py:122-192`
```python
@require_http_methods(["GET", "PUT"])
def profile(request):
    if not request.user.is_authenticated:
        return error_response("AUTH_REQUIRED", "Vui lòng đăng nhập.", 401)
    if request.method == "GET":
        existing = BusinessAccount.objects.filter(user=request.user).first()
        return JsonResponse({"profile": _profile_payload(existing) if existing else None})

    payload, error = _json_body(request)
    ...
    saved, _ = BusinessAccount.objects.update_or_create(
        user=request.user,
        defaults={**values, "preferred_channels": channels, "monthly_budget": budget, "currency": currency},
    )
    return JsonResponse({"profile": _profile_payload(saved)})
```

### 2.2 Các khiếm khuyết an ninh nghiêm trọng trong luồng xử lý
1. **Thiếu hoàn toàn kiểm tra vai trò người dùng (Zero Role Enforcement)**:
   - Handler chỉ kiểm tra duy nhất cờ `request.user.is_authenticated`.
   - Cả 4 vai trò (Marketing Manager, Team Leader, Employee, System Admin) nếu có session Django đều được phép gọi `PUT` để tạo hoặc ghi đè thông tin cấu hình doanh nghiệp. Leader và Employee **không nhận mã lỗi HTTP 403**.
2. **Không kết nối với cơ chế xác thực JWT chuẩn của hệ thống (`authentication.py`)**:
   - `CastraServices/authentication.py` đã có hàm `authenticate_request(request)` dùng để xác thực Supabase JWT Bearer qua JWKS và truy vấn `workspace_members` trên Supabase.
   - Tuy nhiên, `account_api.py` **hoàn toàn không sử dụng** `authenticate_request()` hay các decorator trong `CastraServices/permissions.py` (`@require_workspace_admin`, `@require_workspace_member`).
3. **Bất tương thích giao thức giữa Frontend Supabase và Backend Django**:
   - Khi người dùng đăng nhập bằng Supabase trên frontend (luồng chính của CastraVision), frontend **không tạo session cookie trong Django**.
   - Khi frontend gọi `saveProfile()` qua `fetch('/api/business-profile/')`, request gửi cookie `csrftoken` nhưng không có sessionid Django hợp lệ $\rightarrow$ Backend lập tức trả về **HTTP 401 `AUTH_REQUIRED`**.

---

## 3. Phân tích quyền sở hữu dữ liệu & Cô lập Tenant (Data Ownership & Tenancy Analysis)

### 3.1 Thực trạng liên kết của model `BusinessAccount` (Django)
Tại `CastraServices/models.py:37-53`:
```python
class BusinessAccount(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="business_account",
    )
    business_name = models.CharField(max_length=120)
    ...
```
- **Liên kết 1-1 với User cá nhân**: `BusinessAccount` chỉ liên kết duy nhất với khóa ngoại `user` trỏ tới bảng `auth_user` của Django.
- **Hoàn toàn không có khái niệm `workspace_id`**: Không có cột nào định danh tổ chức hay workspace.

### 3.2 Hệ quả kiến trúc & Rủi ro xung đột dữ liệu (Data Collision)
1. **Xung đột dữ liệu trong cùng một Workspace**:
   - Nếu trong cùng 1 Workspace có 3 người dùng (1 Manager, 1 Leader, 1 Employee) cùng đăng nhập Django và nhập hồ sơ doanh nghiệp:
   - Hệ thống sẽ sinh ra **3 bản ghi `BusinessAccount` hoàn toàn riêng biệt**, độc lập và mâu thuẫn nhau.
   - Leader không thể xem được hồ sơ do Marketing Manager thiết lập.
2. **Nguồn chân lý bị phân mảnh (Fragmented Source of Truth)**:
   - Bảng `public.workspaces` trong Supabase là **nguồn chân lý duy nhất (canonical source)** cho định danh tổ chức (`id uuid`, `name text`, `slug text`).
   - Cột `business_name` trong Django `BusinessAccount` là một chuỗi ký tự tự do, **hoàn toàn không được đồng bộ** với `workspaces.name`.
3. **Sự tồn tại song song của bảng `public.business_profiles` trong Supabase**:
   - Trong schema Supabase (`supabase/migrations/20261004083830_init_schema.sql` và `20261006011000_expand_business_profile.sql`), đã tồn tại sẵn bảng `public.business_profiles`:
     - Khóa ngoại: `workspace_id uuid not null references public.workspaces(id) on delete cascade`.
     - Ràng buộc duy nhất: `uq_business_profiles_workspace on public.business_profiles(workspace_id)` (chính xác 1 hồ sơ duy nhất cho mỗi workspace).
     - RLS Policy:
       - `business_profiles_member_select`: Cho phép mọi thành viên trong workspace đọc (`is_workspace_member(workspace_id)`).
       - `business_profiles_admin_insert/update/delete`: Chỉ cho phép người dùng có vai trò `admin` (Marketing Manager) thêm/sửa/xóa (`has_workspace_role(workspace_id, array['admin'])`).
   - **Kết luận:** Django `BusinessAccount` là vết tích thử nghiệm (prototype) từ Sprint 1 cũ, hoàn toàn lạc hậu so với thiết kế multi-tenant chuẩn của Supabase.

---

## 4. Xác minh đặc quyền System Admin (System Admin Privilege Verification)

### 4.1 Cơ chế cấp và xác minh System Admin
- **Tại Backend Django (`CastraServices/`)**:
  - Không có bất kỳ endpoint nào nhận diện hoặc cấp đặc quyền riêng cho `system_admin`.
  - Bộ phân quyền `CastraServices/permissions.py` chỉ định nghĩa:
    `ALL_ROLES = frozenset({"admin", "manager", "member"})`.
  - Nếu một System Admin gọi vào API backend workspace (như `campaign_api.py`), hàm `single_workspace_membership()` sẽ báo lỗi `MembershipNotFound` và trả về **HTTP 403 `WORKSPACE_REQUIRED`**.
- **Tại Frontend React (`CastraView/`)**:
  - `system_admin` được nhận diện dựa trên:
    - Email đặc quyền: `tritran0932523321@gmail.com`.
    - User metadata: `user?.app_metadata?.role === 'system_admin'` hoặc `user?.user_metadata?.role === 'system_admin'`.
    - Tài khoản demo: `id === 'sa-001'`.

### 4.2 Đánh giá khả năng leo thang đặc quyền (Privilege Escalation Vector)
| Kênh can thiệp | Khả năng leo thang tại Frontend | Khả năng leo thang tại Backend | Cơ chế bảo vệ hiện hữu |
| :--- | :---: | :---: | :--- |
| **Sửa Supabase `user_metadata`** | **Có nguy cơ** | **KHÔNG** | Backend không bao giờ đọc `user_metadata`, chỉ đọc bảng `workspace_members` qua truy vấn nội bộ. |
| **Sửa `actorRole` trên React State** | Chỉ đổi giao diện hiển thị | **KHÔNG** | Backend không nhận diện `actorRole` từ frontend. |
| **Gửi tham số trong Request Body** | Không ảnh hưởng | **KHÔNG** | Backend xác thực vai trò từ JWT Bearer qua JWKS, không đọc vai trò từ body. |
| **Sửa Query Parameters / Headers** | Không ảnh hưởng | **KHÔNG** | Token JWT được kiểm tra chữ ký mã hóa bằng khóa công khai JWKS của Supabase. |

---

## 5. Ma trận kiểm định an ninh (Security Test Matrix)

Dưới đây là ma trận kiểm thử đối chiếu giữa **Yêu cầu an ninh chuẩn (Target Architecture)** và **Hành vi thực tế hiện tại của hệ thống (Current Implementation)**:

| # | Kịch bản kiểm thử | Kỳ vọng chuẩn (Target) | Thực tế hiện tại (Django Session) | Thực tế hiện tại (Supabase JWT Bearer) | Đánh giá mức độ | Phương thức kiểm chứng |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| 1 | **Yêu cầu không xác thực (Unauthenticated)** | HTTP 401 | HTTP 401 | HTTP 401 | **ĐẠT** | *Code inspection & Tests.py:156* |
| 2 | **Marketing Manager truy cập workspace của mình** | HTTP 200 (Read & Write) | HTTP 200 (nhưng ghi vào `auth_user`, không ghi workspace) | HTTP 401 (do Django không nhận Bearer token) | **NGUY CƠ CAO** | *Code inspection `account_api.py:182`* |
| 3 | **Marketing Manager can thiệp ID workspace khác** | HTTP 403 | Không áp dụng (Django không có `workspace_id`) | HTTP 401 | **NGUY CƠ CAO** | *Code inspection* |
| 4 | **Leader gọi `PUT` cập nhật Business Profile** | HTTP 403 | **HTTP 200 (Ghi đè thành công)** | HTTP 401 | **NGHIÊM TRỌNG** | *Code inspection `account_api.py:122`* |
| 5 | **Employee gọi `PUT` cập nhật Business Profile** | HTTP 403 | **HTTP 200 (Ghi đè thành công)** | HTTP 401 | **NGHIÊM TRỌNG** | *Code inspection `account_api.py:122`* |
| 6 | **System Admin gọi cập nhật Business Profile** | HTTP 403 | **HTTP 200 (Ghi đè thành công)** | HTTP 401 | **NGHIÊM TRỌNG** | *Code inspection `account_api.py:122`* |
| 7 | **Thiếu tư cách thành viên workspace (Missing membership)** | HTTP 403 | HTTP 200 (Không kiểm tra membership) | HTTP 401 | **NGUY CƠ CAO** | *Code inspection* |
| 8 | **Tư cách thành viên mơ hồ / không hợp lệ** | HTTP 403 | HTTP 200 (Không kiểm tra membership) | HTTP 401 | **NGUY CƠ CAO** | *Code inspection* |
| 9 | **Giả mạo `actorRole="manager"` từ frontend** | HTTP 403 | HTTP 200 (Bỏ qua `actorRole`, cho phép ghi) | HTTP 401 | **NGUY CƠ CAO** | *Code inspection* |
| 10 | **Giả mạo `user_metadata.role="admin"`** | HTTP 403 | HTTP 200 (Không kiểm tra Supabase metadata) | HTTP 401 | **NGUY CƠ CAO** | *Code inspection* |
| 11 | **Gửi kèm `workspace_id` của workspace khác trong Body** | HTTP 403 / Bị lờ đi | Tham số bị bỏ qua, ghi vào `auth_user` | HTTP 401 | **TRUNG BÌNH** | *Code inspection `account_api.py:143`* |

---

## 6. Bảng xếp hạng các phát hiện an ninh (Ranked Findings)

### 🔴 CRITICAL (Nghiêm trọng)
1. **CRIT-01: Lỗ hổng bỏ qua phân quyền cập nhật hồ sơ (Missing Role Enforcement on Write)**:
   - Endpoint `PUT /api/business-profile/` không có bất kỳ bộ lọc vai trò nào. Mọi tài khoản xác thực phiên Django (kể cả Nhân viên/Leader) đều có thể ghi đè thông tin hồ sơ doanh nghiệp.
2. **CRIT-02: Bất đồng bộ quyền sở hữu dữ liệu và Tenancy (Broken Tenancy & Data Collision)**:
   - Model `BusinessAccount` của Django chỉ gắn với `user_id`, không có `workspace_id`. Nhiều người dùng trong cùng một công ty sẽ tạo ra nhiều bản ghi cấu hình mâu thuẫn nhau, làm vỡ tính toàn vẹn của dữ liệu tổ chức.

### 🟠 HIGH (Nguy cơ cao)
1. **HIGH-01: Bất tương thích giao thức xác thực (Authentication Protocol Incompatibility)**:
   - Frontend CastraVision sử dụng Supabase JWT làm cơ chế xác thực chính, nhưng `/api/business-profile/` lại đòi hỏi Session Cookie của Django và CSRF token cũ. Người dùng Supabase khi bấm Lưu hồ sơ sẽ luôn bị lỗi HTTP 401 hoặc lỗi mạng.
2. **HIGH-02: Bỏ quên hạ tầng bảo mật sẵn có của Supabase (Untapped Hardened Supabase Infrastructure)**:
   - Bảng `public.business_profiles` trên Supabase đã được phân quyền RLS rất chặt chẽ theo `workspace_id` và vai trò `admin`, nhưng chưa được kết nối vào ứng dụng, gây lãng phí hạ tầng bảo mật đã xây dựng.

### 🟡 MEDIUM (Trung bình)
1. **MED-01: Lệch pha cấu trúc trường dữ liệu (Field Schema Discrepancy)**:
   - Django dùng enum `business_size` (`Micro`, `Small`, `Medium`, `Large`).
   - Supabase dùng enum `company_size` (`micro`, `sme`, `enterprise`).
   - Cần có tầng chuẩn hóa dữ liệu khi đồng bộ giữa frontend và database.

### 🟢 LOW (Thấp)
1. **LOW-01: Sự phụ thuộc vào CSRF Cookie trên REST API**:
   - Cơ chế bảo vệ CSRF dựa trên cookie của Django không còn phù hợp với kiến trúc SPA sử dụng Bearer Token hiện đại.

---

## 7. Kế hoạch triển khai khuyến nghị cho Phase 4 (Recommended Implementation Plan)

Để giải quyết triệt để toàn bộ các phát hiện trên mà không làm vỡ kiến trúc, khuyến nghị thực hiện theo 2 phương án kiến trúc:

### 🌟 Phương án A (Khuyến nghị cao nhất): Chuyển hoàn toàn Business Profile sang Supabase Data API
- **Nguyên lý:** Tận dụng 100% bảng `public.business_profiles` và các RLS Policies đã hoàn thiện trong Supabase:
  - Frontend gọi trực tiếp Supabase Client với token xác thực của phiên làm việc hiện tại.
  - RLS của Supabase sẽ tự động:
    - Cho phép Marketing Manager (`admin`) thực hiện `insert` và `update`.
    - Chặn Leader và Employee thực hiện `update/insert` (trả về lỗi RLS policy violation).
    - Cho phép mọi thành viên trong workspace thực hiện `select` để xem thông tin chung.
- **Ưu điểm:**
  - Không cần tạo migration Django mới.
  - Không cần bảo trì mô hình lai (hybrid session) phức tạp.
  - Tự động thừa hưởng tính năng phân tách multi-tenant an toàn tuyệt đối.

### Phương án B: Nâng cấp Endpoint Django `CastraServices/account_api.py` sang Supabase JWT Pattern
- **Nguyên lý:** Chuẩn hóa endpoint Django giống như cách `CastraServices/campaign_api.py` đang hoạt động:
  1. Gắn decorator `@require_workspace_admin` vào `profile()` view.
  2. Sử dụng `context = request_auth(request)` để lấy `workspace_id` và `role` được chứng thực từ Supabase.
  3. Sử dụng `user_client(context.access_token)` để proxy truy vấn sang bảng `public.business_profiles` của Supabase.
  4. Bỏ hoàn toàn việc đọc/ghi vào model `BusinessAccount` của Django.

---

## 8. Yêu cầu Migration Cơ sở dữ liệu (Database Migration Requirements)

1. **Phía Supabase Database**:
   - **KHÔNG CẦN MIGRATION MỚI**: Schema `public.business_profiles` đã có đầy đủ các cột:
     - `workspace_id` (FK to `public.workspaces`)
     - `industry`, `company_size`, `target_customer`
     - `product_service`, `primary_goal`, `preferred_channels`, `monthly_budget`, `currency`
     - Khóa duy nhất `uq_business_profiles_workspace`
     - 4 RLS Policies đã được kích hoạt.
2. **Phía Django Backend**:
   - Nếu áp dụng **Phương án A hoặc B**: Không cần tạo migration mới cho Django (chỉ cần đánh dấu deprecated model `BusinessAccount`).
   - Nếu vẫn muốn duy trì `BusinessAccount` trong Django: Bắt buộc phải viết migration thêm cột `workspace_id UUID`, bổ sung index unique `(workspace_id)` và viết script di chuyển dữ liệu từ `user_id` sang `workspace_id`.

---

## 9. Danh sách file cần sửa đổi trong Phase triển khai tiếp theo (Implementation File List)

Khi chuyển sang Phase thực thi, các file sau đây sẽ được điều chỉnh:

### Nếu chọn Phương án A (Frontend $\leftrightarrow$ Supabase Client):
1. `CastraView/src/services/businessProfileService.js` (Tạo mới: Service gọi Supabase trực tiếp).
2. `CastraView/src/components/settings/BusinessProfileTab.jsx` (Cập nhật handler nạp và lưu dữ liệu qua Supabase Client).
3. `CastraView/src/App.jsx` (Gỡ bỏ hàm gọi `api('business-profile/')` kiểu cũ).

### Nếu chọn Phương án B (Frontend $\leftrightarrow$ Django Proxy $\leftrightarrow$ Supabase):
1. `CastraServices/account_api.py` (Áp dụng `@require_workspace_admin`, `@csrf_exempt`, chuyển sang `user_client`).
2. `CastraServices/urls.py` (Đảm bảo định tuyến đồng bộ).
3. `CastraView/src/lib/api.js` (Bổ sung Header `Authorization: Bearer <token>` vào client gọi API).
4. `CastraView/src/components/settings/BusinessProfileTab.jsx` (Đồng bộ xử lý phản hồi mã lỗi HTTP 403).

---

**Kết luận Phase 3B:** Đợt kiểm định an ninh đã xác định chính xác điểm nghẽn kiến trúc và nguyên nhân gốc rễ vì sao tính năng Business Profile trước đây không thể lưu trữ an toàn cấp Workspace. Báo cáo này cung cấp đầy đủ luận cứ kỹ thuật để bước vào Phase triển khai kết nối dữ liệu an toàn. Kính trình người phụ trách xem xét và chỉ đạo phương án triển khai tiếp theo.

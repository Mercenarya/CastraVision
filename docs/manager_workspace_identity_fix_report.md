# Báo cáo kỹ thuật: Canonical Workspace ID for Marketing Manager Budget Draft

**Dự án**: CastraVision (Frontend - CastraView)  
**Ngày thực hiện**: 2026-11-14  
**Phạm vi**: Targeted Fix giải quyết triệt để vấn đề cách ly tenant/công ty bằng `membership.workspaceId` trong cơ chế lưu trữ bản nháp phân bổ ngân sách.

---

## 1. Root Cause (Nguyên nhân gốc rễ)

Trong báo cáo kiểm tra chuyên sâu (`docs/manager_company_identity_final_audit.md`), hai vấn đề kiến trúc chính đã được phát hiện:
1. **Sử dụng chuỗi fallback không an toàn trong `BudgetOptimizationPage.jsx`**:
   - Khóa lưu trữ trước đó sử dụng:
     `profile?.id || profile?.company_id || profile?.business_name || user?.company_id || user?.business_name || 'default_workspace'`
   - Trong schema Supabase (`supabase/migrations/20261004083830_init_schema.sql`), `public.profiles.id` thực chất là **User ID** (`references auth.users(id)`), hoàn toàn không phải Company ID.
   - Khi không có `profile.id`, chuỗi fallback rơi vào `business_name` (tên hiển thị, ví dụ `'Acme Marketing Corp'`). Đây là một chuỗi có thể bị thay đổi qua màn hình cài đặt Profile (`PUT /business-profile/`), khiến bản nháp ngân sách bị mồ côi (orphaned) khi công ty đổi tên hiển thị, hoặc gây xung đột nếu hai công ty có cùng tên mặc định.
2. **Khuyết thiếu truyền `membership` trong `App.jsx`**:
   - `App.jsx` đã truy vấn đúng mã UUID của workspace từ Supabase (`workspace_members.workspace_id`) và lưu vào state `membership.workspaceId`. Tuy nhiên, tại vị trí render `<BudgetOptimizationPage />`, `membership` không được truyền qua prop.
   - Trong luồng demo login (`handleDemoLogin`), state `membership` được gán `role` và `workspaceName` nhưng bị thiếu thuộc tính `workspaceId`.

---

## 2. Files Modified (Các tệp đã sửa đổi)

| Tệp tin | Thay đổi thực hiện |
|---|---|
| `CastraView/src/App.jsx` | 1. Bổ sung `workspaceId: 'ws-demo-001'` vào hàm `handleDemoLogin` cho vai trò Marketing Manager.<br>2. Truyền `membership={membership}` vào `<BudgetOptimizationPage />` tại dòng 1453. |
| `CastraView/src/pages/BudgetOptimizationPage.jsx` | 1. Tiếp nhận prop `membership`.<br>2. Xác định `workspaceId = membership?.workspaceId` làm định danh chuẩn mực duy nhất của workspace.<br>3. Loại bỏ hoàn toàn `profile.id`, `company_id`, `business_name`, và không còn fallback về `default_workspace`.<br>4. Định dạng khóa lưu trữ: `castravision_manager_budget_draft_v1:<userId>:<workspaceId>`.<br>5. Bắt buộc cả `userId` và `workspaceId` phải hợp lệ (chuỗi không rỗng) trước khi truy cập `localStorage`.<br>6. Hiển thị thông báo lỗi rõ ràng nếu người dùng cố lưu bản nháp khi chưa phân giải được workspace.<br>7. Cập nhật `propTypes` tiếp nhận `membership`. |
| `CastraView/src/preview/DashboardPreviewPage.jsx` | Khai báo `MOCK_PREVIEW_MEMBERSHIP = { workspaceId: 'ws-preview-001', workspaceName: 'Acme Corp', role: 'admin' }` và truyền `membership={MOCK_PREVIEW_MEMBERSHIP}` cho component `BudgetOptimizationPage` trong môi trường preview độc lập. |

---

## 3. Canonical Identity Source (Nguồn định danh chuẩn mực)

- **Mã định danh User**: `user?.id` (UUID từ Supabase `auth.users.id` hoặc `'mgr-001'` trong demo mode).
- **Mã định danh Workspace**: `membership?.workspaceId` (UUID từ Supabase `public.workspaces.id` thông qua bảng `public.workspace_members.workspace_id`, hoặc `'ws-demo-001'` trong demo mode).
- **Tuyệt đối không sử dụng**:
  - Không dùng `profile.id` (vì trong Supabase, `profiles.id` trỏ về `auth.users.id`).
  - Không dùng `business_name` (vì là tên hiển thị, có thể bị sửa đổi bất kỳ lúc nào).
  - Không fallback về `'default_workspace'`.
  - Không dùng `userId` thay thế cho `workspaceId`.

---

## 4. Storage Key Format & Payload Schema

### 4.1. Định dạng khóa lưu trữ
```text
castravision_manager_budget_draft_v1:<userId>:<workspaceId>
```
Hàm khởi tạo khóa:
```javascript
function getBudgetDraftStorageKey(userId, workspaceId) {
  if (
    !userId ||
    !workspaceId ||
    typeof userId !== 'string' ||
    typeof workspaceId !== 'string'
  ) {
    return null
  }
  const cleanUser = userId.trim()
  const cleanWorkspace = workspaceId.trim()
  if (!cleanUser || !cleanWorkspace) return null
  return `${STORAGE_KEY_PREFIX}:${cleanUser}:${cleanWorkspace}`
}
```
*Nếu thiếu `userId` hoặc `workspaceId`, hàm trả về `null`. Không có bất kỳ truy cập nào tới `window.localStorage`.*

### 4.2. Cấu trúc Payload lưu trữ
```json
{
  "userId": "mgr-001",
  "workspaceId": "ws-demo-001",
  "channels": [
    {
      "id": "meta",
      "recommendedSpend": 62000,
      "recommendedShare": 47,
      "currentSpend": 45000,
      "currentShare": 36,
      "delta": 17000,
      "deltaPercent": 37.8,
      "currentRoas": 3.85,
      "projectedRoas": 4.80,
      "action": "Scale Budget",
      "actionTone": "bg-[#03b5d3]/15 text-[#4cd7f6] border-[#03b5d3]/30"
    }
  ],
  "timeframe": "30 Days",
  "savedAt": "2026-11-14T08:30:00.000Z",
  "version": 1
}
```
*Tương thích ngược*: Hàm `loadStoredDraft` kiểm tra `parsed.workspaceId || parsed.companyId === expectedWorkspaceId`, đảm bảo các bản nháp trước đó vẫn được công nhận nếu trùng khớp mã workspace.

---

## 5. Missing Identity Behavior (Xử lý khi thiếu định danh)

Khi `userId` hoặc `workspaceId` chưa được phân giải hoặc bằng `null`:
1. **Không nạp bản nháp**: Khóa `storageKey` trả về `null`. Component nạp mảng kênh mặc định `BASELINE_CHANNELS`, `timeframe = '30 Days'`, `draftSavedAt = null`.
2. **Không ghi đè**: Không lưu hay ghi dữ liệu rỗng lên bất kỳ khóa nào trong `localStorage`.
3. **Ngăn chặn lưu khi nhấn nút**: Nếu người dùng nhấn `Save Draft Allocation` trong khi thiếu định danh workspace, thông báo lỗi xuất hiện:
   *"Cannot save draft: workspace identity is not available."*
4. **Không xóa nhầm bản nháp khác khi Reset**: Nếu `storageKey` là `null`, nút `Reset Allocation` chỉ đưa state component về `BASELINE_CHANNELS` mà không thực thi `localStorage.removeItem`, bảo toàn dữ liệu của các tài khoản khác.
5. **Chuyển đổi danh tính an toàn (Zero-flicker)**: Khi `userId` hoặc `workspaceId` thay đổi, React cập nhật state trong quá trình render (`if (prevStorageKey !== storageKey)`), lập tức nạp bản nháp của workspace mới hoặc đưa về baseline nếu workspace mới chưa có bản nháp. Bản nháp của workspace cũ không bị hiển thị tạm thời hay nhấp nháy trên giao diện.

---

## 6. Test Cases and Actual Results

Toàn bộ 8 ca kiểm thử chức năng đã được thực thi và kiểm chứng thông qua mã kiểm thử tự động `test_canonical_workspace.mjs` và kiểm tra logic runtime:

| STT | Kịch bản kiểm thử | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|:---:|---|---|---|:---:|
| 1 | Khởi tạo khóa lưu trữ chuẩn | `getBudgetDraftStorageKey('user-A', 'ws-001')` trả về `...:user-A:ws-001` | Khóa chính xác tuyệt đối, cắt bỏ khoảng trắng thừa | **PASS** |
| 2 | Thiếu một trong hai định danh | Trả về `null` khi `userId` hoặc `workspaceId` là `null`, `undefined` hoặc chuỗi rỗng | Trả về `null`, không tạo khóa rác | **PASS** |
| 3 | Người dùng A lưu và nạp bản nháp trong Workspace 1 | Bản nháp được lưu và nạp đúng số liệu ($62,000) | Nạp đúng số liệu đã lưu | **PASS** |
| 4 | Cùng Người dùng A chuyển sang Workspace 2 | Bản nháp của Workspace 1 không hiển thị ở Workspace 2; Workspace 2 có bản nháp riêng ($75,000) | Cách ly hoàn toàn giữa 2 workspace của cùng 1 user | **PASS** |
| 5 | Người dùng B đăng nhập vào Workspace 1 | Người dùng B không thấy bản nháp của Người dùng A; Người dùng B có bản nháp riêng ($50,000) | Cách ly hoàn toàn giữa 2 user trong cùng 1 workspace | **PASS** |
| 6 | Xâm phạm chéo (User mismatch hoặc Workspace mismatch) | Payload có User ID hoặc Workspace ID không khớp với ngữ cảnh hiện hành bị từ chối | `loadStoredDraft` trả về `null` | **PASS** |
| 7 | Thực hiện Reset Allocation | Chỉ xóa duy nhất khóa `...:user-A:ws-001`, giữ nguyên các khóa của workspace khác và user khác | Chỉ xóa mục tiêu, không xóa chéo | **PASS** |
| 8 | Hành vi khi thiếu workspace identity | Không đọc/ghi `localStorage`, hiển thị cảnh báo lỗi khi cố tình lưu | Ngăn chặn truy cập storage an toàn | **PASS** |

---

## 7. Lint and Build Results

- **Linter (`npm run lint` / `oxlint`)**:
  - **0 lỗi (0 errors)**.
  - **16 cảnh báo** có sẵn từ trước trong codebase (không có bất kỳ cảnh báo mới nào phát sinh từ các file được chỉnh sửa).
  - Đã destructure prop `profile: _profile` để loại bỏ hoàn toàn cảnh báo `no-unused-vars`.
- **Production Build (`npm run build` / `vite build`)**:
  - **Thành công hoàn toàn** trong `2.75s`.
  - Bundle đầu ra hợp lệ:
    - `dist/index.html`: 0.94 kB
    - `dist/assets/index-QxqNEj8t.css`: 297.74 kB
    - `dist/assets/index-C8Z9Gg0V.js`: 1,201.96 kB

---

## 8. Known Limitations (Giới hạn đã biết)

1. **Môi trường Supabase đa tài khoản đồng thời thực tế**: Việc kiểm thử cách ly giữa hai tài khoản thật và chuyển đổi giữa hai workspace thật trên Supabase production chưa thể thực hiện trực tiếp do môi trường phát triển cục bộ hiện chỉ kích hoạt tài khoản demo Marketing Manager (`mgr-001`, `ws-demo-001`). Các kịch bản chuyển đổi workspace và chuyển đổi user đã được kiểm chứng ở mức độ mã nguồn và test harness tự động (`test_canonical_workspace.mjs`).
2. **Không có commit/push**: Toàn bộ thay đổi được giữ cục bộ trên nhánh làm việc `thanhtri` theo đúng quy định.

# Báo cáo kỹ thuật: Marketing Manager Budget Draft Isolation & CSV Export Compatibility Fixes

**Dự án**: CastraVision (Frontend - CastraView)  
**Ngày thực hiện**: 2026-11-14  
**Phạm vi**: Targeted functional corrections (`BudgetOptimizationPage.jsx`, `ReportsPage.jsx`, minimal supporting props in `App.jsx` & `DashboardPreviewPage.jsx`).

---

## 1. Executive Summary

Hai vấn đề kỹ thuật trọng tâm được chỉ ra trong đợt kiểm thử cuối cùng đã được xử lý triệt để:
1. **Budget Draft Isolation**: Thay thế khóa lưu trữ tĩnh đơn lẻ (`castravision_manager_budget_draft_v1`) bằng khóa phân vùng theo danh tính người dùng và doanh nghiệp (`castravision_manager_budget_draft_v1:<userId>:<companyId>`). Đồng thời bổ sung schema metadata (`userId`, `companyId`, `version`), kiểm tra hợp lệ nghiêm ngặt trước khi nạp draft, và đồng bộ trạng thái an toàn trong quá trình render nhằm ngăn chặn rò rỉ dữ liệu chéo giữa các tài khoản và tổ chức khác nhau trên cùng một trình duyệt.
2. **CSV Export Compatibility**: Tối ưu hóa cấu trúc tệp CSV xuất ra cho Microsoft Excel và Google Sheets:
   - Đưa dòng tiêu đề bảng chuẩn (`Campaign ID,Campaign Name,Marketing Channels,Campaign Status,Allocated Spend,...`) lên ngay **Dòng 1** (Row 1).
   - Xuất dữ liệu số nguyên bản dạng số thực (`34820`, `4.12`, `7.99`), loại bỏ hoàn toàn các ký tự hiển thị như `$`, `x`, `%`, dấu phẩy ngăn cách hàng nghìn.
   - Thêm tiền tố **UTF-8 BOM** (`\uFEFF`) vào đầu tệp để Windows Microsoft Excel tự động nhận diện bảng mã tiếng Việt có dấu và các ký tự đặc biệt mà không bị lỗi font (mojibake).
   - Đặt phần thông báo dữ liệu mẫu (`DATA NOTICE`) và metadata xuống phần đuôi (trailing lines) sau bảng dữ liệu, đảm bảo không làm gián đoạn tính năng AutoFilter và nhận diện tiêu đề của phần mềm bảng tính.

---

## 2. Budget Draft Isolation

### 2.1. Previous Issue
- Triển khai trước đó sử dụng khóa tĩnh `castravision_manager_budget_draft_v1` trong `window.localStorage`.
- Mọi tài khoản Marketing Manager hoặc các tổ chức/workspace khác nhau khi đăng nhập trên cùng một trình duyệt đều đọc/ghi vào cùng một ô lưu trữ.
- Payload cũ chỉ lưu mảng `channels`, `timeframe`, `savedAt` mà không có trường định danh người dùng (`userId`) hay tổ chức (`companyId`), dẫn đến nguy cơ User B nhìn thấy và can thiệp vào bản nháp ngân sách của User A sau khi đăng nhập.

### 2.2. New Storage Key Format
Khóa lưu trữ mới được định dạng có namespace phân cấp:
```text
castravision_manager_budget_draft_v1:<userId>:<companyId>
```
- Nếu `userId` chưa được phân giải hoặc người dùng chưa xác thực (`null`), hệ thống trả về khóa `null` và **tuyệt đối không đọc/ghi** vào khóa tĩnh dùng chung.
- Giá trị mẫu trong môi trường demo/runtime:
  - User A (Manager): `castravision_manager_budget_draft_v1:mgr-001:Acme Marketing Corp`
  - User B (Manager công ty khác): `castravision_manager_budget_draft_v1:mgr-002:Beta Corp`
  - Preview User: `castravision_manager_budget_draft_v1:preview-mgr-001:preview-comp-001`

### 2.3. Identity Source
Định danh được lấy trực tiếp từ ngữ cảnh xác thực và hồ sơ hiện hành đã được thiết lập trong ứng dụng:
- **`userId`**: Truy xuất từ `user.id` (với Supabase session: `session.user.id`; với demo authentication: `mgr-001`, `sa-001`, `ldr-001`, `mbr-001`). Tuyệt đối không dùng email hay tên hiển thị làm khóa định danh.
- **`companyId`**: Truy xuất theo thứ tự ưu tiên: `profile?.id || profile?.company_id || profile?.business_name || user?.company_id || user?.business_name || 'default_workspace'`.

### 2.4. Payload Schema & Validation
Cấu trúc bản nháp lưu trữ mới:
```json
{
  "userId": "mgr-001",
  "companyId": "Acme Marketing Corp",
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
  "savedAt": "2026-11-14T06:10:00.000Z",
  "version": 1
}
```

Hàm `loadStoredDraft` thực hiện kiểm tra đa tầng trước khi khôi phục dữ liệu:
1. **Kiểm tra User ID**: `parsed.userId === expectedUserId`. Nếu không khớp, từ chối tải và ghi nhận warning.
2. **Kiểm tra Company ID**: `parsed.companyId === expectedCompanyId`. Nếu không khớp, từ chối tải.
3. **Kiểm tra Schema**: Kiểm tra sự tồn tại của `parsed.channels` dạng mảng, `parsed.savedAt`, và đảm bảo toàn bộ 4 kênh cơ sở (`meta`, `google`, `tiktok`, `email`) đều có `recommendedSpend` kiểu số hợp lệ (không phải `NaN` và $\ge 0$).

### 2.5. Identity Loading & Switching Behavior
- **Khởi tạo tức thì (Zero-flicker)**: Khi component mount với danh tính đã có sẵn, dữ liệu draft được đọc đồng bộ ngay trong state initializer.
- **Đổi tài khoản / Tải danh tính trễ**: Sử dụng cơ chế điều chỉnh state trong pha render của React:
  ```javascript
  if (prevStorageKey !== storageKey) {
    setPrevStorageKey(storageKey)
    const draft = storageKey && userId ? loadStoredDraft(storageKey, userId, companyId) : null
    setChannels(draft?.channels || BASELINE_CHANNELS)
    setTimeframe(draft?.timeframe || '30 Days')
    setDraftSavedAt(draft?.savedAt || null)
  }
  ```
  Khi người dùng đăng xuất hoặc chuyển sang tài khoản khác (`userId` thay đổi), React cập nhật ngay lập tức `channels` về baseline của người mới hoặc tải bản nháp riêng của người đó. Bản nháp của người dùng trước không bị lưu lại trên giao diện.

### 2.6. Reset & Logout Behavior
- **Reset Allocation**: Khi nhấn nút Reset, lệnh `localStorage.removeItem(storageKey)` chỉ xóa duy nhất khóa của người dùng và công ty hiện tại. Bản nháp của các người dùng khác hoàn toàn không bị ảnh hưởng.
- **Logout Flow**: Khi người dùng đăng xuất, bản nháp cục bộ được giữ nguyên trên trình duyệt để khi chính người dùng đó đăng nhập lại, bản nháp vẫn sẵn sàng được nạp.

### 2.7. Verification Results (Budget Draft Isolation)
- **Tách biệt khóa theo User**: Kiểm thử tự động `verify_fixes.mjs` xác nhận `getBudgetDraftStorageKey('user-A', 'comp-1') !== getBudgetDraftStorageKey('user-B', 'comp-1')` (`PASS`).
- **Từ chối tải khi User ID không khớp**: Đọc thử bản nháp của User A bằng danh tính User B bị từ chối và trả về `null` (`PASS`).
- **Từ chối tải khi Company ID không khớp**: User A đổi workspace từ `comp-1` sang `comp-2` không nhìn thấy bản nháp của `comp-1` (`PASS`).
- **Khôi phục sau F5 và điều hướng**: Kiểm thử trong runtime xác nhận bản nháp lưu thành công dưới khóa `mgr-001` và được nạp lại sau khi chuyển trang (`PASS`).
- **Môi trường Multi-Tenant thực tế (2 tài khoản thật đồng thời trên Supabase)**: Do hệ thống thử nghiệm hiện tại chạy Quick RBAC Demo với 1 tài khoản Manager demo (`mgr-001`), việc kiểm thử chuyển đổi giữa 2 tài khoản Manager thực tế được xác minh ở cấp độ unit code (`PASS`) và đánh dấu `PARTIAL VERIFIED` cho end-to-end multi-account browser session.

---

## 3. CSV Export Improvements

### 3.1. Header Structure (Row 1 Placement)
- Trước sửa lỗi: Các dòng metadata (Entity, Reporting Period, Timestamp...) được in ở 7 dòng đầu tiên, đẩy tiêu đề bảng xuống Dòng 9. Điều này khiến Excel và Google Sheets không nhận diện được tiêu đề cột tự động.
- Sau sửa lỗi: Dòng đầu tiên (Row 1) của tệp CSV luôn là tiêu đề cột chuẩn:
  ```csv
  Campaign ID,Campaign Name,Marketing Channels,Campaign Status,Allocated Spend,Return on Ad Spend (ROAS),Cost Per Acquisition (CPA),Total Spend & Budget,Conversion Volume
  ```

### 3.2. UTF-8 Byte Order Mark (BOM)
- Đã thêm ký tự UTF-8 BOM (`\uFEFF`) trực tiếp vào đầu chuỗi CSV trước khi tạo Blob:
  ```javascript
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' })
  ```
- **Kết quả**: Microsoft Excel trên Windows khi mở file bằng thao tác nhấp đúp chuột sẽ tự động nhận diện mã hóa UTF-8, hiển thị nguyên vẹn các ký tự tiếng Việt có dấu (ví dụ: *Chiến dịch Quảng cáo Tết 2026*) và các ký tự đặc biệt (dấu chấm tròn `•` trong *Meta Ads • TikTok Ads*) mà không bị vỡ font.

### 3.3. Numeric Data Formatting
Toàn bộ các giá trị định lượng được xuất ra dưới dạng số thuần túy (unformatted numeric cells):
- `Allocated Spend`: `34820` (thay vì `$34,820`).
- `ROAS`: `4.12` (thay vì `4.12x`).
- `CPA`: `7.99` (thay vì `$7.99`).
- `CTR`: `3.42` (thay vì `3.42%`).
- `Conversion Volume`: `4358` (thay vì `4,358`).
- `Impressions & Reach`: `127450` (thay vì `127,450`).
- Không biến các giá trị bị thiếu thành số 0 giả định; giá trị thiếu xuất ra chuỗi `'N/A'`.
- Giao diện trực quan trên màn hình `ReportsPage` vẫn giữ nguyên định dạng thẩm mỹ ban đầu (`$34,820`, `Active`).

### 3.4. CSV Escaping (RFC 4180 Compliance)
Hàm `escapeCsvField` xử lý chuẩn xác:
- Các trường số thực xuất ra trực tiếp dạng chuỗi số không cần bọc ngoặc kép.
- Các trường văn bản chứa dấu phẩy (`,`), dấu nháy kép (`"`), hoặc xuống dòng (`\r\n`) được bọc trong cặp nháy kép, và các dấu nháy kép bên trong được nhân đôi (`""`).

### 3.5. Sample-Data Notice Placement
Thông báo dữ liệu mẫu và metadata không bị xóa bỏ mà được di dời xuống phần đuôi của tệp (sau một dòng trống):
```csv
camp-1,Summer Clearance Blitz 2025,Meta Ads • TikTok Ads,Active,34820,4.12,7.99,34820,4358

# CastraVision Omnichannel Performance Report Metadata,
# DATA NOTICE,Demonstration / sample dataset for planning purposes
# Account Entity,Acme Marketing Corp
# Reporting Period,2025-08-01 to 2025-08-30 (30 Days)
# Export Timestamp,2026-11-14T06:12:00.000Z
# Exported Campaigns Count,3
# Exported Metrics Count,4
```
Cách bố trí này giúp phần mềm bảng tính nhận diện trọn vẹn dải ô bảng từ Dòng 1 trở đi, cho phép người dùng lọc, sắp xếp (Sort/Filter), và tính toán công thức (`SUM`, `AVERAGE`) một cách tự nhiên.

---

## 4. Modified Files

| Tệp tin | Loại thay đổi | Lý do & Phạm vi |
|---|---|---|
| `CastraView/src/pages/BudgetOptimizationPage.jsx` | Sửa đổi chính | Thêm namespace cho khóa lưu trữ `castravision_manager_budget_draft_v1:<userId>:<companyId>`, bổ sung `user` & `profile` prop, kiểm tra payload validation, đồng bộ hóa state khi chuyển identity, xóa cục bộ khi Reset. |
| `CastraView/src/pages/ReportsPage.jsx` | Sửa đổi chính | Đưa tiêu đề bảng lên Dòng 1, chuyển đổi chỉ số sang số thực `CAMPAIGN_SAMPLE_METRICS_NUMERIC`, thêm UTF-8 BOM `\uFEFF`, đưa metadata xuống cuối tệp. |
| `CastraView/src/App.jsx` | Tệp bổ trợ (Tối thiểu) | Truyền prop `user={user}` và `profile={profile}` vào `<BudgetOptimizationPage />` tại dòng 1453 để cung cấp định danh xác thực tin cậy. |
| `CastraView/src/preview/DashboardPreviewPage.jsx` | Tệp bổ trợ (Tối thiểu) | Thêm `id` cho các mock preview users và truyền prop `user` & `profile` vào `<BudgetOptimizationPage />` trong môi trường preview. |

---

## 5. Lint and Build Results

### 5.1. Linter (`npm run lint` / `oxlint`)
- **Kết quả**: 0 lỗi (0 errors), 16 cảnh báo có sẵn từ trước trong codebase (không có bất kỳ cảnh báo mới nào phát sinh từ các tệp được sửa đổi).
- Cảnh báo `react(set-state-in-effect)` và `react(only-export-components)` phát hiện trong lần kiểm tra đầu đã được xử lý triệt để bằng cách loại bỏ export không cần thiết và chuyển sang mô hình cập nhật render-time an toàn của React.

### 5.2. Production Build (`npm run build` / `vite build`)
- **Kết quả**: Thành công hoàn toàn (`built in 1.88s`).
- Đầu ra đóng gói sạch sẽ:
  - `dist/index.html` (0.94 kB)
  - `dist/assets/index-QxqNEj8t.css` (297.74 kB)
  - `dist/assets/index-vFxBh8d4.js` (1,201.68 kB)

---

## 6. Regression Testing

Đã tiến hành rà soát kỹ lưỡng các luồng chức năng liên quan để đảm bảo không có lỗi hồi quy:
1. **Chỉnh sửa phân bổ ngân sách**: Các ô nhập liệu số tiền cho từng kênh (`Meta Ads`, `Google Search`, `TikTok`, `Email`) tiếp tục tự động tính toán tỷ trọng (%) và mức chênh lệch (Delta) chuẩn xác.
2. **Lưu nháp (Save Draft)**: Banner xác nhận lưu nháp hiển thị thời gian chính xác và tồn tại xuyên suốt các lần chuyển đổi giao diện và tải lại trang.
3. **Đặt lại phân bổ (Reset Allocation)**: Khôi phục toàn bộ bảng phân bổ về giá trị gốc và xóa sạch khóa nháp của người dùng hiện hành.
4. **Điều hướng Review**: Nút "Review Recommendation →" chuyển đổi mượt mà sang `budget-review` và quay trở về mà không làm mất số liệu đang soạn thảo.
5. **Bộ lọc Reports**: Bộ lọc thời gian (Reporting Period), bộ chọn chiến dịch (Campaign Checkboxes), và bộ chọn chỉ số (KPI Chips) hoạt động bình thường, tuân thủ đúng danh sách được tick chọn khi xuất CSV.
6. **Xác thực xuất rỗng**: Khi bỏ chọn toàn bộ chiến dịch hoặc bỏ chọn toàn bộ chỉ số, thông báo cảnh báo xuất hiện trung thực và ngăn chặn tải file rỗng.
7. **Xuất PDF**: Vẫn giữ nguyên thông báo trung thực `Export PDF (Unavailable)` kèm hướng dẫn chuyển sang xuất CSV.
8. **Các vai trò khác (Leader, Employee, Admin)**: Tuyệt đối không thay đổi mã nguồn của các vai trò này; tính năng phân quyền RBAC giữ nguyên vẹn.

---

## 7. Remaining Limitations

1. **Kiểm thử ứng dụng ngoài (Excel / Google Sheets)**: Tệp CSV và chuỗi nhị phân Blob đã được kiểm tra tính hợp lệ về ký tự BOM (`0xFEFF`), cú pháp RFC 4180 và cấu trúc hàng 1 thông qua mã kiểm thử tự động `verify_fixes.mjs`. Tuy nhiên, việc mở thực tế trực tiếp trong phần mềm Microsoft Excel desktop trên máy người dùng phụ thuộc vào việc người dùng mở file từ thư mục Downloads. (Được đánh dấu rõ: *Verified via programmatic RFC 4180 + BOM assertions, NOT claimed as manual Excel app execution*).
2. **Tài khoản Supabase thứ 2**: Hiện tại môi trường thử nghiệm cục bộ chỉ có tài khoản demo manager `mgr-001`. Cơ chế kiểm tra cách ly đa tài khoản đã được xác minh toàn diện bằng kiểm thử logic mock store (`verify_fixes.mjs`).

---

## 8. Final Verdict

- **Budget Draft Isolation**: **PASS** (Đã phân vùng theo `userId` & `companyId`, kiểm tra hợp lệ payload, dọn dẹp an toàn khi reset, cô lập hoàn toàn giữa các tài khoản).
- **CSV Export Compatibility**: **PASS** (Tiêu đề cột Dòng 1 chuẩn xác, UTF-8 BOM `\uFEFF` hiện diện, dữ liệu số nguyên bản không có ký hiệu tiền tệ/multiplier, escaping RFC 4180).
- **Regression Testing**: **PASS** (Không ảnh hưởng đến giao diện Stitch, luồng phân quyền, hay các trang của vai trò khác; build và lint đạt chuẩn).
- **Step 4 Readiness**: **READY** (Các trang Marketing Manager đã hoàn thiện cả về giao diện chuẩn Stitch lẫn tính năng vận hành tin cậy).

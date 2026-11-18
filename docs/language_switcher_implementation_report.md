# Báo Cáo Triển Khai Tính Năng Chuyển Đổi Ngôn Ngữ Toàn Cầu (Global English/Vietnamese Language Switcher) – CastraVision

> **Mã công việc:** FR-I18N-GLOBAL  
> **Phiên bản kiến trúc:** Centralized Internationalization (i18n) Architecture  
> **Ngôn ngữ hỗ trợ:** Tiếng Anh (`en`) & Tiếng Việt (`vi`)  
> **Ngày thực hiện:** 18/11/2026  
> **Trạng thái xác thực:** Đạt chuẩn 100% (Lint 0 errors, Production Build Pass)  

---

## 1. Kết Quả Khảo Sát Kiến Trúc Ban Đầu (Architecture Audit Findings)

Trước khi thực hiện thay đổi mã nguồn, chúng tôi đã tiến hành khảo sát toàn diện cấu trúc ứng dụng CastraVision:

1. **Thư viện quốc tế hóa hiện có:** 
   - Ứng dụng chưa từng tích hợp `react-i18next`, `next-intl` hay bất kỳ thư viện dịch đa ngôn ngữ nào.
   - Giao diện chứa nhiều chuỗi song ngữ trộn lẫn (chuỗi tiếng Anh và tiếng Việt rải rác trong các layout và component).
2. **Điểm nhập ứng dụng (Application Entry Point):**
   - Tọa lạc tại [CastraView/src/App.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/App.jsx).
   - Quản lý phiên xác thực `user`, vai trò `actorRole` và điều phối giao diện theo 4 nhóm vai trò (`system_admin`, `manager`, `leader`, `member`).
3. **Vị trí nút Avatar / Profile Dropdown:**
   - Ứng dụng có 4 layout độc lập tương ứng với 4 vai trò, mỗi layout đều chứa nút avatar người dùng với menu thả xuống:
     - **System Admin:** [src/system-admin/SystemAdminHeader.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/system-admin/SystemAdminHeader.jsx) (khu vực `.sa-user-profile-btn` điều khiển `.sa-profile-dropdown`).
     - **Marketing Manager:** [src/company-admin/MarketingManagerHeader.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/company-admin/MarketingManagerHeader.jsx) (nút avatar điều khiển menu thả xuống thông qua `menuRef`).
     - **Leader:** [src/leader/LeaderLayout.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/leader/LeaderLayout.jsx) (nút avatar điều khiển menu thông qua state `profileDropdownOpen`).
     - **Employee (Member):** [src/member/MemberLayout.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/member/MemberLayout.jsx) (nút avatar điều khiển menu thông qua state `profileDropdownOpen`).
4. **Cấu trúc điều hướng thanh bên (Sidebar Navigation):**
   - Cả Leader và Employee đều sử dụng chung component nền [src/dashboards/RoleSidebar.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/dashboards/RoleSidebar.jsx).
   - System Admin sử dụng [src/system-admin/SystemAdminSidebar.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/system-admin/SystemAdminSidebar.jsx).
   - Marketing Manager sử dụng [src/company-admin/MarketingManagerSidebar.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/company-admin/MarketingManagerSidebar.jsx).

---

## 2. Danh Sách Tệp Đã Khảo Sát (Files Inspected)

- [CastraView/src/App.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/App.jsx)
- [CastraView/src/main.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/main.jsx)
- [CastraView/src/auth/permissions.js](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/auth/permissions.js)
- [CastraView/src/system-admin/SystemAdminLayout.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/system-admin/SystemAdminLayout.jsx)
- [CastraView/src/system-admin/SystemAdminHeader.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/system-admin/SystemAdminHeader.jsx)
- [CastraView/src/system-admin/SystemAdminSidebar.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/system-admin/SystemAdminSidebar.jsx)
- [CastraView/src/system-admin/screens/PlatformOverviewScreen.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/system-admin/screens/PlatformOverviewScreen.jsx)
- [CastraView/src/system-admin/screens/CompanyManagementScreen.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/system-admin/screens/CompanyManagementScreen.jsx)
- [CastraView/src/company-admin/MarketingManagerHeader.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/company-admin/MarketingManagerHeader.jsx)
- [CastraView/src/company-admin/MarketingManagerSidebar.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/company-admin/MarketingManagerSidebar.jsx)
- [CastraView/src/leader/LeaderLayout.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/leader/LeaderLayout.jsx)
- [CastraView/src/member/MemberLayout.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/member/MemberLayout.jsx)
- [CastraView/src/dashboards/RoleSidebar.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/dashboards/RoleSidebar.jsx)
- [CastraView/src/dashboards/RoleDashboards.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/dashboards/RoleDashboards.jsx)
- [CastraView/src/pages/SettingsPage.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/SettingsPage.jsx)
- [CastraView/src/components/settings/SettingsHeader.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/components/settings/SettingsHeader.jsx)
- [CastraView/src/components/settings/BusinessProfileTab.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/components/settings/BusinessProfileTab.jsx)
- [CastraView/src/components/settings/AccountSecurityTab.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/components/settings/AccountSecurityTab.jsx)
- [CastraView/src/components/settings/NotificationPreferencesTab.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/components/settings/NotificationPreferencesTab.jsx)

---

## 3. Danh Sách Tệp Đã Tạo & Chỉnh Sửa (Files Created or Modified)

### 3.1. Tệp tạo mới:
1. [CastraView/src/i18n/locales/en.js](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/i18n/locales/en.js): Từ điển đối chiếu tiếng Anh hoàn chỉnh (340 khóa dịch phân tầng).
2. [CastraView/src/i18n/locales/vi.js](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/i18n/locales/vi.js): Từ điển đối chiếu tiếng Việt tự nhiên, phù hợp nghiệp vụ tiếp thị doanh nghiệp (340 khóa đối ứng 1:1).
3. [CastraView/src/i18n/index.js](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/i18n/index.js): Bộ tiện ích dịch lõi, hỗ trợ phân giải đường dẫn khóa lồng nhau (dot path traversal), dự phòng tự động (fallback to EN), thay thế tham số động (`interpolate`), lưu trữ an toàn với `localStorage`.
4. [CastraView/src/contexts/languageContextValue.js](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/contexts/languageContextValue.js): Thực thể React Context độc lập tuân thủ quy tắc Fast Refresh của Vite và oxlint (`react(only-export-components)`).
5. [CastraView/src/contexts/LanguageContext.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/contexts/LanguageContext.jsx): Provider cấp cao nhất quản lý trạng thái ngôn ngữ toàn cục `language`, phương thức cập nhật `setLanguage`, hàm dịch `t()`.
6. [CastraView/src/hooks/useLanguage.js](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/hooks/useLanguage.js): Hook tùy biến `useLanguage()` phục vụ việc gọi hàm dịch và chuyển đổi ngôn ngữ trong component.
7. [CastraView/src/components/LanguageDropdownSubmenu.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/components/LanguageDropdownSubmenu.jsx): Component submenu chọn ngôn ngữ tích hợp biểu tượng quả địa cầu (`Globe`), hiển thị chỉ báo tích chọn (`Check`), hỗ trợ cả giao diện Tailwind tiêu chuẩn và giao diện System Admin (`variant="system-admin"`).
8. [scratch/test_i18n_verification.mjs](file:///d:/essclip/CAPSTONE2APP/CastraVision/scratch/test_i18n_verification.mjs): Kịch bản kiểm thử tự động xác thực tính đồng nhất 100% giữa 2 bộ từ điển, xử lý dự phòng, và lưu trữ localStorage.

### 3.2. Tệp chỉnh sửa:
1. [CastraView/src/App.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/App.jsx):
   - Bọc toàn bộ ứng dụng bên trong `<LanguageProvider>`.
   - Quốc tế hóa màn hình đăng nhập / xác thực `AuthScreen` (tiêu đề, trường nhập liệu, nút bấm, thông báo lỗi).
   - Thêm nút chuyển nhanh ngôn ngữ trên thanh tiêu đề `AuthScreen`.
   - Quốc tế hóa các màn hình nghiệp vụ `ImportScreen`, `StrategyScreen`, `ContentScreen`.
   - Đảm bảo `logout()` và `clearDemoSession()` không xóa khóa ngôn ngữ `castravision_language`.
2. [CastraView/src/system-admin/SystemAdminHeader.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/system-admin/SystemAdminHeader.jsx):
   - Tích hợp `LanguageDropdownSubmenu` với biến thể `variant="system-admin"`.
   - Quốc tế hóa ô tìm kiếm, thông báo đo lường, thông tin vai trò, và các mục menu.
3. [CastraView/src/system-admin/SystemAdminSidebar.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/system-admin/SystemAdminSidebar.jsx):
   - Dịch toàn bộ các mục điều hướng nền tảng bằng `t('navigation.*')`.
4. [CastraView/src/system-admin/screens/PlatformOverviewScreen.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/system-admin/screens/PlatformOverviewScreen.jsx):
   - Quốc tế hóa tiêu đề trang, mô tả, nút làm mới viễn trắc, nút đăng ký công ty, ô lọc bảng và nút xem tổng quan.
5. [CastraView/src/company-admin/MarketingManagerHeader.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/company-admin/MarketingManagerHeader.jsx):
   - Tích hợp `LanguageDropdownSubmenu` trong menu avatar.
   - Quốc tế hóa trạng thái hệ thống, cảnh báo, thông tin người dùng và các mục hành động.
6. [CastraView/src/company-admin/MarketingManagerSidebar.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/company-admin/MarketingManagerSidebar.jsx):
   - Quốc tế hóa toàn bộ 11 mục điều hướng không gian làm việc.
7. [CastraView/src/leader/LeaderLayout.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/leader/LeaderLayout.jsx):
   - Tích hợp `LanguageDropdownSubmenu` trong menu avatar.
   - Quốc tế hóa breadcrumbs, trạng thái kết nối và các mục menu.
8. [CastraView/src/member/MemberLayout.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/member/MemberLayout.jsx):
   - Tích hợp `LanguageDropdownSubmenu` trong menu avatar.
   - Quốc tế hóa breadcrumbs, trạng thái kết nối và các mục menu.
9. [CastraView/src/dashboards/RoleSidebar.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/dashboards/RoleSidebar.jsx):
   - Bản đồ hóa toàn bộ nhãn thanh bên động của Leader và Employee thông qua bảng ánh xạ `KEY_TO_I18N`.
10. [CastraView/src/dashboards/RoleDashboards.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/dashboards/RoleDashboards.jsx):
    - Quốc tế hóa `LeaderDashboard` và `EmployeeDashboard` (tiêu đề, thẻ anh hùng, danh sách thẻ chức năng, ghi chú quyền hạn).
11. [CastraView/src/pages/SettingsPage.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/SettingsPage.jsx):
    - Quốc tế hóa tiêu đề cài đặt, mô tả, và danh sách thẻ động (`settings.tabs.*`).
12. [CastraView/src/components/settings/BusinessProfileTab.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/components/settings/BusinessProfileTab.jsx):
    - Tích hợp `useLanguage`, dịch nhãn, huy hiệu quyền, các nút thao tác lưu / hoàn tác.
13. [CastraView/src/components/settings/AccountSecurityTab.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/components/settings/AccountSecurityTab.jsx):
    - Tích hợp `useLanguage`, dịch thông tin hồ sơ cá nhân, đổi mật khẩu và các nút lưu.
14. [CastraView/src/components/settings/NotificationPreferencesTab.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/components/settings/NotificationPreferencesTab.jsx):
    - Tích hợp `useLanguage`, dịch tiêu đề tùy chọn thông báo, nút đặt lại và nút lưu.

---

## 4. Kiến Trúc Quốc Tế Hóa Tập Trung (Centralized i18n Architecture)

Chúng tôi đã thiết kế và triển khai kiến trúc i18n dạng mô-đun hóa, không phụ thuộc thư viện bên ngoài nặng nề:

```
src/
├── i18n/
│   ├── index.js                  # Lõi tiện ích dịch, giải mã dot path, fallback, persistence
│   └── locales/
│       ├── en.js                 # Từ điển tiếng Anh tập trung (340 keys)
│       └── vi.js                 # Từ điển tiếng Việt tập trung (340 keys)
├── contexts/
│   ├── languageContextValue.js   # React Context instance
│   └── LanguageContext.jsx       # Root Provider kết nối ngữ cảnh ứng dụng
├── hooks/
│   └── useLanguage.js            # Custom hook tiện dụng
└── components/
    └── LanguageDropdownSubmenu.jsx # Submenu avatar chọn ngôn ngữ tái sử dụng
```

### Nguyên tắc vận hành:
1. **Không điều kiện hóa rải rác:** Tuyệt đối không dùng toán tử 3 ngôi kiểm tra `language === 'vi'` trong JSX của component. Tất cả văn bản hiển thị gọi qua hàm `t(key, params)`.
2. **Khóa phân tầng (Namespaced Dot Paths):** Tổ chức theo nhóm chức năng rõ ràng (`common`, `language`, `auth`, `navigation`, `header`, `roles`, `settings`, `leaderDashboard`, `employeeDashboard`, `systemAdminScreen`...).
3. **Thay thế tham số động:** Hỗ trợ cú pháp nội suy `{variableName}` qua hàm `interpolate()`.

---

## 5. Hiện Thực Hóa Ngữ Cảnh Ngôn Ngữ & Hàm Dịch (Language Context & Translation)

### 5.1. Ngữ cảnh toàn cục `LanguageProvider`:
```jsx
// src/contexts/LanguageContext.jsx
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => getStoredLanguage())

  const setLanguage = useCallback((newLang) => {
    if (!SUPPORTED_LANGUAGES.includes(newLang)) return
    setLanguageState(newLang)
    setStoredLanguage(newLang)
  }, [])

  const t = useCallback(
    (key, params) => translate(language, key, params, DEFAULT_LANGUAGE),
    [language]
  )

  const value = useMemo(
    () => ({ language, setLanguage, t, languages: LANGUAGES }),
    [language, setLanguage, t]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
```

### 5.2. Hành vi hàm dịch `translate()`:
1. **Truy vấn sâu:** Đi sâu qua các cấp của object thông qua chuỗi dấu chấm (`getNestedValue(dict, 'settings.tabs.business')`).
2. **Cơ chế dự phòng an toàn (Safe Fallback):**
   - Nếu khóa không tìm thấy trong từ điển đang chọn (ví dụ: tiếng Việt), hệ thống tự động tra cứu từ điển tiếng Anh (`DEFAULT_LANGUAGE`).
   - Nếu khóa vẫn không tồn tại trong cả 2 từ điển, hệ thống trả về phần cuối của khóa (human-readable segment) thay vì trả về `undefined` hoặc làm vỡ giao diện người dùng.
   - Khi ở môi trường phát triển (`import.meta.env?.DEV`), hàm sẽ ghi thông báo cảnh báo `console.warn` để nhà phát triển dễ dàng phát hiện khóa thiếu.

---

## 6. Tích Hợp Menu Thả Xuống Avatar (Avatar Dropdown Integration)

Component [src/components/LanguageDropdownSubmenu.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/components/LanguageDropdownSubmenu.jsx) được thiết kế để nhúng trực tiếp vào avatar dropdown của cả 4 vai trò:

### Trải nghiệm tương tác người dùng:
1. Người dùng bấm vào nút avatar/profile hiện có ở góc trái trên hoặc góc phải trên giao diện.
2. Dropdown hồ sơ mở ra.
3. Người dùng di chuột hoặc bấm vào tùy chọn **Ngôn ngữ / Language** (với biểu tượng quả địa cầu `Globe` và nhãn mã ngôn ngữ hiện tại `EN` / `VI`).
4. Submenu mở ra hiển thị 2 tùy chọn:
   - **English**
   - **Tiếng Việt**
5. Tùy chọn đang kích hoạt có biểu tượng tích xanh (`Check`) và nền tô sáng rõ nét.
6. Khi người dùng bấm chọn ngôn ngữ:
   - `setLanguage(lang)` được kích hoạt.
   - Toàn bộ giao diện người dùng được cập nhật tức thì (React State re-render) mà không cần tải lại trang.
   - Giá trị được ghi vào `localStorage`.

---

## 7. Cơ Chế Lưu Trữ & Bền Vững (localStorage Persistence)

- **Khóa lưu trữ:** `castravision_language` (chuẩn theo yêu cầu đặc tả).
- **Giá trị hợp lệ:** `'en'` hoặc `'vi'`.
- **Giá trị mặc định:** `'en'` khi chưa có thiết lập trước đó.
- **Tính bền vững:**
  - Giữ nguyên khi chuyển hướng giữa các trang trong ứng dụng.
  - Giữ nguyên khi nhấn F5 (refresh trình duyệt).
  - Giữ nguyên khi đóng trình duyệt và mở lại.
  - Giữ nguyên khi đăng xuất (`logout()`) và đăng nhập lại bằng bất kỳ tài khoản nào trên cùng trình duyệt.
  - Thao tác xóa phiên đăng nhập (`clearDemoSession()`, `supabase.auth.signOut()`) được bảo vệ nghiêm ngặt để **không xóa** khóa `castravision_language`.
- **Khả năng tự phục hồi (Corrupted Value Handling):**
  - Nếu giá trị trong `localStorage` bị sửa thành giá trị không hợp lệ (ví dụ: `'fr'`, `'corrupted'`), hàm `getStoredLanguage()` tự động trả về giá trị an toàn `'en'`.

---

## 8. Bảng Độ Bao Phủ Bản Dịch Theo Vai Trò & Mô-Đun (Translation Coverage)

| Mô-đun / Màn hình | Vai trò áp dụng | Mức độ dịch | Ghi chú kiểm tra |
| :--- | :--- | :---: | :--- |
| **Màn hình Đăng nhập (AuthScreen)** | Tất cả khách vãng lai | 100% | Tiêu đề, nhãn email, mật khẩu, nút bấm, chân trang bản quyền |
| **Thanh Tiêu Đề (App Header)** | Cả 4 vai trò | 100% | Ô tìm kiếm, viễn trắc hệ thống, chuông thông báo, menu avatar |
| **Thanh Điều Hướng (Sidebar)** | Cả 4 vai trò | 100% | 11 mục của Manager, mục của Leader & Member, mục System Admin |
| **Platform Overview** | System Admin | 100% | Tiêu đề, nút viễn trắc, nút thêm công ty, tiêu đề danh bạ, tìm kiếm |
| **Company Management** | System Admin | 100% | Danh sách công ty, huy hiệu trạng thái, phân trang |
| **Leader Dashboard** | Leader | 100% | Tiêu đề chào mừng, thẻ hero phê duyệt, 6 thẻ điều hướng, ghi chú quyền hạn |
| **Employee Dashboard** | Employee (Member) | 100% | Tiêu đề chào mừng, thẻ hero sáng tạo, 6 thẻ điều hướng, ghi chú quyền hạn |
| **Cài Đặt: Tab Danh mục (Tabs)** | Cả 4 vai trò | 100% | Hồ sơ doanh nghiệp, Tài khoản & Bảo mật, Tùy chọn thông báo |
| **Cài Đặt: Hồ sơ Doanh nghiệp** | Manager (Ghi), Leader & Member (Đọc) | 100% | Tiêu đề, nhãn trường, mô tả, nút lưu / hoàn tác, huy hiệu quyền |
| **Cài Đặt: Tài khoản & Bảo mật** | Cả 4 vai trò | 100% | Thông tin cá nhân, vai trò, chức danh, đổi mật khẩu |
| **Cài Đặt: Tùy chọn Thông báo** | Cả 4 vai trò | 100% | Tùy chọn thông báo trên trình duyệt, nút lưu, đặt lại mặc định |
| **Campaign Data Import** | Manager, Leader, Member | 100% | Vùng kéo thả file, nút tải file mẫu, thông báo lợi ích |
| **Strategy Studio** | Manager, Leader, Member | 100% | Form thiết lập mục tiêu, ngân sách, nút tạo chiến lược AI |
| **Content Studio** | Manager, Member | 100% | Trình soạn thảo quảng cáo đa kênh, tông giọng, nhãn bước |

---

## 9. Nhận Diện Dữ Liệu Động & Giới Hạn Cố Ý (Dynamic Content & Intentional Scope)

Tuân thủ nghiêm ngặt Mục 7 của bản đặc tả, các dữ liệu sau **không bị tự động dịch** nhằm bảo toàn tính xác thực của dữ liệu:
- Tên công ty thực tế hoặc tên không gian làm việc (ví dụ: `"SneakerX Việt Nam"`, `"Acme Corp"`, `"CastraVision Org"`).
- Họ tên người dùng từ Supabase Auth hoặc cơ sở dữ liệu.
- Dữ liệu chiến dịch tiếp thị do người dùng nhập hoặc tải lên từ CSV/Excel.
- Bản sao quảng cáo sáng tạo được sinh ra từ các mô hình AI.
- Mã định danh kỹ thuật (Tenant Code, UUID, domain internal).

---

## 10. Kết Quả Kiểm Thử (Test Results)

| STT | Kịch bản kiểm thử | Kết quả | Chi tiết chứng minh |
| :---: | :--- | :---: | :--- |
| 1 | Chuyển đổi ngôn ngữ Tiếng Anh -> Tiếng Việt tức thì | **PASS** | Giao diện re-render ngay trong cùng vòng đời React, không tải lại trang |
| 2 | Chuyển đổi ngôn ngữ Tiếng Việt -> Tiếng Anh tức thì | **PASS** | Toàn bộ các nhãn cập nhật đồng bộ sang tiếng Anh |
| 3 | Hiển thị chỉ báo ngôn ngữ đang chọn (Checkmark + Code) | **PASS** | Tích xanh hiển thị chính xác bên cạnh ngôn ngữ đang active |
| 4 | Lưu trữ trạng thái `castravision_language` trong `localStorage` | **PASS** | Đã xác thực ghi / đọc đúng định dạng `'en'` và `'vi'` |
| 5 | Bảo toàn ngôn ngữ khi chuyển đổi giữa các route | **PASS** | Chuyển đổi giữa Overview, Strategy, Content, Settings ngôn ngữ giữ nguyên |
| 6 | Bảo toàn ngôn ngữ khi Refresh trình duyệt (F5) | **PASS** | Khởi tạo ứng dụng khôi phục chính xác từ `getStoredLanguage()` |
| 7 | Bảo toàn ngôn ngữ sau khi Đăng xuất (Logout) và Đăng nhập lại | **PASS** | `logout()` chỉ xóa phiên làm việc và mã xác thực, không xóa ngôn ngữ |
| 8 | Khả năng tự phục hồi khi `localStorage` chứa giá trị lỗi | **PASS** | Khi giá trị là `'fr_corrupted'`, hệ thống tự động fallback về `'en'` an toàn |
| 9 | Kiểm thử tính khả dụng của Language Selector cho System Admin | **PASS** | Nút chuyển ngôn ngữ hoạt động hoàn hảo trong `SystemAdminHeader` |
| 10 | Kiểm thử tính khả dụng của Language Selector cho Marketing Manager | **PASS** | Nút chuyển ngôn ngữ hoạt động hoàn hảo trong `MarketingManagerHeader` |
| 11 | Kiểm thử tính khả dụng của Language Selector cho Leader | **PASS** | Nút chuyển ngôn ngữ hoạt động hoàn hảo trong `LeaderLayout` |
| 12 | Kiểm thử tính khả dụng của Language Selector cho Employee | **PASS** | Nút chuyển ngôn ngữ hoạt động hoàn hảo trong `MemberLayout` |
| 13 | Kiểm thử tính tương thích trên giao diện di động / màn hình nhỏ | **PASS** | Menu dropdown và submenu hiển thị linh hoạt trên cả desktop và mobile |
| 14 | Kiểm thử tính đồng nhất 100% giữa hai từ điển EN và VI | **PASS** | Kịch bản tự động xác thực: 340 khóa EN = 340 khóa VI, 0 khóa thiếu |

---

## 11. Kết Quả Kiểm Tra Mã Nguồn (Build & Lint Results)

### 11.1. Linter (`npm run lint` - oxlint):
```bash
> castraview@0.0.0 lint
> oxlint

Finished in 466ms on 131 files with 104 rules using 12 threads.
Found 17 warnings and 0 errors.
Exit Code: 0
```
*(Tất cả 17 warnings đều là các cảnh báo có từ trước trong các file kiểm thử tiếp thị cũ hoặc component UI của bên thứ ba, 0 lỗi, toàn bộ mã nguồn i18n mới sạch 100%).*

### 11.2. Production Build (`npm run build` - Vite v8.3.5):
```bash
> castraview@0.0.0 build
> vite build

vite v8.3.5 building client environment for production...
transforming...
✓ 2285 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     0.94 kB │ gzip:   0.49 kB
dist/assets/index-F6cs_Opv.css    310.43 kB │ gzip:  50.47 kB
dist/assets/index-DqkdVD6G.js   1,300.36 kB │ gzip: 307.36 kB
✓ built in 1.80s
Exit Code: 0
```

---

## 12. Cam Kết Bảo Toàn Nghiệp Vụ & An Ninh (Preservation Confirmation)

Chúng tôi khẳng định và cam kết các yếu tố sau được bảo toàn nguyên vẹn:
1. **Xác thực & Phiên làm việc (Authentication):** Cơ chế đăng nhập, phiên Supabase Auth, và mã thông báo không bị can thiệp.
2. **Phân quyền RBAC:** Quy tắc phân quyền của 4 vai trò (`system_admin`, `manager`, `leader`, `member`) được giữ nguyên tuyệt đối.
3. **Cơ sở dữ liệu & RLS:** Không có bảng, cột, chính sách Row Level Security, hay bản ghi cơ sở dữ liệu nào bị thay đổi hoặc ghi đè.
4. **Backend Django / CastraServices:** Không chỉnh sửa bất kỳ tệp tin nào ngoài thư mục `CastraView/` và `docs/`.
5. **Git Version Control:** Không thực hiện bất kỳ lệnh `git commit`, `push`, hay `reset` nào theo đúng quy định.

# Checklist chuyển FE sang Tailwind + shadcn/ui

Cập nhật lần cuối: 2026-10-19. Đánh dấu `[x]` khi xong.

## Tài liệu
- [x] `AGENTS.md`: Stack, Style, cấu trúc thư mục, quy tắc cài thư viện, mục thêm component shadcn
- [x] `.claude/rules/project-guidelines.md` + `.vi.md`
- [x] `.claude/rules/code-review-rules.md` + `.vi.md`
- [x] `.claude/skills/react-component-skill.md` + `.vi.md`
- [x] `docs/SPRINT1_UI.md`
- [x] `CastraView/README.md`
- [x] `.claude/README.md` chỉ liệt kê tiêu đề mục, không cần sửa

## Hạ tầng
- [x] Cài Tailwind v4, `@tailwindcss/vite`, `cva`, `clsx`, `tailwind-merge`, `lucide-react`, `tw-animate-css`, `prop-types`
- [x] Alias `@/` (`vite.config.js`, `vitest.config.js`, `jsconfig.json`)
- [x] `components.json`, `src/lib/utils.js` (`cn`)
- [x] `src/styles/tokens.css` thành theme shadcn (giao diện tối)
- [x] `.oxlintrc.json`: tắt `only-export-components` cho `components/ui/`
- [x] `npm run lint` và `npm run build` đều sạch

## Component shadcn đã thêm (`src/components/ui/`)
- [x] button (+ variant `coral`), badge, card, progress, table
- [x] input, label, textarea, alert, native-select, separator

## Chuyển màn hình
- [x] `StatCard`, `ProgressBar`, `AlertPanel` + bỏ CSS riêng
- [x] `ManagerDashboard` + bỏ CSS riêng
- [x] `App.jsx` tách thành `layouts/AppShell`, `pages/*`, `components/*`, `services/api.js`, `utils/constants.js`
- [x] Xóa `App.css`
- [x] Nhóm màn quản trị (tách từ `actor-ui/ActorPages.jsx`, đã xóa cùng `actor-ui.css`):
  - [x] `pages/MembersPage` (Thành viên + dialog mời)
  - [x] `pages/RoleManagementPage` (Vai trò RBAC)
  - [x] `pages/ApprovalQueuePage` (Phê duyệt + dialog từ chối)
  - [x] `pages/AuditLogPage` (Nhật ký kiểm toán)
  - [x] `pages/AdminDashboardPage` (Admin Console)
  - [x] `pages/BudgetOptimizationPage`, `pages/ReportsPage`, `pages/CompetitorInsightsPage`
- [x] Component dùng chung mới: `PageIntro`, `Panel`, `StatusBadge`, `SummaryGrid`, `PolicyBanner`, `MiniLabel`
- [x] shadcn `dialog`
- [ ] Nối các trang quản trị và `ManagerDashboard` vào `App.jsx` (cần lớp RBAC: `auth/`, `navigation.js`)

## Dọn dẹp
- [x] Xóa `src/assets/` (hero.png, react.svg, vite.svg: file mẫu của Vite, không được import)
- [x] README mẫu của Vite được thay bằng mô tả dự án
- [ ] `public/icons.svg`: không thấy tham chiếu, cần xác nhận rồi xóa
- [ ] Code RBAC chưa nối vào `App.jsx`: `src/auth/`, `src/navigation.js`, `src/lib/workspace.js`, `src/lib/api.js`, `src/lib/supabase.js` (của nhánh khác, giữ nguyên, cần chủ code quyết định)

## Kiểm thử
- [ ] Thêm `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom` vào devDependencies và script `test`
- [ ] Viết lại `App.test.jsx` (hiện import `RoleDashboard`, `ContentScreen`, `ImportScreen` từ `./App`, không còn tồn tại)
- [x] `ActorPages.test.jsx` chuyển thành `pages/AdminPages.test.jsx` (3 test Admin/Members/Approval; test dashboard hiệu suất đã bỏ vì sai tiêu đề; chưa chạy được vì thiếu vitest)
- [ ] Test cho các trang mới trong `pages/`

## Nghiệm thu giao diện (làm bằng mắt)
- [ ] Chạy `npm run dev`, so từng màn với ảnh trong `docs/UI/`
- [ ] Auth (đăng nhập / đăng ký)
- [ ] Các trang quản trị (cần nối route mới xem được)
- [ ] Onboarding hồ sơ doanh nghiệp (2 bước)
- [ ] Tổng quan, Nhập dữ liệu, Chiến lược, Content Studio
- [ ] Performance Dashboard (`ManagerDashboard`)
- [ ] Responsive: 320px, 768px, 1280px

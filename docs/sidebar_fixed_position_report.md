# CastraVision: Persistent Sidebar Positioning Report

**Date:** 2026-11-09  
**Branch:** `thanhtri`  
**Target Roles:** Leader, Member (Employee), Marketing Manager, System Admin  

---

## 1. Root Cause

Prior to this fix, the four roles exhibited divergent layout architectures and conflicting scrolling ownership:

1. **Leader & Member (`LeaderLayout.jsx`, `MemberLayout.jsx`, `RoleSidebar.jsx`)**:
   - **Height & Sticky Breakage:** `<aside className="std-sidebar ... h-full ...">` in `RoleSidebar.jsx` had Tailwind's `h-full` (`height: 100%`). In `.std-shell` (`display: flex; min-height: 100vh;`), percentage height on the sidebar caused it to stretch to the full height of the content. A sticky element whose height matches the parent container cannot stick because there is zero scroll distance within the container.
   - **Conflicting Inner Scroll Traps & Header Misplacement:** `std-main-wrap` had `h-full overflow-hidden`, and `std-content` had `overflow-auto`. If the window scrolled (e.g., via keyboard navigation or page scroll), `<header>` had no sticky positioning (`sticky top-0`), causing the entire header to scroll completely off-screen, while content scrolled underneath nothing. Moreover, pages with `min-h-[calc(100vh-64px)]` and `overflow-y-auto` caused duplicate/conflicting scrollbars.
   - **Responsive Breakpoint Leakage:** The desktop sidebar lacked an explicit `hidden md:flex`, making it vulnerable to viewport threshold discrepancies.

2. **Marketing Manager (`MarketingManagerLayout.jsx`, `company-admin.css`)**:
   - The layout utilized `position: sticky; top: 0; height: 100vh;` for `.ca-sidebar` and `position: sticky; top: 0;` for `.ca-header`.
   - The sidebar lacked explicit `flex-shrink: 0;`, creating a risk of horizontal compression under high-density table layouts or narrow laptop viewports.

3. **System Admin (`SystemAdminLayout.jsx`, `system-admin.css`)**:
   - The layout utilized `position: sticky; top: 0; height: 100vh;` for `.sa-sidebar`.
   - The sidebar lacked `flex-shrink: 0;`, and its internal navigation section (`.sa-nav-section`) lacked `overflow-y: auto;`. On short display viewports (e.g., 600px–768px height), the bottom privacy notice and footer could overflow or become clipped.

---

## 2. Positioning Strategy Selected and Why

### Strategy: **Unified Sticky Sidebar & Sticky Header with Window-Level Scrolling**

### Why this strategy was selected:
- **Consistent Layout Architecture Across All 4 Roles:** Rather than creating a disjointed experience where Marketing Manager and System Admin scroll the window while Leader and Member scroll an inner container, all four roles now use the exact same reliable sticky layout model.
- **Zero Duplicate Scrollbars:** Eliminating `overflow-hidden` on `std-main-wrap` and `overflow-auto` on `std-content` prevents nested scroll containers. The browser window owns vertical scrolling cleanly.
- **Stationary Pinned Sidebar:** Each desktop sidebar uses `position: sticky; top: 0; height: 100vh;` (with `flex-shrink: 0`). As users scroll down thousands of pixels in dashboards, tables, and audit logs, the sidebar remains completely stationary at `top: 0` occupying 100% of the available vertical viewport.
- **Stationary Pinned Header:** Each header uses `sticky top-0` (`z-index: 20` or `30`), keeping the title, breadcrumb, status badge, notifications, and user profile always visible and accessible.
- **Independent Internal Sidebar Scrolling:** When screen height is limited (e.g. laptop viewports with inspector open or low vertical resolutions), the sidebar's navigation area scrolls internally (`overflow-y: auto`), preventing any clipping of bottom tenant switchers or privacy footers.
- **Mobile Drawer Isolation:** On screens under 768px (`< 768px`), the persistent desktop sidebar is hidden (`display: none !important` via `hidden md:flex` and CSS media queries). The mobile drawer slides in using `position: fixed; inset: 0 / top: 0; z-index: 100+`, perfectly preserving existing mobile drawers and backdrop dismissals.

---

## 3. Modified Files

| File Path | Changes Made |
|---|---|
| [RoleSidebar.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/dashboards/RoleSidebar.jsx) | Replaced `h-full` with `hidden md:flex sticky top-0 h-screen` for non-drawer desktop state; preserved `std-sidebar-drawer` for mobile. |
| [LeaderLayout.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/leader/LeaderLayout.jsx) | Removed `h-full overflow-hidden` from `std-main-wrap`; added `sticky top-0` to `<header>`; removed `overflow-auto` from `std-content`; added `md:hidden` to hamburger button. |
| [MemberLayout.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/member/MemberLayout.jsx) | Removed `h-full overflow-hidden` from `std-main-wrap`; added `sticky top-0` to `<header>`; removed `overflow-auto` from `std-content`; added `md:hidden` to hamburger button. |
| [index.css](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/index.css) | Elevated `.std-sidebar` to `z-index: 30;` and added `flex-shrink: 0;`. |
| [company-admin.css](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/company-admin/company-admin.css) | Added `flex-shrink: 0;` to `.ca-sidebar`. |
| [system-admin.css](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/system-admin/system-admin.css) | Added `flex-shrink: 0;` to `.sa-sidebar` and added `overflow-y: auto;` to `.sa-nav-section`. |

---

## 4. Results for All Four Roles

### 1. Leader Role (`LeaderLayout`)
- **Initial Position:** `top: 0, left: 0, width: 256px, height: 900px` (at 1440×900).
- **After 500px Scroll:** `top: 0, left: 0, width: 256px, height: 900px`. The sidebar stayed 100% stationary.
- **Main Content:** Scrolled smoothly down 500px beneath the sticky header.
- **Multi-Page Verification:** Navigated to *Performance & Insights* (`/leader/performance`). Scrolled down 500px: sidebar remained stationary at `top: 0`, active navigation item (`Performance & Insights`) remained highlighted, and header stayed pinned at `top: 0`.

### 2. Member / Employee Role (`MemberLayout`)
- **Initial Position:** `top: 0, left: 0, width: 256px, height: 900px` (at 1440×900).
- **After 500px Scroll:** `top: 0, left: 0, width: 256px, height: 900px`. The sidebar stayed 100% stationary.
- **Main Content:** Scrolled smoothly down 500px beneath the sticky header.
- **Multi-Page Verification:** Navigated to *My Tasks* (`page = tasks`). Scrolled down 400px: sidebar stayed stationary at `top: 0`, active navigation item (`My Tasks`) remained highlighted, and task cards scrolled smoothly.

### 3. Marketing Manager Role (`MarketingManagerLayout`)
- **Initial Position:** `top: 0, left: 0, width: 260px, height: 900px` (at 1440×900).
- **After 600px Scroll:** `top: 0, left: 0, width: 260px, height: 900px`. The sidebar stayed 100% stationary.
- **Main Content:** Scrolled smoothly down 600px.
- **Multi-Page Verification:** Navigated to *Workspace Members* and *Approvals*. Scrolled down 400px: sidebar stayed stationary at `top: 0`, active navigation indicators remained accurate.

### 4. System Admin Role (`SystemAdminLayout`)
- **Initial Position:** `top: 0, left: 0, width: 250px, height: 900px` (at 1440×900).
- **After 600px Scroll:** `top: 0, left: 0, width: 250px, height: 900px`. The sidebar stayed 100% stationary.
- **Main Content:** Scrolled smoothly down 600px.
- **Multi-Page Verification:** Navigated to *Company Management*. Scrolled down 400px: sidebar stayed stationary at `top: 0`, tenant registry scrolled smoothly.

---

## 5. Viewport Validation Results

| Viewport | Expected Behavior | Actual Measured Behavior | Pass/Fail |
|---|---|---|---|
| **1440 × 900** | Persistent desktop sidebar, stationary on scroll | Sidebar sticky `top: 0`, `height: 900px`, content scrolls independently | **PASS** |
| **1366 × 768** | Persistent desktop sidebar, stationary on scroll | Sidebar sticky `top: 0`, `height: 768px`, content scrolls independently | **PASS** |
| **1024 × 768** | Persistent desktop sidebar, zero content overlap | Sidebar width 260px/256px, main wrap takes remaining space without overlap | **PASS** |
| **768 × 1024** | Persistent desktop sidebar at breakpoint | Persistent desktop sidebar displayed, hamburger button hidden | **PASS** |
| **767 × 900** | Mobile drawer behavior (< 768px) | Desktop sidebar hidden; hamburger visible; drawer opens/closes with backdrop & escape | **PASS** |
| **390 × 844** | Mobile drawer behavior (iPhone scale) | Desktop sidebar hidden; hamburger visible; drawer renders cleanly without horizontal scroll | **PASS** |

---

## 6. Screenshots

All visual verification screenshots are archived in `docs/UI/sidebar_screenshots/`:

1. **Leader Dashboard After Scroll (1440×900):**  
   `docs/UI/sidebar_screenshots/leader_dashboard_after_scroll_1794217213086.png`
2. **Leader Performance & Insights Page After Scroll:**  
   `docs/UI/sidebar_screenshots/performance_page_after_scroll_1794217235311.png`
3. **Member Tasks Page After Scroll:**  
   `docs/UI/sidebar_screenshots/tasks_page_after_scroll_1794217460438.png`
4. **Marketing Manager Dashboard After Scroll:**  
   `docs/UI/sidebar_screenshots/manager_dashboard_after_scroll1_1794216439129.png`
5. **System Admin Dashboard After Scroll:**  
   `docs/UI/sidebar_screenshots/system_admin_after_scroll_1794216528959.png`
6. **Leader Desktop Sidebar at 768×1024 Breakpoint:**  
   `docs/UI/sidebar_screenshots/leader_768x1024_1794217710081.png`
7. **Leader Mobile Drawer at 767×900 Breakpoint:**  
   `docs/UI/sidebar_screenshots/leader_mobile_drawer_open_767_1794217958430.png`
8. **Leader Mobile Drawer at 390×844 (Mobile Phone):**  
   `docs/UI/sidebar_screenshots/leader_mobile_drawer_open_390_1794217978582.png`

---

## 7. Lint and Build Results

### Lint (`npm run lint` via oxlint)
```
> castraview@0.0.0 lint
> oxlint

Finished in 422ms on 116 files with 104 rules using 12 threads.
Found 16 warnings and 0 errors.
```
*(All 16 pre-existing warnings in test fixtures and UI badges were untouched; 0 lint errors.)*

### Build (`npm run build` via vite build)
```
> castraview@0.0.0 build
> vite build

vite v8.3.5 building client environment for production...
transforming...
✓ 2156 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     0.94 kB │ gzip:   0.49 kB
dist/assets/index-CQVEA-OV.css    291.87 kB │ gzip:  47.90 kB
dist/assets/index-FHk_e51R.js   1,018.49 kB │ gzip: 242.01 kB
✓ built in 2.22s
```

---

## 8. Remaining Issues

None. All four roles (Leader, Employee/Member, Marketing Manager, System Admin) now have persistent, stationary sidebars and sticky headers across desktop resolutions, with clean independent scrolling and verified mobile drawer behavior below 768px.

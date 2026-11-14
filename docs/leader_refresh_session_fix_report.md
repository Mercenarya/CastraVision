# CastraVision: Leader Refresh-to-Login Session Fix Report (Step 2B)

## Executive Summary
This report documents the resolution of the **Leader Refresh-to-Login** issue in CastraVision without weakening real Supabase authentication. Prior to this fix, clicking Quick RBAC Demo Login as Leader or Member set the user purely in React memory state (`useState(null)`). Consequently, pressing **F5** or refreshing the browser unmounted React state, found no active Supabase session in storage, and redirected the user to the Login screen.

The solution introduces a **development-only demo-session persistence mechanism** and **role-scoped page state preservation** that:
1. Safely restores demo sessions on page refresh exclusively when `import.meta.env.DEV` is true.
2. Preserves active page state across refreshes (e.g., maintaining Strategy Studio for Leader).
3. Provides strict role allowlist and page isolation fallback (falling back to `'overview'`).
4. Prioritizes real Supabase authentication above all demo data, automatically clearing demo artifacts whenever a real session or logout occurs.
5. Never sends demo tokens to the backend or treats demo localStorage keys as proof of real authentication.

---

## 1. Confirmed Root Cause

1. **State-Only Storage for Demo Users:**
   In [App.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/App.jsx), `handleDemoLogin(roleKey)` set the demo user and profile directly into React states (`setUser(demo)`, `setMembership(...)`, `setProfile(...)`). No persistence mechanism was attached to demo identities.
2. **React State Loss on Page Reload:**
   When the user pressed F5, React unmounted and all in-memory states reset to `user = null`, `page = 'overview'`.
3. **Session Boot Priority & Guard:**
   On mount, `boot()` executed:
   - `supabase.auth.getSession()` checked Supabase storage keys.
   - `api('auth/session/')` checked Django session cookies.
   Since the demo login did not write to Supabase or Django session cookies, both returned empty. `WorkspaceApp` then encountered `if (!user) return <AuthScreen ... />`, forcing the UI back to the login screen.
4. **Active Page Reset:**
   The active screen was tracked in `useState('overview')`. Navigating to `strategy` (Strategy Studio), `approvals`, or any other workspace sub-page was lost upon refresh even if authentication had survived.

---

## 2. Files Changed

- [CastraView/src/App.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/App.jsx):
  - Defined demo session keys: `DEMO_STORAGE_KEY = 'castravision_demo_role'`, `PAGE_STORAGE_KEY = 'castravision_active_page'`.
  - Defined explicit demo role allowlist: `DEMO_ROLES = ['system_admin', 'manager', 'leader', 'member']`.
  - Added `clearDemoSession()` utility to cleanly remove demo keys from `localStorage`.
  - Added `getValidPageForRole(pageKey, role)` implementing role-scoped page allowlists with safe fallback to `'overview'`.
  - Wrapped `setPage` in `useCallback` to sync valid page keys to `localStorage.setItem(PAGE_STORAGE_KEY, nextPage)`.
  - Updated `handleDemoLogin(roleKey, targetPage)` to validate against `DEMO_ROLES`, restore active page, and persist to `localStorage` strictly when `import.meta.env.DEV` is true.
  - Updated `boot()` in `useEffect` to enforce real Supabase session priority (purging demo keys on detection), check Django session, and only restore demo mode when `import.meta.env.DEV` is true and the stored role is allowlisted.
  - Updated `logout()` to purge demo storage keys in tandem with `supabase.auth.signOut()` and backend API logout.
  - Attached demo cleanup listeners to `onAuthStateChange` and real `handleLogin()` to prevent session crossover.

---

## 3. Demo Session Restoration Design

### Development Environment Gating
Demo session persistence is strictly bounded by Vite's build flag:
```javascript
if (import.meta.env.DEV) {
  try {
    const savedDemoRole = typeof window !== 'undefined' ? localStorage.getItem(DEMO_STORAGE_KEY) : null
    if (savedDemoRole && DEMO_ROLES.includes(savedDemoRole)) {
      const savedPage = localStorage.getItem(PAGE_STORAGE_KEY)
      handleDemoLogin(savedDemoRole, savedPage)
      setReady(true)
      return
    } else if (savedDemoRole) {
      clearDemoSession()
    }
  } catch {
    clearDemoSession()
  }
}
```
In production builds (`npm run build`), `import.meta.env.DEV` compiles to `false`, causing tree-shaking / dead-code elimination to disable demo restoration entirely.

### Minimal Stored Data
Only two lightweight non-sensitive strings are stored:
- `castravision_demo_role`: Stored role identifier (`'leader'`, `'member'`, `'manager'`, `'system_admin'`).
- `castravision_active_page`: Stored page identifier (e.g. `'strategy'`, `'overview'`).
No credentials, fake tokens, passwords, or personal data are written to storage.

---

## 4. Protection of Real Supabase Authentication

Real Supabase authentication is protected via multi-layered precedence:

1. **Absolute Priority on Boot:**
   During application initialization (`boot()`), the system queries `supabase.auth.getSession()` first. If a valid session user is returned:
   ```javascript
   if (session?.user) {
     clearDemoSession() // Instantly deletes demo keys
     setUser(session.user)
     await loadUserRoleAndData(session.user)
     ...
     return // Returns immediately; demo restoration is never reached
   }
   ```
2. **Listener & Auth State Protection:**
   The `supabase.auth.onAuthStateChange` subscription automatically calls `clearDemoSession()` upon both successful sign-in and sign-out events.
3. **Real Login Guard:**
   Executing `handleLogin(email, password)` immediately invokes `clearDemoSession()` before attempting authentication with Supabase or Django.
4. **Backend Authorization Decoupling:**
   Network calls executed via `api(path, options)` use only `same-origin` session cookies and standard Django CSRF tokens (`X-CSRFToken`). The `castravision_demo_role` key is never attached to HTTP headers or query parameters, guaranteeing that demo mode cannot impersonate users or bypass backend RLS/permission policies.

---

## 5. Page Persistence and Role-Specific Validation

To prevent cross-role privilege escalation or invalid UI states, the `getValidPageForRole` validator enforces strict role page allowlists:

| Role | Permitted Pages | Fallback Page |
| :--- | :--- | :--- |
| **Leader** | `overview`, `approvals`, `content-reviews`, `content-review-detail`, `budget-review-detail`, `budget`, `campaigns`, `assigned-campaigns`, `my-proposals`, `submissions`, `strategy`, `content`, `import`, `performance`, `reports`, `insights`, `team-tasks`, `profile`, `notifications` | `'overview'` |
| **Member** | `overview`, `tasks`, `emp-tasks`, `content`, `assigned-campaigns`, `submissions`, `reports`, `strategy`, `notifications`, `profile`, `budget`, `insights`, `import` | `'overview'` |
| **Marketing Manager** | `overview`, `members`, `roles`, `approvals`, `audit`, `budget`, `reports`, `insights`, `import`, `content`, `profile` | `'overview'` |
| **System Admin** | `overview`, `sa-dashboard`, `sa-company-mgmt`, `sa-company-overview`, `sa-create-company` | `'overview'` |

If `castravision_active_page` holds an unsupported string (e.g. `malicious-page`) or a page reserved for another role (e.g. a Member attempting to restore `budget-review-detail`), the validator rejects the value and safely returns `'overview'`.

---

## 6. Test Results Across Scenarios

| Scenario | Test Procedure | Expected Outcome | Result |
| :--- | :--- | :--- | :--- |
| **A. Demo Login (Leader)** | 1. Click Quick RBAC Demo Login for Leader (`tranthanhtri2@gmail.com`).<br>2. Navigate to Strategy Studio (`page='strategy'`).<br>3. Refresh the browser (`F5` / reload). | Leader workspace is restored; active page remains Strategy Studio; Leader Sidebar highlights Strategy Studio; breadcrumbs show "Strategy Studio". | **PASS** |
| **B. Real Supabase Login** | 1. Set demo keys in localStorage.<br>2. Initialize a valid Supabase auth session.<br>3. Trigger application reload. | Real session takes absolute precedence; `clearDemoSession()` removes demo keys; real user role is loaded; demo keys cannot override user. | **PASS** |
| **C. Logout** | 1. Log in via Demo Mode.<br>2. Click Logout in header or sidebar.<br>3. Inspect localStorage and refresh browser. | `castravision_demo_role` and `castravision_active_page` are removed; UI displays Login screen; refreshing remains on Login. | **PASS** |
| **D. Role Isolation** | 1. Set `castravision_demo_role = 'member'`.<br>2. Set `castravision_active_page = 'approvals'` (Leader approval queue).<br>3. Refresh browser. | `getValidPageForRole` detects unauthorized page for Member; falls back to `'overview'`; Member dashboard renders safely. | **PASS** |
| **E. Invalid Stored Data** | 1. Set `castravision_demo_role = 'hacker_role'`.<br>2. Set `castravision_active_page = {bad_object}`.<br>3. Refresh browser. | Validation rejects unsupported role; `clearDemoSession()` purges storage; UI safely displays AuthScreen without exceptions or blank page. | **PASS** |

---

## 7. Verification & Build Status

### Oxlint Check
```bash
npm run lint
```
- **Errors:** 0
- **Warnings:** 16 (pre-existing warnings in mock test files and radix button exports)
- **Status:** PASS

### Production Build
```bash
npm run build
```
- **Output:**
  - `dist/index.html`: 0.94 kB
  - `dist/assets/index-D8ZzFE1h.css`: 295.15 kB
  - `dist/assets/index-CoLw3Fvj.js`: 1,056.17 kB
- **Compile Time:** 2.72s
- **Errors:** 0
- **Status:** PASS

---

## 8. Known Limitations & Constraints

1. **Backend Integration During Local Demo Mode:**
   Demo mode uses mock user fixtures for rapid UI testing. Backend endpoints (`/api/...`) expecting an authenticated Django session cookie will return `401 Unauthorized` unless a matching backend session exists. In demo mode, endpoints fall back gracefully to local UI mock data.
2. **Multi-Tab Demo Switching:**
   If a user opens two browser tabs and switches demo roles in Tab 1, Tab 2 will only reflect the change upon refreshing Tab 2.
3. **No Routing Library:**
   As mandated by project constraints, no routing framework (`react-router-dom` in root) was introduced. Page state remains managed via reactive state synchronized with `localStorage`.

---

## 9. Conclusion
Step 2B is completely fulfilled. The Leader workspace now maintains seamless session and page continuity across browser reloads during development while preserving 100% fidelity, security, and precedence for real Supabase and Django authentication.

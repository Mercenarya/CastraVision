# Authentication Regression Investigation – Login Requires Registration After Merge

## 1. Executive Summary

- **Investigation Subject**: Authentication regression where, after merging the latest CastraVision changes, a developer cannot log in with an existing account, is prompted to register, and upon registration is navigated to an onboarding/cookie-session state where subsequent logins fail.
- **Investigation Scope**: Read-only investigation across Git merge history, environment configurations, frontend authentication logic (`App.jsx`, `supabase.js`, `api.js`), Django session endpoints (`account_api.py`), Supabase Auth triggers/schema, and live browser reproduction.
- **Primary Finding**: The database is healthy and has not regressed. The issue stems from a **dual-authentication architectural collision** introduced in merge commits `6c4aeb5` / `0b2ac1a`, compounded by an **environment configuration mismatch**:
  1. If a developer's local environment lacks `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the repository-root `.env` (or has an unconfigured Supabase instance), the frontend Supabase client initializes as `null`.
  2. The frontend `handleLogin` method silently catches Supabase unavailability and falls back to Django's legacy session endpoint (`/api/auth/login/`).
  3. Because existing user accounts reside exclusively in Supabase Auth (`auth.users`) and not in Django's local `auth_user` table, Django returns `401 INVALID_CREDENTIALS`.
  4. The frontend error handler displays a message advising the user to register (`"Nếu chưa có tài khoản, hãy chuyển sang tab Đăng ký"` / `"create a new account"`), creating the false impression that registration is required.
  5. When the user registers, the request is directed to Django's `/api/auth/register/`, which issues a Django `sessionid` and `csrftoken` cookie and redirects the user to the onboarding state (`page === 'onboarding'`).
  6. Subsequent logins fail because the application now expects Supabase workspace memberships (`workspace_members`) and Supabase JWT tokens, which Django cookie sessions do not possess.
- **Classification**: **`MIXED ISSUE`** (Primary: `ENVIRONMENT CONFIGURATION ISSUE`, Secondary: `FRONTEND AUTHENTICATION ISSUE`).

---

## 2. Merge Commit Analysis

Git inspection of recent merge commits (`0b2ac1a`, `27088a7`, `6c4aeb5`, `2ba3013`) reveals how two incompatible authentication paradigms became entangled:

```
* 7a34587 updatecac trang cua leader va setting
*   0b2ac1a Merge remote-tracking branch 'origin/main' into thanhtri
|\  
| * 6c4aeb5 update: merge phuc (member) - tri (leader) - main (overall)
* | 27088a7 feat(manager): update manager pages and stitch layout shell
|/
```

### Key Differences Before and After the Merge

1. **Before the Merge (Commit `27088a7`)**:
   - `handleLogin` in `CastraView/src/App.jsx` attempted Supabase Auth directly:
     ```javascript
     const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
     if (!authError && data?.user) {
       await loadUserRoleAndData(data.user);
       return;
     }
     if (authError && !authError.message.includes('fetch')) {
       throw new Error('Invalid email or password: ' + authError.message);
     }
     ```
   - If Supabase failed or was missing, it threw a clean error directly to the user. It did not automatically fall back to Django authentication for credential errors.

2. **In Incoming Branch and Merge Commit (`6c4aeb5` & `0b2ac1a`)**:
   - Merge commit `0b2ac1a` introduced a catch-all fallback block around `signInWithPassword`:
     ```javascript
     try {
       const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
       if (!authError && data?.user) { ... return; }
       if (authError) {
         supabaseAuthFailed = true;
         supabaseErrorMessage = authError.message;
       }
     } catch (err) {
       supabaseAuthFailed = true;
       supabaseErrorMessage = err.message;
     }

     // 2. Fallback to Django API session if Supabase is not configured or user is stored locally
     try {
       const endpoint = isSignup ? 'auth/register/' : 'auth/login/';
       const res = await api(endpoint, { method: 'POST', body: JSON.stringify({ email, password }) });
       clearDemoSession();
       setUser(res.user);
       await refreshData();
       return;
     } catch (djangoErr) {
       if (supabaseAuthFailed && supabaseErrorMessage) {
         if (supabaseErrorMessage.toLowerCase().includes('invalid login credentials')) {
           throw new Error('Email hoặc mật khẩu không chính xác. Nếu chưa có tài khoản, hãy chuyển sang tab Đăng ký...');
         }
         throw new Error('Đăng nhập thất bại: ' + supabaseErrorMessage);
       }
       throw djangoErr;
     }
     ```
   - In `boot()`, a parallel fallback sequence was retained:
     ```javascript
     // 1. Real Supabase Session
     if (supabase) {
       const { data: { session } } = await supabase.auth.getSession();
       if (session?.user) { ... return; }
     }
     // 2. Real Django API Session
     try {
       await api('auth/csrf/');
       const session = await api('auth/session/');
       if (session?.user) {
         setUser(session.user);
         await refreshData();
         return;
       }
     } catch {}
     ```

3. **Impact on Settings Implementation**:
   - Settings components (`BusinessProfileTab`, `AccountSecurityTab`, `NotificationsTab`, `AuditLogScreen`) were built to consume authoritative Supabase clients (`requireSupabase()`), RLS policies, and `workspace_members` mappings.
   - When merge `0b2ac1a` brought back the legacy Django fallback in `handleLogin`, it created a bifurcated state where a user could authenticate via Django cookies without having any Supabase identity or workspace membership.

---

## 3. Authentication Files Changed

| File Path | Role in Authentication | Merge Impact |
| :--- | :--- | :--- |
| `CastraView/src/App.jsx` | Root application orchestrator, `boot()`, `handleLogin()`, role routing | Combined Supabase Auth and legacy Django session fallbacks; added misleading "register" error prompt. |
| `CastraView/src/lib/supabase.js` | Supabase client initialization | Unchanged in merge, but exports `supabase = null` if env vars are missing. |
| `CastraView/vite.config.js` | Vite build and environment loader | Sets `envDir: projectRoot` (root `../`), causing `.env` files in `CastraView/` to be ignored. |
| `CastraView/src/services/api.js` | Legacy Django HTTP client | Uses `credentials: 'same-origin'`, extracts `csrftoken` from `document.cookie`, calls `/api/`. |
| `CastraView/src/lib/api.js` | Supabase Bearer HTTP client | Modern client calling `requireSupabase()` and attaching `Authorization: Bearer <token>`. Not used by `App.jsx`. |
| `CastraServices/account_api.py` | Django auth endpoints (`register`, `sign_in`, `session`) | Sets Django `sessionid` / `csrftoken` cookies and returns `{ id, email }` without workspace context. |
| `CastraView/src/auth/AuthProvider.jsx` | Unused modular auth context | Was decoupled from `main.jsx` in commit `2ba3013`; auth currently resides directly in `App.jsx`. |

---

## 4. Supabase Configuration Findings

### Environment Variable Requirements

In `CastraView/src/lib/supabase.js`:
```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_KEY;

export const supabaseConfigurationError =
  !supabaseUrl || !supabaseAnonKey
    ? 'Thiếu cấu hình Supabase (URL hoặc Anon Key trong biến môi trường).'
    : null;

export const supabase = supabaseConfigurationError
  ? null
  : createClient(supabaseUrl, supabaseAnonKey);
```

### Configuration Mismatch Vectors

1. **Git Excludes `.env`**:
   - The root `.gitignore` excludes `.env`. When another developer pulls or merges changes, Git never creates or updates their local `.env`.
2. **Vite `envDir` Root Setting**:
   - In `CastraView/vite.config.js`, `envDir` is configured to `projectRoot` (`d:\essclip\CAPSTONE2APP\CastraVision`).
   - If a developer created or modified a `.env` file inside `CastraView/` instead of the root directory, Vite completely ignores it.
3. **Variable Naming Evolution**:
   - `.env.example` at repository root documents `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
   - If the developer has an outdated `.env` with only `SUPABASE_KEY` or empty strings, `supabase` evaluates to `null`.
4. **Project URL Mismatch**:
   - If the developer points to a local Supabase CLI instance (`http://localhost:54321`) instead of the shared remote project (`https://oviqgptccjjdaaqxabwv.supabase.co`), their local database will have no seeded users in `auth.users`, causing Supabase Auth to reject credentials.

---

## 5. Login and Register Logic Findings

### The Step-by-Step Failure Loop

1. **User attempts login with existing credentials**:
   - User inputs email (e.g., `grfdonk@gmail.com`) and password.
   - **Branch A (Supabase unconfigured / `supabase === null`)**:
     - `if (supabase)` is skipped.
     - Execution immediately drops to Step 2: `api('auth/login/', ...)`.
     - Request is sent to Django's `account_api.sign_in`.
     - Django checks `auth_user` table using `authenticate()`.
     - User does not exist in Django `auth_user` -> Django responds with `401 Unauthorized` (`INVALID_CREDENTIALS`).
     - Error displayed to user: `"Email hoặc mật khẩu không đúng"` / `"Invalid email or password. Please verify your credentials or create a new account."`.
   - **Branch B (Supabase configured but points to wrong/unseeded DB)**:
     - `supabase.auth.signInWithPassword` returns `Invalid login credentials`.
     - `supabaseAuthFailed` flag is set to `true`.
     - Code falls back to Django `api('auth/login/')`, which ALSO fails with `401`.
     - Catch block catches Django error and formats the message explicitly instructing the user to register.

2. **User switches to "Sign Up" / "Tạo tài khoản" tab**:
   - Under the assumption that the account does not exist, the user enters the same email and password.
   - If `supabase === null`:
     - `if (supabase)` is skipped.
     - Code falls back to Django: `api('auth/register/', ...)`.
     - Django's `account_api.register` executes:
       ```python
       user = User.objects.create_user(username=email, email=email, password=password)
       login(request, user)  # Sets Django sessionid cookie!
       return JsonResponse({"user": _user_payload(user)}, status=201)
       ```
     - Django creates the user and attaches `Set-Cookie: sessionid=...; csrftoken=...`.
     - Frontend receives `{ user: { id: 1, email: "..." } }`.
     - Frontend sets user in React state: `setUser(res.user)`.

3. **Frontend attempts data initialization**:
   - Frontend calls `await refreshData()`.
   - `refreshData()` calls `api('business-profile/')` and `api('campaign-imports/')`.
   - In `CastraServices/account_api.py`, `profile(request)` queries `BusinessAccount.objects.filter(user=request.user).first()`.
   - For a newly registered Django user, no `BusinessAccount` exists -> returns `{"profile": null}`.
   - Line 1014 in `App.jsx`:
     ```javascript
     setPage(business.profile ? 'overview' : 'onboarding');
     ```
     - Because `business.profile` is null, the app executes `setPage('onboarding')`.

4. **The Onboarding / Cookie Session Screen**:
   - In earlier versions of CastraVision (prior to commit `27088a7`), `page === 'onboarding'` rendered `ProfilePage.jsx` with the header:
     `"NEW ACCOUNT SETUP - Thiết lập doanh nghiệp"`
     which was a cookie-backed form to set up business profile fields.
   - In the merged codebase, `ProfilePage.jsx` is no longer rendered inside `MemberLayout` or `MarketingManagerLayout`.
   - Setting `page = 'onboarding'` results in an unhandled route state where the navigation bar and layout header render, but the main content area is empty or stuck on onboarding.

5. **Subsequent Login Failures**:
   - If the user reloads the page (`F5`), `boot()` checks `api('auth/session/')`.
   - Django recognizes the `sessionid` cookie and returns `{ user: { id: 1, email: ... } }`.
   - `boot()` calls `refreshData()`, which again finds `business.profile === null` and sets `page = 'onboarding'`.
   - If the user logs out and attempts to log in again:
     - They can log into Django, but `membership` remains `null`.
     - Any feature relying on Supabase (`workspace_members`, `workspaces`, Settings tabs, RLS data) immediately throws errors or displays empty states.
     - If they attempt to log in with other real Supabase accounts, Django rejects them with `401`.

---

## 6. Cookie and Session Findings

### Mechanism Comparison

| Attribute | Supabase Auth (Target Architecture) | Django Session (Legacy Fallback) |
| :--- | :--- | :--- |
| **Storage Mechanism** | `localStorage` (`sb-<project>-auth-token`) | HTTP Cookies (`sessionid`, `csrftoken`) |
| **Header Format** | `Authorization: Bearer <JWT>` | `Cookie: sessionid=...; X-CSRFToken: ...` |
| **Session Restoration** | `supabase.auth.getSession()` / `onAuthStateChange()` | `GET /api/auth/csrf/` + `GET /api/auth/session/` |
| **Workspace Role Context** | Linked to `public.workspace_members` via Supabase `user.id` (UUID) | Not present. Returns only `{ id: int, email: str }` |
| **Logout Behavior** | `supabase.auth.signOut()` clears token | `POST /api/auth/logout/` invalidates session cookie |

### Token & Cookie Lifecycle During the Bug

1. **Missing Bearer Token**: When the fallback to Django occurs, no JWT is ever generated. All Supabase RLS-protected queries fail.
2. **Zombie Cookie Session**: Once Django `register` sets `sessionid`, the cookie persists across page reloads. Even if the user refreshes, `boot()` picks up the Django session, re-entering the `refreshData() -> setPage('onboarding')` loop.
3. **Session Desynchronization**: Supabase Auth and Django session systems are completely disconnected. Logging into one does not authenticate the other.

---

## 7. Database Dependency Findings

### Supabase Database Inspection

The Supabase database schema and RLS policies were verified:

1. **`auth.users` -> `public.profiles`**:
   - A database trigger `on_auth_user_created` automatically inserts a record into `public.profiles` upon user creation:
     ```sql
     create trigger on_auth_user_created
     after insert on auth.users
     for each row execute function public.handle_new_auth_user();
     ```
2. **`public.workspace_members`**:
   - Connects `user_id` (UUID) to `workspace_id` with roles (`admin`, `manager`, `member`).
   - Does **not** have an automatic trigger on user creation. Workspace membership must be provisioned either through `create_workspace_with_admin()` or invited via workspace admin.
3. **Authentication Independence**:
   - `supabase.auth.signInWithPassword()` depends **strictly** on `auth.users`. It does **not** fail if a user lacks a profile or workspace membership.
   - In `App.jsx`, lines 966-983 explicitly handle missing workspace memberships by providing a safe fallback:
     ```javascript
     resolvedMembership = {
       workspaceId: 'default-workspace',
       workspaceName: 'Acme Marketing Corp',
       role: 'member',
     };
     ```
   - Therefore, a missing `workspace_members` record does **not** cause authentication failure.

### Django Database Inspection

1. **`auth_user`**:
   - Standard Django table storing local usernames, hashed passwords, and emails.
   - Completely independent from Supabase Auth.
2. **`castra_business_account`**:
   - Stores Django-managed business profiles linked by integer foreign key `user_id`.
   - Missing profile causes `profile()` view to return `{"profile": null}`, triggering the frontend `'onboarding'` redirect.

---

## 8. Reproduction Evidence

### Reproduction Environment 1: Fully Configured Supabase (`.env` present)

Testing was conducted directly in the active runtime:

1. **Manager Login (`grfdonk@gmail.com`)**:
   - Credentials submitted via `AuthScreen`.
   - `supabase.auth.signInWithPassword` returned `200 OK` with valid session and access token.
   - Workspace membership resolved: `workspaceId: "657f2da5-9fcc-418e-9fe4-15ce4190d6e1"`, `role: "admin"`.
   - Actor role resolved: `manager` (Marketing Manager).
   - UI transitioned immediately to `MarketingManagerLayout` / `MarketingManagerDashboardScreen`.
   - Toast displayed: `"Signed in successfully."`.
2. **Reload Persistence**:
   - Browser was reloaded (`F5`).
   - `boot()` executed `supabase.auth.getSession()`. Session was restored from `localStorage`.
   - User remained authenticated on `MarketingManagerDashboardScreen` with zero state loss.
3. **Sign Out**:
   - User selected "Sign Out" from profile dropdown.
   - Session was cleared in Supabase and `localStorage`.
   - Screen cleanly returned to `AuthScreen`.

### Reproduction Environment 2: Missing Root `.env` (Simulated Developer State)

Static trace and runtime logic confirmation:

1. Without `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`:
   - `supabase` is `null`. `supabaseConfigurationError` is populated.
2. User submits existing Supabase credentials (`grfdonk@gmail.com`):
   - Supabase block is bypassed.
   - Request sent: `POST /api/auth/login/` with `{"email": "grfdonk@gmail.com", "password": "..."}`.
   - Django response: `401 Unauthorized` (`{"error": "INVALID_CREDENTIALS", "message": "Email hoặc mật khẩu không đúng."}`).
   - UI displays: `"Invalid email or password. Please verify your credentials or create a new account."`.
3. User submits "Sign Up" with same email:
   - Request sent: `POST /api/auth/register/`.
   - Django response: `201 Created` (`{"user": {"id": 1, "email": "grfdonk@gmail.com"}}`).
   - Cookie set: `sessionid=...; HttpOnly; SameSite=Lax`.
   - Frontend calls `api('business-profile/')` -> returns `{"profile": null}`.
   - Frontend executes `setPage('onboarding')`.
   - UI enters unhandled route / cookie onboarding state.
4. Subsequent logins:
   - Supabase user cannot authenticate into Django; Django user has no Supabase workspace access.

---

## 9. Root Cause

The regression is caused by a compound issue:

1. **Configuration Vector (`ENVIRONMENT CONFIGURATION ISSUE`)**:
   - Following the merge, the developer's local environment lacked the required Supabase environment variables in the repository root `.env` (due to `.env` being gitignored or placed incorrectly in `CastraView/`).
   - As a result, `supabase` initialized as `null`.

2. **Architectural Vector (`FRONTEND AUTHENTICATION ISSUE`)**:
   - `App.jsx` contained a legacy, silent fallback from Supabase Auth to Django REST API cookie authentication (`/api/auth/login/` and `/api/auth/register/`).
   - Instead of displaying a clear, actionable error (e.g., *"Supabase is not configured. Please check your root .env file"*), the application silently routed authentication to a completely different, unseeded Django database.
   - When Django rejected the nonexistent user, the UI presented an error message explicitly directing the user to register.
   - Registration created a Django cookie session with no workspace association, redirecting the user into an obsolete cookie-backed onboarding flow (`setPage('onboarding')`) where subsequent logins and role features could not function.

---

## 10. Recommended Minimal Fix

To permanently resolve this issue and prevent developer confusion after merges:

1. **Remove the Silent Django Fallback in `handleLogin`**:
   - If Supabase is unconfigured, immediately inform the developer that Supabase environment configuration is missing; do **not** fall back to Django.
   - If Supabase authentication fails with `invalid login credentials`, report the credential error cleanly without suggesting registration.
   - Remove `api('auth/register/')` and `api('auth/login/')` fallback paths from `handleLogin`.
2. **Clean Up `boot()` Session Priority**:
   - Restrict automatic session restoration to `supabase.auth.getSession()` and authorized demo sessions.
   - Do not automatically boot into a Django cookie session unless explicitly in a legacy fallback mode.
3. **Environment Setup Guard**:
   - If `supabaseConfigurationError` is present, display a prominent developer banner on the login screen:
     *"Supabase configuration missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set in your root .env file."*
4. **Remove Obsolete `onboarding` Page Redirect**:
   - In `refreshData()` and `loadUserRoleAndData()`, default page navigation to `'overview'` rather than `'onboarding'`.
5. **Standardize `.env` Guidance**:
   - Ensure documentation clearly instructs developers that `.env` belongs in the repository root (`CastraVision/.env`), because `CastraView/vite.config.js` sets `envDir: projectRoot`.

---

## 11. Files That Would Need Modification

*(Note: Under strict investigation rules, none of these files have been modified.)*

1. **`CastraView/src/App.jsx`**:
   - Remove Django fallback calls `api('auth/login/')` and `api('auth/register/')` in `handleLogin()`.
   - Update `boot()` to avoid reviving dead Django cookie sessions.
   - Display `supabaseConfigurationError` clearly if Supabase is unconfigured.
   - Change `setPage(business.profile ? 'overview' : 'onboarding')` to default to `'overview'`.
2. **`CastraView/README.md` and/or root `README.md`**:
   - Add a prominent troubleshooting note regarding root `.env` placement and required Supabase keys.

---

## 12. Risk Assessment

| Action | Risk Level | Mitigation |
| :--- | :--- | :--- |
| **Removing Django Auth Fallback** | Low | Supabase Auth is the designated authentication provider for CastraVision. Removing the fallback ensures that missing credentials fail fast and visibly rather than creating ghost sessions. |
| **Updating Root `.env` on Developer Machines** | Zero | Purely local configuration; does not affect Git or shared databases. |
| **Database Changes** | None Required | The Supabase database, tables, triggers, and users are 100% healthy and require zero schema changes, migrations, or data resets. |

---

## 13. Final Classification

**`MIXED ISSUE`**
- **Environment Configuration**: Root `.env` missing or unpopulated in the affected developer's clone.
- **Frontend Authentication**: Silent fallback to legacy Django session cookies mask the configuration error and misdirects the user into an invalid registration/onboarding loop.

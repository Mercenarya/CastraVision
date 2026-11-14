# CastraVision: Member Strategy References Investigation Report (Step 3)

## 1. Executive Summary

This investigation examines the current state of the **Strategy References** page for the **Member / Employee** role in CastraVision. 

### Key Findings
1. **Design Reference Source (`docs/Member FORM/`)**: **DOES NOT EXIST** in the workspace. An exhaustive filesystem search confirmed that the only Stitch export present is `docs/Leader FORM/stitch_castravision_core_workflows_ui/` (32 HTML files, all scoped to Leader workflows). The design specifications for Member Strategy References are established by `castravision_enterprise/DESIGN.md`, `CastraView/src/navigation/roleNavConfig.js`, and the working interactive specification in `CastraView/src/preview/DashboardPreviewPage.jsx`.
2. **Member Navigation Configuration**: **COMPLETE & VERIFIED**. `EMPLOYEE_NAV_ITEMS` in [roleNavConfig.js](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/navigation/roleNavConfig.js#L21-L30) already configures `{ key: 'strategy', label: 'Strategy Reference', icon: IconBookOpen }`.
3. **Header Breadcrumbs & Layout Title**: **COMPLETE & VERIFIED**. [MemberLayout.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/member/MemberLayout.jsx#L5-L16) correctly defines `strategy: 'Strategy Reference'` and renders breadcrumbs as `Member Workspace > Strategy Reference`.
4. **Active Component Integration**: **INCORRECT ROUTING / ARCHITECTURAL MISMATCH**. [App.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/App.jsx#L1661-L1669) connects `page === 'strategy'` for Member directly to `<StrategyScreen />` (the legacy FR01 editable generator form requiring budget input and "Generate Strategy" button), rather than a read-only Strategy Reference screen.
5. **Dedicated Member Component**: **MISSING**. [CastraView/src/member/screens/](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/member/screens/) contains only [MemberDashboard.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/member/screens/MemberDashboard.jsx). No dedicated `MemberStrategyReferences.jsx` exists in the codebase.
6. **Session & Refresh Continuity**: **VERIFIED & WORKING**. Following the Step 2B fix, the Member demo role and page `'strategy'` are fully allowlisted in `ROLE_ALLOWED_PAGES.member`. Refreshing (`F5`) successfully preserves the Member session and page state without redirecting to login.

---

## 2. Inspect the Design Source

### 2.1 Filesystem Search Results for Member FORM
- **Search path**: `d:\essclip\CAPSTONE2APP\CastraVision\docs\Member FORM\`
- **Result**: `Test-Path` returned `False`.
- **Classification**: **VERIFIED** — The folder `docs/Member FORM/` does not exist in the repository.

### 2.2 Global Stitch Search in `docs/`
- **Location found**: `docs/Leader FORM/stitch_castravision_core_workflows_ui/`
- **Total HTML files**: 32 files.
- **Role Scope**: All 32 files pertain exclusively to **Leader** and **Company Admin / Manager** flows (Approval Queue, Leader Dashboard, Budget/Content Review, Revision Modals, Leader Campaigns, Leader Performance, Leader Strategy Studio).
- **Employee Mentions**: The word "Employee" appears strictly as a target of Leader operations:
  - `leader_workspace_campaign_data_import_allocation.html`: Leader allocating tasks to squad employees ("Alex Rivera • EMPLOYEE", "Growth Lead • Employee", "Creative Specialist • Employee").
  - `leader_request_revision_modal.html`: Button label "Send Back to Employee".
  - `leader_workspace_performance_insights.html`: Leader viewing employee velocity metrics.
  - Zero dedicated Member/Employee workspace HTML files exist in the Stitch export.

### 2.3 Canonically Established Design Authority for Member Strategy Reference
In the absence of a standalone HTML file in `docs/Member FORM/`, the design authority is derived from:
1. **Design System Tokens**: [docs/Leader FORM/stitch_castravision_core_workflows_ui/castravision_enterprise/DESIGN.md](file:///d:/essclip/CAPSTONE2APP/CastraVision/docs/Leader%20FORM/stitch_castravision_core_workflows_ui/castravision_enterprise/DESIGN.md):
   - Background: `#0f131d` (surface), `#171b26` (surface-container-low), `#1c1f2a` (surface-container), `#262a35` (surface-container-high).
   - Borders: `#464554` (outline-variant), `#908fa0` (outline).
   - Text: `#dfe2f1` (on-surface), `#c7c4d7` (on-surface-variant).
   - Accents: `#8083ff` (primary-container), `#03b5d3` (secondary-container).
   - Typography: Plus Jakarta Sans (Headings), Inter (Body & Labels).
2. **Interactive Preview Specification**: [CastraView/src/preview/DashboardPreviewPage.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/preview/DashboardPreviewPage.jsx#L576-L591):
   - Eyebrow / Pill: `STRATEGY REFERENCE // READ-ONLY` (`#818cf8`, font-mono, uppercase).
   - Page Title: `Strategy Reference`.
   - Subtitle: `Brand tone, positioning, and persona guidelines configured for active deliverables.`
   - Permissions context: `FR03 Content Studio, Strategy Reference, Task Execution`.
   - Core Reference Blocks:
     - Primary Positioning Angle (`primary_angle`).
     - Target Audience / Persona Profile (`target_customers`).
     - Brand Voice & Tone (`Energetic, Confident, Direct`).
     - Channel Focus & Deliverable Guidelines.
   - Return CTA: `← Back to My Dashboard`.

---

## 3. Existing Member Implementation Structure

```
CastraView/src/
├── member/
│   ├── EmployeeSidebar.jsx       # Pinned Member navigation sidebar
│   ├── MemberLayout.jsx          # Shared layout shell (Header, Breadcrumb, Desktop/Mobile Sidebar)
│   ├── screens/
│   │   └── MemberDashboard.jsx   # ONLY existing Member screen (wraps MemberDashboardView)
│   └── ui/
│       ├── MemberDashboardView.jsx # Member dashboard grid, tasks, submissions, assistant
│       └── member.css            # Scoped styles for Member workspace
├── navigation/
│   └── roleNavConfig.js          # EMPLOYEE_NAV_ITEMS with key 'strategy' -> 'Strategy Reference'
└── preview/
    └── DashboardPreviewPage.jsx  # Contains reference mock implementation for Strategy Reference
```

### Detailed Component Analysis

#### A. Member Navigation ([roleNavConfig.js](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/navigation/roleNavConfig.js#L21-L30))
- **Status**: **VERIFIED**
- Navigation configuration for Employee:
  ```javascript
  export const EMPLOYEE_NAV_ITEMS = [
    { key: 'overview', label: 'My Dashboard', icon: IconGrid },
    { key: 'tasks', label: 'My Tasks', icon: IconCheckSquare, badge: 5, badgeColor: 'cyan' },
    { key: 'content', label: 'Content Studio', icon: IconSparkles },
    { key: 'assigned-campaigns', label: 'Assigned Campaigns', icon: IconMegaphone },
    { key: 'submissions', label: 'My Submissions', icon: IconFolder },
    { key: 'strategy', label: 'Strategy Reference', icon: IconBookOpen },
    { key: 'notifications', label: 'Notifications', icon: IconBell, badge: 2, badgeColor: 'gray' },
    { key: 'profile', label: 'My Profile', icon: IconUser },
  ]
  ```
- The key is `'strategy'`.
- The label is `'Strategy Reference'`.
- The icon is `IconBookOpen`.
- Active state works properly in [EmployeeSidebar.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/member/EmployeeSidebar.jsx).
- The item is not hidden by any permission guard.

#### B. Member Layout & Breadcrumbs ([MemberLayout.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/member/MemberLayout.jsx#L5-L16))
- **Status**: **VERIFIED**
- `MEMBER_PAGE_TITLES` explicitly maps `strategy: 'Strategy Reference'`.
- Top header renders breadcrumb: `Member Workspace > Strategy Reference`.

#### C. Page Component ([CastraView/src/member/screens/](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/member/screens/))
- **Status**: **VERIFIED - MISSING**
- Directory inspection confirms only `MemberDashboard.jsx` exists.
- There is no `MemberStrategyReferences.jsx` or similar component in `src/member/screens/`.

#### D. Routing and Integration in [App.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/App.jsx#L1661-L1669)
- **Status**: **VERIFIED - MISCONFIGURED**
- In `WorkspaceApp`, lines 1661–1669:
  ```javascript
  {page === 'strategy' && (
    <StrategyScreen
      profile={profile}
      latestRows={latestRows}
      result={strategy}
      setResult={setStrategy}
      notify={setToast}
    />
  )}
  ```
- `<StrategyScreen />` is the legacy FR01 editable generator form. It displays:
  - Header: `STRATEGY ENGINE // Strategy Studio`.
  - Subtitle: `Set campaign goals and target audience to generate data-driven marketing blueprints.`
  - Form: `Campaign Setup` with inputs for `Campaign Objective`, `Target Audience`, `Monthly Budget`, `Planned Channels`, and a button `ϟ Generate Strategy`.
  - Result panel: `No Strategy Generated Yet` with prompt to run the generator.
- **Architectural Conflict**: Employees/Members are content creators whose workflow requires viewing the **approved strategy reference** (guidelines, personas, tone) to produce marketing copy and assets. Giving them an editable budget allocation generator violates role boundaries and contradicts the navigation label ("Strategy Reference").

---

## 4. Stitch vs. Current Implementation Traceability Table

| Requirement / Specification | Existing Implementation | Status | Evidence / File Reference |
| :--- | :--- | :--- | :--- |
| **Member Sidebar Item** (`Strategy Reference`) | Configured with `key: 'strategy'` and `IconBookOpen` | **VERIFIED - COMPLETE** | [roleNavConfig.js:L27](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/navigation/roleNavConfig.js#L27) |
| **Sidebar Active State** | Highlighting active key `'strategy'` with accent bar | **VERIFIED - COMPLETE** | [EmployeeSidebar.jsx:L34](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/member/EmployeeSidebar.jsx#L34), [RoleSidebar.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/dashboards/RoleSidebar.jsx) |
| **Header Breadcrumb** | `Member Workspace > Strategy Reference` | **VERIFIED - COMPLETE** | [MemberLayout.jsx:L13,L153](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/member/MemberLayout.jsx#L13) |
| **Dedicated React Screen Component** | No component in `src/member/screens/` | **VERIFIED - MISSING** | `CastraView/src/member/screens/` directory listing |
| **App.jsx Member Page Rendering** | Renders legacy editable `<StrategyScreen />` form | **VERIFIED - INCORRECT** | [App.jsx:L1661-L1669](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/App.jsx#L1661-L1669) |
| **Read-Only Strategy Blueprint Card** | Brand tone, persona, positioning, and angles | **PARTIAL** (Mock exists only in preview) | [DashboardPreviewPage.jsx:L576-L591](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/preview/DashboardPreviewPage.jsx#L576-L591) |
| **Brand Voice & Positioning Guidelines** | Tone of voice, target persona, primary angle | **PARTIAL** (Mocked in preview, missing in main app) | [DashboardPreviewPage.jsx:L584-L587](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/preview/DashboardPreviewPage.jsx#L584-L587) |
| **Channel Focus & Content Deliverables** | Channel breakdown (Meta, Google, TikTok) for copywriters | **MISSING** in Member main view | [DashboardPreviewPage.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/preview/DashboardPreviewPage.jsx) |
| **Copy Snippet / Action Button** | "Copy Guidelines" or "Use in Content Studio →" | **MISSING** | No action button to link reference to Content Studio |
| **Empty State Handling** | Informative fallback when no strategy has been approved | **MISSING** (Shows generator empty state instead) | [App.jsx:L726-L731](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/App.jsx#L726-L731) |
| **Session Persistence on Refresh** | Restores Member role and page `'strategy'` | **VERIFIED - COMPLETE** | [App.jsx:L1033-L1037,L1240-L1246](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/App.jsx#L1033) |

---

## 5. Backend and Data Findings

1. **Available Endpoints**:
   - `GET /api/business-profile/`: Returns company name, industry, business size, target audience, preferred channels, and primary goal.
   - `GET /api/campaign-imports/`: Returns historical campaign performance rows.
   - `POST /api/strategies/generate/`: Generates structured strategy output (`primary_angle`, `rationale`, `budget_allocation`, `confidence`).
2. **Missing Strategy Endpoint for Member**:
   - There is currently **no dedicated endpoint** like `GET /api/strategies/current/` or `GET /api/strategy-references/` to fetch the workspace's currently approved strategy blueprint.
   - In `WorkspaceApp` ([App.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/App.jsx)), the generated strategy is stored in React state `strategy`. If no strategy has been generated in the current session, `strategy` is `null`.
3. **Data Strategy for Member Strategy Reference**:
   - When `strategy` exists from the workspace/backend, display the live data (`primary_angle`, `target_audience`, `budget_allocation`, `rationale`).
   - When `strategy` is `null` (default login state), display the active business profile parameters (`profile.target_customers`, `profile.primary_goal`, `profile.preferred_channels`) augmented with standard workspace brand guidelines, avoiding a blank or broken screen.
   - **Restriction**: Do NOT invent or mock non-existent backend endpoints. Use the existing props `profile` and `strategy` passed through `WorkspaceApp`.

---

## 6. Refresh and Session Findings

Following the implementation of Step 2B:
- **Allowlist Inclusion**: In [App.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/App.jsx#L1033-L1037), `ROLE_ALLOWED_PAGES.member` includes `'strategy'`.
- **Role Allowlist**: `DEMO_ROLES` includes `'member'`.
- **Restoration Behavior**:
  - `boot()` checks `localStorage.getItem('castravision_demo_role')`.
  - If `'member'`, it invokes `handleDemoLogin('member', savedPage)`.
  - The validated page `'strategy'` is restored.
  - Browser tests confirmed that reloading (`F5`) keeps the user in Member Workspace with `page = 'strategy'`.

---

## 7. Browser Investigation Results

| Step | Action | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :---: |
| 1 | Navigate to `http://localhost:5173/` | Display Login screen with Quick RBAC demo buttons | Displayed AuthScreen with 4 role demo buttons | **VERIFIED** |
| 2 | Click `✦ Member` (`Bengin2@gmail.com`) | Log in as Member and render Member Workspace | Logged in as Member; `MemberLayout` rendered | **VERIFIED** |
| 3 | Inspect Sidebar | "Strategy Reference" visible with `IconBookOpen` | Located at index 6 in sidebar | **VERIFIED** |
| 4 | Click "Strategy Reference" | Navigate to Strategy Reference view | URL remains `/`, active sidebar changes to Strategy Reference | **VERIFIED** |
| 5 | Inspect Rendered Content | Should display read-only brand guidelines | In main app: displays legacy editable Strategy Studio form (`<StrategyScreen />`). In preview mode: displays read-only reference mockup. | **VERIFIED** |
| 6 | Check Header Breadcrumb | `Member Workspace > Strategy Reference` | Displays `Member Workspace > Strategy Reference` | **VERIFIED** |
| 7 | Refresh Browser (`F5`) | Preserve Member session and remain on Strategy Reference | Preserved role and page without redirecting to login | **VERIFIED** |
| 8 | Check Console & Network | 0 runtime errors, no broken requests | 0 console errors; only standard Vite HMR logs | **VERIFIED** |

---

## 8. Root Cause Analysis

### Confirmed Causes
1. **Missing Dedicated Component**: No `MemberStrategyReferences.jsx` was ever created in `src/member/screens/`.
2. **Incorrect Component Binding in `App.jsx`**: [App.jsx:L1661](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/App.jsx#L1661) maps Member `page === 'strategy'` to `<StrategyScreen />` (a legacy form intended for strategy creation with budget and AI compute buttons), instead of a dedicated Member Strategy Reference view.
3. **Absence of Member Stitch Export**: The repository contains `docs/Leader FORM` but lacks `docs/Member FORM`. Developers relied on informal copy-pasting of legacy screens instead of creating the role-specific read-only reference.

### Assumptions (Disproven during audit)
- *Assumption: The sidebar item was missing.* -> **Disproven**: `Strategy Reference` is already present in `EMPLOYEE_NAV_ITEMS`.
- *Assumption: Refreshing redirects Member to Login.* -> **Disproven**: Step 2B fixed demo session persistence for all roles including Member.

---

## 9. Proposed Minimal Implementation Plan (Phase 4 / Step 3B)

### 1. New File to Create
- `CastraView/src/member/screens/MemberStrategyReferences.jsx`:
  - Implements the complete read-only Strategy References screen matching the enterprise design system in `DESIGN.md`.
  - Sections:
    1. **Header Banner**: Pill `STRATEGY REFERENCE // READ-ONLY`, title `Strategy References`, subtitle `Brand tone, positioning, and persona guidelines configured for active deliverables.`
    2. **Core Positioning Card**: Primary marketing angle, core value proposition, rationale.
    3. **Target Audience & Persona Profiles**: Demographics, behavioral attributes, key pain points.
    4. **Brand Voice & Editorial Tone**: Tone guidelines (e.g. "Energetic, Confident, Direct"), writing dos and don'ts for copywriters.
    5. **Channel Strategy Matrix**: Active flight channels (Meta, TikTok, Google Ads) with specific messaging hooks and recommended formats.
    6. **Quick CTA**: Button to navigate directly to `Content Studio` (`setPage('content')`) to apply the guidelines.
    7. **Safe Fallback**: Displays structured workspace fallback guidelines if AI strategy has not yet been generated.

### 2. File to Modify
- [CastraView/src/App.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/App.jsx):
  - Import `MemberStrategyReferences` from `./member/screens/MemberStrategyReferences`.
  - In Member rendering block (around line 1661), replace:
    ```javascript
    {page === 'strategy' && (
      <MemberStrategyReferences
        profile={profile}
        strategy={strategy}
        setPage={setPage}
        notify={setToast}
      />
    )}
    ```

### 3. Reusable Components & Dependencies
- Design system tokens from `src/styles/tokens.css` and `DESIGN.md`.
- UI components: [Card](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/components/ui/card.jsx), [Badge](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/components/ui/badge.jsx), [Button](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/components/ui/button.jsx).
- Icons from `lucide-react` (matching project stack).

### 4. Non-Goals / Restrictions
- Do NOT alter backend APIs or create new endpoints.
- Do NOT touch Leader Strategy Studio or other roles.
- Do NOT introduce new routing libraries.
- Do NOT commit or push code.

---

## 10. Lint and Build Verification Status

- `npm run lint` (`oxlint`): **0 errors**, 16 pre-existing warnings in mock test files.
- `npm run build` (`vite build`): **0 errors**, built in 4.29s.

---

*Report prepared in accordance with Step 3 READ-ONLY investigation instructions. Awaiting user approval before proceeding to implementation.*

# CastraVision: Marketing Manager Missing Pages Investigation Report (Step 4A)

## 1. Executive Summary

This investigation audits the current implementation status of three Marketing Manager (Company Admin) pages:
1. **Competitor Insights** (`page = 'insights'`)
2. **Budget & ROAS** (`page = 'budget'`)
3. **Reports** (`page = 'reports'`)

### Key Findings
1. **Design Sources Confirmed (`VERIFIED`)**: High-fidelity approved design mockups exist in `docs/UI/`:
   - [docs/UI/competitor&marketinsights.jpg](file:///d:/essclip/CAPSTONE2APP/CastraVision/docs/UI/competitor&marketinsights.jpg): *Competitor Analysis & Market Trends* (FR09 // Market Intelligence)
   - [docs/UI/budgetoptimization.jpg](file:///d:/essclip/CAPSTONE2APP/CastraVision/docs/UI/budgetoptimization.jpg): *Performance-Based Budget Allocation* (FR03 // Budget Optimization Engine)
   - [docs/UI/budgetrecommendationreview.jpg](file:///d:/essclip/CAPSTONE2APP/CastraVision/docs/UI/budgetrecommendationreview.jpg): *Review Budget Allocation Proposal* (FR03 → FR04 Transition)
   - [docs/UI/reportexport.jpg](file:///d:/essclip/CAPSTONE2APP/CastraVision/docs/UI/reportexport.jpg): *Export Periodic Reports* (FR07 // Report Generation & Export)
2. **Existing Modern Components in `src/pages/` (`VERIFIED`)**: Comprehensive, modern English implementations faithful to the design mockups **already exist** in `CastraView/src/pages/`:
   - [CastraView/src/pages/CompetitorInsightsPage.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/CompetitorInsightsPage.jsx)
   - [CastraView/src/pages/BudgetOptimizationPage.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/BudgetOptimizationPage.jsx)
   - [CastraView/src/pages/ReportsPage.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/ReportsPage.jsx)
   - [CastraView/src/pages/RecommendationReviewPage.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/RecommendationReviewPage.jsx)
3. **Legacy Components in `src/actor-ui/` (`VERIFIED`)**: Older Vietnamese prototype versions exist in [CastraView/src/actor-ui/ActorPages.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/actor-ui/ActorPages.jsx).
4. **Root Cause of Missing Screens (`VERIFIED`)**: In [App.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/App.jsx#L1411-L1453), the Marketing Manager rendering block passes children into `<MarketingManagerLayout />`. However, `App.jsx` **completely omits handlers** for `page === 'budget'`, `page === 'reports'`, and `page === 'insights'`. Consequently, [MarketingManagerLayout.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/company-admin/MarketingManagerLayout.jsx#L283-L285) renders `<div style={{ padding: '8px 0' }}>{children}</div>` with empty children, leaving the main viewport **blank**.
5. **Backend Data Status (`VERIFIED`)**: The Django backend (`CastraServices/urls.py`) currently has **zero endpoints** for market scraping, algorithmic budget rebalancing, or server-side report generation. All interactive elements on these screens operate via client-side state simulation.

---

## 2. Inspect Design References

### 2.1 Insights: `docs/UI/competitor&marketinsights.jpg`
- **Breadcrumb**: `CastraVision / Acme Corp / Marketing Suite` (In Marketing Manager: `CastraVision > Acme Corp > Competitor Intelligence & Insights`)
- **Eyebrow / Pill**: `FR09 // MARKET INTELLIGENCE` with `● Real-time Telemetry`
- **Title**: `Competitor Analysis & Market Trends`
- **Subtitle**: `Strategic benchmarks, competitor ad frequency, and category CPM/CPA market trends across enterprise direct-to-consumer cohorts.`
- **Top Metrics (4 Cards)**:
  1. `CATEGORY AVG CTR` [Leading]: `2.15%` vs Category (Acme Corp: 3.42% (+1.27% advantage))
  2. `INDUSTRY BENCHMARK CPA` [Cost Efficient]: `$32.40` Median (Acme Corp: $24.80 ($7.60 lower cost))
  3. `MARKET AD FREQUENCY` [Surging]: `+18.2%` QoQ (Increased competitor activity in Q4)
  4. `DOMINANT CATEGORY CHANNEL` [High Volume]: `Search` Google Ads (52% aggregate competitor budget share)
- **Tracked Competitors & Channel Footprint (3 Detected)**:
  - `Strider Athletics` [Direct Rival] (Spend: $45k–$60k, 142 ads, Meta 55% / Google 35% / TikTok 10%, Top Angle: "Lightweight Breathability")
  - `Apex Footwear Co.` [Trail & Utility] (Spend: $25k–$35k, 88 ads, Google 60% / Meta 30% / TikTok 10%, Top Angle: "Durability & Cushioning")
  - `Urban Pace Brand` [Fast Growing] (Spend: $15k–$25k, 46 ads, TikTok 50% / Meta 40% / Google 10%, Top Angle: "Streetwear Lifestyle")
- **Visual Chart**: `14-Day Category Impression Surge Profile` (Multi-line trend: Google Ads, Meta Ads, TikTok Ads)
- **Intelligence & Tactics Sidebar**:
  - `Category Trend Alert` [Action Required]: TikTok creative volume spike (+42% YoY, CPM +14%).
  - `Recommended Tactical Response`: Search Arbitrage Opportunity & Creative Positioning Pivot.
  - Action CTA: `Incorporate into Strategy (FR02)`
  - Feed Log: Real-time competitor creative additions and CPC bid adjustments.

### 2.2 Budget & ROAS: `docs/UI/budgetoptimization.jpg`
- **Eyebrow / Pill**: `FR03 // BUDGET OPTIMIZATION ENGINE` with `● Algorithm Model v4.18-Stable`
- **Title**: `Performance-Based Budget Allocation`
- **Subtitle**: `Analyze channel efficiency and optimize budget distribution based on verified performance metrics.`
- **Top Metrics (3 Cards)**:
  1. `CURRENT TOTAL BUDGET`: `$10,000.00 / month` (Baseline Window: Trailing 30 Days)
  2. `OPTIMIZED TARGET BUDGET`: `$12,500.00 / month` (Reallocation Variance: ↑ +$2,500.00 (+25.0%))
  3. `PROJECTED CPA IMPACT`: `$24.80 avg cost / acq` (Projected Efficiency: -14.0% CPA Reduction)
- **Active Algorithmic Constraints**: Maximum Monthly Spend Ceiling ($15,000), Target Maximum CPA Threshold ($26.00), Optimization Goal dropdown.
- **Current Allocation vs Proposed Rebalancing**:
  - Stacked distribution bar: Google 50%, Meta 35%, TikTok 15%.
  - Detail Rows:
    - *Google Search* [SCALING CANDIDATE]: $4,000 (40%) → $6,250 (50%), Delta: +$2,250 (+25%), ROAS: 4.20x / $21.20 CPA.
    - *Meta Ads* [MAINTAINED]: $4,000 (40%) → $4,375 (35%), Delta: +$375 (-5% Share), ROAS: 3.65x / $26.40 CPA.
    - *TikTok Video* [CAPPED / DEPRIORITIZED]: $2,000 (20%) → $1,875 (15%), Delta: -$125 (-5% Share), ROAS: 2.80x / $29.10 CPA.
- **Protocol & Review CTA**:
  - `↻ Run Analysis`
  - `Review Recommendation` (Links to `RecommendationReviewPage.jsx` / `docs/UI/budgetrecommendationreview.jpg`).

### 2.3 Report Export: `docs/UI/reportexport.jpg`
- **Eyebrow / Pill**: `FR07 // REPORT GENERATION & EXPORT` with `● Executive Suite Sync`
- **Title**: `Export Periodic Reports`
- **Subtitle**: `Generate and download marketing campaign performance summaries for executive review and partner distribution.`
- **Pipeline Indicator**: `Scheduled Pipeline: Daily Run: 06:00 UTC`
- **Builder Sections**:
  - Step 1: `Reporting Period` (Last 7 Days, Last 30 Days, Month to Date, Custom Range).
  - Step 2: `Campaign Selection` (Active campaign checkboxes with channel breakdown and spend).
  - Step 3: `Metric Selection` (Pill toggles: Impressions, CTR, CPA, ROAS, Channel Spend Breakdown).
  - Step 4: `Export Summary` (Timeframe, active campaigns, 3 networks channel bar, Executive Summary Note input, `Export PDF`, `Export CSV`, Email PDF toggle).
- **Recent Generated Reports Table**: Columns: File Name & Context, Generated Date, File Size, Status (`● Ready`), Action (`↓ Download`).

---

## 3. Existing Component Structure & Discrepancies

### 3.1 Marketing Manager Navigation
- [MarketingManagerSidebar.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/company-admin/MarketingManagerSidebar.jsx#L24-L36) defines all three items:
  - `{ key: 'budget', label: 'Budget & ROAS', Icon: IconTrendingUp, hasAiBadge: true }`
  - `{ key: 'reports', label: 'Reports', Icon: IconBarChart, hasAiBadge: true }`
  - `{ key: 'insights', label: 'Competitor Insights', Icon: IconSparkles, hasAiBadge: true }`
- Clicking any of these sets `page` state in `App.jsx`.

### 3.2 Layout & Breadcrumbs
- [MarketingManagerLayout.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/company-admin/MarketingManagerLayout.jsx#L118-L132) maps:
  - `budget: 'Budget Optimization & ROAS'`
  - `reports: 'Omnichannel Performance Reports'`
  - `insights: 'Competitor Intelligence & Insights'`
- Breadcrumbs render cleanly in [MarketingManagerHeader.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/company-admin/MarketingManagerHeader.jsx#L83-L90).

### 3.3 Component Duplication & Routing Void
- In `CastraView/src/pages/`:
  - `CompetitorInsightsPage.jsx` (Matches `competitor&marketinsights.jpg`)
  - `BudgetOptimizationPage.jsx` (Matches `budgetoptimization.jpg`)
  - `RecommendationReviewPage.jsx` (Matches `budgetrecommendationreview.jpg`)
  - `ReportsPage.jsx` (Matches `reportexport.jpg`)
- In `CastraView/src/actor-ui/ActorPages.jsx`:
  - Legacy Vietnamese prototype screens exist under the same names.
- In `CastraView/src/App.jsx`:
  - Line 16 imports the legacy `ActorPages.jsx` versions:
    ```javascript
    import {
      BudgetOptimizationPage,
      CompetitorInsightsPage,
    } from './actor-ui/ActorPages'
    ```
  - In the Marketing Manager block (`actorRole === 'manager'`, lines 1411–1453):
    **Neither `pages/` nor `actor-ui/` is wired up!**
    ```javascript
    <MarketingManagerLayout ...>
      {page === 'import' && <ImportScreen ... />}
      {page === 'strategy' && <StrategyScreen ... />}
      {page === 'content' && <ContentScreen ... />}
      {page === 'profile' && <ProfileScreen ... />}
      {/* MISSING: budget, reports, insights */}
    </MarketingManagerLayout>
    ```
  - Result: When a Marketing Manager navigates to Budget & ROAS, Reports, or Competitor Insights, `<MarketingManagerLayout>` receives no child elements and renders an empty blank viewport.

---

## 4. Traceability Tables

### Table 1: Competitor Insights (`page = 'insights'`)

| Design Requirement (`competitor&marketinsights.jpg`) | Existing Implementation | Status | Evidence / File |
| :--- | :--- | :--- | :--- |
| **Sidebar Navigation** | Item "Competitor Insights" (`key: 'insights'`) | **COMPLETE** | [MarketingManagerSidebar.jsx:L32](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/company-admin/MarketingManagerSidebar.jsx#L32) |
| **Breadcrumbs** | `CastraVision > Acme Corp > Competitor Intelligence & Insights` | **COMPLETE** | [MarketingManagerLayout.jsx:L128](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/company-admin/MarketingManagerLayout.jsx#L128) |
| **Top 4 KPI Metrics** | Category Avg CTR, Benchmark CPA, Ad Frequency, Dominant Channel | **COMPLETE** in `src/pages/` | [pages/CompetitorInsightsPage.jsx:L49](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/CompetitorInsightsPage.jsx#L49) |
| **Tracked Competitors List** | Strider Athletics, Apex Footwear Co., Urban Pace Brand cards | **COMPLETE** in `src/pages/` | [pages/CompetitorInsightsPage.jsx:L27-L35](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/CompetitorInsightsPage.jsx#L27-L35) |
| **Impression Surge Chart** | 14-day SVG line graph (Google, Meta, TikTok) | **COMPLETE** in `src/pages/` | [pages/CompetitorInsightsPage.jsx:L51](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/CompetitorInsightsPage.jsx#L51) |
| **Intelligence & Tactics** | Category Trend Alert, Tactical Response, Incorporate into Strategy | **COMPLETE** in `src/pages/` | [pages/CompetitorInsightsPage.jsx:L51](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/CompetitorInsightsPage.jsx#L51) |
| **Feed Log** | 3-item recent competitor activity stream | **COMPLETE** in `src/pages/` | [pages/CompetitorInsightsPage.jsx:L51](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/CompetitorInsightsPage.jsx#L51) |
| **App.jsx Manager Route** | Component not rendered in Marketing Manager branch | **MISSING** | [App.jsx:L1411-L1453](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/App.jsx#L1411-L1453) |

---

### Table 2: Budget & ROAS (`page = 'budget'`)

| Design Requirement (`budgetoptimization.jpg`) | Existing Implementation | Status | Evidence / File |
| :--- | :--- | :--- | :--- |
| **Sidebar Navigation** | Item "Budget & ROAS" (`key: 'budget'`) | **COMPLETE** | [MarketingManagerSidebar.jsx:L30](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/company-admin/MarketingManagerSidebar.jsx#L30) |
| **Breadcrumbs** | `CastraVision > Acme Corp > Budget Optimization & ROAS` | **COMPLETE** | [MarketingManagerLayout.jsx:L126](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/company-admin/MarketingManagerLayout.jsx#L126) |
| **Top 3 Budget Metric Cards** | Current Budget ($10k), Optimized Target ($12.5k), Projected CPA ($24.80) | **COMPLETE** in `src/pages/` | [pages/BudgetOptimizationPage.jsx:L28-L37](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/BudgetOptimizationPage.jsx#L28-L37) |
| **Active Algorithmic Constraints** | Monthly spend ceiling, CPA threshold, Optimization goal | **COMPLETE** in `src/pages/` | [pages/BudgetOptimizationPage.jsx:L40-L46](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/BudgetOptimizationPage.jsx#L40-L46) |
| **Channel Rebalancing Table** | Google Search (+25%), Meta Ads (Maintained), TikTok (Deprioritized) | **COMPLETE** in `src/pages/` | [pages/BudgetOptimizationPage.jsx:L48-L65](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/BudgetOptimizationPage.jsx#L48-L65) |
| **Normalized Stack Bar** | Google (50%), Meta (35%), TikTok (15%) | **COMPLETE** in `src/pages/` | [pages/BudgetOptimizationPage.jsx:L51](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/BudgetOptimizationPage.jsx#L51) |
| **Review Recommendation Flow** | `setPage('budget-review')` leading to proposal review | **COMPLETE** in `src/pages/` | [pages/RecommendationReviewPage.jsx](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/RecommendationReviewPage.jsx) |
| **App.jsx Manager Route** | Component not rendered in Marketing Manager branch | **MISSING** | [App.jsx:L1411-L1453](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/App.jsx#L1411-L1453) |

---

### Table 3: Reports (`page = 'reports'`)

| Design Requirement (`reportexport.jpg`) | Existing Implementation | Status | Evidence / File |
| :--- | :--- | :--- | :--- |
| **Sidebar Navigation** | Item "Reports" (`key: 'reports'`) | **COMPLETE** | [MarketingManagerSidebar.jsx:L31](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/company-admin/MarketingManagerSidebar.jsx#L31) |
| **Breadcrumbs** | `CastraVision > Acme Corp > Omnichannel Performance Reports` | **COMPLETE** | [MarketingManagerLayout.jsx:L127](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/company-admin/MarketingManagerLayout.jsx#L127) |
| **Scheduled Pipeline Header** | Daily Run: 06:00 UTC indicator | **COMPLETE** in `src/pages/` | [pages/ReportsPage.jsx:L17](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/ReportsPage.jsx#L17) |
| **Reporting Period Selector** | Last 7 Days, Last 30 Days, Month to Date, Custom Range | **COMPLETE** in `src/pages/` | [pages/ReportsPage.jsx:L20](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/ReportsPage.jsx#L20) |
| **Campaign Selection List** | Checkboxes for active/archived campaigns with spend | **COMPLETE** in `src/pages/` | [pages/ReportsPage.jsx:L21](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/ReportsPage.jsx#L21) |
| **Metric Selection Pills** | Impressions, CTR, CPA, ROAS, Channel Spend Breakdown | **COMPLETE** in `src/pages/` | [pages/ReportsPage.jsx:L22](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/ReportsPage.jsx#L22) |
| **Export Summary Panel** | Account, scope, 3 networks allocation bar, PDF/CSV export buttons | **COMPLETE** in `src/pages/` | [pages/ReportsPage.jsx:L24](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/ReportsPage.jsx#L24) |
| **Recent Generated Reports Table** | Table with PDF/CSV icons, file sizes, ready status, download buttons | **COMPLETE** in `src/pages/` | [pages/ReportsPage.jsx:L26](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/pages/ReportsPage.jsx#L26) |
| **App.jsx Manager Route** | Component not rendered in Marketing Manager branch | **MISSING** | [App.jsx:L1411-L1453](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/App.jsx#L1411-L1453) |

---

## 5. Backend and Data Findings

1. **Backend Endpoints (`CastraServices/urls.py`)**:
   - `auth/*`, `business-profile/`, `campaign-imports/*`, `strategies/generate/`.
   - **Zero endpoints exist** for:
     - Competitor crawling / web scraping (`/api/insights/`).
     - Algorithmic budget elasticity calculations (`/api/budget-optimization/`).
     - Server-side report aggregation & PDF/CSV compilation (`/api/reports/`).
2. **Current Frontend Data Handling**:
   - `pages/CompetitorInsightsPage.jsx` uses local simulated state with instant interactive refresh.
   - `pages/BudgetOptimizationPage.jsx` models the 3 guardrails, 90-day elasticity curve, and navigation to `RecommendationReviewPage`.
   - `pages/ReportsPage.jsx` provides interactive period selection, campaign toggles, and simulated file downloads with toast notifications (`notify?.(...)`).
3. **Security / Reliability Rule**:
   - No backend calls should be made for these features; client-side simulation must be preserved with clear notification disclaimers to prevent broken network requests (`404` / `500`).

---

## 6. Browser Investigation Results

| Scenario / Action | Expected Result | Actual Result in App | Classification |
| :--- | :--- | :--- | :---: |
| **Manager Login** | Authenticate via `GRFDonk@gmail.com` | Renders Marketing Manager Console | **VERIFIED** |
| **Click "Competitor Insights"** | Breadcrumbs update; page renders | Breadcrumb updates; main content area is **BLANK** | **VERIFIED** |
| **Click "Budget & ROAS"** | Breadcrumbs update; page renders | Breadcrumb updates; main content area is **BLANK** | **VERIFIED** |
| **Click "Reports"** | Breadcrumbs update; page renders | Breadcrumb updates; main content area is **BLANK** | **VERIFIED** |
| **Browser Refresh on Page** | Preserves session and page key | Role preserved; page preserved; content remains blank | **VERIFIED** |
| **Console Errors** | 0 runtime errors | 0 errors (empty div renders without throwing) | **VERIFIED** |

---

## 7. Confirmed Root Causes

1. **Integration Gap in `App.jsx`**:
   In [App.jsx:L1411-L1453](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/App.jsx#L1411-L1453), `<MarketingManagerLayout>` was provided with children only for `import`, `strategy`, `content`, and `profile`. The keys `budget`, `reports`, `insights` (and `budget-review`) were never wired up.
2. **Legacy Import Shadowing**:
   In [App.jsx:L16-L19](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/App.jsx#L16-L19), `BudgetOptimizationPage` and `CompetitorInsightsPage` were imported from the outdated `./actor-ui/ActorPages.jsx` file rather than the complete, design-compliant components in `./pages/`.
3. **No Code Loss**:
   The actual UI code for all three pages was written in `src/pages/` during earlier sprints, but simply left disconnected from the Marketing Manager shell.

---

## 8. Minimal Proposed Implementation Plan (Step 4B)

### 1. Update Imports in `CastraView/src/App.jsx`
Replace the legacy `./actor-ui/ActorPages` imports with the design-compliant `./pages/` components:
```javascript
import BudgetOptimizationPage from './pages/BudgetOptimizationPage'
import CompetitorInsightsPage from './pages/CompetitorInsightsPage'
import ReportsPage from './pages/ReportsPage'
import RecommendationReviewPage from './pages/RecommendationReviewPage'
```

### 2. Connect Routes in Marketing Manager Block of `App.jsx`
Inside `<MarketingManagerLayout ...>` (lines 1421–1450), add the missing page conditions:
```javascript
{page === 'insights' && (
  <CompetitorInsightsPage notify={setToast} setPage={setPage} />
)}
{page === 'budget' && (
  <BudgetOptimizationPage notify={setToast} setPage={setPage} />
)}
{page === 'budget-review' && (
  <RecommendationReviewPage notify={setToast} setPage={setPage} />
)}
{page === 'reports' && (
  <ReportsPage profile={profile || { business_name: 'Acme Corp' }} notify={setToast} />
)}
```

### 3. Update Allowlist in `getValidPageForRole`
Ensure `'budget-review'` is included in `ROLE_ALLOWED_PAGES.manager` so the recommendation review page can be restored on refresh.

### 4. Zero Backend Modifications
Keep all existing backend and API logic unchanged.

---

## 9. Verification & Build Status

- `npm run lint` (`oxlint`): **0 errors**, 16 pre-existing mock test warnings.
- `npm run build` (`vite build`): **0 errors**, compiled in 3.36s (`dist/assets/index-Bd_sCrt3.js`).

---

*Report prepared in accordance with Step 4A READ-ONLY investigation instructions. Awaiting approval before proceeding to implementation.*

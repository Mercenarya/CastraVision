# Implementation Report: Approved Stitch Designs for Manager Pages

**Date:** November 14, 2026  
**Project:** CastraVision Frontend (`CastraView`)  
**Target Role:** Marketing Manager (`manager` / `company_admin`)  
**Design Authority:** Google Stitch (`docs/UI/Manager/`) & `DESIGN.md`  

---

## 1. Executive Summary

This task successfully aligned the three core Marketing Manager workflow pages with their approved Google Stitch designs:
1. **Budget & ROAS** (`src/pages/BudgetOptimizationPage.jsx`)
2. **Reports** (`src/pages/ReportsPage.jsx`)
3. **Competitor Insights** (`src/pages/CompetitorInsightsPage.jsx`)

The implementation adheres to the dark precision design tokens (`#0f131d` background, `#1c1f2a` cards, `#464554` borders, `#4cd7f6` cyan accents, `#8083ff` indigo accents, `#dfe2f1` primary text), preserves existing state transitions and callback contracts (`setPage`, `notify`, `profile`), strictly maintains the Manager role identity, and introduces zero lint errors or build warnings.

---

## 2. Files Inspected & Modified

### Files Inspected
- `docs/UI/Manager/stitch_castravision_core_workflows_ui/castravision_enterprise/DESIGN.md`
- `docs/UI/Manager/stitch_castravision_core_workflows_ui/manager_performance_based_budget_allocation/manager_performance_based_budget_allocation.html` & `.png`
- `docs/UI/Manager/stitch_castravision_core_workflows_ui/manager_export_periodic_reports/manager_export_periodic_reports.html` & `.png`
- `docs/UI/Manager/stitch_castravision_core_workflows_ui/manager_competitor_analysis_market_trends/manager_competitor_analysis_market_trends.html` & `.png`
- `CastraView/src/App.jsx`
- `CastraView/src/company-admin/MarketingManagerLayout.jsx`
- `CastraView/src/company-admin/MarketingManagerSidebar.jsx`
- `CastraView/src/preview/DashboardPreviewPage.jsx`
- `CastraView/src/pages/RecommendationReviewPage.jsx`
- `CastraView/src/styles/tokens.css`

### Files Modified
- `CastraView/src/pages/BudgetOptimizationPage.jsx` (Re-implemented with approved Stitch layout)
- `CastraView/src/pages/ReportsPage.jsx` (Re-implemented with approved Stitch layout)
- `CastraView/src/pages/CompetitorInsightsPage.jsx` (Re-implemented with approved Stitch layout)

### Files Created
- `docs/manager_three_pages_implementation_report.md` (This document)

---

## 3. Page-by-Page Implementation Summary

### A. Budget & ROAS (`BudgetOptimizationPage.jsx`)
*Reference: `manager_performance_based_budget_allocation.html`*
- **Header & Algorithmic Status:**
  - Status pill: `Algorithm Confidence: 94.2%` with cyan indicator.
  - Title: `Performance-Based Budget Allocation` and subtitle.
  - Action buttons: `Refresh Analysis` (with spinning state) and `Review Recommendation`.
- **Optimization Recommendation Banner:**
  - Clear directive highlight detailing the reallocation from TikTok into Meta Advantage+ and Google High-Intent Search.
- **Top 3 KPI Metric Cards:**
  - **Total Marketing Budget:** `$125,000` (+8.5% scale vs $115,000 baseline).
  - **Current ROAS:** `3.42x` (+0.28x vs prev month, trailing 30 days).
  - **Projected ROAS:** `4.65x` (+1.23x projected net uplift of +$153,750).
- **Channel Budget Distribution & Recommendation (Left 8 Cols):**
  - Timeframe filter pills (`7 Days`, `14 Days`, `30 Days`, `This Quarter`).
  - 4 Channels with comparative progress bars (Current vs Target Recommended):
    - Meta Ads: $45,000 (36%) &rarr; $55,000 (44%) [+$10,000 / +22.2%]
    - Google Search Ads: $40,000 (32%) &rarr; $47,500 (38%) [+$7,500 / +18.8%]
    - TikTok Video Ads: $30,000 (24%) &rarr; $12,500 (10%) [-$17,500 / -58.3%]
    - Email Marketing: $10,000 (8%) &rarr; $10,000 (8%) [$0 / 0.0%]
  - Normalized 100% allocation progress bar and legend.
- **AI Reallocation Directives (Right 4 Cols):**
  - `MARKETING AI` badge with 4 structured plain-language directives.
  - Quick action: `Review Recommendation` button.
- **Channel Variance Matrix & Action Footer:**
  - Detailed tabular breakdown with current/projected ROAS and net variance.
  - Action buttons: `Reset Allocation` (resets draft state and notifies), `Save Draft Allocation` (saves local draft state and displays confirmation notice), and `Review Recommendation` (triggers `setPage('budget-review')`).

### B. Reports (`ReportsPage.jsx`)
*Reference: `manager_export_periodic_reports.html`*
- **Header:**
  - Status badge: `Reporting Engine Ready` with sync status.
  - Preset period quick selector (`Last 30 Days (Aug 1 - Aug 30, 2025)`).
  - `Refresh Data` button.
- **2-Column Workspace:**
  - **Left (7 Cols) - Configure Your Report:**
    - Timeframe Selector: Preset buttons (`7 Days`, `14 Days`, `30 Days`, `This Quarter`, `Custom Range`) and editable date inputs (`2025-08-01` to `2025-08-30`).
    - Campaign Selection: Dynamic count badge (`X of 4 selected`), `Select All` and `Clear` controls, 4 multi-channel campaign checkboxes.
    - Included Metrics: 8 toggleable metric pills with checkmark indicators.
    - Export Triggers: `Export PDF Report` and `Export CSV` buttons.
  - **Right (5 Cols) - Report Summary Preview:**
    - Live snapshot with `PREVIEW ESTIMATE (SAMPLE DATA)` badge.
    - Entity metadata summary using `profile?.business_name || 'Acme Corp Enterprise'`.
    - 2x2 Mini KPI Grid: Total Spend (`$118,500`), Target ROAS (`4.12x`), Total Conversions (`14,820`), Average CPA (`$7.99`).
    - Weekly Spend & Performance Trajectory SVG chart (Meta, Google, TikTok bars with ROAS trend line curve).
    - Multi-segmented channel share breakdown.
    - Executive AI takeaway highlight box.
- **Recent Reports Archive:**
  - Search input and format filter (`All Formats`, `PDF Documents`, `CSV Spreadsheets`).
  - Table showing Report Name, Reporting Period, Generated Date, Format badge, Status (`Ready`, `Processing`, `Failed`), and Action buttons (`Download PDF/CSV`, `Retry`).
  - Pagination bar.
- **Floating Export Toast Notification:**
  - Interactive toast demonstrating compilation progress and download readiness.

### C. Competitor Insights (`CompetitorInsightsPage.jsx`)
*Reference: `manager_competitor_analysis_market_trends.html`*
- **Header:**
  - Status: `Market Intelligence • Active` and `Updated 15 mins ago`.
  - Date range selector and `Refresh Data` button.
  - `Add Competitor` action button.
- **Group 1 - Market Overview (4 KPI Cards):**
  - Competitors Monitored: `6 Total` (3 Direct, 3 Discovered).
  - Market Ad Activity: `High` (+18% volume vs prev month).
  - Emerging Trends: `5 Detected` (Short-form video and lifestyle angles).
  - Estimated Opportunities: `8 Identified` ($14.2k conversion potential).
- **Group 2 - Competitor Comparison (3 Direct/Discovered Cards):**
  - Search bar and `Manage Targets` action.
  - Detailed cards for AeroAthletics Co. (AA), StrataSport Gear (SG), and VeloMotion Urban (VM) with Share of Voice indicators, channel badges, and recent activities.
- **Group 3 - Insights & Opportunities:**
  - Left (7 Cols): Market Activity & Share Trends:
    - 30-day comparative impression share SVG time-series line chart with Y-axis percentages (0%–100%) and X-axis dates (including Aug 21 Promo Spike).
    - Four identifiable lines with color legend (Cyan, Indigo, Teal, and Dashed White baseline for Acme Corp).
  - Right (5 Cols): Recommended Opportunities & Activity Feed:
    - High Impact: Counter Weekend Promo Campaign on Meta Ads (`Review in Content Studio`).
    - Medium Impact: Protect Branded Search Terms on Google Search (`Adjust Budget in ROAS`).
    - Recent notable competitor activities feed.

---

## 4. Manager Role Correction

All screens and navigation contexts have been strictly aligned to the **Manager / Marketing Manager** role:
- **Identity & Role Badge:** User identified as `Sarah Jenkins` with `Marketing Manager` role badge and `Acme Corp Enterprise` workspace identity.
- **Navigation Continuity:**
  - Budget & ROAS &rarr; `budget`
  - Reports &rarr; `reports`
  - Competitor Insights &rarr; `insights`
- **Breadcrumbs:**
  - Budget: `CastraVision > Acme Corp > Budget Optimization & ROAS`
  - Reports: `CastraVision > Acme Corp > Omnichannel Performance Reports`
  - Insights: `CastraVision > Acme Corp > Competitor Intelligence & Insights`
- **No Leader Leaks:** Zero Leader-specific labels, roles, sidebars, or permission checks are present on these pages. Leader, Employee, and System Admin layouts remain entirely untouched.

---

## 5. Existing Functionality Preserved

1. **Workflow `Budget & ROAS → Review Recommendation`:**
   - Clicking `Review Recommendation` on `BudgetOptimizationPage` calls `setPage('budget-review')`, smoothly rendering `RecommendationReviewPage`.
   - On `RecommendationReviewPage`, clicking `Back to Optimization` calls `setPage('budget')`, returning to the budget rebalance interface.
2. **Notification Pipeline:**
   - Action triggers (Refresh, Save Draft, Reset, Export PDF/CSV, Download, Retry) invoke `notify?.(message)`.
3. **Profile Fallback:**
   - `ReportsPage` respects `profile?.business_name` with a reliable fallback to `Acme Corp Enterprise`.

---

## 6. Mock & Demo Data Limitations

- **Simulated Metrics:** Channel variance calculations, KPI projections (4.65x ROAS), and recent reports are demonstration datasets modeled directly from the approved Google Stitch design artifacts.
- **Honest UI State:** Actions like "Save Draft Allocation" store a local draft state and inform the user that recommendations must proceed through formal approval workflows rather than claiming automated direct publishing.

---

## 7. Validation Results

### A. Linter (`oxlint`)
- **Status:** PASSED (0 errors).
- **Result:** Exactly 16 warnings (all 16 pre-existed in `button.jsx`, `badge.jsx`, `storeSeparation.test.js`, and `DashboardPreviewPage.jsx`). Zero new warnings or errors introduced.

### B. Production Build (`vite build`)
- **Status:** PASSED (built in 2.72s).
- **Bundle output:** Clean production chunks generated in `dist/`.

### C. Browser Verification (`browser_subagent`)
Verified in Chromium across multiple viewport configurations:
- **1440px (Desktop):** Full 12-column grid layout, sidebar fixed, cards and tables properly spaced with zero horizontal clipping.
- **1024px (Laptop):** Responsive grid columns wrap cleanly.
- **768px (Tablet):** Mobile header and menu icon activate, KPI cards wrap to 2-column grid, tables scroll with horizontal overflow protection.
- **Navigation Flow:** Verified Budget & ROAS &rarr; Recommendation Review &rarr; Back to Budget & ROAS.
- **Toast Notifications:** Verified floating export compilation toast and status indicators.

---

## 8. Summary of Screenshots Verified

| Screenshot File | Purpose | Verification Result |
|---|---|---|
| `budget_roas_loaded_1794594454533.png` | Budget & ROAS page verification | Matched Stitch design, KPIs ($125k, 3.42x, 4.65x), Channel distribution bars, Directives |
| `recommendation_review_page_1794594470842.png` | Workflow transition verification | Proposal Review page rendered with model rationale and Return button |
| `reports_page_1794594504503.png` | Reports page verification | 2-col configure & preview, KPI grid, SVG trajectory chart, recent reports archive |
| `competitor_insights_page_1794594525196.png` | Competitor Insights page verification | 4 KPI cards, 3 competitor profile cards, SVG share trends line chart, tactical opportunities |
| `responsive_768_1794594547063.png` | Responsive tablet test | Clean reflow, header collapse, no layout breakage |

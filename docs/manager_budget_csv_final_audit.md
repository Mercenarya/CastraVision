# Final Read-Only Audit: Marketing Manager Budget Draft Isolation & CSV Compatibility

**Audit Date:** November 14, 2026  
**Auditor:** Antigravity Pair Programmer  
**Mode:** Strictly READ-ONLY Audit (No source code modifications)  
**Target Files Inspected:**
- `CastraView/src/pages/BudgetOptimizationPage.jsx`
- `CastraView/src/pages/ReportsPage.jsx`
- `CastraView/src/App.jsx`
- `CastraView/src/company-admin/MarketingManagerLayout.jsx`
- `CastraView/src/preview/DashboardPreviewPage.jsx`

---

## 1. Executive Summary

This read-only audit concludes the implementation review of Step 4 (Marketing Manager Core Pages) with an in-depth evaluation of two specific concerns:
1. **Budget Draft Isolation**: Whether the browser-level draft persistence implemented via `localStorage` isolates data between different authenticated users and companies.
2. **CSV Compatibility**: Whether the client-side CSV export is structured and encoded for reliable rendering in Microsoft Excel and Google Sheets.

### Key Audit Conclusions:
- **Budget Draft Isolation: FAIL**. The storage key `castravision_manager_budget_draft_v1` is static and global to the browser origin. The stored JSON object contains zero identifiers for `userId`, `userEmail`, or `companyId`. Different users logging into the same browser will unintentionally load the previous user's draft allocations. Logout does not clear the draft key.
- **CSV Compatibility: PARTIAL**. The CSV generation implements correct RFC 4180 field quoting and escaping for commas, quotes, and line breaks, and enforces validation guards for empty selections. However, it lacks a UTF-8 Byte Order Mark (`\uFEFF`), causing Windows Excel to open non-ASCII/Vietnamese text with encoding artifacts (mojibake). Furthermore, the 7 metadata/notice rows prepended at the top cause spreadsheet tools to misidentify the header row and disable standard column filtering.
- **Step 4 Readiness: READY FOR DEMO / NEEDS FIXES FOR PRODUCTION**. For demo/prototype demonstration purposes, the core functional flows work as expected. For multi-tenant production release, the user-isolation key and CSV header format must be remediated.

---

## 2. Audit A – Budget Draft Isolation

### 2.1. Current Storage Schema & Implementation

The draft persistence in `CastraView/src/pages/BudgetOptimizationPage.jsx` is governed by:
- **Static Storage Key (Line 14):**
  ```javascript
  const STORAGE_KEY = 'castravision_manager_budget_draft_v1'
  ```
- **Stored Object Schema (Lines 147–152):**
  ```javascript
  const payload = {
    channels,
    timeframe,
    savedAt: timestamp,
    version: 1,
  }
  ```
- **Restoration Function (Lines 79–104):**
  ```javascript
  function loadStoredDraft() {
    if (typeof window === 'undefined' || !window.localStorage) return null
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.channels) && parsed.savedAt) {
        const isValid = BASELINE_CHANNELS.every((base) =>
          parsed.channels.some(
            (c) => c && c.id === base.id && typeof c.recommendedSpend === 'number'
          )
        )
        if (isValid) {
          return {
            channels: parsed.channels,
            timeframe: typeof parsed.timeframe === 'string' ? parsed.timeframe : '30 Days',
            savedAt: parsed.savedAt,
          }
        }
      }
    } catch (err) { ... }
    return null
  }
  ```

### 2.2. User & Company Isolation Analysis

1. **User Identifier:** **ABSENT**. The stored payload does not include `user_id`, `sub`, or email.
2. **Company / Tenant Identifier:** **ABSENT**. The stored payload does not include `company_id`, `workspace_id`, or `business_name`.
3. **Component Props (Line 106):**
   ```javascript
   export default function BudgetOptimizationPage({ notify, setPage })
   ```
   `BudgetOptimizationPage` does not accept `user`, `profile`, or `workspaceId` as props from `App.jsx` (Line 1453) or `DashboardPreviewPage.jsx` (Line 221).
4. **Validation on Load:** `loadStoredDraft()` performs no identity verification. It unconditionally parses and loads whatever is stored under the static key.
5. **Logout Behavior (`src/App.jsx` Lines 1020–1029, 1361–1376):**
   ```javascript
   function clearDemoSession() {
     try {
       if (typeof window !== 'undefined' && window.localStorage) {
         window.localStorage.removeItem(DEMO_STORAGE_KEY)
         window.localStorage.removeItem(PAGE_STORAGE_KEY)
       }
     } catch { ... }
   }
   ```
   `logout()` calls `clearDemoSession()`, which strictly removes session demo keys (`castravision_demo_session_v1`, `castravision_active_page_v1`). It leaves `castravision_manager_budget_draft_v1` completely untouched in `localStorage`.

### 2.3. Multi-Account Scenario Tracing

| Scenario | Expected Behavior | Actual System Behavior | Status |
|---|---|---|---|
| **User A saves draft** | User A can restore draft | Stored in `localStorage` and restored on mount | **PASS** |
| **User B logs in on same browser** | User B must not see User A's draft | `loadStoredDraft()` reads User A's draft; User B sees User A's allocations and timestamp | **FAIL** |
| **User A switches company** | Previous company's draft must not appear | Key is unscoped; draft persists regardless of workspace | **FAIL** |
| **User A logs out and logs in** | User A's draft restored if intended | Draft remains in `localStorage` across logout/login cycle | **PARTIAL** |
| **Browser refresh (F5)** | Draft persists | Restored cleanly from `localStorage` | **PASS** |

*Note on Application Architecture:* The CastraVision frontend currently ties one user profile to one company workspace (`profile.business_name`). Multiple company switching within a single session is not yet active in the UI; however, multi-account sharing on the same browser origin represents a clear isolation failure.

### 2.4. Storage Security & Architectural Limitations

- **Browser-Local Storage:** `localStorage` is purely client-bound. A marketing manager logging in from a second laptop or mobile browser cannot access their saved draft.
- **Demo vs. Production Suitability:**
  - **Demo Environment:** Sufficient for demonstrating draft survival across page navigation (`setPage('budget-review')`) and page reloads.
  - **Production Environment:** Unacceptable for enterprise deployment. Violates multi-tenant isolation principles, leaks commercial budget numbers between accounts sharing workstations, and fails cross-device synchronization.

---

## 3. Audit B – CSV Compatibility

### 3.1. CSV Structure & Data Assembly

Inspected from `CastraView/src/pages/ReportsPage.jsx` (Lines 227–264):
```javascript
const csvLines = [
  ['# CastraVision Omnichannel Performance Report', ''],
  ['# DATA NOTICE', 'Demonstration / sample dataset for planning purposes'],
  ['# Account Entity', entityName],
  ['# Reporting Period', `${startDate} to ${endDate} (${selectedTimeframe})`],
  ['# Export Timestamp', new Date().toISOString()],
  ['# Selected Campaigns Count', String(activeList.length)],
  ['# Selected Metrics Count', String(selectedMetrics.length)],
  [],
  ['Campaign ID', 'Campaign Name', 'Marketing Channels', 'Campaign Status', 'Allocated Spend', ...selectedMetrics],
]
```

#### Actual Serialized Output Sample:
```csv
# CastraVision Omnichannel Performance Report,
# DATA NOTICE,Demonstration / sample dataset for planning purposes
# Account Entity,Acme Corp Enterprise
# Reporting Period,2025-08-01 to 2025-08-30 (30 Days)
# Export Timestamp,2026-11-14T02:14:46.891Z
# Selected Campaigns Count,3
# Selected Metrics Count,2

Campaign ID,Campaign Name,Marketing Channels,Campaign Status,Allocated Spend,Return on Ad Spend (ROAS),Cost Per Acquisition (CPA)
camp-1,Summer Clearance Blitz 2025,Meta Ads • TikTok Ads,Active,"$34,820",4.12x,$7.99
camp-2,Always-On Brand Search,Google Search Ads,Active,"$28,450",4.85x,$11.20
camp-3,Advantage+ High Intent Catalog,Meta Advantage+,Active,"$41,230",4.40x,$8.50
```

### 3.2. Encoding and Escaping Analysis

1. **UTF-8 Blob Construction (Line 259):**
   ```javascript
   const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
   ```
   **BOM Evaluation:** The byte sequence `\uFEFF` is **NOT** included at the start of `csvString`.
2. **Escaping Function (Lines 147–154):**
   ```javascript
   function escapeCsvField(val) {
     if (val === null || val === undefined) return '""'
     const str = String(val)
     if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
       return `"${str.replace(/"/g, '""')}"`
     }
     return str
   }
   ```
   Complies with RFC 4180 rules for escaping double quotes (`""`) and encapsulating strings containing commas or line breaks.

### 3.3. Spreadsheet Compatibility Assessment

*(Distinction: Code-level static analysis and Node.js serialization verification vs. desktop application verification).*

#### 1. Microsoft Excel Compatibility:
- **Header Identification Issue:** In RFC 4180 and Microsoft Excel, lines starting with `#` are **NOT** treated as comments. Excel reads Row 1 as the column header. Consequently:
  - Column A is named `# CastraVision Omnichannel Performance Report`.
  - Column B is empty.
  - Columns C through G have no headers in Row 1.
  - The actual table header appears on **Row 9**, meaning automated filtering, sorting, and pivot tables attached to Row 1 fail to recognize the data table.
- **UTF-8 Character Encoding (Windows Excel):** When a `.csv` file without a UTF-8 BOM (`\uFEFF`) is opened by double-clicking in Windows, Excel defaults to the local ANSI code page (Windows-1252). Non-ASCII characters (such as the bullet separator `•` in `Meta Ads • TikTok Ads` or Vietnamese diacritics like `Thời gian`, `Chiến dịch`) render as mojibake (e.g. `â€¢`).
- **Data Type Interpretation:** Metric values containing non-numeric symbols (`"$34,820"`, `4.12x`, `"$7.99"`, `"3.42%"`) are classified by Excel as **Text strings**, preventing direct calculation (`=SUM()`, `=AVERAGE()`) without pre-cleaning.

#### 2. Google Sheets Compatibility:
- **Header Identification:** Google Sheets also imports Row 1 as the first row. Clicking "Data > Create a filter" attaches filter controls to Row 1 rather than Row 9.
- **UTF-8 Encoding:** Google Sheets natively detects UTF-8 encoding even without a BOM; characters like `•` and Vietnamese diacritics display legibly when imported.
- **Data Type Interpretation:** Google Sheets interprets currency strings like `"$34,820"` as text or currency depending on regional locale settings, while values like `4.12x` are consistently treated as text.

### 3.4. Test Case Results (Code-Level Verification)

| Test Case | Code Path / Handler | Actual Behavior | Result |
|---|---|---|---|
| **Campaign name contains a comma** | `escapeCsvField('Summer, Fall Campaign')` | Output: `"Summer, Fall Campaign"` | **PASS** |
| **Campaign name contains quotes** | `escapeCsvField('Special "Flash" Sale')` | Output: `"Special ""Flash"" Sale"` | **PASS** |
| **Text contains line breaks** | `escapeCsvField("Line 1\nLine 2")` | Output: `"Line 1\nLine 2"` | **PASS** |
| **Vietnamese diacritics** | `new Blob([csvString], ...)` without BOM | Google Sheets: Legible.<br>Excel Windows: Mojibake without BOM. | **PARTIAL** |
| **No campaigns selected** | `selectedCampaigns.length === 0` (Lines 202–210) | Blocks download, shows warning toast | **PASS** |
| **No metrics selected** | `selectedMetrics.length === 0` (Lines 212–220) | Blocks download, shows warning toast | **PASS** |
| **Multiple campaigns/metrics selected** | Filtered array mapping (Lines 239–251) | Correctly restricts output to selected subset | **PASS** |

---

## 4. Issues Found

### Issue 1: Shared Browser Draft Leakage (High Severity)
- **File:** `CastraView/src/pages/BudgetOptimizationPage.jsx` (Lines 14, 82, 147)
- **Description:** Static key `castravision_manager_budget_draft_v1` is shared globally on the browser origin with no user/tenant binding.
- **Reproduction:**
  1. User A logs in as Marketing Manager, edits Meta budget to $60,000, and clicks "Save Draft Allocation".
  2. User A logs out.
  3. User B logs in as Marketing Manager on the same browser and visits Budget & ROAS.
  4. User B immediately sees User A's $60,000 budget draft and timestamp.

### Issue 2: Jagged CSV Preamble Causing Header Misidentification (Medium Severity)
- **File:** `CastraView/src/pages/ReportsPage.jsx` (Lines 227–237)
- **Description:** Prepended metadata lines (`# CastraVision...`) are placed in the first 7 rows of the CSV.
- **Reproduction:**
  1. Export CSV from Reports page.
  2. Open the file in Excel or Google Sheets.
  3. Notice Row 1 is treated as the column header, placing actual column names on Row 9 and breaking automatic table filtering.

### Issue 3: Missing UTF-8 BOM for Microsoft Excel (Medium Severity)
- **File:** `CastraView/src/pages/ReportsPage.jsx` (Line 259)
- **Description:** `Blob([csvString])` omits the byte order mark `\uFEFF`.
- **Reproduction:**
  1. Double-click the exported `.csv` on a standard Windows machine with Excel.
  2. Channel bullets `•` and non-ASCII characters appear corrupted as `â€¢`.

---

## 5. Recommendations (Advisory Only — No Source Code Changes Made)

### Minimum Improvements for Demo / Local Test Environment:
1. **User-Scoped Draft Key:**
   Pass `user` and `profile` to `BudgetOptimizationPage` from `MarketingManagerLayout.jsx` / `App.jsx`. Construct the storage key dynamically:
   ```javascript
   const userKey = user?.id || user?.email || 'default'
   const storageKey = `castravision_budget_draft_${userKey}`
   ```
2. **Add UTF-8 BOM to CSV Blob:**
   Prepend `\uFEFF` when creating the Blob in `ReportsPage.jsx`:
   ```javascript
   const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' })
   ```
3. **Standardize CSV Header Structure:**
   Place the table headers on **Row 1** for spreadsheet compatibility, and move metadata notes either to the filename, footer rows, or separate metadata columns:
   ```javascript
   const csvLines = [
     ['Campaign ID', 'Campaign Name', 'Marketing Channels', 'Campaign Status', 'Allocated Spend', ...selectedMetrics],
     ...dataRows,
   ]
   ```

### Production Architecture Requirements:
1. **Database Draft Persistence:** Migrate draft allocations to a Supabase table (`marketing_budget_drafts`) with foreign keys to `user_id` and `company_id`.
2. **Clean Numeric Export:** Export raw numeric fields (e.g. `34820` instead of `"$34,820"`, `4.12` instead of `"4.12x"`) so enterprise analysts can immediately run formulas, with formatting handled by spreadsheet number formats.

---

## 6. Final Verdict

| Audit Domain | Verdict | Summary |
|---|---|---|
| **Budget Draft Isolation** | **FAIL** | Draft persists, but static un-scoped key permits cross-account draft leakage on shared browsers. |
| **CSV Compatibility** | **PARTIAL** | Escaping and validation pass; missing BOM and top preamble rows degrade Excel/Sheets header parsing. |
| **Step 4 Readiness** | **READY FOR DEMO / NEEDS FIXES FOR PROD** | Approved Stitch visual design and demo workflows are fully operational. Isolation and CSV header cleanup are needed before production deployment. |

*(Verification of Microsoft Excel and Google Sheets was conducted via static code-level analysis and Node.js serialization testing. Desktop application execution is noted where applicable).*

---
name: CastraVision Enterprise
colors:
  surface: '#0f131d'
  surface-dim: '#0f131d'
  surface-bright: '#353944'
  surface-container-lowest: '#0a0e18'
  surface-container-low: '#171b26'
  surface-container: '#1c1f2a'
  surface-container-high: '#262a35'
  surface-container-highest: '#313540'
  on-surface: '#dfe2f1'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#dfe2f1'
  inverse-on-surface: '#2c303b'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#d0bcff'
  on-tertiary: '#3c0091'
  tertiary-container: '#a078ff'
  on-tertiary-container: '#340080'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d0bcff'
  on-tertiary-fixed: '#23005c'
  on-tertiary-fixed-variant: '#5516be'
  background: '#0f131d'
  on-background: '#dfe2f1'
  surface-variant: '#313540'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies a modern, technical, and high-performance dark aesthetic tailored for enterprise marketing automation and machine-learning orchestration workflows. The interface conveys analytical precision, operational stability, and rapid execution.

Visual characteristics:
- **Style Archetype:** Modern Technical Precision.
- **Strict Color Execution:** Purely solid surfaces, indicators, buttons, and badges. Absolutely zero gradients, backdrop blurs, or glow effects.
- **Spatial Temperament:** Dense yet organized, providing high scanability for complex multi-node automation graphs, analytics feeds, and tabular data.
- **Emotional Intent:** Unwavering command, clarity under dense data loads, and instant cognitive mapping through functional color coding.

## Colors

The color palette is built exclusively around opaque, flat color planes. Every surface and interactive state maintains strict high contrast without gradient fills or ambient light bleeds.

### Surface System
- **Base Canvas:** `#0B0F19` — Root application background.
- **Structural Nav & Chrome:** `#0F172A` — Sidebar, top navigation bar, drawer shells.
- **Elevated Canvas / Cards:** `#1E293B` — Dashboard cards, content panels, modular blocks.
- **Inputs & Inset Controls:** `#141E33` — Default input canvas, search fields, embedded code panels.
- **Borders & Dividers:** `#334155` — Structural hairpins, explicit boundaries, container perimeters.

### Semantic & Interaction Palette
- **Primary Accent:** `#6366F1` — Core operational tasks (`Continue`, `Generate`, `Import`, `Upload`, `Submit`, `Confirm`).
- **Secondary Accent:** `#06B6D4` — AI workflow nodes, dynamic execution paths, metrics highlights.
- **Tertiary Accent:** `#8B5CF6` — Integration hooks, batch processors, sequence triggers.
- **Success / Commit:** `#22C55E` — Direct save triggers (`Save`), successful deployment tags.
- **Destructive / Alert:** `#EF4444` — Destructive operations (`Reset`, `Delete`), validation alerts.
- **High-Contrast Neutral Action:** `#FFFFFF` fill with `#0F172A` text — Utility triggers (`Edit`, `Refresh`).

### Typography Contrast
- **Text Primary:** `#F8FAFC` — High legibility for critical figures, headlines, and control text.
- **Text Secondary:** `#94A3B8` — Column titles, operational metadata, subheadings.
- **Text Muted:** `#64748B` — Inactive statuses, placeholder values, inactive counter badges.

## Typography

Typography prioritizes fast data ingestion and strict UI hierarchy. `Plus Jakarta Sans` provides a contemporary, authoritative geometry for view titles, card headings, and modal banners. `Inter` renders tabular datasets, flow configurations, labels, and system messages with maximum optical clarity.

- **Numerics:** Use tabular figures (`font-variant-numeric: tabular-nums`) across all metrics grids, execution runtimes, and parameter counters.
- **Scale Usage:** Headline tokens are strictly reserved for viewport headers and card groupings; dense interfaces rely heavily on `body-md` and `label-md` for form fields and control items.

## Layout & Spacing

The layout is anchored by a persistent collapsible lateral navigation rail (`260px` default, `64px` collapsed) and a fixed `64px` header on `#0F172A`.

- **Primary Desktop Grid:** 12-column layout bound inside a `1200px` content container, centered within the remaining viewport canvas.
- **Vertical Rhythm:** Multiples of `4px` / `8px`. Dense workflow controls utilize `space-sm` (`8px`) gaps; distinct functional modules separate by `space-lg` (`24px`).
- **Adaptive Breakpoints:**
  - `Desktop (>= 1024px)`: Standard 12-column flow with persistent navigation and `margin` (`32px`).
  - `Tablet (768px - 1023px)`: 8-column layout, sidebar transitions to an overlay drawer, `gutter` steps down to `16px`.
  - `Mobile (< 768px)`: 4-column layout, bottom app bar or hamburger pattern, horizontal margin fixed at `margin-mobile` (`16px`).

## Elevation & Depth

Visual hierarchy is maintained without drop shadows, glows, or translucent blurred backgrounds. Depth is communicated strictly via tonal stacking and 1px borders.

1. **Plane 0 (Canvas):** `#0B0F19` — Deepest visual layer.
2. **Plane 1 (Structural Shells):** `#0F172A` with a right/bottom border of `1px solid #334155`.
3. **Plane 2 (Modular Cards & Panels):** `#1E293B` bounded by a `1px solid #334155` border.
4. **Plane 3 (In-Card Controls & Inset Fields):** `#141E33` with a `1px solid #334155` border.
5. **Plane 4 (Overlays & Dialogs):** `#1E293B` bordered by `1px solid #334155`, layered above a flat, opaque `#000000` backdrop at `70%` opacity (no blur filter).

## Shapes

A strict universal radius system aligns technical UI discipline with modern interface construction:
- **Default Control Radius:** `8px` (`0.5rem`) applied uniformly across buttons, input fields, dropdown trigger targets, notification banners, and status chips.
- **Container Radius:** `8px` (`0.5rem`) applied to cards, workflow nodes, inner split panels, and modals.
- **Micro Tokens:** `4px` (`0.25rem`) reserved strictly for nested sub-controls like inline checkbox marks, scrollbars, and segmented tab pills.

## Components

### Buttons
Buttons employ concise, single-word or two-word action verbs, flat solid color fills, and 8px border radius. No drop shadows or gradients.
- **Primary Actions (`Continue`, `Generate`, `Import`, `Upload`, `Submit`, `Confirm`):** Background `#6366F1`, text `#FFFFFF`. Hover: solid `#4F46E5`.
- **Save Action (`Save`):** Background `#22C55E`, text `#FFFFFF`. Hover: solid `#16A34A`.
- **Destructive Action (`Reset`, `Delete`):** Background `#EF4444`, text `#FFFFFF`. Hover: solid `#DC2626`.
- **Utility / Tertiary Action (`Edit`, `Refresh`):** Background `#FFFFFF`, text `#0F172A`. Hover: solid `#E2E8F0`.
- **Secondary Ghost Action (`Cancel`):** Background transparent, border `1px solid #334155`, text `#F8FAFC`. Hover: background `#141E33`.

### Input Fields & Floating Labels
- Form controls must feature integrated floating labels within the input box boundary.
- **Surface:** `#141E33` background with `1px solid #334155`. Height: `52px`.
- **Label State (Resting / Empty):** `#64748B`, positioned centered at `14px` font size.
- **Label State (Focused / Floated):** `#94A3B8`, scaled down to `11px`, pinned `8px` from the top edge. Input value text sits at `14px` (`#F8FAFC`) pinned `8px` below the label.
- **Focus State:** Border changes to `1px solid #6366F1` with zero glow/box-shadow.
- **Requirements Notation:** No red asterisks anywhere. Optional inputs are denoted by the word `(optional)` appended to the floating label string.

### Cards & Panels
- **Surface:** Solid `#1E293B`, border `1px solid #334155`, border-radius `8px`.
- **Header Structure:** Border-bottom `1px solid #334155`, padding `16px 20px`.
- **Body Area:** Padding `20px`.

### Checkboxes & Radio Buttons
- **Unchecked:** Size `18px`, border `1px solid #334155`, background `#141E33`, border-radius `4px` (checkbox) or `50%` (radio).
- **Checked:** Background `#6366F1`, border `1px solid #6366F1`. Icon or inner radio pip in solid `#FFFFFF`.

### Chips & Status Badges
- **Shape:** Height `24px`, padding `0 10px`, border-radius `8px`.
- **Structure:** Solid fills with high-contrast text; no gradients.
  - Active / Live: Background `#22C55E`, text `#FFFFFF`.
  - Processing: Background `#06B6D4`, text `#0B0F19`.
  - Queued: Background `#8B5CF6`, text `#FFFFFF`.
  - Terminated / Failed: Background `#EF4444`, text `#FFFFFF`.
  - Neutral / Draft: Background `#334155`, text `#F8FAFC`.

### Workflow Pipeline Nodes
- **Structure:** Canvas nodes for AI sequences rendered in solid `#1E293B` with `1px solid #334155`.
- **State Accent:** Top indicator line of `3px solid` using `#06B6D4` (AI task) or `#8B5CF6` (data trigger).
- **Handle Connectors:** `12px` solid square pins on `#0F172A` with `#334155` stroke.
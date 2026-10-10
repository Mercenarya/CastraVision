# TEST Directory - Dashboard Template

This directory contains test files and templates for the CastraVision project.

## dashboard.html

A simple but modern marketing analytics dashboard built with HTML/CSS/JavaScript that demonstrates:

### Features:
- **Responsive Design**: Works on mobile, tablet, and desktop devices
- **Modern UI**: Clean, professional interface following current design standards
- **CastraVision Branding**: Uses the project's navy, lavender, and cyan color scheme
- **Key Metrics Display**: Shows total spend, ROAS, CPA, and conversions
- **Channel Performance**: Visualizes performance across Meta, Google Ads, and TikTok
- **Budget Allocation**: Shows how budget is distributed across channels
- **Recent Activity**: Displays recent actions and their status
- **Accessibility**: Follows WCAG guidelines for color contrast and readability
- **Dark Mode Support**: Automatically adapts to user's system preferences
- **Interactive Elements**: Hover effects, active states, and clickable navigation

### How it relates to CastraVision:
- Mirrors the navigation structure found in `CastraView/src/App.jsx`
- Uses data concepts from the project's models (BusinessAccount, CampaignImport)
- Reflects the dashboard functionality mentioned in SPRINT1_SETUP.md as part of FR01
- Follows the UI/UX principles outlined in SPRINT1_UI.md
- Could serve as a starting point for implementing the actual dashboard in the React frontend

### Technologies Used:
- HTML5 Semantic Elements
- CSS3 Custom Properties (Variables)
- Flexbox & Grid Layout
- Vanilla JavaScript (no frameworks required for this demo)
- Responsive Design Principles
- Accessibility Best Practices

### To Use:
1. Open `dashboard.html` in any modern web browser
2. Resize the browser to see responsive behavior
3. Toggle dark mode in your operating system to see the dark theme
4. Click navigation items to see active state changes

### Notes:
- This is a static demonstration - in the actual CastraVision application, this would be replaced with a React component that fetches real data from the API
- The chart areas are placeholders - in a real implementation, these would use a charting library like Recharts or Chart.js
- All data shown is mock data based on examples from the project documentation

### Connection to Project Notebooks:
This dashboard implements concepts documented in:
- `notebooks/PROJECT_OVERVIEW.md` - Overall project structure and data flow
- `notebooks/QUICK_REFERENCE.md` - Quick reference to key components and APIs
- `notebooks/DASHBOARD_TEMPLATE.md` - Detailed dashboard component template
- `notebooks/DASHBOARD_TEST_EXAMPLE.md` - Testing approaches for dashboard components
# CastraVision Dashboard Template

This template provides a starting point for implementing a marketing analytics dashboard in the CastraVision project, based on the project structure and requirements documented in the notebooks.

## Dashboard Purpose
The dashboard should provide SMB owners with a quick overview of their marketing performance across Meta, Google Ads, and TikTok channels, showing key metrics, budget allocation, and campaign insights.

## Key Components Based on Project Analysis

### 1. Layout Structure (from App.jsx)
- Sidebar navigation with: Overview, Strategy, Content, Import, Profile
- Main content area that changes based on selected navigation item
- Top bar showing current page/user info
- Consistent branding throughout

### 2. Data Sources (from notebooks)
- Business profile data (BusinessAccount model)
- Historical campaign data (CampaignImport model)
- Strategy recommendations (from /api/strategies/generate/)
- Knowledge base insights (RAG system)

### 3. Suggested Dashboard Sections

#### A. Key Metrics Row
- Total Spend (this month)
- Overall ROAS
- Average CPA
- Total Impressions
- Total Clicks
- Total Conversions

#### B. Channel Performance
- Bar chart comparing ROAS by channel
- Pie chart showing budget allocation
- Table with metrics per channel (CTR, CPA, ROAS, Spend)

#### C. Trend Analysis
- Line chart showing spend/performance over time (weekly/monthly)
- Comparison of current period vs previous period

#### D. Campaign Insights
- Top performing campaigns
- Recommended actions from strategy engine
- Budget optimization suggestions

#### E. Quick Actions
- Create new strategy
- Import new campaign data
- View detailed reports

## Implementation Guidelines

### Frontend (React/Vite)
1. Create a new Dashboard component in `CastraView/src/components/`
2. Add route to the NAV array in App.jsx
3. Use Recharts or Chart.js for visualizations (would need to be added to package.json)
4. Fetch data from:
   - `/api/business-profile/` (GET)
   - `/api/campaign-imports/` (GET for history)
   - `/api/strategies/generate/` (POST for latest strategy)
   - Consider adding new endpoints for aggregated metrics

### Styling Approach
- Use existing CSS variables from App.css and index.css
- Follow the navy, lavender, cyan color scheme mentioned in SPRINT1_UI.md
- Ensure responsive design (mobile-first)
- Maintain accessibility standards (contrast 4.5:1, proper labels, keyboard navigation)

### Example Dashboard Component Structure
```jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [chartData, setChartData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch dashboard data
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // In a real implementation, you'd call APIs here
      // const businessData = await fetch('/api/business-profile/').then(res => res.json());
      // const importsData = await fetch('/api/campaign-imports/').then(res => res.json());
      
      // For now, using mock data based on notebook examples
      setMetrics({
        totalSpend: 2500000,
        overallRoas: 2.8,
        avgCpa: 42000,
        totalImpressions: 150000,
        totalClicks: 3200,
        totalConversions: 60
      });
      
      setChartData({
        channels: ['Meta', 'Google Ads', 'TikTok'],
        roas: [2.5, 3.2, 2.7],
        budgetAllocation: [50, 30, 20],
        ctr: [1.8, 2.4, 3.1],
        cpa: [45000, 38000, 48000]
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  if (!metrics) return <div className="dashboard-loading">Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Marketing Dashboard</h1>
        <div className="dashboard-actions">
          <button onClick={() => navigate('/strategy')}>
            Create New Strategy
          </button>
          <button onClick={() => navigate('/import')}>
            Import Campaign Data
          </button>
        </div>
      </header>

      <section className="metrics-row">
        {/* Key metrics cards would go here */}
        <div className="metric-card">
          <h3>Total Spend</h3>
          <p className="metric-value">{metrics.totalSpend.toLocaleString()} VND</p>
          <p className="metric-label">This Month</p>
        </div>
        {/* ... other metric cards */}
      </section>

      <section className="charts-row">
        {/* Charts would go here */}
        <div className="chart-container">
          <h3>ROAS by Channel</h3>
          {/* Chart visualization */}
        </div>
        <div className="chart-container">
          <h3>Budget Allocation</h3>
          {/* Pie chart */}
        </div>
      </section>

      <section className="insights">
        <h2>Campaign Insights</h2>
        {/* Insights and recommendations */}
        <div className="insight-card">
          <h3>Performance Summary</h3>
          <p>Your Meta campaigns are performing best with a ROAS of 2.5x</p>
          <p>Consider increasing budget to Meta by 10% for better overall returns</p>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
```

### Recommended Packages to Add
For charts and enhanced UI:
```
npm install recharts   // For charts
npm install @headlessui/react // For accessible UI components
npm install @heroicons/react  // For icons
```

### Accessibility Considerations
- Ensure all charts have accessible labels and descriptions
- Use sufficient color contrast (minimum 4.5:1)
- Provide keyboard navigation for all interactive elements
- Include ARIA labels for screen readers
- Ensure touch targets are at least 44x44px

### Performance Optimization
- Implement data fetching with proper loading states
- Consider memoization for expensive chart calculations
- Use virtualization for large data tables
- Optimize image assets (use WebP/AVIF where applicable)

## Integration Steps
1. Create `CastraView/src/components/Dashboard.jsx`
2. Create `CastraView/src/components/Dashboard.css`
3. Add Dashboard route to NAV array in App.jsx
4. Add necessary imports and routing logic
5. Implement actual API calls to fetch real data
6. Add chart visualizations using selected library
7. Test responsiveness and accessibility

## Connection to Notebooks Documentation
This template aligns with:
- PROJECT_OVERVIEW.md: Describes the data flow and components
- QUICK_REFERENCE.md: Provides quick reference to key files and API endpoints
- SPRINT1_SETUP.md: Mentions the dashboard as part of FR01 scope
- SPRINT1_UI.md: References the dashboard screen in the UI flow

## Next Steps for Implementation
1. Define actual API endpoints for dashboard-specific data
2. Create mock data services for development/testing
3. Implement the Dashboard component with real data fetching
4. Add unit and integration tests
5. Conduct user testing with SMB owners for feedback
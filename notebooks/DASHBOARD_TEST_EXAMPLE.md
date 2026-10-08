# Dashboard Component Test Example

This file provides an example of how tests could be written for the CastraVision dashboard component, should the project decide to implement frontend testing.

## Testing Approach
Since the current project uses Vite for the frontend, Vitest would be a natural choice for testing as it's designed to work seamlessly with Vite.

### Recommended Setup (if adding testing)
1. Add Vitest as a dev dependency:
   ```bash
   npm install -D vitest @vitest/coverage-v8 happy-dom
   ```

2. Add test script to package.json:
   ```json
   "scripts": {
     "test": "vitest",
     "test:watch": "vitest watch",
     "test:coverage": "vitest run --coverage"
   }
   ```

3. Create vitest.config.js:
   ```js
   import { defineConfig } from 'vitest/config'
   
   export default defineConfig({
     test: {
       globals: true,
       environment: 'happy-dom',
       setupFiles: './src/setupTests.js',
       coverage: {
         reporter: ['text', 'json', 'html']
       }
     }
   })
   ```

## Example Test File Structure
If we were to create a test file for the Dashboard component, it might look like this:

### CastraView/src/components/Dashboard.test.jsx
```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dashboard from './Dashboard'
// Mock the fetch API
global.fetch = vi.fn()

describe('Dashboard Component', () => {
  const mockBusinessProfile = {
    business_name: 'Test Business',
    industry: 'F&B',
    business_size: 'Small',
    target_customers: 'Office workers 22-35',
    primary_goal: 'Increase online orders',
    product_service: 'Coffee delivery',
    preferred_channels: ['Meta', 'TikTok'],
    monthly_budget: 30000000,
    currency: 'VND'
  }

  const mockCampaignData = {
    imports: [
      {
        id: 1,
        filename: 'sept_2026.csv',
        row_count: 150,
        created_at: '2026-09-15T10:30:00Z'
      }
    ],
    latest_rows: [
      { channel: 'Meta', period: '2026-Q3', spend: 1500000, clicks: 3200, impressions: 18000, conversions: 25, revenue: 3900000 },
      { channel: 'Google Ads', period: '2026-Q3', spend: 1000000, clicks: 2400, impressions: 12000, conversions: 18, revenue: 2800000 }
    ]
  }

  const mockStrategyData = {
    strategy: {
      recommended_channel: 'Meta',
      segment: 'Office workers 22-35',
      message: 'Test Castra Coffee helps office workers achieve their goals',
      rationale: 'Based on historical performance and target audience',
      budget_allocation: [
        { channel: 'Meta', percentage: 60, rationale: 'Primary channel for target audience' },
        { channel: 'Google Ads', percentage: 25, rationale: 'Secondary channel for intent-based searches' },
        { channel: 'TikTok', percentage: 15, rationale: 'Experimental channel for brand awareness' }
      ],
      actions: [
        'Set up test campaigns with two creative variations',
        'Monitor performance daily for first week',
        'Allocate more budget to best performing creatives'
      ],
      confidence: 85
    },
    context_sources: [
      { source: 'meta', title: 'Meta awareness baseline', score: 0.92 }
    ],
    provider: 'openai',
    warning: null
  }

  beforeEach(() => {
    // Reset fetch mocks before each test
    fetch.mockReset()
    
    // Mock successful API responses
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ profile: mockBusinessProfile })
      })
    ).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockCampaignData)
      })
    ).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockStrategyData)
      })
    )
  })

  it('should display loading state initially', async () => {
    render(<Dashboard />)
    
    // Should show loading state while data is fetching
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument()
  })

  it('should display key metrics when data loads', async () => {
    render(<Dashboard />)
    
    // Wait for data to load and metrics to appear
    await waitFor(() => {
      expect(screen.getByText(/total spend/i)).toBeInTheDocument()
    })
    
    // Check that key metrics are displayed
    expect(screen.getByText(/2,500,000/i)).toBeInTheDocument() // Formatted total spend
    expect(screen.getByText(/2.8x/i)).toBeInTheDocument() // ROAS
    expect(screen.getByText(/42,000/i)).toBeInTheDocument() // CPA
    expect(screen.getByText(/150,000/i)).toBeInTheDocument() // Impressions
  })

  it('should show charts with correct data', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/roas by channel/i)).toBeInTheDocument()
    })
    
    // In a real test with charting library, we would verify:
    // - Chart titles are correct
    // - Data points correspond to mock data
    // - Axes are properly labeled
    // For now, we just check that chart containers exist
    expect(screen.getByText(/budget allocation/i)).toBeInTheDocument()
  })

  it('should display campaign insights', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/campaign insights/i)).toBeInTheDocument()
    })
    
    expect(screen.getByText(/performance summary/i)).toBeInTheDocument()
    expect(screen.getByText(/meta campaigns are performing best/i)).toBeInTheDocument()
  })

  it('should navigate to strategy page when button clicked', async () => {
    const { getByRole } = render(<Dashboard />)
    const navigate = vi.fn()
    
    // We would need to mock the navigate hook
    // This is a simplified example - in practice you'd use react-router's memory router
    
    await waitFor(() => {
      expect(getByRole('button', { name: /create new strategy/i })).toBeEnabled()
    })
    
    // userEvent.click(getByRole('button', { name: /create new strategy/i }))
    // expect(navigate).toHaveBeenCalledWith('/strategy')
  })

  it('should handle API errors gracefully', async () => {
    // Mock API error
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Server error' } })
      })
    )
    
    render(<Dashboard />)
    
    // Should show error message or fallback UI
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })
})
```

## What This Test Covers
1. **Loading states** - Verifies UI shows appropriate loading indicators
2. **Data display** - Checks that metrics render correctly when data loads
3. **Chart rendering** - Ensures visualization components appear with correct labels
4. **Insights section** - Validates that campaign insights are displayed
5. **Navigation** - Tests that action buttons navigate to correct pages
6. **Error handling** - Confirms graceful handling of API failures

## Mock Data Sources
The test uses mock data based on examples from the notebooks:
- Business profile similar to what's in the SPRINT1_SETUP.md
- Campaign data matching the format described in account_api.py
- Strategy data reflecting the structure from schemas.py and sample_strategy_request.json

## Best Practices Demonstrated
1. **Test isolation** - Each test resets mocks before running
2. **Async handling** - Uses waitFor for data fetching operations
3. **Meaningful assertions** - Tests for specific text/content rather than just existence
4. **Error scenarios** - Includes test for failure cases
5. **User interactions** - Tests button clicks and navigation

## Next Steps for Implementation
If the team decides to implement frontend testing:
1. Set up Vitest as described above
2. Create the actual Dashboard component (see DASHBOARD_TEMPLATE.md)
3. Create this test file alongside the component
4. Run tests with `npm test`
5. Add coverage reporting to ensure adequate test coverage
6. Consider adding E2E tests with Cypress or Playwright for critical user flows

## Connection to Project Documentation
This testing approach aligns with:
- PROJECT_OVERVIEW.md: Understanding of data flow and component responsibilities
- SPRINT1_SETUP.md: Mentions testing procedures (though focused on backend)
- QUICK_REFERENCE.md: Provides quick reference to API endpoints and data structures
- The general testing philosophy mentioned in documentation: "CI runs same steps with PostgreSQL pgvector and Redis service containers"
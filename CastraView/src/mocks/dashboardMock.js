/**
 * dashboardMock.js — Dữ liệu giả cho Performance Dashboard (FR05)
 * Khớp với ảnh docs/UI/02-performancedashboard.png
 */

/** 4 KPI cards hàng đầu */
export const KPI_CARDS = [
  {
    id: 'impressions',
    label: 'IMPRESSIONS',
    value: '4.82M',
    delta: '+12.4% so với kỳ trước',
    deltaPositive: true,
    status: 'Healthy',
    statusTone: 'healthy',
  },
  {
    id: 'ctr',
    label: 'CTR (CLICK-THROUGH RATE)',
    value: '3.42%',
    benchmark: 'Benchmark: 2.80% (+0.62%)',
    status: 'Above Target',
    statusTone: 'above-target',
  },
  {
    id: 'cpa',
    label: 'CPA (COST PER ACQUISITION)',
    value: '$24.80',
    benchmark: 'Target ceiling: $28.00 (-$3.20)',
    status: 'Optimized',
    statusTone: 'optimized',
  },
  {
    id: 'roas',
    label: 'ROAS (RETURN ON AD SPEND)',
    value: '3.85×',
    benchmark: 'Baseline: 2.90x (+0.95x)',
    status: 'Outperforming',
    statusTone: 'outperforming',
  },
]

/** Channel breakdown table */
export const CHANNEL_ROWS = [
  {
    id: 'google',
    icon: '🔍',
    channel: 'Google Search',
    subtitle: 'Intent Keywords & PMax',
    impressions: '1.84M',
    ctr: '4.15%',
    ctrPositive: true,
    cpa: '$21.20',
    roas: '4.20×',
    status: 'Active · High Intent',
    statusTone: 'active-high',
    action: 'View Channel',
  },
  {
    id: 'meta',
    icon: '🌐',
    channel: 'Meta Ads',
    subtitle: 'Dynamic Creative Feed',
    impressions: '2.10M',
    ctr: '3.10%',
    ctrPositive: false,
    cpa: '$26.40',
    roas: '3.65×',
    status: 'Active · Retargeting',
    statusTone: 'active-retarget',
    action: 'View Channel',
  },
  {
    id: 'tiktok',
    icon: '▶',
    channel: 'TikTok Video',
    subtitle: 'Top-of-Funnel Spark',
    impressions: '880K',
    ctr: '2.45%',
    ctrPositive: false,
    cpa: '$29.10',
    cpaAlert: true,
    roas: '2.80×',
    status: 'Needs Optimization',
    statusTone: 'needs-opt',
    action: 'Optimize Spend',
  },
]

/** ROAS vs Target — panel phải */
export const ROAS_BARS = [
  { id: 'google', label: 'Google Search', value: 4.2, goal: 3.5, color: '#4f9de8' },
  { id: 'meta',   label: 'Meta Ads',      value: 3.65, goal: 3.2, color: '#7777f6' },
  { id: 'tiktok', label: 'TikTok Video',  value: 2.8,  goal: 3.0, color: '#ef4444' },
]
export const ROAS_BASELINE = 2.9

/** Alert trigger */
export const ALERT = {
  severity: 'alert',
  code: 'ALERT TRIGGER',
  label: 'Automated Diagnostic',
  title: 'TikTok CPA Threshold Exceeded',
  body: 'TikTok CPA ($29.10) exceeds current efficiency threshold. Rebalancing recommended in FR03 Budget Optimization to protect cumulative margin.',
  cta: 'Open Budget Optimizer',
  ctaPage: 'budget',
}

/** Header info */
export const DASHBOARD_META = {
  workspace: 'Global Growth Engine',
  dateRange: 'Last 30 Days',
  dataLatency: 'Latency: 4m ago',
  dataSource: 'Data synced directly via Enterprise Connectors (Google, Meta, TikTok APIs)',
  activeChannels: 3,
}

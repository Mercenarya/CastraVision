import { useState } from 'react'
import PropTypes from 'prop-types'
import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  History,
  Info,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from 'lucide-react'

const allCampaigns = [
  {
    id: 'camp-1',
    name: 'Summer Clearance Blitz 2025',
    channels: 'Meta Ads • TikTok Ads',
    status: 'Active',
    spend: '$34,820',
    allocatedSpend: 34820,
  },
  {
    id: 'camp-2',
    name: 'Always-On Brand Search',
    channels: 'Google Search Ads',
    status: 'Active',
    spend: '$28,450',
    allocatedSpend: 28450,
  },
  {
    id: 'camp-3',
    name: 'Advantage+ High Intent Catalog',
    channels: 'Meta Advantage+',
    status: 'Active',
    spend: '$41,230',
    allocatedSpend: 41230,
  },
  {
    id: 'camp-4',
    name: 'Mid-Year Creator Collab UGC',
    channels: 'TikTok Spark Ads',
    status: 'Paused',
    spend: '$14,000',
    allocatedSpend: 14000,
  },
]

const availableMetrics = [
  'Return on Ad Spend (ROAS)',
  'Cost Per Acquisition (CPA)',
  'Click-Through Rate (CTR)',
  'Total Spend & Budget',
  'Conversion Volume',
  'Impressions & Reach',
  'Average CPC',
  'Blended CAC',
]

const CAMPAIGN_SAMPLE_METRICS_NUMERIC = {
  'camp-1': {
    'Return on Ad Spend (ROAS)': 4.12,
    'Cost Per Acquisition (CPA)': 7.99,
    'Click-Through Rate (CTR)': 3.42,
    'Total Spend & Budget': 34820,
    'Conversion Volume': 4358,
    'Impressions & Reach': 127450,
    'Average CPC': 0.95,
    'Blended CAC': 18.20,
  },
  'camp-2': {
    'Return on Ad Spend (ROAS)': 4.85,
    'Cost Per Acquisition (CPA)': 11.20,
    'Click-Through Rate (CTR)': 4.15,
    'Total Spend & Budget': 28450,
    'Conversion Volume': 2540,
    'Impressions & Reach': 89200,
    'Average CPC': 1.42,
    'Blended CAC': 24.50,
  },
  'camp-3': {
    'Return on Ad Spend (ROAS)': 4.40,
    'Cost Per Acquisition (CPA)': 8.50,
    'Click-Through Rate (CTR)': 3.80,
    'Total Spend & Budget': 41230,
    'Conversion Volume': 4850,
    'Impressions & Reach': 164000,
    'Average CPC': 1.10,
    'Blended CAC': 19.80,
  },
  'camp-4': {
    'Return on Ad Spend (ROAS)': 2.80,
    'Cost Per Acquisition (CPA)': 16.40,
    'Click-Through Rate (CTR)': 2.10,
    'Total Spend & Budget': 14000,
    'Conversion Volume': 854,
    'Impressions & Reach': 62000,
    'Average CPC': 0.85,
    'Blended CAC': 32.00,
  },
}

const recentReportsData = [
  {
    id: 'rep-1',
    name: 'Monthly_Performance_Summary_Aug2025.pdf',
    period: 'Aug 01 – Aug 30, 2025',
    date: 'Today, 09:15',
    size: '3.4 MB',
    format: 'PDF',
    status: 'Ready',
    isSample: true,
  },
  {
    id: 'rep-2',
    name: 'Channel_Performance_Metrics_Q2.csv',
    period: 'Apr 01 – Jun 30, 2025',
    date: 'Aug 16, 2025, 14:20',
    size: '18.2 MB',
    format: 'CSV',
    status: 'Ready',
    isSample: true,
  },
  {
    id: 'rep-3',
    name: 'Mid_Q3_Budget_Variance_Report.pdf',
    period: 'Aug 01 – Aug 24, 2025',
    date: 'Today, 11:05',
    size: 'Compiling',
    format: 'PDF',
    status: 'Processing',
    isSample: true,
  },
  {
    id: 'rep-4',
    name: 'TikTok_Cohort_Analysis_Detailed.csv',
    period: 'Jun 01 – Jun 30, 2025',
    date: 'Jul 01, 2025, 18:40',
    size: 'Failed',
    format: 'CSV',
    status: 'Failed',
    isSample: true,
  },
]

function escapeCsvField(val) {
  if (val === null || val === undefined) return ''
  if (typeof val === 'number') return String(val)
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export default function ReportsPage({ profile, notify }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30 Days')
  const [startDate, setStartDate] = useState('2025-08-01')
  const [endDate, setEndDate] = useState('2025-08-30')
  const [selectedCampaigns, setSelectedCampaigns] = useState(['camp-1', 'camp-2', 'camp-3'])
  const [selectedMetrics, setSelectedMetrics] = useState([
    'Return on Ad Spend (ROAS)',
    'Cost Per Acquisition (CPA)',
    'Total Spend & Budget',
    'Conversion Volume',
  ])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formatFilter, setFormatFilter] = useState('All Formats')

  const toggleCampaign = (id) => {
    setSelectedCampaigns((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    setSelectedCampaigns(allCampaigns.map((c) => c.id))
  }

  const clearAll = () => {
    setSelectedCampaigns([])
  }

  const toggleMetric = (metric) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]
    )
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      notify?.('Report data synchronized.')
    }, 600)
  }

  const handleExportCsv = () => {
    // 1. Validation checks
    if (selectedCampaigns.length === 0) {
      notify?.('Please select at least one campaign to export.', 'warning')
      setToastMessage({
        title: 'Export Failed: No Campaigns Selected',
        desc: 'Select at least one campaign checkbox before exporting CSV.',
        isWarning: true,
      })
      return
    }

    if (selectedMetrics.length === 0) {
      notify?.('Please select at least one metric to include in the export.', 'warning')
      setToastMessage({
        title: 'Export Failed: No Metrics Selected',
        desc: 'Select at least one KPI metric chip before exporting CSV.',
        isWarning: true,
      })
      return
    }

    try {
      const entityName = profile?.business_name || 'Acme Corp Enterprise'
      const activeList = allCampaigns.filter((c) => selectedCampaigns.includes(c.id))

      // 2. Build CSV rows with actual table header on the first row (RFC 4180)
      const csvLines = [
        [
          'Campaign ID',
          'Campaign Name',
          'Marketing Channels',
          'Campaign Status',
          'Allocated Spend',
          ...selectedMetrics,
        ],
      ]

      activeList.forEach((camp) => {
        const rowMetrics = selectedMetrics.map((m) => {
          const val = CAMPAIGN_SAMPLE_METRICS_NUMERIC[camp.id]?.[m]
          return val !== undefined && val !== null ? val : 'N/A'
        })
        csvLines.push([
          camp.id,
          camp.name,
          camp.channels,
          camp.status,
          camp.allocatedSpend,
          ...rowMetrics,
        ])
      })

      // 3. Trailing metadata & sample notice section (does not disrupt Row 1 table headers)
      csvLines.push([])
      csvLines.push(['# CastraVision Omnichannel Performance Report Metadata', ''])
      csvLines.push(['# DATA NOTICE', 'Demonstration / sample dataset for planning purposes'])
      csvLines.push(['# Account Entity', entityName])
      csvLines.push(['# Reporting Period', `${startDate} to ${endDate} (${selectedTimeframe})`])
      csvLines.push(['# Export Timestamp', new Date().toISOString()])
      csvLines.push(['# Exported Campaigns Count', String(activeList.length)])
      csvLines.push(['# Exported Metrics Count', String(selectedMetrics.length)])

      // 4. Serialize and escape
      const csvString = csvLines
        .map((row) => row.map(escapeCsvField).join(','))
        .join('\r\n')

      // 5. Create Blob with UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility
      const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' })
      const downloadUrl = URL.createObjectURL(blob)

      const safeStart = startDate.replace(/[^a-zA-Z0-9]/g, '')
      const safeEnd = endDate.replace(/[^a-zA-Z0-9]/g, '')
      const filename = `CastraVision_Report_${safeStart}_to_${safeEnd}.csv`

      // 5. Trigger download
      const anchor = document.createElement('a')
      anchor.href = downloadUrl
      anchor.download = filename
      anchor.style.display = 'none'
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)

      // 6. Cleanup URL after brief delay
      setTimeout(() => {
        URL.revokeObjectURL(downloadUrl)
      }, 1000)

      // 7. Success notifications
      notify?.(`Downloaded CSV report: ${filename}`)
      setToastMessage({
        title: 'CSV Report Downloaded',
        desc: `Generated and downloaded ${filename} with ${activeList.length} campaigns and ${selectedMetrics.length} metrics.`,
        ready: true,
        isWarning: false,
      })
    } catch (err) {
      console.error('Failed to generate CSV export:', err)
      notify?.('Failed to generate CSV download.', 'error')
    }
  }

  const handleExportPdf = () => {
    notify?.(
      'PDF export is currently unavailable in demo mode. Please use Export CSV to download your report data.',
      'warning'
    )
    setToastMessage({
      title: 'PDF Export Unavailable',
      desc: 'Server-side PDF compilation engine is not integrated in demo mode. Please use Export CSV for report data.',
      ready: false,
      isWarning: true,
    })
  }

  const handleSampleArchiveDownload = (report) => {
    if (report.format === 'CSV') {
      // Download actual sample CSV for archive
      const sampleCsv = [
        ['# CastraVision Historical Performance Archive (Sample Record)', ''],
        ['# Report Name', report.name],
        ['# Reporting Period', report.period],
        ['# Generated Date', report.date],
        ['# NOTICE', 'Illustrative historical record from CastraVision Demo Archive'],
        [],
        ['Channel', 'Spend', 'Impressions', 'Clicks', 'CTR', 'Conversions', 'CPA', 'ROAS'],
        ['Meta Ads', '$52,140', '1,240,000', '42,408', '3.42%', '6,525', '$7.99', '4.12x'],
        ['Google Search', '$45,030', '890,000', '36,935', '4.15%', '3,690', '$12.20', '4.45x'],
        ['TikTok Ads', '$21,330', '680,000', '14,280', '2.10%', '1,300', '$16.40', '2.80x'],
      ]
        .map((r) => r.map(escapeCsvField).join(','))
        .join('\r\n')

      const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Sample_${report.name}`
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)

      notify?.(`Downloaded sample archive file: Sample_${report.name}`)
    } else {
      notify?.(
        'Demo Archive: Historical PDF downloads are illustrative records. Live PDF binaries are not stored in demo mode.',
        'info'
      )
    }
  }

  const filteredReports = recentReportsData.filter((rep) => {
    const matchesSearch = rep.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFormat =
      formatFilter === 'All Formats' ||
      (formatFilter === 'PDF Documents' && rep.format === 'PDF') ||
      (formatFilter === 'CSV Spreadsheets' && rep.format === 'CSV')
    return matchesSearch && matchesFormat
  })

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1c1f2a] border border-[#464554] text-[#4cd7f6] text-[11px] font-semibold tracking-wider uppercase font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] animate-pulse" />
              Reporting Engine Ready
            </span>
            <span className="text-[12px] text-[#c7c4d7] flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-[#908fa0]" />
              Synced 5 mins ago
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#dfe2f1] tracking-tight">
            Export Periodic Reports
          </h1>
          <p className="text-sm text-[#c7c4d7] max-w-3xl">
            Generate and download comprehensive marketing performance reports across all active SME channels.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="h-9 px-3 bg-[#1c1f2a] border border-[#464554] text-[#dfe2f1] rounded-lg text-xs font-mono flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#4cd7f6]" />
            <span>Last 30 Days (Aug 1 - Aug 30, 2025)</span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="h-9 px-3 bg-[#1c1f2a] border border-[#464554] text-[#dfe2f1] hover:bg-[#262a35] rounded-lg text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#8083ff] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* 2-COLUMN SPLIT: CONFIGURE (7 COLS) & PREVIEW (5 COLS) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Configure Your Report */}
        <div className="xl:col-span-7 bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 flex flex-col justify-between space-y-5 shadow-sm">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#464554]/60">
              <div>
                <h2 className="text-base font-bold text-[#dfe2f1]">Configure Your Report</h2>
                <p className="text-xs text-[#c7c4d7] mt-0.5">
                  Select parameters, active campaigns, and target KPI metrics for compilation.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#262a35] text-[#4cd7f6] border border-[#464554]">
                STEP 1 OF 2
              </span>
            </div>

            {/* Section A: Timeframe Picker */}
            <div className="space-y-2.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#908fa0] block">
                A • Reporting Timeframe
              </span>
              <div className="flex flex-wrap gap-2">
                {['7 Days', '14 Days', '30 Days', 'This Quarter', 'Custom Range'].map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTimeframe(time)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                      selectedTimeframe === time
                        ? 'bg-[#8083ff] text-[#0a0e18] font-bold'
                        : 'bg-[#0a0e18] border border-[#464554] text-[#c7c4d7] hover:border-[#8083ff]'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[11px] text-[#908fa0] block mb-1 font-mono">Start Date</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#0a0e18] border border-[#464554] rounded-lg px-3 py-1.5 text-xs text-[#dfe2f1] font-mono focus:outline-none focus:border-[#8083ff]"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-[#908fa0] block mb-1 font-mono">End Date</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#0a0e18] border border-[#464554] rounded-lg px-3 py-1.5 text-xs text-[#dfe2f1] font-mono focus:outline-none focus:border-[#8083ff]"
                  />
                </div>
              </div>
            </div>

            {/* Section B: Campaign Selection */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#908fa0] block">
                  B • Active Campaign Selection
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded ${
                      selectedCampaigns.length === 0
                        ? 'bg-[#93000a]/40 text-[#ffb4ab] border border-[#ffb4ab]/30'
                        : 'bg-[#262a35] text-[#4cd7f6] border border-[#464554]'
                    }`}
                  >
                    {selectedCampaigns.length} of {allCampaigns.length} selected
                  </span>
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-[11px] font-mono text-[#8083ff] hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-[#464554]">•</span>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-[11px] font-mono text-[#908fa0] hover:text-[#dfe2f1] cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {allCampaigns.map((camp) => {
                  const isChecked = selectedCampaigns.includes(camp.id)
                  return (
                    <label
                      key={camp.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-[#0a0e18] border-[#8083ff]/60'
                          : 'bg-[#0a0e18]/40 border-[#464554]/60 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCampaign(camp.id)}
                          className="w-4 h-4 rounded bg-[#171b26] border-[#464554] text-[#8083ff] focus:ring-0 cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#dfe2f1]">{camp.name}</span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase ${
                                camp.status === 'Active'
                                  ? 'bg-[#03b5d3]/15 text-[#4cd7f6] border border-[#03b5d3]/30'
                                  : 'bg-[#262a35] text-[#908fa0]'
                              }`}
                            >
                              {camp.status}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#908fa0]">{camp.channels}</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-[#c7c4d7]">{camp.spend}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Section C: Metric Selection Chips */}
            <div className="space-y-2.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#908fa0] block">
                C • Included Metrics &amp; Visuals
              </span>
              <p className="text-xs text-[#c7c4d7]">
                Toggle metrics to include in data aggregation tables and trend charts.
              </p>
              <div className="flex flex-wrap gap-2">
                {availableMetrics.map((metric) => {
                  const isSelected = selectedMetrics.includes(metric)
                  return (
                    <button
                      key={metric}
                      type="button"
                      onClick={() => toggleMetric(metric)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#262a35] border border-[#8083ff] text-[#dfe2f1] font-semibold'
                          : 'bg-[#0a0e18] border border-[#464554] text-[#908fa0] hover:border-[#8083ff]'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 ${isSelected ? 'text-[#4cd7f6]' : 'text-transparent'}`} />
                      <span>{metric}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Section D: Export Actions */}
          <div className="pt-4 border-t border-[#464554]/60">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-[#c7c4d7]">
                <Info className="w-4 h-4 text-[#4cd7f6]" />
                <span>Exports format parameters into RFC 4180 compliant CSV</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  title="PDF generation requires backend rendering service. Use Export CSV for report data."
                  className="flex-1 sm:flex-initial h-9 px-4 bg-[#262a35] hover:bg-[#313540] text-[#c7c4d7] border border-[#464554] text-xs font-mono rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#ffb4ab]" />
                  <span>Export PDF (Unavailable)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="flex-1 sm:flex-initial h-9 px-4 bg-[#8083ff] hover:bg-[#6f72f0] text-[#0a0e18] text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Report Summary Preview */}
        <div className="xl:col-span-5 bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#464554]/60">
              <div>
                <h2 className="text-base font-bold text-[#dfe2f1]">Report Summary Preview</h2>
                <span className="text-[11px] text-[#908fa0]">Live snapshot of selected parameters</span>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#8083ff]/15 border border-[#8083ff]/30 text-[#8083ff] font-bold uppercase">
                PREVIEW ESTIMATE (SAMPLE DATA)
              </span>
            </div>

            {/* Scope Metadata Box */}
            <div className="p-3 rounded-lg bg-[#0a0e18] border border-[#464554]/60 text-xs font-mono space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#908fa0]">Account Entity:</span>
                <span className="text-[#dfe2f1] font-semibold">{profile?.business_name || 'Acme Corp Enterprise'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#908fa0]">Selected Range:</span>
                <span className="text-[#4cd7f6]">{startDate} to {endDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#908fa0]">Active Campaigns:</span>
                <span className="text-[#dfe2f1]">{selectedCampaigns.length} Campaigns</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#908fa0]">Included Metrics:</span>
                <span className="text-[#dfe2f1]">{selectedMetrics.length} Metrics Selected</span>
              </div>
            </div>

            {/* 2x2 Mini KPI Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#0a0e18] border border-[#464554] rounded-lg p-3">
                <span className="text-[10px] text-[#908fa0] uppercase font-mono">Total Spend</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg text-[#dfe2f1] font-mono font-bold">$118,500</span>
                  <span className="text-xs text-[#4cd7f6] font-mono">+4.2%</span>
                </div>
                <span className="text-[10px] text-[#908fa0] block mt-0.5 font-mono">98.5% budget pacing</span>
              </div>

              <div className="bg-[#0a0e18] border border-[#464554] rounded-lg p-3">
                <span className="text-[10px] text-[#908fa0] uppercase font-mono">Target ROAS</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg text-[#4cd7f6] font-mono font-bold">4.12x</span>
                  <span className="text-xs text-[#4cd7f6] font-mono">+0.35x</span>
                </div>
                <span className="text-[10px] text-[#908fa0] block mt-0.5 font-mono">Goal: 3.80x achieved</span>
              </div>

              <div className="bg-[#0a0e18] border border-[#464554] rounded-lg p-3">
                <span className="text-[10px] text-[#908fa0] uppercase font-mono">Total Conversions</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg text-[#dfe2f1] font-mono font-bold">14,820</span>
                  <span className="text-xs text-[#c0c1ff] font-mono">+12.4%</span>
                </div>
                <span className="text-[10px] text-[#908fa0] block mt-0.5 font-mono">Conversion rate: 3.42%</span>
              </div>

              <div className="bg-[#0a0e18] border border-[#464554] rounded-lg p-3">
                <span className="text-[10px] text-[#908fa0] uppercase font-mono">Average CPA</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg text-[#dfe2f1] font-mono font-bold">$7.99</span>
                  <span className="text-xs text-[#4cd7f6] font-mono">-8.5%</span>
                </div>
                <span className="text-[10px] text-[#908fa0] block mt-0.5 font-mono">Cost efficiency improved</span>
              </div>
            </div>

            {/* Trajectory Chart Visualization (SVG) */}
            <div className="bg-[#0a0e18] border border-[#464554] rounded-lg p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#dfe2f1]">Weekly Spend &amp; Performance Trajectory</span>
                <div className="flex items-center gap-2.5 font-mono text-[9px]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4cd7f6]" /> Meta</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#8083ff]" /> Google</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#a078ff]" /> TikTok</span>
                </div>
              </div>

              {/* Inline SVG Chart */}
              <div className="w-full h-28 relative">
                <svg className="w-full h-full" fill="none" viewBox="0 0 340 100">
                  <line stroke="#464554" strokeDasharray="3 3" strokeWidth="0.5" x1="0" x2="340" y1="20" y2="20" />
                  <line stroke="#464554" strokeDasharray="3 3" strokeWidth="0.5" x1="0" x2="340" y1="50" y2="50" />
                  <line stroke="#464554" strokeWidth="0.5" x1="0" x2="340" y1="80" y2="80" />

                  {/* W1 */}
                  <rect fill="#03b5d3" height="26" rx="1" width="10" x="35" y="54" />
                  <rect fill="#8083ff" height="20" rx="1" width="10" x="48" y="60" />
                  <rect fill="#a078ff" height="12" rx="1" width="10" x="61" y="68" />

                  {/* W2 */}
                  <rect fill="#03b5d3" height="38" rx="1" width="10" x="115" y="42" />
                  <rect fill="#8083ff" height="30" rx="1" width="10" x="128" y="50" />
                  <rect fill="#a078ff" height="15" rx="1" width="10" x="141" y="65" />

                  {/* W3 */}
                  <rect fill="#03b5d3" height="46" rx="1" width="10" x="195" y="34" />
                  <rect fill="#8083ff" height="40" rx="1" width="10" x="208" y="40" />
                  <rect fill="#a078ff" height="18" rx="1" width="10" x="221" y="62" />

                  {/* W4 */}
                  <rect fill="#03b5d3" height="54" rx="1" width="10" x="275" y="26" />
                  <rect fill="#8083ff" height="46" rx="1" width="10" x="288" y="34" />
                  <rect fill="#a078ff" height="22" rx="1" width="10" x="301" y="58" />

                  {/* ROAS Trend Curve */}
                  <path d="M 55 52 Q 135 38, 215 28 T 295 16" fill="none" stroke="#4cd7f6" strokeWidth="2" />
                  <circle cx="55" cy="52" fill="#0f131d" r="2.5" stroke="#4cd7f6" strokeWidth="2" />
                  <circle cx="135" cy="38" fill="#0f131d" r="2.5" stroke="#4cd7f6" strokeWidth="2" />
                  <circle cx="215" cy="28" fill="#0f131d" r="2.5" stroke="#4cd7f6" strokeWidth="2" />
                  <circle cx="295" cy="16" fill="#0f131d" r="2.5" stroke="#4cd7f6" strokeWidth="2" />
                </svg>
                <div className="flex justify-between px-4 font-mono text-[9px] text-[#908fa0]">
                  <span>Week 1</span>
                  <span>Week 2</span>
                  <span>Week 3</span>
                  <span>Week 4</span>
                </div>
              </div>
            </div>

            {/* Channel Share Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#dfe2f1]">
                <span>Marketing Channel Share</span>
                <span className="font-mono text-[11px] text-[#908fa0]">100% Allocated</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#0a0e18] overflow-hidden flex border border-[#464554]">
                <div className="bg-[#03b5d3] h-full" style={{ width: '44%' }} title="Meta Ads: 44%" />
                <div className="bg-[#8083ff] h-full" style={{ width: '38%' }} title="Google Ads: 38%" />
                <div className="bg-[#a078ff] h-full" style={{ width: '18%' }} title="TikTok Ads: 18%" />
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-[10px] pt-0.5">
                <div>
                  <span className="text-[#4cd7f6] block font-semibold">Meta Ads</span>
                  <span className="text-[#dfe2f1]">44% ($52,140)</span>
                </div>
                <div>
                  <span className="text-[#c0c1ff] block font-semibold">Google Ads</span>
                  <span className="text-[#dfe2f1]">38% ($45,030)</span>
                </div>
                <div>
                  <span className="text-[#d0bcff] block font-semibold">TikTok Ads</span>
                  <span className="text-[#dfe2f1]">18% ($21,330)</span>
                </div>
              </div>
            </div>

            {/* Executive AI Takeaway Box */}
            <div className="bg-[#0a0e18] border border-[#464554] rounded-lg p-3 flex items-start gap-2.5">
              <div className="p-1.5 rounded bg-[#8083ff]/20 text-[#8083ff] mt-0.5 shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs">
                <span className="font-mono text-[#8083ff] font-bold block text-[11px]">EXECUTIVE SUMMARY HIGHLIGHT</span>
                <p className="text-[#c7c4d7] mt-0.5 leading-relaxed text-[11px]">
                  Target ROAS reached <strong className="text-[#4cd7f6]">4.12x</strong>, driven by Meta Advantage+ creative efficiency. TikTok CPA stabilized after midweek budget adjustments. Ready for business review.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: RECENT REPORTS ARCHIVE (DEMO ARCHIVE) */}
      <div className="bg-[#1c1f2a] border border-[#464554] rounded-lg p-5 flex flex-col gap-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#dfe2f1] flex items-center gap-2">
                <History className="w-4 h-4 text-[#908fa0]" />
                Recent Reports
              </h2>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#8083ff]/15 text-[#8083ff] border border-[#8083ff]/30 uppercase">
                DEMO ARCHIVE
              </span>
            </div>
            <p className="text-xs text-[#c7c4d7] mt-0.5">
              Illustrative examples of past reporting runs. Listed records are sample archives for layout reference.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#908fa0] w-3.5 h-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reports..."
                className="bg-[#0a0e18] border border-[#464554] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#dfe2f1] placeholder-[#908fa0] focus:outline-none focus:border-[#8083ff] w-44 sm:w-56 font-mono"
              />
            </div>
            {/* Filter */}
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="bg-[#0a0e18] border border-[#464554] rounded-lg px-3 py-1.5 text-xs text-[#dfe2f1] font-mono focus:outline-none focus:border-[#8083ff] cursor-pointer"
            >
              <option>All Formats</option>
              <option>PDF Documents</option>
              <option>CSV Spreadsheets</option>
            </select>
          </div>
        </div>

        {/* Reports Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#464554] bg-[#0a0e18]/50 text-[11px] text-[#c7c4d7] font-mono uppercase tracking-wider">
                <th className="py-3 px-4">Report Name</th>
                <th className="py-3 px-4">Reporting Period</th>
                <th className="py-3 px-4">Generated Date</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#464554]/50 text-xs font-mono">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-[#262a35]/40 transition-colors">
                  <td className="py-3.5 px-4 font-sans font-medium flex items-center gap-2 text-[#dfe2f1]">
                    {report.format === 'PDF' ? (
                      <FileText className="w-4 h-4 text-[#ffb4ab]" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 text-[#4cd7f6]" />
                    )}
                    <span className="font-mono text-xs">{report.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-[#c7c4d7]">{report.period}</td>
                  <td className="py-3.5 px-4 text-[#908fa0]">{report.date}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        report.format === 'PDF'
                          ? 'bg-[#93000a]/30 text-[#ffdad6] border-[#ffb4ab]/30'
                          : 'bg-[#03b5d3]/20 text-[#4cd7f6] border-[#03b5d3]/40'
                      }`}
                    >
                      {report.format} • {report.size}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {report.status === 'Ready' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[#03b5d3]/15 text-[#4cd7f6] border border-[#03b5d3]/30 uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]" />
                        Ready (Sample)
                      </span>
                    ) : report.status === 'Processing' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[#a078ff]/15 text-[#a078ff] border border-[#a078ff]/30 uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#a078ff] animate-pulse" />
                        Processing (Mock)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[#ffb4ab]/15 text-[#ffb4ab] border border-[#ffb4ab]/30 uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]" />
                        Failed (Sample)
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {report.status === 'Ready' ? (
                      <button
                        type="button"
                        onClick={() => handleSampleArchiveDownload(report)}
                        className="px-2.5 py-1 rounded bg-[#0a0e18] border border-[#464554] hover:border-[#8083ff] text-[#c0c1ff] text-xs font-mono inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title={report.format === 'CSV' ? 'Download sample CSV record' : 'Historical PDF record preview'}
                      >
                        <Download className="w-3 h-3" />
                        <span>{report.format === 'CSV' ? 'Download Sample' : 'Demo Record'}</span>
                      </button>
                    ) : report.status === 'Processing' ? (
                      <button
                        type="button"
                        disabled
                        className="px-2.5 py-1 rounded bg-[#171b26] border border-[#464554]/50 text-[#908fa0] text-xs font-mono inline-flex items-center gap-1 cursor-not-allowed opacity-60"
                      >
                        <RefreshCw className="w-3 h-3 animate-spin" /> Generating... (Mock)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          notify?.(
                            'Demo Archive: Retry is simulated. Background pipeline worker is inactive in demo mode.',
                            'info'
                          )
                        }
                        className="px-2.5 py-1 rounded bg-[#0a0e18] border border-[#464554] hover:border-[#ffb4ab] text-[#ffb4ab] text-xs font-mono inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title="Simulated retry on sample failure"
                      >
                        <RefreshCw className="w-3 h-3" /> Retry (Simulated)
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#464554] font-mono text-xs text-[#c7c4d7]">
          <span>Showing 1 to {filteredReports.length} of 18 reports • Page 1 of 5 (Demo Archive)</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              className="px-2.5 py-1 rounded bg-[#0a0e18] border border-[#464554] text-[#908fa0] cursor-not-allowed opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              className="px-2.5 py-1 rounded bg-[#8083ff] text-[#0a0e18] font-bold"
            >
              1
            </button>
            <button
              type="button"
              className="px-2.5 py-1 rounded bg-[#0a0e18] border border-[#464554] hover:bg-[#262a35] text-[#dfe2f1]"
            >
              2
            </button>
            <button
              type="button"
              className="px-2.5 py-1 rounded bg-[#0a0e18] border border-[#464554] hover:bg-[#262a35] text-[#dfe2f1]"
            >
              3
            </button>
            <button
              type="button"
              className="px-2.5 py-1 rounded bg-[#0a0e18] border border-[#464554] hover:bg-[#262a35] text-[#dfe2f1]"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* FLOATING EXPORT NOTIFICATION TOAST */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-2xl transition-all duration-300 ${
            toastMessage.isWarning
              ? 'bg-[#262a35] border-[#ffb4ab]/50'
              : 'bg-[#262a35] border-[#464554]'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              toastMessage.isWarning
                ? 'bg-[#93000a]/30 text-[#ffb4ab]'
                : toastMessage.ready
                  ? 'bg-[#03b5d3]/20 text-[#4cd7f6]'
                  : 'bg-[#8083ff]/20 text-[#8083ff]'
            }`}
          >
            {toastMessage.isWarning ? (
              <AlertCircle className="w-3.5 h-3.5" />
            ) : toastMessage.ready ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            )}
          </div>
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-xs font-semibold text-[#dfe2f1]">{toastMessage.title}</span>
            <span className="text-[11px] text-[#c7c4d7] font-mono">{toastMessage.desc}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 rounded text-[#908fa0] hover:text-[#dfe2f1] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

ReportsPage.propTypes = {
  profile: PropTypes.shape({
    business_name: PropTypes.string,
  }),
  notify: PropTypes.func,
}

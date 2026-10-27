/**
 * ManagerDashboard — Campaign Performance Dashboard (FR05)
 * Bám sát ảnh docs/UI/02-performancedashboard.png
 *
 * Props (chưa có route trong App.jsx):
 *   setPage  {func}  — điều hướng sang trang khác
 *   imports  {Array} — danh sách lần nhập; dùng để hiển thị "N Active Channels"
 *
 * Dùng mock data khi không có dữ liệu thật.
 */
import { useState } from 'react'
import PropTypes from 'prop-types'
import { Globe2, Info, LayoutGrid, Play, RefreshCw, Search, Target } from 'lucide-react'
import AlertPanel from '@/components/AlertPanel'
import ProgressBar from '@/components/ProgressBar'
import StatCard from '@/components/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
  ALERT,
  CHANNEL_ROWS,
  DASHBOARD_META,
  KPI_CARDS,
  ROAS_BARS,
  ROAS_BASELINE,
} from '@/mocks/dashboardMock'

const STATUS_CLASS = {
  'active-high': 'bg-success/15 text-success',
  'active-retarget': 'bg-info/15 text-info',
  'needs-opt': 'bg-destructive/15 text-destructive',
}

function LiveDot() {
  return <i className="inline-block size-2 rounded-full bg-success" aria-hidden="true" />
}

export default function ManagerDashboard({ setPage, imports = [] }) {
  const [dateRange, setDateRange] = useState(DASHBOARD_META.dateRange)
  const activeChannels = imports.length > 0 ? imports.length : DASHBOARD_META.activeChannels

  // Max ROAS dùng để scale thanh tiến độ.
  const maxRoas = Math.max(...ROAS_BARS.map((r) => r.value), ...ROAS_BARS.map((r) => r.goal)) * 1.15

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold tracking-wider text-info uppercase">
            <LiveDot />
            <span>FR05 // PERFORMANCE MONITORING</span>
            <span className="text-muted-foreground">Workspace: {DASHBOARD_META.workspace}</span>
          </div>
          <h1 className="mt-2 text-[clamp(26px,3.5vw,38px)] leading-tight font-extrabold">
            Campaign Performance Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Real-time tracking of marketing channels against target efficiency benchmarks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            aria-label="Chọn khoảng thời gian"
            className="h-9 rounded-md border border-input bg-card px-3 text-sm"
          >
            <option>Last 30 Days</option>
            <option>Last 7 Days</option>
            <option>Last 90 Days</option>
          </select>
          <Button type="button" variant="secondary">
            <RefreshCw /> Refresh Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_CARDS.map((card) => (
          <StatCard key={card.id} {...card} />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2.2fr)_minmax(280px,1fr)]">
        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="flex flex-row items-center justify-between border-b py-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <LayoutGrid className="size-4 text-info" aria-hidden="true" />
              Channel Performance Breakdown
            </CardTitle>
            <span className="text-xs text-muted-foreground">{activeChannels} Active Channels Configured</span>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-background/60 hover:bg-background/60">
                  {['CHANNEL', 'IMPRESSIONS', 'CTR', 'CPA', 'ROAS', 'STATUS'].map((h) => (
                    <TableHead key={h} className="px-4 text-[11px] tracking-wider">{h}</TableHead>
                  ))}
                  <TableHead className="px-4 text-right text-[11px] tracking-wider">QUICK ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CHANNEL_ROWS.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-md bg-muted" aria-hidden="true">
                          {row.id === 'google' ? <Search className="size-4 text-info" /> : row.id === 'meta' ? <Globe2 className="size-4 text-primary" /> : <Play className="size-4 text-coral" />}
                        </span>
                        <div className="flex flex-col">
                          <strong>{row.channel}</strong>
                          <small className="text-muted-foreground">{row.subtitle}</small>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">{row.impressions}</TableCell>
                    <TableCell className={cn('px-4', row.ctrPositive ? 'text-success' : 'text-warning')}>
                      {row.ctr}
                    </TableCell>
                    <TableCell className={cn('px-4', row.cpaAlert && 'text-destructive')}>{row.cpa}</TableCell>
                    <TableCell className="px-4">{row.roas}</TableCell>
                    <TableCell className="px-4">
                      <Badge className={cn('uppercase', STATUS_CLASS[row.statusTone] || 'bg-muted text-muted-foreground')}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 text-right">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => (row.statusTone === 'needs-opt' ? setPage('budget') : null)}
                      >
                        {row.action}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <div className="flex items-center gap-2 border-t px-5 py-3 text-xs text-muted-foreground">
            <LiveDot />
            <span>{DASHBOARD_META.dataSource}</span>
            <span className="ml-auto">{DASHBOARD_META.dataLatency}</span>
          </div>
        </Card>

        <div className="flex flex-col gap-5">
          <Card className="gap-0 py-0">
            <CardHeader className="flex flex-row items-center justify-between border-b py-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="size-4 text-info" aria-hidden="true" />
                Channel ROAS vs Target
              </CardTitle>
              <span className="text-xs text-muted-foreground">Baseline {ROAS_BASELINE}x</span>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 py-5">
              {ROAS_BARS.map((bar) => (
                <ProgressBar
                  key={bar.id}
                  label={bar.label}
                  meta={`${bar.value}x / ${bar.goal}x goal`}
                  value={bar.value}
                  max={maxRoas}
                  goal={bar.goal}
                  color={bar.color}
                />
              ))}
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                Target baseline is dynamically computed based on 60-day historical conversion value.
              </p>
            </CardContent>
          </Card>

          <AlertPanel
            code={ALERT.code}
            label={ALERT.label}
            title={ALERT.title}
            body={ALERT.body}
            cta={ALERT.cta}
            onAction={() => setPage(ALERT.ctaPage)}
          />
        </div>
      </div>
    </div>
  )
}

ManagerDashboard.propTypes = {
  setPage: PropTypes.func.isRequired,
  imports: PropTypes.array,
}

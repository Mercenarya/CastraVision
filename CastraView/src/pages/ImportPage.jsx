import { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import Notice from '@/components/Notice'
import PageHeading from '@/components/PageHeading'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { api } from '@/services/api'

const SAMPLE_CSV =
  'channel,period,spend,clicks,impressions,conversions,revenue\nMeta,2026-09,1500000,320,18000,25,3900000\nGoogle Ads,2026-09,1000000,240,12000,18,2800000\n'

const BENEFITS = [
  ['▣', 'Định dạng chuẩn', 'Tự ánh xạ cột chi phí, lượt nhấp, hiển thị và chuyển đổi.'],
  ['♢', 'Kiểm tra tự động', 'Phát hiện cột thiếu, số âm và dòng không hợp lệ trước khi lưu.'],
  ['ϟ', 'Dùng cho phân tích', 'Chỉ số từ tệp đã nhập được đưa vào yêu cầu tạo chiến lược.'],
]

function downloadSample() {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob(['﻿', SAMPLE_CSV], { type: 'text/csv;charset=utf-8' }))
  link.download = 'castravision_sample.csv'
  link.click()
  URL.revokeObjectURL(link.href)
}

export default function ImportPage({ imports, onImported, notify }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const input = useRef(null)

  async function stage(selected) {
    if (!selected) return
    setFile(selected)
    setPreview(null)
    setError('')
    setBusy(true)
    try {
      const body = new FormData()
      body.append('file', selected)
      setPreview(await api('campaign-imports/upload/', { method: 'POST', body }))
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }

  async function commit() {
    setBusy(true)
    setError('')
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('mode', 'commit')
      const data = await api('campaign-imports/upload/', { method: 'POST', body })
      await onImported()
      notify(`${data.row_count} dòng dữ liệu đã được nhập.`)
      setFile(null)
      setPreview(null)
      if (input.current) input.current.value = ''
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }

  function remove() {
    setFile(null)
    setPreview(null)
    setError('')
  }

  const canCommit = !busy && preview && preview.error_count === 0 && preview.row_count > 0

  return (
    <>
      <PageHeading eyebrow="DATA INGESTION HUB" title="Nhập dữ liệu chiến dịch" subtitle="Tải lên dữ liệu hiệu suất để làm giàu chiến lược marketing." />
      <Card
        className={cn('min-h-[425px] items-center justify-center border-2 border-dashed border-[#334263] p-9 text-center hover:border-[#8081ec]', file && 'border-[#8081ec]')}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          stage(e.dataTransfer.files[0])
        }}
      >
        <div className="mb-4 grid size-[76px] place-items-center rounded-full bg-violet text-[47px] leading-none text-[#141951]">⇧</div>
        <h2 className="text-3xl font-bold tracking-tight">Kéo thả tệp vào đây</h2>
        <p className="mt-1 mb-4 text-muted-foreground">hoặc chọn tệp từ thiết bị</p>
        <span className="mb-5 flex w-full max-w-[460px] items-center gap-5 text-xs text-[#8f9ab1] before:h-px before:flex-1 before:bg-[#35415a] after:h-px after:flex-1 after:bg-[#35415a]">OR</span>
        <Button type="button" size="lg" className="min-w-[220px]" onClick={() => input.current?.click()} disabled={busy}>
          ⇧ Chọn tệp CSV / Excel
        </Button>
        <input className="sr-only" ref={input} type="file" accept=".csv,.xlsx" onChange={(e) => stage(e.target.files[0])} />
        <small className="mt-3.5 mb-1 block text-muted-foreground">Tối đa 5 MB · CSV UTF-8 hoặc XLSX</small>
        <Button type="button" variant="link" onClick={downloadSample} className="text-[#a7a6ff]">↓ Tải CSV mẫu</Button>
      </Card>

      {file && (
        <Card className="mt-5 flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <div className="grid size-[46px] shrink-0 place-items-center rounded-full bg-[#00b8d5] text-2xl font-extrabold text-[#073845]">✓</div>
          <div className="grid min-w-0 gap-0.5">
            <span className="text-[11px] font-extrabold tracking-[0.08em] text-info">TỆP ĐÃ CHỌN · {(file.size / 1024 / 1024).toFixed(2)} MB</span>
            <strong className="truncate text-lg">{file.name}</strong>
            <small className="text-muted-foreground">
              {busy ? 'Đang kiểm tra…' : preview ? `${preview.row_count} dòng hợp lệ · ${preview.error_count} dòng lỗi` : 'Chưa xác thực'}
            </small>
          </div>
          <div className="flex gap-2.5 sm:ml-auto">
            <Button type="button" variant="coral" size="lg" onClick={remove}>Gỡ bỏ</Button>
            <Button type="button" size="lg" disabled={!canCommit} onClick={commit}>Nhập dữ liệu →</Button>
          </div>
        </Card>
      )}

      {error && <Notice>{error}</Notice>}
      {preview?.errors?.length > 0 && (
        <Card className="mt-5 gap-1 p-6">
          <h3 className="mb-3 font-semibold">Cần sửa {preview.error_count} dòng trước khi nhập</h3>
          {preview.errors.map((item) => <p key={item.row} className="text-[#ffc8c8]">Dòng {item.row}: {item.message}</p>)}
        </Card>
      )}
      {preview?.preview?.length > 0 && (
        <Card className="mt-5 p-6">
          <h3 className="font-semibold">Xem trước dữ liệu chuẩn hóa</h3>
          <Table className="text-xs">
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                {['Kênh', 'Kỳ', 'Chi phí', 'Clicks', 'Hiển thị', 'Chuyển đổi', 'Doanh thu'].map((value) => <TableHead key={value}>{value}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.preview.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.channel}</TableCell>
                  <TableCell>{row.period}</TableCell>
                  <TableCell>{row.spend.toLocaleString('vi-VN')}</TableCell>
                  <TableCell>{row.clicks}</TableCell>
                  <TableCell>{row.impressions}</TableCell>
                  <TableCell>{row.conversions}</TableCell>
                  <TableCell>{row.revenue.toLocaleString('vi-VN')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {BENEFITS.map(([icon, title, text]) => (
          <Card key={title} className="min-h-[140px] p-5">
            <div>
              <b className="mr-2.5 inline-grid size-[30px] place-items-center rounded-[7px] bg-[#26324a] text-info">{icon}</b>
              <strong className="text-[15px]">{title}</strong>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
          </Card>
        ))}
      </div>

      {imports.length > 0 && (
        <Card className="mt-5 gap-0 p-6">
          <h3 className="mb-3 font-semibold">Lần nhập gần đây</h3>
          {imports.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 border-t py-3 text-[13px]">
              <span>{item.filename}</span>
              <small className="text-muted-foreground">{item.row_count} dòng · {new Date(item.created_at).toLocaleDateString('vi-VN')}</small>
            </div>
          ))}
        </Card>
      )}
    </>
  )
}

ImportPage.propTypes = {
  imports: PropTypes.array.isRequired,
  onImported: PropTypes.func.isRequired,
  notify: PropTypes.func.isRequired,
}

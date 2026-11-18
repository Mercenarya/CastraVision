import { useState } from 'react'
import { Button } from '@/components/ui/button'
import WorkflowCampaignSelect from '../components/WorkflowCampaignSelect'
import WorkflowPanel from '../components/WorkflowPanel'
import { useWorkflowAction, useWorkflowQuery } from '../../hooks/useLeaderWorkflow'
import { downloadCsv, importCampaignFile } from '../../services/leaderWorkflow'

export default function WorkflowImport({ revision, onChanged }) {
  const [campaignId, setCampaignId] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [saved, setSaved] = useState(false)
  const [page, setPage] = useState(0)
  const history = useWorkflowQuery('imports', { campaignId: campaignId || undefined, limit: 10, offset: page * 10 }, revision)
  const action = useWorkflowAction()
  async function upload(mode) {
    const result = await action.run(() => importCampaignFile(file, campaignId, mode))
    if (result) { setPreview(result); setSaved(mode === 'commit'); if (mode === 'commit') { history.reload(); onChanged?.() } }
  }
  return <div className="p-6"><WorkflowPanel title="Campaign Import" action={action}>
    <p>Nhập CSV/XLSX tối đa 5 MB, 2.000 dòng. Chọn chiến dịch để xác định Team và đơn vị tiền tệ. Chỉ lưu khi toàn bộ dòng hợp lệ.</p>
    <WorkflowCampaignSelect revision={revision} value={campaignId} onChange={v => { setCampaignId(v); setSaved(false) }} />
    <label className="block">Tệp dữ liệu<input type="file" accept=".csv,.xlsx" className="block w-full rounded-lg border border-border p-3" onChange={e => { setFile(e.target.files[0] || null); setPreview(null); setSaved(false) }} /></label>
    <div className="flex flex-wrap gap-3"><Button variant="outline" onClick={() => downloadCsv('campaign-template.csv', ['channel', 'period', 'spend', 'clicks', 'impressions', 'conversions', 'revenue'], [])}>Tải mẫu CSV</Button><Button disabled={!file || action.busy} onClick={() => upload('preview')}>Kiểm tra tệp</Button><Button disabled={!file || !campaignId || !preview || preview.error_count > 0 || saved || action.busy} onClick={() => upload('commit')}>Lưu vào chiến dịch</Button></div>
    {saved && <p role="status" className="text-success">Đã lưu {preview.row_count} dòng. Mã batch: {preview.import_id}. Nhập lại cùng tệp không tạo bản sao.</p>}
    {preview && <><p>{preview.row_count} dòng hợp lệ · {preview.error_count} lỗi</p>{preview.errors?.map(e => <p className="text-destructive" key={e.row}>Dòng {e.row}: {e.message}</p>)}<pre className="overflow-x-auto text-xs">{JSON.stringify(preview.preview, null, 2)}</pre></>}
  </WorkflowPanel><WorkflowPanel title="Lịch sử nhập dữ liệu" query={history}>
    {history.data?.items.length === 0 && <p>Chưa có batch nhập trong phạm vi này.</p>}
    {history.data?.items.map(item => <article key={item.id} className="rounded-lg border border-border p-3"><p>{item.filename} · {item.campaign_name}</p><p>{item.row_count} dòng · {new Date(item.created_at).toLocaleString('vi-VN')}</p><p className="text-xs text-muted-foreground">{item.id}</p></article>)}
    <div className="flex gap-3"><Button variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Trước</Button><span>Trang {page + 1} · {history.data?.total ?? '—'} batch</span><Button variant="outline" disabled={(page + 1) * 10 >= (history.data?.total || 0)} onClick={() => setPage(p => p + 1)}>Sau</Button></div>
  </WorkflowPanel></div>
}

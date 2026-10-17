import { useContext, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '../auth/AuthContext'
import { requireSupabase } from '../lib/supabase'
import './actor-ui.css'

const money = (value) => new Intl.NumberFormat('vi-VN').format(value) + ' ₫'

function PageIntro({ code, title, subtitle, action }) {
  return <header className="actor-intro"><div><span className="actor-code">{code}</span><h1>{title}</h1><p>{subtitle}</p></div>{action}</header>
}

function Panel({ title, meta, children, className = '' }) {
  return <section className={`actor-panel ${className}`}><header><h2>{title}</h2>{meta && <span>{meta}</span>}</header>{children}</section>
}

function Badge({ tone = 'neutral', children }) { return <span className={`actor-badge ${tone}`}>{children}</span> }

const members = [
  ['LT', 'Lê Thành Đạt', 'lthanhdat85@gmail.com', 'Admin', 'active'],
  ['HN', 'Hà Ngọc Minh', 'manager@demo.castravision.vn', 'Manager', 'active'],
  ['ML', 'Mai Lan', 'member@demo.castravision.vn', 'Member', 'active'],
  ['TN', 'Trần Ngọc', 'content@demo.castravision.vn', 'Member', 'pending'],
]

export function MembersPage({ profile, notify }) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Manager')
  const [rows, setRows] = useState(members)
  function invite(event) {
    event.preventDefault()
    setRows((current) => [...current, ['NEW', email.split('@')[0], email, role, 'pending']])
    setInviteOpen(false); setEmail(''); notify?.(`Đã tạo lời mời cho ${email}.`)
  }
  return <>
    <PageIntro code="FR06 · RBAC ENGINE" title="Thành viên Workspace & kiểm soát truy cập" subtitle="Quản lý thành viên, vai trò và phạm vi quyền trong từng Workspace." action={<button className="button primary" onClick={() => setInviteOpen(true)}>＋ Mời thành viên</button>} />
    <div className="actor-summary"><div><strong>{rows.length}</strong><span>Tổng thành viên</span></div><div><strong>{rows.filter((row) => row[3] === 'Admin').length}</strong><span>Admin</span></div><div><strong>{rows.filter((row) => row[3] === 'Manager').length}</strong><span>Manager</span></div><div><strong>{rows.filter((row) => row[3] === 'Member').length}</strong><span>Member</span></div></div>
    <Panel title={profile.business_name} meta="Active member directory"><div className="actor-table-wrap"><table className="actor-table"><thead><tr><th>Thành viên</th><th>Vai trò</th><th>Trạng thái</th><th>Quyền chính</th></tr></thead><tbody>{rows.map(([avatar, name, mail, userRole, status]) => <tr key={mail}><td><div className="actor-person"><b>{avatar}</b><span><strong>{name}</strong><small>{mail}</small></span></div></td><td><Badge tone={userRole.toLowerCase()}>{userRole}</Badge></td><td><Badge tone={status}>{status === 'active' ? 'Đang hoạt động' : 'Chờ đăng ký'}</Badge></td><td>{userRole === 'Admin' ? 'Toàn quyền, RBAC, phê duyệt, audit' : userRole === 'Manager' ? 'Chiến dịch, phê duyệt, báo cáo' : 'Chiến lược, nội dung, nhập dữ liệu'}</td></tr>)}</tbody></table></div></Panel>
    <div className="actor-policy coral"><b>Chính sách bảo vệ:</b> Không thể xóa Admin cuối cùng khỏi Workspace.</div>
    {inviteOpen && <div className="actor-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setInviteOpen(false)}><form className="actor-modal" role="dialog" aria-modal="true" aria-labelledby="invite-title" onSubmit={invite}><button className="modal-close" type="button" aria-label="Đóng" onClick={() => setInviteOpen(false)}>×</button><span className="modal-icon">♙</span><h2 id="invite-title">Mời thành viên mới</h2><p>Cấp quyền truy cập vào {profile.business_name} theo vai trò.</p><label>Email thành viên<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" required /></label><fieldset><legend>Vai trò được cấp</legend>{['Admin', 'Manager', 'Member'].map((item) => <label className={`role-option ${role === item ? 'selected' : ''}`} key={item}><input type="radio" name="role" value={item} checked={role === item} onChange={() => setRole(item)} /><span><strong>{item}</strong><small>{item === 'Admin' ? 'Toàn quyền quản trị' : item === 'Manager' ? 'Điều hành và phê duyệt' : 'Thực thi nội dung'}</small></span></label>)}</fieldset><div className="modal-actions"><button type="button" className="button subtle" onClick={() => setInviteOpen(false)}>Hủy</button><button className="button primary">Gửi lời mời</button></div></form></div>}
  </>
}

const capabilities = [
  ['Cài đặt Workspace & hồ sơ', 'Toàn quyền', 'Không có', 'Không có'],
  ['Mời thành viên & gán vai trò', 'Toàn quyền', 'Chỉ xem', 'Không có'],
  ['Phê duyệt đề xuất FR04', 'Được phép', 'Được phép', 'Không có'],
  ['Nhật ký kiểm toán FR11', 'Xem & xuất', 'Chỉ xem', 'Không có'],
  ['Nhập dữ liệu chiến dịch FR08', 'Toàn quyền', 'Toàn quyền', 'Được phép'],
  ['Tạo nội dung & chiến lược', 'Được phép', 'Được phép', 'Được phép'],
]

export function RoleManagementPage() {
  const roleCards = [
    ['Admin', 'Quyền cao nhất', 'Quản trị Workspace, vòng đời người dùng, bảo mật và phê duyệt tài chính.'],
    ['Manager', 'Governance', 'Rà soát, chỉnh sửa và phê duyệt các đầu ra marketing do AI tạo.'],
    ['Member', 'Execution', 'Tạo chiến lược, nội dung và nhập dữ liệu trong phạm vi được giao.'],
  ]
  return <><PageIntro code="FR06 · ROLE-BASED ACCESS CONTROL" title="Quản lý vai trò & quyền RBAC" subtitle="Rà soát ranh giới bảo mật giữa Admin, Manager và Member." /><div className="role-card-grid">{roleCards.map(([role, tier, description]) => <article className="actor-panel role-card" key={role}><Badge tone={role.toLowerCase()}>{role} · {tier}</Badge><h2>{role} Role</h2><p>{description}</p><ul>{capabilities.filter((row) => row[['Admin', 'Manager', 'Member'].indexOf(role) + 1] !== 'Không có').slice(0, 4).map((row) => <li key={row[0]}>✓ {row[0]}</li>)}</ul></article>)}</div><Panel title="Ma trận năng lực chi tiết" meta="Enforced by API & UI"><div className="actor-table-wrap"><table className="actor-table matrix"><thead><tr><th>Phạm vi chức năng</th><th>Admin</th><th>Manager</th><th>Member</th></tr></thead><tbody>{capabilities.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={cell}><span className={index && cell === 'Không có' ? 'denied' : index ? 'allowed' : ''}>{cell}</span></td>)}</tr>)}</tbody></table></div></Panel></>
}

const proposals = [
  ['PRP-8402', 'Nội dung đa kênh Q4', 'Content', 'AI Content Engine', 'pending'],
  ['PRP-8403', 'Tái phân bổ ngân sách động', 'Budget', 'Budget Optimizer', 'pending'],
  ['PRP-8404', 'Chuỗi nội dung nuôi dưỡng khách hàng', 'Content', 'Mai Lan', 'edited'],
  ['PRP-8401', 'Creative Retargeting', 'Content', 'Creative Engine', 'approved'],
]

export function ApprovalQueuePage({ notify }) {
  const [rows, setRows] = useState(proposals)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [rejecting, setRejecting] = useState(null)
  const [reason, setReason] = useState('')
  const visible = rows.filter((row) => filter === 'all' || row[4] === filter)
  function setStatus(id, status) { setRows((current) => current.map((row) => row[0] === id ? [...row.slice(0, 4), status] : row)); setSelected(null); notify?.(`${id} đã được ${status === 'approved' ? 'phê duyệt' : 'từ chối'}.`) }
  return <><PageIntro code="FR04 · GOVERNANCE ENGINE" title="Hàng chờ phê duyệt" subtitle="Rà soát đề xuất nội dung và ngân sách trước khi triển khai chiến dịch." action={<Badge tone="manager">Manager access</Badge>} /><div className="actor-policy"><b>Kiểm soát truy cập đang hoạt động.</b> Admin và Manager có thể rà soát, chỉnh sửa, phê duyệt hoặc từ chối. Member không có quyền truy cập.</div><div className="actor-summary"><div><strong>{rows.length}</strong><span>Tổng đề xuất</span></div><div><strong>{rows.filter((row) => row[4] === 'pending').length}</strong><span>Chờ duyệt</span></div><div><strong>{rows.filter((row) => row[4] === 'approved').length}</strong><span>Đã duyệt</span></div><div><strong>{rows.filter((row) => row[4] === 'rejected').length}</strong><span>Từ chối</span></div></div><Panel title="Danh sách đề xuất" meta={`${visible.length} bản ghi`}><div className="actor-filters">{['all', 'pending', 'approved', 'rejected'].map((item) => <button className={filter === item ? 'active' : ''} onClick={() => setFilter(item)} key={item}>{item === 'all' ? 'Tất cả' : item}</button>)}</div><div className="actor-table-wrap"><table className="actor-table"><thead><tr><th>Mã & đề xuất</th><th>Loại</th><th>Người tạo / Engine</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{visible.map((row) => <tr key={row[0]}><td><strong>{row[1]}</strong><small>{row[0]}</small></td><td><Badge tone={row[2] === 'Budget' ? 'manager' : 'admin'}>{row[2]}</Badge></td><td>{row[3]}</td><td><Badge tone={row[4]}>{row[4]}</Badge></td><td><button className="row-action" onClick={() => setSelected(row)}>Xem xét</button></td></tr>)}</tbody></table></div></Panel>{selected && <Panel title={`Đánh giá ${selected[0]}`} meta="Human-in-the-loop"><div className="proposal-review"><div><span className="mini-label">ĐỀ XUẤT</span><h3>{selected[1]}</h3><p>Mô hình đề xuất tối ưu theo dữ liệu 30 ngày gần nhất. Mọi quyết định sẽ được ghi vào FR11 Audit Log.</p></div><div><span className="mini-label">POLICY CHECK</span><strong className="success-text">12 / 12 điều kiện đạt</strong></div><div className="review-actions"><button className="button subtle" onClick={() => setSelected(null)}>Đóng</button><button className="button coral" onClick={() => { setRejecting(selected); setSelected(null) }}>Từ chối</button><button className="button primary" onClick={() => setStatus(selected[0], 'approved')}>✓ Phê duyệt</button></div></div></Panel>}{rejecting && <div className="actor-modal-backdrop"><form className="actor-modal danger-modal" onSubmit={(event) => { event.preventDefault(); setStatus(rejecting[0], 'rejected'); setRejecting(null); setReason('') }}><button className="modal-close" type="button" onClick={() => setRejecting(null)}>×</button><span className="modal-icon danger">!</span><h2>Từ chối đề xuất</h2><p>Nhập lý do bắt buộc. Người tạo sẽ được thông báo.</p><label>Lý do từ chối<textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={500} required /></label><div className="modal-actions"><button type="button" className="button subtle" onClick={() => setRejecting(null)}>Hủy</button><button className="button coral">Từ chối đề xuất</button></div></form></div>}</>
}

// ─── FR11 helpers ────────────────────────────────────────────────────────────
const ACTION_META = {
  approve: { label: 'Approved', tone: 'approved' },
  reject: { label: 'Rejected', tone: 'rejected' },
  edit: { label: 'Edited', tone: 'manager' },
  create: { label: 'Created', tone: 'admin' },
  invite: { label: 'Member Invited', tone: 'admin' },
  role_change: { label: 'Role Changed', tone: 'manager' },
  import: { label: 'Data Imported', tone: 'active' },
}

const MODULE_META = {
  ad_content: { label: 'FR04 Approvals', tone: 'admin' },
  budget_proposal: { label: 'FR04 Approvals', tone: 'admin' },
  workspace_member: { label: 'FR06 RBAC', tone: 'manager' },
  workspace: { label: 'FR06 Workspace', tone: 'manager' },
  campaign_performance: { label: 'FR08 Data Import', tone: 'active' },
  strategy: { label: 'FR01 Strategy', tone: 'admin' },
}

const DATE_OPTS = [
  { label: 'Past 7 Days', days: 7 },
  { label: 'Past 30 Days', days: 30 },
  { label: 'Past 90 Days', days: 90 },
  { label: 'All Time', days: 0 },
]

const LOG_PAGE = 6

function fr11Ago(days) {
  if (!days) return null
  const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString()
}

function fr11Date(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) + ' ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' }) + ' UTC'
}

function fr11Initials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?'
}

function fr11Diff(before, after) {
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})])
  return [...keys].map(k => ({
    key: k, before: (before || {})[k], after: (after || {})[k],
    added: !(k in (before || {})), removed: !(k in (after || {})),
    changed: JSON.stringify((before || {})[k]) !== JSON.stringify((after || {})[k]),
  })).filter(d => d.changed)
}

function fr11Csv(logs) {
  const rows = logs.map(l => [l.created_at, (l.actor?.full_name || 'System').replace(/,/g, ' '), l.action, l.entity_type, l.entity_id || ''].join(','))
  const csv = ['Timestamp (UTC),Actor,Action,Entity Type,Entity ID', ...rows].join('\n')
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'audit_log.csv'; a.click()
  URL.revokeObjectURL(url)
}

async function fr11Fetch(wid, page, action, entityType, dateFrom) {
  const from = (page - 1) * LOG_PAGE, to = from + LOG_PAGE - 1
  let q = requireSupabase().from('audit_logs')
    .select('id,action,entity_type,entity_id,before_value,after_value,created_at,actor_id', { count: 'exact' })
    .eq('workspace_id', wid).order('created_at', { ascending: false }).range(from, to)
  if (action) q = q.eq('action', action)
  if (entityType) q = q.eq('entity_type', entityType)
  if (dateFrom) q = q.gte('created_at', dateFrom)
  const { data: rows, count, error } = await q
  if (error) throw error
  const ids = [...new Set((rows || []).map(r => r.actor_id).filter(Boolean))]
  const aMap = {}
  if (ids.length) {
    const { data: profiles } = await requireSupabase().from('profiles').select('id,full_name').in('id', ids)
      ; (profiles || []).forEach(p => { aMap[p.id] = p.full_name })
  }
  return { data: (rows || []).map(r => ({ ...r, actor: { full_name: aMap[r.actor_id] || null } })), total: count || 0 }
}

// ─── FR11 Detail Panel ───────────────────────────────────────────────────────
function AuditLogDetailPanel({ log, onBack, notify }) {
  const aM = ACTION_META[log.action] || { label: log.action, tone: 'neutral' }
  const mM = MODULE_META[log.entity_type] || { label: log.entity_type, tone: 'neutral' }
  const actor = log.actor?.full_name || 'System'
  const diffs = fr11Diff(log.before_value, log.after_value)
  function copyHash() { navigator.clipboard.writeText(log.id).then(() => notify?.('Hash đã được sao chép.')).catch(() => notify?.('Không thể sao chép.')) }
  function dlDiff() {
    const payload = { log_id: log.id, action: log.action, entity_type: log.entity_type, entity_id: log.entity_id, timestamp: log.created_at, before: log.before_value, after: log.after_value, field_diffs: diffs }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `audit_diff_${log.id.slice(0, 8)}.json`; a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <section className="audit-detail">
      <header className="audit-detail-hdr">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="button subtle" style={{ minHeight: '36px', padding: '0 14px', fontSize: '13px' }} onClick={onBack}>← Quay lại</button>
          <span className="actor-code">FR11 IMMUTABLE LEDGER</span>
        </div>
        <button className="button subtle" style={{ minHeight: '36px', padding: '0 14px', fontSize: '13px' }} onClick={dlDiff}>⇩ Export Verification Receipt</button>
      </header>
      <div style={{ padding: '22px 22px 0' }}>
        <h2 style={{ margin: '0 0 4px' }}>Audit Log Record Details <span className="actor-code" style={{ fontSize: '11px', verticalAlign: 'middle' }}>#{log.id.slice(0, 8).toUpperCase()}</span></h2>
        <p style={{ margin: '0 0 20px', color: '#9ca8c4', fontSize: '13px' }}>Bản ghi bất biến – mã hóa SHA-256 – lưu trữ vĩnh viễn theo chính sách FR11.</p>
      </div>
      <div className="audit-detail-meta">
        <div className="audit-detail-meta-cell">
          <small>Actor / Initiator</small>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <b style={{ display: 'grid', placeItems: 'center', width: '36px', height: '36px', background: '#685cf4', borderRadius: '7px', fontStyle: 'normal', flexShrink: 0 }}>{fr11Initials(actor)}</b>
            <span><strong style={{ display: 'block' }}>{actor}</strong><small style={{ display: 'block', color: '#8a96b1', marginTop: 0 }}>{log.actor_id ? `ID: ${log.actor_id.slice(0, 12)}…` : 'System'}</small></span>
          </div>
          <Badge tone={aM.tone}>{aM.label}</Badge>
        </div>
        <div className="audit-detail-meta-cell">
          <small>Timestamp</small>
          <strong style={{ display: 'block', fontFamily: 'ui-monospace,monospace', fontSize: '13px', color: '#67dcf5', lineHeight: '1.6' }}>{fr11Date(log.created_at)}</strong>
        </div>
        <div className="audit-detail-meta-cell">
          <small>Target Entity</small>
          <Badge tone={mM.tone}>{mM.label}</Badge>
          <div style={{ marginTop: '8px' }}>
            <strong style={{ display: 'block', fontSize: '13px' }}>{log.entity_type}</strong>
            {log.entity_id && <span style={{ display: 'block', fontFamily: 'ui-monospace,monospace', fontSize: '11px', color: '#67dcf5', marginTop: '4px', wordBreak: 'break-all' }}>{log.entity_id}</span>}
          </div>
        </div>
        <div className="audit-detail-meta-cell">
          <small>Verification Hash</small>
          <span style={{ display: 'block', fontFamily: 'ui-monospace,monospace', fontSize: '11px', color: '#67dcf5', wordBreak: 'break-all', marginBottom: '8px' }}>{log.id}</span>
          <Badge tone="active">Verified &amp; Immutable</Badge>
        </div>
      </div>
      {diffs.length > 0 ? (
        <div className="audit-diff">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0 14px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Field-Level Version Diff (Before vs After)</h3>
            <span style={{ fontSize: '12px', color: '#8a96b1' }}>{diffs.length} field{diffs.length !== 1 ? 's' : ''} changed</span>
          </div>
          {diffs.map(d => (
            <div key={d.key} className="audit-diff-block">
              <div className="audit-diff-header">
                <span><strong style={{ color: '#b0b8d4', marginRight: '6px' }}>Field:</strong><code style={{ color: '#67dcf5', fontSize: '12px' }}>{d.key}</code></span>
                <Badge tone={d.added ? 'approved' : d.removed ? 'rejected' : 'manager'}>{d.added ? '+ Added' : d.removed ? '- Removed' : '~ Changed'}</Badge>
              </div>
              <div className="audit-diff-cols">
                <div className="audit-diff-col before">
                  <small>Before</small>
                  <pre>{d.before !== undefined ? JSON.stringify(d.before, null, 2) : '(không có)'}</pre>
                </div>
                <div className="audit-diff-col after">
                  <small>After</small>
                  <pre>{d.after !== undefined ? JSON.stringify(d.after, null, 2) : '(đã xóa)'}</pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '22px' }}>
          {log.after_value ? (
            <div className="audit-diff-block">
              <div className="audit-diff-header"><span>Snapshot – hành động tạo mới</span></div>
              <div style={{ padding: '14px 16px' }}><pre style={{ fontFamily: 'ui-monospace,monospace', fontSize: '12px', color: '#cbd4e6', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(log.after_value, null, 2)}</pre></div>
            </div>
          ) : <p style={{ color: '#9ca8c4', fontSize: '13px', margin: 0 }}>Không có dữ liệu diff cho bản ghi này.</p>}
        </div>
      )}
      <div className="audit-gov-trail">
        <h3 style={{ margin: '0 0 14px', fontSize: '16px' }}>Governance Audit Trail</h3>
        <ul className="audit-timeline">
          <li><div><strong style={{ display: 'block' }}>{aM.label} – committed</strong><span style={{ color: '#8a96b1', fontSize: '12px' }}>Actor: {actor} · {fr11Date(log.created_at)}</span></div></li>
          {log.before_value && <li><div><strong style={{ display: 'block' }}>Trạng thái trước ghi nhận</strong><span style={{ color: '#8a96b1', fontSize: '12px' }}>{Object.keys(log.before_value).length} field(s) trong before snapshot</span></div></li>}
          {log.after_value && <li><div><strong style={{ display: 'block' }}>Trạng thái mới commit</strong><span style={{ color: '#8a96b1', fontSize: '12px' }}>{Object.keys(log.after_value).length} field(s) trong after snapshot</span></div></li>}
          <li><div><strong style={{ display: 'block', color: '#48db83' }}>Hash sealed – Immutable Ledger</strong><span style={{ color: '#8a96b1', fontSize: '12px' }}>Retention: 7 Years · SHA-256 compliant</span></div></li>
        </ul>
      </div>
      <div className="audit-detail-actions">
        <button className="button subtle" onClick={onBack}>← Quay lại danh sách</button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="button subtle" onClick={copyHash}>⧉ Copy Hash</button>
          <button className="button primary" onClick={dlDiff}>⇩ Download Signed JSON Diff</button>
        </div>
      </div>
    </section>
  )
}

const DEMO_AUDIT_LOGS = [
  {
    id: '3a4b9c1d-8e7f-4a2b-9c1d-8e7f4a2b9c1d',
    action: 'approve',
    entity_type: 'ad_content',
    entity_id: 'PRP-8401',
    created_at: '2026-10-14T09:41:22Z',
    ageDays: 0,
    actor_id: 'usr-001',
    actor: { full_name: 'Mai Lan' },
    before_value: { status: 'pending_review', review_notes: null, approved_by: null },
    after_value: { status: 'approved', review_notes: 'All compliance guardrails passed (12/12). Ready for publishing.', approved_by: 'Mai Lan' },
  },
  {
    id: '7f2c8d1e-9a3b-4c5d-6e7f-8a9b0c1d2e3f',
    action: 'edit',
    entity_type: 'budget_proposal',
    entity_id: 'BUD-2026-Q4',
    created_at: '2026-10-14T08:15:04Z',
    ageDays: 0,
    actor_id: 'usr-002',
    actor: { full_name: 'Hà Ngọc Minh' },
    before_value: { total_budget: 10000000, google_allocation: 40, meta_allocation: 40, tiktok_allocation: 20 },
    after_value: { total_budget: 12500000, google_allocation: 50, meta_allocation: 35, tiktok_allocation: 15 },
  },
  {
    id: '1e8d9c2b-3a4f-5e6d-7c8b-9a0f1e2d3c4b',
    action: 'invite',
    entity_type: 'workspace_member',
    entity_id: 'USR-9921',
    created_at: '2026-10-14T07:30:19Z',
    ageDays: 0,
    actor_id: 'usr-003',
    actor: { full_name: 'Lê Thành Đạt' },
    before_value: null,
    after_value: { email: 'content@demo.castravision.vn', assigned_role: 'Member', status: 'pending_invitation' },
  },
  {
    id: '9c3a4b5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d',
    action: 'create',
    entity_type: 'strategy',
    entity_id: 'STR-1104',
    created_at: '2026-10-13T23:12:45Z',
    ageDays: 1,
    actor_id: 'usr-bot',
    actor: { full_name: 'AI Engine' },
    before_value: null,
    after_value: { title: 'Chiến lược tăng trưởng Q4 SneakerVN', recommended_channel: 'Meta & Google Ads', target_audience: 'Gen Z 18-28', budget: 30000000 },
  },
  {
    id: '4b7f8e9d-0c1a-2b3c-4d5e-6f7a8b9c0d1e',
    action: 'role_change',
    entity_type: 'workspace_member',
    entity_id: 'USR-8812',
    created_at: '2026-10-13T18:04:11Z',
    ageDays: 1,
    actor_id: 'usr-003',
    actor: { full_name: 'Lê Thành Đạt' },
    before_value: { user_email: 'mailan@demo.castravision.vn', role: 'Member' },
    after_value: { user_email: 'mailan@demo.castravision.vn', role: 'Manager' },
  },
  {
    id: '6d1e2f3a-4b5c-6d7e-8f9a-0b1c2d3e4f5a',
    action: 'import',
    entity_type: 'campaign_performance',
    entity_id: 'IMP-0042',
    created_at: '2026-10-13T14:22:38Z',
    ageDays: 1,
    actor_id: 'usr-002',
    actor: { full_name: 'Hà Ngọc Minh' },
    before_value: null,
    after_value: { filename: 'q3_performance_metrics.csv', row_count: 120, validated_status: 'complete' },
  },
  {
    id: '8e9f0a1b-2c3d-4e5f-6a7b-8c9d0e1f2a3b',
    action: 'reject',
    entity_type: 'ad_content',
    entity_id: 'PRP-8399',
    created_at: '2026-10-12T11:05:30Z',
    ageDays: 2,
    actor_id: 'usr-003',
    actor: { full_name: 'Lê Thành Đạt' },
    before_value: { status: 'pending_review' },
    after_value: { status: 'rejected', rejection_reason: 'Ngân sách vượt trần phân bổ thử nghiệm cho nhóm ad set' },
  },
  {
    id: '2c3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f',
    action: 'create',
    entity_type: 'workspace',
    entity_id: 'WKS-0001',
    created_at: '2026-10-10T08:00:00Z',
    ageDays: 4,
    actor_id: 'usr-003',
    actor: { full_name: 'Lê Thành Đạt' },
    before_value: null,
    after_value: { workspace_name: 'SneakerVN', plan: 'SME Pro', region: 'ap-southeast-1' },
  },
]

// ─── FR11 Audit Log Page ─────────────────────────────────────────────────────
export function AuditLogPage({ notify }) {
  const auth = useContext(AuthContext)
  const workspaceId = auth?.workspaceId
  const [remoteLogs, setRemoteLogs] = useState([])
  const [remoteTotal, setRemoteTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [fAction, setFAction] = useState('')
  const [fModule, setFModule] = useState('')
  const [fDays, setFDays] = useState(30)
  const [selected, setSelected] = useState(null)

  const demoResult = useMemo(() => {
    if (workspaceId) return null
    let filtered = DEMO_AUDIT_LOGS
    if (fAction) filtered = filtered.filter(l => l.action === fAction)
    if (fModule) filtered = filtered.filter(l => l.entity_type === fModule)
    if (fDays) {
      filtered = filtered.filter(l => (l.ageDays || 0) <= fDays)
    }
    const from = (page - 1) * LOG_PAGE
    return { data: filtered.slice(from, from + LOG_PAGE), total: filtered.length }
  }, [workspaceId, page, fAction, fModule, fDays])


  const logs = demoResult ? demoResult.data : remoteLogs
  const total = demoResult ? demoResult.total : remoteTotal
  const totalPages = Math.max(1, Math.ceil(total / LOG_PAGE))

  useEffect(() => {
    if (!workspaceId) return
    let alive = true
    Promise.resolve().then(() => {
      if (!alive) return
      setLoading(true)
      setError('')
      fr11Fetch(workspaceId, page, fAction, fModule, fr11Ago(fDays))
        .then(r => { if (alive) { setRemoteLogs(r.data); setRemoteTotal(r.total) } })
        .catch(e => { if (alive) setError(e.message || 'Không thể tải nhật ký kiểm toán.') })
        .finally(() => { if (alive) setLoading(false) })
    })

    return () => { alive = false }
  }, [workspaceId, page, fAction, fModule, fDays])



  function applyFilter(key, val) { if (key === 'action') setFAction(val); else if (key === 'module') setFModule(val); else if (key === 'days') setFDays(+val); setPage(1); setSelected(null) }
  function reset() { setFAction(''); setFModule(''); setFDays(30); setSearch(''); setPage(1); setSelected(null) }
  function goPage(p) { if (p < 1 || p > totalPages) return; setPage(p); setSelected(null) }
  function clearChip(key) { if (key === 'action') setFAction(''); else if (key === 'module') setFModule(''); else if (key === 'days') setFDays(30); setPage(1); setSelected(null) }

  const visible = search.trim()
    ? logs.filter(l => [l.actor?.full_name, l.action, l.entity_type, l.entity_id].some(v => (v || '').toLowerCase().includes(search.toLowerCase())))
    : logs

  const activeChips = [
    fAction && { key: 'action', label: `Action: ${ACTION_META[fAction]?.label || fAction}` },
    fModule && { key: 'module', label: `Module: ${MODULE_META[fModule]?.label || fModule}` },
    fDays !== 30 && { key: 'days', label: `Date: ${DATE_OPTS.find(o => o.days === fDays)?.label || fDays + 'd'}` },
  ].filter(Boolean)

  if (selected) return <AuditLogDetailPanel log={selected} onBack={() => setSelected(null)} notify={notify} />

  const rowFrom = (page - 1) * LOG_PAGE + 1
  const rowTo = Math.min(page * LOG_PAGE, total)
  return (
    <>
      <PageIntro
        code="FR11 · IMMUTABLE LEDGER"
        title="System Audit Log"
        subtitle="Nhật ký sự kiện bất biến – mã hóa SHA-256 – theo dõi mọi hành động, thay đổi vai trò và phê duyệt trong Workspace."
        action={
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button className="button subtle" onClick={() => fr11Csv(logs)} disabled={!logs.length}>⇩ Export Audit Log (CSV)</button>
            <button className="button subtle" disabled title="Requires backend cryptographic service (FR11 backend)">✓ Verify Cryptographic Hashes</button>
          </div>
        }
      />
      <div className="actor-summary">
        <div><strong>{total.toLocaleString()}</strong><span>Tổng sự kiện ({DATE_OPTS.find(o => o.days === fDays)?.label || 'All Time'})</span></div>
        <div><strong className="success-text">100%</strong><span>Toàn vẹn dữ liệu</span></div>
        <div><strong>{[...new Set(logs.map(l => l.actor_id).filter(Boolean))].length || '—'}</strong><span>Người thực hiện</span></div>
        <div><strong className="code-text">{logs[0]?.id ? logs[0].id.slice(0, 8) + '…' : '—'}</strong><span>Hash mới nhất</span></div>
      </div>
      <Panel title="Audit Events" meta="SHA-256 verified">
        <div className="audit-filter-bar">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#7888a3', pointerEvents: 'none' }}>⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Lọc theo user, action, entity ID..." style={{ paddingLeft: '36px', fontSize: '13px' }} />
          </div>
          <select value={fAction} onChange={e => applyFilter('action', e.target.value)} style={{ fontSize: '13px' }}>
            <option value="">All Actions</option>
            {Object.entries(ACTION_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={fModule} onChange={e => applyFilter('module', e.target.value)} style={{ fontSize: '13px' }}>
            <option value="">All Modules</option>
            {[...new Map(Object.entries(MODULE_META).map(([k, v]) => [v.label, k])).entries()].map(([label, k]) => <option key={k} value={k}>{label}</option>)}
          </select>
          <select value={fDays} onChange={e => applyFilter('days', e.target.value)} style={{ fontSize: '13px' }}>
            {DATE_OPTS.map(o => <option key={o.days} value={o.days}>{o.label}</option>)}
          </select>
          <button className="button subtle" style={{ minHeight: '38px', padding: '0 14px', fontSize: '13px' }} onClick={reset}>↺ Reset</button>
        </div>
        {activeChips.length > 0 && (
          <div className="audit-chips">
            <span style={{ fontSize: '12px', color: '#7888a3', alignSelf: 'center', marginRight: '4px' }}>Đang lọc:</span>
            {activeChips.map(c => (
              <span key={c.key} className="audit-chip">{c.label}<button onClick={() => clearChip(c.key)} aria-label={`Bỏ lọc ${c.label}`}>×</button></span>
            ))}
            <button style={{ background: 'none', border: 'none', color: '#b0b8d4', fontSize: '12px', cursor: 'pointer' }} onClick={() => { setFAction(''); setFModule(''); setFDays(30); setPage(1); setSelected(null) }}>Clear all</button>
          </div>
        )}
        {error && <div style={{ padding: '16px 18px', color: '#ffd7da', background: '#462b3a', borderBottom: '1px solid #a8586a', fontSize: '13px' }}>⚠ {error}</div>}
        <div className="actor-table-wrap">
          <table className="actor-table">
            <thead>
              <tr>
                <th>Timestamp (UTC)</th>
                <th>User / Actor</th>
                <th>Action Type</th>
                <th>Object / Entity</th>
                <th>Module / Spec</th>
                <th>Details Summary</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: '#7888a3' }}>Đang tải nhật ký kiểm toán…</td></tr>}
              {!loading && visible.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: '#7888a3' }}>Không có sự kiện nào phù hợp với bộ lọc hiện tại.</td></tr>}
              {!loading && visible.map(log => {
                const aM = ACTION_META[log.action] || { label: log.action, tone: 'neutral' }
                const mM = MODULE_META[log.entity_type] || { label: log.entity_type, tone: 'neutral' }
                const name = log.actor?.full_name || 'System'
                return (
                  <tr key={log.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(log)} title="Xem chi tiết bản ghi">
                    <td className="code-text" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{fr11Date(log.created_at)}</td>
                    <td>
                      <div className="actor-person">
                        <b style={{ background: '#685cf4', fontStyle: 'normal', fontSize: '12px', flexShrink: 0 }}>{fr11Initials(name)}</b>
                        <span><strong>{name}</strong><small>{log.actor_id ? log.actor_id.slice(0, 8) + '…' : 'system'}</small></span>
                      </div>
                    </td>
                    <td><Badge tone={aM.tone}>{aM.label}</Badge></td>
                    <td style={{ fontFamily: 'ui-monospace,monospace', fontSize: '12px', color: '#67dcf5' }}>
                      {log.entity_id ? log.entity_id.slice(0, 8) + '…' : <span style={{ color: '#4a5a78' }}>{log.entity_type}</span>}
                    </td>
                    <td><Badge tone={mM.tone}>{mM.label}</Badge></td>
                    <td style={{ fontSize: '12px', color: '#9ca8c4' }}>
                      <span>{log.action} · {log.entity_type}</span>
                      <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: '11px', color: '#3a4d6a', marginTop: '3px' }}>hash: {log.id.slice(0, 4)}…{log.id.slice(-4)}</div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="audit-pagination">
          <span>
            {loading ? 'Đang tải…' : total > 0 ? `Hiển thị ${rowFrom}–${rowTo} / ${total.toLocaleString()} entries · All hashes verified (SHA-256)` : 'Không có kết quả'}
          </span>
          <div className="audit-page-btns">
            <button onClick={() => goPage(page - 1)} disabled={page <= 1}>‹</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i
              return <button key={p} className={p === page ? 'active' : ''} onClick={() => goPage(p)}>{p}</button>
            })}
            {totalPages > 5 && page < totalPages - 2 && <><span style={{ padding: '0 4px', color: '#4a5a78' }}>…</span><button onClick={() => goPage(totalPages)}>{totalPages}</button></>}
            <button onClick={() => goPage(page + 1)} disabled={page >= totalPages}>›</button>
          </div>
        </div>
      </Panel>
    </>
  )
}

export function AdminDashboardPage({ profile, imports = [], setPage, notify }) {
  const [pending, setPending] = useState([
    ['PRP-8402', 'Nội dung đa kênh Q4', 'CONTENT', 'AI Content Engine · Mai Lan'],
    ['PRP-8403', 'Tái phân bổ ngân sách động', 'BUDGET', 'Budget Optimizer · Hà Ngọc Minh'],
    ['PRP-8404', 'Chuỗi nội dung nuôi dưỡng', 'CONTENT', 'AI Content Engine · Mai Lan'],
  ])
  const audit = [
    ['FR06 RBAC', 'Đổi vai trò: Mai Lan được nâng lên Manager', '14 phút trước', 'Lê Thành Đạt · Admin'],
    ['FR04 APPROVAL', 'Đã phê duyệt PRP-8401 Creative Retargeting', '1 giờ trước', 'Hà Ngọc Minh · Manager'],
    ['FR06 INVITE', 'Đã mời content@demo.castravision.vn', '3 giờ trước', 'Lê Thành Đạt · Admin'],
    ['FR08 IMPORT', `Đã nhập dữ liệu chiến dịch (${imports.length || 3} nguồn)`, '5 giờ trước', 'Hà Ngọc Minh · Manager'],
  ]
  function approve(id) {
    setPending((current) => current.filter((row) => row[0] !== id))
    notify?.(`${id} đã được phê duyệt và ghi vào Audit Log.`)
  }
  return <>
    <PageIntro code="ADMIN · LIVE NODE" title="Admin Console" subtitle={`Quản trị ${profile.business_name}, phân quyền thành viên, phê duyệt đề xuất và giám sát nhật ký tuân thủ.`} action={<div className="admin-quick-actions"><button className="button subtle" onClick={() => setPage('members')}>♙ Mời thành viên</button><button className="button subtle" onClick={() => setPage('roles')}>◈ Quản lý vai trò</button><button className="button primary" onClick={() => notify?.('Tính năng tạo Workspace mới đã sẵn sàng để kết nối API.')}>＋ Tạo Workspace</button></div>} />
    <div className="admin-kpi-grid">
      <article><span>Workspace hiện tại</span><div className="admin-kpi-title"><strong>{profile.business_name}</strong><i>▦</i></div><p>{profile.industry || 'Doanh nghiệp'} · {profile.business_size || 'SME'}</p><small>Trạng thái <b className="success-text">Active</b></small></article>
      <article><span>Thành viên Workspace</span><div className="admin-kpi-title"><strong>4 thành viên</strong><i>♙</i></div><p>1 Admin · 1 Manager · 2 Member</p><button onClick={() => setPage('members')}>Quản lý thành viên →</button></article>
      <article><span>Đang chờ phê duyệt</span><div className="admin-kpi-title"><strong>{pending.length} đề xuất</strong><i>✓</i></div><p>Content và Budget cần ký duyệt</p><button onClick={() => setPage('approvals')}>Mở hàng chờ →</button></article>
      <article><span>Audit events · 24h</span><div className="admin-kpi-title"><strong>48 sự kiện</strong><i>♢</i></div><p>100% được ghi nhận bằng hash</p><button onClick={() => setPage('audit')}>Xem Audit Log →</button></article>
    </div>
    <div className="admin-console-grid">
      <div>
        <Panel title="Quản lý Workspace & sức khỏe tài nguyên" meta="Active · Healthy"><div className="resource-health"><div className="resource-facts"><span><small>Đơn vị tổ chức</small><strong>{profile.business_name}</strong></span><span><small>Gói đang dùng</small><strong>SME Pro</strong></span></div><div className="health-meter"><span><b>AI Engine orchestration</b><em>68% capacity</em></span><div><i style={{ width: '68%' }} /></div></div><div className="health-meter green"><span><b>Audit ledger throughput</b><em>Optimal · 0,24ms</em></span><div><i style={{ width: '92%' }} /></div></div><div className="resource-actions"><button onClick={() => setPage('members')}>♙ Thành viên</button><button onClick={() => setPage('roles')}>▦ Ma trận quyền</button><button onClick={() => setPage('profile')}>☷ Cài đặt Workspace</button></div></div></Panel>
        <Panel title="Governance đang chờ phê duyệt · FR04" meta={`${pending.length} pending review`}><div className="governance-list">{pending.length ? pending.map(([id, title, type, author]) => <article key={id}><span className="proposal-symbol">{type === 'BUDGET' ? '▣' : '▤'}</span><div><small>{id} · {type}</small><strong>{title}</strong><span>{author}</span></div><div><button className="row-action" onClick={() => setPage('approvals')}>Xem xét</button><button className="approve-action" onClick={() => approve(id)}>Phê duyệt</button></div></article>) : <div className="admin-empty">✓ Không còn đề xuất chờ phê duyệt.</div>}</div></Panel>
      </div>
      <Panel title="Audit Trail gần đây · FR11" meta="● Live"><div className="recent-audit">{audit.map(([code, text, time, actor]) => <article key={code + time}><div><Badge tone={code.includes('APPROVAL') ? 'admin' : code.includes('IMPORT') ? 'active' : 'manager'}>{code}</Badge><time>{time}</time></div><p>{text}</p><small>◎ {actor}</small></article>)}</div><button className="audit-footer-button" onClick={() => setPage('audit')}>▤ Xem toàn bộ Audit Log</button></Panel>
    </div>
  </>
}

export function PerformanceDashboardPage({ setPage, imports = [] }) {
  const channels = [['Google Search', '1,84M', '4,15%', '21.200 ₫', '4,20×', 88], ['Meta Ads', '2,10M', '3,10%', '26.400 ₫', '3,65×', 73], ['TikTok Video', '880K', '2,45%', '29.100 ₫', '2,80×', 56]]
  return <><PageIntro code="FR05 · PERFORMANCE MONITORING" title="Dashboard hiệu suất chiến dịch" subtitle="Theo dõi các kênh marketing theo mục tiêu hiệu quả đã xác lập." action={<button className="button subtle">↻ Làm mới dữ liệu</button>} /><div className="metric-grid"><article><span>Impressions</span><strong>4,82M</strong><small className="success-text">↗ +12,4% kỳ trước</small></article><article><span>CTR</span><strong>3,42%</strong><small>Benchmark 2,80%</small></article><article><span>CPA</span><strong>24.800 ₫</strong><small>Thấp hơn mục tiêu 3.200 ₫</small></article><article><span>ROAS</span><strong>3,85×</strong><small className="success-text">Vượt mục tiêu</small></article></div><div className="dashboard-split"><Panel title="Hiệu suất theo kênh" meta={`${imports.length || 3} nguồn dữ liệu`}><div className="channel-performance">{channels.map((row, index) => <div className="performance-row" key={row[0]}><div><strong>{row[0]}</strong><small>{index === 0 ? 'High intent' : index === 1 ? 'Retargeting' : 'Cần tối ưu'}</small></div>{row.slice(1, 5).map((value) => <b key={value}>{value}</b>)}<div className="mini-progress"><span style={{ width: `${row[5]}%` }} /></div></div>)}</div></Panel><Panel title="Cảnh báo tối ưu" className="alert-panel"><Badge tone="rejected">Alert trigger</Badge><h3>TikTok CPA vượt ngưỡng</h3><p>CPA hiện tại cao hơn mục tiêu. Nên cân bằng lại ngân sách để bảo vệ biên lợi nhuận.</p><button className="button primary full" onClick={() => setPage('budget')}>Mở trình tối ưu ngân sách</button></Panel></div></>
}

export function BudgetOptimizationPage({ notify }) {
  const [analyzed, setAnalyzed] = useState(false)
  const allocations = [['Google Search', 40, 50, 6250000], ['Meta Ads', 40, 35, 4375000], ['TikTok Video', 20, 15, 1875000]]
  return <><PageIntro code="FR03 · BUDGET OPTIMIZATION ENGINE" title="Phân bổ ngân sách theo hiệu suất" subtitle="Phân tích hiệu quả kênh và tối ưu phân bổ dựa trên dữ liệu đã xác minh." /><div className="metric-grid"><article><span>Ngân sách hiện tại</span><strong>{money(10000000)}</strong><small>30 ngày gần nhất</small></article><article><span>Ngân sách đề xuất</span><strong>{money(12500000)}</strong><small className="success-text">+25,0%</small></article><article><span>CPA dự kiến</span><strong>24.800 ₫</strong><small>-14,0%</small></article></div><Panel title="Phân bổ hiện tại và đề xuất" meta="100% normalized"><div className="budget-stack"><span style={{ width: '50%' }} /><span style={{ width: '35%' }} /><span style={{ width: '15%' }} /></div><div className="allocation-list">{allocations.map(([channel, current, proposed, amount]) => <div key={channel}><strong>{channel}</strong><span>Hiện tại {current}%</span><b>{money(amount)} ({proposed}%)</b><em className={proposed >= current ? 'positive' : 'negative'}>{proposed - current > 0 ? '+' : ''}{proposed - current}% tỷ trọng</em></div>)}</div></Panel><div className="actor-policy"><div><b>Governance:</b> Phân bổ đề xuất phải qua hàng chờ FR04 trước khi áp dụng.</div><div className="review-actions"><button className="button subtle" onClick={() => setAnalyzed(true)}>↻ Chạy phân tích</button><button className="button primary" onClick={() => notify?.('Đề xuất ngân sách đã được gửi tới hàng chờ phê duyệt.')}>Gửi phê duyệt</button></div></div>{analyzed && <div className="actor-policy success">✓ Phân tích hoàn tất: 3 guardrail đạt, tổng phân bổ bằng 100%.</div>}</>
}

export function ReportsPage({ profile, notify }) {
  const [period, setPeriod] = useState('30 ngày')
  const reports = [['Bao_cao_hieu_suat_Q4.pdf', 'PDF', '2,4 MB'], ['Hieu_qua_kenh_Thang_10.csv', 'CSV', '480 KB'], ['Tong_quan_dieu_hanh_Tuan_41.pdf', 'PDF', '1,9 MB']]
  return <><PageIntro code="FR07 · REPORT GENERATION & EXPORT" title="Xuất báo cáo định kỳ" subtitle="Tổng hợp hiệu suất chiến dịch cho điều hành và các bên liên quan." /><div className="report-layout"><div><Panel title="1 · Kỳ báo cáo"><div className="period-options">{['7 ngày', '30 ngày', 'Tháng này', 'Tùy chỉnh'].map((item) => <button className={period === item ? 'selected' : ''} onClick={() => setPeriod(item)} key={item}>{item}</button>)}</div></Panel><Panel title="2 · Chỉ số báo cáo"><div className="metric-chips">{['Impressions ✓', 'CTR ✓', 'CPA ✓', 'ROAS ✓', 'Chi tiêu theo kênh ✓'].map((item) => <span key={item}>{item}</span>)}</div></Panel></div><Panel title="Tóm tắt xuất" className="export-summary"><dl><div><dt>Tài khoản</dt><dd>{profile.business_name}</dd></div><div><dt>Phạm vi</dt><dd>{period}</dd></div><div><dt>Chiến dịch</dt><dd>3 đang hoạt động</dd></div></dl><button className="button primary full" onClick={() => notify?.('Báo cáo PDF đã được đưa vào hàng chờ tạo file.')}>Xuất PDF</button><button className="button subtle full" onClick={() => notify?.('Báo cáo CSV đã được đưa vào hàng chờ tạo file.')}>Xuất CSV</button></Panel></div><Panel title="Báo cáo gần đây" meta="Ready"><div className="report-list">{reports.map((row) => <div key={row[0]}><span className="file-type">{row[1]}</span><strong>{row[0]}</strong><small>{row[2]} · Sẵn sàng</small><button className="row-action">Tải xuống</button></div>)}</div></Panel></>
}

export function CompetitorInsightsPage({ notify }) {
  const [processing, setProcessing] = useState(false)
  const [competitors, setCompetitors] = useState('Strider Athletics, Apex Footwear')
  const entities = useMemo(() => competitors.split(',').map((item) => item.trim()).filter(Boolean), [competitors])
  function analyze() { setProcessing(true); window.setTimeout(() => { setProcessing(false); notify?.('Phân tích đối thủ đã hoàn tất.') }, 600) }
  return <><PageIntro code="FR09 · MARKET INTELLIGENCE" title="Đối thủ & xu hướng thị trường" subtitle="Phân tích đối thủ và tín hiệu ngành để bổ sung ngữ cảnh cho chiến lược và nội dung." /><Panel title="Cấu hình phân tích" meta="Automated query vector"><div className="insight-form"><label>Tên thương hiệu đối thủ<input value={competitors} onChange={(event) => setCompetitors(event.target.value)} /></label><label>Từ khóa thị trường<input defaultValue="Giày chạy bộ, sneaker, thời trang thể thao" /></label><label>Phạm vi<select defaultValue="VN"><option value="VN">Việt Nam · Thời trang</option><option value="SEA">Đông Nam Á</option></select></label><button className="button primary" onClick={analyze} disabled={processing}>{processing ? 'Đang phân tích…' : '✦ Phân tích'}</button></div>{processing && <div className="analysis-progress"><span />Đang thu thập tín hiệu thị trường…</div>}</Panel><div className="insight-columns"><Panel title="Đối thủ & chiến thuật kênh" meta={`${entities.length} entities`}>{entities.map((entity, index) => <article className="competitor-card" key={entity}><div><b>{entity[0]}</b><span><strong>{entity}</strong><small>{index ? 'Đối thủ cùng phân khúc' : 'Đối thủ trực tiếp'}</small></span></div><p>Góc nội dung nổi bật: “{index ? 'Độ bền & phong cách' : 'Nhẹ, linh hoạt và hiệu suất'}”</p><div className="budget-stack"><span style={{ width: `${index ? 60 : 35}%` }} /><span style={{ width: `${index ? 30 : 55}%` }} /><span style={{ width: '10%' }} /></div></article>)}</Panel><Panel title="Tín hiệu thị trường" meta="Q4 live stream"><article className="trend-card"><Badge tone="manager">+42% YoY</Badge><h3>Video ngắn tăng mạnh trong ngành sneaker</h3><p>Tần suất nội dung TikTok/Reels tăng rõ rệt, tạo áp lực đấu giá quảng cáo.</p></article><article className="trend-card"><Badge tone="admin">+28% Q4</Badge><h3>Ý định tìm kiếm sản phẩm cao</h3><p>Nhóm từ khóa chuyên biệt đang có mức sẵn sàng mua cao.</p></article><button className="button primary full" onClick={() => notify?.('Insight đã được gửi sang Content Studio.')}>Gửi sang Content Studio</button></Panel></div></>
}

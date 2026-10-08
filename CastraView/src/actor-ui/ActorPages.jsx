import { useMemo, useState } from 'react'

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

export function AuditLogPage() {
  const events = [
    ['14:48:22', 'Hà Ngọc Minh', 'Đã phê duyệt', 'PRP-8402', 'FR04 Approvals'],
    ['14:38:10', 'Hà Ngọc Minh', 'Đã chỉnh sửa', 'PRP-8402', 'FR04 Approvals'],
    ['13:15:00', 'Lê Thành Đạt', 'Đổi vai trò', 'Mai Lan', 'FR06 RBAC'],
    ['11:05:44', 'Lê Thành Đạt', 'Mời thành viên', 'content@demo.castravision.vn', 'FR06 Workspace'],
    ['10:12:00', 'Hà Ngọc Minh', 'Nhập dữ liệu', 'campaign_q4.xlsx', 'FR08 Import'],
  ]
  return <><PageIntro code="FR11 · IMMUTABLE LEDGER" title="Nhật ký kiểm toán hệ thống" subtitle="Theo dõi hành động, thay đổi vai trò và quyết định phê duyệt trong Workspace." action={<button className="button subtle">⇩ Xuất CSV</button>} /><div className="actor-summary"><div><strong>1.482</strong><span>Sự kiện 30 ngày</span></div><div><strong className="success-text">100%</strong><span>Toàn vẹn dữ liệu</span></div><div><strong>3</strong><span>Người vận hành</span></div><div><strong className="code-text">9b4f…aa03</strong><span>Hash cuối</span></div></div><Panel title="Audit events" meta="SHA-256 verified"><div className="actor-table-wrap"><table className="actor-table"><thead><tr><th>Thời gian</th><th>Actor</th><th>Hành động</th><th>Đối tượng</th><th>Module</th></tr></thead><tbody>{events.map((event) => <tr key={event.join('-')}><td className="code-text">{event[0]} UTC</td><td>{event[1]}</td><td><Badge tone={event[2].includes('phê') ? 'approved' : 'manager'}>{event[2]}</Badge></td><td>{event[3]}</td><td>{event[4]}</td></tr>)}</tbody></table></div><footer className="ledger-footer"><span>● Tất cả hash đã xác minh</span><span>Retention: 7 năm</span></footer></Panel></>
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

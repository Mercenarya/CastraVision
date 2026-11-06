import { useState } from 'react'

const CHANNELS = ['Meta', 'Google Ads', 'TikTok']

export default function MemberContentStudio({ result, profile, setPage, notify }) {
  const [channels, setChannels] = useState(CHANNELS)
  const [tone, setTone] = useState('Friendly and clear')
  const [drafts, setDrafts] = useState({})
  const strategy = result?.strategy
  const isExample = !strategy
  const business = profile?.business_name || 'Your business'
  const messages = {
    Meta: `${strategy?.message || 'Add a clear benefit for your audience.'} Learn more today.`,
    'Google Ads': `${profile?.product_service || business}: discover a solution for ${profile?.target_customers || 'your audience'}.`,
    TikTok: `Open with a relatable moment for ${profile?.target_customers || 'your audience'}, then show the benefit.`,
  }
  function toggle(channel) {
    setChannels((current) => current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel])
  }
  async function copy(value) {
    try {
      await navigator.clipboard.writeText(value)
      notify('Draft copied to clipboard.')
    } catch {
      notify('Clipboard access is unavailable in this browser.')
    }
  }

  return <div className="member-page member-content-studio">
    <header className="member-import-view__header member-content-studio__header"><div><div className="member-import-view__crumb">Member Workspace <span>›</span> Content Gen <span>›</span> {business}</div><span className="member-eyebrow">Content Studio · Draft workspace</span><h1>Content Generation</h1><p>Shape channel-ready copy from strategy context and business details. All edits stay in this page until copied.</p></div><span className="member-status">{isExample ? 'Strategy not generated' : 'Local drafts'}</span></header>
    <section className="member-content-studio__brief"><div><span className="member-eyebrow">Creative brief</span><h2>{business}</h2><p>{strategy?.segment || profile?.target_customers || 'Audience details will appear when available.'}</p></div><dl><div><dt>Campaign objective</dt><dd>{profile?.primary_goal || 'Not configured'}</dd></div><div><dt>Strategy message</dt><dd>{strategy?.message || 'No strategy message available'}</dd></div></dl></section>
    {isExample && <div className="member-unavailable" role="note"><span aria-hidden="true">ⓘ</span><div><strong>Illustrative drafts · not AI-generated</strong><p>No strategy response is available. These editable starting-point examples are derived only from profile text and are not generated recommendations, saved content, or account records.</p><button type="button" className="member-button member-button--secondary" onClick={() => setPage('strategy')}>Open Strategy Studio</button></div></div>}
    <div className="member-content-studio__layout">
      <aside className="member-panel member-content-studio__controls"><span className="member-eyebrow">Draft settings</span><h2>Channel &amp; voice</h2><label>Voice<select value={tone} onChange={(event) => setTone(event.target.value)}><option>Friendly and clear</option><option>Confident and direct</option><option>Professional and informative</option></select></label><fieldset><legend>Target channels</legend>{CHANNELS.map((channel) => <label key={channel}><input type="checkbox" checked={channels.includes(channel)} onChange={() => toggle(channel)} />{channel}</label>)}</fieldset><div className="member-content-studio__context"><span className="member-eyebrow">Available context</span><dl className="member-definition-list"><div><dt>Business</dt><dd>{business}</dd></div><div><dt>Audience</dt><dd>{strategy?.segment || profile?.target_customers || 'Not specified'}</dd></div><div><dt>Recommended channel</dt><dd>{strategy?.recommended_channel || strategy?.budget_allocation?.[0]?.channel || 'Not returned'}</dd></div></dl></div><div className="member-unavailable" role="note"><strong>Draft-only workflow</strong><p>There is no save, AI generation, submission, or publishing action connected here.</p></div></aside>
      <section className="member-content-studio__editor"><div className="member-panel__header"><div><span className="member-eyebrow">Creative direction</span><h2>Channel drafts</h2></div><span className="member-status">{channels.length} selected</span></div>{channels.length === 0 ? <div className="member-panel member-content-studio__empty"><h3>No channels selected</h3><p>Select one or more channels to view a draft area.</p></div> : channels.map((channel) => <article className="member-panel member-content-studio__draft" key={channel}><div className="member-panel__header"><div><span className="member-eyebrow">{channel} · {isExample ? 'Illustrative draft' : 'Local draft'}</span><h3>{business} — {tone}</h3></div><span className="member-content-studio__draft-mark" aria-hidden="true">{channel === 'TikTok' ? '♪' : channel === 'Google Ads' ? 'G' : '∞'}</span></div>{isExample && <p className="member-strategy-example-label">Example starter copy · not generated content</p>}<label>Primary message<textarea rows="5" value={drafts[channel] ?? messages[channel]} onChange={(event) => setDrafts((current) => ({ ...current, [channel]: event.target.value }))} maxLength={500} /></label><div className="member-content-studio__draft-footer"><small>{(drafts[channel] ?? messages[channel]).length}/500 characters · Review before use</small><button type="button" className="member-button" onClick={() => copy(`${business}\n${drafts[channel] ?? messages[channel]}`)}>Copy draft</button></div></article>)}</section>
    </div>
  </div>
}

import ContentSafetyCheck from '../../components/ContentSafetyCheck'
import { useLanguage } from '@/hooks/useLanguage'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import WorkflowPanel from '../components/WorkflowPanel'
import WorkflowCampaignSelect from '../components/WorkflowCampaignSelect'
import { useWorkflowAction, useWorkflowQuery } from '../../hooks/useLeaderWorkflow'
import { workflow } from '../../services/leaderWorkflow'

const field = 'w-full rounded-lg border border-border bg-background p-3'

export default function WorkflowComposer({ kind, onCreated, revision, context }) {
  const { t } = useLanguage()
  const [campaignId, setCampaignId] = useState('')
  const [title, setTitle] = useState('')
  const [audience, setAudience] = useState('')
  const [strategyId, setStrategyId] = useState('')
  const strategies = useWorkflowQuery('proposals', { kind: 'strategy', status: 'approved', limit: 100 }, revision)
  const [requestId, setRequestId] = useState(() => crypto.randomUUID())
  const [payload, setPayload] = useState({ hook: '', headline: '', body: '', cta: '', channel: 'Meta', source: 'manual' })
  const action = useWorkflowAction()
  async function useStrategy() {
    const result = await action.run(() => workflow('proposal', { id: strategyId }))
    if (!result) return
    const strategy = result.payload.strategy
    setCampaignId(result.campaign_id)
    setTitle(t('employeeFlow.templateTitle', {title: result.title}).slice(0, 120))
    setPayload({ hook: strategy.message.slice(0, 500), headline: strategy.message.slice(0, 60), body: strategy.rationale.slice(0, 4000), cta: t('employeeFlow.defaultCta'), channel: 'Meta', source: 'template', strategyId })
    setRequestId(crypto.randomUUID())
  }
  function change(setter, value) { setter(value); setRequestId(crypto.randomUUID()); action.clearError() }
  async function submit(event) {
    event.preventDefault()
    const result = await action.run(() => kind === 'strategy'
      ? workflow('generate', { campaignId, objective: title, audience, requestId })
      : workflow('submit', { campaignId, kind: 'ad_content', title, payload, requestId, submit: false }))
    if (result) onCreated(result.id)
  }
  return <div className="p-6"><WorkflowPanel title={kind === 'strategy' ? t('employeeFlow.strategyStudio') : t('employeeFlow.contentStudio')} action={action}>
    <p className="text-muted-foreground">{kind === 'strategy' ? t('employeeFlow.strategyDescription') : t('employeeFlow.contentDescription')}</p>
    {kind === 'content' && <div className="space-y-3 rounded-lg border border-border p-3"><label className="block">{t('employeeFlow.approvedStrategy')}<select className={field} value={strategyId} onChange={e => setStrategyId(e.target.value)}><option value="">{t('employeeFlow.chooseStrategy')}</option>{strategies.data?.items.map(s => <option value={s.id} key={s.id}>{s.title} · {s.campaign_name}</option>)}</select></label>{strategies.error && <p role="alert">{strategies.error}</p>}<Button variant="outline" disabled={!strategyId || action.busy} onClick={useStrategy}>{t('employeeFlow.useTemplate')}</Button><p className="text-xs text-muted-foreground">{t('employeeFlow.templateNotice')}</p></div>}
    <form className="space-y-4" onSubmit={submit}>
      <WorkflowCampaignSelect value={campaignId} onChange={v => change(setCampaignId, v)} revision={revision} />
      <label className="block">{kind === 'strategy' ? t('employeeFlow.strategyObjective') : t('employeeFlow.proposalTitle')}<input required minLength={3} maxLength={120} className={field} value={title} onChange={e => change(setTitle, e.target.value)} /></label>
      {kind === 'strategy' ? <label className="block">{t('employeeFlow.audience')}<textarea required maxLength={2000} className={field} value={audience} onChange={e => change(setAudience, e.target.value)} /></label> : <>
        <label className="block">{t('employeeFlow.channels')}<select className={field} value={payload.channel} onChange={e => change(setPayload, { ...payload, channel: e.target.value })}>{['Meta', 'Google Ads', 'TikTok'].map(x => <option key={x}>{x}</option>)}</select></label>
        {[['hook', t('employeeFlow.hook'), 500], ['headline', t('employeeFlow.headline'), 60], ['body', t('employeeFlow.body'), 4000], ['cta', t('employeeFlow.cta'), 80]].map(([key, label, max]) => <label className="block" key={key}>{label}<textarea required minLength={key === 'hook' ? 10 : 1} maxLength={max} className={field} value={payload[key]} onChange={e => change(setPayload, { ...payload, [key]: e.target.value })} /><span className="text-xs text-muted-foreground">{payload[key].length}/{max}</span></label>)}
        <Button type="button" variant="outline" disabled={action.busy} onClick={() => action.run(async () => { await navigator.clipboard.writeText([payload.hook, payload.headline, payload.body, payload.cta].join('\n')); return true })}>{t('employeeFlow.copyContent')}</Button>
      </>}
      {kind === 'content' && context && <ContentSafetyCheck scopeKey={context.actor.id + ':' + context.workspace.id} fields={{ hook: payload.hook, headline: payload.headline, body: payload.body, cta: payload.cta }} />}
      <div><Button disabled={action.busy || !campaignId}>{action.busy ? t('employeeFlow.processing') : kind === 'strategy' ? t('employeeFlow.generateStrategy') : t('employeeFlow.saveDraft')}</Button></div>
    </form>
  </WorkflowPanel></div>
}

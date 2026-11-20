import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/hooks/useLanguage'
import { useBrandSafetyRules } from '../hooks/useBrandSafetyRules'
import { brandSafetyError, saveBrandRules } from '../services/brandSafety'

function RuleEditor({ config, onSaved }) {
  const { t } = useLanguage()
  const [banned, setBanned] = useState(config.rules.bannedTerms.join('\n'))
  const [required, setRequired] = useState(config.rules.requiredTerms.join('\n'))
  const [claims, setClaims] = useState(config.rules.warnAbsoluteClaims)
  const [personal, setPersonal] = useState(config.rules.warnPersonalData)
  const [state, setState] = useState({ busy: false, error: null })
  const request = useRef(null)
  useEffect(() => () => { clearTimeout(request.current?.timer); request.current?.abort() }, [])
  async function submit(event) {
    event.preventDefault()
    if (request.current) return
    const controller = new AbortController()
    request.current = controller
    setState({ busy: true, error: null })
    controller.timer = setTimeout(() => { controller.abort(); setState({ busy: false, error: { code: 'TIMEOUT' } }); if (request.current === controller) request.current = null }, 30000)
    try {
      const terms = value => value.split(/\r?\n/).map(term => term.trim()).filter(Boolean)
      const saved = await saveBrandRules({ schemaVersion: 1, bannedTerms: terms(banned), requiredTerms: terms(required), warnAbsoluteClaims: claims, warnPersonalData: personal }, config.version, controller.signal)
      if (!controller.signal.aborted) onSaved(saved)
    } catch (error) { if (!controller.signal.aborted) setState({ busy: false, error }) }
    finally { clearTimeout(controller.timer); if (!controller.signal.aborted) setState(current => ({ ...current, busy: false })); if (request.current === controller) request.current = null }
  }
  return <form onSubmit={submit} className="space-y-4"><p>{t('brandSafety.termHelp')}</p>
    <label className="block">{t('brandSafety.bannedTerms')}<textarea className="block w-full rounded border border-border bg-background p-3" disabled={state.busy} maxLength={4050} value={banned} onChange={event => setBanned(event.target.value)} /></label>
    <label className="block">{t('brandSafety.requiredTerms')}<textarea className="block w-full rounded border border-border bg-background p-3" disabled={state.busy} maxLength={4050} value={required} onChange={event => setRequired(event.target.value)} /></label>
    <label className="flex gap-2"><input type="checkbox" disabled={state.busy} checked={claims} onChange={event => setClaims(event.target.checked)} />{t('brandSafety.claims')}</label>
    <label className="flex gap-2"><input type="checkbox" disabled={state.busy} checked={personal} onChange={event => setPersonal(event.target.checked)} />{t('brandSafety.personal')}</label>
    {state.error && <p role="alert">{brandSafetyError(state.error, t)}</p>}<Button disabled={state.busy}>{t(state.busy ? 'common.saving' : 'brandSafety.saveRules')}</Button>
  </form>
}

export default function BrandSafetyRules({ scopeKey, allowEdit = false }) {
  const { t, language } = useLanguage()
  const query = useBrandSafetyRules(scopeKey)
  const [saved, setSaved] = useState(null)
  return <section className="space-y-4 rounded-xl border border-border bg-card p-5 text-card-foreground"><h2 className="text-lg font-semibold">{t('brandSafety.rulesTitle')}</h2><p>{t('brandSafety.disclaimer')}</p>
    {!scopeKey && <p>{t('brandSafety.noScope')}</p>}{query.loading && <p role="status">{t('employeeFlow.loading')}</p>}
    {query.error && <p role="alert">{brandSafetyError(query.error, t)}</p>}{scopeKey && <Button variant="outline" onClick={() => { setSaved(null); query.reload() }}>{t('employeeFlow.reload')}</Button>}
    {saved?.scope === scopeKey && <p role="status">{t('brandSafety.saved')}</p>}
    {query.data && <><p>{t('brandSafety.provider')}: internal_rules · {query.data.engineVersion}</p><p>{t('brandSafety.ruleRevision')}: {new Date(query.data.version).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}</p>
      {allowEdit && query.data.canEdit ? <RuleEditor key={`${scopeKey}:${query.data.version}`} config={query.data} onSaved={() => { setSaved({ scope: scopeKey }); query.reload() }} /> : <><p>{t('brandSafety.readOnly')}</p><p>{t('brandSafety.bannedTerms')}: {query.data.rules.bannedTerms.join(' · ') || t('brandSafety.none')}</p><p>{t('brandSafety.requiredTerms')}: {query.data.rules.requiredTerms.join(' · ') || t('brandSafety.none')}</p><p>{t('brandSafety.claims')}: {t(query.data.rules.warnAbsoluteClaims ? 'brandSafety.enabled' : 'brandSafety.disabled')}</p><p>{t('brandSafety.personal')}: {t(query.data.rules.warnPersonalData ? 'brandSafety.enabled' : 'brandSafety.disabled')}</p></>}
    </>}
  </section>
}

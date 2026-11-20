import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/hooks/useLanguage'
import { useBrandSafetyRules } from '../hooks/useBrandSafetyRules'
import { brandSafetyError, checkBrandContent } from '../services/brandSafety'

export default function ContentSafetyCheck({ fields, scopeKey }) {
  const { t } = useLanguage()
  const query = useBrandSafetyRules(scopeKey)
  const input = JSON.stringify(fields)
  const key = `${scopeKey}:${query.data?.version}:${input}`
  const [state, setState] = useState(null)
  const request = useRef(null)
  useEffect(() => () => { clearTimeout(request.current?.timer); request.current?.abort() }, [key])
  async function run() {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setState({ key, busy: true })
    controller.timer = setTimeout(() => { controller.abort(); setState({ key, busy: false, error: { code: 'TIMEOUT' } }) }, 30000)
    try {
      const result = await checkBrandContent(fields, query.data.version, controller.signal)
      if (!controller.signal.aborted) setState({ key, busy: false, result })
    } catch (error) { if (!controller.signal.aborted) setState({ key, busy: false, error }) }
    finally { clearTimeout(controller.timer) }
  }
  const current = state?.key === key ? state : null
  return <section className="space-y-3 rounded-lg border border-border bg-card p-4"><h3 className="font-semibold">{t('brandSafety.checkTitle')}</h3><p className="text-sm text-muted-foreground">{t('brandSafety.disclaimer')}</p>
    {query.loading && <p role="status">{t('employeeFlow.loading')}</p>}{query.error && <p role="alert">{brandSafetyError(query.error, t)}</p>}
    <div className="flex flex-wrap gap-3"><Button type="button" variant="outline" disabled={!query.data || current?.busy || !Object.values(fields).some(value => value.trim())} onClick={run}>{t(current?.busy ? 'brandSafety.checking' : 'brandSafety.check')}</Button><Button type="button" variant="outline" onClick={query.reload}>{t('brandSafety.reloadRules')}</Button></div>
    {current?.error && <p role="alert">{brandSafetyError(current.error, t)}</p>}
    {current?.result && <div role="status" className="space-y-2"><p>{t('brandSafety.provider')}: {current.result.provider} · {current.result.engineVersion}</p><p>{t('brandSafety.ruleRevision')}: {current.result.rulesVersion}</p><p>{t(current.result.status === 'needs_review' ? 'brandSafety.needsReview' : 'brandSafety.noFindings')}</p><ul className="space-y-2">{current.result.findings.map((item, index) => <li key={`${item.field}:${item.code}:${index}`} className="rounded border border-warning/40 bg-warning/10 p-2">{t('brandSafety.fields.' + item.field)}: {t('brandSafety.findings.' + item.code)}{item.termIndex !== undefined && <span> ({t('brandSafety.termNumber', { number: item.termIndex + 1 })})</span>}</li>)}</ul></div>}
    {state && !current && <p>{t('brandSafety.outdated')}</p>}
  </section>
}

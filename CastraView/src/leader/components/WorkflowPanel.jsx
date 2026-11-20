import { useLanguage } from '@/hooks/useLanguage'
import { Button } from '@/components/ui/button'

export default function WorkflowPanel({ title, subtitle, children, query, action }) {
  const { t } = useLanguage()
  return <section className="space-y-5 rounded-xl border border-border bg-card p-5 text-card-foreground">
    {title && <div><h2 className="text-lg font-bold">{title}</h2>{subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}</div>}
    {query?.loading && <p role="status">{t('employeeFlow.loading')}</p>}
    {(query?.error || action?.error) && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      {query?.error || action?.error}
      {query?.error && <Button variant="outline" className="ml-3" onClick={query.reload}>{t('employeeFlow.retry')}</Button>}
    </div>}
    {!query?.loading && !query?.error && children}
  </section>
}

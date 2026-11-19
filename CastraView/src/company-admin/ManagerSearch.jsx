import { useCallback, useEffect, useState } from 'react'
import { searchManager } from '../services/marketingManager'
import { useManagerQuery } from '../hooks/useManagerQuery'
import { Button } from '@/components/ui/button'

function Results({ query, workspaceId, onSelect }) {
  const load = useCallback(signal => searchManager(query, signal), [query])
  const result = useManagerQuery(`${workspaceId}:${query}`, load)
  return <div className="space-y-2" aria-live="polite">{result.loading ? <p>Đang tìm…</p> : result.error ? <><p role="alert">{result.error}</p><Button onClick={result.reload}>Thử lại</Button></> : result.data?.length ? result.data.map(item => <Button key={`${item.type}:${item.id}`} variant="ghost" className="block w-full text-left" onClick={() => onSelect(item)}>{item.type === 'campaign' ? 'Chiến dịch' : 'Đề xuất'}: {item.label}</Button>) : <p>Không tìm thấy kết quả.</p>}</div>
}
export default function ManagerSearch({ query, workspaceId, onSelect }) {
  const [settled, setSettled] = useState('')
  useEffect(() => { const timer = setTimeout(() => setSettled(query.trim()), 300); return () => clearTimeout(timer) }, [query])
  if (!query.trim()) return null
  return <section aria-label="Kết quả tìm kiếm" className="rounded-xl border border-border bg-card p-4">{settled !== query.trim() ? <p>Đang tìm…</p> : <Results key={`${workspaceId}:${settled}`} query={settled} workspaceId={workspaceId} onSelect={onSelect} />}</section>
}

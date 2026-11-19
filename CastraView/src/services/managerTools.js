import { api } from './api'
export const reportHistory = (offset, signal) => api(`manager/reports/?offset=${offset}`, { signal })
export const createReport = (data, signal) => api('manager/reports/', { method: 'POST', body: JSON.stringify(data), signal })
export const getReportFile = (id, signal) => api(`manager/reports/${encodeURIComponent(id)}/`, { signal })
export const listCompetitors = (offset, signal) => api(`manager/competitors/?offset=${offset}`, { signal })
export const addCompetitor = keyword => api('manager/competitors/', { method: 'POST', body: JSON.stringify({ keyword }) })
export function downloadReport(result) {
  const content = Uint8Array.from(atob(result.contentBase64), char => char.charCodeAt(0))
  const blob = new Blob([content], { type: result.format === 'pdf' ? 'application/pdf' : 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = result.filename
  document.body.appendChild(link); link.click(); link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

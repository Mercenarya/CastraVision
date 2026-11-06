import { importHistoryReference, importValidationReference } from '../memberImportReference'

export default function MemberImportView({ imports = [], file, preview, busy, error, input, onSelect, onDrop, onRemove, onCommit, onDownload }) {
  const examples = imports.length === 0
  const history = examples
    ? importHistoryReference
    : imports.map((item) => ({
      filename: item.filename,
      source: 'Imported workspace data',
      rows: item.row_count,
      campaign: item.campaign_name || 'Campaign not specified',
      importedBy: 'Workspace account',
      date: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Date unavailable',
      status: 'Imported',
      isExample: false,
    }))

  return (
    <div className="member-page member-import-view">
      <header className="member-import-view__header">
        <div>
          <div className="member-import-view__crumb">Member Workspace <span>›</span> Campaign Import <span>›</span> {imports[0]?.campaign_name || 'Workspace'}</div>
          <span className="member-eyebrow">Campaign data · Ingestion workflow</span>
          <h1>Campaign Data Import</h1>
          <p>Import external campaign telemetry and historical datasets to fuel Strategy Studio recommendations.</p>
        </div>
        <div className="member-import-view__header-actions">
          <span className="member-import-view__formats">CSV · XLSX · 5 MB maximum</span>
          <button type="button" className="member-button" onClick={onDownload}>⇩ Schema Template</button>
        </div>
      </header>

      <div className="member-import-view__workspace">
        <section className="member-import-view__upload-column" aria-label="Upload campaign data">
          <div className={`member-panel member-import-view__dropzone ${file ? 'is-staged' : ''}`} onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
            <span className="member-import-view__upload-icon" aria-hidden="true">⇧</span>
            <h2>Drag and drop your campaign dataset here, or <button type="button" onClick={() => input.current?.click()} disabled={busy}>Browse Files</button></h2>
            <p>Optimized for Meta Ads Export, Google Ads Report, TikTok Ads Manager CSV, or custom multi-touch CSV/XLSX files.</p>
            <div className="member-import-view__filetypes"><span>.CSV</span><span>.XLSX</span><small>JSON mapping example only · CSV/XLSX upload · 5 MB maximum</small></div>
            <input ref={input} type="file" accept=".csv,.xlsx" aria-label="Upload campaign dataset" onChange={(event) => onSelect(event.target.files?.[0])} />
          </div>
          <div className="member-panel member-import-view__note"><span aria-hidden="true">ⓘ</span><p>Files are validated before import. Only a successful response from the workspace service adds records to history.</p><span className="member-import-view__etl">ETL · service-managed</span></div>
          {error && <div className="member-unavailable" role="alert"><strong>Import could not be completed</strong><p>{error}</p></div>}
          {file && <div className="member-panel member-import-view__selected"><div><span className="member-eyebrow">Selected file</span><strong title={file.name}>{file.name}</strong><small>{(file.size / 1024 / 1024).toFixed(2)} MB · {busy ? 'Validating…' : preview ? 'Validation response received' : 'Awaiting validation'}</small></div><button type="button" className="member-button" onClick={onRemove} disabled={busy}>Remove</button></div>}
        </section>

        <section className="member-panel member-import-view__validation" aria-label="Staged dataset validation">
          <div className="member-panel__header"><div><span className="member-eyebrow">Staged dataset validation</span><h2>Validation overview</h2></div><span className={`member-status ${preview && !preview.error_count ? 'member-status--success' : ''}`}>{busy ? 'Validating' : preview ? (preview.error_count ? 'Needs attention' : 'Validated response') : 'Awaiting file'}</span></div>
          {preview ? <>
            <div className="member-import-view__validation-summary"><div><strong>{preview.row_count ?? 0}</strong><span>Rows reported</span></div><div><strong>{preview.error_count ?? 0}</strong><span>Schema errors</span></div></div>
            <div className="member-import-view__mapping"><div className="member-eyebrow">Fields returned by service</div>{(preview.preview?.[0] ? Object.keys(preview.preview[0]) : []).map((field) => <div key={field}><span>source: {field}</span><b>↳ {field}</b></div>)}</div>
            {preview.errors?.length > 0 && <div className="member-import-view__errors"><strong>Rows requiring attention</strong>{preview.errors.map((item) => <p key={item.row}>Row {item.row}: {item.message}</p>)}</div>}
            <div className="member-import-view__preview">{preview.preview?.length ? <div className="table-wrap"><table><thead><tr>{Object.keys(preview.preview[0]).map((field) => <th key={field}>{field}</th>)}</tr></thead><tbody>{preview.preview.slice(0, 5).map((row, index) => <tr key={`${file?.name}-${index}`}>{Object.values(row).map((value, cell) => <td key={cell}>{String(value)}</td>)}</tr>)}</tbody></table></div> : <p>The service returned no row preview.</p>}</div>
            <button type="button" className="member-button member-button--primary member-import-view__commit" onClick={onCommit} disabled={busy || preview.error_count > 0 || preview.row_count === 0}>⇧ Confirm Import &amp; Ingest Dataset</button>
          </> : <>
            <div className="member-import-view__awaiting"><span aria-hidden="true">◈</span><strong>No dataset staged</strong><p>Select a file to request validation. No sample data is submitted or treated as a real import.</p></div>
            <div className="member-import-view__sample" aria-label="Illustrative validation example"><header><div><span className="member-eyebrow">Illustrative preview · not staged</span><strong>{importValidationReference.label}</strong></div><span>EXAMPLE</span></header><div className="member-import-view__sample-file"><span aria-hidden="true">▤</span><div><strong>{importValidationReference.filename}</strong><small>{importValidationReference.size} · CSV example</small></div></div><div className="member-import-view__sample-summary"><div><strong>{importValidationReference.rowCount.toLocaleString()}</strong><span>Example rows</span></div><div><strong>{importValidationReference.errorCount}</strong><span>Example schema errors</span></div></div><div className="member-import-view__mapping"><div className="member-eyebrow">Example field mapping · 4/4</div>{importValidationReference.mappings.map(([source, target]) => <div key={source}><span>source: {source}</span><b>↳ {target}</b></div>)}</div><p className="member-import-view__sample-warning">Preview only. This file is not present, validated, or queued for import.</p></div>
          </>}
        </section>
      </div>

      <section className="member-import-view__history">
        <header><div><span className="member-eyebrow">{examples ? 'Illustrative history examples' : 'Workspace records'}</span><h2>Imported Datasets History</h2><p>{examples ? 'Stitch-style sample records for layout reference only. These are not account imports.' : 'Real import records returned by your workspace.'}</p></div><span className="member-status">{history.length} {examples ? 'Examples' : 'Records'}</span></header>
        <div className="member-import-view__table-wrap"><table><thead><tr><th>Dataset &amp; File</th><th>Campaign</th><th>Records</th><th>Ingestion by</th><th>Status</th><th>Actions</th></tr></thead><tbody>{history.map((item) => <tr key={item.filename}><td><strong>{item.filename}</strong><small>{item.source}{item.isExample ? ' · example only' : ''}</small></td><td>{item.campaign}{item.isExample ? ' · example' : ''}</td><td>{Number(item.rows || 0).toLocaleString()} rows</td><td>{item.importedBy}<small>{item.date}</small></td><td><span className="member-status">{item.status}</span></td><td><button type="button" className="member-import-view__unsupported" disabled title="This action is not connected">Launch Studio · unavailable</button></td></tr>)}</tbody></table></div>
        <footer className="member-import-view__history-footer"><span>{examples ? `Showing ${history.length} of ${history.length} illustrative examples · not account data` : `Showing ${history.length} workspace import records`}</span><span>History is read-only in this view</span></footer>
      </section>
    </div>
  )
}

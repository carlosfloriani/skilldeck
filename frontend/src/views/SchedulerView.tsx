import { useState, useEffect, useCallback } from 'react'
import { SchedulerJob, JobHistoryRecord } from '../types'
import CreateJobModal from '../components/CreateJobModal'

function cronToHuman(cron: string): string {
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) return cron

  const [min, hour, dom, mon, dow] = parts

  if (cron === '*/5 * * * *') return 'Every 5 minutes'
  if (cron === '*/10 * * * *') return 'Every 10 minutes'
  if (cron === '*/15 * * * *') return 'Every 15 minutes'
  if (cron === '*/30 * * * *') return 'Every 30 minutes'
  if (cron === '0 * * * *') return 'Every hour'
  if (cron === '0 0 * * *') return 'Every day at midnight'
  if (min !== '*' && hour !== '*' && dom === '*' && mon === '*' && dow === '*') {
    return `Every day at ${hour.padStart(2, '0')}:${min.padStart(2, '0')}`
  }
  if (min !== '*' && hour !== '*' && dow !== '*') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return `Every ${days[Number(dow)] || dow} at ${hour.padStart(2, '0')}:${min.padStart(2, '0')}`
  }
  return cron
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

const CRON_PRESETS: { label: string; cron: string }[] = [
  { label: 'Every 5 min', cron: '*/5 * * * *' },
  { label: 'Every hour', cron: '0 * * * *' },
  { label: 'Daily midnight', cron: '0 0 * * *' },
  { label: 'Daily 9 AM', cron: '0 9 * * *' },
  { label: 'Weekly Mon 9 AM', cron: '0 9 * * 1' },
]

function StatusDot({ job }: { job: SchedulerJob }) {
  if (job.last_status === 'running') {
    return (
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: '#22c55e', display: 'inline-block', flexShrink: 0,
        boxShadow: '0 0 0 2px rgba(34,197,94,0.3)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }} />
    )
  }
  if (!job.enabled) {
    return <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#d4d4d4', display: 'inline-block', flexShrink: 0 }} />
  }
  if (job.last_status === 'error') {
    return <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', flexShrink: 0 }} />
  }
  if (job.last_status === 'success') {
    return <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }} />
  }
  // Enabled but never run
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308', display: 'inline-block', flexShrink: 0 }} />
}

function StatusBadge({ status }: { status: string }) {
  const isSuccess = status === 'success'
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
      background: isSuccess ? '#f0fdf4' : '#fef2f2',
      color: isSuccess ? '#16a34a' : '#dc2626',
      border: `1px solid ${isSuccess ? '#bbf7d0' : '#fecaca'}`,
    }}>
      {status}
    </span>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#aaa', fontSize: 13,
    }}>
      {label}
    </div>
  )
}

// ---------- Job Detail ----------

interface JobDetailProps {
  job: SchedulerJob;
  onUpdate: () => void;
  onDelete: () => void;
}

function JobDetail({ job, onUpdate, onDelete }: JobDetailProps) {
  const [cron, setCron] = useState(job.cron)
  const [command, setCommand] = useState(job.command)
  const [history, setHistory] = useState<JobHistoryRecord[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [running, setRunning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const dirty = cron !== job.cron || command !== job.command

  useEffect(() => {
    setCron(job.cron)
    setCommand(job.command)
    setExpandedRow(null)
    setConfirmDelete(false)
  }, [job.id, job.cron, job.command])

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/scheduler/jobs/${job.id}/history`)
      if (res.ok) {
        const data = await res.json()
        setHistory(data)
      }
    } catch { /* ignore */ }
    setLoadingHistory(false)
  }, [job.id])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const handleToggleEnabled = async () => {
    await fetch(`/api/scheduler/jobs/${job.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !job.enabled }),
    })
    onUpdate()
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/scheduler/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cron, command }),
      })
      onUpdate()
    } catch { /* ignore */ }
    setSaving(false)
  }

  const handleRunNow = async () => {
    setRunning(true)
    try {
      await fetch(`/api/scheduler/jobs/${job.id}/run`, { method: 'POST' })
      onUpdate()
      // Refresh history after a short delay to capture the run
      setTimeout(fetchHistory, 1500)
    } catch { /* ignore */ }
    setRunning(false)
  }

  const handleDelete = async () => {
    await fetch(`/api/scheduler/jobs/${job.id}`, { method: 'DELETE' })
    onDelete()
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid #e5e5e5',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <StatusDot job={job} />
          <span style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>{job.name}</span>
          <span style={{ fontSize: 11, color: '#888', fontFamily: '"SF Mono", monospace' }}>
            {cronToHuman(job.cron)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={handleToggleEnabled}
            style={{
              padding: '5px 12px', border: '1px solid #ddd', borderRadius: 6,
              background: job.enabled ? '#f0fdf4' : '#fff', cursor: 'pointer',
              fontSize: 12, color: job.enabled ? '#16a34a' : '#999',
              fontWeight: 500,
            }}
          >
            {job.enabled ? 'Enabled' : 'Disabled'}
          </button>
          <button
            onClick={handleRunNow}
            disabled={running}
            style={{
              padding: '5px 12px', border: 'none', borderRadius: 6,
              background: running ? '#93c5fd' : '#1d4ed8', color: '#fff',
              cursor: running ? 'wait' : 'pointer', fontSize: 12, fontWeight: 500,
            }}
          >
            {running ? 'Running\u2026' : 'Run Now'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#fafafa' }}>
        <div style={{ padding: 20 }}>
          {/* Cron */}
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 8 }}>
              Schedule (cron)
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {CRON_PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => setCron(p.cron)}
                  style={{
                    padding: '4px 10px', border: `1px solid ${cron === p.cron ? '#1d4ed8' : '#ddd'}`,
                    borderRadius: 6, background: cron === p.cron ? '#eff6ff' : '#fff',
                    cursor: 'pointer', fontSize: 12, color: cron === p.cron ? '#1d4ed8' : '#555',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <input
              value={cron}
              onChange={e => setCron(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', border: '1px solid #ddd',
                borderRadius: 6, fontSize: 14, fontFamily: '"SF Mono", monospace',
                boxSizing: 'border-box', outline: 'none', background: '#fff',
              }}
            />
            {cron && (
              <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                {cronToHuman(cron)}
              </div>
            )}
          </div>

          {/* Command */}
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>
              Command
            </span>
            <textarea
              value={command}
              onChange={e => setCommand(e.target.value)}
              rows={4}
              style={{
                width: '100%', padding: '8px 12px', border: '1px solid #ddd',
                borderRadius: 6, fontSize: 13, fontFamily: '"SF Mono", monospace',
                resize: 'vertical', boxSizing: 'border-box', outline: 'none',
                background: '#fff',
              }}
            />
          </div>

          {/* Save / Delete row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {dirty && (
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '6px 14px', border: 'none', borderRadius: 6,
                  background: saving ? '#93c5fd' : '#1d4ed8', color: '#fff',
                  cursor: saving ? 'wait' : 'pointer', fontSize: 12, fontWeight: 500,
                }}
              >
                {saving ? 'Saving\u2026' : 'Save Changes'}
              </button>
            )}
            {dirty && (
              <button
                onClick={() => { setCron(job.cron); setCommand(job.command) }}
                style={{
                  padding: '6px 14px', border: '1px solid #ddd', borderRadius: 6,
                  background: '#fff', cursor: 'pointer', fontSize: 12, color: '#555',
                }}
              >
                Discard
              </button>
            )}
            <div style={{ flex: 1 }} />
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                style={{
                  padding: '6px 14px', border: '1px solid #fecaca', borderRadius: 6,
                  background: '#fff', cursor: 'pointer', fontSize: 12, color: '#ef4444',
                }}
              >
                Delete Job
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#ef4444' }}>Confirm?</span>
                <button
                  onClick={handleDelete}
                  style={{
                    padding: '6px 14px', border: 'none', borderRadius: 6,
                    background: '#ef4444', color: '#fff', cursor: 'pointer',
                    fontSize: 12, fontWeight: 500,
                  }}
                >
                  Yes, delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    padding: '6px 14px', border: '1px solid #ddd', borderRadius: 6,
                    background: '#fff', cursor: 'pointer', fontSize: 12,
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Info row */}
          <div style={{
            display: 'flex', gap: 24, marginBottom: 24, fontSize: 12, color: '#888',
          }}>
            <span>Created: {new Date(job.created_at).toLocaleDateString()}</span>
            {job.last_run && <span>Last run: {timeAgo(job.last_run)}</span>}
            {job.last_duration_ms != null && <span>Duration: {formatDuration(job.last_duration_ms)}</span>}
          </div>

          {/* Last output */}
          {job.last_output && (
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>
                Last Output
              </span>
              <pre style={{
                background: '#1e1e1e', color: '#d4d4d4', padding: '10px 14px',
                borderRadius: 6, fontSize: 11, fontFamily: '"SF Mono", monospace',
                overflow: 'auto', maxHeight: 120, margin: 0, whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}>
                {job.last_output}
              </pre>
            </div>
          )}

          {/* History */}
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 8,
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>
                Execution History
              </span>
              <button
                onClick={fetchHistory}
                disabled={loadingHistory}
                style={{
                  padding: '3px 10px', border: '1px solid #ddd', borderRadius: 6,
                  background: '#fff', cursor: 'pointer', fontSize: 11, color: '#555',
                }}
              >
                {loadingHistory ? 'Loading\u2026' : 'Refresh'}
              </button>
            </div>

            {history.length === 0 && !loadingHistory && (
              <div style={{ padding: 16, color: '#999', fontSize: 12, textAlign: 'center' }}>
                No executions yet
              </div>
            )}

            {history.length > 0 && (
              <div style={{
                border: '1px solid #e5e5e5', borderRadius: 8, overflow: 'hidden',
                background: '#fff',
              }}>
                {/* Table header */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 80px 80px 40px',
                  gap: 8, padding: '8px 14px',
                  borderBottom: '1px solid #e5e5e5', background: '#f9f9f9',
                  fontSize: 11, fontWeight: 600, color: '#888',
                }}>
                  <span>Timestamp</span>
                  <span>Status</span>
                  <span>Duration</span>
                  <span />
                </div>

                {history.map((record, i) => (
                  <div key={i}>
                    <div
                      onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                      style={{
                        display: 'grid', gridTemplateColumns: '1fr 80px 80px 40px',
                        gap: 8, padding: '8px 14px',
                        borderBottom: i < history.length - 1 || expandedRow === i ? '1px solid #f0f0f0' : 'none',
                        cursor: 'pointer', fontSize: 12,
                        background: expandedRow === i ? '#fafafa' : 'transparent',
                      }}
                    >
                      <span style={{ color: '#555' }}>
                        {new Date(record.timestamp).toLocaleString()}
                      </span>
                      <span><StatusBadge status={record.status} /></span>
                      <span style={{ color: '#888', fontFamily: '"SF Mono", monospace', fontSize: 11 }}>
                        {formatDuration(record.duration_ms)}
                      </span>
                      <span style={{ color: '#aaa', fontSize: 10, textAlign: 'center' }}>
                        {expandedRow === i ? '\u25B2' : '\u25BC'}
                      </span>
                    </div>

                    {expandedRow === i && (
                      <div style={{
                        padding: '8px 14px',
                        borderBottom: i < history.length - 1 ? '1px solid #f0f0f0' : 'none',
                        background: '#fafafa',
                      }}>
                        <pre style={{
                          background: '#1e1e1e', color: '#d4d4d4', padding: '8px 12px',
                          borderRadius: 6, fontSize: 11, fontFamily: '"SF Mono", monospace',
                          overflow: 'auto', maxHeight: 200, margin: 0,
                          whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                        }}>
                          {record.output || '(no output)'}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------- Main View ----------

export default function SchedulerView() {
  const [jobs, setJobs] = useState<SchedulerJob[]>([])
  const [selected, setSelected] = useState<SchedulerJob | null>(null)
  const [query, setQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/scheduler/jobs')
      if (!res.ok) throw new Error()
      const data: SchedulerJob[] = await res.json()
      setJobs(data)
      setSelected(prev => {
        if (!prev) return prev
        return data.find(j => j.id === prev.id) ?? prev
      })
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchJobs()
    const id = setInterval(fetchJobs, 3000)
    return () => clearInterval(id)
  }, [fetchJobs])

  const filtered = jobs.filter(j =>
    j.name.toLowerCase().includes(query.toLowerCase()) ||
    j.command.toLowerCase().includes(query.toLowerCase())
  )

  const handleCreate = (job: SchedulerJob) => {
    setJobs(prev => [...prev, job])
    setSelected(job)
  }

  const handleDelete = () => {
    setSelected(null)
    fetchJobs()
  }

  return (
    <>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left column - Job list */}
        <div style={{
          width: 300, borderRight: '1px solid #e5e5e5',
          display: 'flex', flexDirection: 'column',
          background: '#fff', flexShrink: 0,
        }}>
          {/* Header */}
          <div style={{
            padding: '10px 12px', borderBottom: '1px solid #e5e5e5',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <input
              type="search"
              placeholder="Search jobs\u2026"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                flex: 1, padding: '6px 10px', border: '1px solid #ddd',
                borderRadius: 6, fontSize: 13, outline: 'none',
                background: '#f9f9f9', boxSizing: 'border-box',
              }}
            />
            <button
              onClick={() => setShowCreate(true)}
              style={{
                padding: '6px 10px', border: 'none', borderRadius: 6,
                background: '#1d4ed8', color: '#fff', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
              }}
            >
              + New Job
            </button>
          </div>

          {/* Job list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <div style={{ padding: 16, color: '#999', fontSize: 12, textAlign: 'center' }}>
                {jobs.length === 0 ? 'No scheduled jobs' : 'No jobs found'}
              </div>
            )}
            {filtered.map(job => {
              const isSelected = selected?.id === job.id
              return (
                <button
                  key={job.id}
                  onClick={() => setSelected(job)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '10px 14px', border: 'none',
                    borderBottom: '1px solid #f0f0f0',
                    background: isSelected ? '#eff6ff' : 'transparent',
                    cursor: 'pointer', display: 'flex',
                    flexDirection: 'column', gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StatusDot job={job} />
                    <span style={{
                      fontWeight: 500, fontSize: 13,
                      color: isSelected ? '#1d4ed8' : '#111',
                      flex: 1, overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {job.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 16 }}>
                    <span style={{
                      fontSize: 11, color: '#888',
                      fontFamily: '"SF Mono", monospace',
                    }}>
                      {cronToHuman(job.cron)}
                    </span>
                    {job.last_run && (
                      <span style={{ fontSize: 10, color: '#bbb' }}>
                        {timeAgo(job.last_run)}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div style={{
            padding: '8px 14px', borderTop: '1px solid #e5e5e5',
            fontSize: 11, color: '#999',
          }}>
            {filtered.length} job{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Right column - Detail */}
        {selected ? (
          <JobDetail job={selected} onUpdate={fetchJobs} onDelete={handleDelete} />
        ) : (
          <Empty label="Select a job to view details" />
        )}
      </div>

      {showCreate && (
        <CreateJobModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </>
  )
}

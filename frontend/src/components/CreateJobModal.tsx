import { useState } from 'react'

interface Props {
  onClose: () => void;
  onCreate: (job: any) => void;
}

const PRESETS: { label: string; cron: string }[] = [
  { label: 'Every 5 min', cron: '*/5 * * * *' },
  { label: 'Every hour', cron: '0 * * * *' },
  { label: 'Daily midnight', cron: '0 0 * * *' },
  { label: 'Daily 9 AM', cron: '0 9 * * *' },
  { label: 'Weekly Mon 9 AM', cron: '0 9 * * 1' },
  { label: 'Custom', cron: '' },
]

function cronToHuman(cron: string): string {
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) return cron

  const [min, hour, dom, mon, dow] = parts

  if (cron === '*/5 * * * *') return 'Every 5 minutes'
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

export default function CreateJobModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState('')
  const [cron, setCron] = useState('0 * * * *')
  const [command, setCommand] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handlePreset = (preset: typeof PRESETS[0]) => {
    if (preset.cron) setCron(preset.cron)
  }

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Name is required'); return }
    if (!cron.trim()) { setError('Cron expression is required'); return }
    if (!command.trim()) { setError('Command is required'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/scheduler/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), cron: cron.trim(), command: command.trim(), enabled: true }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.detail || 'Failed to create job')
        return
      }
      const job = await res.json()
      onCreate(job)
      onClose()
    } catch {
      setError('Failed to create job')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 12, padding: 24, width: 480,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600 }}>New Scheduled Job</h2>

        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Name</span>
          <input
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            placeholder="Daily backup check"
            style={{
              width: '100%', padding: '8px 12px', border: '1px solid #ddd',
              borderRadius: 6, fontSize: 14, boxSizing: 'border-box', outline: 'none',
            }}
          />
        </label>

        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 8 }}>Schedule</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => handlePreset(p)}
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
            placeholder="* * * * *"
            style={{
              width: '100%', padding: '8px 12px', border: '1px solid #ddd',
              borderRadius: 6, fontSize: 14, fontFamily: '"SF Mono", monospace',
              boxSizing: 'border-box', outline: 'none',
            }}
          />
          {cron && <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{cronToHuman(cron)}</div>}
        </div>

        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Command</span>
          <textarea
            value={command}
            onChange={e => { setCommand(e.target.value); setError('') }}
            placeholder="claude -p 'Check backup status'"
            rows={3}
            style={{
              width: '100%', padding: '8px 12px', border: '1px solid #ddd',
              borderRadius: 6, fontSize: 13, fontFamily: '"SF Mono", monospace',
              resize: 'vertical', boxSizing: 'border-box', outline: 'none',
            }}
          />
        </label>

        {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '8px 16px', border: '1px solid #ddd', borderRadius: 6,
            background: '#fff', cursor: 'pointer', fontSize: 13,
          }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: '8px 16px', border: 'none', borderRadius: 6,
              background: submitting ? '#93c5fd' : '#1d4ed8',
              color: '#fff', cursor: submitting ? 'wait' : 'pointer', fontSize: 13, fontWeight: 500,
            }}
          >
            {submitting ? 'Creating\u2026' : 'Create Job'}
          </button>
        </div>
      </div>
    </div>
  )
}

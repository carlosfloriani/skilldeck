import { useState, useEffect } from 'react'

interface SettingsPanel {
  fileId: 'main' | 'local'
  label: string
  filename: string
}

const PANELS: SettingsPanel[] = [
  { fileId: 'main', label: 'Main Settings', filename: 'settings.json' },
  { fileId: 'local', label: 'Local Settings', filename: 'settings.local.json' },
]

function SettingsEditor({ fileId, label, filename }: SettingsPanel) {
  const [raw, setRaw] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/settings/${fileId}`)
      .then(r => {
        if (!r.ok) throw new Error('Not found')
        return r.json()
      })
      .then(data => {
        setRaw(JSON.stringify(data, null, 2))
      })
      .catch(() => {
        setRaw('{}')
      })
      .finally(() => setLoading(false))
  }, [fileId])

  const handleSave = async () => {
    setError('')
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      setError('Invalid JSON — fix before saving')
      return
    }

    const res = await fetch(`/api/settings/${fileId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: parsed }),
    })

    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      setError('Failed to save')
    }
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: '#fff',
      border: '1px solid #e5e5e5',
      borderRadius: 8,
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid #e5e5e5',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: '#fafafa',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{label}</div>
          <div style={{ fontSize: 11, color: '#888', fontFamily: '"SF Mono", monospace' }}>~/.claude/{filename}</div>
        </div>
        {loading && <span style={{ fontSize: 12, color: '#aaa' }}>Loading…</span>}
        {saved && <span style={{ fontSize: 12, color: '#16a34a' }}>Saved</span>}
        <button
          onClick={handleSave}
          style={{
            padding: '5px 14px',
            border: '1px solid #ddd',
            borderRadius: 6,
            background: '#1d4ed8',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          Save
        </button>
      </div>

      {error && (
        <div style={{
          padding: '8px 14px',
          background: '#fef2f2',
          borderBottom: '1px solid #fecaca',
          fontSize: 12,
          color: '#b91c1c',
        }}>
          {error}
        </div>
      )}

      <textarea
        value={raw}
        onChange={e => { setRaw(e.target.value); setError('') }}
        spellCheck={false}
        style={{
          flex: 1,
          resize: 'none',
          border: 'none',
          outline: 'none',
          padding: '14px 16px',
          fontFamily: '"SF Mono", "Fira Code", monospace',
          fontSize: 12,
          lineHeight: 1.6,
          color: '#1a1a1a',
          background: '#fff',
        }}
      />
    </div>
  )
}

export default function SettingsView() {
  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden', padding: 16, gap: 12 }}>
      {/* Warning banner */}
      <div style={{
        padding: '8px 14px',
        background: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: 6,
        fontSize: 12,
        color: '#92400e',
        flexShrink: 0,
      }}>
        Editing these files directly may break Claude Code permissions and MCP configuration. Changes are written immediately to disk.
      </div>

      {/* Two panels side by side */}
      <div style={{ display: 'flex', flex: 1, gap: 12, overflow: 'hidden' }}>
        {PANELS.map(panel => (
          <SettingsEditor key={panel.fileId} {...panel} />
        ))}
      </div>
    </div>
  )
}

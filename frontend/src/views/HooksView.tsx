import { useState, useEffect, useRef } from 'react'

function HooksConfigEditor() {
  const [raw, setRaw] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/hooks/config')
      .then(r => {
        if (!r.ok) throw new Error('Not found')
        return r.json()
      })
      .then(data => setRaw(JSON.stringify(data, null, 2)))
      .catch(() => setRaw('{}'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setError('')
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      setError('Invalid JSON — fix before saving')
      return
    }

    const res = await fetch('/api/hooks/config', {
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
      width: 340, minWidth: 340,
      display: 'flex', flexDirection: 'column',
      background: '#fff',
      borderRight: '1px solid #e5e5e5',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid #e5e5e5',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: '#fafafa',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>Hooks Config</div>
          <div style={{ fontSize: 11, color: '#888', fontFamily: '"SF Mono", monospace' }}>hooks.json</div>
        </div>
        {loading && <span style={{ fontSize: 12, color: '#aaa' }}>Loading…</span>}
        {saved && <span style={{ fontSize: 12, color: '#16a34a' }}>Saved</span>}
        <button
          onClick={handleSave}
          style={{
            padding: '5px 14px',
            border: 'none',
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
          padding: '12px 14px',
          fontFamily: '"SF Mono", "Fira Code", monospace',
          fontSize: 11,
          lineHeight: 1.6,
          color: '#1a1a1a',
          background: '#fff',
        }}
      />
    </div>
  )
}

function ScriptEditor({ scripts }: { scripts: string[] }) {
  const [active, setActive] = useState<string | null>(scripts[0] ?? null)
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef('')
  const activeRef = useRef(active)

  useEffect(() => {
    if (active === null && scripts.length > 0) {
      setActive(scripts[0])
    }
  }, [scripts, active])

  useEffect(() => {
    if (!active) return
    activeRef.current = active
    setLoading(true)
    setSaved(false)

    fetch(`/api/hooks/scripts/${encodeURIComponent(active)}/content`)
      .then(r => r.json())
      .then(data => {
        if (activeRef.current === active) {
          setContent(data.content ?? '')
          lastSavedRef.current = data.content ?? ''
        }
      })
      .finally(() => setLoading(false))
  }, [active])

  useEffect(() => {
    if (autosaveRef.current) clearTimeout(autosaveRef.current)
    if (!active || content === lastSavedRef.current) return

    autosaveRef.current = setTimeout(async () => {
      const res = await fetch(`/api/hooks/scripts/${encodeURIComponent(active)}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (res.ok) {
        lastSavedRef.current = content
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    }, 1000)

    return () => { if (autosaveRef.current) clearTimeout(autosaveRef.current) }
  }, [content, active])

  if (scripts.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 13 }}>
        No scripts found
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>
      {/* Script tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e5e5e5',
        background: '#fafafa',
        overflowX: 'auto',
        flexShrink: 0,
      }}>
        {scripts.map(name => (
          <button
            key={name}
            onClick={() => setActive(name)}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderBottom: active === name ? '2px solid #1d4ed8' : '2px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: active === name ? 600 : 400,
              color: active === name ? '#1d4ed8' : '#555',
              whiteSpace: 'nowrap',
              fontFamily: '"SF Mono", "Fira Code", monospace',
            }}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Header */}
      <div style={{
        padding: '8px 14px',
        borderBottom: '1px solid #e5e5e5',
        display: 'flex',
        alignItems: 'center',
        fontSize: 12,
        color: '#555',
        background: '#fff',
      }}>
        <span style={{ flex: 1 }}>
          {active}
          {loading && <span style={{ color: '#aaa', marginLeft: 8 }}>Loading…</span>}
          {saved && <span style={{ color: '#16a34a', marginLeft: 8 }}>Saved</span>}
        </span>
      </div>

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
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

export default function HooksView() {
  const [scripts, setScripts] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/hooks/scripts')
      .then(r => r.json())
      .then((data: string[]) => setScripts(data))
      .catch(() => {})
  }, [])

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <HooksConfigEditor />
      <ScriptEditor scripts={scripts} />
    </div>
  )
}

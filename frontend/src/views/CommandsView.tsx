import { useState, useEffect, useRef, useCallback } from 'react'
import { CommandDef } from '../types'
import CommandList from '../components/CommandList'
import CommandDetail from '../components/CommandDetail'

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

function CreateCommandModal({ onClose, onCreate }: { onClose: () => void; onCreate: (c: CommandDef) => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isValidName = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)

  const handleSubmit = async () => {
    if (!name || !isValidName) { setError('Name must be kebab-case'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, arguments: [] }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.detail || 'Failed to create command')
        return
      }
      const cmd = await res.json()
      onCreate(cmd)
      onClose()
    } catch {
      setError('Failed to create command')
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
        background: '#fff', borderRadius: 12, padding: 24, width: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600 }}>Create New Command</h2>

        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Name (kebab-case)</span>
          <input
            value={name}
            onChange={e => { setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-/, '')); setError('') }}
            placeholder="my-command"
            style={{
              width: '100%', padding: '8px 12px', border: `1px solid ${name && !isValidName ? '#ef4444' : '#ddd'}`,
              borderRadius: 6, fontSize: 14, boxSizing: 'border-box', outline: 'none',
            }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Description</span>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What does this command do?"
            rows={3}
            style={{
              width: '100%', padding: '8px 12px', border: '1px solid #ddd',
              borderRadius: 6, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', outline: 'none',
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
            disabled={submitting || !name || !isValidName}
            style={{
              padding: '8px 16px', border: 'none', borderRadius: 6,
              background: submitting || !name || !isValidName ? '#93c5fd' : '#1d4ed8',
              color: '#fff', cursor: submitting ? 'wait' : 'pointer', fontSize: 13, fontWeight: 500,
            }}
          >
            {submitting ? 'Creating…' : 'Create Command'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CommandsView() {
  const [cmdDefs, setCmdDefs] = useState<CommandDef[]>([])
  const [selected, setSelected] = useState<CommandDef | null>(null)
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef('')
  const selectedIdRef = useRef('')

  const fetchCommands = useCallback(async () => {
    try {
      const res = await fetch('/api/commands')
      if (!res.ok) throw new Error()
      const data: CommandDef[] = await res.json()
      setCmdDefs(data)
      setSelected(prev => {
        if (!prev) return prev
        return data.find(c => c.id === prev.id) ?? prev
      })
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchCommands()
  }, [fetchCommands])

  useEffect(() => {
    if (!selected) return
    selectedIdRef.current = selected.id
    setContent('')
    lastSavedRef.current = ''
    setLoading(true)
    setSaved(false)

    fetch(`/api/commands/${selected.id}/content`)
      .then(r => r.json())
      .then(data => {
        if (selectedIdRef.current === selected.id) {
          setContent(data.content ?? '')
          lastSavedRef.current = data.content ?? ''
        }
      })
      .finally(() => setLoading(false))
  }, [selected?.id])

  useEffect(() => {
    if (autosaveRef.current) clearTimeout(autosaveRef.current)
    if (!selected || content === lastSavedRef.current) return

    autosaveRef.current = setTimeout(async () => {
      const res = await fetch(`/api/commands/${selected.id}/content`, {
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
  }, [content, selected?.id])

  const handleDelete = async (cmdId: string) => {
    const res = await fetch(`/api/commands/${cmdId}`, { method: 'DELETE' })
    if (res.ok) {
      setSelected(null)
      fetchCommands()
    }
  }

  const handleCreate = (cmd: CommandDef) => {
    fetchCommands()
    setSelected(cmd)
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Col 1: Command list */}
      <div style={{
        width: 220, minWidth: 220,
        display: 'flex', flexDirection: 'column',
        background: '#fff',
        borderRight: '1px solid #e5e5e5',
        overflow: 'hidden',
      }}>
        <CommandList
          commands={cmdDefs}
          selected={selected}
          onSelect={setSelected}
          onCreateClick={() => setShowCreate(true)}
        />
      </div>

      {/* Col 2: Command detail */}
      <div style={{
        width: 240, minWidth: 240,
        display: 'flex', flexDirection: 'column',
        background: '#fafafa',
        borderRight: '1px solid #e5e5e5',
        overflow: 'hidden',
        overflowY: 'auto',
      }}>
        {selected
          ? <CommandDetail command={selected} onDelete={handleDelete} />
          : <Empty label="Select a command" />}
      </div>

      {/* Col 3: Raw editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>
        {selected ? (
          <>
            <div style={{
              padding: '10px 16px',
              borderBottom: '1px solid #e5e5e5',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: '#fff',
            }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#555', flex: 1 }}>
                {selected.id}.md
                {loading && <span style={{ color: '#aaa', marginLeft: 8, fontSize: 12 }}>Loading…</span>}
                {saved && <span style={{ color: '#16a34a', marginLeft: 8, fontSize: 12 }}>Saved</span>}
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
                padding: '16px 20px',
                fontFamily: '"SF Mono", "Fira Code", monospace',
                fontSize: 13,
                lineHeight: 1.6,
                color: '#1a1a1a',
                background: '#fff',
              }}
            />
          </>
        ) : (
          <Empty label="No command selected" />
        )}
      </div>

      {showCreate && (
        <CreateCommandModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}

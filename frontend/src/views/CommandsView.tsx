import { useState, useEffect, useRef } from 'react'
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

export default function CommandsView() {
  const [cmdDefs, setCmdDefs] = useState<CommandDef[]>([])
  const [selected, setSelected] = useState<CommandDef | null>(null)
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef('')
  const selectedIdRef = useRef('')

  useEffect(() => {
    fetch('/api/commands')
      .then(r => r.json())
      .then((data: CommandDef[]) => {
        setCmdDefs(data)
      })
      .catch(() => {})
  }, [])

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
        <CommandList commands={cmdDefs} selected={selected} onSelect={setSelected} />
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
          ? <CommandDetail command={selected} />
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
    </div>
  )
}

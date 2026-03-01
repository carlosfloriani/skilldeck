import { useState, useEffect, useRef } from 'react'
import { AgentDef } from '../types'

interface Props {
  agent: AgentDef
  onSaved: () => void
}

export default function AgentEditor({ agent, onSaved }: Props) {
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef('')
  const agentIdRef = useRef(agent.id)

  useEffect(() => {
    agentIdRef.current = agent.id
    setLoading(true)
    setSaved(false)

    fetch(`/api/agents/${agent.id}/content`)
      .then(r => r.json())
      .then(data => {
        if (agentIdRef.current === agent.id) {
          setContent(data.content ?? '')
          lastSavedRef.current = data.content ?? ''
        }
      })
      .finally(() => setLoading(false))
  }, [agent.id])

  useEffect(() => {
    if (autosaveRef.current) clearTimeout(autosaveRef.current)
    if (content === lastSavedRef.current) return

    autosaveRef.current = setTimeout(async () => {
      const res = await fetch(`/api/agents/${agent.id}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (res.ok) {
        lastSavedRef.current = content
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        onSaved()
      }
    }, 1000)

    return () => { if (autosaveRef.current) clearTimeout(autosaveRef.current) }
  }, [content, agent.id, onSaved])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid #e5e5e5',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: '#fff',
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#555', flex: 1 }}>
          {agent.id}.md
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
    </div>
  )
}

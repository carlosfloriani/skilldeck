import { useState, useEffect, useCallback } from 'react'
import { AgentDef } from '../types'
import AgentList from '../components/AgentList'
import AgentDetail from '../components/AgentDetail'
import AgentEditor from '../components/AgentEditor'

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

function CreateAgentModal({ onClose, onCreate }: { onClose: () => void; onCreate: (a: AgentDef) => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isValidName = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)

  const handleSubmit = async () => {
    if (!name || !isValidName) { setError('Name must be kebab-case'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, tools: [] }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.detail || 'Failed to create agent')
        return
      }
      const agent = await res.json()
      onCreate(agent)
      onClose()
    } catch {
      setError('Failed to create agent')
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
        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600 }}>Create New Agent</h2>

        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Name (kebab-case)</span>
          <input
            value={name}
            onChange={e => { setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-/, '')); setError('') }}
            placeholder="my-agent"
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
            placeholder="What does this agent do?"
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
            {submitting ? 'Creating…' : 'Create Agent'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AgentsView() {
  const [agentDefs, setAgentDefs] = useState<AgentDef[]>([])
  const [selected, setSelected] = useState<AgentDef | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents')
      if (!res.ok) throw new Error()
      const data: AgentDef[] = await res.json()
      setAgentDefs(data)
      setSelected(prev => {
        if (!prev) return prev
        return data.find(a => a.id === prev.id) ?? prev
      })
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  const handleDelete = async (agentId: string) => {
    const res = await fetch(`/api/agents/${agentId}`, { method: 'DELETE' })
    if (res.ok) {
      setSelected(null)
      fetchAgents()
    }
  }

  const handleDuplicate = async (agentId: string, newName: string) => {
    const res = await fetch(`/api/agents/${agentId}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_name: newName }),
    })
    if (res.ok) {
      const agent = await res.json()
      fetchAgents()
      setSelected(agent)
    }
  }

  const handleCreate = (agent: AgentDef) => {
    fetchAgents()
    setSelected(agent)
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <div style={{
        width: 260, minWidth: 260,
        display: 'flex', flexDirection: 'column',
        background: '#fff',
        borderRight: '1px solid #e5e5e5',
        overflow: 'hidden',
      }}>
        <AgentList
          agents={agentDefs}
          selected={selected}
          onSelect={setSelected}
          onCreateClick={() => setShowCreate(true)}
        />
      </div>

      <div style={{
        width: 280, minWidth: 280,
        display: 'flex', flexDirection: 'column',
        background: '#fafafa',
        borderRight: '1px solid #e5e5e5',
        overflow: 'hidden',
      }}>
        {selected
          ? <AgentDetail agent={selected} onDelete={handleDelete} onDuplicate={handleDuplicate} />
          : <Empty label="Select an agent" />}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>
        {selected
          ? <AgentEditor agent={selected} onSaved={fetchAgents} />
          : <Empty label="No agent selected" />}
      </div>

      {showCreate && (
        <CreateAgentModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}

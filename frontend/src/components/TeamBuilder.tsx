import { useState, useEffect } from 'react'
import { AgentDef, Team } from '../types'

interface Props {
  agents: AgentDef[]
  team: Team | null
  onSaved: (team: Team) => void
  onDeleted: (teamId: string) => void
  onNew: () => void
}

const COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#0891b2', '#64748b']

export default function TeamBuilder({ agents, team, onSaved, onDeleted, onNew }: Props) {
  const [name, setName] = useState('')
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [color, setColor] = useState('#3b82f6')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (team) {
      setName(team.name)
      setSelectedAgents(team.agents)
      setColor(team.color)
    } else {
      setName('')
      setSelectedAgents([])
      setColor('#3b82f6')
    }
  }, [team])

  const toggleAgent = (agentId: string) => {
    setSelectedAgents(prev =>
      prev.includes(agentId) ? prev.filter(a => a !== agentId) : [...prev, agentId]
    )
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const body = { id: team?.id ?? '', name: name.trim(), agents: selectedAgents, color }
      const method = team ? 'PUT' : 'POST'
      const url = team ? `/api/teams/${team.id}` : '/api/teams'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const saved: Team = await res.json()
        onSaved(saved)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!team) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/teams/${team.id}`, { method: 'DELETE' })
      if (res.ok) onDeleted(team.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e5e5e5',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
          {team ? 'Edit Team' : 'New Team'}
        </span>
        <button
          onClick={onNew}
          style={{
            padding: '4px 12px',
            border: '1px solid #ddd',
            borderRadius: 6,
            background: '#fff',
            color: '#555',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          + New
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* Name */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            Name
          </label>
          <input
            type="text"
            placeholder="Team name…"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '1px solid #ddd',
              borderRadius: 6,
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Color */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Color
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: c,
                  border: color === c ? '3px solid #111' : '2px solid transparent',
                  cursor: 'pointer',
                  outline: 'none',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* Agents */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Agents
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {agents.map(agent => {
              const checked = selectedAgents.includes(agent.id)
              return (
                <label
                  key={agent.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: `1px solid ${checked ? color : '#e5e5e5'}`,
                    background: checked ? `${color}14` : '#f9f9f9',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAgent(agent.id)}
                    style={{ margin: 0 }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{agent.name}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{agent.tools.length} tools</div>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #e5e5e5',
        display: 'flex',
        gap: 8,
      }}>
        <button
          onClick={handleSave}
          disabled={!name.trim() || saving}
          style={{
            flex: 1,
            padding: '8px',
            border: 'none',
            borderRadius: 6,
            background: name.trim() ? color : '#e5e5e5',
            color: name.trim() ? '#fff' : '#999',
            cursor: name.trim() ? 'pointer' : 'default',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {saving ? 'Saving…' : team ? 'Save Changes' : 'Create Team'}
        </button>

        {team && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              padding: '8px 16px',
              border: '1px solid #fecaca',
              borderRadius: 6,
              background: '#fff',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {deleting ? '…' : 'Delete'}
          </button>
        )}
      </div>
    </div>
  )
}

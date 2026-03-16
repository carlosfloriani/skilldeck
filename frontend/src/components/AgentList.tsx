import { useState } from 'react'
import { AgentDef } from '../types'

interface Props {
  agents: AgentDef[]
  selected: AgentDef | null
  onSelect: (agent: AgentDef) => void
  onCreateClick: () => void
}

export default function AgentList({ agents, selected, onSelect, onCreateClick }: Props) {
  const [query, setQuery] = useState('')

  const filtered = agents.filter(a =>
    a.name.toLowerCase().includes(query.toLowerCase()) ||
    a.description.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #e5e5e5', display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Search agents…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '6px 10px',
            border: '1px solid #ddd',
            borderRadius: 6,
            fontSize: 13,
            outline: 'none',
            background: '#f9f9f9',
            boxSizing: 'border-box',
          }}
        />
        <button
          onClick={onCreateClick}
          title="Create new agent"
          style={{
            width: 28, height: 28, border: '1px solid #ddd', borderRadius: 6,
            background: '#fff', cursor: 'pointer', fontSize: 16, color: '#555',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >+</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding: 16, color: '#999', fontSize: 12, textAlign: 'center' }}>
            {agents.length === 0 ? 'Loading…' : 'No agents found'}
          </div>
        )}
        {filtered.map(agent => {
          const isSelected = selected?.id === agent.id
          return (
            <button
              key={agent.id}
              onClick={() => onSelect(agent)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 14px',
                border: 'none',
                borderBottom: '1px solid #f0f0f0',
                background: isSelected ? '#eff6ff' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
              }}
            >
              <span style={{
                fontWeight: 500,
                fontSize: 13,
                color: isSelected ? '#1d4ed8' : '#111',
              }}>
                {agent.name}
              </span>
              <span style={{ fontSize: 11, color: '#888', lineHeight: 1.4 }}>
                {agent.description || <em>No description</em>}
              </span>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                <span style={{
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 10,
                  background: '#f0f0f0',
                  color: '#666',
                }}>
                  {agent.tools.length} tool{agent.tools.length !== 1 ? 's' : ''}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <div style={{
        padding: '8px 14px',
        borderTop: '1px solid #e5e5e5',
        fontSize: 11,
        color: '#999',
      }}>
        {filtered.length} agent{filtered.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

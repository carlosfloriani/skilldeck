import { useState } from 'react'
import { Skill, AgentId, AGENT_COLORS } from '../types'

interface Props {
  skills: Skill[]
  selected: Skill | null
  onSelect: (skill: Skill) => void
}

const AGENT_IDS: AgentId[] = ['claudeCode', 'cursor', 'codex', 'gemini', 'amp', 'cline']

export default function SkillList({ skills, selected, onSelect }: Props) {
  const [query, setQuery] = useState('')

  const filtered = skills.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.description.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #e5e5e5' }}>
        <input
          type="search"
          placeholder="Search skills…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 10px',
            border: '1px solid #ddd',
            borderRadius: 6,
            fontSize: 13,
            outline: 'none',
            background: '#f9f9f9',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding: 16, color: '#999', fontSize: 12, textAlign: 'center' }}>
            {skills.length === 0 ? 'Loading…' : 'No skills found'}
          </div>
        )}
        {filtered.map(skill => {
          const isSelected = selected?.id === skill.id
          const installedAgents = AGENT_IDS.filter(a => skill.agents[a])

          return (
            <button
              key={skill.id}
              onClick={() => onSelect(skill)}
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
                gap: 6,
              }}
            >
              <span style={{
                fontWeight: 500,
                fontSize: 13,
                color: isSelected ? '#1d4ed8' : '#111',
                display: 'block',
              }}>
                {skill.name}
              </span>

              {installedAgents.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {installedAgents.map(a => (
                    <span
                      key={a}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: AGENT_COLORS[a],
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                      title={a}
                    />
                  ))}
                </div>
              )}
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
        {filtered.length} skill{filtered.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

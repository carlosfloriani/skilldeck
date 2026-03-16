import { useState } from 'react'
import { Skill, AgentId, AGENT_COLORS } from '../types'

interface Props {
  skills: Skill[]
  selected: Skill | null
  onSelect: (skill: Skill) => void
  onCreateClick: () => void
}

const AGENT_IDS: AgentId[] = ['claudeCode', 'cursor', 'codex', 'gemini', 'amp', 'cline']

function qualityDot(skill: Skill) {
  // Estimate quality from available data
  let score = 0
  if (skill.name) score += 10
  if (skill.description) score += 10
  if (skill.description && skill.description.length > 20) score += 10
  if (skill.license) score += 5
  if (skill.word_count > 50) score += 15
  if (skill.has_examples) score += 15
  if (skill.allowed_tools) score += 10
  // Approximate: assume headings and code blocks exist if word_count > 50
  if (skill.word_count > 30) score += 10
  if (skill.word_count > 20) score += 10
  // No TODO check client-side, assume ok
  score += 5

  if (score >= 80) return '#16a34a'
  if (score >= 50) return '#d97706'
  return '#ef4444'
}

export default function SkillList({ skills, selected, onSelect, onCreateClick }: Props) {
  const [query, setQuery] = useState('')

  const filtered = skills.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.description.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #e5e5e5', display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Search skills…"
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
          title="Create new skill"
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: qualityDot(skill),
                  display: 'inline-block', flexShrink: 0,
                }} title={`Quality: estimated`} />
                <span style={{
                  fontWeight: 500,
                  fontSize: 13,
                  color: isSelected ? '#1d4ed8' : '#111',
                }}>
                  {skill.name}
                </span>
              </div>

              {installedAgents.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginLeft: 14 }}>
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

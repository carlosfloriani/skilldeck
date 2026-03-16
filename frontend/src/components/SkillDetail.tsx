import { useState } from 'react'
import { Skill, AgentId, AGENT_LABELS, AGENT_COLORS } from '../types'
import SkillValidator from './SkillValidator'

interface Props {
  skill: Skill
  onToggle: (agentId: string, enabled: boolean) => void
  onDelete: (skillId: string) => void
  onDuplicate: (skillId: string) => void
}

const AGENT_IDS: AgentId[] = ['claudeCode', 'cursor', 'codex', 'gemini', 'amp', 'cline']

export default function SkillDetail({ skill, onToggle, onDelete, onDuplicate }: Props) {
  const [showValidation, setShowValidation] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const allEnabled = AGENT_IDS.every(a => skill.agents[a])
  const anyEnabled = AGENT_IDS.some(a => skill.agents[a])

  const handleBulkToggle = () => {
    const enable = !allEnabled
    AGENT_IDS.forEach(a => onToggle(a, enable))
  }

  const handleDuplicate = () => {
    const newName = prompt('New skill name (kebab-case):', `${skill.id}-copy`)
    if (newName) onDuplicate(newName)
  }

  const handleImprove = () => {
    const prompt = `Analyze and improve this skill:\n\nSkill: ${skill.name}\nDescription: ${skill.description}\nLicense: ${skill.license}\n\nSuggest improvements for:\n1. Better description\n2. More examples\n3. Clearer instructions`
    navigator.clipboard.writeText(prompt)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid #e5e5e5',
        background: '#fff',
      }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111' }}>
          {skill.name}
        </h2>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: '#666', lineHeight: 1.5 }}>
          {skill.description || <em>No description</em>}
        </p>
        {skill.license && (
          <p style={{ margin: '6px 0 0', fontSize: 11, color: '#999' }}>
            {skill.license}
          </p>
        )}

        {/* Metadata chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
          {skill.metadata_author && (
            <span style={{ padding: '2px 6px', background: '#f0f0f0', borderRadius: 4, fontSize: 10, color: '#666' }}>
              Author: {skill.metadata_author}
            </span>
          )}
          {skill.metadata_version && (
            <span style={{ padding: '2px 6px', background: '#f0f0f0', borderRadius: 4, fontSize: 10, color: '#666' }}>
              v{skill.metadata_version}
            </span>
          )}
          {skill.allowed_tools && (
            <span style={{ padding: '2px 6px', background: '#eff6ff', borderRadius: 4, fontSize: 10, color: '#1d4ed8' }}>
              Tools: {skill.allowed_tools}
            </span>
          )}
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <button
            onClick={() => setShowValidation(v => !v)}
            style={{
              padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4,
              background: showValidation ? '#eff6ff' : '#fff', cursor: 'pointer', fontSize: 11,
              color: showValidation ? '#1d4ed8' : '#555',
            }}
          >Validate</button>
          <button
            onClick={handleDuplicate}
            style={{
              padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4,
              background: '#fff', cursor: 'pointer', fontSize: 11, color: '#555',
            }}
          >Duplicate</button>
          <button
            onClick={handleImprove}
            title="Copy improvement prompt to clipboard"
            style={{
              padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4,
              background: '#fff', cursor: 'pointer', fontSize: 11, color: '#555',
            }}
          >Improve</button>
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              padding: '4px 8px', border: '1px solid #fecaca', borderRadius: 4,
              background: '#fff', cursor: 'pointer', fontSize: 11, color: '#ef4444',
              marginLeft: 'auto',
            }}
          >Delete</button>
        </div>

        {/* Confirm delete */}
        {confirmDelete && (
          <div style={{
            marginTop: 8, padding: '8px 10px', background: '#fef2f2',
            borderRadius: 6, border: '1px solid #fecaca',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 12, color: '#dc2626', flex: 1 }}>
              Delete "{skill.name}" and remove all symlinks?
            </span>
            <button
              onClick={() => { onDelete(skill.id); setConfirmDelete(false) }}
              style={{
                padding: '4px 10px', border: 'none', borderRadius: 4,
                background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: 11,
              }}
            >Yes, delete</button>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{
                padding: '4px 10px', border: '1px solid #ddd', borderRadius: 4,
                background: '#fff', cursor: 'pointer', fontSize: 11,
              }}
            >Cancel</button>
          </div>
        )}
      </div>

      {showValidation && <SkillValidator skillId={skill.id} />}

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          margin: '0 0 12px',
        }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Agents
          </p>
          <button
            onClick={handleBulkToggle}
            style={{
              padding: '2px 8px', border: '1px solid #ddd', borderRadius: 4,
              background: '#fff', cursor: 'pointer', fontSize: 10, color: '#555',
            }}
          >
            {allEnabled ? 'Disable All' : 'Enable All'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {AGENT_IDS.map(agentId => {
            const enabled = skill.agents[agentId]
            return (
              <div
                key={agentId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: enabled ? '#f0fdf4' : '#f9f9f9',
                  border: `1px solid ${enabled ? '#bbf7d0' : '#e5e5e5'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: AGENT_COLORS[agentId],
                    display: 'inline-block',
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 13, color: '#333' }}>
                    {AGENT_LABELS[agentId]}
                  </span>
                </div>

                <Toggle
                  enabled={enabled}
                  color={AGENT_COLORS[agentId]}
                  onChange={val => onToggle(agentId, val)}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Toggle({ enabled, color, onChange }: {
  enabled: boolean
  color: string
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      aria-pressed={enabled}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        border: 'none',
        background: enabled ? color : '#d1d5db',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.15s',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 2,
        left: enabled ? 18 : 2,
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 0.15s',
        display: 'block',
      }} />
    </button>
  )
}

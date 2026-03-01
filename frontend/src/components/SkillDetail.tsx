import { Skill, AgentId, AGENT_LABELS, AGENT_COLORS } from '../types'

interface Props {
  skill: Skill
  onToggle: (agentId: string, enabled: boolean) => void
}

const AGENT_IDS: AgentId[] = ['claudeCode', 'cursor', 'codex', 'gemini', 'amp', 'cline']

export default function SkillDetail({ skill, onToggle }: Props) {
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
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Agents
        </p>

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

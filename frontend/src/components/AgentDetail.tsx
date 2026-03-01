import { AgentDef } from '../types'

interface Props {
  agent: AgentDef
}

const TOOL_COLORS: Record<string, string> = {
  Read: '#0ea5e9',
  Write: '#22c55e',
  Edit: '#16a34a',
  MultiEdit: '#15803d',
  Bash: '#f59e0b',
  Grep: '#8b5cf6',
  Glob: '#6366f1',
  WebFetch: '#ec4899',
  WebSearch: '#f43f5e',
  Agent: '#ef4444',
}

function getToolColor(tool: string): string {
  return TOOL_COLORS[tool] ?? '#6b7280'
}

export default function AgentDetail({ agent }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid #e5e5e5',
        background: '#fff',
      }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111' }}>
          {agent.name}
        </h2>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: '#666', lineHeight: 1.5 }}>
          {agent.description || <em>No description</em>}
        </p>
        <p style={{ margin: '6px 0 0', fontSize: 11, color: '#999' }}>
          ~/.claude/agents/{agent.id}.md
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        <p style={{
          margin: '0 0 10px',
          fontSize: 11,
          fontWeight: 600,
          color: '#888',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Tools ({agent.tools.length})
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {agent.tools.map(tool => (
            <div
              key={tool}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                borderRadius: 6,
                background: '#f9f9f9',
                border: '1px solid #e5e5e5',
              }}
            >
              <span style={{
                width: 8, height: 8,
                borderRadius: '50%',
                background: getToolColor(tool),
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 13, color: '#333', fontFamily: 'monospace' }}>
                {tool}
              </span>
            </div>
          ))}

          {agent.tools.length === 0 && (
            <span style={{ fontSize: 12, color: '#999' }}>No tools defined</span>
          )}
        </div>
      </div>
    </div>
  )
}

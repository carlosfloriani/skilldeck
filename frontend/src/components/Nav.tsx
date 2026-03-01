import { TabId } from '../types'

interface Props {
  active: TabId
  onChange: (tab: TabId) => void
  error: boolean
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'skills', label: 'Skills' },
  { id: 'agents', label: 'Agents' },
  { id: 'teams', label: 'Teams' },
  { id: 'flow', label: 'Flow' },
  { id: 'commands', label: 'Commands' },
  { id: 'settings', label: 'Settings' },
  { id: 'hooks', label: 'Hooks' },
  { id: 'claudemd', label: 'CLAUDE.md' },
]

export default function Nav({ active, onChange, error }: Props) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      padding: '0 16px',
      borderBottom: '1px solid #e5e5e5',
      background: '#fff',
      height: 44,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 16 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: error ? '#ef4444' : '#22c55e',
          flexShrink: 0,
        }} />
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', color: '#111' }}>
          SkillDeck
        </span>
      </div>

      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            padding: '0 10px',
            height: 44,
            border: 'none',
            borderBottom: active === tab.id ? '2px solid #1d4ed8' : '2px solid transparent',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: active === tab.id ? 600 : 400,
            color: active === tab.id ? '#1d4ed8' : '#555',
            transition: 'color 0.1s',
            whiteSpace: 'nowrap',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

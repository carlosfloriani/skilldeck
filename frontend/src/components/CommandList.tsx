import { useState } from 'react'
import { CommandDef } from '../types'

const PRODUCT_KEYWORDS = [
  'ab-test', 'competitive', 'user', 'ux', 'product', 'design', 'strategy',
  'roadmap', 'customer', 'metrics', 'growth', 'business', 'marketing',
  'research', 'persona', 'journey', 'brief', 'spec', 'prd', 'stakeholder',
  'feedback', 'interview', 'prioritiz',
]

function getCategory(cmd: CommandDef): 'Product' | 'Technical' {
  const text = (cmd.id + ' ' + cmd.name + ' ' + cmd.description).toLowerCase()
  return PRODUCT_KEYWORDS.some(kw => text.includes(kw)) ? 'Product' : 'Technical'
}

interface Props {
  commands: CommandDef[]
  selected: CommandDef | null
  onSelect: (cmd: CommandDef) => void
}

export default function CommandList({ commands, selected, onSelect }: Props) {
  const [query, setQuery] = useState('')

  const filtered = commands.filter(c => {
    const q = query.toLowerCase()
    return (
      c.id.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #e5e5e5' }}>
        <input
          type="text"
          placeholder="Search commands…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 10px',
            border: '1px solid #ddd',
            borderRadius: 6,
            fontSize: 12,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding: 16, color: '#aaa', fontSize: 12, textAlign: 'center' }}>
            No commands found
          </div>
        )}
        {filtered.map(cmd => {
          const cat = getCategory(cmd)
          const isSelected = selected?.id === cmd.id
          return (
            <div
              key={cmd.id}
              onClick={() => onSelect(cmd)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                background: isSelected ? '#eff6ff' : 'transparent',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{
                flex: 1,
                fontSize: 12,
                fontWeight: isSelected ? 600 : 400,
                color: isSelected ? '#1d4ed8' : '#1a1a1a',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {cmd.id}
              </span>
              <span style={{
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 4,
                background: cat === 'Product' ? '#fef3c7' : '#f0fdf4',
                color: cat === 'Product' ? '#92400e' : '#166534',
                flexShrink: 0,
                fontWeight: 500,
              }}>
                {cat}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

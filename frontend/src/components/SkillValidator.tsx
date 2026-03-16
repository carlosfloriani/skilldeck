import { useState, useEffect } from 'react'
import { SkillValidation } from '../types'

interface Props {
  skillId: string;
}

export default function SkillValidator({ skillId }: Props) {
  const [validation, setValidation] = useState<SkillValidation | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/skills/${skillId}/validate`)
      .then(r => r.json())
      .then(data => setValidation(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [skillId])

  if (loading) return <div style={{ padding: 12, fontSize: 12, color: '#aaa' }}>Validating...</div>
  if (!validation) return null

  const scoreColor = validation.score >= 80 ? '#16a34a' : validation.score >= 50 ? '#d97706' : '#ef4444'

  return (
    <div style={{ borderTop: '1px solid #e5e5e5', background: '#fafafa' }}>
      <div style={{
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>Quality Score</span>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: scoreColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 13, fontWeight: 700,
        }}>
          {validation.score}
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        {validation.items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '4px 0', fontSize: 12,
          }}>
            <span style={{ color: item.ok ? '#16a34a' : '#ef4444', fontSize: 14, width: 16 }}>
              {item.ok ? '\u2713' : '\u2717'}
            </span>
            <span style={{ flex: 1, color: item.ok ? '#555' : '#999' }}>{item.label}</span>
            <span style={{ color: '#aaa', fontSize: 11 }}>
              {item.points}/{item.maxPoints}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { SkillTemplate } from '../types'

interface Props {
  onClose: () => void;
  onCreate: (skill: any) => void;
}

const TEMPLATES: { id: SkillTemplate; label: string; desc: string }[] = [
  { id: 'minimal', label: 'Minimal', desc: 'Just a heading' },
  { id: 'standard', label: 'Standard', desc: 'Description, usage, examples' },
  { id: 'scripts', label: 'Scripts', desc: 'With bash code blocks' },
  { id: 'pattern', label: 'Pattern', desc: 'Pattern + when to use' },
]

const LICENSES = ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'Unlicense', 'NONE']

export default function CreateSkillModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [license, setLicense] = useState('MIT')
  const [template, setTemplate] = useState<SkillTemplate>('standard')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isValidName = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)

  const handleNameChange = (val: string) => {
    setName(val.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-/, ''))
    setError('')
  }

  const handleSubmit = async () => {
    if (!name || !isValidName) { setError('Name must be kebab-case'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, license, template }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.detail || 'Failed to create skill')
        return
      }
      const skill = await res.json()
      onCreate(skill)
      onClose()
    } catch {
      setError('Failed to create skill')
    } finally {
      setSubmitting(false)
    }
  }

  const previewFm = `---\nname: ${name || 'my-skill'}\ndescription: ${description || '...'}\nlicense: ${license}\n---`

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 12, padding: 24, width: 560,
        maxHeight: '80vh', overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600 }}>Create New Skill</h2>

        {/* Name */}
        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Name (kebab-case)</span>
          <input
            value={name}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="my-awesome-skill"
            style={{
              width: '100%', padding: '8px 12px', border: `1px solid ${name && !isValidName ? '#ef4444' : '#ddd'}`,
              borderRadius: 6, fontSize: 14, boxSizing: 'border-box', outline: 'none',
            }}
          />
        </label>

        {/* Description */}
        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>
            Description <span style={{ color: '#aaa', fontWeight: 400 }}>{description.length}/1024</span>
          </span>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value.slice(0, 1024))}
            placeholder="What does this skill do?"
            rows={3}
            style={{
              width: '100%', padding: '8px 12px', border: '1px solid #ddd',
              borderRadius: 6, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', outline: 'none',
            }}
          />
          {description.toLowerCase().includes('trigger') && (
            <span style={{ fontSize: 11, color: '#d97706', marginTop: 2, display: 'block' }}>
              Tip: Consider using a trigger phrase in the description
            </span>
          )}
        </label>

        {/* License */}
        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>License</span>
          <select
            value={license}
            onChange={e => setLicense(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', border: '1px solid #ddd',
              borderRadius: 6, fontSize: 13, background: '#fff', boxSizing: 'border-box',
            }}
          >
            {LICENSES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>

        {/* Template */}
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 8 }}>Template</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                style={{
                  padding: '10px 12px', border: `2px solid ${template === t.id ? '#1d4ed8' : '#e5e5e5'}`,
                  borderRadius: 8, background: template === t.id ? '#eff6ff' : '#fff',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: template === t.id ? '#1d4ed8' : '#333' }}>{t.label}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Preview</span>
          <pre style={{
            background: '#f4f4f5', borderRadius: 6, padding: '10px 12px',
            fontSize: 11, overflow: 'auto', maxHeight: 100, margin: 0,
          }}>
            {previewFm}
          </pre>
        </div>

        {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '8px 16px', border: '1px solid #ddd', borderRadius: 6,
            background: '#fff', cursor: 'pointer', fontSize: 13,
          }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !name || !isValidName}
            style={{
              padding: '8px 16px', border: 'none', borderRadius: 6,
              background: submitting || !name || !isValidName ? '#93c5fd' : '#1d4ed8',
              color: '#fff', cursor: submitting ? 'wait' : 'pointer', fontSize: 13, fontWeight: 500,
            }}
          >
            {submitting ? 'Creating\u2026' : 'Create Skill'}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { Skill } from '../types'

interface Props {
  skill: Skill
}

export default function SkillEditor({ skill }: Props) {
  const [content, setContent] = useState('')
  const [preview, setPreview] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef('')
  const skillIdRef = useRef(skill.id)

  const wordCount = content.split(/\s+/).filter(Boolean).length

  // Load content when skill changes
  useEffect(() => {
    skillIdRef.current = skill.id
    setLoading(true)
    setSaved(false)

    fetch(`/api/skills/${skill.id}/content`)
      .then(r => r.json())
      .then(data => {
        if (skillIdRef.current === skill.id) {
          setContent(data.content ?? '')
          lastSavedRef.current = data.content ?? ''
        }
      })
      .finally(() => setLoading(false))
  }, [skill.id])

  // Autosave after 1s of inactivity
  useEffect(() => {
    if (autosaveRef.current) clearTimeout(autosaveRef.current)

    if (content === lastSavedRef.current) return

    autosaveRef.current = setTimeout(async () => {
      const res = await fetch(`/api/skills/${skill.id}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (res.ok) {
        lastSavedRef.current = content
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    }, 1000)

    return () => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current)
    }
  }, [content, skill.id])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid #e5e5e5',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: '#fff',
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#555', flex: 1 }}>
          SKILL.md
          {loading && <span style={{ color: '#aaa', marginLeft: 8, fontSize: 12 }}>Loading…</span>}
          {saved && <span style={{ color: '#16a34a', marginLeft: 8, fontSize: 12 }}>Saved</span>}
          <span style={{ color: '#aaa', marginLeft: 8, fontSize: 11 }}>{wordCount} words</span>
        </span>

        <button
          onClick={() => setPreview(v => !v)}
          style={{
            padding: '4px 12px',
            border: '1px solid #ddd',
            borderRadius: 6,
            background: preview ? '#1d4ed8' : '#fff',
            color: preview ? '#fff' : '#555',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {preview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {preview ? (
        <PreviewPane content={content} />
      ) : (
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          spellCheck={false}
          style={{
            flex: 1,
            resize: 'none',
            border: 'none',
            outline: 'none',
            padding: '16px 20px',
            fontFamily: '"SF Mono", "Fira Code", monospace',
            fontSize: 13,
            lineHeight: 1.6,
            color: '#1a1a1a',
            background: '#fff',
          }}
        />
      )}
    </div>
  )
}

function PreviewPane({ content }: { content: string }) {
  // Simple markdown-like preview: code blocks, headings, paragraphs
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Skip frontmatter
    if (i === 0 && line === '---') {
      while (i < lines.length && !(i > 0 && lines[i] === '---')) i++
      i++
      continue
    }

    // Fenced code block
    if (line.startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <pre key={i} style={{
          background: '#f4f4f5', borderRadius: 6, padding: '12px 14px',
          fontSize: 12, overflowX: 'auto', margin: '8px 0',
        }}>
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
      i++
      continue
    }

    // Headings
    const h3 = line.match(/^### (.+)/)
    const h2 = line.match(/^## (.+)/)
    const h1 = line.match(/^# (.+)/)
    if (h1) { elements.push(<h1 key={i} style={{ fontSize: 18, margin: '16px 0 8px' }}>{h1[1]}</h1>); i++; continue }
    if (h2) { elements.push(<h2 key={i} style={{ fontSize: 15, margin: '14px 0 6px' }}>{h2[1]}</h2>); i++; continue }
    if (h3) { elements.push(<h3 key={i} style={{ fontSize: 13, margin: '12px 0 4px' }}>{h3[1]}</h3>); i++; continue }

    // Empty line
    if (line.trim() === '') { elements.push(<br key={i} />); i++; continue }

    // Paragraph
    elements.push(<p key={i} style={{ margin: '4px 0', lineHeight: 1.6 }}>{line}</p>)
    i++
  }

  return (
    <div style={{
      flex: 1, overflowY: 'auto', padding: '16px 24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: 13, color: '#1a1a1a',
    }}>
      {elements}
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { Skill } from '../types'
import SkillList from '../components/SkillList'
import SkillDetail from '../components/SkillDetail'
import SkillEditor from '../components/SkillEditor'
import CreateSkillModal from '../components/CreateSkillModal'

function Empty({ label }: { label: string }) {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#aaa', fontSize: 13,
    }}>
      {label}
    </div>
  )
}

export default function SkillsView() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [selected, setSelected] = useState<Skill | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch('/api/skills')
      if (!res.ok) throw new Error()
      const data: Skill[] = await res.json()
      setSkills(data)
      setSelected(prev => {
        if (!prev) return prev
        return data.find(s => s.id === prev.id) ?? prev
      })
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchSkills()
    const id = setInterval(fetchSkills, 2000)
    return () => clearInterval(id)
  }, [fetchSkills])

  const handleToggle = async (agentId: string, enabled: boolean) => {
    if (!selected) return
    await fetch(`/api/skills/${selected.id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: agentId, enabled }),
    })
    fetchSkills()
  }

  const handleDelete = async (skillId: string) => {
    const res = await fetch(`/api/skills/${skillId}`, { method: 'DELETE' })
    if (res.ok) {
      setSelected(null)
      fetchSkills()
    }
  }

  const handleDuplicate = async (newName: string) => {
    if (!selected) return
    const res = await fetch(`/api/skills/${selected.id}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_name: newName }),
    })
    if (res.ok) {
      const skill = await res.json()
      fetchSkills()
      setSelected(skill)
    }
  }

  const handleCreate = (skill: Skill) => {
    fetchSkills()
    setSelected(skill)
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <div style={{
        width: 260, minWidth: 260,
        display: 'flex', flexDirection: 'column',
        background: '#fff',
        borderRight: '1px solid #e5e5e5',
        overflow: 'hidden',
      }}>
        <SkillList
          skills={skills}
          selected={selected}
          onSelect={setSelected}
          onCreateClick={() => setShowCreate(true)}
        />
      </div>

      <div style={{
        width: 320, minWidth: 320,
        display: 'flex', flexDirection: 'column',
        background: '#fafafa',
        borderRight: '1px solid #e5e5e5',
        overflow: 'hidden',
      }}>
        {selected
          ? <SkillDetail
              skill={selected}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          : <Empty label="Select a skill" />}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>
        {selected
          ? <SkillEditor skill={selected} />
          : <Empty label="No skill selected" />}
      </div>

      {showCreate && (
        <CreateSkillModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}

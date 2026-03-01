import { useState, useEffect, useCallback } from 'react'
import { AgentDef } from '../types'
import AgentList from '../components/AgentList'
import AgentDetail from '../components/AgentDetail'
import AgentEditor from '../components/AgentEditor'

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

export default function AgentsView() {
  const [agentDefs, setAgentDefs] = useState<AgentDef[]>([])
  const [selected, setSelected] = useState<AgentDef | null>(null)

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents')
      if (!res.ok) throw new Error()
      const data: AgentDef[] = await res.json()
      setAgentDefs(data)
      setSelected(prev => {
        if (!prev) return prev
        return data.find(a => a.id === prev.id) ?? prev
      })
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <div style={{
        width: 260, minWidth: 260,
        display: 'flex', flexDirection: 'column',
        background: '#fff',
        borderRight: '1px solid #e5e5e5',
        overflow: 'hidden',
      }}>
        <AgentList agents={agentDefs} selected={selected} onSelect={setSelected} />
      </div>

      <div style={{
        width: 280, minWidth: 280,
        display: 'flex', flexDirection: 'column',
        background: '#fafafa',
        borderRight: '1px solid #e5e5e5',
        overflow: 'hidden',
      }}>
        {selected
          ? <AgentDetail agent={selected} />
          : <Empty label="Select an agent" />}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>
        {selected
          ? <AgentEditor agent={selected} onSaved={fetchAgents} />
          : <Empty label="No agent selected" />}
      </div>
    </div>
  )
}

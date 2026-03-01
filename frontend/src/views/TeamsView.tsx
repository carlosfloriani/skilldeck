import { useState, useEffect, useCallback } from 'react'
import { AgentDef, Team } from '../types'
import TeamBuilder from '../components/TeamBuilder'

export default function TeamsView() {
  const [teams, setTeams] = useState<Team[]>([])
  const [agentDefs, setAgentDefs] = useState<AgentDef[]>([])
  const [selected, setSelected] = useState<Team | null>(null)

  const fetchData = useCallback(async () => {
    const [teamsRes, agentsRes] = await Promise.all([
      fetch('/api/teams'),
      fetch('/api/agents'),
    ])
    if (teamsRes.ok) setTeams(await teamsRes.json())
    if (agentsRes.ok) setAgentDefs(await agentsRes.json())
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSaved = (team: Team) => {
    setTeams(prev => {
      const idx = prev.findIndex(t => t.id === team.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = team
        return next
      }
      return [...prev, team]
    })
    setSelected(team)
  }

  const handleDeleted = (teamId: string) => {
    setTeams(prev => prev.filter(t => t.id !== teamId))
    setSelected(null)
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Teams list */}
      <div style={{
        width: 240, minWidth: 240,
        display: 'flex', flexDirection: 'column',
        background: '#fff',
        borderRight: '1px solid #e5e5e5',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '12px 14px',
          borderBottom: '1px solid #e5e5e5',
          fontSize: 11, fontWeight: 600, color: '#888',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          Teams
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {teams.length === 0 && (
            <div style={{ padding: 16, color: '#999', fontSize: 12, textAlign: 'center' }}>
              No teams yet
            </div>
          )}
          {teams.map(team => {
            const isSelected = selected?.id === team.id
            return (
              <button
                key={team.id}
                onClick={() => setSelected(team)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 14px',
                  border: 'none',
                  borderBottom: '1px solid #f0f0f0',
                  background: isSelected ? '#eff6ff' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{
                  width: 10, height: 10,
                  borderRadius: '50%',
                  background: team.color,
                  flexShrink: 0,
                }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: isSelected ? '#1d4ed8' : '#111' }}>
                    {team.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#888' }}>
                    {team.agents.length} agent{team.agents.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div style={{
          padding: '8px 14px',
          borderTop: '1px solid #e5e5e5',
          fontSize: 11, color: '#999',
        }}>
          {teams.length} team{teams.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Team builder */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fafafa' }}>
        <TeamBuilder
          agents={agentDefs}
          team={selected}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          onNew={() => setSelected(null)}
        />
      </div>
    </div>
  )
}

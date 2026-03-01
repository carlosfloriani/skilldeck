import { useState, useEffect } from 'react'
import { TabId } from './types'
import Nav from './components/Nav'
import SkillsView from './views/SkillsView'
import AgentsView from './views/AgentsView'
import TeamsView from './views/TeamsView'
import FlowchartView from './views/FlowchartView'
import CommandsView from './views/CommandsView'
import SettingsView from './views/SettingsView'
import HooksView from './views/HooksView'
import ClaudeMdView from './views/ClaudeMdView'

export default function App() {
  const [tab, setTab] = useState<TabId>('skills')
  const [error, setError] = useState(false)

  // Poll backend health to drive the status dot
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/skills')
        setError(!res.ok)
      } catch {
        setError(true)
      }
    }
    check()
    const id = setInterval(check, 3000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: 14,
      color: '#1a1a1a',
      background: '#f5f5f5',
    }}>
      <Nav active={tab} onChange={setTab} error={error} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {tab === 'skills'    && <SkillsView />}
        {tab === 'agents'    && <AgentsView />}
        {tab === 'teams'     && <TeamsView />}
        {tab === 'flow'      && <FlowchartView />}
        {tab === 'commands'  && <CommandsView />}
        {tab === 'settings'  && <SettingsView />}
        {tab === 'hooks'     && <HooksView />}
        {tab === 'claudemd'  && <ClaudeMdView />}
      </div>
    </div>
  )
}

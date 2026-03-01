import { useState, useEffect, useCallback } from 'react'
import { AgentDef, Skill, Team } from '../types'

// ── Layout constants ──────────────────────────────────────────────────────────
const W = 1500
const H = 700

const USER_CX = 750
const USER_CY = 65
const USER_R = 28

const ORCH_CX = 750
const ORCH_CY = 168
const ORCH_W = 230
const ORCH_H = 44

// Skills column (left side)
const SKILL_CX = 120
const SKILL_START_Y = 290
const SKILL_W = 160
const SKILL_H = 26
const SKILL_GAP = 32

// Agent row
const AGENT_W = 170
const AGENT_H = 42
const AGENT_Y = 290

// Tool chips
const TOOL_W = 124
const TOOL_H = 22
const TOOL_GAP = 28
const TOOL_START_Y = 356

// Colors
const COLOR_USER = '#6b7280'
const COLOR_ORCH = '#374151'
const COLOR_AGENT = '#2563eb'
const COLOR_SKILL_INSTALLED = '#d97706'
const COLOR_SKILL_MISSING = '#d97706'
const COLOR_TOOL = '#16a34a'
const COLOR_EDGE = '#d1d5db'
const COLOR_EDGE_ACTIVE = '#6366f1'

// ── Helpers ───────────────────────────────────────────────────────────────────
function agentCenters(count: number): number[] {
  // Distribute agents in the right portion: x from 280 to 1460
  const left = 300
  const right = 1460
  if (count === 0) return []
  if (count === 1) return [(left + right) / 2]
  const step = (right - left) / (count - 1)
  return Array.from({ length: count }, (_, i) => left + i * step)
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface HoveredNode {
  type: 'agent' | 'skill'
  id: string
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function FlowchartView() {
  const [agentDefs, setAgentDefs] = useState<AgentDef[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const [hovered, setHovered] = useState<HoveredNode | null>(null)

  const fetchAll = useCallback(async () => {
    const [ar, sr, tr] = await Promise.all([
      fetch('/api/agents'),
      fetch('/api/skills'),
      fetch('/api/teams'),
    ])
    if (ar.ok) setAgentDefs(await ar.json())
    if (sr.ok) setSkills(await sr.json())
    if (tr.ok) setTeams(await tr.json())
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Filter agents by team
  const team = teams.find(t => t.id === selectedTeam)
  const visibleAgents = selectedTeam === 'all'
    ? agentDefs
    : agentDefs.filter(a => team?.agents.includes(a.id))

  const centers = agentCenters(visibleAgents.length)

  // Skill node Y positions
  const skillY = (i: number) => SKILL_START_Y + i * SKILL_GAP

  // ── Opacity helpers ──────────────────────────────────────────────────────
  function agentOpacity(agentId: string): number {
    if (!hovered) return 1
    if (hovered.type === 'agent') return hovered.id === agentId ? 1 : 0.2
    return 0.35
  }

  function agentEdgeOpacity(agentId: string): number {
    if (!hovered) return 1
    if (hovered.type === 'agent') return hovered.id === agentId ? 1 : 0.1
    return 0.1
  }

  function skillOpacity(skillId: string): number {
    if (!hovered) return 1
    if (hovered.type === 'skill') return hovered.id === skillId ? 1 : 0.25
    return 0.35
  }

  function skillEdgeOpacity(skillId: string): number {
    if (!hovered) return 1
    if (hovered.type === 'skill') return hovered.id === skillId ? 1 : 0.1
    return 0.1
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: '#fafafa' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 16px',
        borderBottom: '1px solid #e5e5e5',
        background: '#fff',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Team
        </span>
        <select
          value={selectedTeam}
          onChange={e => setSelectedTeam(e.target.value)}
          style={{
            padding: '4px 10px',
            border: '1px solid #ddd',
            borderRadius: 6,
            fontSize: 13,
            background: '#fff',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="all">All agents</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        {/* Legend */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 14, alignItems: 'center' }}>
          {[
            { color: COLOR_ORCH, label: 'Orchestrator' },
            { color: COLOR_AGENT, label: 'Agent' },
            { color: COLOR_SKILL_INSTALLED, label: 'Skill' },
            { color: COLOR_TOOL, label: 'Tool' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: '#666' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', height: '100%', minHeight: H }}
          onMouseLeave={() => setHovered(null)}
        >
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={COLOR_EDGE} />
            </marker>
            <marker id="arrow-active" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={COLOR_EDGE_ACTIVE} />
            </marker>
          </defs>

          {/* ── User node ── */}
          <circle
            cx={USER_CX}
            cy={USER_CY}
            r={USER_R}
            fill={COLOR_USER}
            opacity={hovered ? 0.6 : 1}
          />
          <text
            x={USER_CX}
            y={USER_CY + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fff"
            fontSize={11}
            fontWeight={600}
            fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
          >
            You
          </text>

          {/* User → Orchestrator edge */}
          <line
            x1={USER_CX}
            y1={USER_CY + USER_R}
            x2={ORCH_CX}
            y2={ORCH_CY - ORCH_H / 2 - 4}
            stroke={COLOR_EDGE}
            strokeWidth={1.5}
            opacity={hovered ? 0.3 : 1}
          />

          {/* ── Orchestrator node ── */}
          <rect
            x={ORCH_CX - ORCH_W / 2}
            y={ORCH_CY - ORCH_H / 2}
            width={ORCH_W}
            height={ORCH_H}
            rx={8}
            fill={COLOR_ORCH}
            opacity={hovered ? 0.5 : 1}
          />
          <text
            x={ORCH_CX}
            y={ORCH_CY - 6}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fff"
            fontSize={12}
            fontWeight={700}
            fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
          >
            Claude Code
          </text>
          <text
            x={ORCH_CX}
            y={ORCH_CY + 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#9ca3af"
            fontSize={10}
            fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
          >
            Orchestrator
          </text>

          {/* ── Skills branch ── */}

          {/* Orchestrator → Skills hub line */}
          {skills.length > 0 && (
            <path
              d={`M ${ORCH_CX - ORCH_W / 2} ${ORCH_CY}
                  C ${ORCH_CX - ORCH_W / 2 - 60} ${ORCH_CY},
                    ${SKILL_CX + SKILL_W / 2 + 40} ${ORCH_CY - 10},
                    ${SKILL_CX + SKILL_W / 2} ${SKILL_START_Y - 10}`}
              stroke={COLOR_EDGE}
              strokeWidth={1.5}
              fill="none"
              strokeDasharray="5,3"
              opacity={hovered?.type === 'agent' ? 0.08 : 0.5}
            />
          )}

          {/* Skill nodes */}
          {skills.map((skill, i) => {
            const cy = skillY(i) + SKILL_H / 2
            const installed = skill.agents.claudeCode
            const fillColor = installed ? COLOR_SKILL_INSTALLED : '#e5e7eb'
            const textColor = installed ? '#fff' : '#9ca3af'
            const opacity = skillOpacity(skill.id)
            const edgeOpacity = skillEdgeOpacity(skill.id)

            return (
              <g
                key={skill.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered({ type: 'skill', id: skill.id })}
                onMouseLeave={() => setHovered(null)}
                opacity={opacity}
              >
                {/* Edge from hub to skill */}
                <line
                  x1={SKILL_CX + SKILL_W / 2}
                  y1={SKILL_START_Y - 10}
                  x2={SKILL_CX + SKILL_W / 2}
                  y2={cy - SKILL_H / 2}
                  stroke={hovered?.type === 'skill' && hovered.id === skill.id ? COLOR_EDGE_ACTIVE : COLOR_EDGE}
                  strokeWidth={1}
                  opacity={edgeOpacity}
                />

                <rect
                  x={SKILL_CX - SKILL_W / 2}
                  y={skillY(i)}
                  width={SKILL_W}
                  height={SKILL_H}
                  rx={6}
                  fill={fillColor}
                  stroke={installed ? COLOR_SKILL_INSTALLED : '#d1d5db'}
                  strokeWidth={1}
                />
                <text
                  x={SKILL_CX}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={textColor}
                  fontSize={10}
                  fontWeight={500}
                  fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
                >
                  {skill.name.length > 18 ? skill.name.slice(0, 17) + '…' : skill.name}
                </text>
                {!installed && (
                  <text
                    x={SKILL_CX + SKILL_W / 2 - 4}
                    y={cy}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fill="#d1d5db"
                    fontSize={9}
                    fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
                  >
                    ✕
                  </text>
                )}
              </g>
            )
          })}

          {/* ── Agent nodes + tools ── */}
          {visibleAgents.map((agent, i) => {
            const cx = centers[i]
            const ay = AGENT_Y
            const opacity = agentOpacity(agent.id)
            const edgeOp = agentEdgeOpacity(agent.id)
            const isHovered = hovered?.type === 'agent' && hovered.id === agent.id

            return (
              <g key={agent.id}>
                {/* Orchestrator → Agent edge */}
                <line
                  x1={ORCH_CX}
                  y1={ORCH_CY + ORCH_H / 2}
                  x2={cx}
                  y2={ay - AGENT_H / 2 - 4}
                  stroke={isHovered ? COLOR_EDGE_ACTIVE : COLOR_EDGE}
                  strokeWidth={isHovered ? 2 : 1.5}
                  opacity={edgeOp}
                />

                {/* Agent rect */}
                <g
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHovered({ type: 'agent', id: agent.id })}
                  onMouseLeave={() => setHovered(null)}
                  opacity={opacity}
                >
                  <rect
                    x={cx - AGENT_W / 2}
                    y={ay - AGENT_H / 2}
                    width={AGENT_W}
                    height={AGENT_H}
                    rx={8}
                    fill={isHovered ? '#1d4ed8' : COLOR_AGENT}
                    stroke={isHovered ? '#1e40af' : 'none'}
                    strokeWidth={2}
                  />
                  <text
                    x={cx}
                    y={ay - 6}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#fff"
                    fontSize={12}
                    fontWeight={600}
                    fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
                  >
                    {agent.name}
                  </text>
                  <text
                    x={cx}
                    y={ay + 8}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#bfdbfe"
                    fontSize={9}
                    fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
                  >
                    {agent.tools.length} tools
                  </text>
                </g>

                {/* Tool chips */}
                {agent.tools.map((tool, ti) => {
                  const ty = TOOL_START_Y + ti * TOOL_GAP
                  const toolOpacity = isHovered ? 1 : (hovered ? 0.1 : 1)

                  return (
                    <g key={tool} opacity={toolOpacity}>
                      {/* Agent → first tool connector */}
                      {ti === 0 && (
                        <line
                          x1={cx}
                          y1={ay + AGENT_H / 2}
                          x2={cx}
                          y2={ty - 2}
                          stroke={isHovered ? COLOR_EDGE_ACTIVE : COLOR_EDGE}
                          strokeWidth={1}
                          opacity={edgeOp}
                        />
                      )}
                      {/* Vertical connector between tools */}
                      {ti > 0 && (
                        <line
                          x1={cx}
                          y1={ty - TOOL_GAP + TOOL_H}
                          x2={cx}
                          y2={ty - 2}
                          stroke={COLOR_EDGE}
                          strokeWidth={1}
                          opacity={0.5}
                        />
                      )}

                      <rect
                        x={cx - TOOL_W / 2}
                        y={ty}
                        width={TOOL_W}
                        height={TOOL_H}
                        rx={5}
                        fill={COLOR_TOOL}
                        opacity={0.9}
                      />
                      <text
                        x={cx}
                        y={ty + TOOL_H / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#fff"
                        fontSize={10}
                        fontFamily='"SF Mono", "Fira Code", monospace'
                      >
                        {tool}
                      </text>
                    </g>
                  )
                })}
              </g>
            )
          })}

          {/* Empty state */}
          {visibleAgents.length === 0 && (
            <text
              x={W / 2}
              y={H / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#9ca3af"
              fontSize={14}
              fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
            >
              No agents in this team
            </text>
          )}
        </svg>
      </div>
    </div>
  )
}

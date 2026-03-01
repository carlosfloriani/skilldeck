export interface Agents {
  claudeCode: boolean;
  cursor: boolean;
  codex: boolean;
  gemini: boolean;
  amp: boolean;
  cline: boolean;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  license: string;
  path: string;
  agents: Agents;
}

export type AgentId = keyof Agents;

export const AGENT_LABELS: Record<AgentId, string> = {
  claudeCode: 'Claude Code',
  cursor: 'Cursor',
  codex: 'Codex',
  gemini: 'Gemini',
  amp: 'Amp',
  cline: 'Cline',
};

export const AGENT_COLORS: Record<AgentId, string> = {
  claudeCode: '#d97706',
  cursor: '#2563eb',
  codex: '#16a34a',
  gemini: '#7c3aed',
  amp: '#db2777',
  cline: '#0891b2',
};

export interface AgentDef {
  id: string;
  name: string;
  description: string;
  tools: string[];
}

export interface Team {
  id: string;
  name: string;
  agents: string[];
  color: string;
}

export type TabId = 'skills' | 'agents' | 'teams' | 'flow' | 'commands' | 'settings' | 'hooks' | 'claudemd';

export interface CommandArg {
  name: string;
  description: string;
  required: boolean;
}

export interface CommandDef {
  id: string;
  name: string;
  description: string;
  arguments: CommandArg[];
}

export type SettingsFileId = 'main' | 'local';

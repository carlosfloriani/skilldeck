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
  metadata_version: string;
  metadata_author: string;
  allowed_tools: string;
  compatibility: string;
  word_count: number;
  has_examples: boolean;
  mtime: string;
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

export type TabId = 'skills' | 'agents' | 'teams' | 'flow' | 'commands' | 'settings' | 'hooks' | 'claudemd' | 'scheduler';

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

export interface ValidationItem {
  label: string;
  ok: boolean;
  points: number;
  maxPoints: number;
}

export interface SkillValidation {
  score: number;
  items: ValidationItem[];
}

export type SkillTemplate = 'minimal' | 'standard' | 'scripts' | 'pattern';

export interface SchedulerJob {
  id: string;
  name: string;
  cron: string;
  command: string;
  enabled: boolean;
  created_at: string;
  last_run: string | null;
  last_status: 'success' | 'error' | 'running' | null;
  last_output: string | null;
  last_duration_ms: number | null;
}

export interface JobHistoryRecord {
  timestamp: string;
  status: 'success' | 'error';
  duration_ms: number;
  output: string;
}

export interface SearchResult {
  type: 'skill' | 'agent' | 'command';
  id: string;
  name: string;
}

export interface AgentProvider {
  name: string;
  version: string;
  description: string;
  url: string;
}

export interface FileSupport {
  maxSizeBytes: number;
  supportedTypes: string[];
}

export interface AgentCapabilities {
  streaming: boolean;
  multiTurn: boolean;
  maxTurnCount: number;
  fileSupport: FileSupport;
  supportedLanguages?: string[];
  maxResponseTime?: number;
}

export interface SecurityScheme {
  type: string;
  scheme: string;
  bearerFormat: string;
  description?: string;
}

export interface SkillParameter {
  [key: string]: any;
}

export interface AgentSkill {
  name: string;
  description: string;
  parameters: SkillParameter;
}

export interface Endpoints {
  base: string;
  messageSend: string;
  messageStream: string;
  tasksGet: string;
  tasksCancel: string;
}

export interface Metadata {
  vendor: string;
  website: string;
  documentation: string;
  support: string;
}

export interface AgentCard {
  provider: AgentProvider;
  capabilities: AgentCapabilities;
  security: SecurityScheme;
  skills: AgentSkill[];
  endpoints: Endpoints;
  metadata: Metadata;
}

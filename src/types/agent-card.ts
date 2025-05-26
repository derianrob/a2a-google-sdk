export interface AgentProvider {
  organization: string;
  url: string;
}

export interface FileSupport {
  maxSizeBytes?: number;
  supportedTypes?: string[];
}

export interface AgentCapabilities {
  streaming: boolean;
  pushNotifications: boolean;
  stateTransitionHistory: boolean;
}

export interface SecurityScheme {
  type?: string;
  scheme?: string;
  bearerFormat?: string;
  description?: string;
}

export interface SkillParameter {
  [key: string]: any;
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  tags: string[];
}

export interface Endpoints {
  base?: string;
  messageSend?: string;
  messageStream?: string;
  tasksGet?: string;
  tasksCancel?: string;
}

export interface Metadata {
  vendor?: string;
  website?: string;
  documentation?: string;
  support?: string;
}

export interface AgentCard {
  name: string;
  description: string;
  url: string;
  version: string;
  capabilities: AgentCapabilities;
  defaultInputModes: string[];
  defaultOutputModes: string[];
  provider: AgentProvider;
  authentication: null | {
    type: string;
    scheme: string;
    description?: string;
  };
  skills: AgentSkill[];
  endpoints?: Endpoints;
  metadata?: Metadata;
  fileSupport?: FileSupport;
}

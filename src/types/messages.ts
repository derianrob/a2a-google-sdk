export interface MessagePart {
  kind: "text" | "file" | "data";
  text?: string;
  file?: {
    name: string;
    content: Buffer | string;
    mimeType: string;
  };
  data?: Record<string, any>;
}

export interface Message {
  role: "user" | "agent";
  parts: MessagePart[];
  messageId: string;
  contextId: string;
  taskId?: string;
  history?: History[];
  artifacts?: Artifact[];
}

export interface TaskStatus {
  state: "working" | "completed" | "error" | "input-required";
  timestamp: string;
  progress?: {
    percentage: number;
    message: string;
  };
  message?: Message;
}

export interface TaskResponse {
  id: string;
  contextId: string;
  status: TaskStatus;
  artifacts?: Artifact[];
  history?: Message[];
  kind: "task";
}

export interface MessageResponse {
  messageId: string;
  contextId: string;
  parts: MessagePart[];
  kind: "message";
}

export type A2AResponse = TaskResponse | MessageResponse;

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params: Record<string, any>;
}

export interface Artifact {
  artifactId: string;
  name?: string;
  description?: string;
  parts: MessagePart[];
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: A2AResponse;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

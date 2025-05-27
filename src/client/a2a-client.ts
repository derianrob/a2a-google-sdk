import axios, { AxiosInstance } from "axios";
import { AgentCard } from "../types/agent-card";
import {
  Message,
  JsonRpcRequest,
  JsonRpcResponse,
  A2AResponse,
  TaskResponse,
} from "../types/messages";

export interface A2AClientConfig {
  baseUrl: string;
  token?: string;
}

export class A2AClient {
  private readonly axios: AxiosInstance;
  private agentCard?: AgentCard;

  constructor(config: A2AClientConfig) {
    this.axios = axios.create({
      baseURL: config.baseUrl,
      headers: config.token
        ? {
            Authorization: `Bearer ${config.token}`,
          }
        : {},
    });
  }

  private async makeJsonRpcRequest(
    method: string,
    params: Record<string, any>
  ): Promise<JsonRpcResponse> {
    const request: JsonRpcRequest = {
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
    };

    const response = await this.axios.post<JsonRpcResponse>("", request);
    return response.data;
  }

  async getAgentCard(): Promise<AgentCard> {
    if (this.agentCard) {
      return this.agentCard;
    }

    const response = await this.axios.get<AgentCard>("/.well-known/agent.json");
    this.agentCard = response.data;
    return this.agentCard;
  }

  async sendMessage(message: Omit<Message, "role">): Promise<A2AResponse> {
    const response = await this.makeJsonRpcRequest("message/send", {
      message: {
        ...message,
        role: "user",
      },
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.result!;
  }

  async getTaskStatus(taskId: string): Promise<TaskResponse> {
    const response = await this.makeJsonRpcRequest("tasks/get", {
      id: taskId,
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.result as TaskResponse;
  }

  async cancelTask(taskId: string): Promise<void> {
    const response = await this.makeJsonRpcRequest("tasks/cancel", {
      id: taskId,
    });

    if (response.error) {
      throw new Error(response.error.message);
    }
  }
}

import { Request, Response } from "express";
import { AgentCard } from "./agent-card";
import { Message, A2AResponse, TaskResponse } from "./messages";

export interface A2AServerConfig {
  port: number;
  card: AgentCard;
}

export interface A2AHandler {
  (message: Message): Promise<A2AResponse>;
}

export interface Task {
  id: string;
  contextId: string;
  state: "working" | "completed" | "error" | "input_required";
  progress?: {
    percentage: number;
    message: string;
  };
  result?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}

export interface TaskManager {
  createTask(contextId: string): Task;
  getTask(taskId: string): Task | undefined;
  updateTask(taskId: string, update: Partial<Task>): Task;
  deleteTask(taskId: string): boolean;
}

export interface ConversationManager {
  getConversation(contextId: string): Message[];
  addMessage(contextId: string, message: Message): void;
  deleteConversation(contextId: string): boolean;
}

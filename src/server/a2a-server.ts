import express, { Express, Request, Response } from "express";
import cors from "cors";
import {
  A2AServerConfig,
  A2AHandler,
  TaskManager,
  ConversationManager,
  JsonRpcError,
} from "../types/server";
import { InMemoryTaskManager } from "./managers/task-manager";
import { InMemoryConversationManager } from "./managers/conversation-manager";
import { v4 as uuidv4 } from "uuid";

export class A2AServer {
  private app: Express;
  private handler: A2AHandler;
  private config: A2AServerConfig;
  private taskManager: TaskManager;
  private conversationManager: ConversationManager;

  constructor(handler: A2AHandler, config: A2AServerConfig) {
    this.app = express();
    this.handler = handler;
    this.config = config;
    this.taskManager = new InMemoryTaskManager();
    this.conversationManager = new InMemoryConversationManager();

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    this.app.get("/.well-known/agent.json", this.getAgentCard.bind(this));
    this.app.post("/", this.handleJsonRpcRequest.bind(this));
  }

  private getAgentCard(_req: Request, res: Response): void {
    res.json(this.config.card);
  }

  private async handleJsonRpcRequest(
    req: Request,
    res: Response
  ): Promise<void> {
    const { method, params, id } = req.body;

    try {
      switch (method) {
        case "message/send":
          await this.handleMessage(req, res);
          break;
        case "tasks/get":
          await this.handleTaskGet(req, res);
          break;
        case "tasks/cancel":
          await this.handleTaskCancel(req, res);
          break;
        default:
          this.sendJsonRpcError(
            res,
            {
              code: -32601,
              message: "Method not found",
            },
            id
          );
      }
    } catch (error) {
      this.sendJsonRpcError(
        res,
        {
          code: -32000,
          message: error instanceof Error ? error.message : "Internal error",
        },
        id
      );
    }
  }

  private async handleMessage(req: Request, res: Response): Promise<void> {
    const { message } = req.body.params;
    const contextId = message.contextId || uuidv4();

    try {
      const response = await this.handler(message);

      if (response.kind === "task") {
        // Registrar la tarea en el TaskManager
        this.taskManager.createTask(response.contextId);
        this.taskManager.updateTask(response.id, {
          state: response.status.state,
          progress: response.status.progress,
          result: response.artifacts,
        });

        // Procesar la tarea de forma asíncrona si está en estado "working"
        if (response.status.state === "working") {
          this.processTask(response.id, message).catch(console.error);
        }

        res.json({
          jsonrpc: "2.0",
          id: req.body.id,
          result: response,
        });
      } else {
        // Respuesta inmediata
        this.conversationManager.addMessage(contextId, message);
        res.json({
          jsonrpc: "2.0",
          id: req.body.id,
          result: {
            ...response,
            contextId,
          },
        });
      }
    } catch (error) {
      this.sendJsonRpcError(
        res,
        {
          code: -32000,
          message:
            error instanceof Error
              ? error.message
              : "Message processing failed",
        },
        req.body.id
      );
    }
  }

  private async handleTaskGet(req: Request, res: Response): Promise<void> {
    const { id: taskId } = req.body.params;
    const task = this.taskManager.getTask(taskId);

    if (!task) {
      this.sendJsonRpcError(
        res,
        {
          code: -32000,
          message: "Task not found",
        },
        req.body.id
      );
      return;
    }

    res.json({
      jsonrpc: "2.0",
      id: req.body.id,
      result: {
        id: task.id,
        contextId: task.contextId,
        status: {
          state: task.state,
          timestamp: task.updatedAt.toISOString(),
          progress: task.progress,
        },
        kind: "task",
        ...(task.result && { artifacts: task.result }),
      },
    });
  }

  private async handleTaskCancel(req: Request, res: Response): Promise<void> {
    const { id: taskId } = req.body.params;
    const task = this.taskManager.getTask(taskId);

    if (!task) {
      this.sendJsonRpcError(
        res,
        {
          code: -32000,
          message: "Task not found",
        },
        req.body.id
      );
      return;
    }

    this.taskManager.updateTask(taskId, {
      state: "error",
      progress: { percentage: 100, message: "Task cancelled" },
    });

    res.json({
      jsonrpc: "2.0",
      id: req.body.id,
      result: null,
    });
  }

  private async processTask(taskId: string, message: any): Promise<void> {
    try {
      const response = await this.handler(message);
      if (response.kind !== "task") {
        throw new Error("Expected task response from handler");
      }

      this.taskManager.updateTask(taskId, {
        state: response.status.state,
        progress: response.status.progress,
        result: response.artifacts,
      });
    } catch (error) {
      this.taskManager.updateTask(taskId, {
        state: "error",
        progress: {
          percentage: 100,
          message: error instanceof Error ? error.message : "Task failed",
        },
      });
    }
  }

  private sendJsonRpcError(
    res: Response,
    error: JsonRpcError,
    id: string | number
  ): void {
    res.status(error.code === -32601 ? 404 : 500).json({
      jsonrpc: "2.0",
      id,
      error,
    });
  }

  public start(): void {
    this.app.listen(this.config.port, () => {
      console.log(`A2A Server is running on port ${this.config.port}`);
    });
  }
}

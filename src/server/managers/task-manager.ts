import { Task, TaskManager } from "../../types/server";
import { v4 as uuidv4 } from "uuid";

export class InMemoryTaskManager implements TaskManager {
  private tasks: Map<string, Task>;

  constructor() {
    this.tasks = new Map();
  }

  createTask(contextId: string): Task {
    const task: Task = {
      id: uuidv4(),
      contextId,
      state: "working",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tasks.set(task.id, task);
    return task;
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  updateTask(taskId: string, update: Partial<Task>): Task {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const updatedTask: Task = {
      ...task,
      ...update,
      updatedAt: new Date(),
    };

    this.tasks.set(taskId, updatedTask);
    return updatedTask;
  }

  deleteTask(taskId: string): boolean {
    return this.tasks.delete(taskId);
  }
}

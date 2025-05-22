import OpenAI from "openai";

export class OpenAIService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async createAssistant(name: string, instructions: string) {
    return await this.openai.beta.assistants.create({
      name,
      instructions,
      model: "gpt-4o",
    });
  }

  async createThread() {
    return await this.openai.beta.threads.create();
  }

  async addMessageToThread(threadId: string, content: string) {
    return await this.openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: content,
    });
  }

  async runAssistant(threadId: string, assistantId: string) {
    return await this.openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });
  }

  async getRunStatus(threadId: string, runId: string) {
    return await this.openai.beta.threads.runs.retrieve(threadId, runId);
  }

  async cancelRun(threadId: string, runId: string) {
    return await this.openai.beta.threads.runs.cancel(threadId, runId);
  }

  async getThreadMessages(threadId: string) {
    const messages = await this.openai.beta.threads.messages.list(threadId);
    return messages.data;
  }

  async waitForRunCompletion(
    threadId: string,
    runId: string,
    checkInterval = 1000
  ) {
    let runStatus = await this.getRunStatus(threadId, runId);
    while (runStatus.status !== "completed" && runStatus.status !== "failed") {
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
      runStatus = await this.getRunStatus(threadId, runId);
    }
    return runStatus;
  }
}

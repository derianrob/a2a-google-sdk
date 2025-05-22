import {
  A2AServer,
  InMemoryTaskStore,
  TaskHandler,
  TaskState,
} from "../../../index";
import { OpenAIService } from "../../services/openai.service";
import { summarizerConfig } from "./config";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY environment variable is required");
  process.exit(1);
}

async function createSummarizerServer() {
  const openAIService = new OpenAIService(process.env.OPENAI_API_KEY!);

  // Create the OpenAI Assistant
  const assistant = await openAIService.createAssistant(
    summarizerConfig.name,
    summarizerConfig.instructions
  );

  // Define the task handler
  const taskHandler: TaskHandler = async function* (context) {
    const message = context.userMessage;

    if (!message?.parts?.length) {
      yield {
        state: "completed" as TaskState,
        message: {
          role: "agent",
          parts: [{ type: "text", text: "I received an empty message." }],
        },
      };
      return;
    }

    // Extract text from message parts
    const messageText =
      message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join(" ") || "No text provided";

    console.log("\n🎯 Agente Resumidor - Texto Recibido:");
    console.log("--------------------------------");
    console.log(messageText);
    console.log("--------------------------------\n");

    // Create or get thread ID from metadata
    let threadId: string | undefined = context.task.metadata
      ?.threadId as string;
    if (!threadId) {
      const thread = await openAIService.createThread();
      threadId = thread.id;
      context.task.metadata = {
        ...(context.task.metadata || {}),
        threadId: threadId,
      };
    }

    // Show working status
    yield {
      state: "working" as TaskState,
      message: {
        role: "agent",
        parts: [{ type: "text", text: "Resumiendo el texto..." }],
      },
    };

    // Add message to thread
    await openAIService.addMessageToThread(threadId, messageText);

    // Run the assistant
    const run = await openAIService.runAssistant(threadId, assistant.id);

    try {
      // Wait for completion
      const runStatus = await openAIService.waitForRunCompletion(
        threadId,
        run.id
      );

      if (runStatus.status === "failed") {
        yield {
          state: "failed" as TaskState,
          message: {
            role: "agent",
            parts: [{ type: "text", text: "No se pudo procesar el texto." }],
          },
        };
        return;
      }

      // Get response
      const messages = await openAIService.getThreadMessages(threadId);
      const assistantMessage = messages.find((m) => m.role === "assistant");
      const responseText =
        assistantMessage?.content[0]?.type === "text"
          ? assistantMessage.content[0].text.value
          : "No se pudo generar el resumen.";

      console.log("\n🎯 Agente Resumidor - Resumen Generado:");
      console.log("--------------------------------");
      console.log(responseText);
      console.log("--------------------------------\n");

      yield {
        state: "completed" as TaskState,
        message: {
          role: "agent",
          parts: [{ type: "text", text: responseText }],
        },
      };
    } catch (error) {
      if (context.isCancelled()) {
        await openAIService.cancelRun(threadId, run.id);
        yield {
          state: "canceled" as TaskState,
          message: {
            role: "agent",
            parts: [{ type: "text", text: "La tarea fue cancelada." }],
          },
        };
      } else {
        throw error;
      }
    }
  };

  // Create and return the server
  return new A2AServer(taskHandler, {
    taskStore: new InMemoryTaskStore(),
    card: {
      name: summarizerConfig.name,
      description: summarizerConfig.description,
      url: `http://localhost:${summarizerConfig.port}`,
      version: "1.0.0",
      capabilities: {
        streaming: true,
        pushNotifications: false,
      },
      skills: [
        {
          id: "text-summarization",
          name: "Text Summarization",
          description: "Capacidad para resumir textos a sus ideas principales",
        },
      ],
    },
  });
}

createSummarizerServer().then((server) => {
  server.start(summarizerConfig.port);
  console.log(`Summarizer server running on port ${summarizerConfig.port}`);
  console.log("[SummarizerAgent] Server started on http://localhost:3002");
  console.log("Press Ctrl+C to stop the server");
});

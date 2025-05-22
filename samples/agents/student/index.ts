import {
  A2AServer,
  InMemoryTaskStore,
  TaskHandler,
  TaskState,
} from "../../../index";
import { OpenAIService } from "../../services/openai.service";
import { translatorConfig } from "./config";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY environment variable is required");
  process.exit(1);
}

async function createTranslatorServer() {
  const openAIService = new OpenAIService(process.env.OPENAI_API_KEY!);

  // Create the OpenAI Assistant
  const assistant = await openAIService.createAssistant(
    translatorConfig.name,
    translatorConfig.instructions
  );

  // Define the task handler
  const taskHandler: TaskHandler = async function* (context) {
    console.log("Translator task handler called", context);
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
        parts: [{ type: "text", text: "Traduciendo el texto..." }],
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
            parts: [{ type: "text", text: "No se pudo traducir el texto." }],
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
          : "No se pudo generar la traducción.";

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
      name: translatorConfig.name,
      description: translatorConfig.description,
      url: `http://localhost:${translatorConfig.port}`,
      version: "1.0.0",
      capabilities: {
        streaming: true,
        pushNotifications: false,
      },
      skills: [
        {
          id: "translation",
          name: "Translation",
          description: "Capacidad para traducir textos del español al inglés",
        },
      ],
    },
  });
}

export { createTranslatorServer };

// Start the server if this file is run directly
if (require.main === module) {
  createTranslatorServer()
    .then((server) => {
      server.start(translatorConfig.port);
      console.log(`Translator server running on port ${translatorConfig.port}`);
    })
    .catch((error) => {
      console.error("Failed to start Translator server:", error);
      process.exit(1);
    });
}

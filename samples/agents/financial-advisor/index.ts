import {
  A2AServer,
  InMemoryTaskStore,
  TaskHandler,
  TaskState,
} from "../../../index";
import { OpenAIService } from "../../services/openai.service";
import { financialAdvisorConfig } from "./config";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY environment variable is required");
  process.exit(1);
}

async function createFinancialAdvisorServer() {
  const openAIService = new OpenAIService(process.env.OPENAI_API_KEY!);

  // Create the OpenAI Assistant
  const assistant = await openAIService.createAssistant(
    financialAdvisorConfig.name,
    financialAdvisorConfig.instructions
  );

  // Define the task handler
  const taskHandler: TaskHandler = async function* (context) {
    const message = context.task.status.message;

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
    if (!context.task.metadata?.threadId) {
      const thread = await openAIService.createThread();
      context.task.metadata = {
        ...(context.task.metadata || {}),
        threadId: thread.id,
      };
    }

    // Show working status
    yield {
      state: "working" as TaskState,
      message: {
        role: "agent",
        parts: [{ type: "text", text: "Thinking..." }],
      },
    };

    const threadId = context.task.metadata.threadId as string;

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
            parts: [{ type: "text", text: "Failed to process your request." }],
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
          : "No response available.";

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
            parts: [{ type: "text", text: "The task was cancelled." }],
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
      name: financialAdvisorConfig.name,
      description: financialAdvisorConfig.description,
      url: `http://localhost:${financialAdvisorConfig.port}`,
      version: "1.0.0",
      capabilities: {
        streaming: true,
        pushNotifications: false,
      },
      skills: [
        {
          id: "financial-advice",
          name: "Financial Advice",
          description: "Provides professional financial guidance and planning",
        },
      ],
    },
  });
}

export { createFinancialAdvisorServer };

// Start the server
if (require.main === module) {
  createFinancialAdvisorServer()
    .then((server) => {
      console.log(
        `Financial Advisor server running on port ${financialAdvisorConfig.port}`
      );
    })
    .catch((error) => {
      console.error("Failed to start Financial Advisor server:", error);
      process.exit(1);
    });
}

import {
  A2AServer,
  InMemoryTaskStore,
  TaskHandler,
  TaskState,
  A2AClient,
  TextPart,
} from "../../../index";
import { OpenAIService } from "../../services/openai.service";
import { reformulatorConfig } from "./config";
import * as dotenv from "dotenv";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY environment variable is required");
  process.exit(1);
}

// Create A2A clients for both agents
const summarizerClient = new A2AClient("http://localhost:3001");
const translatorClient = new A2AClient("http://localhost:3002");

async function createReformulatorServer() {
  const openAIService = new OpenAIService(process.env.OPENAI_API_KEY!);

  // Create the OpenAI Assistant
  const assistant = await openAIService.createAssistant(
    reformulatorConfig.name,
    reformulatorConfig.instructions
  );

  // Define the task handler
  const taskHandler: TaskHandler = async function* (context) {
    console.log("Reformulator task handler called", context);
    const message = context.userMessage;

    if (!message?.parts?.length) {
      yield {
        state: "completed" as TaskState,
        message: {
          role: "agent",
          parts: [{ type: "text", text: "Recibí un mensaje vacío." }],
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

    try {
      // Step 1: Get summary from Summarizer
      yield {
        state: "working" as TaskState,
        message: {
          role: "agent",
          parts: [{ type: "text", text: "Paso 1: Obteniendo resumen..." }],
        },
      };

      const summaryResponse = await summarizerClient.sendTask({
        id: uuidv4(),
        message: {
          role: "user",
          parts: [{ type: "text", text: messageText } as TextPart],
        },
      });

      const summaryPart = summaryResponse?.status.message
        ?.parts?.[0] as TextPart;
      const summaryText = summaryPart?.text || "No se pudo obtener el resumen.";

      // Step 2: Get translation from Translator
      yield {
        state: "working" as TaskState,
        message: {
          role: "agent",
          parts: [{ type: "text", text: "Paso 2: Traduciendo resumen..." }],
        },
      };

      const translationResponse = await translatorClient.sendTask({
        id: uuidv4(),
        message: {
          role: "user",
          parts: [{ type: "text", text: summaryText } as TextPart],
        },
      });

      const translationPart = translationResponse?.status.message
        ?.parts?.[0] as TextPart;
      const translationText =
        translationPart?.text || "No se pudo obtener la traducción.";

      // Step 3: Reformulate with friendly tone
      yield {
        state: "working" as TaskState,
        message: {
          role: "agent",
          parts: [
            { type: "text", text: "Paso 3: Reformulando con tono amigable..." },
          ],
        },
      };

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

      // Add message to thread for reformulation
      await openAIService.addMessageToThread(threadId, summaryText);

      // Run the assistant for reformulation
      const run = await openAIService.runAssistant(threadId, assistant.id);

      const runStatus = await openAIService.waitForRunCompletion(
        threadId,
        run.id
      );

      if (runStatus.status === "failed") {
        yield {
          state: "failed" as TaskState,
          message: {
            role: "agent",
            parts: [{ type: "text", text: "No se pudo reformular el texto." }],
          },
        };
        return;
      }

      // Get reformulated response
      const messages = await openAIService.getThreadMessages(threadId);
      const assistantMessage = messages.find((m) => m.role === "assistant");
      const reformulatedText =
        assistantMessage?.content[0]?.type === "text"
          ? assistantMessage.content[0].text.value
          : "No se pudo reformular el texto.";

      // Return final combined response
      yield {
        state: "completed" as TaskState,
        message: {
          role: "agent",
          parts: [
            {
              type: "text",
              text: `🎯 Resumen Original:\n${summaryText}\n\n🌍 English Translation:\n${translationText}\n\n😊 Versión Amigable:\n${reformulatedText}`,
            } as TextPart,
          ],
        },
      };
    } catch (error) {
      yield {
        state: "failed" as TaskState,
        message: {
          role: "agent",
          parts: [
            {
              type: "text",
              text: `Error en el procesamiento: ${error.message}`,
            } as TextPart,
          ],
        },
      };
    }
  };

  // Create and return the server
  return new A2AServer(taskHandler, {
    taskStore: new InMemoryTaskStore(),
    card: {
      name: reformulatorConfig.name,
      description: reformulatorConfig.description,
      url: `http://localhost:${reformulatorConfig.port}`,
      version: "1.0.0",
      capabilities: {
        streaming: true,
        pushNotifications: false,
      },
      skills: [
        {
          id: "text-reformulation",
          name: "Text Reformulation",
          description:
            "Capacidad para reformular textos con un tono más amigable",
        },
      ],
    },
  });
}

export { createReformulatorServer };

// Start the server if this file is run directly
if (require.main === module) {
  createReformulatorServer()
    .then((server) => {
      server.start(reformulatorConfig.port);
      console.log(
        `Reformulator server running on port ${reformulatorConfig.port}`
      );
    })
    .catch((error) => {
      console.error("Failed to start Reformulator server:", error);
      process.exit(1);
    });
}

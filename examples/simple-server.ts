import { A2AServer } from "../src/server/a2a-server";
import { Message, A2AResponse } from "../src/types/messages";
import { AgentCard } from "../src/types/agent-card";

// Ejemplo de Agent Card
const agentCard: AgentCard = {
  provider: {
    name: "SimpleBot",
    version: "1.0.0",
    description: "A simple A2A bot example",
    url: "http://localhost:3000",
  },
  capabilities: {
    streaming: false,
    multiTurn: true,
    maxTurnCount: 10,
    fileSupport: {
      maxSizeBytes: 1024 * 1024, // 1MB
      supportedTypes: ["text/plain"],
    },
  },
  security: {
    type: "none",
    scheme: "none",
    bearerFormat: "none",
  },
  skills: [
    {
      name: "chat",
      description: "Simple chat capabilities",
      parameters: {
        maxLength: 1000,
      },
    },
  ],
  endpoints: {
    base: "http://localhost:3000",
    messageSend: "/",
    messageStream: "/stream",
    tasksGet: "/",
    tasksCancel: "/",
  },
  metadata: {
    vendor: "Example Corp",
    website: "https://example.com",
    documentation: "https://example.com/docs",
    support: "support@example.com",
  },
};

// Handler simple que procesa mensajes
async function messageHandler(message: Message): Promise<A2AResponse> {
  const text = message.parts[0].text || "";

  // Si el mensaje es largo, simular una tarea
  if (text.length > 50) {
    return {
      id: "task-123",
      contextId: "ctx-456",
      status: {
        state: "working",
        timestamp: new Date().toISOString(),
      },
      kind: "task",
    };
  }

  // Respuesta inmediata para mensajes cortos
  return {
    messageId: "msg-789",
    contextId: "ctx-456",
    parts: [
      {
        type: "text",
        text: `Echo: ${text}`,
      },
    ],
    kind: "message",
  };
}

// Crear y iniciar el servidor
const server = new A2AServer(messageHandler, {
  port: 3000,
  card: agentCard,
});

server.start();

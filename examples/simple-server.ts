import { A2AServer } from "../src/server/a2a-server";
import { Message, A2AResponse } from "../src/types/messages";
import { AgentCard } from "../src/types/agent-card";

// Ejemplo de Agent Card
const agentCard: AgentCard = {
  name: "SimpleBot",
  description: "A simple A2A bot example",
  url: "http://localhost:3000",
  version: "1.0.0",
  capabilities: {
    streaming: false,
    pushNotifications: false,
    stateTransitionHistory: true,
  },
  defaultInputModes: ["text"],
  defaultOutputModes: ["text"],
  provider: {
    organization: "Example Corp",
    url: "https://example.com",
  },
  authentication: null,
  skills: [
    {
      id: "chat",
      name: "Simple Chat",
      description: "Simple chat capabilities",
      tags: ["chat", "text"],
    },
  ],
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

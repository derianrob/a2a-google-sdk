import { A2AClient } from "../src";

async function main() {
  // Crear instancia del cliente
  const client = new A2AClient({
    baseUrl: "https://your-a2a-agent.com",
    token: "your-token",
  });

  try {
    // Obtener información del agente
    const agentCard = await client.getAgentCard();
    console.log("Agent Capabilities:", agentCard.capabilities);

    // Enviar un mensaje
    const response = await client.sendMessage({
      parts: [
        {
          kind: "text",
          text: "Tell me a joke",
        },
      ],
      messageId: "derian-test",
      contextId: "derian-test",
    });

    // Manejar la respuesta según su tipo
    if (response.kind === "message") {
      // Respuesta inmediata
      console.log("Received message:", response.parts[0].text);
    } else {
      // Es una tarea larga, el cliente decide cómo hacer el polling
      console.log("Task created with ID:", response.id);
      console.log("Initial status:", response.status.state);

      // Ejemplo de polling manual
      let taskResponse = response;
      while (taskResponse.status.state === "working") {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // esperar 1 segundo
        taskResponse = await client.getTaskStatus(response.id);

        if (taskResponse.status.progress) {
          console.log(
            "Progress:",
            `${taskResponse.status.progress.percentage}%`
          );
        }
      }

      if (taskResponse.status.state === "completed" && taskResponse.artifacts) {
        console.log("Task completed:", taskResponse.artifacts[0].parts[0].text);
      } else if (taskResponse.status.state === "error") {
        console.log("Task failed:", taskResponse.status);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();

# A2A-SDK (Agent-to-Agent SDK)

Este SDK reúne e implementa todas las funcionalidades clave presentadas por Google en su reciente lanzamiento de capacidades Agent-to-Agent (A2A). Proporciona las herramientas necesarias para crear y consumir agentes que implementan el protocolo A2A de Google.

## Características

- Implementación completa del protocolo A2A de Google
- Soporte para comunicación entre agentes siguiendo el estándar JSON-RPC 2.0
- Componentes de cliente y servidor
- Manejo de tareas y mensajes
- Soporte para streaming de respuestas
- Notificaciones push
- Autenticación y seguridad

## Estructura del Proyecto

```
A2A-SDK/
├── client/             # Implementación del cliente A2A
├── server/             # Implementación del servidor A2A
├── schema.ts           # Definición del esquema y tipos de A2A
├── index.ts            # Punto de entrada y exportaciones
└── tsconfig.json       # Configuración de TypeScript
```

## Instalación

```bash
npm install a2a-cdk
```

## Uso Básico

### Creación de un servidor A2A

```typescript
import { A2AServer, InMemoryTaskStore } from "a2a-sdk";

// Crear un servidor A2A
const server = new A2AServer({
  name: "Mi Agente",
  description: "Un agente de ejemplo",
  url: "http://localhost:3000",
  version: "1.0.0",
  capabilities: {
    streaming: true,
    pushNotifications: true,
  },
  skills: [
    {
      id: "chat",
      name: "Chat",
      description: "Capacidad de chat general",
    },
  ],
  taskStore: new InMemoryTaskStore(),
  taskHandler: async (context) => {
    // Implementación del manejador de tareas
    const message = context.task.status.message;

    // Procesar el mensaje y generar una respuesta
    const response = `Has enviado: ${message.parts[0].text}`;

    // Devolver la respuesta
    return {
      state: "completed",
      message: {
        role: "agent",
        parts: [
          {
            type: "text",
            text: response,
          },
        ],
      },
    };
  },
});

// Iniciar el servidor
server.listen(3000, () => {
  console.log("Servidor A2A iniciado en el puerto 3000");
});
```

### Uso del cliente A2A

```typescript
import { A2AClient } from "a2a-sdk";

// Crear un cliente A2A
const client = new A2AClient({
  agentUrl: "http://localhost:3000",
});

// Enviar un mensaje a un agente
async function enviarMensaje() {
  const respuesta = await client.sendTask({
    id: "tarea-1",
    message: {
      role: "user",
      parts: [
        {
          type: "text",
          text: "Hola, ¿cómo estás?",
        },
      ],
    },
  });

  console.log("Respuesta:", respuesta);
}

enviarMensaje();
```

## Componentes Principales

### A2AServer

Implementa un servidor que sigue el protocolo A2A, manejando solicitudes JSON-RPC y gestionando tareas.

### A2AClient

Proporciona métodos para comunicarse con servidores A2A, enviando solicitudes y procesando respuestas.

### TaskStore

Almacena y gestiona el estado de las tareas en proceso. La biblioteca incluye implementaciones en memoria y basadas en archivos.

## Desarrollo

Para configurar el proyecto para desarrollo:

1. Clonar el repositorio
2. Instalar dependencias: `npm install`
3. Compilar el proyecto: `npm run build`

## Licencia

ISC

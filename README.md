# A2A SDK for JavaScript/TypeScript

Este SDK proporciona una implementación del protocolo Agent-to-Agent (A2A) de Google en JavaScript/TypeScript. Permite crear agentes que pueden comunicarse entre sí siguiendo el estándar A2A.

## Cumplimiento del Patrón A2A

El SDK implementa todos los requisitos fundamentales del protocolo A2A:

### 1. Descubrimiento de Agentes ✅

```typescript
// Endpoint de descubrimiento estándar
GET /.well-known/agent.json

// Ejemplo de Agent Card
{
  "name": "Mi Agente",
  "description": "Descripción del agente",
  "url": "http://localhost:3000",
  "version": "1.0.0",
  "capabilities": {
    "streaming": true
  }
}
```

### 2. Métodos RPC Requeridos ✅

- `message/send`: Envío de mensajes entre agentes
- `tasks/get`: Consulta del estado de tareas
- `tasks/cancel`: Cancelación de tareas en curso

### 3. Tipos de Respuesta ✅

```typescript
// Respuesta Inmediata
{
  kind: "message",
  role: "agent",
  parts: [{ kind: "text", text: "Respuesta inmediata" }]
}

// Respuesta Basada en Tareas
{
  kind: "task",
  id: "task-id",
  status: {
    state: "working" | "completed" | "error",
    progress: { percentage: number, message: string }
  }
}
```

### 4. Gestión de Tareas ✅

- Creación y seguimiento de tareas
- Actualización de estado
- Consulta de progreso

### 5. Formato de Mensajes ✅

```typescript
{
  role: "user" | "agent",
  parts: [
    {
      kind: "text",
      text: string
    }
  ]
}
```

### 6. Manejo de Errores JSON-RPC ✅

```typescript
{
  jsonrpc: "2.0",
  id: string,
  error: {
    code: number,
    message: string
  }
}
```

## Instalación

```bash
npm install a2a-sdk-google
```

## Uso Básico

### Crear un Servidor A2A

```typescript
import { A2AServer, A2AServerConfig } from "a2a-sdk-google";

const config: A2AServerConfig = {
  card: {
    name: "Mi Agente",
    description: "Un agente simple",
    url: "http://localhost:3000",
    version: "1.0.0",
  },
  port: 3000,
};

const handler = async (message) => {
  return {
    kind: "message",
    role: "agent",
    parts: [{ kind: "text", text: "¡Hola!" }],
  };
};

const server = new A2AServer(handler, config);
server.start();
```

### Crear un Cliente A2A

```typescript
import { A2AClient } from "a2a-sdk-google";

const client = new A2AClient("http://localhost:3000");

// Enviar mensaje
const response = await client.sendMessage({
  role: "user",
  parts: [{ kind: "text", text: "Hola" }],
});

// Consultar estado de tarea
const taskStatus = await client.getTaskStatus("task-id");
```

## Características

- ✅ Implementación completa del protocolo A2A
- ✅ Soporte para TypeScript
- ✅ Manejo de tareas asíncronas
- ✅ Gestión de errores JSON-RPC
- ✅ Comunicación bidireccional entre agentes

## Documentación

Para más detalles sobre la implementación y uso del SDK, consulta la [documentación del servidor](src/server/README.md).

## Contribuir

Las contribuciones son bienvenidas. Por favor, asegúrate de actualizar las pruebas según corresponda.

## Licencia

[MIT](LICENSE)

# A2A Protocol Documentation

## Table of Contents

- [Agent Card](#agent-card)
- [Types](#types)
  - [Task](#task)
  - [Message](#message)
- [Important Methods](#important-methods)
- [Message vs Task](#message-vs-task)
- [Flow Examples](#flow-examples)

## Agent Card

El Agent Card es un documento JSON que describe la identidad y capacidades de un servidor A2A. Contiene los siguientes tipos principales:

### AgentProvider

```json
{
  "name": "MyAssistant",
  "version": "1.0.0",
  "description": "A helpful AI assistant",
  "url": "https://api.myassistant.com/a2a"
}
```

### AgentCapabilities

```json
{
  "streaming": true,
  "multiTurn": true,
  "maxTurnCount": 10,
  "fileSupport": {
    "maxSizeBytes": 10485760,
    "supportedTypes": ["image/png", "image/jpeg"]
  }
}
```

### SecurityScheme

```json
{
  "type": "http",
  "scheme": "bearer",
  "bearerFormat": "JWT"
}
```

### AgentSkill

```json
{
  "name": "imageAnalysis",
  "description": "Can analyze and describe images",
  "parameters": {
    "supportedFormats": ["png", "jpg"],
    "maxResolution": "4096x4096"
  }
}
```

## Types

### Task

Un Task representa una unidad de trabajo y tiene la siguiente estructura:

```json
{
  "id": "task-123",
  "contextId": "ctx-456",
  "status": {
    "state": "working",
    "timestamp": "2024-03-20T10:00:00Z",
    "progress": {
      "percentage": 45,
      "message": "Processing..."
    }
  },
  "artifacts": [
    {
      "artifactId": "art-001",
      "parts": [
        {
          "type": "text",
          "text": "Result content..."
        }
      ]
    }
  ],
  "kind": "task"
}
```

### Message

Un Message representa una comunicación directa:

```json
{
  "messageId": "msg-123",
  "contextId": "ctx-456",
  "parts": [
    {
      "type": "text",
      "text": "Hello, how can I help?"
    }
  ],
  "kind": "message"
}
```

## Important Methods

### message/send

Método principal para enviar mensajes al agente.

**Request:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "message/send",
  "params": {
    "message": {
      "role": "user",
      "parts": [
        {
          "type": "text",
          "text": "Hello!"
        }
      ],
      "messageId": ""
    }
  }
}
```

### tasks/get

Método para consultar el estado de una tarea.

**Request:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tasks/get",
  "params": {
    "id": "task-123"
  }
}
```

### tasks/cancel

Método para cancelar una tarea en curso.

**Request:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tasks/cancel",
  "params": {
    "id": "task-123"
  }
}
```

## Message vs Task

### Diferencias Clave

1. **Kind: "message"**

- Respuesta inmediata
- No tiene campo status
- No requiere polling
- Contiene directamente los parts con la respuesta

2. **Kind: "task"**

- Para operaciones largas
- Tiene campo status
- Requiere polling con tasks/get
- Puede mostrar progreso

### Estados de Tarea

- `working`: Tarea en proceso
- `completed`: Tarea finalizada
- `error`: Error en el procesamiento
- `input_required`: Necesita más información

## Flow Examples

### Flujo 1: Respuesta Rápida (sin polling)

```json
// Cliente envía
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "message/send",
  "params": {
    "message": {
      "role": "user",
      "parts": [
        {
          "type": "text",
          "text": "tell me a joke"
        }
      ],
      "messageId": ""
    }
  }
}

// Servidor responde inmediatamente
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "messageId": "msg-456",
    "contextId": "ctx-789",
    "parts": [
      {
        "type": "text",
        "text": "Why did the chicken cross the road? To get to the other side!"
      }
    ],
    "kind": "message"
  }
}
```

### Flujo 2: Tarea Larga (con polling)

```json
// Cliente envía
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "message/send",
  "params": {
    "message": {
      "role": "user",
      "parts": [
        {
          "type": "text",
          "text": "analiza este documento largo"
        }
      ],
      "messageId": ""
    }
  }
}

// Servidor responde (inicio de tarea)
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "id": "task-123",
    "contextId": "ctx-789",
    "status": {
      "state": "working",
      "timestamp": "2024-03-20T10:00:00Z"
    },
    "kind": "task"
  }
}

// Cliente hace polling
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tasks/get",
  "params": {
    "id": "task-123"
  }
}

// Servidor responde al polling (completado)
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "id": "task-123",
    "contextId": "ctx-789",
    "status": {
      "state": "completed",
      "timestamp": "2024-03-20T10:01:00Z"
    },
    "artifacts": [
      {
        "artifactId": "art-001",
        "parts": [
          {
            "type": "text",
            "text": "Análisis completo del documento..."
          }
        ]
      }
    ],
    "kind": "task"
  }
}
```

### Cuándo usar Polling

1. **NO usar polling cuando:**

- La respuesta tiene `kind: "message"`
- No hay campo `status` en la respuesta
- Los `parts` están disponibles inmediatamente

2. **SÍ usar polling cuando:**

- La respuesta tiene `kind: "task"`
- Hay campo `status` con `state: "working"`
- No hay `parts` o `artifacts` en la respuesta inicial

### Seguimiento de Tarea

El seguimiento de tareas se puede hacer de dos formas:

1. Con `messageId` para respuestas tipo message
2. Con `taskId` para respuestas tipo task

El servidor mantiene internamente el mapeo entre ambos tipos de IDs, por lo que `tasks/get` funciona con cualquiera de los dos.

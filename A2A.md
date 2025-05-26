# A2A Protocol Documentation

## Table of Contents

- [Agent Card](#agent-card)
  - [Campos Obligatorios](#campos-obligatorios)
  - [Campos Opcionales](#campos-opcionales)
- [Types](#types)
  - [Task](#task)
  - [Message](#message)
- [Important Methods](#important-methods)
- [Message vs Task](#message-vs-task)
- [Flow Examples](#flow-examples)

## Agent Card

El Agent Card es un documento JSON que describe la identidad y capacidades de un servidor A2A.

### Campos Obligatorios

```typescript
{
  // Información básica del agente
  name: string;
  description: string;
  url: string;
  version: string;

  // Capacidades del agente
  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
    stateTransitionHistory: boolean;
  };

  // Modos de entrada/salida
  defaultInputModes: string[];
  defaultOutputModes: string[];

  // Información del proveedor
  provider: {
    organization: string;
    url: string;
  };

  // Autenticación (puede ser null)
  authentication: null | {
    type: string;
    scheme: string;
    description?: string;
  };

  // Habilidades del agente
  skills: Array<{
    id: string;
    name: string;
    description: string;
    tags: string[];
  }>;
}
```

### Campos Opcionales

```typescript
{
  // Soporte para archivos
  fileSupport?: {
    maxSizeBytes?: number;
    supportedTypes?: string[];
  };

  // Endpoints del agente
  endpoints?: {
    base?: string;
    messageSend?: string;
    messageStream?: string;
    tasksGet?: string;
    tasksCancel?: string;
  };

  // Metadatos adicionales
  metadata?: {
    vendor?: string;
    website?: string;
    documentation?: string;
    support?: string;
  };
}
```

### Ejemplo Completo de Agent Card

```typescript
{
  "name": "Agente Traductor",
  "description": "Agente especializado en traducir textos al inglés",
  "url": "http://localhost:1201",
  "version": "1.0.0",
  "capabilities": {
    "streaming": false,
    "pushNotifications": false,
    "stateTransitionHistory": true
  },
  "defaultInputModes": ["text"],
  "defaultOutputModes": ["text"],
  "provider": {
    "organization": "A2A Samples",
    "url": "https://github.com/yourusername/your-agent"
  },
  "authentication": null,
  "skills": [
    {
      "id": "translation",
      "name": "Translation",
      "description": "Capacidad para traducir textos del español al inglés",
      "tags": ["translation", "spanish", "english"]
    }
  ]
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

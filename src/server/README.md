# Documentación de Flujos del Servidor A2A

Este documento explica los dos flujos principales en el Servidor A2A: Respuesta Inmediata (kind: "message") y Respuesta Basada en Tareas (kind: "task").

## Flujo de Respuesta Inmediata (kind: "message")

```mermaid
sequenceDiagram
    participant C as Cliente
    participant S as ServidorA2A
    participant H as Manejador
    participant CM as GestorConversación

    C->>S: POST / {method: "message/send", params: {message}}
    Note over S: handleMessage(req, res)
    S->>H: handler(message)
    Note over H: Retorna {kind: "message", ...}
    S->>CM: addMessage(contextId, message)
    S-->>C: Respuesta {jsonrpc: "2.0", result: {..., contextId}}
```

### Pasos del Flujo:

1. **Solicitud Inicial**

   - Endpoint: POST /
   - Función: `handleMessage(req: Request, res: Response)`
   - Parámetros:
     ```typescript
     {
       method: "message/send",
       params: { message: {...} }
     }
     ```

2. **Procesamiento del Manejador**

   - Función: `handler(message)`
   - Retorna respuesta inmediata con:
     ```typescript
     {
       kind: "message",
       // Datos adicionales de respuesta
     }
     ```

3. **Gestión de Conversación**

   - Función: `conversationManager.addMessage(contextId, message)`
   - Almacena el mensaje en el historial de conversación

4. **Respuesta**
   - Retorna respuesta inmediata al cliente con:
     ```typescript
     {
       jsonrpc: "2.0",
       id: requestId,
       result: {
         ...response,
         contextId
       }
     }
     ```

## Flujo de Respuesta Basada en Tareas (kind: "task")

```mermaid
sequenceDiagram
    participant C as Cliente
    participant S as ServidorA2A
    participant H as Manejador
    participant TM as GestorTareas

    C->>S: POST / {method: "message/send", params: {message}}
    Note over S: handleMessage(req, res)
    S->>H: handler(message)
    Note over H: Retorna {kind: "task", ...}
    S->>TM: createTask(contextId)
    S->>TM: updateTask(taskId, status)
    S-->>C: Respuesta con taskId

    Note over S: Procesamiento Asíncrono
    S->>S: processTask(taskId, message)
    S->>H: handler(message)
    S->>TM: updateTask(taskId, newStatus)

    C->>S: POST / {method: "tasks/get", params: {id}}
    Note over S: handleTaskGet(req, res)
    S->>TM: getTask(taskId)
    S-->>C: Respuesta de Estado de Tarea
```

### Pasos del Flujo:

1. **Solicitud Inicial**

   - Igual que el flujo de mensajes
   - Función: `handleMessage(req: Request, res: Response)`

2. **Respuesta Inicial del Manejador**

   - Función: `handler(message)`
   - Retorna respuesta de tarea:
     ```typescript
     {
       kind: "task",
       id: taskId,
       contextId: string,
       status: {
         state: "working" | "completed" | "error",
         progress: { percentage: number, message: string }
       }
     }
     ```

3. **Creación de Tarea**

   - Función: `taskManager.createTask(contextId)`
   - Función: `taskManager.updateTask(taskId, { state, progress, result })`

4. **Respuesta Inicial**

   - Retorna información de la tarea al cliente:
     ```typescript
     {
       jsonrpc: "2.0",
       id: requestId,
       result: taskResponse
     }
     ```

5. **Procesamiento Asíncrono**

   - Función: `processTask(taskId: string, message: any)`
   - Continúa el procesamiento en segundo plano
   - Actualiza el estado de la tarea mediante `taskManager.updateTask()`

6. **Verificación de Estado de Tarea**

   - Endpoint: POST / (method: "tasks/get")
   - Función: `handleTaskGet(req: Request, res: Response)`
   - Parámetros:
     ```typescript
     {
       method: "tasks/get",
       params: { id: taskId }
     }
     ```

7. **Respuesta de Estado de Tarea**
   - Retorna el estado actual de la tarea:
     ```typescript
     {
       jsonrpc: "2.0",
       id: requestId,
       result: {
         id: taskId,
         contextId: string,
         status: {
           state: string,
           timestamp: string,
           progress: { percentage: number, message: string }
         },
         kind: "task",
         artifacts?: any
       }
     }
     ```

## Operaciones Adicionales

### Cancelación de Tarea

- Endpoint: POST / (method: "tasks/cancel")
- Función: `handleTaskCancel(req: Request, res: Response)`
- Actualiza el estado de la tarea a "error" con mensaje de cancelación

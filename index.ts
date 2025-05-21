/**
 * A2A Protocol - Biblioteca oficial para la implementación del protocolo Agent-to-Agent
 *
 * Esta biblioteca proporciona las herramientas necesarias para crear y consumir
 * agentes que implementan el protocolo A2A de Google.
 */

// Importación desde los archivos originales del repositorio de Google
// Servidor
export { A2AServer } from "./server/server";
export { A2AError } from "./server/error";
export type { A2AServerOptions } from "./server/server";
export type {
  TaskHandler,
  TaskContext,
  TaskYieldUpdate,
} from "./server/handler";
export { InMemoryTaskStore, FileStore } from "./server/store";

// Cliente
export { A2AClient } from "./client/client";

// Esquema y tipos
export * from "./schema";

// Este wrapper simula una librería instalada, pero en realidad estamos
// usando directamente los archivos originales del repositorio de Google.

import { AssistantConfig } from "../../types/assistant";

export const translatorConfig: AssistantConfig = {
  name: "Agente Traductor",
  description: "Agente especializado en traducir textos al inglés",
  instructions: `Eres un agente especializado en traducción. Tu tarea es:
1. Recibir un texto en español
2. Traducirlo al inglés manteniendo el significado original
3. Asegurar que la traducción sea natural y fluida
4. Mantener el tono y la intención del mensaje original
5. Adaptar expresiones idiomáticas cuando sea necesario`,
  port: 3002,
};

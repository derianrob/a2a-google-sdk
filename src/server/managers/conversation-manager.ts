import { ConversationManager } from "../../types/server";
import { Message } from "../../types/messages";

export class InMemoryConversationManager implements ConversationManager {
  private conversations: Map<string, Message[]>;

  constructor() {
    this.conversations = new Map();
  }

  getConversation(contextId: string): Message[] {
    return this.conversations.get(contextId) || [];
  }

  addMessage(contextId: string, message: Message): void {
    const conversation = this.getConversation(contextId);
    conversation.push(message);
    this.conversations.set(contextId, conversation);
  }

  deleteConversation(contextId: string): boolean {
    return this.conversations.delete(contextId);
  }
}

// lib/sse-manager.ts
// Server-Sent Events Manager for real-time communication

interface SSEClient {
  controller: ReadableStreamDefaultController;
  encoder: TextEncoder;
  userId: string;
  connectedAt: Date;
}

interface SSEMessage {
  event: string;
  data: any;
}

class SSEManager {
  private clients: Map<string, SSEClient[]> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start heartbeat to clean up dead connections
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000); // Every 30 seconds
  }

  /**
   * Add a new SSE client connection
   */
  addClient(userId: string, controller: ReadableStreamDefaultController): void {
    const client: SSEClient = {
      controller,
      encoder: new TextEncoder(),
      userId,
      connectedAt: new Date()
    };

    if (!this.clients.has(userId)) {
      this.clients.set(userId, []);
    }

    this.clients.get(userId)!.push(client);
    console.log(`[SSE] Client connected: ${userId}. Total clients for user: ${this.clients.get(userId)!.length}`);
  }

  /**
   * Remove a client connection
   */
  removeClient(userId: string, controller: ReadableStreamDefaultController): void {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const index = userClients.findIndex(c => c.controller === controller);
      if (index !== -1) {
        userClients.splice(index, 1);
        console.log(`[SSE] Client disconnected: ${userId}. Remaining clients: ${userClients.length}`);

        if (userClients.length === 0) {
          this.clients.delete(userId);
        }
      }
    }
  }

  /**
   * Send a message to a specific user
   */
  sendToUser(userId: string, event: string, data: any): boolean {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.length === 0) {
      return false;
    }

    const message = this.formatMessage(event, data);
    let sent = false;

    for (const client of userClients) {
      try {
        client.controller.enqueue(client.encoder.encode(message));
        sent = true;
      } catch (error) {
        console.error(`[SSE] Error sending to client: ${userId}`, error);
        // Connection might be dead, remove it
        this.removeClient(userId, client.controller);
      }
    }

    return sent;
  }

  /**
   * Broadcast a message to all connected clients
   */
  broadcast(event: string, data: any): void {
    for (const [userId] of this.clients) {
      this.sendToUser(userId, event, data);
    }
  }

  /**
   * Broadcast to all members of a church/group
   */
  async broadcastToGroup(churchId: string, event: string, data: any, excludeUserIds: string[] = []): Promise<void> {
    // This would need to be called with the actual member IDs
    // For now, we'll implement a simple version
    for (const [userId] of this.clients) {
      if (!excludeUserIds.includes(userId)) {
        this.sendToUser(userId, event, { ...data, churchId });
      }
    }
  }

  /**
   * Send heartbeat to keep connections alive
   */
  private sendHeartbeat(): void {
    const heartbeat = this.formatMessage('heartbeat', { timestamp: Date.now() });

    for (const [userId, userClients] of this.clients) {
      for (const client of userClients) {
        try {
          client.controller.enqueue(client.encoder.encode(heartbeat));
        } catch (error) {
          // Connection is dead, remove it
          this.removeClient(userId, client.controller);
        }
      }
    }
  }

  /**
   * Format message for SSE
   */
  private formatMessage(event: string, data: any): string {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  }

  /**
   * Get the number of connected clients
   */
  getConnectedCount(): number {
    let count = 0;
    for (const clients of this.clients.values()) {
      count += clients.length;
    }
    return count;
  }

  /**
   * Get the number of unique users connected
   */
  getUserCount(): number {
    return this.clients.size;
  }

  /**
   * Check if a user is connected
   */
  isUserConnected(userId: string): boolean {
    const userClients = this.clients.get(userId);
    return userClients !== undefined && userClients.length > 0;
  }
}

// Singleton instance
export const sseManager = new SSEManager();
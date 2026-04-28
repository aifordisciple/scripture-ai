// lib/sse-manager.ts
import { NextRequest } from 'next/server';

interface SSEClient {
  id: string;
  controller: ReadableStreamDefaultController;
  userId: string;
  groups: string[]; // 用户所属群组
}

class SSEManager {
  private clients: Map<string, SSEClient> = new Map();

  addClient(id: string, controller: ReadableStreamDefaultController, userId: string, groups: string[] = []) {
    this.clients.set(id, { id, controller, userId, groups });
  }

  removeClient(id: string) {
    this.clients.delete(id);
  }

  getClientCount() {
    return this.clients.size;
  }

  // [修复] 安全迭代：先收集再删除，避免遍历中 splice 修改数组
  private cleanupClosedClients() {
    const closedIds: string[] = [];
    for (const [id, client] of this.clients) {
      try {
        client.controller.desiredSize; // 检查连接是否仍然活跃
      } catch {
        closedIds.push(id);
      }
    }
    closedIds.forEach(id => this.clients.delete(id));
  }

  // [修复] 只发送给特定用户
  sendToUser(userId: string, data: any) {
    this.cleanupClosedClients();
    const message = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients.values()) {
      if (client.userId === userId) {
        try {
          client.controller.enqueue(new TextEncoder().encode(message));
        } catch {
          this.clients.delete(client.id);
        }
      }
    }
  }

  // [修复] broadcastToGroup: 只广播给群组成员，而非所有用户
  broadcastToGroup(groupId: string, data: any, excludeUserId?: string) {
    this.cleanupClosedClients();
    const message = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients.values()) {
      // 检查用户是否属于该群组
      if (!client.groups.includes(groupId)) continue;
      // 排除发送者
      if (excludeUserId && client.userId === excludeUserId) continue;
      try {
        client.controller.enqueue(new TextEncoder().encode(message));
      } catch {
        this.clients.delete(client.id);
      }
    }
  }

  // 广播给所有在线用户
  broadcast(data: any, excludeUserId?: string) {
    this.cleanupClosedClients();
    const message = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients.values()) {
      if (excludeUserId && client.userId === excludeUserId) continue;
      try {
        client.controller.enqueue(new TextEncoder().encode(message));
      } catch {
        this.clients.delete(client.id);
      }
    }
  }

  // 更新用户的群组列表
  updateUserGroups(userId: string, groups: string[]) {
    for (const client of this.clients.values()) {
      if (client.userId === userId) {
        client.groups = groups;
      }
    }
  }
}

export const sseManager = new SSEManager();

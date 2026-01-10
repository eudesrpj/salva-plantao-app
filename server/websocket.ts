import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  subscribedRooms: Set<number>;
}

const clients: Map<string, ConnectedClient> = new Map();

export function setupWebSocket(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    let userId: string | null = null;

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === "auth" && message.userId) {
          userId = message.userId as string;
          clients.set(userId, { ws, userId, subscribedRooms: new Set() });
          ws.send(JSON.stringify({ type: "connected", userId }));
        }

        if (message.type === "chat_subscribe" && message.roomId && userId) {
          const client = clients.get(userId);
          if (client) {
            client.subscribedRooms.add(Number(message.roomId));
          }
        }

        if (message.type === "chat_unsubscribe" && message.roomId && userId) {
          const client = clients.get(userId);
          if (client) {
            client.subscribedRooms.delete(Number(message.roomId));
          }
        }
      } catch {
        // Ignore parse errors
      }
    });

    ws.on("close", () => {
      if (userId) {
        clients.delete(userId);
      }
    });

    ws.on("error", () => {
      if (userId) {
        clients.delete(userId);
      }
    });
  });

  return wss;
}

export function notifyUser(userId: string, notification: {
  type: string;
  title: string;
  message: string;
  channel?: string;
  senderId?: string;
  senderName?: string;
  data?: any;
}) {
  const client = clients.get(userId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify({
      ...notification,
      timestamp: new Date().toISOString(),
    }));
    return true;
  }
  return false;
}

export function notifyAllAdmins(notification: {
  type: string;
  title: string;
  message: string;
  data?: any;
}, adminUserIds: string[]) {
  let notified = 0;
  for (const adminId of adminUserIds) {
    if (notifyUser(adminId, notification)) {
      notified++;
    }
  }
  return notified;
}

export function broadcastToAll(notification: {
  type: string;
  title: string;
  message: string;
  data?: any;
}) {
  let notified = 0;
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        ...notification,
        timestamp: new Date().toISOString(),
      }));
      notified++;
    }
  });
  return notified;
}

export function getConnectedUsers(): string[] {
  return Array.from(clients.keys());
}

export function broadcastToRoom(roomId: number, chatMessage: {
  type: string;
  roomId: number;
  message: any;
}) {
  let notified = 0;
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN && client.subscribedRooms.has(roomId)) {
      client.ws.send(JSON.stringify({
        ...chatMessage,
        timestamp: new Date().toISOString(),
      }));
      notified++;
    }
  });
  return notified;
}

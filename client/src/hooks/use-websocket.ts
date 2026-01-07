import { useEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

interface Notification {
  type: string;
  title: string;
  message: string;
  channel?: string;
  senderId?: string;
  senderName?: string;
  timestamp?: string;
  data?: any;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
  clearNotifications: () => void;
  markAsRead: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!user?.id) return;
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "auth", userId: user.id }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "connected") {
          setIsConnected(true);
        } else if (data.type === "new_message" || data.type === "new_support_message" || data.type === "notification") {
          setNotifications(prev => [data, ...prev].slice(0, 50));
          setUnreadCount(prev => prev + 1);
        }
      } catch {
        // Ignore parse errors
      }
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      // Attempt to reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    };
    
    ws.onerror = () => {
      ws.close();
    };
    
    wsRef.current = ws;
  }, [user?.id]);

  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return {
    isConnected,
    notifications,
    unreadCount,
    clearNotifications,
    markAsRead,
  };
}

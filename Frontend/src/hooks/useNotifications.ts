import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

interface FeeNotification {
  feeId: number;
  semester: number;
  context: string;
  createdAt: string;
  dueDate: string;
}

export const WS_URL = "http://localhost:8080/ws";

export function useNotifications(
  onFeeNotification: (n: FeeNotification) => void,
  onClubInvite?: (payload: { clubId: number; clubName: string; description: string; leaderName: string }) => void
) {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let active = true;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      // Retry every 5s if disconnected
      reconnectDelay: 5000,
      onConnect: () => {
        if (!active) return;
        client.subscribe("/user/queue/notifications", (frame) => {
          try {
            const notification: FeeNotification = JSON.parse(frame.body);
            onFeeNotification(notification);
          } catch {
            // ignore malformed messages
          }
        });

        client.subscribe("/topic/club-invites", (frame) => {
          try {
            const invite = JSON.parse(frame.body);
            onClubInvite?.(invite);
          } catch {
            // ignore
          }
        });
      },
      onStompError: (frame) => {
        console.warn("STOMP error (fee notifications):", frame.headers?.message);
      },
      onWebSocketError: () => {
        // Will auto-reconnect via reconnectDelay
      },
      onDisconnect: () => {
        // Will auto-reconnect via reconnectDelay
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      active = false;
      client.deactivate();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
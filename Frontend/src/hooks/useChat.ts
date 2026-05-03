import { useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

interface MessageDTO {
  id: string;
  sender: string;
  senderRole: string;
  context: string;
  sentAt: string;
}

export function useChat(onMessage: (msg: MessageDTO) => void) {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const client = new Client({
      // SockJS as transport (fallback support)
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),

      // pass JWT in CONNECT frame headers
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },

      onConnect: () => {
        console.log("WebSocket connected");
        // subscribe to your private queue
        // Spring automatically scopes /user/queue/messages to THIS user
        client.subscribe("/user/queue/messages", (frame) => {
          const msg: MessageDTO = JSON.parse(frame.body);
          onMessage(msg);
        });
      },

      onDisconnect: () => {
        console.log("WebSocket disconnected");
      },

      onStompError: (frame) => {
        console.error("STOMP error", frame);
      },
    });

    client.activate();
    clientRef.current = client;

    // cleanup on unmount
    return () => {
      client.deactivate();
    };
  }, []); // only connect once

  return clientRef;
}
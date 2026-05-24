import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';
// http → ws,  https → wss
const WS_URL = API_BASE.replace(/^http/, 'ws') + '/ws';

/**
 * useWebSocket — connects once on mount via STOMP over native WebSocket.
 *
 * @param {Record<string, (data: any) => void>} topicHandlers
 *   e.g. { '/topic/aqi': (data) => setAqi(data) }
 *
 * @returns {{ connected: boolean }}
 *
 * Handlers are read from a ref so adding new topics doesn't cause reconnect.
 */
const useWebSocket = (topicHandlers) => {
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef(topicHandlers);

  // Keep ref in sync with latest handlers without triggering reconnect
  useEffect(() => {
    handlersRef.current = topicHandlers;
  });

  useEffect(() => {
    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        // Subscribe to every topic provided at connection time
        Object.keys(handlersRef.current).forEach((topic) => {
          client.subscribe(topic, (msg) => {
            try {
              handlersRef.current[topic]?.(JSON.parse(msg.body));
            } catch {
              // ignore malformed frames
            }
          });
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError:  () => setConnected(false),
    });

    client.activate();
    return () => { client.deactivate(); };
  }, []); // mount/unmount only

  return { connected };
};

export default useWebSocket;

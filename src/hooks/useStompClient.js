import { useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';

export const useStompClient = (brokerUrl) => {
  const [client, setClient] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const stompClient = new Client({
      brokerURL: brokerUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      // onConnect is called once the connection is established
      onConnect: () => {
        setConnected(true);
        console.log('STOMP client connected');
      },
      onDisconnect: () => {
        setConnected(false);
        console.log('STOMP client disconnected');
      }
    });
    stompClient.activate();
    setClient(stompClient);
    return () => {
      stompClient.deactivate();
    };
  }, [brokerUrl]);

  return { client, connected };
};

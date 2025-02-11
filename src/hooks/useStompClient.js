import { useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const useStompClient = (endpoint) => {
  const [client, setClient] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Retrieve the JWT token from localStorage
    const token = localStorage.getItem('token');

    const stompClient = new Client({
      webSocketFactory: () => new SockJS(endpoint),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        console.log(str);
      },
      // Add connectHeaders so that the JWT is sent during the CONNECT phase.
      connectHeaders: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      onConnect: () => {
        setConnected(true);
        console.log('STOMP client connected');
      },
      onDisconnect: () => {
        setConnected(false);
        console.log('STOMP client disconnected');
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      }
    });

    stompClient.activate();
    setClient(stompClient);

    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, [endpoint]);

  return { client, connected };
};

import { useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const useStompClient = (endpoint) => {
  const [client, setClient] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');

    const stompClient = new Client({
      webSocketFactory: () => {
        const socket = new SockJS(endpoint);
        // Add headers to the WebSocket connection
        socket.headers = {
          Authorization: token ? `Bearer ${token}` : ''
        };
        return socket;
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        console.log(str);
      },
      connectHeaders: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      onConnect: (frame) => {
        setConnected(true);
        console.log('STOMP client connected');

        // Modify the publish method to always include the authorization header
        const originalPublish = stompClient.publish;
        stompClient.publish = function(parameters) {
          const message = {
            ...parameters,
            headers: {
              ...parameters.headers,
              Authorization: token ? `Bearer ${token}` : ''
            }
          };
          return originalPublish.call(this, message);
        };
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
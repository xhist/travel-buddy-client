// src/hooks/useStompClient.js
import { useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const SOCKET_URL = 'http://localhost:8080/ws'; // Point to the Spring WebSocket endpoint

export const useStompClient = () => {
  const [client, setClient] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');

    const stompClient = new Client({
      webSocketFactory: () => new SockJS(SOCKET_URL),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str) => {
        console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('STOMP client connected');
        setConnected(true);
      },
      onDisconnect: () => {
        console.log('STOMP client disconnected');
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('STOMP protocol error:', frame);
      },
      beforeConnect: () => {
        // Add Authorization header to the WebSocket handshake request
        const socket = stompClient.webSocket;
        if (socket && socket.readyState === WebSocket.CONNECTING) {
          socket._transport.options = {
            ...socket._transport.options,
            headers: {
              Authorization: `Bearer ${token}`
            }
          };
        }
      }
    });

    // Add interceptor for adding Authorization header to all STOMP frames
    const originalPublish = stompClient.publish;
    stompClient.publish = function(parameters) {
      const message = {
        ...parameters,
        headers: {
          ...parameters.headers,
          Authorization: `Bearer ${token}`
        }
      };
      return originalPublish.call(this, message);
    };

    try {
      stompClient.activate();
      setClient(stompClient);
    } catch (error) {
      console.error('Error activating STOMP client:', error);
    }

    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, []);

  return { client, connected };
};
import { useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const useStompClient = (endpoint) => {
  const [client, setClient] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');

    const stompClient = new Client({
      webSocketFactory: () => new SockJS(endpoint),
      connectHeaders: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        console.log(str);
      },
      onConnect: (frame) => {
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

    // Modify the publish method to always include the authorization header
    const originalPublish = stompClient.publish;
    stompClient.publish = function(parameters) {
      const currentToken = localStorage.getItem('token');
      const message = {
        ...parameters,
        headers: {
          ...parameters.headers,
          'Authorization': currentToken ? `Bearer ${currentToken}` : ''
        }
      };
      return originalPublish.call(this, message);
    };

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
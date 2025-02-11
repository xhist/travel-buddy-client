import React, { useState, useEffect, useRef } from 'react';
import { Transition } from '@headlessui/react';
import { useStompClient } from '../../hooks/useStompClient';
import { useAuth } from '../../hooks/useAuth';

const PrivateChat = ({ recipientId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const { client, connected } = useStompClient('http://localhost:8080/ws');
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!client || !connected || !user) return;

    console.log('Subscribing to private messages');
    const subscription = client.subscribe(`/user/queue/private`, (message) => {
      try {
        const receivedMessage = JSON.parse(message.body);
        setMessages(prev => [...prev, receivedMessage]);
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [client, connected, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !client || !connected) return;

    const message = {
      content: input,
      recipientId: recipientId,
      sender: user?.username || 'Anonymous',
      type: 'PRIVATE',
      timestamp: new Date().toISOString()
    };

    client.publish({
      destination: '/app/private.sendMessage',
      body: JSON.stringify(message)
    });
    
    // Add sent message to local state immediately
    setMessages(prev => [...prev, message]);
    setInput('');
  };

  return (
    <div className="pt-20 pb-8 px-4 bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col">
      <h2 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-gray-200">Private Chat</h2>
      <div className="flex-1 bg-white dark:bg-gray-700 rounded-lg shadow overflow-y-auto p-4 mb-4">
        {messages.map((msg, idx) => (
          <Transition
            key={idx}
            appear={true}
            show={true}
            enter="transition-opacity duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
          >
            <div className={`mb-3 ${msg.sender === user?.username ? 'text-right' : ''}`}>
              <div className={`inline-block rounded-lg px-4 py-2 ${
                msg.sender === user?.username 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-600'
              }`}>
                <span className="font-semibold block text-sm">{msg.sender}</span>
                <span className="block">{msg.content}</span>
                <span className="text-xs opacity-75 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </Transition>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          disabled={!connected}
        />
        <button
          onClick={sendMessage}
          disabled={!connected}
          className={`px-4 py-2 rounded-r transition ${
            connected 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default PrivateChat;
import React, { useState, useEffect, useRef } from 'react';
import { Transition } from '@headlessui/react';
import { useStompClient } from '../../hooks/useStompClient';

const GroupChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  // Use our updated hook which returns both client and connected flag
  const { client, connected } = useStompClient('ws://localhost:8080/ws'); 
  const messagesEndRef = useRef(null);

  // Subscribe only when the client is connected
  useEffect(() => {
    if (!client || !connected) return;
    const subscription = client.subscribe('/topic/group', (message) => {
      setMessages((prev) => [...prev, JSON.parse(message.body)]);
    });
    return () => subscription.unsubscribe();
  }, [client, connected]);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (input.trim() && client && connected) {
      client.publish({
        destination: '/group.sendMessage',
        body: JSON.stringify({ content: input, sender: 'You' })
      });
      setInput('');
    }
  };

  return (
    <div className="pt-20 pb-8 px-4 bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col">
      <h2 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-gray-200">Group Chat</h2>
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
            <div className="mb-3">
              <span className="font-semibold text-blue-600">{msg.sender}:</span> {msg.content}
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
        />
        <button onClick={sendMessage} className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700 transition">
          Send
        </button>
      </div>
    </div>
  );
};

export default GroupChat;

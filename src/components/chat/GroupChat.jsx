import React, { useState, useEffect, useRef } from 'react';
import { Transition } from '@headlessui/react';
import { useStompClient } from '../../hooks/useStompClient';
import { useAuth } from '../../hooks/useAuth';

const GroupChat = ({ tripId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const { user } = useAuth();
  const { client, connected } = useStompClient('http://localhost:8080/ws');
  const messagesEndRef = useRef(null);
  const [error, setError] = useState(null);

  // Subscribe to the group chat topic
  useEffect(() => {
    if (!client || !connected) return;

    const subscription = client.subscribe(`/topic/trip/${tripId}`, (message) => {
      try {
        const receivedMessage = JSON.parse(message.body);
        setMessages((prev) => [...prev, receivedMessage]);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    // Load previous messages
    // loadPreviousMessages();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [client, connected, tripId]);

  const loadPreviousMessages = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/chat/trip/${tripId}/messages`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
    }
  };

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !client || !connected) return;

    const message = {
      content: input,
      sender: user?.username || 'Anonymous',
      tripId: tripId,
      timestamp: new Date().toISOString()
    };

    try {
      client.publish({
        destination: `/app/chat.trip.${tripId}`,
        body: JSON.stringify(message)
      });
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  if (error) {
    return (
      <div className="text-red-600 p-4 text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
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
              <div
                className={`inline-block rounded-lg px-4 py-2 ${
                  msg.sender === user?.username
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-600'
                }`}
              >
                <div className="font-semibold text-sm">
                  {msg.sender}
                </div>
                <div>{msg.content}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </Transition>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex mt-auto">
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

export default GroupChat;
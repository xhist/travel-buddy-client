import React, { useState, useEffect, useRef } from 'react';
import { useStompClient } from '../../hooks/useStompClient';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../api/api';
import OnlineUsers from './OnlineUsers';
import { 
  Send, 
  Image, 
  Smile, 
  Plus,
  UserPlus,
  Users,
  FileText,
  Video,
  Link as LinkIcon,
  MoreVertical,
  X,
  MenuIcon,
  Vote
} from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import toast from 'react-hot-toast';
import { PollMessage, CreatePollForm } from '../voting/Voting';

const MessageBubble = ({ message, currentUser, onReaction }) => {
  const [showReactions, setShowReactions] = useState(false);
  const isOwnMessage = message.sender === currentUser?.username;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className="flex items-end gap-2">
        {!isOwnMessage && (
          <img
            src={message.senderProfilePic || '/default-avatar.png'}
            alt={message.sender}
            className="w-8 h-8 rounded-full"
          />
        )}
        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          {!isOwnMessage && (
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2 mb-1">
              {message.sender}
            </span>
          )}
          <div
            className={`relative group max-w-md ${
              isOwnMessage
                ? 'bg-blue-600 text-white rounded-l-lg rounded-tr-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-r-lg rounded-tl-lg'
            } p-3 shadow-sm`}
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
          >
            {message.type === 'IMAGE' ? (
              <img
                src={message.content}
                alt="Shared"
                className="rounded max-w-sm max-h-64 object-contain"
              />
            ) : (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}
            <div className="text-xs mt-1 opacity-75">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>

            {/* Reaction Button */}
            <AnimatePresence>
              {showReactions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`absolute ${
                    isOwnMessage ? 'right-full mr-2' : 'left-full ml-2'
                  } top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full shadow-lg p-1 flex items-center gap-1`}
                >
                  {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onReaction(message.id, emoji)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reactions Display */}
            {message.reactions && message.reactions.length > 0 && (
              <div className="absolute -bottom-6 left-0 bg-white dark:bg-gray-800 rounded-full shadow-md px-2 py-1 flex items-center gap-1">
                {Object.entries(
                  message.reactions.reduce((acc, reaction) => {
                    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([emoji, count]) => (
                  <span key={emoji}>
                    {emoji} {count}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const GroupChat = ({ tripId, isOrganizer }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const { client, connected } = useStompClient('http://localhost:8080/ws');
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [showPollForm, setShowPollForm] = useState(false);
  const [editingPoll, setEditingPoll] = useState(null);
  const [polls, setPolls] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(window.outerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!client || !connected) return;

    const messageSubscription = client.subscribe(`/topic/trip/${tripId}`, handleMessage);
    const pollSubscription = client.subscribe(`/topic/trip/${tripId}/polls`, handlePollUpdate);

    // Fetch existing polls
    fetchPolls();

    return () => {
      messageSubscription.unsubscribe();
      pollSubscription.unsubscribe();
    };
  }, [client, connected, tripId]);

  const fetchPolls = async () => {
    try {
      const response = await API.get(`/trips/${tripId}/polls`);
      setPolls(response.data);
    } catch (err) {
      console.error('Error fetching polls:', err);
    }
  };

  const handleMessage = (message) => {
    try {
      const receivedMessage = JSON.parse(message.body);
      if (receivedMessage.type === 'POLL') {
        setPolls(prev => [...prev, receivedMessage.poll]);
      } else {
        setMessages(prev => [...prev, receivedMessage]);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };

  const handlePollUpdate = (update) => {
    try {
      const pollUpdate = JSON.parse(update.body);
      setPolls(prev => 
        prev.map(poll => 
          poll.id === pollUpdate.id ? pollUpdate : poll
        )
      );
    } catch (error) {
      console.error('Error processing poll update:', error);
    }
  };

  const createPoll = async (pollData) => {
    try {
      const response = await API.post(`/trips/${tripId}/polls`, pollData);
      client.publish({
        destination: `/app/chat.trip.${tripId}`,
        body: JSON.stringify({
          type: 'POLL',
          poll: response.data,
          sender: user.username,
          timestamp: new Date().toISOString()
        })
      });
      setShowPollForm(false);
    } catch (err) {
      console.error('Error creating poll:', err);
      toast.error('Failed to create poll');
    }
  };

  const updatePoll = async (pollData) => {
    try {
      const response = await API.put(`/trips/${tripId}/polls/${editingPoll.id}`, pollData);
      client.publish({
        destination: `/app/chat.trip.${tripId}/polls`,
        body: JSON.stringify(response.data)
      });
      setEditingPoll(null);
    } catch (err) {
      console.error('Error updating poll:', err);
      toast.error('Failed to update poll');
    }
  };

  const votePoll = async (pollId, optionId) => {
    try {
      const response = await API.post(`/trips/${tripId}/polls/${pollId}/vote`, {
        optionId
      });
      client.publish({
        destination: `/app/chat.trip.${tripId}/polls`,
        body: JSON.stringify(response.data)
      });
    } catch (err) {
      console.error('Error voting:', err);
      toast.error('Failed to submit vote');
    }
  };

  const finalizePoll = async (pollId) => {
    try {
      const response = await API.post(`/trips/${tripId}/polls/${pollId}/finalize`);
      client.publish({
        destination: `/app/chat.trip.${tripId}/polls`,
        body: JSON.stringify(response.data)
      });
      toast.success('Poll finalized');
    } catch (err) {
      console.error('Error finalizing poll:', err);
      toast.error('Failed to finalize poll');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (content, type = 'TEXT') => {
    if (!content.trim() || !client || !connected) return;

    try {
      client.publish({
        destination: `/app/chat.trip.${tripId}`,
        body: JSON.stringify({
          content,
          sender: user.username,
          timestamp: new Date().toISOString(),
          type
        })
      });
      setInput('');
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const { url } = await response.json();
      sendMessage(url, file.type.startsWith('image/') ? 'IMAGE' : 'FILE');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      setShowUploadMenu(false);
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      await client.publish({
        destination: `/app/chat.reaction.${tripId}`,
        body: JSON.stringify({
          messageId,
          emoji,
          userId: user.id
        })
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

  return (
    <div className="flex h-full min-h-screen">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Trip Chat
            </h2>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Users className="w-5 h-5" />
              <span>{messages.length} messages</span>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, idx) => (
            <MessageBubble
              key={idx}
              message={message}
              currentUser={user}
              onReaction={handleReaction}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Polls */}
          {polls.map((poll) => (
            <div key={`poll-${poll.id}`} className="flex justify-center my-4">
              <PollMessage
                poll={poll}
                onVote={(optionId) => votePoll(poll.id, optionId)}
                currentUser={user}
                onFinalize={() => finalizePoll(poll.id)}
                isOrganizer={isOrganizer}
                onEdit={(poll) => setEditingPoll(poll)}
              />
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t dark:border-gray-700">
          <div className="relative flex items-center gap-2">
            {/* Upload/Create Menu */}
            <AnimatePresence>
              {showUploadMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 flex items-center gap-2"
                >
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowUploadMenu(false);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Image className="w-5 h-5" />
                    <span>Image</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowPollForm(true);
                      setShowUploadMenu(false);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Vote className="w-5 h-5" />
                    <span>Create Poll</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Poll Creation/Edit Modal */}
            <AnimatePresence>
              {(showPollForm || editingPoll) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-lg w-full"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                        {editingPoll ? 'Edit Poll' : 'Create New Poll'}
                      </h3>
                      <button
                        onClick={() => {
                          setShowPollForm(false);
                          setEditingPoll(null);
                        }}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <CreatePollForm
                      onSubmit={(data) => {
                        if (editingPoll) {
                          updatePoll(data);
                        } else {
                          createPoll(data);
                        }
                      }}
                      onCancel={() => {
                        setShowPollForm(false);
                        setEditingPoll(null);
                      }}
                      initialData={editingPoll}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setShowUploadMenu(!showUploadMenu)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,video/*,application/*"
            />

            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage(input)}
                placeholder="Type a message..."
                className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />

              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-12 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Smile className="w-5 h-5" />
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2">
                  <Picker
                    data={data}
                    onEmojiSelect={(emoji) => {
                      setInput((prev) => prev + emoji.native);
                      setShowEmojiPicker(false);
                    }}
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || uploading}
              className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Online Users Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={isMobile ? { x: '100%' } : false}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            className={`${
              isMobile
                ? 'fixed inset-y-0 right-0 w-80 z-40'
                : 'w-80 hidden md:block'
            } bg-white dark:bg-gray-800 border-l dark:border-gray-700`}
          >
            <OnlineUsers tripId={tripId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroupChat;
import React, { useState, useRef } from 'react';
import { Message, MessageType } from './ChatComponents';
import { PollMessage, CreatePollForm } from '../voting/Voting';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Image, Send, Vote, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// Poll Button Component for Chat
const PollButton = ({ onCreatePoll }) => {
  const [showPollForm, setShowPollForm] = useState(false);

  const handleCreatePoll = async (pollData) => {
    try {
      await onCreatePoll(pollData);
      setShowPollForm(false);
    } catch (error) {
      console.error('Error creating poll:', error);
      toast.error('Failed to create poll');
    }
  };

  return (
    <>
      <button
        onClick={() => setShowPollForm(true)}
        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        title="Create Poll"
      >
        <Vote className="w-5 h-5" />
      </button>

      {/* Poll Creation Modal */}
      <AnimatePresence>
        {showPollForm && (
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
                  Create New Poll
                </h3>
                <button
                  onClick={() => setShowPollForm(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <CreatePollForm
                onSubmit={handleCreatePoll}
                onCancel={() => setShowPollForm(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Extended ChatInput Component with Poll Support
const ChatInputWithPolls = ({ onSend, onFileSelect, onCreatePoll }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSend(message);
    setMessage('');
    setShowEmojiPicker(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t dark:border-gray-700">
      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => onFileSelect(e.target.files[0])}
          className="hidden"
          accept="image/*,application/*"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <Image className="w-5 h-5" />
        </button>
        <PollButton onCreatePoll={onCreatePoll} />
        <div className="relative flex-1">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2">
              <Picker
                data={data}
                onEmojiSelect={(emoji) => {
                  setMessage((prev) => prev + emoji.native);
                  setShowEmojiPicker(false);
                }}
              />
            </div>
          )}
        </div>
        <button
          type="submit"
          className="p-2 text-blue-500 hover:text-blue-600"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
};

// Extended Message Component with Poll Support
const MessageWithPolls = ({ message, currentUser, onReact, onVote, onFinalizePoll, isOrganizer }) => {
  if (message.type === MessageType.POLL) {
    return (
      <div className="flex justify-center my-4">
        <PollMessage
          poll={message.poll}
          onVote={onVote}
          currentUser={currentUser}
          onFinalize={onFinalizePoll}
          isOrganizer={isOrganizer}
        />
      </div>
    );
  }

  return (
    <Message
      message={message}
      currentUser={currentUser}
      onReact={onReact}
    />
  );
};

export { ChatInputWithPolls, MessageWithPolls };
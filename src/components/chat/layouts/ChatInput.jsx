import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Image, 
  File, 
  PlusCircle,
  Vote,
  Smile,
  X 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { CreatePollForm } from '../../voting/Voting';

const ChatInput = ({ onSend, onFileSelect, onCreatePoll }) => {
  const [message, setMessage] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSend(message);
    setMessage('');
    setShowEmojiPicker(false);
  };

  const handleFileChange = (e, isImage) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onFileSelect(file);
    e.target.value = '';
    setShowMenu(false);
  };

  const handlePollSubmit = async (pollData) => {
    try {
      if (typeof onCreatePoll !== 'function') {
        throw new Error('Poll creation not configured');
      }
      
      await onCreatePoll(pollData);
      setShowPollModal(false);
      setShowMenu(false);
    } catch (error) {
      console.error('Error creating poll:', error);
      toast.error(error.message || 'Failed to create poll');
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  return (
    <div className="relative border-t dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
              hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
          </button>

          {/* Hidden file inputs */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileChange(e, false)}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt"
          />
          <input
            type="file"
            ref={imageInputRef}
            onChange={(e) => handleFileChange(e, true)}
            className="hidden"
            accept="image/*"
          />

          {/* Popup Menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg 
                  border dark:border-gray-700 py-2 min-w-[160px] z-50"
              >
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-100 
                    dark:hover:bg-gray-700 transition-colors"
                >
                  <Image className="w-4 h-4" />
                  <span>Upload Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-100 
                    dark:hover:bg-gray-700 transition-colors"
                >
                  <File className="w-4 h-4" />
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPollModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-100 
                    dark:hover:bg-gray-700 transition-colors"
                >
                  <Vote className="w-4 h-4" />
                  <span>Create Poll</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative flex-1">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 
              dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 
              hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Emoji Picker */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute bottom-full right-0 mb-2 z-50"
              >
                <div className="relative">
                  <button
                    onClick={() => setShowEmojiPicker(false)}
                    className="absolute right-2 top-2 p-1 text-gray-500 hover:text-gray-700 
                      bg-white rounded-full z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <Picker
                    data={data}
                    onEmojiSelect={handleEmojiSelect}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          type="submit"
          disabled={!message.trim()}
          className={`p-2 rounded-full transition-colors ${
            message.trim()
              ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* Poll Creation Modal */}
      <AnimatePresence>
        {showPollModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-lg w-full m-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Create Poll</h3>
                <button
                  onClick={() => setShowPollModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <CreatePollForm
                onSubmit={handlePollSubmit}
                onCancel={() => setShowPollModal(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatInput;
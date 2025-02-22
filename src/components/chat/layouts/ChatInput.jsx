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
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const ChatInput = ({ onSend, onFileSelect, onImageSelect, onCreatePoll }) => {
  const [message, setMessage] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSend(message);
    setMessage('');
    setShowEmojiPicker(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onFileSelect(file);
    e.target.value = '';
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onImageSelect(file);
    e.target.value = '';
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
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt"
          />
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleImageChange}
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
                  border dark:border-gray-700 py-2 min-w-[160px]"
              >
                <button
                  type="button"
                  onClick={() => {
                    imageInputRef.current?.click();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-100 
                    dark:hover:bg-gray-700 transition-colors"
                >
                  <Image className="w-4 h-4" />
                  <span>Upload Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-100 
                    dark:hover:bg-gray-700 transition-colors"
                >
                  <File className="w-4 h-4" />
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onCreatePoll();
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
                className="absolute bottom-full right-0 mb-2"
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
                    onEmojiSelect={(emoji) => {
                      setMessage((prev) => prev + emoji.native);
                      setShowEmojiPicker(false);
                    }}
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
    </div>
  );
};

export default ChatInput;